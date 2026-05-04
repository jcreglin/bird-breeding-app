# Bird Tracker Reverse-Engineering Notes

Date: 2026-05-04
Source: Jason walkthrough + screenshots from Bird Tracker software

## Goal
Preserve all observed product structure, workflow ideas, and screenshot references so the new bird breeding SaaS can be rebuilt against a real blueprint.

## Competitor / Reference Context
Primary reference software examined:
- Bird Tracker by Cabin Software
- Commercial desktop app
- Known positioning includes genetics predictor, breeding records, flock records, offspring, incubation, reports, contacts, invoicing, and breeder operations tools

Related products noted during research:
- BirdTracks
- Birds Evolution Pro
- Aviora
- FarmKeep

## Main Screen Modules Observed
The Bird Tracker main screen exposes these areas:
- Flock Records
- Breeding Records
- Offspring Records
- Incubation Records
- Egg Status
- Breeding Assistant
- Genetic Predictions
- Photo Gallery
- Show Awards
- Contacts
- Invoices
- Reference Material
- Expenditures
- Internet Sites
- Products and Services
- Ailments
- Accounts
- Reports
- Documents
- Calendar
- Task Scheduler
- Archives
- Logbook
- User Reports

## Product Interpretation
The product is not just a breeding notebook.
It combines:
- biological records
- breeding operations
- genetics
- incubation workflows
- commercial/sales/admin tools
- reminders and dashboards
- print/report output

## Flock Record Structure
Each flock record has 6 tabs.

### 1. Profile
Observed fields/functions:
- unique ID
- species
- name
- band number
- cage number
- clutch number
- hatch date
- age
- sex
- show quality
- estimated value
- breeding status
- phenotype
- genotype
- parent raised
- death date
- lost date
- pedigree / genealogy access

Interpretation:
- this is the core master bird identity record
- needs genetics, location, lifecycle, and breeding status in one place

### 2. Receipt / Sales
Observed fields/functions:
- date received
- acquisition method
- cost
- seller details
- buyer details
- sale date
- sale price
- do not sell flag
- copy to contacts

Interpretation:
- birds are treated as commercial assets with ownership history
- acquisition and sale should be event/history based, not one flat note

### 3. Health Record
Observed fields/functions:
- birth problems
- nest problems
- weekly weights
- 1 year weight
- illness / treatments
- breeding problems
- health comments
- cause of death

Interpretation:
- requires structured health/lifecycle tracking, not just a single notes field

### 4. Examinations
Observed fields/functions:
- physical exam date
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

Interpretation:
- should be repeatable exam records tied to the bird

### 5. Diet
Observed fields/functions:
- seeds
- pulses
- fruits
- vegetables
- misc
- remarks

### 6. Other Information
Observed fields/functions:
- general comments
- breeding line
- user defined fields 1-5

Interpretation:
- custom fields are important for breeder flexibility

## Flock Grid View
Observed columns across screenshots:
- Species
- Unique ID
- Name
- Band Number
- Cage Number
- Phenotype
- Genotype
- Sex
- Breeding Status
- Clutch Number
- Hatch Date

Observed grid capabilities:
- sort by column
- search/filter by column
- export
- print
- go to selected record
- record count

Interpretation:
- the app needs both record view and high-utility grid view
- grid is likely the primary power-user operational screen

## Breeding Records Structure
The breeding module has 3 tabs.

### 1. Parent Information
Observed fields/functions:
- clutch number
- species
- male bird unique ID
- male name
- male band number
- female bird unique ID
- female name
- female band number
- cage
- date
- nest box
- breeding status
- total eggs
- incubation start date
- relationship check
- open breeding / active setup logic

Interpretation:
- this is a breeding round / clutch record, not just a pair record

### 2. Breeding Results
Observed structure:
- egg #
- lay date
- status
- hatch date
- offspring unique ID
- offspring name
- offspring band number
- colors produced
- comments
- genotype prediction button

Interpretation:
- each breeding round contains multiple eggs
- eggs can hatch into offspring records
- genetics outcomes are tied directly to results

### 3. Event Dates
Observed purpose:
- expected hatch dates
- banding dates
- fledging dates

Interpretation:
- should be system-generated milestone dates with manual override capability

## Offspring Records Structure
The offspring module has 5 tabs.

### 1. Profile
Observed fields/functions:
- unique ID
- species
- name
- band number
- cage number
- sex
- clutch number
- handfed
- feeding
- hatched
- age
- banding date
- fledging date
- hatch certificate photo
- phenotype
- genotype
- possible carrier genes

