# Bird Tracker Reconstruction Schema Blueprint

Date: 2026-05-07
Status: Working reconstruction blueprint based on MDB artifact analysis, extracted strings, screenshots, and observed workflows.

## Purpose
This document is the implementation map for rebuilding the old Bird Tracker product structure in the new Animal HQ Bird Tracker SaaS.

It is intended to stop piecemeal guessing and define:
- core entities
- likely foreign-key relationships
- workflow direction
- which fields are true source-of-truth records versus copied display values
- how the current app should evolve toward the old system

## Evidence Sources
Primary evidence used:
- `docs/source-database/BirdTracker.mdb`
- `docs/source-database/BirdTracker.strings.txt`
- `docs/research/bird-tracker-analysis-2026-05-04.md`
- screenshots listed in `docs/research/screenshots/manifest-2026-05-04.md`

## High-Level Product Model
Bird Tracker appears to be built around 3 layers.

### 1. Master records
Core long-lived entities.
- flock birds
- offspring
- contacts
- species
- cages / locations
- products / services / references

### 2. Transaction and lifecycle records
Repeatable operational records.
- breeding pairs
- breeding rounds / clutches
- eggs / breeding results
- incubation records
- incubation log entries
- examinations
- bloodwork
- acquisition / sale / disposition events
- tasks / calendar events
- awards / achievements

### 3. Operational dashboards and query views
Derived daily-use screens.
- egg status
- due for hatch
- due for banding / ringing
- due for fledging
- calendar
- search / export / print grids
- reports

## Core Architectural Conclusion
The old software is not just “a set of tabs”.
It is an entity-and-relationship system with forms layered on top.

The new app should follow that same direction.

---

# 1. Core Bird Entities

## 1.1 FlockMembers -> New app: `birds`
This is the permanent flock stock table.

### Role
Stores the main identity and lifecycle state of breeder-owned birds.

### Likely key fields
- internal bird id
- unique id (legacy app visible identifier)
- ring / band number
- species
- name
- cage id or cage number
- clutch number
- hatch date
- sex
- phenotype
- genotype
- breeding status
- breeding line
- show quality
- estimated value
- death date
- lost date
- parent references

### Likely direct relationships
- one bird -> many examinations
- one bird -> many bloodwork records
- one bird -> many health events
- one bird -> many awards
- one bird -> many acquisition / sale events
- one bird -> zero or many task/calendar items
- one bird -> zero or many pedigree rows
- one bird -> may appear as father in many breeding records
- one bird -> may appear as mother in many breeding records

### New app direction
Current `birds` table should stay the permanent master bird record table.
Ring number should be the main visible breeder identifier, even if an internal ID still exists.

---

## 1.2 OffspringRecords -> New app: `offspring`
This appears to be a separate young-bird table, not just another bird view.

### Role
Stores hatchlings and juvenile birds as a separate lifecycle pipeline before they become permanent flock stock or are sold.

### Likely key fields
- offspring id
- unique id
- ring number
- species
- name
- cage
- sex
- clutch number
- hatch date
- band / ring date
- fledging date
- handfed flag
- feeding notes
- phenotype
- genotype
- possible carrier genes
- parent references
- disposition status

### Likely direct relationships
- one offspring belongs to one breeding result / egg origin
- one offspring may have health records
- one offspring may have diet records
- one offspring may have disposition/sales records
- one offspring may later be promoted or copied to `birds`

### New app direction
Do not merge offspring straight into the permanent `birds` table if the goal is to mirror Bird Tracker properly.
Use a dedicated `offspring` table and lifecycle flow.

---

# 2. Parentage and Pedigree

## 2.1 Direct parent links -> New app: `birds.father_bird_id`, `birds.mother_bird_id` conceptually
The old app surfaces direct parent information on bird records.

### Role
Stores direct parent references for the current bird.

### Relationship
- one bird has zero or one father bird link
- one bird has zero or one mother bird link

### Note
The current app internally still uses `sire_id` / `dam_id` fields. These can remain internal for compatibility, but user-facing language should stay Father / Mother.

---

## 2.2 Extended pedigree -> New app: `bird_pedigree`
The old app clearly supports pedigree/genealogy access beyond just direct parents.

### Role
Stores explicit ancestor rows for profile pedigree display.

### Recommended fields
- id
- account / owner id
- bird_id
- relation_key
  - father
  - mother
  - father_father
  - father_mother
  - mother_father
  - mother_mother
