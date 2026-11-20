/**
 * Small reusable building blocks, in the "Finance terminal" style:
 * square edges, hairline borders, small square status markers, aligned numbers.
 */
import type { ReactNode } from 'react';
import type { Phase } from '../data/types';

/** Each phase gets a marker colour. Early = muted, active = olive, done = dark. */
const PHASE_COLOR: Record<Phase, string> = {
  Scoping: 'bg-moss-300',
  Proposed: 'bg-plum',
  Approved: 'bg-slateblue',
  'In Development': 'bg-moss-600',
  'Testing / Validation': 'bg-ochre',
  Completed: 'bg-moss-900',
};

/** A small coloured square followed by the phase name. */
export function PhaseMarker({ phase }: { phase: Phase }) {
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
      <span className={`inline-block size-2 ${PHASE_COLOR[phase]}`} aria-hidden="true" />
      {phase}
    </span>
  );
}

/** A square outlined tag, e.g. "Launched" or "View only". */
export function Tag({ children, tone = 'neutral' }: { children: ReactNode; tone?: 'neutral' | 'solid' }) {
  const tones = {
    neutral: 'border-moss-300 text-moss-700',
    solid: 'border-moss-800 bg-moss-800 text-moss-50',
  };
  return (
    <span className={`inline-block whitespace-nowrap rounded border px-1.5 py-px text-[11px] font-medium ${tones[tone]}`}>
      {children}
    </span>
  );
}

/** A white panel with a hairline border and an optional title strip. */
export function Panel({ title, aside, children }: { title?: ReactNode; aside?: ReactNode; children: ReactNode }) {
  return (
    <section className="overflow-hidden rounded-md border border-moss-200 bg-white">
      {title && (
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-moss-200 px-4 py-2.5">
          <h2 className="text-[15px] font-semibold text-moss-900">{title}</h2>
          {aside}
        </div>
      )}
      {children}
    </section>
  );
}

export function PageHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-5">
      <h1 className="text-[22px] leading-tight font-semibold text-moss-900">{title}</h1>
      {subtitle && <p className="mt-1 max-w-3xl text-[13px] text-moss-500">{subtitle}</p>}
    </div>
  );
}

/** A row of headline figures, each in its own small card. */
export function KpiStrip({ items }: { items: { label: string; value: string }[] }) {
  return (
    <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
      {items.map((k) => (
        <div key={k.label} className="rounded-md border border-moss-200 bg-white px-4 py-3">
          <div className="text-[12px] text-moss-500">{k.label}</div>
          <div className="num mt-0.5 text-[22px] leading-tight font-semibold text-moss-900">{k.value}</div>
        </div>
      ))}
    </div>
  );
}

/**
 * A row of tabs with a count on each, e.g. "Completed 4".
 * The active tab has a thick olive underline; the row scrolls sideways on phones.
 */
export function Tabs<T extends string>({
  tabs,
  active,
  onChange,
  label,
}: {
  tabs: { id: T; label: string; count?: number }[];
  active: T;
  onChange: (id: T) => void;
  label: string;
}) {
  return (
    <div
      role="tablist"
      aria-label={label}
      className="flex overflow-x-auto overflow-y-hidden shadow-[inset_0_-1px_0_var(--color-moss-200)]"
    >
      {tabs.map((t) => {
        const selected = t.id === active;
        return (
          <button
            key={t.id}
            role="tab"
            aria-selected={selected}
            onClick={() => onChange(t.id)}
            className={`flex shrink-0 items-center gap-2 border-b-[3px] px-4 py-2.5 text-[13px] whitespace-nowrap ${
              selected
                ? 'border-moss-600 bg-white font-semibold text-moss-900'
                : 'border-transparent text-moss-600 hover:border-moss-300 hover:text-moss-900'
            }`}
          >
            {t.label}
            {t.count !== undefined && (
              <span
                className={`num min-w-5 rounded px-1 text-center text-[11px] ${
                  selected ? 'bg-moss-800 text-moss-50' : 'bg-moss-100 text-moss-700'
                }`}
              >
                {t.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

/** Shared table styles: dense rows, shaded header, hairline dividers. */
export const table = 'w-full border-collapse text-[13px]';
export const th = 'whitespace-nowrap bg-moss-100 px-3 py-1.5 text-left text-[11px] font-medium text-moss-700';
export const td = 'border-t border-moss-100 px-3 py-1.5 align-top';
export const right = 'text-right';
