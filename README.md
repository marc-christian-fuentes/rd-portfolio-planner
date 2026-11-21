# greenlight.

**Live demo: https://rd-portfolio-planner.vercel.app** (no sign-up; switch roles with “View as” at the top)

Built by **Marc Fuentes**. See my portfolio: https://marc-fuentes.vercel.app (its code is in `portfolio-site/`).

**R&D investment planning.** A portfolio demo showing how R&D, project management, sales, manufacturing and leadership plan from one shared project and ROI model. All data is fake. Full spec: `R&D Portfolio Planner – Prototype Spec.md`.

## Run it on your computer

1. Install **Node.js (LTS)** from https://nodejs.org (one time only).
2. Open a terminal in this folder.
3. `npm install` (one time, and again whenever new libraries are added)
4. `npm run dev`
5. Open the link it prints (usually http://localhost:5173). Press `Ctrl + C` in the terminal to stop.

## What's in it

- **Portfolio**
  - Summary: every platform side by side, filter or group by product manager.
  - Platform view: one platform's P&L, with its projects alongside.
  - Project view: the ROI calculator (WACC, mid-year discounting, live NPV, ROI, IRR, payback) and the project's schedule.
- **Forecast**: P&L and cash flow that feed the corporate plan.
- **Roadmap**: every project on a timeline.
- **Project management**
  - Costs & resourcing: allocate people to projects, see staffing gaps, propose hires (Director → CTO → Finance approval), plan non-labour costs, add team members to departments.
  - New project: product and project managers add projects, checked against the same rules as the data self-check.
  - Capacity: utilisation by department and person.
- **Sales pipeline**: projects from Proposed onwards as a progress board; revenue plans by month, quarter or year with price overrides, and recurring subscriptions or warranty linked to hardware (attach and retention). Plans feed units and price into each project's ROI model.
- **Quarterly planning**: Propose → Prioritise → Resource → Adjust → Publish, with every change in the plan's history.
  - Project submission: product managers submit projects with their quarterly goal.
  - Prioritisation: drag and drop, or **Rank by comparing** (pick between two projects; a binary insertion sort builds the ranking from your choices); the CTO commits resources; the Director and CEO swap within the approved count; publish locks a version; mid-quarter pull-ins create new versions.
- **Inbox**: mentions, replies and approvals waiting on you, with an unread count. Comments with @mentions and replies sit on projects, sales plans, hires and plan entries.
- **Assumptions**: fiscal year start and fiscal/calendar labels, editable departments (rates feed costs), default revenue settings.
- **Admin**: add users and set what product and project managers can see; an editable role visibility matrix; mock HR and ERP integrations.
- **Excel export**: one project (Project view) or a chosen set (Summary) as a workbook with live formulas: WACC and mid-year discounting are input cells, and revenue, COGS, cash flow, discount factors, NPV, discounted ROI and IRR recalculate in Excel. A summary sheet links to each project. Checked against an independent spreadsheet engine: all 676 formulas match the app.
- **Reset demo** (top bar): restores all the original demo data.
- **Unit cost builder**: Manufacturing itemises each hardware product (component, type, quantity, unit cost). Once a breakdown exists it replaces the gross margin estimate in revenue and ROI everywhere, with a badge showing which COGS method is in use.

## Where things live

- `src/config.ts` – the app name
- `src/data/types.ts` – the data model (what a project, person, department etc. looks like)
- `src/data/seed.ts` – the fake demo data
- `src/data/roi.ts` – ROI maths (NPV, IRR, payback, mid-year discounting)
- `src/data/rollup.ts` – totals and P&L across projects
- `src/data/access.ts` – which role sees which pages
- `src/pages/` – one file per page

## Build progress (spec step 7)

- [x] 1. Seed data and data model
- [x] 2. Role switcher and app layout
- [x] 3. Portfolio views, ROI calculator, forecast and roadmap
- [x] 4. Costs, resourcing and proposed hires
- [x] 5. Sales revenue (recurring and warranty)
- [x] 6. Quarterly planning (Rank by comparing)
- [x] 7. Manufacturing unit cost builder
- [x] 8. Assumptions, admin, comments and inbox
- [x] 9. Excel export and Reset demo
