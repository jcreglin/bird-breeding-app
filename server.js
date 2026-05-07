const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');
const db = require('./database');
const speciesSeed = require('./species-seed.json');

const app = express();
const PORT = 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'change-me-in-production';
const TIER_LIMITS = { Free: 10, Hobby: 50, Breeder: 200, Pro: Infinity };

app.use(cors());
app.use(express.json({ limit: '15mb' }));
app.use(express.static(path.join(__dirname, 'public')));

const auth = (req, res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Missing token' });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
};

const userFromToken = db.prepare('SELECT id, email, name, subscription_tier FROM users WHERE id = ?');
const birdCountStmt = db.prepare('SELECT COUNT(*) AS count FROM birds WHERE user_id = ?');

function getTierLimit(tier) {
  return TIER_LIMITS[tier] ?? TIER_LIMITS.Free;
}

function safeUser(user) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    subscription_tier: user.subscription_tier,
    bird_limit: getTierLimit(user.subscription_tier)
  };
}

function getAuthenticatedUser(req) {
  return userFromToken.get(req.user.id);
}

function ensureBirdOwnedByUser(userId, birdId) {
  return db.prepare('SELECT * FROM birds WHERE id = ? AND user_id = ?').get(birdId, userId);
}

function ensureOffspringOwnedByUser(userId, offspringId) {
  return db.prepare('SELECT * FROM offspring WHERE id = ? AND user_id = ?').get(offspringId, userId);
}

function getBirdAncestors(userId, birdId, depth = 4, seen = new Set()) {
  if (!birdId || depth < 0 || seen.has(`${birdId}-${depth}`)) return [];
  seen.add(`${birdId}-${depth}`);
  const bird = db.prepare('SELECT id, name, sire_id, dam_id FROM birds WHERE id = ? AND user_id = ?').get(birdId, userId);
  if (!bird) return [];
  return [
    { id: bird.id, name: bird.name, depth },
    ...getBirdAncestors(userId, bird.sire_id, depth - 1, seen),
    ...getBirdAncestors(userId, bird.dam_id, depth - 1, seen)
  ];
}

function calculateCoiForBird(userId, birdId) {
  const bird = db.prepare('SELECT sire_id, dam_id FROM birds WHERE id = ? AND user_id = ?').get(birdId, userId);
  if (!bird) return { coi: 0, commonAncestors: [] };
  const sireAncestors = getBirdAncestors(userId, bird.sire_id, 3);
  const damAncestors = getBirdAncestors(userId, bird.dam_id, 3);
  const common = [];
  const damMap = new Map(damAncestors.map(a => [a.id, a]));
  for (const s of sireAncestors) {
    const d = damMap.get(s.id);
    if (d) common.push({ id: s.id, name: s.name, sireDepth: s.depth, damDepth: d.depth });
  }
  const coi = Math.min(100, common.length * 6.25);
  return { coi, commonAncestors: common };
}

function predictGenetics(sireMutation, damMutation, sireColor, damColor) {
  const muts = [sireMutation, damMutation].filter(Boolean).map(v => v.trim()).filter(Boolean);
  const uniqueMutations = [...new Set(muts.flatMap(m => m.split('/').map(x => x.trim())).filter(Boolean))];
  const baseColors = [sireColor, damColor].filter(Boolean);
  let prediction = 'Normal split possibilities';
  if (uniqueMutations.length === 1) prediction = `${uniqueMutations[0]} likely present in offspring`;
  if (uniqueMutations.length >= 2) prediction = `Mixed mutation outcomes possible: ${uniqueMutations.join(', ')}`;
  if (!uniqueMutations.length && baseColors.length) prediction = `Base color outcomes likely around ${[...new Set(baseColors)].join(' / ')}`;
  return {
    summary: prediction,
    likelyMutations: uniqueMutations,
    likelyColors: [...new Set(baseColors)]
  };
}

function requireFields(fields, body) {
  const missing = fields.filter(field => !body[field]);
  return missing;
}

function ensureBandNumberAvailable(userId, bandNumber, excludeBirdId = null) {
  if (!bandNumber) return true;
  const row = excludeBirdId
    ? db.prepare('SELECT id FROM birds WHERE user_id = ? AND band_number = ? AND id <> ?').get(userId, bandNumber, excludeBirdId)
    : db.prepare('SELECT id FROM birds WHERE user_id = ? AND band_number = ?').get(userId, bandNumber);
  return !row;
}

function nextBirdUniqueId(userId) {
  const row = db.prepare("SELECT id FROM birds WHERE user_id = ? ORDER BY id DESC LIMIT 1").get(userId);
  const next = (row?.id || 0) + 1;
  return `B${String(next).padStart(5, '0')}`;
}

function getBirdPedigree(userId, birdId) {
  return db.prepare('SELECT relation_key, linked_bird_id, ring_number, phenotype FROM bird_pedigree WHERE user_id = ? AND bird_id = ? ORDER BY relation_key').all(userId, birdId);
}

