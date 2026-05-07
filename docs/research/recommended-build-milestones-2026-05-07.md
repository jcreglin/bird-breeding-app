# Recommended Build Milestones

Date: 2026-05-07
Status: Recommended delivery sequence based on:
- `docs/research/bird-tracker-schema-blueprint-2026-05-07.md`
- `docs/research/current-app-gap-checklist-2026-05-07.md`

## Purpose
This document converts the gap checklist into a practical build roadmap.

The goal is to:
- reduce confusion about what to build next
- group related work together
- avoid building UI fragments before the underlying entities exist
- follow the way Bird Tracker actually appears to be structured

---

# Guiding Rule
Build **entities and workflows first**, then polish tabs and dashboards on top.

If we build too much tab UI before the underlying records exist, the app gets messy and contradictory.

---

# Milestone 1: Offspring Foundation
## Priority: Highest

## Why first
This is the biggest structural gap between the current app and the old software.
A lot of later workflows make more sense once offspring exists as its own lifecycle entity.

## Goal
Create a real `offspring` entity and basic offspring workflow.

## Deliverables
- new `offspring` table/entity
- offspring list/grid
- offspring popup/module
- offspring profile fields:
  - species
  - ring number
  - name
  - cage
  - sex
  - clutch number
  - hatch date
  - band/ring date
  - fledging date
  - phenotype
  - genotype
  - possible carrier genes
- offspring parent background section
- basic offspring disposition/status fields
- ability to create offspring from breeding egg/result
- ability to retain/promote offspring into flock later

## Result
The app stops forcing everything into the permanent flock table and starts matching the real Bird Tracker lifecycle.

---

# Milestone 2: Breeding Rounds and Egg Results
## Priority: Highest

## Why second
Once offspring exists, breeding can be rebuilt properly around rounds/clutches and egg outcomes.

## Goal
Upgrade the current lightweight clutch/egg model into a real breeding workflow.

## Deliverables
- expand current `clutches` into richer `breeding_rounds`
- add missing breeding-round fields:
  - clutch number
  - species
  - cage
  - nest box
  - breeding status
  - total eggs
  - incubation start date
  - relationship check
- expand `eggs` into richer breeding result rows:
  - egg number
  - lay date
  - hatch date
  - status
  - comments
  - colours produced
  - offspring link
- add a clearer breeding result grid
- create offspring directly from successful egg results

## Result
Breeding becomes a real process flow instead of just pairs + thin clutch rows.

---

# Milestone 3: Incubation Module
## Priority: Very high

## Why third
The old software treats incubation as a separate operational workflow, not just a checkbox on eggs.

## Goal
Add incubation records and repeated incubation logging.

## Deliverables
- `incubation_records` table/entity
- incubator number
- fertile / hatched flags
- incubation record popup/grid
- `incubation_logs` child table
- log entries for:
  - date
  - time
  - day
  - weight
  - temperature
  - humidity
  - comments
- link incubation to breeding egg/result rows

## Result
Egg handling becomes operationally useful, not just historical.

---

# Milestone 4: Egg Status and Milestone Dashboards
## Priority: Very high

## Why fourth
Once breeding and incubation are properly modeled, the app can generate the same kind of operational boards the old software had.

## Goal
Build daily-use dashboards based on dates and species rules.

## Deliverables
- egg status board
- due today / overdue / not due views
- hatchling milestone board
- due for ringing/banding
- due for fledging
- expected hatch date calculation
- species-driven date logic where available
- better calendar outputs from breeding/incubation data

## Result
The app starts feeling like an active breeder tool, not just a record keeper.

---

# Milestone 5: Flock Health and Examinations
## Priority: High

## Why fifth
The flock tabs already exist, but the underlying structures do not. This milestone makes those tabs real.

## Goal
Replace placeholder health/exam text areas with proper child records.

## Deliverables
- `bird_health_events`
- `bird_examinations`
- dated repeatable weight entries
- illness/treatment history
- breeding problem records
- cause-of-death records
- full exam structure closer to old software:
  - eyes/ears
  - beak/oral
  - abdomen/cloaca
  - feet/legs
  - serum
  - vitamin D
  - vaccines
  - cultures
  - body score
  - weight
  - feather condition
  - examiner
  - notes

## Result
The flock health-related tabs become real records instead of placeholders.

---

# Milestone 6: Bloodwork and Ailment Library
## Priority: Medium-high

## Goal
Add deeper vet/lab support.

## Deliverables
- `bird_bloodwork`
- bloodwork popup/grid/history
- lab panel fields
- `ailment_reference` library
- optional linking from health records to ailment references

## Result
The app starts to match the more advanced health features of Bird Tracker.

---

# Milestone 7: Diet Records
## Priority: Medium

## Goal
Make diet a real structured section.

