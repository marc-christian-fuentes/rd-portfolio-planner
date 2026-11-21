/**
 * ADMIN (spec section 10)
 * -----------------------
 *   Users:           add a user, set the role, and choose which projects
 *                    product and project managers can see.
 *   Role visibility: which sections each role can see or edit (editable).
 *   Integrations:    a mock HR system and ERP connection, for show only.
 *   Data:            departments, people and the data self-check.
 */
import { useState } from 'react';
import { SECTIONS, accessFor, type Access } from '../data/access';
import { ROLES, type AppUser, type Role } from '../data/types';
import { checkSeed, departmentCapacityHours, departmentMembers, departmentName, formatMoney, personName } from '../data/model';
import { useApp } from '../store';
import { PageHeader, Panel, Tabs, Tag, right, table, td, th } from '../components/ui';
import { useQueryParam } from '../components/Filters';

type TabId = 'users' | 'access' | 'integrations' | 'data';
const SCOPED_ROLES: Role[] = ['Product Manager', 'Project Manager'];

export default function AdminPage() {
  const [tab, setTab] = useQueryParam('tab', 'users');
  const { role } = useApp();
  const canEdit = accessFor(role, 'admin') === 'edit';

  return (
    <>
      <PageHeader title="Admin" subtitle={`Users, who sees what, and connected systems. ${canEdit ? '' : 'View only: switch to the Admin role to make changes.'}`} />
      <div className="mb-5 overflow-hidden rounded-[10px] border border-moss-200 bg-white">
        <Tabs<TabId>
          label="Admin sections"
          active={tab as TabId}
          onChange={setTab}
          tabs={[
            { id: 'users', label: 'Users' },
            { id: 'access', label: 'Role visibility' },
            { id: 'integrations', label: 'Integrations' },
            { id: 'data', label: 'Data' },
          ]}
        />
      </div>
      {tab === 'users' && <UsersTab canEdit={canEdit} />}
      {tab === 'access' && <AccessTab canEdit={canEdit} />}
      {tab === 'integrations' && <IntegrationsTab canEdit={canEdit} />}
      {tab === 'data' && <DataTab />}
    </>
  );
}

// ---------- Users ----------

