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
    <span className={`inline-block whitespace-nowrap border px-1.5 py-px text-[11px] font-medium uppercase tracking-wide ${tones[tone]}`}>
      {children}
    </span>
  );
}

/** A white panel with a hairline border and an optional title strip. */
export function Panel({ title, aside, children }: { title?: ReactNode; aside?: ReactNode; children: ReactNode }) {
  return (
    <section className="border border-moss-200 bg-white">
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
    <div className="mb-5 border-b border-moss-200 pb-3">
      <h1 className="font-serif text-[28px] leading-tight font-semibold text-moss-900">{title}</h1>
      {subtitle && <p className="mt-1 max-w-3xl text-[13px] text-moss-500">{subtitle}</p>}
    </div>
  );
}

/** A row of headline figures separated by hairlines. */
export function KpiStrip({ items }: { items: { label: string; value: string }[] }) {
  return (
    <div className="mb-5 grid grid-cols-2 gap-px border border-moss-200 bg-moss-200 sm:grid-cols-4">
      {items.map((k) => (
        <div key={k.label} className="bg-white px-4 py-2.5">
          <div className="text-[11px] text-moss-500">{k.label}</div>
          <div className="num font-serif text-[26px] leading-tight font-medium text-moss-900">{k.value}</div>
        </div>
      ))}
    </div>
  );
}

/** Shared table styles: dense rows, shaded header, hairline dividers. */
export const table = 'w-full border-collapse text-[13px]';
export const th = 'whitespace-nowrap bg-moss-100 px-3 py-1.5 text-left text-[11px] font-medium text-moss-700';
export const td = 'border-t border-moss-100 px-3 py-1.5 align-top';
export const right = 'text-right';
