# Current vs Target Database Tree

Date: 2026-05-08
Status: Current live schema compared with the target Bird Tracker-style rebuild schema.

---

# 1. Current Live App Schema

## 1.1 Table tree

```text
users
├─ id (PK)
├─ email
├─ password_hash
├─ name
├─ subscription_tier
└─ created_at

subscriptions
├─ id (PK)
├─ user_id (FK → users.id)
├─ tier
├─ status
└─ created_at

birds
├─ id (PK)
├─ user_id (FK → users.id)
├─ unique_id
├─ name
├─ species
├─ band_number
├─ cage_number
├─ clutch_number
├─ gender
├─ dob
├─ mutation
├─ color
├─ genotype
├─ phenotype
├─ breeding_status
├─ breeding_line
├─ show_quality
├─ estimated_value
├─ acquired_date
├─ sold_date
├─ purchase_price
├─ sale_price
├─ photo_url
├─ notes
├─ sire_id (FK → birds.id)
├─ dam_id (FK → birds.id)
├─ status
└─ created_at

bird_pedigree
├─ id (PK)
├─ user_id (FK → users.id)
├─ bird_id (FK → birds.id)
├─ relation_key
├─ linked_bird_id (FK → birds.id)
├─ ring_number
├─ phenotype
├─ created_at
└─ updated_at

pairs
├─ id (PK)
├─ user_id (FK → users.id)
├─ sire_id (FK → birds.id)
├─ dam_id (FK → birds.id)
├─ pair_date
├─ status
└─ created_at

clutches
├─ id (PK)
├─ user_id (FK → users.id)
├─ pair_id (FK → pairs.id)
├─ species
├─ cage_number
├─ nest_box
├─ clutch_code
├─ lay_date
├─ hatch_date
├─ incubation_start_date
├─ status
├─ total_eggs
├─ notes
└─ created_at

eggs
├─ id (PK)
├─ user_id (FK → users.id)
├─ clutch_id (FK → clutches.id)
├─ egg_number
├─ lay_date
├─ hatch_date
├─ outcome
├─ fertility
├─ colour_notes
├─ comments
└─ created_at

offspring
├─ id (PK)
├─ user_id (FK → users.id)
├─ source_egg_id (FK → eggs.id)
├─ name
├─ species
├─ band_number
├─ cage_number
├─ clutch_number
├─ gender
├─ dob
├─ band_date
├─ fledge_date
├─ handfed
├─ feeding
├─ phenotype
├─ genotype
├─ carrier_genes
├─ father_id (FK → birds.id)
├─ mother_id (FK → birds.id)
├─ breeding_line
├─ notes
├─ status
└─ created_at

cages
├─ id (PK)
├─ user_id (FK → users.id)
├─ cage_number
├─ location
├─ size
├─ notes
└─ created_at

species
├─ id (PK)
├─ user_id (FK → users.id)
├─ name
├─ scientific_name
├─ banding_period
├─ incubation_days
├─ ring_size
├─ notes
├─ show_in_dropdown
└─ created_at

bands [rings in UI]
├─ id (PK)
├─ user_id (FK → users.id)
├─ color
├─ band_text
├─ band_number
├─ ring_size
├─ notes
└─ created_at

contacts
├─ id (PK)
├─ user_id (FK → users.id)
├─ name
├─ email
├─ phone
├─ type
└─ created_at
```

## 1.2 Current relationships

```text
users
├─ 1 → many subscriptions
├─ 1 → many birds
├─ 1 → many pairs
├─ 1 → many clutches
├─ 1 → many eggs
├─ 1 → many offspring
├─ 1 → many cages
├─ 1 → many species
├─ 1 → many bands
├─ 1 → many contacts
└─ 1 → many bird_pedigree rows

birds
├─ 0/1 → father bird (sire_id → birds.id)
├─ 0/1 → mother bird (dam_id → birds.id)
├─ 1 → many pairs as father
├─ 1 → many pairs as mother
├─ 1 → many bird_pedigree rows as subject
├─ 1 → many bird_pedigree rows as linked ancestor
├─ 1 → many offspring as father
└─ 1 → many offspring as mother

pairs
└─ 1 → many clutches

clutches
└─ 1 → many eggs

eggs
└─ 0/1 → 1 offspring via offspring.source_egg_id
```

