# R&D Portfolio Planner – Prototype Spec

A portfolio demo app for Marc's personal website. It shows how R&D, project management, sales, manufacturing and leadership plan from one shared project and ROI model. Built in React, using fake seeded data only, with a role switcher instead of logins.

## 1. Goals

- Showcase finance-driven systems thinking: one source of truth feeding role-specific views.
- Be explorable by recruiters in a couple of minutes, with no sign-up.
- Contain no confidential data; every project, person and number is invented.
- Live on the portfolio site, with code on GitHub.

## 2. Core concepts and data model

**Product platform**: a single product made up of several projects. It has a hardware piece and a software piece. A platform counts as launched once all of its projects are completed.

**Project**: belongs to one platform. Fields: name, description, owner (product manager), phase, start and end dates (often multi-quarter, up to two years), type (revenue-generating or cost-only), business case attachment, quarterly goal (as a requirement), approval status.

**Phases**: Scoping → Proposed → Approved → In Development → Testing / Validation → Completed.

**Project type**:

- Revenue-generating, for example a chargeable recurring software feature. Sales can plan revenue for it.
- Cost-only, for example improvements with no charge, troubleshooting or tech debt, on hardware or software. It adds cost only, and still rolls into the platform's total cost.

**Department**: for example Software Engineering, Hardware Engineering, AI, Project Team and QA. Each has a rate per hour and capacity hours per year.

**Resource (person)**: belongs to a department and reports to a project manager. Has annual capacity hours. Seeded to mimic an HR system feed.

**Allocation**: the percentage of a resource's capacity assigned to a project, for example 50% to project A and 50% to project B.

**Cost line**: labour (department or person hours × rate) or non-labour (for example testing materials), planned monthly, quarterly or annually.

**Revenue plan**: units sold per period, price per unit (sales can override it), and recurring settings (see section 5).

**Proposed hire**: created from a capacity gap. It has a status and an approval chain.

**Quarterly plan**: a snapshot of the quarter's R&D priorities with a workflow status and a full history.

**Comment**: attached to any item (project, cost line, revenue plan, hire, plan entry), with @mentions, shown in the inbox.

## 3. Role switcher and visibility

A dropdown at the top switches between: Leadership (CEO / Director), CTO, Product Manager, Project Manager, Sales, Manufacturing, Finance and Admin.

- **Leadership / CTO / Finance**: everything.
- **Product Manager**: their own projects, proposals and quarterly plan visibility with comments.
- **Project Manager**: only assigned projects; cost side, resourcing and proposing hires.
- **Sales**: active and recently completed projects with their phase, on the revenue side only. No costs.
- **Manufacturing**: the unit cost builder.
- **Admin**: users, role visibility and integrations (mocked).

## 4. Portfolio overview (landing page)

- Lists all product platforms and their projects, with phase, type and high-level ROI.
- Drill down from platform → project → ROI calculator.
- Platform-level P&L rolls up revenue, COGS and costs from every project, including cost-only ones.
- Toggle: show ROI with or without pending (unapproved) hires.
- Excel export of a single project or a selected set, with live formulas, so people can model offline.

## 5. Revenue and sales view

- Sales sees projects from Proposed onwards (Scoping stays internal), with each project's description. The view is a pipeline board: one column per phase, in order (Proposed, Approved, In Development, Testing / Validation, Completed), so it reads as a progress report. Proposed and Approved are badged as tentative. Revenue planning unlocks once a project is In Development or later.
- Plan units sold monthly, quarterly or annually. Default price per unit comes from the project; sales can override it.
- **COGS, version 1**: the gross margin % on the project stays fixed, so COGS = revenue × (1 − margin %) and moves with price.
- **COGS, version 2**: once manufacturing has a unit cost breakdown, the project switches to itemised per-unit COGS automatically.
- **Recurring revenue (software subscriptions and warranty)**, set by a toggle per plan:
  - *Linked to hardware*: subscribers = hardware units sold × attach rate. Each yearly renewal keeps the retention rate share. Revenue = subscribers × price.
  - *Standalone*: sales enters subscriber counts directly.
- **Warranty**: hardware ships with no warranty. A one-year warranty is billed on the initial order (example attach rate 70–75%) and renews yearly (example retention 80%).

## 6. Project management: costs, resourcing and hires

- Itemise costs by department or by person, plus non-labour items such as testing materials, at monthly, quarterly or annual granularity.
- Resourcing: the PM's team is listed with capacity. Assign a % of each person to projects, and remaining capacity updates live.
- Gap = total planned hours for the project − allocated hours. A gap can be turned into a **proposed hire** (department, start date, hours).
- Proposed hire costs flow into project costs and ROI immediately, flagged as *proposed*.
- Approval chain: Director → CTO → Finance. Once Finance approves, the cost becomes firm.
- Feeds an R&D capacity planning view: utilisation by department and person across all projects.