- linked_bird_id nullable
- ring_number snapshot
- phenotype snapshot
- genotype snapshot later if needed
- created_at
- updated_at

### Relationship
- one bird -> many pedigree rows
- one pedigree row may optionally point to a real internal bird record
- rows may also be manual-only for external ancestors not registered in flock

### Why this matters
This allows both:
- internal linked pedigree
- external/manual pedigree

That is the correct long-term model.

---

# 3. Breeding Structure

## 3.1 BreedingPairs -> New app: `breeding_pairs`
This appears to be the parent setup table for a mating pair.

### Role
Stores a current or historical father/mother pairing.

### Likely fields
- pair id
- father bird id
- mother bird id
- pair date
- cage / location
- nest box
- active/retired status

### Relationship
- one pair references one father bird
- one pair references one mother bird
- one pair may have many breeding rounds / clutches over time

### New app note
Current `pairs` table is roughly in the right direction, but should grow into a fuller breeding setup entity.

---

## 3.2 BreedingResults / Parent Information -> New app: `breeding_rounds` or `clutches`
The screenshots suggest Bird Tracker has a breeding record that is more than just the pair itself.

### Role
Stores a specific breeding round / clutch event under a pair.

### Likely fields
- breeding round id
- pair id
- clutch number
- species
- father bird id
- mother bird id
- cage id / cage number
- date started
- nest box
- breeding status
- total eggs
- incubation start date
- relationship check flag/result

### Relationship
- one breeding pair -> many breeding rounds
- one breeding round -> many egg/result rows

### New app note
Current `clutches` table is close to this concept, but it should become the richer “breeding round” entity.

---

## 3.3 BreedingResults detail / eggs -> New app: `breeding_eggs`
The old software likely stores each egg as a child result row.

### Role
Stores egg-level details and hatch outcomes under a breeding round.

### Likely fields
- egg id
- breeding round id
- egg number
- lay date
- status
- hatch date
- offspring id nullable
- colours produced
- genotype prediction result reference or snapshot
- comments

### Relationship
- one breeding round -> many eggs
- one egg -> zero or one offspring
- one egg -> zero or one incubation record

### New app note
Current `eggs` table is the beginning of this, but it needs more attributes and a stronger link to outcomes.

---

# 4. Incubation Structure

## 4.1 Incubation -> New app: `incubation_records`
Incubation appears to be its own operational entity.

### Role
Tracks eggs placed into incubators and their incubation settings/status.

### Likely fields
- incubation record id
- egg id
- species
- clutch number
- incubator number
- date laid
- fertile flag
- hatched flag
- father bird id snapshot or reference
- mother bird id snapshot or reference
- comments

### Relationship
- one egg -> zero or one incubation record

---

## 4.2 Incubation logs -> New app: `incubation_logs`
### Role
Stores repeated environmental measurements and checkpoints.

### Likely fields
- incubation log id
- incubation record id
- log date
- log time
- day number
- weight
- temperature
- humidity
- comments

### Relationship
- one incubation record -> many incubation log rows

### New app note
This should not be flattened into the egg row. It needs a child log table.

---

# 5. Health and Veterinary Structure

## 5.1 Examination -> New app: `bird_examinations`
The old software clearly has repeatable examinations.

### Role
Stores dated physical exams.

### Likely fields
- examination id
- bird id or offspring id
- exam date
- eyes_ears
- beak_oral
- abdomen_cloaca
- feet_legs
- serum
- vitamin_d
- vaccines
- cultures
- body_score
- weight
- feather_condition
- examiner
- notes

### Relationship
- one bird -> many examinations
- one offspring -> many examinations

### New app note
This should become its own repeatable table, not just one exam notes text area.

---

## 5.2 BloodWork -> New app: `bird_bloodwork`
### Role
Stores lab panel records.

### Likely fields
- bloodwork id
- bird id or offspring id
- sample date
- glucose
- AST
- ALT
- gamma
- alk phosphatase
- CK
- LDH
- cholesterol
- total protein
- phosphorous
- calcium
- sodium
- potassium
- chloride
- bicarbonate
- uric acid
- bile acid
- bilirubin
- white blood cell count
- hematocrit
- thrombocyte estimate
- heterophils
- comments

### Relationship
- one bird -> many bloodwork records

---