## 1.3 Current schema weaknesses
- many visible references are still text values rather than normalized FKs
- ownership still sits on `user_id` instead of `account_id`
- health, exams, bloodwork, tasks, invoices, and calendar are not normalized yet
- `clutches` is doing the job of a richer breeding-round entity but is still only halfway there

---

# 2. Target Bird Tracker-Style Rebuild Schema

## 2.1 Core account layer

```text
accounts
├─ id (PK)
├─ account_name
├─ subscription_plan
├─ status
├─ created_at
└─ updated_at

account_users
├─ id (PK)
├─ account_id (FK → accounts.id)
├─ user_id (FK → users.id)
├─ role
├─ is_account_admin
└─ created_at

users
├─ id (PK)
├─ email
├─ password_hash
├─ name
├─ status
└─ created_at
```

## 2.2 Master breeder records

```text
flock_members
├─ id (PK)
├─ account_id (FK → accounts.id)
├─ unique_id
├─ ring_id (FK → rings.id)
├─ species_id (FK → species.id)
├─ cage_id (FK → cages.id)
├─ name
├─ sex
├─ hatch_date
├─ clutch_code
├─ mutation
├─ genotype
├─ phenotype
├─ breeding_status
├─ breeding_line
├─ show_quality
├─ estimated_value
├─ status
├─ photo_path
├─ father_bird_id (FK → flock_members.id)
├─ mother_bird_id (FK → flock_members.id)
├─ notes
├─ created_at
└─ updated_at

offspring_records
├─ id (PK)
├─ account_id (FK → accounts.id)
├─ source_egg_id (FK → breeding_eggs.id)
├─ ring_id (FK → rings.id, nullable)
├─ species_id (FK → species.id)
├─ cage_id (FK → cages.id, nullable)
├─ name
├─ sex
├─ hatch_date
├─ ring_date
├─ fledge_date
├─ handfed
├─ feeding_notes
├─ genotype
├─ phenotype
├─ carrier_genes
├─ father_bird_id (FK → flock_members.id)
├─ mother_bird_id (FK → flock_members.id)
├─ breeding_line
├─ disposition_status
├─ notes
├─ created_at
└─ updated_at

species
├─ id (PK)
├─ account_id (FK → accounts.id)
├─ name
├─ scientific_name
├─ ring_size
├─ ring_period
├─ incubation_days
├─ fledging_period
├─ maturity_period
├─ show_in_dropdown
├─ notes
└─ created_at

cages
├─ id (PK)
├─ account_id (FK → accounts.id)
├─ cage_number
├─ location
├─ size
├─ notes
└─ created_at

rings
├─ id (PK)
├─ account_id (FK → accounts.id)
├─ color
├─ ring_text
├─ ring_number
├─ ring_size
├─ material
├─ ring_type
├─ notes
├─ assigned_bird_id (FK → flock_members.id, nullable)
├─ assigned_offspring_id (FK → offspring_records.id, nullable)
└─ created_at
```

## 2.3 Pedigree layer

```text
bird_pedigree
├─ id (PK)
├─ account_id (FK → accounts.id)
├─ bird_id (FK → flock_members.id)
├─ relation_key
├─ linked_bird_id (FK → flock_members.id, nullable)
├─ ring_number_snapshot
├─ phenotype_snapshot
├─ genotype_snapshot
├─ created_at
└─ updated_at
```

## 2.4 Breeding workflow layer

