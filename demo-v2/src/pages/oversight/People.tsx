/**
 * People & Organisation (O3, U17): org explorer Bank → Division → Department → Supervisor → Employees,
 * a profile panel for the selected person, and the people acting in this training.
 * Organisation data is fictional and stands in for HRIS.
 */
import { useState } from 'react';
import { ArrowRight, ChevronDown, ChevronRight, Search } from 'lucide-react';
import { PERSONAS, TRAINING } from '../../data';
import { CREDIT_TARGET, DIRECTORY, DIVISIONS, SUPERVISORS, type Person } from '../../org';
import { PEOPLE, personStatus, ROLE_LABEL, tasksFor, type Pid } from '../../lifecycle';
import { useDemo } from '../../store';
import { PageHead, Section } from '../../components/Templates';
import { SourceTag } from '../../components/Source';
import { DataTable, type Column } from '../../components/DataTable';
import { personaFor, useSwitchRole } from '../../components/perspective';
import { Avatar, Badge, Btn, cx } from '../../components/ui';
import { personRows, STORY_TONE, trainingRecords, type PersonRow } from './dash';

const LIVE_RECORD = ['e1', 'e2', 'e4'];
const STATE_TEXT = { active: 'text-brand', attention: 'text-warn', complete: 'text-ok', affected: 'text-info', waiting: 'text-ink-2', idle: 'text-ink-3' } as const;

