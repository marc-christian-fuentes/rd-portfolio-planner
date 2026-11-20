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
import { Card, PageHeader, num, td, th } from '../components/ui';

export default function AdminPage() {
  const data = useApp((s) => s.data);
  const { checks, problems } = checkSeed(data);

  return (
    <>
      <PageHeader title="Admin" subtitle="Who sees what, and the demo’s departments and people. Editing users and mock integrations come in step 7.8." />

      <div className="space-y-6">
        <div
          className={`rounded-xl border px-4 py-3 text-sm ${
            problems.length ? 'border-red-200 bg-red-50 text-red-800' : 'border-emerald-200 bg-emerald-50 text-emerald-800'
          }`}
        >
          {problems.length === 0 ? (
            <strong>Data self-check: all {checks} checks passed.</strong>
          ) : (
            <>
              <strong>Data self-check found {problems.length} problem(s):</strong>
              <ul className="mt-1 list-disc pl-5">
                {problems.map((p) => (
                  <li key={p}>{p}</li>
                ))}
              </ul>
            </>
          )}
        </div>

        <Card>
          <h2 className="font-semibold text-slate-900">Role visibility matrix</h2>
          <p className="mb-3 text-sm text-slate-500">E = can edit, V = view only, blank = hidden.</p>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
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
                  <tr key={s.id}>
                    <td className={`${td} font-medium`}>{s.label}</td>
                    {ROLES.map((r) => {
                      const a = ACCESS[s.id][r];
                      return (
                        <td key={r} className={`${td} text-center`}>
                          {a === 'edit' && <span className="font-bold text-emerald-700">E</span>}
                          {a === 'view' && <span className="text-slate-500">V</span>}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card>
          <h2 className="mb-3 font-semibold text-slate-900">Departments</h2>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className={th}>Department</th>
                  <th className={`${th} ${num}`}>Rate / hour</th>
                  <th className={`${th} ${num}`}>Hours / person / year</th>
                  <th className={`${th} ${num}`}>People</th>
                  <th className={`${th} ${num}`}>Total capacity (hrs)</th>
                </tr>
              </thead>
              <tbody>
                {data.departments.map((d) => (
                  <tr key={d.id}>
                    <td className={td}>{d.name}</td>
                    <td className={`${td} ${num}`}>{formatMoney(d.ratePerHour)}</td>
                    <td className={`${td} ${num}`}>{d.capacityHoursPerYear.toLocaleString()}</td>
                    <td className={`${td} ${num}`}>{departmentMembers(data, d.id).length}</td>
                    <td className={`${td} ${num}`}>{departmentCapacityHours(data, d.id).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card>
          <h2 className="mb-3 font-semibold text-slate-900">People (mock HR feed)</h2>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className={th}>Name</th>
                  <th className={th}>Title</th>
                  <th className={th}>Department</th>
                  <th className={th}>Reports to</th>
                  <th className={`${th} ${num}`}>Capacity (hrs/yr)</th>
                </tr>
              </thead>
              <tbody>
                {data.people.map((p) => (
                  <tr key={p.id}>
                    <td className={td}>{p.name}</td>
                    <td className={td}>{p.title}</td>
                    <td className={td}>{departmentName(data, p.departmentId)}</td>
                    <td className={td}>{personName(data, p.managerId)}</td>
                    <td className={`${td} ${num}`}>{p.capacityHoursPerYear ? p.capacityHoursPerYear.toLocaleString() : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </>
  );
}