```text
breeding_pairs
├─ id (PK)
├─ account_id (FK → accounts.id)
├─ father_bird_id (FK → flock_members.id)
├─ mother_bird_id (FK → flock_members.id)
├─ cage_id (FK → cages.id, nullable)
├─ pair_date
├─ status
├─ notes
└─ created_at

breeding_rounds
├─ id (PK)
├─ account_id (FK → accounts.id)
├─ pair_id (FK → breeding_pairs.id)
├─ species_id (FK → species.id)
├─ cage_id (FK → cages.id, nullable)
├─ clutch_code
├─ nest_box
├─ date_started
├─ lay_date
├─ incubation_start_date
├─ expected_hatch_date
├─ actual_hatch_date
├─ total_eggs
├─ status
├─ notes
├─ created_at
└─ updated_at

breeding_eggs
├─ id (PK)
├─ account_id (FK → accounts.id)
├─ breeding_round_id (FK → breeding_rounds.id)
├─ egg_number
├─ lay_date
├─ hatch_date
├─ fertility
├─ outcome
├─ colour_notes
├─ comments
├─ created_at
└─ updated_at

incubation_records
├─ id (PK)
├─ account_id (FK → accounts.id)
├─ egg_id (FK → breeding_eggs.id)
├─ incubator_number
├─ date_set
├─ fertile_flag
├─ expected_hatch_date
├─ status
├─ notes
└─ created_at

incubation_logs
├─ id (PK)
├─ incubation_record_id (FK → incubation_records.id)
├─ log_date
├─ day_number
├─ weight
├─ temperature
├─ humidity
├─ comments
└─ created_at
```

## 2.5 Health layer

```text
bird_examinations
├─ id (PK)
├─ account_id (FK → accounts.id)
├─ flock_member_id (FK → flock_members.id, nullable)
├─ offspring_id (FK → offspring_records.id, nullable)
├─ exam_date
├─ weight
├─ body_score
├─ beak
├─ eyes
├─ nares
├─ ears
├─ chest
├─ abdomen
├─ vent
├─ back
├─ nails
├─ toes
├─ skin_legs_feet
├─ wings
├─ none_flags / structured body flags
├─ comments
├─ treatment
└─ created_at

bird_bloodwork
├─ id (PK)
├─ account_id (FK → accounts.id)
├─ flock_member_id (FK → flock_members.id, nullable)
├─ offspring_id (FK → offspring_records.id, nullable)
├─ sample_date
├─ glucose
├─ AST
├─ ALT
├─ gamma
├─ alk_ptse
├─ CK
├─ LDH
├─ cholesterol
├─ total_protein
├─ phosphorous
├─ calcium
├─ sodium
├─ potassium
├─ chloride
├─ bicarbonate
├─ uric_acid
├─ anion_gap
├─ bile_acid
├─ bilirubin
├─ white_blood_cell_ct
├─ hematocrit
├─ thrombocyte_est
├─ heterophils
├─ lymphocytes
├─ monocytes
├─ eosinophils
├─ basophils
├─ morphology
├─ notes
└─ created_at

bird_health_events
├─ id (PK)
├─ account_id (FK → accounts.id)
├─ flock_member_id (FK → flock_members.id, nullable)
├─ offspring_id (FK → offspring_records.id, nullable)
├─ event_type
├─ event_date
├─ title
├─ detail_notes
└─ created_at

ailment_reference
├─ id (PK)
├─ ailment_name
├─ symptoms
├─ description
├─ treatment
└─ created_at
```

## 2.6 Operations layer

```text
tasks
├─ id (PK)
├─ account_id (FK → accounts.id)
├─ target_type
├─ target_id
├─ periodicity
├─ task_description
├─ estimated_hours
├─ actual_hours
├─ last_completed
├─ next_date
├─ status
├─ comments
├─ reference
├─ materials_parts
└─ created_at

calendar_events
├─ id (PK)
├─ account_id (FK → accounts.id)
├─ source_type
├─ source_id
├─ event_date
├─ title
├─ event_type
├─ notes
└─ created_at
```

## 2.7 Commercial layer