Interpretation:
- offspring are full young-bird records, not just egg outcomes

### 2. Background
Observed fields/functions:
- male parent unique ID, name, band number, phenotype, genotype
- female parent unique ID, name, band number, phenotype, genotype
- breeding line
- comments

Interpretation:
- offspring should inherit lineage from breeding events automatically

### 3. Health Record
Observed fields/functions:
- birth problems
- nest problems
- illness
- weekly weights
- 1 year weight
- date of death
- cause of death

### 4. Diet
Observed fields/functions:
- seeds
- pulses
- fruits
- vegetables
- misc
- remarks

### 5. Disposition
Observed fields/functions:
- committed
- committed to
- buyer/customer details
- sale price
- maturity date
- final status
- status date
- copy to contacts

Interpretation:
- offspring move through a sale/disposition pipeline before becoming permanent flock stock or sold birds
- workflow hints include copy/move to flock records

## Incubation Record Structure
Observed fields/functions:
- egg ID
- species
- clutch number
- incubator number
- date laid
- fertile flag
- hatched flag
- male parent ID
- male parent band number
- female parent ID
- female parent band number
- comments

Observed incubation log table:
- date
- time
- day
- weight
- temperature
- humidity

Interpretation:
- incubation is a separate operational record tied to an egg
- incubation should support repeated log entries over time

## Egg Status Dashboard
Observed columns:
- Species
- Incubation Period
- Clutch Number
- Egg #
- Laid Date
- Cage Number
- Male Unique ID
- Female Unique ID
- Expected Hatch Date

Observed dashboard views:
- Eggs without status: Due Today, Overdue, Not Due Yet, All Eggs
- Hatchlings: All, Due for Banding, Due for Fledging

Observed capabilities:
- sort
- search
- print/delete
- go to selected record
- total record count

Interpretation:
- this is a daily operations board, not just a data grid
- reminders and milestone-driven views are core product behavior

## Genetic Predictions Module
Observed inputs:
- species
- male unique ID
- male band number
- male genotype
- female unique ID
- female band number
- female genotype
- import flock member genotype
- select genotype manually

Observed outputs/actions:
- calculate offspring genetic make-up (genotype)
- view/edit
- reset
- offspring genotype results
- recombinant / crossover listing if relevant

Interpretation:
- this is a species-aware genetics rules engine
- likely requires sex-linked inheritance, mutation libraries, dominant/recessive rules, split/carrier handling, and recombination logic
- this should be treated as a premium differentiator and phased in carefully

## Architectural Conclusions
The observed product naturally breaks into 3 layers.

### 1. Master Records
- flock birds
- offspring
- contacts

### 2. Transaction / Lifecycle Records
- breeding rounds / clutches
- eggs
- incubation records
- acquisition / sales / disposition
- health events / exams

### 3. Operational Dashboards
- egg status
- hatch dates due
- banding due
- fledging due
- calendar / reminders
- reports / exports

## Recommended Data Model Direction
### Birds
Master bird records for permanent flock stock.

### Breeding Rounds
Main breeding event containing parents, cage, nest, dates, status.

### Eggs
Child records inside a breeding round.

### Offspring
Young bird records created from eggs, with later promotion/copy to flock.

### Incubation
Optional incubation records linked to eggs.

### Health / Exams
Repeatable records linked to birds and offspring.

### Sales / Acquisition / Disposition
Lifecycle events linked to birds and offspring.

### Genetics
Phase 1: phenotype/genotype fields, simple inheritance, COI/relatedness warnings.
Phase 2: species libraries, sex-linked logic, advanced prediction, recombination.

## Product / Tiering Insight
Potential commercial split:

### Lower tier / starter
- flock records
- breeding rounds
- offspring
- egg tracking
- basic dashboards

### Higher tier / pro
- incubation logs
- advanced genetics
- advanced reports
- sales/disposition workflows
- deeper health/exam records

## Suggested Build Order
### V2 Core
- flock records with tabbed detail
- flock grid
- breeding rounds
- eggs
- offspring records
- egg status dashboard
- incubation logs

### V3 Expansion
- genetics engine
- contacts/sales
- health/examinations
- reports
- billing tiers / subscription logic refinement

## Screenshot Asset Inventory
These screenshots were provided and should be retained with this research:
- main screen
- 6 flock record tabs
- flock grid view screenshots
- breeding record screenshots
- offspring record screenshots
- incubation record screenshot
- egg status screenshot
- genetic predictions screenshot

See also:
- `docs/research/screenshots/manifest-2026-05-04.md`
- screenshot files in `docs/research/screenshots/`
