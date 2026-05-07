# Current App vs Bird Tracker Gap Checklist

Date: 2026-05-07
Status: Working checklist based on:
- current app implementation
- `docs/research/bird-tracker-schema-blueprint-2026-05-07.md`
- prior reverse-engineering notes and screenshots

## Purpose
This document is the practical build tracker.

It answers 3 questions for each area:
- what is already built
- what is only partly built
- what has not started yet

Legend:
- ✅ Built
- 🟡 Partly built
- ❌ Not started

---

# 1. Core Master Records

## 1.1 Birds / Flock Members
### Status: 🟡 Partly built

### ✅ Built
- bird master table exists
- register/edit/delete bird records
- bird profile popup exists
- ring selection from master list
- cage selection from master list
- species selection from master list
- ring-size filtering from species rules
- father / mother selectors exist
- pedigree popup exists
- profile includes many core fields:
  - species
  - ring number
  - cage number
  - clutch number
  - hatch date
  - sex
  - mutation
  - colour / base colour
  - genotype
  - phenotype
  - breeding status
  - breeding line
  - show quality
  - estimated value
  - photo
  - status
- grid view exists
- row-click editing exists
- calculated age display exists

### 🟡 Partly built
- direct parent links exist, but still need tighter sync with pedigree model
- profile fields exist, but some field meanings are still muddy/overlapping
- flock subtabs exist, but most are still structurally thin
- no advanced flock filters/search/grid actions yet like the old software
- unique internal id still exists behind the scenes even though ring number is the practical visible identifier

### ❌ Not started
- advanced flock grid filtering/search/export/print workflow
- true archive flow for birds
- lost/death lifecycle handling beyond basic status/date fields
- parent-raised / hand-raised style lifecycle options from the old system

---

## 1.2 Offspring
### Status: ❌ Not started

### ✅ Built
- none as a separate entity

### 🟡 Partly built
- egg records exist
- some offspring-like concepts are implied in breeding flow

### ❌ Not started
- separate `offspring` table/entity
- offspring profile workflow
- offspring background tab
- offspring health tab
- offspring diet tab
- offspring disposition tab
- promote/copy offspring into flock workflow
- hatch certificate / juvenile lifecycle flow

---

## 1.3 Species
### Status: 🟡 Partly built

### ✅ Built
- species table exists
- species master list UI exists
- editable species popup exists
- spreadsheet-backed species seed exists
- show/hide in dropdown exists
- ring size exists
- ring period label exists

### 🟡 Partly built
- species acting as rule/config table has started
- incubation and timing logic are not yet driven from species properly
- species is not yet driving event date workflows beyond ring-size filtering

### ❌ Not started
- fledging period rules
n- maturity period rules
- proper incubation-period-driven dashboards
- genetics rule libraries per species
- species mutation rule sets

---

## 1.4 Cages
### Status: 🟡 Partly built

### ✅ Built
- cages table exists
- cage master list exists
- add/edit popup exists
- bird records link to cage

### 🟡 Partly built
- cages are currently just reference records

### ❌ Not started
- cage occupancy view
- cage-linked task workflows
- cage history / cage movements
- nest box management tied to breeding

---

## 1.5 Rings
### Status: ✅ Built for current phase

### ✅ Built
- ring master table exists
- add/edit popup exists
- series creation exists
- ring size exists
- ring color/text/number exists
- material/type logic exists
- notes/spec workflow exists
- size-based stat chips exist
- rings filtered by species ring size in bird form
- used rings are excluded from selection

### 🟡 Partly built
- terminology internally still uses `band` in places

### ❌ Not started
- stronger normalization of material/type instead of notes synthesis
- clickable/filterable ring stats by size on the list page

---

## 1.6 Contacts
### Status: 🟡 Partly built

### ✅ Built
- contacts table exists in backend/export/import structure

### 🟡 Partly built
- contact model exists more than workflow does

### ❌ Not started
- contact management UI
- seller/buyer linking in bird sales/acquisition
- breeder/vet/customer tagging
- copy-to-contacts workflow like old app

---

# 2. Parentage and Pedigree

## 2.1 Direct parent links
### Status: 🟡 Partly built

### ✅ Built
- father and mother selectors on profile
- linked to internal bird records
- parent wording updated in UI

### 🟡 Partly built
- pedigree selections can carry back into profile selectors
- still slightly two-step in feel