```text
contacts
├─ id (PK)
├─ account_id (FK → accounts.id)
├─ address_type
├─ first_name
├─ last_name
├─ business_name
├─ street
├─ city
├─ state
├─ postal_code
├─ phone
├─ email
├─ notes
└─ created_at

bird_transactions
├─ id (PK)
├─ account_id (FK → accounts.id)
├─ flock_member_id (FK → flock_members.id)
├─ contact_id (FK → contacts.id, nullable)
├─ transaction_type
├─ transaction_date
├─ amount
├─ notes
└─ created_at

offspring_dispositions
├─ id (PK)
├─ account_id (FK → accounts.id)
├─ offspring_id (FK → offspring_records.id)
├─ contact_id (FK → contacts.id, nullable)
├─ disposition_status
├─ status_date
├─ sale_price
├─ notes
└─ created_at

invoices
├─ id (PK)
├─ account_id (FK → accounts.id)
├─ contact_id (FK → contacts.id)
├─ invoice_number
├─ invoice_date
├─ status
├─ total_amount
├─ notes
└─ created_at

invoice_items
├─ id (PK)
├─ invoice_id (FK → invoices.id)
├─ product_id (FK → products.id, nullable)
├─ service_id (FK → services.id, nullable)
├─ description
├─ quantity
├─ unit_price
├─ total_price
└─ created_at

products
├─ id (PK)
├─ account_id (FK → accounts.id)
├─ name
├─ sku
├─ default_price
└─ created_at

services
├─ id (PK)
├─ account_id (FK → accounts.id)
├─ name
├─ default_price
└─ created_at

expenditures
├─ id (PK)
├─ account_id (FK → accounts.id)
├─ expenditure_date
├─ category
├─ amount
├─ notes
└─ created_at
```

---

# 3. Target relationship tree

```text
accounts
├─ 1 → many account_users
├─ 1 → many flock_members
├─ 1 → many offspring_records
├─ 1 → many species
├─ 1 → many cages
├─ 1 → many rings
├─ 1 → many breeding_pairs
├─ 1 → many breeding_rounds
├─ 1 → many breeding_eggs
├─ 1 → many incubation_records
├─ 1 → many contacts
├─ 1 → many tasks
├─ 1 → many calendar_events
├─ 1 → many bird_examinations
├─ 1 → many bird_bloodwork
├─ 1 → many bird_health_events
├─ 1 → many bird_transactions
├─ 1 → many offspring_dispositions
└─ 1 → many invoices

flock_members
├─ 0/1 → father flock_member
├─ 0/1 → mother flock_member
├─ 1 → many breeding_pairs as father
├─ 1 → many breeding_pairs as mother
├─ 1 → many bird_pedigree rows
├─ 1 → many bird_examinations
├─ 1 → many bird_bloodwork
├─ 1 → many bird_health_events
├─ 1 → many bird_transactions
└─ 1 → many show_awards

breeding_pairs
└─ 1 → many breeding_rounds

breeding_rounds
└─ 1 → many breeding_eggs

breeding_eggs
├─ 0/1 → 1 offspring_record
└─ 0/1 → 1 incubation_record

incubation_records
└─ 1 → many incubation_logs

offspring_records
├─ 1 → many bird_examinations
├─ 1 → many bird_bloodwork
├─ 1 → many bird_health_events
└─ 1 → many offspring_dispositions

contacts
├─ 1 → many bird_transactions
├─ 1 → many offspring_dispositions
└─ 1 → many invoices

invoices
└─ 1 → many invoice_items
```

---

# 4. Practical summary

## Current app
- enough structure to keep building
- still partly form-driven
- still too flat in a few areas

## Target rebuild
- proper account ownership
- normalized flock, breeding, offspring, health, operations, and commercial layers
- much closer to the real legacy Bird Tracker shape

---

# 5. Recommended use of this document
Use this file as the working map for:
- current-state understanding
- future migrations
- deciding what should be a column versus a child table
- preventing the app from turning into one giant bird form again