## Deliverables
- `bird_diets`
- structured fields for:
  - seeds
  - pulses
  - fruits
  - vegetables
  - misc
  - remarks
- optionally allow later versioning/history of diet changes

## Result
Diet becomes breeder-usable and not just a generic notes area.

---

# Milestone 8: Sales, Acquisition, and Disposition Workflows
## Priority: High

## Why not earlier
Important, but should come after offspring and breeding structure so the lifecycle is clearer.

## Goal
Model commercial lifecycle properly.

## Deliverables
- `bird_transactions`
- acquisition records
- sale records
- seller/buyer contact linkage
- acquisition method
- do-not-sell flag
- copy-to-contacts workflow
- `offspring_dispositions`
- committed / reserved / sold pipeline for offspring

## Result
Bird ownership and sale history become proper events, not flat fields.

---

# Milestone 9: Contacts Module
## Priority: Medium-high

## Goal
Add usable contact management to support sales and breeder operations.

## Deliverables
- contacts UI
- breeder/customer/vet/seller/buyer tagging
- contact search/edit
- link contacts to transactions, offspring disposition, invoices later

## Result
Contacts become a real shared business layer instead of a dormant table.

---

# Milestone 10: Flock Grid Power Tools
## Priority: Medium-high

## Goal
Lift the flock list closer to the old software’s operational usability.

## Deliverables
- search
- filters:
  - species
  - cage
  - sex
  - breeding status
  - status
- sort improvements
- export
- print
- selected-record navigation style improvements

## Result
The flock list becomes a real management screen for larger bird counts.

---

# Milestone 11: Genetics Expansion
## Priority: Medium-high

## Goal
Move from simple genetics helpers toward species-aware prediction.

## Deliverables
- species-aware mutation rules
- dominant/recessive logic
- sex-linked logic
- better genotype prediction flow
- flock import of parent genotype data
- better display of predicted offspring outcomes

## Result
Genetics becomes a real differentiator rather than a stub utility.

---

# Milestone 12: Tasks and Calendar System
## Priority: Medium

## Goal
Add operational scheduling around birds, cages, breeding, and incubation.

## Deliverables
- task table/workflow
- periodicity
- next due dates
- completion history
- cage-linked and bird-linked tasks
- calendar integration

## Result
The app becomes more proactive and operations-driven.

---

# Milestone 13: Show Awards
## Priority: Lower-medium

## Goal
Track exhibition/show performance.

## Deliverables
- awards table
- award entry popup/grid
- bird-linked show history

## Result
Useful specialist feature, but not as urgent as offspring/breeding/incubation.

---

# Milestone 14: Invoices, Products, Services, Expenditures
## Priority: Lower-medium

## Goal
Add the broader breeder business/admin layer.

## Deliverables
- invoices
- invoice items
- products
- services
- expenditures
- contact linkage

## Result
Matches the broader old-software scope, but should come after core breeding workflows.

---

# Milestone 15: Account / Subscription Architecture Upgrade
## Priority: Strategic

## Goal
Refactor from user-owned records to shared subscription/account-owned workspaces.

## Deliverables
- account/subscription entity
- memberships
- multiple logins per subscription
- platform admin
- subscription admin
- shared breeder workspace ownership

## Note
This is strategically important but can be staged carefully so it does not derail feature delivery.

---

# Suggested Real Build Sequence
If we want the cleanest practical order, I’d do this:

## Phase 1
- Milestone 1: Offspring Foundation
- Milestone 2: Breeding Rounds and Egg Results
- Milestone 3: Incubation Module
- Milestone 4: Egg Status and Milestone Dashboards

## Phase 2
- Milestone 5: Flock Health and Examinations
- Milestone 6: Bloodwork and Ailment Library
- Milestone 7: Diet Records
- Milestone 8: Sales, Acquisition, and Disposition Workflows
- Milestone 9: Contacts Module

## Phase 3
- Milestone 10: Flock Grid Power Tools
- Milestone 11: Genetics Expansion
- Milestone 12: Tasks and Calendar System
- Milestone 13: Show Awards
- Milestone 14: Invoices, Products, Services, Expenditures

## Parallel strategic stream
- Milestone 15: Account / Subscription Architecture Upgrade

---

# Recommended Immediate Next Milestone
## Build next: Milestone 1, Offspring Foundation

### Why
- biggest structural hole right now
- unlocks proper breeding results workflow
- makes incubation and disposition make sense
- best match to the old software’s real architecture

### After that
- Milestone 2
- Milestone 3
- Milestone 4

That gives the strongest core breeder workflow fastest.

---

# Short Version
If we keep this simple:

## Next 4 milestones to build
1. Offspring
2. Better breeding rounds + egg results
3. Incubation
4. Egg status dashboards

That is the cleanest path forward.