### ❌ Not started
- full automatic persistence and reconciliation between pedigree save and parent fields
- validation against contradictory relationships / loops

---

## 2.2 Extended pedigree
### Status: 🟡 Partly built

### ✅ Built
- dedicated `bird_pedigree` backend model/table exists
- add pedigree popup exists
- tree-style layout exists
- supports:
  - father
  - mother
  - father’s father
  - father’s mother
  - mother’s father
  - mother’s mother
- supports linked birds
- supports manual ring/phenotype entries
- linked bird dropdowns filtered by sex
- current bird excluded from dropdowns

### 🟡 Partly built
- tree layout is present but still basic visually
- phenotype/ring snapshot fields exist but genotype is not yet included
- deeper auto-fill logic is limited

### ❌ Not started
- deeper-generation pedigree
- pedigree validation rules
- printable pedigree/report view
- auto-linking from existing ancestry where possible

---

# 3. Breeding Structure

## 3.1 Breeding pairs
### Status: 🟡 Partly built

### ✅ Built
- pairs table exists
- create/edit/delete pairs exists
- popup exists
- active/retired status exists

### 🟡 Partly built
- pair is still a lightweight record

### ❌ Not started
- cage/nest-box data on pairs
- richer pair history
- breeding compatibility/relationship checks

---

## 3.2 Breeding rounds / clutches
### Status: 🟡 Partly built

### ✅ Built
- clutch table exists
- clutch add/edit popup exists
- pair linkage exists
- lay date and hatch date exist

### 🟡 Partly built
- current clutch model is much thinner than old breeding record parent-information workflow

### ❌ Not started
- species in breeding round
- cage in breeding round
- nest box
- breeding status per round
- total eggs summary field
- incubation start date
- relationship check logic
- full event dates tab logic

---

## 3.3 Eggs / breeding results
### Status: 🟡 Partly built

### ✅ Built
- egg records exist
- egg number exists
- egg outcome exists
- eggs counted under clutches

### 🟡 Partly built
- eggs are present but not yet a rich breeding-results entity

### ❌ Not started
- lay date per egg
- hatch date per egg
- offspring creation from egg
- colours produced
- genotype prediction tied to result rows
- comments/history per egg

---

# 4. Incubation

## 4.1 Incubation records
### Status: ❌ Not started

### ✅ Built
- none

### 🟡 Partly built
- concept exists in research only

### ❌ Not started
- incubation table/entity
- incubator number
- fertile/hatched tracking in incubation workflow
- incubation comments

## 4.2 Incubation logs
### Status: ❌ Not started

### ❌ Not started
- repeated temperature/humidity/weight log rows
- incubation dashboard/workflow

---

# 5. Health and Veterinary

## 5.1 Health record
### Status: 🟡 Partly built

### ✅ Built
- health tab exists in bird popup
- placeholder fields exist for:
  - weekly weights
  - breeding problems
  - illness/treatments
  - cause of death

### 🟡 Partly built
- structure exists in UI only

### ❌ Not started
- dedicated health events table
- dated repeatable health records
- structured weight history
- structured illness/treatment log
- structured death/cause workflow

---

## 5.2 Examinations
### Status: 🟡 Partly built

### ✅ Built
- exam tab exists
- placeholder notes/labs fields exist

### 🟡 Partly built
- UI placeholder only

### ❌ Not started
- dedicated examinations table
- repeatable dated exams
- full old-software exam field set
- examiner tracking
- body score / feather condition structure

---

## 5.3 Bloodwork
### Status: ❌ Not started

### ❌ Not started
- bloodwork table
- bloodwork UI
- lab panel entry
- relation to birds/offspring

---

## 5.4 Ailment reference
### Status: ❌ Not started

### ❌ Not started
- ailment reference library in new app
- integration into health workflows

---

# 6. Diet

## 6.1 Bird diet
### Status: 🟡 Partly built

### ✅ Built
- diet tab exists
- placeholder diet plan / diet remarks fields exist

### 🟡 Partly built
- UI placeholder only

### ❌ Not started
- dedicated bird diet record/table
- structured fields for seeds/pulses/fruits/vegetables/misc
- repeatable diet revision workflow if desired

---

# 7. Sales, Acquisition, Disposition

## 7.1 Bird receipt / sales
### Status: 🟡 Partly built

### ✅ Built
- date received field
- purchase price field
- sold date field
- sale price field
- sales tab exists