function saveBirdPedigree(userId, birdId, entries = []) {
  const allowed = new Set(['father', 'mother', 'father_father', 'father_mother', 'mother_father', 'mother_mother']);
  const replace = db.prepare(`
    INSERT INTO bird_pedigree (user_id, bird_id, relation_key, linked_bird_id, ring_number, phenotype, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(user_id, bird_id, relation_key)
    DO UPDATE SET linked_bird_id = excluded.linked_bird_id, ring_number = excluded.ring_number, phenotype = excluded.phenotype, updated_at = CURRENT_TIMESTAMP
  `);
  const clearMissing = db.prepare('DELETE FROM bird_pedigree WHERE user_id = ? AND bird_id = ?');
  const tx = db.transaction(() => {
    clearMissing.run(userId, birdId);
    for (const row of entries) {
      if (!row || !allowed.has(row.relation_key)) continue;
      const linkedId = row.linked_bird_id || null;
      if (linkedId && !ensureBirdOwnedByUser(userId, linkedId)) continue;
      if (!linkedId && !row.ring_number && !row.phenotype) continue;
      replace.run(userId, birdId, row.relation_key, linkedId, row.ring_number || '', row.phenotype || '');
    }
  });
  tx();
}

function seedSpeciesForUser(userId) {
  const insert = db.prepare('INSERT OR IGNORE INTO species (user_id, name, scientific_name, banding_period, ring_size, incubation_days, notes, show_in_dropdown) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
  const tx = db.transaction(() => {
    for (const item of speciesSeed) {
      insert.run(
        userId,
        item.name,
        item.other_name || '',
        item.banding_period || '',
        item.ring_size || '',
        item.incubation_days != null ? String(item.incubation_days) : '',
        [
          item.species_number ? `Species No: ${item.species_number}` : '',
          item.fledging_period ? `Fledging: ${item.fledging_period}` : '',
          item.maturity_period ? `Maturity: ${item.maturity_period}` : ''
        ].filter(Boolean).join(' | '),
        0
      );
    }
  });
  tx();
}

function exportUserData(userId) {
  return {
    version: 1,
    exported_at: new Date().toISOString(),
    user: db.prepare('SELECT email, name, subscription_tier, created_at FROM users WHERE id = ?').get(userId),
    subscriptions: db.prepare('SELECT tier, status, created_at FROM subscriptions WHERE user_id = ? ORDER BY id').all(userId),
    cages: db.prepare('SELECT id, cage_number, location, size, notes, created_at FROM cages WHERE user_id = ? ORDER BY id').all(userId),
    species: db.prepare('SELECT id, name, scientific_name, banding_period, ring_size, incubation_days, notes, show_in_dropdown, created_at FROM species WHERE user_id = ? ORDER BY id').all(userId),
    bands: db.prepare('SELECT id, color, band_text, band_number, ring_size, notes, created_at FROM bands WHERE user_id = ? ORDER BY id').all(userId),
    birds: db.prepare('SELECT * FROM birds WHERE user_id = ? ORDER BY id').all(userId),
    offspring: db.prepare('SELECT * FROM offspring WHERE user_id = ? ORDER BY id').all(userId),
    bird_pedigree: db.prepare('SELECT bird_id, relation_key, linked_bird_id, ring_number, phenotype, created_at, updated_at FROM bird_pedigree WHERE user_id = ? ORDER BY bird_id, relation_key').all(userId),
    pairs: db.prepare('SELECT * FROM pairs WHERE user_id = ? ORDER BY id').all(userId),
    clutches: db.prepare('SELECT * FROM clutches WHERE user_id = ? ORDER BY id').all(userId),
    eggs: db.prepare('SELECT * FROM eggs WHERE user_id = ? ORDER BY id').all(userId),
    contacts: db.prepare('SELECT * FROM contacts WHERE user_id = ? ORDER BY id').all(userId)
  };
}

function importUserData(userId, payload) {
  const data = payload || {};
  const tx = db.transaction(() => {
    db.prepare('DELETE FROM eggs WHERE user_id = ?').run(userId);
    db.prepare('DELETE FROM clutches WHERE user_id = ?').run(userId);
    db.prepare('DELETE FROM pairs WHERE user_id = ?').run(userId);
    db.prepare('DELETE FROM offspring WHERE user_id = ?').run(userId);
    db.prepare('DELETE FROM bird_pedigree WHERE user_id = ?').run(userId);
    db.prepare('DELETE FROM birds WHERE user_id = ?').run(userId);
    db.prepare('DELETE FROM bands WHERE user_id = ?').run(userId);
    db.prepare('DELETE FROM species WHERE user_id = ?').run(userId);
    db.prepare('DELETE FROM cages WHERE user_id = ?').run(userId);
    db.prepare('DELETE FROM contacts WHERE user_id = ?').run(userId);
    db.prepare('DELETE FROM subscriptions WHERE user_id = ?').run(userId);

    const currentUser = db.prepare('SELECT name, subscription_tier FROM users WHERE id = ?').get(userId);
    db.prepare('UPDATE users SET name = ?, subscription_tier = ? WHERE id = ?').run(
      data.user?.name || currentUser?.name || 'User',
      data.user?.subscription_tier || currentUser?.subscription_tier || 'Free',
      userId
    );

    const insertSubscription = db.prepare('INSERT INTO subscriptions (user_id, tier, status, created_at) VALUES (?, ?, ?, ?)');
    for (const row of (data.subscriptions || [])) insertSubscription.run(userId, row.tier || 'Free', row.status || 'active', row.created_at || null);

    const insertCage = db.prepare('INSERT INTO cages (id, user_id, cage_number, location, size, notes, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)');
    for (const row of (data.cages || [])) insertCage.run(row.id || null, userId, row.cage_number, row.location || '', row.size || '', row.notes || '', row.created_at || null);

    const insertSpecies = db.prepare('INSERT INTO species (id, user_id, name, scientific_name, banding_period, ring_size, incubation_days, notes, show_in_dropdown, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
    for (const row of (data.species || [])) insertSpecies.run(row.id || null, userId, row.name, row.scientific_name || '', row.banding_period || '', row.ring_size || '', row.incubation_days || '', row.notes || '', row.show_in_dropdown ? 1 : 0, row.created_at || null);

    const insertBand = db.prepare('INSERT INTO bands (id, user_id, color, band_text, band_number, ring_size, notes, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
    for (const row of (data.bands || [])) insertBand.run(row.id || null, userId, row.color, row.band_text || '', row.band_number, row.ring_size || '', row.notes || '', row.created_at || null);

    const insertBird = db.prepare('INSERT INTO birds (id, user_id, unique_id, name, species, band_number, cage_number, clutch_number, gender, dob, mutation, color, genotype, phenotype, breeding_status, breeding_line, show_quality, estimated_value, acquired_date, sold_date, purchase_price, sale_price, photo_url, notes, sire_id, dam_id, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
    for (const row of (data.birds || [])) insertBird.run(row.id || null, userId, row.unique_id || '', row.name, row.species || '', row.band_number || '', row.cage_number || '', row.clutch_number || '', row.gender || 'unknown', row.dob || null, row.mutation || '', row.color || '', row.genotype || '', row.phenotype || '', row.breeding_status || '', row.breeding_line || '', row.show_quality || '', row.estimated_value || null, row.acquired_date || null, row.sold_date || null, row.purchase_price || null, row.sale_price || null, row.photo_url || '', row.notes || '', row.sire_id || null, row.dam_id || null, row.status || 'active', row.created_at || null);

    const insertOffspring = db.prepare('INSERT INTO offspring (id, user_id, source_egg_id, name, species, band_number, cage_number, clutch_number, gender, dob, band_date, fledge_date, handfed, feeding, phenotype, genotype, carrier_genes, father_id, mother_id, breeding_line, notes, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
    for (const row of (data.offspring || [])) insertOffspring.run(row.id || null, userId, row.source_egg_id || null, row.name, row.species || '', row.band_number || '', row.cage_number || '', row.clutch_number || '', row.gender || 'unknown', row.dob || null, row.band_date || null, row.fledge_date || null, row.handfed || '', row.feeding || '', row.phenotype || '', row.genotype || '', row.carrier_genes || '', row.father_id || null, row.mother_id || null, row.breeding_line || '', row.notes || '', row.status || 'active', row.created_at || null);

    const insertPedigree = db.prepare('INSERT INTO bird_pedigree (user_id, bird_id, relation_key, linked_bird_id, ring_number, phenotype, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
    for (const row of (data.bird_pedigree || [])) insertPedigree.run(userId, row.bird_id, row.relation_key, row.linked_bird_id || null, row.ring_number || '', row.phenotype || '', row.created_at || null, row.updated_at || null);

    const insertPair = db.prepare('INSERT INTO pairs (id, user_id, sire_id, dam_id, pair_date, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)');
    for (const row of (data.pairs || [])) insertPair.run(row.id || null, userId, row.sire_id, row.dam_id, row.pair_date || null, row.status || 'active', row.created_at || null);

    const insertClutch = db.prepare('INSERT INTO clutches (id, user_id, pair_id, lay_date, hatch_date, created_at) VALUES (?, ?, ?, ?, ?, ?)');
    for (const row of (data.clutches || [])) insertClutch.run(row.id || null, userId, row.pair_id, row.lay_date || null, row.hatch_date || null, row.created_at || null);

    const insertEgg = db.prepare('INSERT INTO eggs (id, user_id, clutch_id, egg_number, outcome, created_at) VALUES (?, ?, ?, ?, ?, ?)');
    for (const row of (data.eggs || [])) insertEgg.run(row.id || null, userId, row.clutch_id, row.egg_number || null, row.outcome || 'pending', row.created_at || null);

    const insertContact = db.prepare('INSERT INTO contacts (id, user_id, name, email, phone, type, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)');
    for (const row of (data.contacts || [])) insertContact.run(row.id || null, userId, row.name, row.email || '', row.phone || '', row.type || 'other', row.created_at || null);

    if (!(data.subscriptions || []).length) {
      db.prepare('INSERT INTO subscriptions (user_id, tier, status) VALUES (?, ?, ?)').run(userId, data.user?.subscription_tier || 'Free', 'active');
    }
  });
  tx();
}

app.post('/api/register', async (req, res) => {
  const missing = requireFields(['email', 'password', 'name'], req.body);
  if (missing.length) return res.status(400).json({ error: `Missing fields: ${missing.join(', ')}` });
  try {
    const hash = await bcrypt.hash(req.body.password, 10);
    const result = db.prepare('INSERT INTO users (email, password_hash, name, subscription_tier) VALUES (?, ?, ?, ?)').run(req.body.email.trim().toLowerCase(), hash, req.body.name.trim(), 'Free');
    db.prepare('INSERT INTO subscriptions (user_id, tier, status) VALUES (?, ?, ?)').run(result.lastInsertRowid, 'Free', 'active');
    seedSpeciesForUser(result.lastInsertRowid);
    const user = userFromToken.get(result.lastInsertRowid);
    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: safeUser(user) });
  } catch (error) {
    res.status(400).json({ error: 'Could not register user' });
  }
});

app.post('/api/login', async (req, res) => {
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get((req.body.email || '').trim().toLowerCase());
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });
  const ok = await bcrypt.compare(req.body.password || '', user.password_hash);
  if (!ok) return res.status(401).json({ error: 'Invalid credentials' });
  const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ token, user: safeUser(user) });
});

