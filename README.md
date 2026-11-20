# greenlight.

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
- **Quarterly planning, Unit cost builder, Project management, Sales pipeline**: coming in later steps.

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
- [ ] 4. Costs, resourcing and proposed hires
- [ ] 5. Sales revenue (recurring and warranty)
- [ ] 6. Quarterly planning (Rank by comparing)
- [ ] 7. Manufacturing unit cost builder
- [ ] 8. Assumptions, admin, comments and inbox
- [ ] 9. Excel export and Reset demo