### 🟡 Partly built
- current implementation is flat fields on the bird record

### ❌ Not started
- acquisition method
- seller/buyer contact linkage
- do-not-sell flag
- copy-to-contacts workflow
- event/history model for multiple transactions

---

## 7.2 Offspring disposition
### Status: ❌ Not started

### ❌ Not started
- committed flag
- committed to
- maturity date
- final status
- status date
- sale/disposition pipeline for offspring

---

# 8. Awards, Tasks, Calendar

## 8.1 Show awards
### Status: ❌ Not started

### ❌ Not started
- awards table
- awards UI
- bird-linked show history

## 8.2 Tasks
### Status: ❌ Not started

### ❌ Not started
- task table/workflow in app
- recurring operational tasks
- cage/bird linked tasks

## 8.3 Calendar
### Status: 🟡 Partly built

### ✅ Built
- calendar table rendering exists in app
- breeding-related calendar loading exists

### 🟡 Partly built
- currently lightweight and not a true old-software calendar system

### ❌ Not started
- milestone calendar logic from species rules
- task-driven calendar integration
- incubation and fledging due workflows

---

# 9. Dashboards and Operational Views

## 9.1 Main dashboard
### Status: 🟡 Partly built

### ✅ Built
- modern dashboard shell exists
- stats/cards/timeline/modules exist
- Animal HQ styling direction exists

### 🟡 Partly built
- some cards are still placeholders
- dashboards are lighter than old software’s operations-driven views

### ❌ Not started
- real due-date operational dashboards
- egg status views
- banding/ringing due
- fledging due
- overdue / due today buckets

## 9.2 Flock grid
### Status: 🟡 Partly built

### ✅ Built
- flock grid exists
- clickable rows exist
- photo thumbnail exists
- key columns exist

### 🟡 Partly built
- fewer power-user controls than old app

### ❌ Not started
- advanced search/filter/export/print/go-to-selected workflow

## 9.3 Egg status dashboard
### Status: ❌ Not started

### ❌ Not started
- egg status operational board
- due today / overdue / not due buckets
- hatchling milestone board

---

# 10. Genetics

## 10.1 Basic genetics
### Status: 🟡 Partly built

### ✅ Built
- simple genetics predictor exists
- COI calculator exists
- genotype/phenotype fields exist on birds

### 🟡 Partly built
- current genetics is basic and generic

### ❌ Not started
- species-aware genetics rules
- mutation libraries
- dominant/recessive/sex-linked rule engine
- recombinant/crossover logic
- prediction import from flock genotypes in the old-software style

---

# 11. Business/Admin Layer

## 11.1 Invoices
### Status: ❌ Not started

### ❌ Not started
- invoice header records
- invoice items
- contact linkage
- bird/offspring billing workflows

## 11.2 Products / Services / Expenditures
### Status: ❌ Not started

### ❌ Not started
- supporting business tables and UI

---

# 12. Backup / Operations / Platform

## 12.1 Backup and restore
### Status: ✅ Built

### ✅ Built
- account-level export/import exists
- covers main current tables
- supports redeploy protection

## 12.2 SaaS / accounts / permissions
### Status: 🟡 Partly built

### ✅ Built
- login/register exists
- subscription tiers exist
- current records are scoped by account/user

### 🟡 Partly built
- current ownership model still uses `user_id`

### ❌ Not started
- shared subscription/account workspace
- multiple logins per subscription
- platform admin layer
- subscription admin layer
- memberships/roles model

---

# 13. Recommended Next Build Order

## Best next structural steps
1. ❌ Build `offspring` as a real separate entity
2. 🟡 Upgrade `clutches` into full breeding rounds
3. 🟡 Expand `eggs` into richer breeding results
4. ❌ Build incubation records + logs
5. 🟡 Replace flock health/exam/diet placeholders with real child tables
6. 🟡 Replace flat sales fields with proper acquisition/sales/disposition workflows
7. ❌ Add egg status and milestone dashboards

---

# 14. Short Version

## Strongest areas right now
- rings
- bird profile foundation
- species/cage/ring master lists
- pedigree first pass
- backup/restore
- overall app shell

## Most incomplete but important areas
- offspring
- breeding rounds/results depth
- incubation
- health/examination structure
- sales/disposition structure
- operational dashboards

## Biggest missing entity
- `offspring`

That is still the most important architectural hole compared with the old software.