## 5.3 Health record summary -> New app: `bird_health_events`
The flock and offspring health tabs look like summaries of multiple event types.

### Role
Stores dated health/lifecycle events.

### Likely fields
- health event id
- bird id or offspring id
- event type
  - birth_problem
  - nest_problem
  - illness
  - treatment
  - breeding_problem
  - cause_of_death
  - weight_check
- event date
- title / short label
- detail notes
- weight value if relevant

### Relationship
- one bird -> many health events

### New app note
This is likely a better structure than putting everything into one giant health note field.

---

## 5.4 Ailment -> New app: `ailment_reference`
### Role
Reference library of diseases/ailments and treatments.

### Likely fields
- ailment id
- ailment name
- description
- symptoms
- treatment

### Relationship
This is a standalone reference table, not the same as a bird’s individual illness history.

---

# 6. Diet Structure

## 6.1 Bird diet profile -> New app: `bird_diets`
The old tabs show diet fields as a grouped section.

### Role
Stores diet composition and remarks for a bird or offspring.

### Likely fields
- bird diet id
- bird id or offspring id
- seeds
- pulses
- fruits
- vegetables
- misc
- remarks
- updated_at

### Relationship
- one bird -> one current diet profile, or possibly many revisions if versioned later

### New app note
Phase 1 can store a single current diet record per bird.

---

# 7. Acquisition, Sales, and Disposition

## 7.1 Bird acquisitions/sales -> New app: `bird_transactions`
The flock receipt/sales tab is too rich to remain flat fields forever.

### Role
Stores commercial lifecycle events for permanent birds.

### Likely event types
- acquired
- received
- sold
- transferred
- reserved

### Likely fields
- transaction id
- bird id
- transaction type
- transaction date
- acquisition method
- amount
- contact id nullable
- contact snapshot text
- do_not_sell flag where relevant
- notes

### Relationship
- one bird -> many transaction records

### New app note
Phase 1 can still keep current flat fields on birds, but the long-term model should move to transaction rows.

---

## 7.2 Offspring disposition -> New app: `offspring_dispositions`
### Role
Stores the commercial pipeline for young birds.

### Likely fields
- disposition id
- offspring id
- committed flag
- committed_to_contact_id
- sale price
- maturity date
- final status
- status date
- notes

### Relationship
- one offspring -> many disposition updates, or one current disposition plus event history

---

## 7.3 Contacts -> New app: `contacts`
### Role
Shared people/business table used by acquisition, sale, disposition, invoicing, and maybe breeder/vet references.

### Likely fields
- contact id
- address type
- first name
- last name
- business name
- street
- city
- state
- postal code
- phone
- email
- notes

### Relationship
- one contact -> many bird transactions
- one contact -> many offspring dispositions
- one contact -> many invoices

---

# 8. Awards, Tasks, and Scheduling

## 8.1 ShowAwards -> New app: `show_awards`
### Role
Tracks show results and awards for birds.

### Likely fields
- award id
- bird id
- show name
- category
- date
- placing / result
- notes

### Relationship
- one bird -> many awards

---

## 8.2 Tasks -> New app: `tasks`
MDB strings show task fields tied to Cage/Bird ID.

### Role
Stores operational follow-up and recurring tasks.

### Likely fields
- task id
- target_type (bird, cage, clutch, incubator)
- target_id
- periodicity
- task description
- estimated hours
- actual hours
- last completed
- next date
- status
- comments
- materials / reference

### Relationship
- one target entity -> many tasks

---

## 8.3 Calendar -> New app: `calendar_events`
### Role
Stores or derives dated reminders and milestones.

### Likely sources
- breeding rounds
- eggs
- incubation records
- tasks
- sale/maturity/disposition dates

### Note
Some calendar items may be generated views rather than manually entered rows.

---

# 9. Commercial and Admin Tables

## 9.1 Invoices -> New app: `invoices`
### Role
Invoice header records.

### Likely fields
- invoice id
- invoice number
- contact id
- invoice date
- status
- totals
- notes

### Relationship
- one invoice -> many invoice items

### Evidence
MDB strings clearly suggest `Invoices -> InvoiceItems` by invoice number.

---

## 9.2 InvoiceItems -> New app: `invoice_items`
### Role
Line items under invoice headers.

### Likely fields
- invoice item id
- invoice id or invoice number
- product/service id nullable
- description
- quantity
- unit price
- total
- linked bird / offspring if relevant

