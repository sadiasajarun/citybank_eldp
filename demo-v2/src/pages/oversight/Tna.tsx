/**
 * Training needs (J1 · FR 15, 22, 185–188, 209): what the Division Head sees.
 * Three ways to raise a training request, one working request bar.
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Check, ChevronDown, ChevronUp, ClipboardList, Gauge, Sparkles, UserRound, type LucideIcon } from 'lucide-react';
import { CREDIT_TARGET, type Person } from '../../org';
import { useDemo } from '../../store';
import { DataTable, type Column } from '../../components/DataTable';
import { Badge, cx } from '../../components/ui';
import {
  COMPETENCIES, GAP, GapScale, IDP_REQUESTS, idpPerson, PriorityPill, SURVEY, TNA_DIVISION, WhyDrawer, type CompetencyView,
} from '../../components/Tna';
import { personRows } from './dash';

type Way = 'gap' | 'survey' | 'idp';

const btn = 'inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-4 text-[15px] font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-not-allowed disabled:opacity-50';
const primary = `${btn} bg-brand text-white hover:bg-brand-dark`;
const quiet = `${btn} border border-line bg-white text-ink hover:border-ink/30`;

export function TnaPage() {
  const s = useDemo();
  const [way, setWay] = useState<Way>('gap');
  const t = s.tna;
  const ways: { key: Way; icon: LucideIcon; title: string; line: string; metric: string; on: boolean }[] = [
    { key: 'gap', icon: Gauge, title: 'Competency and role gap', line: 'Skills your roles require', metric: `${GAP.gap.length} of ${GAP.total} officers below target`, on: t.gap && t.recommendation === 'accepted' },
    { key: 'survey', icon: ClipboardList, title: 'Survey or nomination', line: 'What your people asked for', metric: `${SURVEY.responses} survey responses`, on: t.survey },
    { key: 'idp', icon: UserRound, title: 'Development requests', line: 'Employees’ own development plans', metric: `${IDP_REQUESTS.length} requests waiting`, on: t.idpIds.length > 0 },
  ];
  return (
    <div className="mx-auto max-w-[1280px]">
      <h1 className="text-[34px] font-semibold tracking-tight">Training needs for {TNA_DIVISION}</h1>
      <p className="mt-1 text-[17px] text-ink-2">Choose how to raise a training request. You can combine more than one.</p>

      <div role="tablist" aria-label="Ways to raise a training request" className="mt-7 grid gap-4 md:grid-cols-3">
        {ways.map((w, i) => (
          <button key={w.key} role="tab" aria-selected={way === w.key} onClick={() => setWay(w.key)}
            className={cx('relative flex flex-col items-start gap-3 rounded-2xl border-2 px-6 py-5 text-left transition-colors', way === w.key ? 'border-brand bg-brand-soft/40' : 'border-line bg-white hover:border-ink/25')}>
            <span className="flex w-full items-center justify-between">
              <span className={cx('grid h-11 w-11 place-items-center rounded-xl', way === w.key ? 'bg-brand text-white' : 'bg-canvas text-ink-2')}><w.icon size={21} /></span>
              {w.on && <span className="flex items-center gap-1 rounded-full bg-ok-soft px-2.5 py-0.5 text-[14px] font-medium text-ok"><Check size={14} />In your request</span>}
            </span>
            <span>
              <span className="block text-[14px] text-ink-3">Way {i + 1}</span>
              <span className="block text-[19px] font-semibold">{w.title}</span>
              <span className="block text-[15px] text-ink-2">{w.line}</span>
            </span>
            <span className="text-[15px] text-ink">{w.metric}</span>
          </button>
        ))}
      </div>

      <div className="mt-8">
        {way === 'gap' && <GapWay />}
        {way === 'survey' && <SurveyWay />}
        {way === 'idp' && <IdpWay />}
      </div>

      <RequestBar way={way} />
    </div>
  );
}

/* ---------------- way 1: competency and role gap, any competency ---------------- */
function GapWay() {
  const s = useDemo();
  const [name, setName] = useState(COMPETENCIES[0].name);
  const [why, setWhy] = useState(false);
  const [officers, setOfficers] = useState(false);
  const c: CompetencyView = COMPETENCIES.find((x) => x.name === name) ?? COMPETENCIES[0];
  const t = s.tna;
  const done = s.requestSubmitted;
  const included = c.story && t.gap && t.recommendation === 'accepted';
  const later = t.later.includes(c.name);
  return (
    <section aria-label="Competency and role gap">
      <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Competency">
        {COMPETENCIES.map((x) => (
          <button key={x.name} role="radio" aria-checked={x.name === name} onClick={() => { setName(x.name); setOfficers(false); }}
            className={cx('rounded-full border px-4 py-2 text-[15px] transition-colors', x.name === name ? 'border-ink bg-ink text-white' : 'border-line bg-white text-ink-2 hover:border-ink/30')}>
            {x.name}{x.below > 0 && x.below / x.total >= 0.3 && <span className={cx('ml-2 inline-block h-2 w-2 rounded-full align-middle', x.name === name ? 'bg-amber-300' : 'bg-amber-500')} />}
          </button>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
        <div className="rounded-2xl border border-line px-7 py-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-[14px] text-ink-3">{c.category} competency</div>
              <div className="mt-1 text-[44px] font-semibold leading-none tabular-nums">{c.below}<span className="text-[22px] text-ink-3"> of {c.total} below target</span></div>
            </div>
            <PriorityPill>{c.priority}</PriorityPill>
          </div>
          <GapScale current={c.current} target={c.target} className="mt-6" />
          <p className="mt-5 text-[15px] text-ink-2">Roles: {c.roles}</p>
          {c.story && (
            <button onClick={() => setOfficers((v) => !v)} aria-expanded={officers} className="mt-3 flex items-center gap-1.5 text-[15px] text-brand hover:underline">
              {officers ? <ChevronUp size={16} /> : <ChevronDown size={16} />}{officers ? 'Hide' : 'See'} the {c.below} officers
            </button>
          )}
        </div>

        <div className="flex flex-col rounded-2xl bg-[#f1f6fb] px-7 py-6">
          <div className="flex items-center gap-2 text-[14px] text-sky-900"><Sparkles size={16} />AI suggestion · you decide</div>
          {c.training ? (
            <>
              <div className="mt-2 text-[24px] font-semibold leading-tight">{c.training}</div>
              <p className="mt-1 text-[15px] text-ink-2">Based on: {c.reason.toLowerCase()}.</p>
            </>
          ) : <div className="mt-2 text-[20px] font-medium">No training needed now</div>}
          <div className="mt-auto flex flex-wrap items-center gap-3 pt-6">
            {c.story ? (
              included
                ? <button onClick={() => s.setTna({ gap: false })} disabled={done} className={quiet}><Check size={16} className="text-ok" />Added to your request</button>
                : <button onClick={() => s.setTna({ gap: true, recommendation: 'accepted' })} disabled={done} className={primary}>Use this recommendation</button>
            ) : c.training ? (
              <button onClick={() => s.setTna({ later: later ? t.later.filter((x) => x !== c.name) : [...t.later, c.name] })} className={quiet}>{later ? <><Check size={16} className="text-ok" />Saved for the next cycle</> : 'Save for the next cycle'}</button>
            ) : null}
            {c.story && <button onClick={() => setWhy(true)} className="text-[15px] text-sky-800 hover:underline">Why?</button>}
          </div>
        </div>
      </div>
      {officers && c.story && <div className="mt-6"><OfficerTable /></div>}
      <WhyDrawer open={why} onClose={() => setWhy(false)} accepted={s.tna.recommendation === 'accepted'} />
    </section>
  );
}

function OfficerTable() {
  const s = useDemo();
  const status = new Map(personRows(s, GAP.gap).map((r) => [r.p.id, r.story]));
  const cols: Column<Person>[] = [
    { key: 'name', header: 'Name', render: (p) => <span className="font-medium">{p.name}</span>, sort: (p) => p.name },
    { key: 'dept', header: 'Department', render: (p) => p.department, filter: (p) => p.department },
    { key: 'des', header: 'Designation', render: (p) => p.designation, filter: (p) => p.designation },
    { key: 'lvl', header: 'Level', render: (p) => <span className="text-warn">Level {p.creditLevel} of {CREDIT_TARGET}</span>, sort: (p) => p.creditLevel },
    { key: 'st', header: 'This training', render: (p) => <Badge t={status.get(p.id) === 'Not nominated' ? 'neutral' : undefined}>{status.get(p.id) ?? '—'}</Badge>, filter: (p) => status.get(p.id) ?? '—' },
  ];
  return <DataTable rows={GAP.gap} columns={cols} rowKey={(p) => p.id} searchText={(p) => `${p.name} ${p.eid}`} label="officers below target" maxHeight={340} />;
}

/* ---------------- way 2: survey or nomination output ---------------- */
function SurveyWay() {
  const s = useDemo();
  const [pick, setPick] = useState(SURVEY.topics[0].topic);
  const sel = SURVEY.topics.find((x) => x.topic === pick) ?? SURVEY.topics[0];
  const t = s.tna;
  const done = s.requestSubmitted;
  const later = t.later.includes(sel.topic);
  const max = SURVEY.topics[0].votes;
  return (
    <section aria-label="Survey or nomination" className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
      <div className="rounded-2xl border border-line px-7 py-6">
        <div className="flex flex-wrap gap-x-10 gap-y-3">
          {([[SURVEY.responses, 'responses'], [SURVEY.high, 'high priority'], [SURVEY.champions.length, 'divisions agree']] as [number, string][]).map(([n, l]) => (
            <div key={l}><div className="text-[40px] font-semibold leading-none tabular-nums">{n}</div><div className="mt-1 text-[15px] text-ink-2">{l}</div></div>
          ))}
        </div>
        <fieldset className="mt-6">
          <legend className="mb-2 text-[15px] text-ink-3">Requested topics · select one</legend>
          <ul className="space-y-1.5">
            {SURVEY.topics.map((x) => (
              <li key={x.topic}>
                <label className={cx('grid cursor-pointer grid-cols-[20px_minmax(0,180px)_minmax(0,1fr)_32px] items-center gap-3 rounded-lg px-3 py-2', pick === x.topic ? 'bg-sky-50' : 'hover:bg-canvas')}>
                  <input type="radio" name="topic" checked={pick === x.topic} onChange={() => setPick(x.topic)} className="h-4 w-4 accent-brand" />
                  <span className="truncate text-[16px]">{x.topic}</span>
                  <span className="h-2 rounded-full bg-canvas"><span className="block h-2 rounded-full bg-ink/70" style={{ width: `${(x.votes / max) * 100}%` }} /></span>
                  <span className="text-right text-[15px] tabular-nums">{x.votes}</span>
                </label>
              </li>
            ))}
          </ul>
        </fieldset>
      </div>
      <div className="flex flex-col rounded-2xl bg-[#f1f6fb] px-7 py-6">
        <div className="flex items-center gap-2 text-[14px] text-sky-900"><Sparkles size={16} />Suggested training</div>
        <div className="mt-2 text-[24px] font-semibold leading-tight">{sel.training}</div>
        <p className="mt-1 text-[15px] text-ink-2">{sel.votes} people asked for {sel.topic.toLowerCase()}.</p>
        <div className="mt-auto pt-6">
          {sel.story ? (
            t.survey
              ? <button onClick={() => s.setTna({ survey: false })} disabled={done} className={quiet}><Check size={16} className="text-ok" />Added to your request</button>
              : <button onClick={() => s.setTna({ survey: true })} disabled={done} className={primary}>Add to your request</button>
          ) : (
            <button onClick={() => s.setTna({ later: later ? t.later.filter((x) => x !== sel.topic) : [...t.later, sel.topic] })} className={quiet}>{later ? <><Check size={16} className="text-ok" />Saved for the next cycle</> : 'Save for the next cycle'}</button>
          )}
        </div>
      </div>
    </section>
  );
}

/* ---------------- way 3: individual development requests ---------------- */
function IdpWay() {
  const s = useDemo();
  const [open, setOpen] = useState<string | null>(null);
  const ids = s.tna.idpIds;
  const done = s.requestSubmitted;
  const toggle = (id: string) => s.setTna({ idpIds: ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id] });
  return (
    <section aria-label="Development requests">
      <p className="mb-3 text-[15px] text-ink-2">Tick the requests to add to your training request. Ticking does not approve them.</p>
      <ul className="divide-y divide-line rounded-2xl border border-line">
        {IDP_REQUESTS.map((r) => {
          const p = idpPerson(r);
          const on = ids.includes(r.id);
          return (
            <li key={r.id}>
              <div className="flex items-center gap-4 px-6 py-4">
                <input type="checkbox" checked={on} disabled={done} onChange={() => toggle(r.id)} aria-label={`Add ${p?.name}'s request`} className="h-5 w-5 accent-brand" />
                <div className="grid min-w-0 flex-1 gap-x-6 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)]">
                  <span className="min-w-0"><span className="block text-[16px] font-medium">{p?.name}</span><span className="text-[14px] text-ink-3">{p?.designation}</span></span>
                  <span className="text-[15px] text-ink-2">{r.area}</span>
                  <span className="text-[15px] text-ink-2">{r.learning}</span>
                </div>
                {on ? <Badge t="ok">Added</Badge> : <Badge t="neutral">{r.status}</Badge>}
                <button onClick={() => setOpen(open === r.id ? null : r.id)} className="text-[15px] text-brand hover:underline">{open === r.id ? 'Close' : 'Open'}</button>
              </div>
              {open === r.id && (
                <div className="mx-6 mb-4 rounded-xl bg-canvas px-5 py-3 text-[15px] text-ink-2">
                  “{r.note}” <span className="text-ink-3">· {r.id} · {r.submitted} · supervisor {p?.supervisor}</span>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

/* ---------------- the request bar: what will be sent, one action ---------------- */
function RequestBar({ way }: { way: Way }) {
  const s = useDemo();
  const nav = useNavigate();
  const t = s.tna;
  const done = s.requestSubmitted;
  const gapOn = t.gap && t.recommendation === 'accepted';
  const chips: { label: string; on: boolean; off: () => void }[] = [
    { label: 'Competency gap', on: gapOn, off: () => s.setTna({ gap: false }) },
    { label: 'Survey', on: t.survey, off: () => s.setTna({ survey: false }) },
    { label: `Development requests${t.idpIds.length ? ` (${t.idpIds.length})` : ''}`, on: t.idpIds.length > 0, off: () => s.setTna({ idpIds: [] }) },
  ];
  const any = chips.some((c) => c.on);
  const raise = () => {
    // Nothing added yet: raise from the way on screen (development requests with none ticked fall back to the competency gap).
    const src = any ? { competency: gapOn, survey: t.survey, idpIds: t.idpIds } : { competency: way !== 'survey', survey: way === 'survey', idpIds: [] };
    if (!done) s.prepareRequest(src);
    nav('/request/new');
  };
  return (
    <div className="sticky bottom-4 z-20 mt-10 flex justify-end">
      {done
        ? <button onClick={() => nav('/request/new')} className={cx(quiet, 'shadow-lg')}>View training request</button>
        : <button onClick={raise} className={cx(primary, 'min-h-12 px-6 text-[16px] shadow-lg')}>Raise training request <ArrowRight size={17} /></button>}
    </div>
  );
}