app.get('/api/me', auth, (req, res) => {
  const user = getAuthenticatedUser(req);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json(safeUser(user));
});

app.get('/api/stats', auth, (req, res) => {
  const user = getAuthenticatedUser(req);
  const totalBirds = birdCountStmt.get(req.user.id).count;
  const totalOffspring = db.prepare('SELECT COUNT(*) AS count FROM offspring WHERE user_id = ?').get(req.user.id).count;
  const maleBirds = db.prepare("SELECT COUNT(*) AS count FROM birds WHERE user_id = ? AND gender = 'male'").get(req.user.id).count;
  const femaleBirds = db.prepare("SELECT COUNT(*) AS count FROM birds WHERE user_id = ? AND gender = 'female'").get(req.user.id).count;
  const activePairs = db.prepare("SELECT COUNT(*) AS count FROM pairs WHERE user_id = ? AND status = 'active'").get(req.user.id).count;
  const totalClutches = db.prepare('SELECT COUNT(*) AS count FROM clutches WHERE user_id = ?').get(req.user.id).count;
  const eggsTracked = db.prepare('SELECT COUNT(*) AS count FROM eggs WHERE user_id = ?').get(req.user.id).count;
  res.json({ totalBirds, totalOffspring, maleBirds, femaleBirds, activePairs, totalClutches, eggsTracked, tier: user.subscription_tier, birdLimit: getTierLimit(user.subscription_tier) });
});

