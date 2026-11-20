/**
 * UNIT COST BUILDER (spec section 8)
 * ----------------------------------
 * Manufacturing itemises each product's inputs (component, quantity, unit
 * cost) to build the per-unit cost of goods.
 *
 * COGS, version 2: once a product has a breakdown, it replaces the gross
 * margin % estimate. The margin then follows from price:
 *     margin = (price − unit cost) ÷ price
 * so a Sales price cut squeezes margin instead of shrinking COGS.
 */
import type { CostCategory, Project, RoiModel, UnitCostItem } from './types';

export const COST_CATEGORIES: CostCategory[] = ['Materials', 'Labour', 'Overhead & logistics'];

/** Products that can have a unit cost breakdown: revenue projects with a hardware piece. */
export const hasUnitCost = (p: Project) => p.type === 'revenue' && p.component === 'hardware';

export const lineCost = (item: UnitCostItem) => item.quantity * item.unitCost;

/** The project's per-unit cost in $, or null if it has no breakdown. */
export function unitCostOf(items: UnitCostItem[], projectId: string): number | null {
  const lines = items.filter((i) => i.projectId === projectId);
  return lines.length === 0 ? null : lines.reduce((s, i) => s + lineCost(i), 0);
}

export function costByCategory(items: UnitCostItem[], projectId: string): Record<CostCategory, number> {
  const out = { Materials: 0, Labour: 0, 'Overhead & logistics': 0 } as Record<CostCategory, number>;
  for (const i of items.filter((x) => x.projectId === projectId)) out[i.category] += lineCost(i);
  return out;
}

/** Margin % implied by a unit cost at a price. */
export const impliedMarginPct = (price: number, unitCost: number) => (price > 0 ? ((price - unitCost) / price) * 100 : 0);

/** A copy of the ROI model whose margin each year comes from the itemised unit cost. */
export function applyUnitCost(model: RoiModel, unitCost: number): RoiModel {
  return { ...model, years: model.years.map((y) => ({ ...y, marginPct: impliedMarginPct(y.price, unitCost) })) };
}

// ---------- Demo breakdowns ----------

const item = (projectId: string, n: number, component: string, category: CostCategory, quantity: number, unitCost: number): UnitCostItem => ({
  id: `uc-${projectId}-${n}`,
  projectId,
  component,
  category,
  quantity,
  unitCost,
});

export const seedUnitCosts: UnitCostItem[] = [
  // AeroSense sensor, Rev B: $131.50 a unit (≈47% margin at $249)
  item('prj-01', 1, 'Particle sensor module', 'Materials', 1, 38.5),
  item('prj-01', 2, 'CO₂ sensor', 'Materials', 1, 21),
  item('prj-01', 3, 'Main PCB assembly', 'Materials', 1, 24),
  item('prj-01', 4, 'Wi-Fi / BLE module', 'Materials', 1, 9.8),
  item('prj-01', 5, 'Rechargeable battery', 'Materials', 1, 8.9),
  item('prj-01', 6, 'Two-part enclosure', 'Materials', 1, 7.4),
  item('prj-01', 7, 'Wall mount and screws', 'Materials', 1, 1.6),
  item('prj-01', 8, 'Assembly and test (hours)', 'Labour', 0.35, 36),
  item('prj-01', 9, 'Packaging and manual', 'Overhead & logistics', 1, 3.2),
  item('prj-01', 10, 'Freight and duty', 'Overhead & logistics', 1, 4.5),
  // FlowGuard valve v2: $112.50 a unit (≈40% margin at $189)
  item('prj-05', 1, 'Brass valve body', 'Materials', 1, 31),
  item('prj-05', 2, 'Geared DC motor', 'Materials', 1, 18.5),
  item('prj-05', 3, 'Flow sensor', 'Materials', 1, 14.2),
  item('prj-05', 4, 'Controller PCB', 'Materials', 1, 16.8),
  item('prj-05', 5, 'Seals and O-ring kit', 'Materials', 1, 2.4),
  item('prj-05', 6, 'Housing', 'Materials', 1, 6.9),
  item('prj-05', 7, 'Power supply', 'Materials', 1, 7.3),
  item('prj-05', 8, 'Assembly (hours)', 'Labour', 0.25, 36),
  item('prj-05', 9, 'Packaging', 'Overhead & logistics', 1, 2.6),
  item('prj-05', 10, 'Freight', 'Overhead & logistics', 1, 3.8),
];
