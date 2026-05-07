# Real Record Architecture Map

Date: 2026-05-08
Status: Derived from the real-record Access database copy supplied by Jason.

## Why this doc exists
The earlier Bird Tracker reconstruction was directionally useful, but still too disjointed.
This document replaces that loose picture with a cleaner architecture model based on the database that contains real production records.

## Main conclusion
The legacy Bird Tracker product is a record-driven breeder workspace.
It is not just one bird form with extra tabs.

The app is structured around:
- a core flock member record
- separate breeding workflow records
- separate offspring records
- separate health and lab records
- separate operational records like tasks/calendar
- separate commercial/supporting records like contacts and invoices

That means the new Animal HQ Bird Tracker should be rebuilt as linked modules around the flock record, not as one oversized form.

---

## 1. Confirmed module families from the real database

### Core breeder records
- FlockMembers
- Species
- Cage Number / Cage_Number
- Band Number / Band_Number
- BreedingLine

### Breeding workflow records
- BreedingPairs
- BreedingResults
- BreedingResultsArchive
- OffspringRecords
- Incubation

### Health and medical records
- Examination
- ExaminationArchive
- BloodWork
- BloodWorkArchive
- BloodWorkDefault
- Ailment

### Operational records
- Task
- Calendar
- Boarding

### Commercial/supporting records
- Contacts
- ContactTemp
- Invoices
- InvoiceItems
- Orders
- Products
- Services
- Expenditures

---

## 2. What the real data clarifies

### 2.1 FlockMembers is the centre of gravity
The database repeatedly exposes bird-centric labels like:
- Unique ID
- Species
- Band Number
- Cage Number

This confirms the permanent flock record is the hub, and other modules hang off it.

### 2.2 Offspring is genuinely separate
`OffspringRecords` appears as a distinct module, not just a filtered flock view.
That validates keeping offspring as a separate lifecycle pipeline.

### 2.3 Breeding is multi-stage, not one table
The presence of both:
- `BreedingPairs`
- `BreedingResults`
- `OffspringRecords`
- `Incubation`

shows the old app was modelling a process, roughly:
- breeding pair setup
- breeding round / result cycle
- egg-level outcomes
- incubation where relevant
- offspring records after hatch

### 2.4 Health is structured, not free text
The real DB shows proper health modules:
- `Examination`
- `BloodWork`
- `Ailment`

It also exposes real field panels for bloodwork, which means the old product expected repeatable structured vet/lab records, not a single notes box.

### 2.5 Tasks and calendar are first-class records
The real database contains `Task` and `Calendar`, with task-like fields such as:
- task description
- periodicity
- estimated hours
- actual hours
- last completed
- next date
- status
- comments

So reminders and operational follow-up were part of the working system, not an afterthought.

### 2.6 There is a business/admin layer too
Contacts, invoices, invoice items, products, services, and expenditures are all present.
That means the old software supported breeder operations around the birds, not only breeding biology.

---

## 3. Cleaner target model for the new app

### Layer A: master records
These are long-lived records.
- accounts / subscriptions
- users under account
- flock members
- offspring
- species
- cages
- rings
- contacts

### Layer B: workflow records
These are repeated activity records.
- breeding pairs
- breeding rounds / clutches
- eggs / breeding results
- incubation records
- examinations
- bloodwork
- health events
- tasks
- calendar events
- bird transactions / sales events
- offspring disposition events

### Layer C: business support records
- invoices
- invoice items
- products
- services
- expenditures

### Layer D: derived views
- dashboard
- hatch due
- ring due
- fledging due
- pair performance
- medical history summaries

---

## 4. What was wrong with the earlier app shape
The current app has useful foundations, but too much is still split like this:
- bird record as a giant catch-all
- sub-tabs using placeholder notes
- breeding flow thinner than the legacy process
- health records not yet normalized

That is why it feels stitched together instead of coherent.

---

## 5. Rebuild rule going forward
When deciding where a field belongs:
- permanent bird property -> store on flock member
- repeated time-based event -> create child record table
- breeding step -> store under pair / round / egg / offspring workflow
- vet/lab measurement -> structured repeatable health table
- admin/commercial interaction -> contact/invoice/transaction table
- dashboard-only insight -> derived view, not master table

---

## 6. Immediate build order

### Step 1
Upgrade breeding from simple clutches/eggs into a richer breeding-round workflow.

### Step 2
Keep offspring separate and tie it tightly to egg outcomes.

### Step 3
Normalize examinations and bloodwork into repeatable tables.

### Step 4
Add tasks/calendar around birds, cages, and breeding rounds.

### Step 5
Refactor ownership from user-level to account/subscription-level.

---

## 7. What I changed in interpretation after seeing the real DB
Before this file, the reconstruction still leaned too much toward “bird tabs plus extras”.
After inspecting the production-style database, the better interpretation is:

**Bird Tracker is a breeder operating system with the flock member as the anchor record.**

That is the model the new build should now follow.
