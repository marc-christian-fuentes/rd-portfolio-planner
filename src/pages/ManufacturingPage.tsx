/**
 * UNIT COST BUILDER (spec section 8)
 * ----------------------------------
 * Manufacturing itemises each hardware product's inputs (component,
 * quantity, unit cost) to build its per-unit cost of goods. Once a product
 * has a breakdown, it replaces the gross margin % estimate in revenue and
 * ROI maths everywhere; a badge shows which method is active.
 */
import { accessFor, visibleProjects } from '../data/access';
import { formatMoney } from '../data/model';
import { priceOf } from '../data/revenue';
import type { CostCategory, Project } from '../data/types';
import { COST_CATEGORIES, costByCategory, hasUnitCost, impliedMarginPct, lineCost, unitCostOf } from '../data/unitcost';
import { useApp } from '../store';
import { KpiStrip, PageHeader, Panel, Tag, right, table, td, th } from '../components/ui';
import { FilterSelect, useQueryParam } from '../components/Filters';
import { NumberInput } from '../components/NumberInput';

const usd = (v: number) => `$${v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const CATEGORY_COLOR: Record<CostCategory, string> = {
  Materials: 'bg-moss-600',
  Labour: 'bg-ochre',
  'Overhead & logistics': 'bg-slateblue',
};

export default function ManufacturingPage() {
  const { data, role, actingAsId, unitCosts } = useApp();
  const products = visibleProjects(data, role, actingAsId).filter(hasUnitCost);
  const [productId, setProductId] = useQueryParam('product', products[0]?.id ?? '');
  const product = products.find((p) => p.id === productId) ?? products[0];

  return (
    <>
      <PageHeader
        title="Unit cost builder"
        subtitle="Itemise what goes into each hardware product. Once a breakdown exists, it replaces the gross margin estimate in revenue and ROI."
      >
        {product && (
          <FilterSelect
            label="Product"
            value={product.id}
            onChange={setProductId}
            options={products.map((p) => ({
              value: p.id,
              label: `${p.name} · ${unitCostOf(unitCosts, p.id) !== null ? 'itemised' : 'margin estimate'}`,
            }))}
          />
        )}
      </PageHeader>

      {product ? <Builder key={product.id} project={product} /> : <p className="text-[13px] text-moss-500">No hardware products to cost.</p>}

      <ProductsOverview products={products} onPick={setProductId} />
    </>
  );
}

function MethodBadge({ itemised }: { itemised: boolean }) {
  return (
    <span
      className={`inline-block rounded-full px-2.5 py-0.5 text-[12px] font-medium ${
        itemised ? 'bg-moss-800 text-white' : 'border border-ochre/60 text-ochre'
      }`}
    >
      {itemised ? 'COGS: itemised unit cost' : 'COGS: margin estimate'}
    </span>
  );
}

function Builder({ project }: { project: Project }) {
  const { role, unitCosts, revenuePlans, startUnitCost, addUnitCostItem, updateUnitCostItem, removeUnitCostItem, clearUnitCost } = useApp();
  const canEdit = accessFor(role, 'manufacturing') === 'edit';
  const items = unitCosts.filter((i) => i.projectId === project.id);
  const unitCost = unitCostOf(unitCosts, project.id);
  const price = priceOf(revenuePlans[project.id], project);
  const estimateMargin = project.grossMarginPct ?? 0;
  const estimateCost = price * (1 - estimateMargin / 100);
  const itemised = unitCost !== null;
  const byCategory = costByCategory(unitCosts, project.id);

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center gap-x-3 gap-y-2">
        <h2 className="text-lg font-semibold text-moss-900">{project.name}</h2>
        <MethodBadge itemised={itemised} />
        <Tag tone={canEdit ? 'solid' : 'neutral'}>{canEdit ? 'You can edit' : 'View only'}</Tag>
      </div>

      <KpiStrip
        items={[
          { label: 'Unit cost (COGS per unit)', value: itemised ? usd(unitCost) : `${usd(estimateCost)} est.` },
          { label: revenuePlans[project.id]?.priceOverride != null ? 'Price (Sales override)' : 'Price', value: usd(price) },
          { label: 'Gross margin', value: `${(itemised ? impliedMarginPct(price, unitCost) : estimateMargin).toFixed(1)}%` },
          {
            label: 'vs margin estimate',
            value: itemised ? `${(impliedMarginPct(price, unitCost) - estimateMargin >= 0 ? '+' : '')}${(impliedMarginPct(price, unitCost) - estimateMargin).toFixed(1)} pts` : '—',
          },
        ]}
      />

      <p className={`mb-4 rounded-[10px] border px-4 py-2.5 text-[13px] ${itemised ? 'border-sage-300 bg-sage-50 text-moss-800' : 'border-ochre/40 bg-white text-moss-700'}`}>
        {itemised
          ? `This breakdown is in use. Revenue and ROI now cost every unit at ${usd(unitCost)}, so the margin follows price (the ${estimateMargin}% estimate no longer applies).`
          : `The ${estimateMargin}% margin estimate is in use: COGS = revenue × ${100 - estimateMargin}%. Start a breakdown to switch to itemised costs.`}
      </p>

      {!itemised ? (
        <div className="rounded-[10px] border border-dashed border-moss-300 bg-white px-4 py-5 text-[13px] text-moss-700">
          {canEdit ? (
            <>
              <p className="mb-3">Start from the current estimate ({usd(estimateCost)} a unit) as a single line, then break it into components.</p>
              <button
                onClick={() => startUnitCost(project.id, estimateCost)}
                className="rounded-md bg-moss-800 px-3 py-1.5 font-medium text-white hover:bg-moss-700"
              >
                Start unit cost breakdown
              </button>
            </>
          ) : (
            <p className="text-moss-500">Manufacturing hasn’t built a breakdown for this product yet. Switch to the Manufacturing role to start one.</p>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <Panel title="Cost split" aside={<span className="num text-[12px] text-moss-500">{usd(unitCost)} per unit</span>}>
            <div className="px-4 py-3">
              <div className="flex h-3 overflow-hidden rounded-full bg-moss-100" aria-hidden="true">
                {COST_CATEGORIES.map((c) => (
                  <div key={c} className={CATEGORY_COLOR[c]} style={{ width: `${unitCost > 0 ? (byCategory[c] / unitCost) * 100 : 0}%` }} />
                ))}
              </div>
              <ul className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-[12px] text-moss-700">
                {COST_CATEGORIES.map((c) => (
                  <li key={c} className="flex items-center gap-1.5">
                    <span className={`size-2.5 rounded-full ${CATEGORY_COLOR[c]}`} aria-hidden="true" />
                    {c} <span className="num font-medium">{usd(byCategory[c])}</span>
                    <span className="num text-moss-500">({unitCost > 0 ? Math.round((byCategory[c] / unitCost) * 100) : 0}%)</span>
                  </li>
                ))}
              </ul>
            </div>
          </Panel>

          <Panel
            title="Bill of materials and conversion costs"
            aside={<span className="text-[12px] text-moss-500">$ per finished unit · <span className="text-slateblue">blue = input</span></span>}
          >
            <div className="overflow-x-auto">
              <table className={table}>
                <thead>
                  <tr>
                    <th className={`${th} min-w-[220px]`}>Component</th>
                    <th className={th}>Type</th>
                    <th className={`${th} ${right}`}>Qty</th>
                    <th className={`${th} ${right}`}>Unit cost</th>
                    <th className={`${th} ${right}`}>Line cost</th>
                    <th className={`${th} ${right}`}>Share</th>
                    {canEdit && <th className={th} />}
                  </tr>
                </thead>
                <tbody>
                  {items.map((i) => (
                    <tr key={i.id} className="hover:bg-moss-50">
                      <td className={td}>
                        {canEdit ? (
                          <input
                            aria-label="Component"
                            value={i.component}
                            onChange={(e) => updateUnitCostItem(i.id, { component: e.target.value })}
                            className="w-full rounded-md border border-moss-200 bg-moss-50 px-1.5 py-0.5 text-[13px] text-slateblue focus:border-moss-600 focus:bg-white focus:outline-none"
                          />
                        ) : (
                          i.component
                        )}
                      </td>
                      <td className={td}>
                        {canEdit ? (
                          <select
                            aria-label={`${i.component} type`}
                            value={i.category}
                            onChange={(e) => updateUnitCostItem(i.id, { category: e.target.value as CostCategory })}
                            className="rounded-md border border-moss-200 bg-white px-1.5 py-0.5 text-[13px]"
                          >
                            {COST_CATEGORIES.map((c) => (
                              <option key={c}>{c}</option>
                            ))}
                          </select>
                        ) : (
                          <span className="flex items-center gap-1.5">
                            <span className={`size-2 rounded-full ${CATEGORY_COLOR[i.category]}`} aria-hidden="true" />
                            {i.category}
                          </span>
                        )}
                      </td>
                      <td className={`${td} ${right}`}>
                        {canEdit ? (
                          <NumberInput ariaLabel={`${i.component} quantity`} value={i.quantity} min={0} className="w-16" onChange={(v) => updateUnitCostItem(i.id, { quantity: v })} />
                        ) : (
                          <span className="num">{i.quantity}</span>
                        )}
                      </td>
                      <td className={`${td} ${right}`}>
                        {canEdit ? (
                          <NumberInput ariaLabel={`${i.component} unit cost`} value={i.unitCost} min={0} className="w-20" onChange={(v) => updateUnitCostItem(i.id, { unitCost: v })} />
                        ) : (
                          <span className="num">{usd(i.unitCost)}</span>
                        )}
                      </td>
                      <td className={`${td} num ${right}`}>{usd(lineCost(i))}</td>
                      <td className={`${td} num ${right} text-moss-500`}>{unitCost > 0 ? `${Math.round((lineCost(i) / unitCost) * 100)}%` : '—'}</td>
                      {canEdit && (
                        <td className={`${td} ${right}`}>
                          <button onClick={() => removeUnitCostItem(i.id)} className="text-[12px] text-moss-500 hover:text-rust" aria-label={`Remove ${i.component}`}>
                            Remove
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                  <tr>
                    <td colSpan={4} className={`${td} border-t-moss-300 font-semibold`}>
                      Unit cost
                    </td>
                    <td className={`${td} border-t-moss-300 num ${right} font-semibold`}>{usd(unitCost)}</td>
                    <td className={`${td} border-t-moss-300`} colSpan={canEdit ? 2 : 1} />
                  </tr>
                </tbody>
              </table>
            </div>
            {canEdit && (
              <div className="flex flex-wrap items-center justify-between gap-2 border-t border-moss-200 px-4 py-2.5">
                <button onClick={() => addUnitCostItem(project.id)} className="text-[12px] font-medium text-moss-600 hover:text-moss-900">
                  + Add component
                </button>
                <button
                  onClick={() => {
                    if (window.confirm('Remove this breakdown? Revenue and ROI go back to the margin estimate.')) clearUnitCost(project.id);
                  }}
                  className="text-[12px] text-moss-500 underline hover:text-rust"
                >
                  Remove breakdown (back to margin estimate)
                </button>
              </div>
            )}
          </Panel>
        </div>
      )}
    </>
  );
}

function ProductsOverview({ products, onPick }: { products: Project[]; onPick: (id: string) => void }) {
  const { unitCosts, revenuePlans } = useApp();
  if (products.length === 0) return null;
  return (
    <div className="mt-8">
      <Panel title="All hardware products">
        <div className="overflow-x-auto">
          <table className={table}>
            <thead>
              <tr>
                <th className={`${th} min-w-[200px]`}>Product</th>
                <th className={th}>COGS method</th>
                <th className={`${th} ${right}`}>Unit cost</th>
                <th className={`${th} ${right}`}>Price</th>
                <th className={`${th} ${right}`}>Gross margin</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => {
                const uc = unitCostOf(unitCosts, p.id);
                const price = priceOf(revenuePlans[p.id], p);
                const margin = uc !== null ? impliedMarginPct(price, uc) : (p.grossMarginPct ?? 0);
                return (
                  <tr key={p.id} className="hover:bg-moss-50">
                    <td className={td}>
                      <button onClick={() => onPick(p.id)} className="font-medium text-moss-900 underline decoration-moss-300 underline-offset-2 hover:decoration-moss-700">
                        {p.name}
                      </button>
                    </td>
                    <td className={td}>
                      <MethodBadge itemised={uc !== null} />
                    </td>
                    <td className={`${td} num ${right}`}>{uc !== null ? usd(uc) : <span className="text-moss-400">{usd(price * (1 - (p.grossMarginPct ?? 0) / 100))} est.</span>}</td>
                    <td className={`${td} num ${right}`}>{formatMoney(price)}</td>
                    <td className={`${td} num ${right}`}>{margin.toFixed(1)}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}
