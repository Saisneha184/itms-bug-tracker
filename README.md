# ITMS Bug Tracking Agent

An interactive command-line agent for managing the full bug lifecycle in the **IT Management System (ITMS)** project.

---

## Bug Lifecycle

```
         ┌──────────────────────────────────────────────────────┐
         │                                                      │
  [Report Bug]                                                  │
         │                                                      │
         ▼                                                      │
      ┌──────┐      ┌──────────┐      ┌───────┐      ┌────────┐│
      │ OPEN │─────▶│ ASSIGNED │─────▶│ FIXED │─────▶│ CLOSED ││
      └──────┘      └──────────┘      └───────┘      └────────┘│
         │               │                │               │     │
         │               │                └──────┐        │     │
         │               └──────────────────────▶│        │     │
         │                                        ▼        │     │
         │                                   ┌──────────┐  │    │
         └──────────────────────────────────▶│ REOPENED │◀─┘    │
                                             └──────────┘       │
                                                  │             │
                                                  └─────────────┘
```

| Transition | From | To |
|---|---|---|
| Report bug | — | **Open** |
| Assign to developer | Open / Reopened | **Assigned** |
| Developer fixes bug | Assigned | **Fixed** |
| QA verifies fix | Fixed / Open | **Closed** |
| Reopen if fix fails | Fixed / Closed / Assigned | **Reopened** |
| Re-assign reopened | Reopened | **Assigned** |

---

## Quick Start

```bash
# Install dependencies
npm install

# Run the demo seed to see a full lifecycle walkthrough
npm run seed

# Launch the interactive CLI agent
npm start
```

---

## Features

- **Report bugs** with title, description, priority, and severity
- **Assign** bugs to developers with optional comments
- **Fix** bugs with a resolution note
- **Close** bugs after QA verification
- **Reopen** bugs when a fix doesn't hold
- **Comment** on any bug at any stage
- **List bugs** filtered by any status
- **Audit trail** — full history of every status change and who made it
- **Dashboard** — real-time summary stats by status
- Color-coded terminal UI with status and priority indicators

---

## Project Structure

```
src/
├── index.js        Entry point
├── agent.js        Core agent logic and action handlers
├── store.js        In-memory data store (bugs + users)
├── constants.js    Statuses, transitions, priorities, severities
├── cli.js          Interactive CLI powered by inquirer
├── display.js      Terminal formatter and color renderer
└── seed.js         Demo script — walks through full lifecycle
```

---

## Users (Demo)

| ID | Name | Role |
|---|---|---|
| u1 | Alice Johnson | Manager |
| u2 | Bob Smith | Developer |
| u3 | Carol White | Developer |
| u4 | Dave Brown | QA |
| u5 | Eve Davis | Reporter |

---

## Status Transitions Reference

```
Open     → Assigned, Closed
Assigned → Fixed, Reopened, Open
Fixed    → Closed, Reopened
Closed   → Reopened
Reopened → Assigned, Fixed, Closed
```
