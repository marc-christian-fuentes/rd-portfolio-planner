/**
 * FILTERS (shared)
 * ----------------
 * Small drop-downs that narrow a page, kept in the web address
 * (e.g. ?pm=pdm-2) so they carry between pages and links can be shared.
 */
import { useSearchParams } from 'react-router-dom';
import type { Project } from '../data/types';
import { useApp } from '../store';

/** Reads and sets one ?key= value in the address. The fallback value is left out of the address. */
export function useQueryParam(key: string, fallback: string): [string, (value: string) => void] {
  const [params, setParams] = useSearchParams();
  const value = params.get(key) ?? fallback;
  const setValue = (v: string) => {
    const next = new URLSearchParams(params);
    if (v === fallback) next.delete(key);
    else next.set(key, v);
    setParams(next, { replace: true });
  };
  return [value, setValue];
}

/** The product manager filter: "all" or a product manager's id. */
export const usePmFilter = () => useQueryParam('pm', 'all');

export function byPm(projects: Project[], pm: string): Project[] {
  return pm === 'all' ? projects : projects.filter((p) => p.ownerId === pm);
}

export function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <label className="flex items-center gap-2 text-[13px] text-moss-600">
      {label}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-md border border-moss-300 bg-white px-2 py-1 text-[13px] text-moss-900 focus:border-moss-600 focus:outline-none"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

/**
 * "Include pending hires" switch (spec section 4): shows ROI and forecasts
 * with or without hires that Finance hasn't approved yet. Approved hires
 * always count.
 */
export function HiresToggle() {
  const include = useApp((s) => s.includePendingHires);
  const setInclude = useApp((s) => s.setIncludePendingHires);
  return (
    <label className="flex cursor-pointer items-center gap-2 text-[13px] text-moss-600">
      <input
        type="checkbox"
        checked={include}
        onChange={(e) => setInclude(e.target.checked)}
        className="size-4 accent-moss-700"
      />
      Include pending hires
    </label>
  );
}

/**
 * "Product manager: All / Aisha Karim / …". Hidden when the viewer is a
 * product manager, since they only ever see their own projects.
 */
export function PmFilter() {
  const { data, role } = useApp();
  const [pm, setPm] = usePmFilter();
  if (role === 'Product Manager') return null;
  const pms = data.people.filter((p) => p.kind === 'product-manager');
  return (
    <FilterSelect
      label="Product manager"
      value={pm}
      onChange={setPm}
      options={[{ value: 'all', label: 'All' }, ...pms.map((p) => ({ value: p.id, label: p.name }))]}
    />
  );
}
