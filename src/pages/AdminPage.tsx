/**
 * Admin page.
 * Step 7.2 version: the role visibility matrix (read-only), plus the
 * departments, people and data self-check from step 7.1.
 * Editing users and the mock integrations arrive in step 7.8.
 */
import { ACCESS, SECTIONS } from '../data/access';
import { ROLES } from '../data/types';
import { checkSeed, departmentCapacityHours, departmentMembers, departmentName, formatMoney, personName } from '../data/model';
import { useApp } from '../store';
import { PageHeader, Panel, right, table, td, th } from '../components/ui';

export default function AdminPage() {
  const data = useApp((s) => s.data);
  const { checks, problems } = checkSeed(data);

  return (
    <>
      <PageHeader
        title="Admin"
        subtitle="Who sees what, and the demo’s departments and people. Editing users and mock integrations arrive in step 7.8."
      />

      <div className="space-y-4">
        <div
          className={`rounded-[10px] border px-4 py-2.5 text-[13px] ${
            problems.length ? 'border-rust/40 bg-white text-rust' : 'border-sage-300 bg-sage-50 text-moss-800'
          }`}
        >
          {problems.length === 0 ? (
            <>
              <span className="font-semibold">Data self-check passed</span> · <span className="num">{checks}</span> checks, 0 problems
            </>
          ) : (
            <>
              <span className="font-semibold">Data self-check found {problems.length} problem(s)</span>
              <ul className="mt-1 list-disc pl-5">
                {problems.map((p) => (
                  <li key={p}>{p}</li>
                ))}
              </ul>
            </>
          )}
        </div>

        <Panel title="Role visibility matrix" aside={<span className="text-[12px] text-moss-500">E = edit · V = view · blank = hidden</span>}>
          <div className="overflow-x-auto">
            <table className={table}>
              <thead>
                <tr>
                  <th className={th}>Section</th>
                  {ROLES.map((r) => (
                    <th key={r} className={`${th} text-center`}>
                      {r}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {SECTIONS.map((s) => (
                  <tr key={s.id} className="hover:bg-moss-50">
                    <td className={`${td} font-medium whitespace-nowrap`}>
                      {s.group && <span className="font-normal text-moss-500">{s.group} · </span>}
                      {s.label}
                    </td>
                    {ROLES.map((r) => {
                      const a = ACCESS[s.id][r];
                      return (
                        <td key={r} className={`${td} num text-center`}>
                          {a === 'edit' && <span className="inline-block w-5 rounded-md bg-moss-800 text-moss-50">E</span>}
                          {a === 'view' && <span className="inline-block w-5 rounded-md border border-moss-300 text-moss-600">V</span>}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>

        <Panel title="Departments">
          <div className="overflow-x-auto">
            <table className={table}>
              <thead>
                <tr>
                  <th className={th}>Department</th>
                  <th className={`${th} ${right}`}>Rate / hr</th>
                  <th className={`${th} ${right}`}>Hrs / person / yr</th>
                  <th className={`${th} ${right}`}>People</th>
                  <th className={`${th} ${right}`}>Total capacity (hrs)</th>
                </tr>
              </thead>
              <tbody>
                {data.departments.map((d) => (
                  <tr key={d.id} className="hover:bg-moss-50">
                    <td className={td}>{d.name}</td>
                    <td className={`${td} num ${right}`}>{formatMoney(d.ratePerHour)}</td>
                    <td className={`${td} num ${right}`}>{d.capacityHoursPerYear.toLocaleString()}</td>
                    <td className={`${td} num ${right}`}>{departmentMembers(data, d.id).length}</td>
                    <td className={`${td} num ${right}`}>{departmentCapacityHours(data, d.id).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>

        <Panel title="People" aside={<span className="text-[12px] text-moss-500">Mock HR system feed</span>}>
          <div className="overflow-x-auto">
            <table className={table}>
              <thead>
                <tr>
                  <th className={th}>Name</th>
                  <th className={th}>Title</th>
                  <th className={th}>Department</th>
                  <th className={th}>Reports to</th>
                  <th className={`${th} ${right}`}>Capacity (hrs/yr)</th>
                </tr>
              </thead>
              <tbody>
                {data.people.map((p) => (
                  <tr key={p.id} className="hover:bg-moss-50">
                    <td className={`${td} whitespace-nowrap`}>{p.name}</td>
                    <td className={td}>{p.title}</td>
                    <td className={td}>{departmentName(data, p.departmentId)}</td>
                    <td className={`${td} whitespace-nowrap`}>{personName(data, p.managerId)}</td>
                    <td className={`${td} num ${right}`}>
                      {p.capacityHoursPerYear ? p.capacityHoursPerYear.toLocaleString() : <span className="text-moss-400">—</span>}
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