export function PeopleOrg() {
  const s = useDemo();
  const [q, setQ] = useState('');
  const [view, setView] = useState<'Organisation tree' | 'Table'>('Organisation tree');
  const [sel, setSel] = useState<string>('e1');
  const [open, setOpen] = useState<Set<string>>(new Set(['Corporate Banking', 'Corporate Banking/Large Corporate']));
  const rows = personRows(s, DIRECTORY);
  const byId = new Map(rows.map((r) => [r.p.id, r]));
  const t = q.trim().toLowerCase();
  const match = (p: Person) => !t || p.name.toLowerCase().includes(t) || p.eid.toLowerCase().includes(t) || p.designation.toLowerCase().includes(t);
  const toggle = (k: string) => setOpen((o) => { const n = new Set(o); if (n.has(k)) n.delete(k); else n.add(k); return n; });
  const isOpen = (k: string) => !!t || open.has(k);
  const selected = byId.get(sel);

  const tableCols: Column<PersonRow>[] = [
    { key: 'eid', header: 'EID', render: (r) => <span className="tabular-nums text-ink-2">{r.p.eid}</span>, sort: (r) => r.p.eid },
    { key: 'name', header: 'Name', render: (r) => <span className="font-semibold">{r.p.name}</span>, sort: (r) => r.p.name },
    { key: 'des', header: 'Designation', render: (r) => r.p.designation, filter: (r) => r.p.designation },
    { key: 'div', header: 'Division', render: (r) => r.p.division, filter: (r) => r.p.division },
    { key: 'sup', header: 'Supervisor', render: (r) => r.p.supervisor, filter: (r) => r.p.supervisor },
    { key: 'st', header: 'Training status', render: (r) => <Badge t={STORY_TONE[r.story]}>{r.story}</Badge>, filter: (r) => r.story },
  ];

  return (
    <div>
      <PageHead title="People & Organisation" meta="Bank → Division → Department → Supervisor → Employees, with each person’s training status." fr="FR 10–15, 241–243"
        tags={<SourceTag kind="fictional">Organisation data is fictional and stands in for HRIS</SourceTag>} />

      <div className="mb-5 flex flex-wrap items-center gap-3">
        <label className="flex min-w-[280px] flex-1 items-center gap-2 rounded-lg border border-line bg-white px-3 py-2.5 focus-within:border-brand md:max-w-md">
          <Search size={17} className="text-ink-3" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name, EID or designation" aria-label="Search people" className="w-full bg-transparent text-[16px] outline-none" />
        </label>
        <div className="flex rounded-lg border border-line bg-white p-1" role="tablist" aria-label="View">
          {(['Organisation tree', 'Table'] as const).map((v) => (
            <button key={v} role="tab" aria-selected={view === v} onClick={() => setView(v)} className={cx('rounded-md px-4 py-2 text-[15px] font-semibold', view === v ? 'bg-ink text-white' : 'text-ink-2 hover:text-ink')}>{v}</button>
          ))}
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="min-w-0">
          {view === 'Table' ? (
            <DataTable rows={rows.filter((r) => match(r.p))} columns={tableCols} rowKey={(r) => r.p.id} label="people" onRowClick={(r) => setSel(r.p.id)} activeKey={sel} maxHeight={640} />
          ) : (
            <div className="rounded-2xl border border-line bg-white p-4">
              <div className="flex items-center gap-3 px-2 pb-3">
                <span className="grid h-9 w-9 place-items-center rounded-lg bg-brand text-[15px] font-extrabold text-white">CB</span>
                <div><div className="text-[17px] font-bold">City Bank</div><div className="text-[14px] text-ink-3">{DIVISIONS.length} divisions · {DIRECTORY.length} employees in the demo directory</div></div>
              </div>
              <ul className="space-y-1">
                {DIVISIONS.map((d) => {
                  const people = DIRECTORY.filter((p) => p.division === d.name);
                  const hits = people.filter(match);
                  if (t && !hits.length) return null;
                  const depts = [...new Set([...d.departments, ...people.map((p) => p.department)])];
                  return (
                    <li key={d.name}>
                      <button onClick={() => toggle(d.name)} aria-expanded={isOpen(d.name)} className="flex w-full items-center gap-2 rounded-lg px-2 py-2.5 text-left hover:bg-canvas">
                        {isOpen(d.name) ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                        <span className="text-[17px] font-bold">{d.name}</span>
                        <span className="text-[15px] text-ink-3">· Head {d.head} · Learning Champion {d.learningChampion} · {people.length} people</span>
                      </button>
                      {isOpen(d.name) && (
                        <ul className="ml-6 border-l border-line pl-3">
                          {people.length === 0 && <li className="px-2 py-2 text-[15px] text-ink-3">No employees in the demo directory for this division.</li>}
                          {depts.map((dep) => {
                            const emps = people.filter((p) => p.department === dep && match(p));
                            if (!emps.length) return null;
                            const k = `${d.name}/${dep}`;
                            const sups = [...new Set(emps.map((p) => p.supervisor))];
                            return (
                              <li key={k}>
                                <button onClick={() => toggle(k)} aria-expanded={isOpen(k)} className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left hover:bg-canvas">
                                  {isOpen(k) ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                                  <span className="text-[16px] font-semibold">{dep}</span><span className="text-[15px] text-ink-3">· {emps.length}</span>
                                </button>
                                {isOpen(k) && sups.map((sup) => (
                                  <div key={sup} className="ml-6 border-l border-line pl-3">
                                    <div className="px-2 py-1.5 text-[15px] text-ink-2">Supervisor <b className="text-ink">{sup}</b>{SUPERVISORS.find((x) => x.name === sup) && <span className="text-ink-3"> · {SUPERVISORS.find((x) => x.name === sup)?.title}</span>}</div>
                                    <ul className="ml-3">
                                      {emps.filter((p) => p.supervisor === sup).map((p) => {
                                        const r = byId.get(p.id);
                                        return (
                                          <li key={p.id}>
                                            <button onClick={() => setSel(p.id)} aria-pressed={sel === p.id} className={cx('flex w-full flex-wrap items-center gap-x-3 gap-y-1 rounded-lg px-2 py-2 text-left', sel === p.id ? 'bg-brand-soft/60' : 'hover:bg-canvas')}>
                                              <span className="text-[16px] font-semibold">{p.name}</span>
                                              <span className="text-[15px] text-ink-3">{p.designation} · {p.eid}</span>
                                              {r && <Badge t={STORY_TONE[r.story]}>{r.story}</Badge>}
                                            </button>
                                          </li>
                                        );
                                      })}
                                    </ul>
                                  </div>
                                ))}
                              </li>
                            );
                          })}
                        </ul>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>
        <aside className="lg:sticky lg:top-6 lg:self-start">{selected ? <Profile r={selected} /> : <p className="text-[16px] text-ink-3">Select a person to see their profile.</p>}</aside>
      </div>

      <PeopleInTraining />
    </div>
  );
}

function Profile({ r }: { r: PersonRow }) {
  const s = useDemo();
  const go = useSwitchRole();
  const p = r.p;
  const head = DIVISIONS.find((d) => d.name === p.division)?.head ?? '—';
  const recs = trainingRecords(s).filter((x) => x.personId === p.id);
  const facts: [string, React.ReactNode][] = [
    ['Grade', p.grade],
    ['Division', p.division],
    ['Department', p.department],
    ['Location', p.location],
    ['Reporting line', <>{p.name} → <b>{p.supervisor}</b> → {head}</>],
    ['Credit Analysis', <span className={p.creditLevel < CREDIT_TARGET ? 'text-warn' : 'text-ok'}>Level {p.creditLevel} of {CREDIT_TARGET}</span>],
    [TRAINING.title, <Badge t={STORY_TONE[r.story]}>{r.story}</Badge>],
    ['Attendance', r.inTraining ? `Day 1 ${r.d1 ?? '—'} · Day 2 ${r.d2 ?? '—'}` : '—'],
    ['Assessment', r.result === '—' ? '—' : <>{r.result}{r.score !== null && r.result !== 'Awaiting release' ? ` · ${r.score}%` : ''}{r.remediation ? ` · ${r.remediation}` : ''}</>],
    ['Mandatory course', r.course ? `${r.course.progress}% · ${r.course.status}` : 'Not enrolled'],
  ];
  return (
    <div className="rounded-2xl border border-line bg-white p-6">
      <div className="flex items-center gap-3">
        <Avatar name={p.name} size={48} />
        <div><div className="text-[20px] font-bold">{p.name}</div><div className="text-[15px] text-ink-3">{p.designation} · {p.eid}</div></div>
      </div>
      <dl className="mt-4 divide-y divide-line border-y border-line">
        {facts.map(([k, v]) => <div key={k} className="grid grid-cols-[130px_1fr] gap-3 py-2.5"><dt className="text-[15px] text-ink-3">{k}</dt><dd className="text-[16px] font-medium">{v}</dd></div>)}
      </dl>
      {LIVE_RECORD.includes(p.id) ? (
        <Btn className="mt-5 w-full" onClick={() => go('employee', '/employee/record', p.id)}>Open learning record <ArrowRight size={16} /></Btn>
      ) : (
        <div className="mt-5">
          <div className="text-[16px] font-bold">Learning record</div>
          {recs.length ? (
            <ul className="mt-2 space-y-2">
              {recs.map((x) => <li key={x.key} className="text-[15px]"><span className="font-semibold">{x.training}</span><span className="block text-ink-3">{x.date} · {x.status}{x.hours ? ` · ${x.hours} h` : ''}</span></li>)}
            </ul>
          ) : <p className="mt-1 text-[15px] text-ink-3">No training records yet.</p>}
          <p className="mt-3 text-[14px] text-ink-3">Only Ayesha, Tanvir and Sadia have an employee view in this demo.</p>
        </div>
      )}
    </div>
  );
}

function PeopleInTraining() {
  const s = useDemo();
  const go = useSwitchRole();
  return (
    <Section title="People in this training" className="mt-12">
      <ul className="grid gap-4 md:grid-cols-2">
        {PEOPLE.map((p) => {
          const ps = personStatus(p.id as Pid, s);
          const person = personaFor(p.role, s.employeeId);
          const n = p.id === 'lc' ? tasksFor('division_head', s).filter((t) => t.id === 'nom').length : p.id === 'dh' ? tasksFor('division_head', s).filter((t) => t.id !== 'nom').length : tasksFor(p.role, s).filter((t) => t.id !== 'mc').length;
          return (
            <li key={p.id} className="flex items-center gap-4 rounded-2xl border border-line bg-white p-5">
              <Avatar name={person.name} size={48} />
              <div className="min-w-0 flex-1">
                <div className="text-[18px] font-bold">{person.name}</div>
                <div className="text-[15px] text-ink-3">{p.label} · {person.dept}</div>
                <div className={cx('mt-1 text-[15px] font-semibold', STATE_TEXT[ps.state])}>{ps.text}{n > 0 && <span className="ml-2 rounded-full bg-ink px-2 text-[14px] leading-5 text-white">{n} task{n > 1 ? 's' : ''}</span>}</div>
              </div>
              <Btn v="secondary" onClick={() => go(p.role, p.to)}>Open view <ArrowRight size={15} /></Btn>
            </li>
          );
        })}
        <li className="flex items-center gap-4 rounded-2xl border border-line bg-white p-5">
          <Avatar name={PERSONAS.admin.name} size={48} />
          <div className="min-w-0 flex-1"><div className="text-[18px] font-bold">{PERSONAS.admin.name}</div><div className="text-[15px] text-ink-3">{ROLE_LABEL.admin} · {PERSONAS.admin.dept}</div><div className="mt-1 text-[15px] text-ink-2">Keeps access, integrations and audit running</div></div>
          <Btn v="secondary" onClick={() => go('admin')}>Open view <ArrowRight size={15} /></Btn>
        </li>
      </ul>
    </Section>
  );
}