app.get('/api/birds', auth, (req, res) => {
  const birds = db.prepare(`
    SELECT b.*, s.name AS sire_name, d.name AS dam_name
    FROM birds b
    LEFT JOIN birds s ON s.id = b.sire_id AND s.user_id = b.user_id
    LEFT JOIN birds d ON d.id = b.dam_id AND d.user_id = b.user_id
    WHERE b.user_id = ?
    ORDER BY datetime(b.created_at) DESC, b.id DESC
  `).all(req.user.id);
  res.json(birds);
});

app.post('/api/birds', auth, (req, res) => {
  const user = getAuthenticatedUser(req);
  const count = birdCountStmt.get(req.user.id).count;
  const limit = getTierLimit(user.subscription_tier);
  if (count >= limit) return res.status(400).json({ error: `Bird limit reached for ${user.subscription_tier} tier` });

  const missing = requireFields(['name'], req.body);
  if (missing.length) return res.status(400).json({ error: `Missing fields: ${missing.join(', ')}` });

  for (const parentField of ['sire_id', 'dam_id']) {
    if (req.body[parentField] && !ensureBirdOwnedByUser(req.user.id, req.body[parentField])) {
      return res.status(400).json({ error: `${parentField} does not belong to this account` });
    }
  }

  if (!ensureBandNumberAvailable(req.user.id, req.body.band_number || '')) {
    return res.status(400).json({ error: 'Band number must be unique for this account' });
  }

  const result = db.prepare(`
    INSERT INTO birds (
      user_id, unique_id, name, species, band_number, cage_number, clutch_number,
      gender, dob, mutation, color, genotype, phenotype, breeding_status,
      breeding_line, show_quality, estimated_value, acquired_date, sold_date,
      purchase_price, sale_price, photo_url, notes, sire_id, dam_id, status
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    req.user.id,
    nextBirdUniqueId(req.user.id),
    req.body.name,
    req.body.species || '',
    req.body.band_number || '',
    req.body.cage_number || '',
    req.body.clutch_number || '',
    req.body.gender || 'unknown',
    req.body.dob || null,
    req.body.mutation || '',
    req.body.color || '',
    req.body.genotype || '',
    req.body.phenotype || '',
    req.body.breeding_status || '',
    req.body.breeding_line || '',
    req.body.show_quality || '',
    req.body.estimated_value || null,
    req.body.acquired_date || null,
    req.body.sold_date || null,
    req.body.purchase_price || null,
    req.body.sale_price || null,
    req.body.photo_url || '',
    req.body.notes || '',
    req.body.sire_id || null,
    req.body.dam_id || null,
    req.body.status || 'active'
  );
  res.json({ id: result.lastInsertRowid });
});

app.put('/api/birds/:id', auth, (req, res) => {
  const bird = ensureBirdOwnedByUser(req.user.id, req.params.id);
  if (!bird) return res.status(404).json({ error: 'Bird not found' });

  for (const parentField of ['sire_id', 'dam_id']) {
    if (req.body[parentField] && !ensureBirdOwnedByUser(req.user.id, req.body[parentField])) {
      return res.status(400).json({ error: `${parentField} does not belong to this account` });
    }
  }

  if (!ensureBandNumberAvailable(req.user.id, req.body.band_number || '', req.params.id)) {
    return res.status(400).json({ error: 'Band number must be unique for this account' });
  }

  db.prepare(`
    UPDATE birds
    SET unique_id = ?, name = ?, species = ?, band_number = ?, cage_number = ?, clutch_number = ?,
        gender = ?, dob = ?, mutation = ?, color = ?, genotype = ?, phenotype = ?,
        breeding_status = ?, breeding_line = ?, show_quality = ?, estimated_value = ?,
        acquired_date = ?, sold_date = ?, purchase_price = ?, sale_price = ?,
        photo_url = ?, notes = ?, sire_id = ?, dam_id = ?, status = ?
    WHERE id = ? AND user_id = ?
  `).run(
    bird.unique_id || nextBirdUniqueId(req.user.id),
    req.body.name || bird.name,
    req.body.species || '',
    req.body.band_number || '',
    req.body.cage_number || '',
    req.body.clutch_number || '',
    req.body.gender || 'unknown',
    req.body.dob || null,
    req.body.mutation || '',
    req.body.color || '',
    req.body.genotype || '',
    req.body.phenotype || '',
    req.body.breeding_status || '',
    req.body.breeding_line || '',
    req.body.show_quality || '',
    req.body.estimated_value || null,
    req.body.acquired_date || null,
    req.body.sold_date || null,
    req.body.purchase_price || null,
    req.body.sale_price || null,
    req.body.photo_url || '',
    req.body.notes || '',
    req.body.sire_id || null,
    req.body.dam_id || null,
    req.body.status || bird.status,
    req.params.id,
    req.user.id
  );
  res.json({ ok: true });
});

app.get('/api/birds/:id/pedigree', auth, (req, res) => {
  const bird = ensureBirdOwnedByUser(req.user.id, req.params.id);
  if (!bird) return res.status(404).json({ error: 'Bird not found' });
  res.json(getBirdPedigree(req.user.id, req.params.id));
});

app.put('/api/birds/:id/pedigree', auth, (req, res) => {
  const bird = ensureBirdOwnedByUser(req.user.id, req.params.id);
  if (!bird) return res.status(404).json({ error: 'Bird not found' });
  saveBirdPedigree(req.user.id, req.params.id, Array.isArray(req.body?.entries) ? req.body.entries : []);
  res.json({ ok: true });
});

app.delete('/api/birds/:id', auth, (req, res) => {
  db.prepare('DELETE FROM birds WHERE id = ? AND user_id = ?').run(req.params.id, req.user.id);
  res.json({ ok: true });
});

app.get('/api/pairs', auth, (req, res) => {
  const pairs = db.prepare(`
    SELECT p.*, s.name AS sire_name, d.name AS dam_name
    FROM pairs p
    JOIN birds s ON s.id = p.sire_id AND s.user_id = p.user_id
    JOIN birds d ON d.id = p.dam_id AND d.user_id = p.user_id
    WHERE p.user_id = ?
    ORDER BY COALESCE(p.pair_date, p.created_at) DESC
  `).all(req.user.id);
  res.json(pairs);
});

app.post('/api/pairs', auth, (req, res) => {
  const { sire_id, dam_id, pair_date, status } = req.body;
  const sire = ensureBirdOwnedByUser(req.user.id, sire_id);
  const dam = ensureBirdOwnedByUser(req.user.id, dam_id);
  if (!sire || !dam) return res.status(400).json({ error: 'Both birds must belong to your account' });
  const result = db.prepare('INSERT INTO pairs (user_id, sire_id, dam_id, pair_date, status) VALUES (?, ?, ?, ?, ?)').run(req.user.id, sire_id, dam_id, pair_date || null, status || 'active');
  res.json({ id: result.lastInsertRowid });
});

app.put('/api/pairs/:id', auth, (req, res) => {
  const pair = db.prepare('SELECT * FROM pairs WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
  if (!pair) return res.status(404).json({ error: 'Pair not found' });
  db.prepare('UPDATE pairs SET pair_date = ?, status = ? WHERE id = ? AND user_id = ?').run(req.body.pair_date || pair.pair_date, req.body.status || pair.status, req.params.id, req.user.id);
  res.json({ ok: true });
});

app.delete('/api/pairs/:id', auth, (req, res) => {
  db.prepare('DELETE FROM pairs WHERE id = ? AND user_id = ?').run(req.params.id, req.user.id);
  res.json({ ok: true });
});

app.get('/api/clutches', auth, (req, res) => {
  const clutches = db.prepare(`
    SELECT c.*, p.sire_id, p.dam_id, s.name AS sire_name, d.name AS dam_name,
      (SELECT COUNT(*) FROM eggs e WHERE e.clutch_id = c.id AND e.user_id = c.user_id) AS egg_count
    FROM clutches c
    JOIN pairs p ON p.id = c.pair_id AND p.user_id = c.user_id
    JOIN birds s ON s.id = p.sire_id AND s.user_id = c.user_id
    JOIN birds d ON d.id = p.dam_id AND d.user_id = c.user_id
    WHERE c.user_id = ?
    ORDER BY COALESCE(c.lay_date, c.created_at) DESC
  `).all(req.user.id);
  res.json(clutches);
});

app.post('/api/clutches', auth, (req, res) => {
  const pair = db.prepare('SELECT * FROM pairs WHERE id = ? AND user_id = ?').get(req.body.pair_id, req.user.id);
  if (!pair) return res.status(400).json({ error: 'Invalid pair' });
  const result = db.prepare('INSERT INTO clutches (user_id, pair_id, lay_date, hatch_date) VALUES (?, ?, ?, ?)').run(req.user.id, req.body.pair_id, req.body.lay_date || null, req.body.hatch_date || null);
  res.json({ id: result.lastInsertRowid });
});

app.put('/api/clutches/:id', auth, (req, res) => {
  const clutch = db.prepare('SELECT * FROM clutches WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
  if (!clutch) return res.status(404).json({ error: 'Clutch not found' });
  db.prepare('UPDATE clutches SET lay_date = ?, hatch_date = ? WHERE id = ? AND user_id = ?').run(req.body.lay_date || clutch.lay_date, req.body.hatch_date || clutch.hatch_date, req.params.id, req.user.id);
  res.json({ ok: true });
});

app.get('/api/eggs', auth, (req, res) => {
  const eggs = db.prepare(`
    SELECT e.*, c.pair_id, c.hatch_date, c.lay_date,
      p.sire_id AS father_id, p.dam_id AS mother_id, b.species
    FROM eggs e
    JOIN clutches c ON c.id = e.clutch_id AND c.user_id = e.user_id
    JOIN pairs p ON p.id = c.pair_id AND p.user_id = e.user_id
    LEFT JOIN birds b ON b.id = p.sire_id AND b.user_id = e.user_id
    WHERE e.user_id = ?
    ORDER BY e.clutch_id DESC, e.egg_number ASC
  `).all(req.user.id);
  res.json(eggs);
});

app.post('/api/eggs', auth, (req, res) => {
  const clutch = db.prepare('SELECT * FROM clutches WHERE id = ? AND user_id = ?').get(req.body.clutch_id, req.user.id);
  if (!clutch) return res.status(400).json({ error: 'Invalid clutch' });
  const result = db.prepare('INSERT INTO eggs (user_id, clutch_id, egg_number, outcome) VALUES (?, ?, ?, ?)').run(req.user.id, req.body.clutch_id, req.body.egg_number || null, req.body.outcome || 'pending');
  res.json({ id: result.lastInsertRowid });
});

app.put('/api/eggs/:id', auth, (req, res) => {
  const egg = db.prepare('SELECT * FROM eggs WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
  if (!egg) return res.status(404).json({ error: 'Egg not found' });
  db.prepare('UPDATE eggs SET egg_number = ?, outcome = ? WHERE id = ? AND user_id = ?').run(req.body.egg_number || egg.egg_number, req.body.outcome || egg.outcome, req.params.id, req.user.id);
  res.json({ ok: true });
});

app.get('/api/offspring', auth, (req, res) => {
  const rows = db.prepare(`
    SELECT o.*, f.band_number AS father_band_number, m.band_number AS mother_band_number
    FROM offspring o
    LEFT JOIN birds f ON f.id = o.father_id AND f.user_id = o.user_id
    LEFT JOIN birds m ON m.id = o.mother_id AND m.user_id = o.user_id
    WHERE o.user_id = ?
    ORDER BY COALESCE(o.dob, o.created_at) DESC, o.id DESC
  `).all(req.user.id);
  res.json(rows);
});

app.post('/api/offspring', auth, (req, res) => {
  const missing = requireFields(['name'], req.body);
  if (missing.length) return res.status(400).json({ error: `Missing fields: ${missing.join(', ')}` });
  for (const parentField of ['father_id', 'mother_id']) {
    if (req.body[parentField] && !ensureBirdOwnedByUser(req.user.id, req.body[parentField])) {
      return res.status(400).json({ error: `${parentField} does not belong to this account` });
    }
  }
  if (req.body.source_egg_id) {
    const egg = db.prepare('SELECT * FROM eggs WHERE id = ? AND user_id = ?').get(req.body.source_egg_id, req.user.id);
    if (!egg) return res.status(400).json({ error: 'Invalid source egg' });
  }
  const result = db.prepare(`
    INSERT INTO offspring (user_id, source_egg_id, name, species, band_number, cage_number, clutch_number, gender, dob, band_date, fledge_date, handfed, feeding, phenotype, genotype, carrier_genes, father_id, mother_id, breeding_line, notes, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    req.user.id,
    req.body.source_egg_id || null,
    req.body.name,
    req.body.species || '',
    req.body.band_number || '',
    req.body.cage_number || '',
    req.body.clutch_number || '',
    req.body.gender || 'unknown',
    req.body.dob || null,
    req.body.band_date || null,
    req.body.fledge_date || null,
    req.body.handfed || '',
    req.body.feeding || '',
    req.body.phenotype || '',
    req.body.genotype || '',
    req.body.carrier_genes || '',
    req.body.father_id || null,
    req.body.mother_id || null,
    req.body.breeding_line || '',
    req.body.notes || '',
    req.body.status || 'active'
  );
  res.json({ id: result.lastInsertRowid });
});

app.put('/api/offspring/:id', auth, (req, res) => {
  const offspring = ensureOffspringOwnedByUser(req.user.id, req.params.id);
  if (!offspring) return res.status(404).json({ error: 'Offspring not found' });
  for (const parentField of ['father_id', 'mother_id']) {
    if (req.body[parentField] && !ensureBirdOwnedByUser(req.user.id, req.body[parentField])) {
      return res.status(400).json({ error: `${parentField} does not belong to this account` });
    }
  }
  db.prepare(`
    UPDATE offspring
    SET source_egg_id = ?, name = ?, species = ?, band_number = ?, cage_number = ?, clutch_number = ?,
        gender = ?, dob = ?, band_date = ?, fledge_date = ?, handfed = ?, feeding = ?, phenotype = ?,
        genotype = ?, carrier_genes = ?, father_id = ?, mother_id = ?, breeding_line = ?, notes = ?, status = ?
    WHERE id = ? AND user_id = ?
  `).run(
    req.body.source_egg_id || null,
    req.body.name || offspring.name,
    req.body.species || '',
    req.body.band_number || '',
    req.body.cage_number || '',
    req.body.clutch_number || '',
    req.body.gender || 'unknown',
    req.body.dob || null,
    req.body.band_date || null,
    req.body.fledge_date || null,
    req.body.handfed || '',
    req.body.feeding || '',
    req.body.phenotype || '',
    req.body.genotype || '',
    req.body.carrier_genes || '',
    req.body.father_id || null,
    req.body.mother_id || null,
    req.body.breeding_line || '',
    req.body.notes || '',
    req.body.status || offspring.status,
    req.params.id,
    req.user.id
  );
  res.json({ ok: true });
});

app.delete('/api/offspring/:id', auth, (req, res) => {
  db.prepare('DELETE FROM offspring WHERE id = ? AND user_id = ?').run(req.params.id, req.user.id);
  res.json({ ok: true });
});

app.get('/api/cages', auth, (req, res) => {
  const rows = db.prepare('SELECT * FROM cages WHERE user_id = ? ORDER BY cage_number').all(req.user.id);
  res.json(rows);
});

app.post('/api/cages', auth, (req, res) => {
  const missing = requireFields(['cage_number'], req.body);
  if (missing.length) return res.status(400).json({ error: `Missing fields: ${missing.join(', ')}` });
  const result = db.prepare('INSERT INTO cages (user_id, cage_number, location, size, notes) VALUES (?, ?, ?, ?, ?)').run(
    req.user.id,
    req.body.cage_number,
    req.body.location || '',
    req.body.size || '',
    req.body.notes || ''
  );
  res.json({ id: result.lastInsertRowid });
});

app.put('/api/cages/:id', auth, (req, res) => {
  const cage = db.prepare('SELECT * FROM cages WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
  if (!cage) return res.status(404).json({ error: 'Cage not found' });
  db.prepare('UPDATE cages SET cage_number = ?, location = ?, size = ?, notes = ? WHERE id = ? AND user_id = ?').run(
    req.body.cage_number || cage.cage_number,
    req.body.location || '',
    req.body.size || '',
    req.body.notes || '',
    req.params.id,
    req.user.id
  );
  res.json({ ok: true });
});

app.get('/api/species', auth, (req, res) => {
  const rows = db.prepare('SELECT * FROM species WHERE user_id = ? ORDER BY name').all(req.user.id);
  res.json(rows);
});

app.post('/api/species', auth, (req, res) => {
  const missing = requireFields(['name'], req.body);
  if (missing.length) return res.status(400).json({ error: `Missing fields: ${missing.join(', ')}` });
  const result = db.prepare('INSERT INTO species (user_id, name, scientific_name, banding_period, ring_size, incubation_days, notes, show_in_dropdown) VALUES (?, ?, ?, ?, ?, ?, ?, ?)').run(
    req.user.id,
    req.body.name,
    req.body.scientific_name || '',
    req.body.ring_period || req.body.banding_period || '',
    req.body.ring_size || '',
    req.body.incubation_days || '',
    req.body.notes || '',
    req.body.show_in_dropdown ? 1 : 0
  );
  res.json({ id: result.lastInsertRowid });
});

app.put('/api/species/:id', auth, (req, res) => {
  const species = db.prepare('SELECT * FROM species WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
  if (!species) return res.status(404).json({ error: 'Species not found' });
  db.prepare('UPDATE species SET name = ?, scientific_name = ?, banding_period = ?, ring_size = ?, incubation_days = ?, notes = ?, show_in_dropdown = ? WHERE id = ? AND user_id = ?').run(
    req.body.name || species.name,
    req.body.scientific_name || '',
    req.body.ring_period || req.body.banding_period || '',
    req.body.ring_size || '',
    req.body.incubation_days || '',
    req.body.notes || '',
    req.body.show_in_dropdown ? 1 : 0,
    req.params.id,
    req.user.id
  );
  res.json({ ok: true });
});

app.post('/api/species/seed-defaults', auth, (req, res) => {
  seedSpeciesForUser(req.user.id);
  res.json({ ok: true, seeded: speciesSeed.length, note: `Imported ${speciesSeed.length} species from the supplied Bird Tracker species spreadsheet.` });
});

app.get('/api/bands', auth, (req, res) => {
  const rows = db.prepare('SELECT * FROM bands WHERE user_id = ? ORDER BY color, band_text, band_number').all(req.user.id);
  res.json(rows);
});

app.post('/api/bands', auth, (req, res) => {
  const missing = requireFields(['color', 'band_number'], req.body);
  if (missing.length) return res.status(400).json({ error: `Missing fields: ${missing.join(', ')}` });
  const result = db.prepare('INSERT INTO bands (user_id, color, band_text, band_number, ring_size, notes) VALUES (?, ?, ?, ?, ?, ?)').run(
    req.user.id,
    req.body.color,
    req.body.band_text || '',
    req.body.band_number,
    req.body.ring_size || '',
    req.body.notes || ''
  );
  res.json({ id: result.lastInsertRowid });
});

app.post('/api/bands/series', auth, (req, res) => {
  const missing = requireFields(['color', 'band_number', 'quantity'], req.body);
  if (missing.length) return res.status(400).json({ error: `Missing fields: ${missing.join(', ')}` });

  const start = Number(req.body.band_number);
  const quantity = Number(req.body.quantity);
  if (!Number.isInteger(start) || !Number.isInteger(quantity) || quantity < 1) {
    return res.status(400).json({ error: 'Invalid starting number or quantity' });
  }

  const width = String(req.body.band_number).length;
  const insert = db.prepare('INSERT INTO bands (user_id, color, band_text, band_number, ring_size, notes) VALUES (?, ?, ?, ?, ?, ?)');
  const created = [];

  const tx = db.transaction(() => {
    for (let i = 0; i < quantity; i += 1) {
      const ringNumber = String(start + i).padStart(width, '0');
      insert.run(req.user.id, req.body.color, req.body.band_text || '', ringNumber, req.body.ring_size || '', req.body.notes || '');
      created.push(ringNumber);
    }
  });

  try {
    tx();
  } catch (error) {
    return res.status(400).json({ error: 'Could not create ring series, one or more numbers may already exist' });
  }

  res.json({ ok: true, created: created.length, first: created[0], last: created[created.length - 1] });
});

app.put('/api/bands/:id', auth, (req, res) => {
  const band = db.prepare('SELECT * FROM bands WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
  if (!band) return res.status(404).json({ error: 'Band not found' });
  db.prepare('UPDATE bands SET color = ?, band_text = ?, band_number = ?, ring_size = ?, notes = ? WHERE id = ? AND user_id = ?').run(
    req.body.color || band.color,
    req.body.band_text || '',
    req.body.band_number || band.band_number,
    req.body.ring_size || '',
    req.body.notes || '',
    req.params.id,
    req.user.id
  );
  res.json({ ok: true });
});

app.get('/api/contacts', auth, (req, res) => {
  const contacts = db.prepare('SELECT * FROM contacts WHERE user_id = ? ORDER BY name').all(req.user.id);
  res.json(contacts);
});

app.post('/api/contacts', auth, (req, res) => {
  const missing = requireFields(['name'], req.body);
  if (missing.length) return res.status(400).json({ error: `Missing fields: ${missing.join(', ')}` });
  const result = db.prepare('INSERT INTO contacts (user_id, name, email, phone, type) VALUES (?, ?, ?, ?, ?)').run(req.user.id, req.body.name, req.body.email || '', req.body.phone || '', req.body.type || 'other');
  res.json({ id: result.lastInsertRowid });
});

app.get('/api/data-export', auth, (req, res) => {
  const payload = exportUserData(req.user.id);
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', `attachment; filename="bird-tracker-backup-${req.user.id}.json"`);
  res.json(payload);
});

app.post('/api/data-import', auth, (req, res) => {
  const payload = req.body;
  if (!payload || typeof payload !== 'object') return res.status(400).json({ error: 'Invalid import file' });
  try {
    importUserData(req.user.id, payload);
    res.json({ ok: true });
  } catch (error) {
    res.status(400).json({ error: 'Import failed. Please check the backup file format.' });
  }
});

app.get('/api/subscriptions', auth, (req, res) => {
  const user = getAuthenticatedUser(req);
  const subscription = db.prepare('SELECT * FROM subscriptions WHERE user_id = ? ORDER BY id DESC LIMIT 1').get(req.user.id);
  res.json({ user: safeUser(user), subscription: subscription || { tier: user.subscription_tier, status: 'active' } });
});

app.post('/api/subscriptions/stripe-checkout', auth, (req, res) => {
  const tier = req.body.tier;
  if (!TIER_LIMITS.hasOwnProperty(tier)) return res.status(400).json({ error: 'Invalid tier' });
  res.json({
    message: 'Stripe stub only. Replace this endpoint with a real checkout session later.',
    tier,
    fakeCheckoutSessionId: `stub_${Date.now()}`
  });
});

app.post('/api/subscriptions/change-tier', auth, (req, res) => {
  const tier = req.body.tier;
  if (!TIER_LIMITS.hasOwnProperty(tier)) return res.status(400).json({ error: 'Invalid tier' });
  db.transaction(() => {
    db.prepare('UPDATE users SET subscription_tier = ? WHERE id = ?').run(tier, req.user.id);
    db.prepare('INSERT INTO subscriptions (user_id, tier, status) VALUES (?, ?, ?)').run(req.user.id, tier, 'active');
  })();
  const user = getAuthenticatedUser(req);
  res.json({ ok: true, user: safeUser(user) });
});

app.get('/api/genetics/predict', auth, (req, res) => {
  const sire = req.query.sire_id ? ensureBirdOwnedByUser(req.user.id, req.query.sire_id) : null;
  const dam = req.query.dam_id ? ensureBirdOwnedByUser(req.user.id, req.query.dam_id) : null;
  if (!sire || !dam) return res.status(400).json({ error: 'Valid sire_id and dam_id are required' });
  res.json(predictGenetics(sire.mutation, dam.mutation, sire.color, dam.color));
});

app.get('/api/coi/:birdId', auth, (req, res) => {
  const bird = ensureBirdOwnedByUser(req.user.id, req.params.birdId);
  if (!bird) return res.status(404).json({ error: 'Bird not found' });
  res.json(calculateCoiForBird(req.user.id, bird.id));
});

app.get('/api/calendar', auth, (req, res) => {
  const items = db.prepare(`
    SELECT 'pair' AS type, id, pair_date AS event_date, status, NULL AS extra,
      (SELECT name FROM birds WHERE id = pairs.sire_id AND user_id = pairs.user_id) || ' x ' ||
      (SELECT name FROM birds WHERE id = pairs.dam_id AND user_id = pairs.user_id) AS title
    FROM pairs
    WHERE user_id = ? AND pair_date IS NOT NULL
    UNION ALL
    SELECT 'clutch' AS type, c.id, c.lay_date AS event_date, NULL AS status,
      'Hatch: ' || COALESCE(c.hatch_date, 'TBD') AS extra,
      'Clutch for ' || s.name || ' x ' || d.name AS title
    FROM clutches c
    JOIN pairs p ON p.id = c.pair_id AND p.user_id = c.user_id
    JOIN birds s ON s.id = p.sire_id AND s.user_id = c.user_id
    JOIN birds d ON d.id = p.dam_id AND d.user_id = c.user_id
    WHERE c.user_id = ? AND c.lay_date IS NOT NULL
    ORDER BY event_date DESC
  `).all(req.user.id, req.user.id);
  res.json(items);
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Bird Breeding App running on http://localhost:${PORT}`);
});
