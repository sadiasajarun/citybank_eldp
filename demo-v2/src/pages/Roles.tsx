

import { trainingStatus, useDemo } from '../store';


import { PageHead } from '../components/Templates';

export function Fr({ children }: { children: React.ReactNode }) {
  const on = useDemo((s) => s.showFr);
  if (!on) return null;
  return <span className="inline-flex shrink-0 items-center rounded border border-line bg-white px-1.5 py-px text-[14px] font-semibold text-ink-3" title="Annexure-II functional requirement">{children}</span>;
}

/** Page header for task screens: clickable breadcrumb + canonical page name (F5.2). */
export function PageTitle({ title, sub, fr, actions }: { eyebrow?: string; title: React.ReactNode; sub?: React.ReactNode; fr?: string; actions?: React.ReactNode }) {
  return <PageHead title={title} meta={sub} fr={fr} actions={actions} />;
}

/* ---------------- Employee ---------------- */
export { trainingStatus };