### Relationship
- many invoice items -> one invoice

---

## 9.3 Products / Services / Expenditures -> New app supporting tables
### Role
Support the business side of the breeder operation.

### Likely tables
- products
- services
- expenditures

These are secondary to the biological workflow but still part of the original product scope.

---

# 10. Species as a Rule Table

## 10.1 Species -> New app: `species`
The old software appears to use species as more than a dropdown label.

### Role
Species acts as a rule/config record.

### Likely fields
- species id
- species name
- incubation period
- ring / banding period
- fledging period
- maturity period
- ring size
- mutation rule references or genotype rule sets
- species number
- phenotype defaults or valid options

### Relationship
- one species -> many birds
- one species -> many offspring
- one species -> many breeding rounds

### New app note
Species should eventually drive:
- ring size filtering
- expected hatch dates
- ringing due dates
- fledging due dates
- genetics options

---

# 11. Where the old app likely uses IDs versus copied values

## True relational links
These are the values most likely stored as real keys:
- bird id
- offspring id
- pair id
- breeding round id
- egg id
- incubation record id
- contact id
- invoice id / invoice number
- product/service ids

## Display snapshots copied into forms/reports
These are likely repeated for user convenience even when a link exists:
- ring number
- bird name
- phenotype
- genotype
- species name
- clutch number
- cage number

### Why this matters
The new app should do both:
- use internal IDs for real joins
- keep important visible breeder fields available in reports/UI snapshots where useful

---

# 12. Mapping from current app to target architecture

## Already present in current app
- `birds`
- `species`
- `cages`
- `bands` / rings
- `pairs`
- `clutches`
- `eggs`
- `contacts`
- `bird_pedigree`
- backup/import/export

## Present but still structurally thin
- bird profile subtabs
- breeding records
- egg workflows
- parent/pedigree linkage

## Missing major target entities
- `offspring`
- `breeding_rounds` richer model or upgraded `clutches`
- richer `breeding_eggs`
- `incubation_records`
- `incubation_logs`
- `bird_examinations`
- `bird_bloodwork`
- `bird_health_events`
- `bird_diets`
- `bird_transactions`
- `offspring_dispositions`
- `show_awards`
- `tasks`
- `calendar_events`
- `invoices`
- `invoice_items`

---

# 13. Recommended implementation order

## Phase A: stabilize core bird architecture
1. keep improving `birds`
2. finish direct parent and pedigree linkage
3. clean overlapping profile fields
4. make flock record tabs persist in real structures

## Phase B: build breeding correctly
1. upgrade `clutches` into richer breeding rounds
2. expand `eggs` into proper breeding egg results
3. add expected date calculations from species
4. add offspring creation from eggs

## Phase C: build offspring as separate lifecycle entity
1. create `offspring`
2. link offspring back to egg origin
3. add disposition workflow
4. add promote/copy to flock action when retained

## Phase D: build incubation
1. add `incubation_records`
2. add `incubation_logs`
3. build egg status dashboard and due-date views

## Phase E: build health and veterinary records
1. examinations
2. bloodwork
3. health events
4. ailment library integration

## Phase F: commercial/admin layer
1. bird transactions
2. contacts linkage
3. invoices + invoice items
4. expenditures/products/services if desired

---

# 14. Practical design rule for the rebuild
When unsure where something belongs, ask this:

- Is it a permanent property of the bird?
  - store on `birds`
- Is it a repeated event over time?
  - make a child table
- Is it a clutch/egg/incubation process item?
  - store under breeding/incubation entities
- Is it a business person/company?
  - store in `contacts`
- Is it just a calculated daily operations screen?
  - build it as a dashboard/query view, not a master table

That rule will keep the new system from turning into another confusing form dump.

---

# 15. Immediate next build recommendation
The next most valuable structural step is:

## Build `offspring` as a real separate entity
Why:
- the old software clearly treats offspring separately from flock members
- many confusing downstream links make more sense once offspring exists
- breeding results, egg outcomes, disposition, and promotion to flock all depend on this split

After that:
- upgrade breeding rounds / eggs
- then incubation

---

# 16. Summary
The old Bird Tracker product appears to be built around:
- permanent flock birds
- separate offspring lifecycle records
- breeding pair + breeding round + egg result structure
- separate incubation records and logs
- repeatable exam/health/lab records
- contacts and commercial workflows
- dashboards derived from those entities

That is the model the new app should now follow.