function UsersTab({ canEdit }: { canEdit: boolean }) {
  const { data, updateUser } = useApp();
  const [editing, setEditing] = useState<string | null>(null);

  return (
    <div className="space-y-5">
      {canEdit && <AddUser />}
      <Panel title="Users" aside={<span className="num text-[12px] text-moss-500">{data.users.length} users · no real logins in the demo</span>}>
        <div className="overflow-x-auto">
          <table className={table}>
            <thead>
              <tr>
                <th className={`${th} min-w-[180px]`}>Name</th>
                <th className={th}>Role</th>
                <th className={`${th} min-w-[240px]`}>Visible projects</th>
                {canEdit && <th className={th} />}
              </tr>
            </thead>
            <tbody>
              {data.users.map((u) => {
                const scoped = SCOPED_ROLES.includes(u.role);
                return [
                  <tr key={u.personId} className="hover:bg-moss-50">
                    <td className={td}>
                      <div className="font-medium">{personName(data, u.personId)}</div>
                      <div className="text-[12px] text-moss-500">{data.people.find((p) => p.id === u.personId)?.title}</div>
                    </td>
                    <td className={td}>
                      {canEdit ? (
                        <select
                          aria-label={`${personName(data, u.personId)} role`}
                          value={u.role}
                          onChange={(e) => updateUser(u.personId, { role: e.target.value as Role })}
                          className="rounded-md border border-moss-200 bg-white px-1.5 py-0.5 text-[13px]"
                        >
                          {ROLES.map((r) => (
                            <option key={r}>{r}</option>
                          ))}
                        </select>
                      ) : (
                        u.role
                      )}
                    </td>
                    <td className={`${td} text-[12px] text-moss-600`}>
                      {scoped ? (
                        u.visibleProjectIds.length ? (
                          u.visibleProjectIds.map((id) => data.projects.find((p) => p.id === id)?.name).join(', ')
                        ) : (
                          <span className="text-rust">None</span>
                        )
                      ) : (
                        <span className="text-moss-400">Per role</span>
                      )}
                    </td>
                    {canEdit && (
                      <td className={`${td} ${right}`}>
                        {scoped && (
                          <button onClick={() => setEditing(editing === u.personId ? null : u.personId)} className="text-[12px] font-medium text-moss-600 hover:text-moss-900">
                            {editing === u.personId ? 'Done' : 'Edit projects'}
                          </button>
                        )}
                      </td>
                    )}
                  </tr>,
                  editing === u.personId && (
                    <tr key={`${u.personId}-edit`}>
                      <td colSpan={4} className="border-t border-moss-100 bg-sage-50 px-4 py-3">
                        <ProjectPicker user={u} />
                      </td>
                    </tr>
                  ),
                ];
              })}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}

function ProjectPicker({ user }: { user: AppUser }) {
  const { data, updateUser } = useApp();
  const toggle = (id: string, on: boolean) =>
    updateUser(user.personId, {
      visibleProjectIds: on ? [...user.visibleProjectIds.filter((x) => x !== id), id] : user.visibleProjectIds.filter((x) => x !== id),
    });
  return (
    <fieldset>
      <legend className="mb-2 text-[12px] font-semibold text-moss-800">Projects {personName(data, user.personId)} can see</legend>
      <div className="grid gap-x-6 gap-y-1 sm:grid-cols-2 lg:grid-cols-3">
        {data.projects.map((p) => (
          <label key={p.id} className="flex items-center gap-2 text-[13px] text-moss-800">
            <input type="checkbox" className="size-4 accent-moss-700" checked={user.visibleProjectIds.includes(p.id)} onChange={(e) => toggle(p.id, e.target.checked)} />
            {p.name}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

function AddUser() {
  const { data, addUser } = useApp();
  const [name, setName] = useState('');
  const [role, setRole] = useState<Role>('Product Manager');
  const [projects, setProjects] = useState<string[]>([]);
  const [added, setAdded] = useState('');
  const scoped = SCOPED_ROLES.includes(role);
  const control = 'rounded-md border border-moss-300 bg-white px-2 py-1 text-[13px]';

  return (
    <Panel title="Add a user">
      <div className="space-y-3 px-4 py-3">
        <div className="flex flex-wrap items-end gap-3">
          <label className="flex flex-col gap-1 text-[12px] text-moss-600">
            Name
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Jordan Lee" className={`${control} w-52`} />
          </label>
          <label className="flex flex-col gap-1 text-[12px] text-moss-600">
            Role
            <select value={role} onChange={(e) => setRole(e.target.value as Role)} className={control}>
              {ROLES.map((r) => (
                <option key={r}>{r}</option>
              ))}
            </select>
          </label>
          <button
            disabled={!name.trim()}
            onClick={() => {
              addUser({ name: name.trim(), role, visibleProjectIds: scoped ? projects : [] });
              setAdded(`${name.trim()} added as ${role}. Pick them with the “Person” menu at the top to see the app as they would.`);
              setName('');
              setProjects([]);
            }}
            className="rounded-md bg-moss-800 px-3 py-1.5 text-[13px] font-medium text-white hover:bg-moss-700 disabled:opacity-40"
          >
            Add user
          </button>
        </div>
        {scoped && (
          <fieldset>
            <legend className="mb-1 text-[12px] text-moss-600">Visible projects</legend>
            <div className="grid gap-x-6 gap-y-1 sm:grid-cols-2 lg:grid-cols-3">
              {data.projects.map((p) => (
                <label key={p.id} className="flex items-center gap-2 text-[13px] text-moss-800">
                  <input
                    type="checkbox"
                    className="size-4 accent-moss-700"
                    checked={projects.includes(p.id)}
                    onChange={(e) => setProjects(e.target.checked ? [...projects, p.id] : projects.filter((x) => x !== p.id))}
                  />
                  {p.name}
                </label>
              ))}
            </div>
          </fieldset>
        )}
        {added && (
          <p className="text-[12px] font-medium text-moss-700" role="status">
            {added}
          </p>
        )}
      </div>
    </Panel>
  );
}

// ---------- Role visibility ----------

const NEXT: Record<'none' | Access, Access | null> = { none: 'view', view: 'edit', edit: null };

function AccessTab({ canEdit }: { canEdit: boolean }) {
  const { accessMatrix, setAccessCell, resetAccess } = useApp();
  return (
    <Panel
      title="Role visibility matrix"
      aside={
        <span className="flex items-center gap-3 text-[12px] text-moss-500">
          E = edit · V = view · blank = hidden{canEdit && ' · click a cell to change it'}
          {canEdit && (
            <button onClick={resetAccess} className="underline hover:text-moss-900">
              Reset to defaults
            </button>
          )}
        </span>
      }
    >
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
                  const a = accessMatrix[s.id]?.[r];
                  const locked = s.id === 'admin' && r === 'Admin';
                  const mark = a === 'edit' ? (
                    <span className="inline-block w-5 rounded-md bg-moss-800 text-moss-50">E</span>
                  ) : a === 'view' ? (
                    <span className="inline-block w-5 rounded-md border border-moss-300 text-moss-600">V</span>
                  ) : (
                    <span className="inline-block w-5 text-moss-300">·</span>
                  );
                  return (
                    <td key={r} className={`${td} num text-center`}>
                      {canEdit && !locked ? (
                        <button
                          onClick={() => setAccessCell(s.id, r, NEXT[a ?? 'none'])}
                          aria-label={`${r} on ${s.label}: ${a ?? 'hidden'}. Change`}
                          className="rounded-md p-0.5 hover:bg-sage-100"
                        >
                          {mark}
                        </button>
                      ) : (
                        <span title={locked ? 'Admin always keeps access to Admin' : undefined}>{mark}</span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="border-t border-moss-200 px-4 py-2.5 text-[12px] text-moss-500">
        Changes apply at once: the menu and pages follow this matrix. Each click cycles hidden → view → edit.
      </p>
    </Panel>
  );
}

// ---------- Integrations (mock) ----------

function IntegrationsTab({ canEdit }: { canEdit: boolean }) {
  const { data, integrations, syncIntegration } = useApp();
  const people = data.people.filter((p) => p.departmentId !== null).length;
  const cards = [
    {
      id: 'hr' as const,
      name: 'HR system',
      last: integrations.hrLastSync,
      what: `Imports people, departments, reporting lines and yearly capacity. Last run updated ${people} people.`,
      mapping: ['Employee ID → Person', 'Org unit → Department', 'Manager → Reports to', 'Contracted hours → Capacity'],
    },
    {
      id: 'erp' as const,
      name: 'ERP',
      last: integrations.erpLastSync,
      what: 'Imports actual costs by cost centre each night, and sends approved hires and the published plan back to Finance.',
      mapping: ['Cost centre → Project', 'GL account → Cost line', 'Approved hire → Headcount request', 'Published plan → Budget version'],
    },
  ];
  return (
    <div className="grid gap-5 lg:grid-cols-2">
      {cards.map((c) => (
        <Panel
          key={c.id}
          title={
            <span className="flex items-center gap-2">
              {c.name} <Tag tone="solid">Connected</Tag>
            </span>
          }
          aside={<span className="text-[11px] text-moss-500">Mock · for show only</span>}
        >
          <div className="space-y-3 px-4 py-3 text-[13px] text-moss-700">
            <p>{c.what}</p>
            <ul className="space-y-1 text-[12px] text-moss-600">
              {c.mapping.map((m) => (
                <li key={m} className="flex items-center gap-2">
                  <span className="size-1.5 rounded-full bg-moss-500" aria-hidden="true" />
                  {m}
                </li>
              ))}
            </ul>
            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-moss-100 pt-3">
              <span className="num text-[12px] text-moss-500">Last sync {c.last}</span>
              {canEdit && (
                <button onClick={() => syncIntegration(c.id)} className="rounded-md border border-moss-300 px-3 py-1 text-[12px] text-moss-700 hover:bg-moss-50">
                  Sync now
                </button>
              )}
            </div>
          </div>
        </Panel>
      ))}
    </div>
  );
}

// ---------- Data ----------

function DataTab() {
  const data = useApp((s) => s.data);
  const { checks, problems } = checkSeed(data);
  return (
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

      <Panel title="Departments" aside={<span className="text-[12px] text-moss-500">Edit rates on the Assumptions page</span>}>
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

      <Panel title="People" aside={<span className="text-[12px] text-moss-500">From the (mock) HR system</span>}>
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
                  <td className={`${td} num ${right}`}>{p.capacityHoursPerYear ? p.capacityHoursPerYear.toLocaleString() : <span className="text-moss-400">—</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}
