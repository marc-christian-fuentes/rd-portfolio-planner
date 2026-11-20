/** Small reusable building blocks for the pages. */
import type { ReactNode } from 'react';
import type { Phase } from '../data/types';

const PHASE_STYLES: Record<Phase, string> = {
  Scoping: 'bg-violet-50 text-violet-700 ring-violet-200',
  Proposed: 'bg-amber-50 text-amber-800 ring-amber-200',
  Approved: 'bg-blue-50 text-blue-700 ring-blue-200',
  'In Development': 'bg-cyan-50 text-cyan-800 ring-cyan-200',
  'Testing / Validation': 'bg-orange-50 text-orange-800 ring-orange-200',
  Completed: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
};

export function PhaseBadge({ phase }: { phase: Phase }) {
  return (
    <span className={`inline-block whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ring-inset ${PHASE_STYLES[phase]}`}>
      {phase}
    </span>
  );
}

export function Pill({ children, tone = 'slate' }: { children: ReactNode; tone?: 'slate' | 'green' | 'blue' }) {
  const tones = {
    slate: 'bg-slate-100 text-slate-700',
    green: 'bg-emerald-50 text-emerald-700',
    blue: 'bg-blue-50 text-blue-700',
  };
  return <span className={`inline-block whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-semibold ${tones[tone]}`}>{children}</span>;
}

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <section className={`rounded-xl border border-slate-200 bg-white p-4 shadow-sm ${className}`}>{children}</section>;
}

export function PageHeader({ title, subtitle, children }: { title: string; subtitle?: string; children?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
        {subtitle && <p className="mt-1 max-w-2xl text-sm text-slate-500">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

/** Table styles shared across pages. */
export const th = 'whitespace-nowrap border-b border-slate-200 px-3 py-2 text-left text-xs font-semibold text-slate-500';
export const td = 'border-b border-slate-100 px-3 py-2 align-top text-sm';
export const num = 'text-right whitespace-nowrap';
