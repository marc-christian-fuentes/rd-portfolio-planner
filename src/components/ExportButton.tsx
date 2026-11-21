/**
 * Excel export controls:
 *  - ExportButton: export one or more projects straight away.
 *  - ExportPicker: choose a set of projects, then export them together.
 */
import { useState } from 'react';
import { downloadRoiWorkbook } from '../data/excel';
import type { Project } from '../data/types';
import { effectiveModel, rateIndexFor, useApp } from '../store';

/** Runs the export with the current app state. */
function useExport() {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const run = async (ids: string[]) => {
    setBusy(true);
    setMessage('');
    try {
      const state = useApp.getState();
      const count = await downloadRoiWorkbook(ids, { ...state, rateIndex: (id) => rateIndexFor(state, id) }, effectiveModel);
      setMessage(count ? `Downloaded ${count} project${count === 1 ? '' : 's'}.` : 'Nothing to export: none of these projects has an ROI model.');
    } catch {
      setMessage('The export didn’t work. Please try again.');
    } finally {
      setBusy(false);
    }
  };
  return { busy, message, run };
}

export function ExportButton({ projectIds, label = 'Export to Excel' }: { projectIds: string[]; label?: string }) {
  const { busy, message, run } = useExport();
  return (
    <span className="inline-flex items-center gap-2">
      <button
        onClick={() => run(projectIds)}
        disabled={busy}
        className="rounded-md border border-moss-300 bg-white px-3 py-1 text-[13px] text-moss-800 hover:bg-moss-50 disabled:opacity-50"
      >
        {busy ? 'Preparing…' : label}
      </button>
      {message && (
        <span className="text-[12px] text-moss-600" role="status">
          {message}
        </span>
      )}
    </span>
  );
}

/** "Export to Excel…" that opens a checklist of projects to include. */
export function ExportPicker({ projects }: { projects: Project[] }) {
  const roiModels = useApp((s) => s.roiModels);
  const exportable = projects.filter((p) => roiModels[p.id]);
  const [open, setOpen] = useState(false);
  const [chosen, setChosen] = useState<string[]>([]);
  const { busy, message, run } = useExport();
  const selected = chosen.filter((id) => exportable.some((p) => p.id === id));

  return (
    <div className="relative">
      <button
        onClick={() => {
          if (!open) setChosen(exportable.map((p) => p.id));
          setOpen(!open);
        }}
        aria-expanded={open}
        className="rounded-md border border-moss-300 bg-white px-3 py-1 text-[13px] text-moss-800 hover:bg-moss-50"
      >
        Export to Excel…
      </button>
      {open && (
        <div className="absolute right-0 z-20 mt-2 w-80 rounded-[10px] border border-moss-200 bg-white p-3 shadow-lg">
          <div className="mb-2 flex items-center justify-between text-[12px]">
            <span className="font-semibold text-moss-900">Projects to include</span>
            <span className="space-x-2 text-moss-600">
              <button onClick={() => setChosen(exportable.map((p) => p.id))} className="underline hover:text-moss-900">
                All
              </button>
              <button onClick={() => setChosen([])} className="underline hover:text-moss-900">
                None
              </button>
            </span>
          </div>
          <ul className="max-h-64 space-y-1 overflow-y-auto">
            {exportable.map((p) => (
              <li key={p.id}>
                <label className="flex items-center gap-2 text-[13px] text-moss-800">
                  <input
                    type="checkbox"
                    className="size-4 accent-moss-700"
                    checked={selected.includes(p.id)}
                    onChange={(e) => setChosen(e.target.checked ? [...selected, p.id] : selected.filter((x) => x !== p.id))}
                  />
                  {p.name}
                </label>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-[11px] text-moss-500">One sheet per project with live formulas, plus a summary sheet. Projects without an ROI model aren’t listed.</p>
          <button
            disabled={busy || selected.length === 0}
            onClick={() => run(selected)}
            className="mt-2 w-full rounded-md bg-moss-800 px-3 py-1.5 text-[13px] font-medium text-white hover:bg-moss-700 disabled:opacity-40"
          >
            {busy ? 'Preparing…' : `Export ${selected.length} project${selected.length === 1 ? '' : 's'}`}
          </button>
          {message && (
            <p className="mt-2 text-[12px] text-moss-600" role="status">
              {message}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
