import { cx } from './ui';

/** Honest labelling (F2): anything not stated in Annexure-II, or not live, says so. */
export type SourceKind = 'fictional' | 'proposed' | 'concept' | 'simulated' | 'architecture';
const LABEL: Record<SourceKind, string> = {
  fictional: 'Fictional demonstration data',
  proposed: 'Proposed workflow',
  concept: 'Demonstration concept',
  simulated: 'Simulated integration',
  architecture: 'Proposed architecture',
};
const TIP: Record<SourceKind, string> = {
  fictional: 'Names, IDs and amounts are invented for this demonstration. They did not come from City Bank.',
  proposed: 'Our proposal. Annexure-II does not name this step or role.',
  concept: 'A presentation aid for this demo, not a named Annexure-II requirement.',
  simulated: 'No live bank system is connected. The result is simulated.',
  architecture: 'Proposed solution architecture, to be confirmed with the IT Division.',
};
const TONE: Record<SourceKind, string> = {
  fictional: 'border-ink/15 text-ink-3',
  proposed: 'border-amber-300 text-amber-800 bg-amber-50',
  concept: 'border-sky-200 text-sky-800 bg-sky-50',
  simulated: 'border-ink/15 text-ink-3',
  architecture: 'border-violet-200 text-violet-800 bg-violet-50',
};

export function SourceTag({ kind, children, className }: { kind: SourceKind; children?: React.ReactNode; className?: string }) {
  return (
    <span title={TIP[kind]} className={cx('inline-flex shrink-0 items-center gap-1 rounded-full border border-dashed px-2.5 py-0.5 text-[14px] font-medium leading-6', TONE[kind], className)}>
      {children ?? LABEL[kind]}
    </span>
  );
}

/** Requirement references, always visible (quiet), unlike the Fr toggle. */
export function FrRef({ children, className }: { children: React.ReactNode; className?: string }) {
  return <span title="Annexure-II functional requirement" className={cx('inline-flex shrink-0 items-center rounded-md bg-canvas px-2 py-0.5 text-[14px] font-semibold text-ink-3', className)}>{children}</span>;
}
