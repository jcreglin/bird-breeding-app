# Bird Breeding App

A simple MVP for a subscription-ready bird breeding tracker.

## Features

- Email/password login and registration
- Per-user data isolation
- Bird / flock management
- Pair management
- Clutch tracking
- Simple COI calculator
- Subscription tiers with bird limits

## Stack

- Node.js
- Express
- SQLite via better-sqlite3
- Vanilla HTML/CSS/JS frontend

## Run locally

```bash
cd /data/.openclaw/workspace/bird-breeding-app
npm install
node server.js
```

Then open:

- <http://localhost:3000>

## Notes

- This is an MVP starter, not production hardened yet.
- JWT secret in `server.js` should be moved to environment variables.
- Stripe is not wired yet, only the subscription structure and bird limits are in place.
- SQLite is fine for MVP testing. For SaaS scale, move to PostgreSQL.

## Suggested next steps

1. Stripe checkout + webhooks
2. Better genetics engine
3. Calendar reminders
4. Photos/uploads
5. Contacts, health, and sales modules
6. Admin/superadmin tenant tools