## 7. Quarterly planning

A plan moves through fixed stages, and every change is stored as history.

1. **Propose**: product managers submit projects for the quarter, each with its ROI, description and quarterly goal.
2. **Prioritise**: Directors, the CEO and the CTO rank the list, either by drag and drop or with **Rank by comparing**. That shows two projects side by side (ROI, description, PM goal), and the leader picks one. Repeated pairs build the full ranking, which works like a sorting algorithm driven by human choices.
3. **Resource**: the plan goes to the CTO, who ticks the projects he can commit resources to (for example 15 of 20).
4. **Adjust**: the Director and CEO can swap projects, as long as they stay within the approved count.
5. **Publish**: the plan becomes the quarter's R&D priorities. It is locked, and versioned.

- Product managers can watch priorities shift, and comment in the app on why a project moved.
- **Mid-quarter pull-in**: the CEO, Director or a PM can propose adding an urgent must-do project. If approved, it creates a new plan version.
- Published plans drive the other views. Approved projects, plus multi-quarter projects carried over, show as active to project management and sales.

## 8. Manufacturing unit cost builder

- For each product or project, itemise unit inputs (component, quantity, unit cost) to build per-unit COGS.
- Once a breakdown exists, it replaces the gross margin % estimate in revenue and ROI maths. A badge shows which method is active.

## 9. Assumptions

- Fiscal year setup: start month, plus a toggle to show periods as fiscal or calendar year.
- Department table: name, rate per hour, capacity hours per year.
- Default revenue settings: gross margin %, warranty price, attach rate, retention rate.

## 10. Admin

- Users: add a user, set the role, and set the visible projects (for example, PMs only see assigned projects).
- Role visibility matrix: which sections each role can see and edit.
- Integrations page: a mock HR system and ERP connection, for show only.
- Project managers can add projects and departments, and break departments down by person.

## 11. Inbox and comments

- Comments can be attached to any item, with @mentions and threads.
- The inbox lists mentions, replies and pending approvals. It is notifications only; business cases and approvals live on each project.
- No email sending in the prototype.

## 12. Out of scope for the prototype

- Real logins, a real database, real HR or ERP integrations, and email.
- All data lives in the browser (local storage), with a **Reset demo** button that restores the seed data.

## 13. Setup guide: from zero to a published prototype

The stack: React with Vite and TypeScript, Tailwind for styling, SheetJS or ExcelJS for Excel export, code on GitHub, and hosting on Vercel (free tier).

1. **Install the tools**
   - Node.js (LTS version) from nodejs.org.
   - Git from git-scm.com.
   - VS Code from code.visualstudio.com.
2. **Create the accounts**
   - GitHub: this will hold your code and serve as your portfolio of repos.
   - Vercel: sign up with your GitHub account.
3. **Create the project**
   - In a terminal: `npm create vite@latest rd-portfolio-planner -- --template react-ts`
   - Then: `cd rd-portfolio-planner`, `npm install`, `npm run dev`. Open the local link to see the starter app.
4. **Add the libraries**
   - `npm install react-router-dom zustand exceljs recharts`
   - Add Tailwind by following the Vite guide on tailwindcss.com.
5. **Put it on GitHub**
   - Create an empty repo on GitHub named rd-portfolio-planner.
   - `git init`, `git add .`, `git commit -m "Initial commit"`, then add the remote and push, as GitHub's page shows.
6. **Deploy on Vercel**
   - In Vercel, choose Add New Project, import the repo, and keep the Vite defaults. Deploy.
   - Every push to GitHub from now on redeploys automatically.
7. **Build in this order** (one feature at a time, pushing after each)
   1. Seed data and the data model (platforms, projects, departments, people).
   2. Role switcher and the app layout.
   3. Portfolio overview and the ROI calculator.
   4. Project management costs, resourcing and proposed hires.
   5. Sales revenue, with the recurring and warranty logic.
   6. Quarterly planning, including Rank by comparing.
   7. Manufacturing unit cost builder.
   8. Assumptions, admin, and comments with the inbox.
   9. Excel export, and the Reset demo button.
8. **Connect it to the portfolio site**
   - Build the portfolio site as a second small React app, or as a page in the same repo, with your CV content.
   - Link the demo from a Projects section, with a short write-up and the GitHub link.
   - Optional: buy a custom domain and attach it in Vercel's settings.

## Open questions

-
- None open. Decided: seed data has 3 product platforms and about 15 projects, spread across every phase.
