# R&D Portfolio Planner

A portfolio demo showing how R&D, project management, sales, manufacturing and leadership plan from one shared project and ROI model. All data is fake. Full spec: `R&D Portfolio Planner – Prototype Spec.md`.

## Run it on your computer

1. Install **Node.js (LTS)** from https://nodejs.org (one time only).
2. Open a terminal in this folder.
3. `npm install` (one time, and again whenever new libraries are added)
4. `npm run dev`
5. Open the link it prints (usually http://localhost:5173). Press `Ctrl + C` in the terminal to stop.

## Where things live

- `src/data/types.ts` – the data model (what a project, person, department etc. looks like)
- `src/data/seed.ts` – the fake demo data
- `src/data/model.ts` – helper calculations and a data self-check
- `src/App.tsx` – the page you see

## Build progress (spec step 7)

- [x] 1. Seed data and data model
- [x] 2. Role switcher and app layout
- [ ] 3. Portfolio overview and ROI calculator
- [ ] 4. Costs, resourcing and proposed hires
- [ ] 5. Sales revenue (recurring and warranty)
- [ ] 6. Quarterly planning (Rank by comparing)
- [ ] 7. Manufacturing unit cost builder
- [ ] 8. Assumptions, admin, comments and inbox
- [ ] 9. Excel export and Reset demo
