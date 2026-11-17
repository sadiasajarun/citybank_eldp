/**
 * Division Head home (FR 13–15, 186): greeting and the learning need, the division's training summary (every figure opens
 * the people behind it), skill gaps by competency, level and department, and the division's training requests.
 */
import { useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { CREDIT_TARGET, inDivision, type Person } from '../../org';
import { useDemo } from '../../store';
import { tasksFor } from '../../lifecycle';
import { useSwitchRole } from '../../components/perspective';
import { Badge, cx, Drawer } from '../../components/ui';
import { COMPETENCIES, PriorityPill, TNA_DIVISION, type CompetencyView } from '../../components/Tna';
import { inPeriod, isDone, PERIODS, personRows, trainingRecords, useDrill } from './dash';
import { TaskList } from './Dashboards';
import { greeting, NeedCard } from '../Command';
import { requestLog } from './requests';
import { DivisionInsight } from './RoleInsights';

const TARGET_ROLES = ['Relationship Manager', 'Credit Analyst', 'Senior Credit Analyst', 'Senior Officer', 'Officer, Credit Risk'];

/* ---------------- competency analysis (Credit Analysis from records; others are fictional figures) ---------------- */
interface Dept { name: string; people: Person[]; size: number; below: number; level: number }
function analyse(c: CompetencyView) {
  const all = inDivision(TNA_DIVISION);
  const names = [...new Set(all.map((p) => p.department))].sort();
  let levels: number[];
  let depts: Dept[];
  if (c.story) {
    const target = all.filter((p) => TARGET_ROLES.includes(p.designation));
    levels = [1, 2, 3, 4, 5].map((l) => target.filter((p) => p.creditLevel === l).length);
    depts = names.map((name) => {
      const people = all.filter((p) => p.department === name);
      const t = people.filter((p) => TARGET_ROLES.includes(p.designation));
      return { name, people, size: t.length, below: t.filter((p) => p.creditLevel < CREDIT_TARGET).length, level: t.length ? t.reduce((n, p) => n + p.creditLevel, 0) / t.length : CREDIT_TARGET };
    });
  } else {
    levels = [1, 2, 3, 4, 5].map((l) => (l === c.current ? c.below : l === Math.max(1, c.current - 1) && c.current > 1 ? 0 : l === c.target ? c.total - c.below : 0));
    let left = c.below;
    depts = names.map((name, i) => {
      const people = all.filter((p) => p.department === name);
      const below = i === names.length - 1 ? left : Math.min(left, Math.round((c.below * people.length) / all.length));
      left -= below;
      const size = Math.max(below, Math.round((c.total * people.length) / all.length));
      return { name, people, size, below, level: size ? (below * c.current + (size - below) * c.target) / size : c.target };
    });
  }
  const n = levels.reduce((a, b) => a + b, 0);
  const avg = n ? levels.reduce((a, v, i) => a + v * (i + 1), 0) / n : 0;
  const worst = [...depts].sort((a, b) => b.below / Math.max(1, b.size) - a.below / Math.max(1, a.size))[0];
  return { levels, depts, avg, worst };
}

export function DivisionHome() {
  const s = useDemo();
  const go = useSwitchRole();
  const drill = useDrill();
  const [period, setPeriod] = useState('fy2026');
  const [comp, setComp] = useState(COMPETENCIES[0].name);
  const [dept, setDept] = useState<Dept | null>(null);
  const [tab, setTab] = useState<'All' | 'Ongoing' | 'Completed'>('All');
  const people = inDivision(TNA_DIVISION);
  const rows = personRows(s, people);
  const eids = new Set(people.map((p) => p.eid));
  const recs = trainingRecords(s).filter((r) => eids.has(r.eid) && inPeriod(period, r.ym));
  const trained = new Set(recs.filter(isDone).map((r) => r.eid));
  const enrolled = rows.filter((r) => r.course);
  const mandDone = enrolled.filter((r) => r.course?.status === 'Completed').length;
  const c = COMPETENCIES.find((x) => x.name === comp) ?? COMPETENCIES[0];
  const a = analyse(c);
  const hasTasks = tasksFor('division_head', s).length > 0;
  const periodLabel = PERIODS.find((p) => p.key === period)?.label ?? '';

  const kpis: { n: string; l: string; warn?: boolean; open: () => void }[] = [
    { n: String(people.length), l: 'People', open: () => drill.open({ title: `Everyone in ${TNA_DIVISION}`, rows }) },
    { n: String(rows.filter((r) => r.p.creditLevel < CREDIT_TARGET && TARGET_ROLES.includes(r.p.designation)).length), l: 'Below target', warn: true, open: () => drill.open({ title: 'Below target in Credit Analysis', rows: rows.filter((r) => r.p.creditLevel < CREDIT_TARGET && TARGET_ROLES.includes(r.p.designation)), needs: true }) },
    { n: String(trained.size), l: 'Trained', open: () => drill.open({ title: `Completed a training · ${periodLabel}`, rows: rows.filter((r) => trained.has(r.p.eid)) }) },
    { n: recs.reduce((x, r) => x + r.hours, 0).toLocaleString('en-IN'), l: 'Learning hours', open: () => drill.open({ title: `Learning hours · ${periodLabel}`, rows: rows.filter((r) => recs.some((x) => x.eid === r.p.eid && x.hours > 0)) }) },
    { n: enrolled.length ? `${Math.round((mandDone / enrolled.length) * 100)}%` : '—', l: 'Mandatory done', warn: true, open: () => drill.open({ title: 'Mandatory course status', rows: enrolled }) },
  ];
  const log = requestLog(s).filter((r) => tab === 'All' || r.status === tab);
  const maxLevel = Math.max(1, ...a.levels);

  return (
    <div className="mx-auto max-w-[1440px] px-8 pb-12">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[40px] font-semibold leading-[1.1] tracking-tight">{greeting()}, Farzana</h1>
          <p className="mt-1 text-[17px] text-ink-2">Here is the most important learning need for {TNA_DIVISION}.</p>
        </div>
        <select value={period} onChange={(e) => setPeriod(e.target.value)} aria-label="Time frame" className="min-h-11 rounded-lg border border-line bg-white px-3 text-[15px]">
          {PERIODS.map((p) => <option key={p.key} value={p.key}>{p.label}</option>)}
        </select>
      </header>

      <div className="mt-6"><NeedCard /></div>

      {/* training summary: every figure opens its people */}
      <ul className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-5">
        {kpis.map((k) => (
          <li key={k.l}>
            <button onClick={k.open} className="group w-full rounded-2xl bg-white px-6 py-5 text-left ring-1 ring-line transition-shadow hover:shadow-md hover:ring-ink/20">
              <div className={cx('text-[38px] font-semibold leading-none tabular-nums', k.warn && 'text-amber-700')}>{k.n}</div>
              <div className="mt-2 flex items-center justify-between text-[15px] text-ink-2">{k.l}<ChevronRight size={16} className="text-ink-3 group-hover:text-ink" /></div>
            </button>
          </li>
        ))}
      </ul>

      <DivisionInsight />

      {hasTasks && <div className="mt-8"><TaskList role="division_head" /></div>}

      {/* skill gaps */}
      <section aria-labelledby="gap-h" className="mt-8 rounded-2xl bg-white px-7 py-6 ring-1 ring-line">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="gap-h" className="text-[22px] font-semibold">Skill gaps</h2>
          <button onClick={() => go('division_head', '/division')} className="text-[15px] text-brand hover:underline">Analyse in TNA →</button>
        </div>
        <div className="mt-5 grid gap-8 xl:grid-cols-[minmax(0,0.85fr)_minmax(0,1.4fr)]">
          <ul className="space-y-1" role="radiogroup" aria-label="Competency">
            {COMPETENCIES.map((x) => (
              <li key={x.name}>
                <button role="radio" aria-checked={x.name === comp} onClick={() => setComp(x.name)}
                  className={cx('grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-xl px-4 py-3 text-left', x.name === comp ? 'bg-canvas ring-1 ring-ink/15' : 'hover:bg-canvas/60')}>
                  <span className="min-w-0"><span className="block text-[16px] font-medium">{x.name}</span><span className="text-[14px] text-ink-3">{x.below} of {x.total} below · level {x.current} → {x.target}</span></span>
                  <PriorityPill>{x.priority}</PriorityPill>
                </button>
              </li>
            ))}
          </ul>

          <div className="min-w-0 rounded-2xl bg-canvas/50 px-6 py-5">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h3 className="text-[20px] font-semibold">{c.name}</h3>
              <span className="text-[14px] text-ink-3">{c.category} competency · {c.roles}</span>
            </div>
            <dl className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-4">
              {([['Below target', `${c.below} of ${c.total}`], ['Average level', a.avg.toFixed(1)], ['Target level', String(c.target)], ['Most affected', a.worst?.name ?? '—']] as [string, string][]).map(([k, v]) => (
                <div key={k}><dt className="text-[14px] text-ink-3">{k}</dt><dd className={cx('text-[22px] font-semibold leading-tight', k === 'Most affected' && 'text-[17px]')}>{v}</dd></div>
              ))}
            </dl>

            <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
              <div>
                <div className="mb-2 text-[14px] text-ink-3">People at each level</div>
                <div className="flex h-36 items-end gap-3">
                  {a.levels.map((n, i) => (
                    <div key={i} className="flex flex-1 flex-col items-center gap-1">
                      <span className="text-[14px] tabular-nums">{n}</span>
                      <span className={cx('w-full rounded-t-md', i + 1 < c.target ? 'bg-amber-300' : 'bg-ok/60')} style={{ height: `${Math.max(4, (n / maxLevel) * 96)}px` }} />
                      <span className={cx('text-[14px]', i + 1 === c.target ? 'font-semibold text-ink' : 'text-ink-3')}>L{i + 1}{i + 1 === c.target ? ' ◂' : ''}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <div className="mb-2 text-[14px] text-ink-3">By department · select one</div>
                <ul className="space-y-1">
                  {a.depts.map((d) => (
                    <li key={d.name}>
                      <button onClick={() => setDept(d)} className="grid w-full grid-cols-[minmax(0,1fr)_minmax(0,1fr)_64px] items-center gap-3 rounded-lg px-2 py-2 text-left text-[15px] hover:bg-white">
                        <span className="truncate">{d.name}</span>
                        <span className="h-2 rounded-full bg-white"><span className="block h-2 rounded-full bg-amber-400" style={{ width: `${d.size ? (d.below / d.size) * 100 : 0}%` }} /></span>
                        <span className="text-right tabular-nums text-ink-2">{d.below}/{d.size}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <p className="mt-5 border-t border-line pt-4 text-[15px]"><span className="text-ink-3">Suggested training </span>{c.training ?? 'None needed now'}</p>
          </div>
        </div>
      </section>

      {/* the division's training requests */}
      <section aria-labelledby="req-h" className="mt-8 rounded-2xl bg-white px-7 py-6 ring-1 ring-line">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="req-h" className="text-[22px] font-semibold">Your training requests</h2>
          <div className="flex gap-1 rounded-lg bg-canvas p-1" role="tablist">
            {(['All', 'Ongoing', 'Completed'] as const).map((t) => (
              <button key={t} role="tab" aria-selected={tab === t} onClick={() => setTab(t)} className={cx('rounded-md px-3 py-1.5 text-[15px]', tab === t ? 'bg-white shadow-sm' : 'text-ink-2')}>{t}</button>
            ))}
          </div>
        </div>
        <ul className="mt-4 divide-y divide-line">
          {log.map((r) => (
            <li key={r.id}>
              <button onClick={() => go('division_head', `/division/requests/${r.id}`)} className="group grid w-full grid-cols-[minmax(0,2fr)_minmax(0,1fr)_70px_110px_minmax(0,1.3fr)_20px] items-center gap-4 rounded-lg px-2 py-3.5 text-left hover:bg-canvas/60">
                <span className="min-w-0"><span className="block truncate text-[16px] group-hover:text-brand">{r.title}</span><span className="text-[14px] text-ink-3">{r.id} · {r.raised}</span></span>
                <span className="truncate text-[15px] text-ink-2">{r.source.split(' · ')[0]}</span>
                <span className="text-[15px] tabular-nums">{r.people}</span>
                <span><Badge t={r.status === 'Completed' ? 'ok' : r.status === 'Ongoing' ? 'info' : 'neutral'}>{r.status}</Badge></span>
                <span className="truncate text-[15px] text-ink-2">{r.outcome}</span>
                <ChevronRight size={17} className="text-ink-3 group-hover:text-ink" />
              </button>
            </li>
          ))}
        </ul>
      </section>

      {drill.panel}
      <Drawer open={dept !== null} onClose={() => setDept(null)} title={dept ? `${dept.name} · ${c.name}` : ''}>
        {dept && (
          <ul className="divide-y divide-line">
            {dept.people.map((p) => (
              <li key={p.id} className="flex items-center justify-between gap-4 py-3">
                <span><span className="block text-[16px]">{p.name}</span><span className="text-[14px] text-ink-3">{p.designation}</span></span>
                {c.story && TARGET_ROLES.includes(p.designation) && <span className={cx('text-[15px] tabular-nums', p.creditLevel < CREDIT_TARGET ? 'text-amber-700' : 'text-ok')}>Level {p.creditLevel} of {CREDIT_TARGET}</span>}
              </li>
            ))}
          </ul>
        )}
      </Drawer>
    </div>
  );
}
