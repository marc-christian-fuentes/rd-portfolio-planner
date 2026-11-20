/**
 * PROJECT MANAGEMENT · CAPACITY (spec section 6)
 * ----------------------------------------------
 * R&D capacity planning: how much of each department's and each person's
 * year is allocated across all projects. Over 100% is flagged.
 * Project managers see their own team; leaders see everyone.
 */
import { personName } from '../data/model';
import { personLoadPct } from '../data/resourcing';
import { useApp } from '../store';
import { KpiStrip, PageHeader, Panel, right, table, td, th } from '../components/ui';
import { FilterSelect, useQueryParam } from '../components/Filters';

const hrs = (v: number) => `${Math.round(v).toLocaleString('en-US')} h`;

/** A bar showing % used; turns rust when over 100%. */
function LoadBar({ pct }: { pct: number }) {
  const over = pct > 100;
  return (
    <div className="flex items-center gap-2">
      <div className="h-2 w-28 shrink-0 overflow-hidden rounded-full bg-moss-100" aria-hidden="true">
        <div className={`h-full rounded-full ${over ? 'bg-rust' : 'bg-moss-600'}`} style={{ width: `${Math.min(100, pct)}%` }} />
      </div>
      <span className={`num text-[12px] ${over ? 'font-semibold text-rust' : 'text-moss-700'}`}>{Math.round(pct)}%</span>
    </div>
  );
}

export default function CapacityPage() {
  const { data, role, actingAsId, allocations, hires } = useApp();
  const [dept, setDept] = useQueryParam('dept', 'all');

  const resources = data.people.filter(
    (p) => p.kind === 'resource' && (role !== 'Project Manager' || p.managerId === actingAsId) && (dept === 'all' || p.departmentId === dept),
  );
  const loadOf = (id: string) => personLoadPct(id, allocations);
  const allocatedHours = (personId: string, capacity: number) => (capacity * loadOf(personId)) / 100;

  const capacity = resources.reduce((s, p) => s + p.capacityHoursPerYear, 0);
  const allocated = resources.reduce((s, p) => s + allocatedHours(p.id, p.capacityHoursPerYear), 0);
  const overCount = resources.filter((p) => loadOf(p.id) > 100).length;

  const departments = data.departments.filter((d) => resources.some((p) => p.departmentId === d.id));
  const projectName = (id: string) => data.projects.find((p) => p.id === id)?.name ?? id;

  return (
    <>
      <PageHeader
        title="Capacity"
        subtitle={`How much of each department’s and person’s year is allocated across all projects.${
          role === 'Project Manager' ? ' Showing your team.' : ''
        }`}
      >
        <FilterSelect
          label="Department"
          value={dept}
          onChange={setDept}
          options={[
            { value: 'all', label: 'All' },
            ...data.departments.filter((d) => d.id !== 'dept-prod').map((d) => ({ value: d.id, label: d.name })),
          ]}
        />
      </PageHeader>

      <KpiStrip
        items={[
          { label: 'Capacity / yr', value: hrs(capacity) },
          { label: 'Allocated', value: hrs(allocated) },
          { label: 'Utilisation', value: capacity ? `${Math.round((allocated / capacity) * 100)}%` : '—' },
          { label: 'Over-allocated people', value: String(overCount) },
        ]}
      />

      <div className="space-y-5">
        <Panel title="By department">
          <div className="overflow-x-auto">
            <table className={table}>
              <thead>
                <tr>
                  <th className={`${th} min-w-[170px]`}>Department</th>
                  <th className={`${th} ${right}`}>People</th>
                  <th className={`${th} ${right}`}>Capacity</th>
                  <th className={`${th} ${right}`}>Allocated</th>
                  <th className={th}>Utilisation</th>
                  <th className={`${th} ${right}`}>Free</th>
                  <th className={`${th} ${right}`}>Hires in progress</th>
                </tr>
              </thead>
              <tbody>
                {departments.map((d) => {
                  const people = resources.filter((p) => p.departmentId === d.id);
                  const cap = people.reduce((s, p) => s + p.capacityHoursPerYear, 0);
                  const alloc = people.reduce((s, p) => s + allocatedHours(p.id, p.capacityHoursPerYear), 0);
                  const pendingHours = hires
                    .filter((h) => h.departmentId === d.id && h.status !== 'Approved' && h.status !== 'Rejected')
                    .reduce((s, h) => s + h.hours, 0);
                  return (
                    <tr key={d.id} className="hover:bg-moss-50">
                      <td className={`${td} font-medium`}>{d.name}</td>
                      <td className={`${td} num ${right}`}>{people.length}</td>
                      <td className={`${td} num ${right}`}>{hrs(cap)}</td>
                      <td className={`${td} num ${right}`}>{hrs(alloc)}</td>
                      <td className={td}>
                        <LoadBar pct={cap ? (alloc / cap) * 100 : 0} />
                      </td>
                      <td className={`${td} num ${right}`}>{hrs(Math.max(0, cap - alloc))}</td>
                      <td className={`${td} num ${right} ${pendingHours ? 'text-ochre' : 'text-moss-300'}`}>
                        {pendingHours ? hrs(pendingHours) : '–'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Panel>

        <Panel title="By person" aside={<span className="text-[12px] text-moss-500">Over 100% means more work than hours</span>}>
          <div className="overflow-x-auto">
            <table className={table}>
              <thead>
                <tr>
                  <th className={`${th} min-w-[160px]`}>Person</th>
                  <th className={th}>Reports to</th>
                  <th className={`${th} ${right}`}>Capacity</th>
                  <th className={th}>Load</th>
                  <th className={`${th} min-w-[260px]`}>Projects</th>
                </tr>
              </thead>
              <tbody>
                {[...resources]
                  .sort((a, b) => loadOf(b.id) - loadOf(a.id))
                  .map((p) => (
                    <tr key={p.id} className="hover:bg-moss-50">
                      <td className={td}>
                        <div className="font-medium">{p.name}</div>
                        <div className="text-[12px] text-moss-500">{data.departments.find((d) => d.id === p.departmentId)?.name}</div>
                      </td>
                      <td className={`${td} whitespace-nowrap`}>{personName(data, p.managerId)}</td>
                      <td className={`${td} num ${right}`}>{hrs(p.capacityHoursPerYear)}</td>
                      <td className={td}>
                        <LoadBar pct={loadOf(p.id)} />
                      </td>
                      <td className={td}>
                        <div className="flex flex-wrap gap-1">
                          {allocations
                            .filter((a) => a.personId === p.id)
                            .map((a) => (
                              <span key={a.id} className="rounded-full bg-moss-100 px-2 py-px text-[11px] text-moss-800">
                                {projectName(a.projectId)} <span className="num">{a.percent}%</span>
                              </span>
                            ))}
                          {loadOf(p.id) === 0 && <span className="text-[12px] text-moss-400">Unallocated</span>}
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </Panel>
      </div>
    </>
  );
}
