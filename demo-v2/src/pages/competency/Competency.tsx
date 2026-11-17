/**
 * Competency & learning journey (FR 241–243): six City Bank pillars per person, a radar of current vs role target,
 * gap cards with focus competencies and a recommended course, a staged learning journey, self & manager review
 * with weighted scoring, and the framework setup. Scores are fictional demonstration data.
 */
import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowRight, Award, CheckCircle2, Gauge, Lock, Target, TriangleAlert } from 'lucide-react';
import { useDemo } from '../../store';
import { JOURNEY_STAGES, PILLAR_PROFILES, PILLARS } from '../../seed/bank';
import { Panel, StatCard } from '../../components/Dash';
import { Radar } from '../../components/charts';
import { cx } from '../../components/ui';
import { SourceTag } from '../../components/Source';

type Tab = 'radar' | 'journey' | 'review' | 'framework';
const LEVELS = ['Lv 1 · Foundation', 'Lv 2 · Developing', 'Lv 3 · Competent', 'Lv 4 · Proficient', 'Lv 5 · Expert'];
const levelOf = (v: number) => LEVELS[Math.min(4, Math.max(0, Math.round(v) - 1))];

export function CompetencyPage() {
  const s = useDemo();
  const nav = useNavigate();
  const [params, setParams] = useSearchParams();
  const tab = (params.get('tab') as Tab) || 'radar';
  const setTab = (t: Tab) => { params.set('tab', t); setParams(params, { replace: true }); };
  const ids = Object.keys(PILLAR_PROFILES);
  const [who, setWho] = useState(s.role === 'employee' && ids.includes(s.employeeId) ? s.employeeId : 'e1');
  const p = PILLAR_PROFILES[who];
  const scores = p.scores.map((x) => (x.pillar === 'Functional' && who === 'e1' && s.pta.released ? { ...x, current: Math.max(x.current, 3.1) } : x));
  const avg = +(scores.reduce((n, x) => n + x.current, 0) / scores.length).toFixed(1);
  const target = +(scores.reduce((n, x) => n + x.target, 0) / scores.length).toFixed(1);
  const strongest = [...scores].sort((a, b) => b.current - a.current)[0];
  const gaps = scores.filter((x) => x.current < x.target).sort((a, b) => (a.current - a.target) - (b.current - b.target));
  const staff = s.role !== 'employee';

  return (
    <div className="mx-auto max-w-[1440px]">
      <header className="mb-5 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[34px] font-semibold tracking-tight">Competency &amp; learning journey</h1>
          <p className="mt-1 flex flex-wrap items-center gap-2 text-[16px] text-ink-2">{p.name} ({p.role} · {p.division}) — City Bank six competency pillars <SourceTag kind="fictional" /></p>
        </div>
        <select value={who} onChange={(e) => setWho(e.target.value)} aria-label="Employee" className="min-h-11 rounded-lg border border-line bg-white px-3 text-[15px]">{ids.map((id) => <option key={id} value={id}>{PILLAR_PROFILES[id].name} ({PILLAR_PROFILES[id].role})</option>)}</select>
      </header>

      <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <li><StatCard label="Overall competency average" value={`${avg} / 5.0`} icon={Gauge} sub="Weighted across 6 pillars" /></li>
        <li><StatCard label="Role target score" value={`${target} / 5.0`} icon={Target} tone="ink" sub={`Band: ${p.role}`} /></li>
        <li><StatCard label="Strongest pillar" value={<span className="text-[26px]">{strongest.pillar}</span>} icon={Award} tone="ok" sub={`Score ${strongest.current} / 5.0`} /></li>
        <li><StatCard label="Priority focus area" value={<span className="text-[26px]">{gaps[0]?.pillar ?? 'None'}</span>} icon={TriangleAlert} tone="amber" sub={gaps.length ? `${gaps.length} pillar${gaps.length > 1 ? 's' : ''} below target` : 'All targets achieved'} /></li>
      </ul>

      <div role="tablist" className="mt-6 flex flex-wrap gap-1 rounded-xl bg-white p-1 ring-1 ring-line">
        {([['radar', '6-pillar radar & gaps'], ['journey', 'Learning journey'], ['review', 'Self & manager review'], ...(staff ? [['framework', 'Framework setup']] : [])] as [Tab, string][]).map(([k, l]) => <button key={k} role="tab" aria-selected={tab === k} onClick={() => setTab(k)} className={cx('rounded-lg px-4 py-2 text-[15px]', tab === k ? 'bg-brand-soft font-semibold text-brand' : 'text-ink-2 hover:text-ink')}>{l}</button>)}
      </div>

      <div className="mt-6">
        {tab === 'radar' && (
          <div className="space-y-6">
            <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
              <Panel title="Six-axis competency radar" sub={`Current level vs ${p.role} target benchmark · scale 1–5`}>
                <Radar axes={[...PILLARS]} current={scores.map((x) => x.current)} target={scores.map((x) => x.target)} />
              </Panel>
              <Panel title="Current vs target breakdown">
                <ul className="space-y-3">
                  {scores.map((x) => (
                    <li key={x.pillar} className="rounded-xl bg-canvas/70 px-4 py-3">
                      <div className="flex flex-wrap items-center justify-between gap-2 text-[15px]"><b>{x.pillar}</b><span className="flex items-center gap-2"><span className="tabular-nums"><b>{x.current}</b> / {x.target} target</span><span className={cx('rounded-full px-2.5 py-0.5 text-[12px] font-medium', x.current >= x.target ? 'bg-ok-soft text-ok' : 'bg-amber-50 text-amber-800')}>{levelOf(x.current)}</span></span></div>
                      <div className="relative mt-2 h-2 rounded-full bg-white"><div className={cx('h-2 rounded-full', x.current >= x.target ? 'bg-ok' : 'bg-amber-400')} style={{ width: `${(x.current / 5) * 100}%` }} /><span className="absolute -top-1 h-4 w-0.5 bg-ink" style={{ left: `${(x.target / 5) * 100}%` }} /></div>
                    </li>
                  ))}
                </ul>
              </Panel>
            </div>
            <ul className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {scores.map((x) => {
                const met = x.current >= x.target;
                return (
                  <li key={x.pillar} className={cx('rounded-2xl bg-white px-5 py-4 ring-1', met ? 'ring-ok/40' : 'ring-amber-300')}>
                    <div className="flex items-center justify-between gap-2"><span className="flex items-center gap-2 text-[18px] font-semibold">{met ? <CheckCircle2 size={18} className="text-ok" /> : <TriangleAlert size={18} className="text-amber-600" />}{x.pillar}</span><span className={cx('rounded-full px-2.5 py-0.5 text-[13px]', met ? 'bg-ok-soft text-ok' : 'bg-amber-50 text-amber-800')}>{met ? 'Target met' : `Gap ${(x.target - x.current).toFixed(1)}`}</span></div>
                    <div className="mt-1 text-[14px] text-ink-3">Current {x.current} · target {x.target}</div>
                    <div className="mt-3 text-[12px] font-semibold uppercase tracking-wide text-ink-3">Focus competencies</div>
                    <ul className="mt-1 space-y-0.5 text-[15px]">{x.focus.map((f) => <li key={f} className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-ok" />{f}</li>)}</ul>
                    <div className="mt-3 flex items-center justify-between gap-3 border-t border-line pt-3"><span className="min-w-0"><span className="block text-[12px] text-ink-3">Recommended course</span><span className="block truncate text-[15px] font-medium">{x.course}</span></span><button onClick={() => nav('/learning/hub?tab=catalog')} className="flex shrink-0 items-center gap-1 rounded-lg border border-line px-3 py-1.5 text-[14px]">Review<ArrowRight size={14} /></button></div>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {tab === 'journey' && <Journey />}
        {tab === 'review' && <Review pillars={scores.map((x) => ({ pillar: x.pillar, current: x.current }))} name={p.name} />}
        {tab === 'framework' && staff && <Framework />}
      </div>
    </div>
  );
}

function Journey() {
  const [sel, setSel] = useState(JOURNEY_STAGES.findIndex((x) => x.state === 'Active'));
  const st = JOURNEY_STAGES[sel];
  const tone = { Completed: 'bg-ok text-white', Active: 'bg-brand text-white ring-4 ring-brand-soft', Unlocked: 'bg-white text-sky-700 ring-2 ring-sky-400', Locked: 'bg-canvas text-ink-3 ring-1 ring-line' } as const;
  return (
    <div className="space-y-6">
      <section className="rounded-2xl bg-white px-6 py-8 ring-1 ring-line">
        <ol className="grid gap-6 md:grid-cols-4">
          {JOURNEY_STAGES.map((x, i) => (
            <li key={x.title} className="relative text-center">
              {i < JOURNEY_STAGES.length - 1 && <span className={cx('absolute left-1/2 top-6 hidden h-1 w-full md:block', x.state === 'Completed' ? 'bg-ok' : x.state === 'Active' ? 'bg-brand/40' : 'bg-line')} />}
              <button onClick={() => setSel(i)} className={cx('relative z-10 mx-auto grid h-12 w-12 place-items-center rounded-full text-[17px] font-bold', tone[x.state])}>{x.state === 'Completed' ? <CheckCircle2 size={22} /> : x.state === 'Locked' ? <Lock size={18} /> : i + 1}</button>
              <div className={cx('mt-3 text-[16px] font-semibold', x.state === 'Active' && 'text-brand', x.state === 'Locked' && 'text-ink-3')}>{x.title}</div>
              <div className="text-[14px] text-ink-3">{x.level}</div>
              <span className={cx('mt-1 inline-block rounded-full px-2.5 py-0.5 text-[12px] font-semibold uppercase', x.state === 'Completed' ? 'bg-ok-soft text-ok' : x.state === 'Active' ? 'bg-brand text-white' : x.state === 'Unlocked' ? 'bg-sky-50 text-sky-800' : 'bg-canvas text-ink-3')}>{x.state} · {x.pct}%</span>
            </li>
          ))}
        </ol>
      </section>
      <Panel title={`Stage ${sel + 1}: ${st.title}`} sub={st.level} action={<button onClick={() => useDemo.getState().logEvent('employee', 'Milestone progress recorded', st.title)} className="flex min-h-10 items-center gap-2 rounded-lg bg-brand px-4 text-[15px] font-medium text-white"><CheckCircle2 size={16} />Record milestone progress</button>}>
        <div className="flex items-center gap-3"><span className="h-2 flex-1 rounded-full bg-canvas"><span className="block h-2 rounded-full bg-brand" style={{ width: `${st.pct}%` }} /></span><b className="tabular-nums">{st.pct}%</b></div>
        <ul className="mt-4 grid gap-3 md:grid-cols-2">{st.courses.map(([c, v]) => <li key={c} className="flex justify-between rounded-lg border border-line px-4 py-3 text-[15px]"><span>{c}</span><span className="tabular-nums text-ink-3">{v}%</span></li>)}</ul>
      </Panel>
    </div>
  );
}

function Review({ pillars, name }: { pillars: { pillar: string; current: number }[]; name: string }) {
  const s = useDemo();
  const [self, setSelf] = useState<Record<string, number>>(Object.fromEntries(pillars.map((p) => [p.pillar, Math.round(p.current)])));
  const [mgr, setMgr] = useState<Record<string, number>>(Object.fromEntries(pillars.map((p) => [p.pillar, Math.max(1, Math.round(p.current - 0.3))])));
  const weighted = (p: string, cur: number) => +(cur * 0.6 + mgr[p] * 0.25 + self[p] * 0.15).toFixed(1);
  return (
    <Panel title={`Self & manager review · ${name}`} sub="Assessment 60% · manager 25% · self 15% gives the calculated level (FR 241–242)" action={<button onClick={() => { s.logEvent(s.role === 'supervisor' ? 'supervisor' : 'employee', 'Competency review submitted', `${name} · ${pillars.length} pillars`); useDemo.setState({ toast: 'Review submitted · the calculated levels go to HR for confirmation' }); }} className="min-h-10 rounded-lg bg-brand px-4 text-[15px] font-medium text-white">Submit review</button>}>
      <div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left text-[15px]">
        <thead className="text-[13px] uppercase tracking-wide text-ink-3"><tr>{['Pillar', 'Assessment score', 'Self rating (1–5)', 'Manager rating (1–5)', 'Calculated level'].map((h) => <th key={h} className="py-2 pr-4 font-semibold">{h}</th>)}</tr></thead>
        <tbody className="divide-y divide-line">{pillars.map((p) => <tr key={p.pillar}><td className="py-3 pr-4 font-medium">{p.pillar}</td><td className="py-3 pr-4 tabular-nums">{p.current}</td>
          <td className="py-3 pr-4"><Stars v={self[p.pillar]} on={(v) => setSelf({ ...self, [p.pillar]: v })} /></td>
          <td className="py-3 pr-4"><Stars v={mgr[p.pillar]} on={(v) => setMgr({ ...mgr, [p.pillar]: v })} /></td>
          <td className="py-3 pr-4"><b className="tabular-nums">{weighted(p.pillar, p.current)}</b> <span className="text-[13px] text-ink-3">{levelOf(weighted(p.pillar, p.current))}</span></td></tr>)}</tbody>
      </table></div>
    </Panel>
  );
}
function Stars({ v, on }: { v: number; on: (v: number) => void }) {
  return <span className="flex gap-1">{[1, 2, 3, 4, 5].map((n) => <button key={n} onClick={() => on(n)} aria-label={`${n}`} className={cx('h-8 w-8 rounded-md text-[14px] font-semibold', n <= v ? 'bg-brand text-white' : 'bg-canvas text-ink-3')}>{n}</button>)}</span>;
}

function Framework() {
  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <Panel title="Pillars and focus competencies" sub="Set up by HR; changes go through maker-checker (proposed)">
        <ul className="divide-y divide-line">{PILLAR_PROFILES.e1.scores.map((x) => <li key={x.pillar} className="py-3"><b className="text-[16px]">{x.pillar}</b><div className="text-[14px] text-ink-2">{x.focus.join(' · ')}</div></li>)}</ul>
      </Panel>
      <Panel title="Proficiency levels and role targets" sub="Level definitions (1–5) and target by role band">
        <ul className="mb-4 space-y-1 text-[15px]">{LEVELS.map((l) => <li key={l}>{l}</li>)}</ul>
        <table className="w-full text-left text-[15px]"><thead className="text-[13px] uppercase tracking-wide text-ink-3"><tr><th className="py-2 pr-4">Role band</th><th className="py-2 pr-4">Functional</th><th className="py-2 pr-4">Leadership</th><th className="py-2">Execution</th></tr></thead>
          <tbody className="divide-y divide-line">{[['Officer', 3.3, 2.0, 3.5], ['Senior Officer / RM', 3.5, 3.0, 3.7], ['Manager / AVP', 4.0, 3.5, 4.0], ['Division Head', 4.2, 4.5, 4.2]].map(([r, a, b, c]) => <tr key={r as string}><td className="py-2.5 pr-4">{r}</td><td className="py-2.5 pr-4 tabular-nums">{a}</td><td className="py-2.5 pr-4 tabular-nums">{b}</td><td className="py-2.5 tabular-nums">{c}</td></tr>)}</tbody></table>
      </Panel>
    </div>
  );
}
