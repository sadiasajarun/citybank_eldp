import { useNavigate } from 'react-router-dom';
import { ArrowRight, Check, Lock } from 'lucide-react';
import { TRAINING } from '../../data';
import { ptResults, useDemo } from '../../store';
import { CREDIT_TARGET, findById } from '../../org';
import { JOURNEY } from '../../lifecycle';
import { PageHead, PersonBanner } from '../../components/Templates';
import { SourceTag } from '../../components/Source';
import { AiLabel, Badge, Btn, cx, Progress } from '../../components/ui';
import { personaFor } from '../../components/perspective';

interface Milestone { title: string; kind: string; when: string; advice: string }
const MILESTONES: Milestone[] = [
  { title: 'Credit Fundamentals', kind: 'e-Learning · 45 min', when: 'Completed Aug 2026', advice: 'Refresh credit basics with the 45-minute e-learning.' },
  { title: 'Financial Analysis', kind: 'e-Learning · 2 h', when: 'Completed Oct 2026', advice: 'Complete the financial analysis e-learning before the classroom days.' },
  { title: 'Credit Risk Workshop', kind: `Classroom · training ${TRAINING.trainingId} · 18–19 Nov`, when: 'This training', advice: 'Your attendance at Advanced Credit Risk Management counts towards this milestone. Record it to move your competency to Level 3.' },
  { title: 'Post-training assessment', kind: 'Assessment · pass 70%', when: 'After the workshop', advice: 'Your released assessment result proves the new level. Record it to keep the journey moving.' },
  { title: 'Competency review', kind: 'Supervisor review', when: 'After the assessment', advice: 'Ask your supervisor to review and confirm Level 4 in Credit Analysis.' },
];
const START_LEVEL = 2;
const levelFor = (doneCount: number) => START_LEVEL + (doneCount >= 3 ? 1 : 0) + (doneCount >= 5 ? 1 : 0);

export function LearningJourney() {
  const s = useDemo();
  const nav = useNavigate();
  const id = s.employeeId || 'e1';
  const person = findById(id);
  const name = person?.name ?? personaFor('employee', id).name;
  const isStory = id === 'e1';

  const attended = s.attendanceSubmitted && s.participation[id] === 'Attended';
  const result = ptResults(s).find((r) => r.id === id);
  const passed = result?.status === 'Passed';
  const attStep = JOURNEY.findIndex((j) => j.impactKey === 'Attendance submitted') + 1;
  const relStep = JOURNEY.findIndex((j) => j.impactKey === 'Assessment result released') + 1;

  /** Whether the record allows milestone i to be completed, and why not. */
  const gate = (i: number): { ok: boolean; why: string } => {
    if (i === 2) return attended ? { ok: true, why: '' } : { ok: false, why: s.attendanceSubmitted ? `${name.split(' ')[0]} did not attend this training.` : `Opens after attendance is submitted (Step ${attStep}).` };
    if (i === 3) {
      if (!s.pta.released) return { ok: false, why: `Opens when the trainer releases the assessment result (Step ${relStep}).` };
      if (result?.status === 'Failed') return { ok: false, why: s.remediation[id] ? `${s.remediation[id]} · the milestone completes after the re-attempt.` : 'Not passed · HR assigns a re-attempt or refresher.' };
      return passed ? { ok: true, why: '' } : { ok: false, why: 'No result for this assessment.' };
    }
    return { ok: true, why: '' };
  };

  // e1 is the story employee: s.journeyDone is her record. Others are derived from their own records.
  const derived = [true, true, attended, passed, false];
  const doneCount = isStory ? s.journeyDone : derived.findIndex((d) => !d) === -1 ? 5 : derived.findIndex((d) => !d);
  const next = doneCount < MILESTONES.length ? doneCount : null;
  const g = next !== null ? gate(next) : { ok: false, why: '' };
  const canAct = isStory && next !== null && g.ok;
  const level = levelFor(doneCount);
  const stepDone = s.journeyDone >= 3;

  return (
    <div>
      {s.role === 'employee' && <PersonBanner empId={id} reason="Your competency journey" />}
      <PageHead
        title="Learning Journey"
        meta={<>Credit Analysis · Level {START_LEVEL} → Level {CREDIT_TARGET} · {name}</>}
        fr="FR 185, 241–243"
        tags={<SourceTag kind="fictional" />}
      />

      <div className="grid gap-10 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="min-w-0">
          {/* competency movement */}
          <section className="rounded-2xl border border-line bg-white px-6 py-5">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <div className="text-[15px] font-semibold text-ink-3">Credit Analysis competency</div>
                <div className="mt-1 text-[32px] font-extrabold tracking-tight">Level {START_LEVEL} <span className="text-ink-3">→</span> <span className={level > START_LEVEL ? 'text-ok' : ''}>Level {level}</span></div>
                <div className="text-[15px] text-ink-2">Before the journey: Level {START_LEVEL} · now: Level {level} · target: Level {CREDIT_TARGET}</div>
              </div>
              <div className="flex gap-1.5" aria-label={`Level ${level} of ${CREDIT_TARGET + 1}`}>
                {[1, 2, 3, 4, 5].map((l) => <span key={l} className={cx('h-3 w-10 rounded-full', l <= START_LEVEL ? 'bg-ink' : l <= level ? 'bg-ok' : l <= CREDIT_TARGET ? 'bg-brand/25' : 'bg-line')} />)}
              </div>
            </div>
            <div className="mt-4"><Progress value={(doneCount / MILESTONES.length) * 100} tone={doneCount >= MILESTONES.length ? 'ok' : 'brand'} /></div>
            <div className="mt-1.5 text-[15px] text-ink-3">{doneCount} of {MILESTONES.length} milestones complete</div>
          </section>

          {/* milestones */}
          <section className="mt-8">
            <h2 className="text-[22px] font-bold tracking-tight">Milestones</h2>
            <ol className="relative mt-4 border-l-2 border-line">
              {MILESTONES.map((m, i) => {
                const done = i < doneCount;
                const cur = i === next;
                const gi = gate(i);
                return (
                  <li key={m.title} className="relative pb-6 pl-8 last:pb-0">
                    <span className={cx('absolute -left-[15px] top-0 grid h-7 w-7 place-items-center rounded-full text-[14px] font-bold', done ? 'bg-ok text-white' : cur ? 'anim-pulse bg-brand text-white' : 'border-2 border-line bg-white text-ink-3')}>{done ? <Check size={15} /> : i + 1}</span>
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="text-[17px] font-bold">{m.title}</span>
                      <Badge t={done ? 'ok' : cur ? (gi.ok ? 'brand' : 'warn') : 'neutral'}>{done ? 'Complete' : cur ? (gi.ok ? 'Ready to complete' : 'Waiting') : 'Upcoming'}</Badge>
                    </div>
                    <div className="text-[15px] text-ink-3">{m.kind} · {done && i < 2 ? m.when : i === 2 && done ? 'Attended 18–19 Nov' : i === 3 && done && result?.score ? `Passed · ${result.score}% · ${result.grade}` : m.when}</div>
                    {cur && !gi.ok && <div className="mt-1 flex items-center gap-1.5 text-[15px] text-warn"><Lock size={14} />{gi.why}</div>}
                  </li>
                );
              })}
            </ol>
          </section>

          {/* action */}
          <div className="mt-8 flex flex-wrap items-center gap-3 border-t border-line pt-5">
            {next === null ? (
              <>
                <span className="flex-1 text-[16px] font-semibold text-ok">Journey complete · Credit Analysis Level {level} confirmed.</span>
                <Btn onClick={() => nav('/employee')}>Back to My learning <ArrowRight size={16} /></Btn>
              </>
            ) : isStory ? (
              <>
                <span className="min-w-0 flex-1 text-[16px] text-ink-2">{g.ok ? <>Next: <b className="text-ink">{MILESTONES[next].title}</b>. Completing it updates your competency level and learning record.</> : g.why}</span>
                {(stepDone || !canAct) && <Btn v="secondary" onClick={() => nav('/employee')}>Back to My learning</Btn>}
                <Btn disabled={!canAct} onClick={() => s.setJourney(doneCount + 1)}>Complete next step: {MILESTONES[next].title} <ArrowRight size={16} /></Btn>
              </>
            ) : (
              <>
                <span className="min-w-0 flex-1 text-[16px] text-ink-2">{name}’s milestones update from their own records (attendance and assessment).{!g.ok && g.why ? ` ${g.why}` : ''}</span>
                <Btn onClick={() => nav('/employee')}>Back to My learning <ArrowRight size={16} /></Btn>
              </>
            )}
          </div>
        </div>

        {/* recommendation */}
        <aside className="space-y-6">
          {next !== null ? (
            <section className="rounded-2xl border border-brand/25 bg-brand-soft/40 p-6">
              <div className="flex flex-wrap items-center justify-between gap-2"><span className="text-[15px] font-semibold text-brand">Recommended next step</span><AiLabel>AI-suggested · approved by L&amp;D</AiLabel></div>
              <div className="mt-2 text-[20px] font-bold">{MILESTONES[next].title}</div>
              <p className="mt-1 text-[16px] text-ink-2">{MILESTONES[next].advice}</p>
              <p className="mt-3 text-[14px] text-ink-3">Based on the Credit Analysis gap, the Relationship Manager role requirement and mandatory courses (FR 185). A person in L&amp;D approved this path.</p>
            </section>
          ) : (
            <section className="rounded-2xl border border-[#cfe7d7] bg-[#f3faf5] p-6">
              <div className="flex flex-wrap items-center justify-between gap-2"><span className="text-[15px] font-semibold text-ok">Recommended next step</span><AiLabel>AI-suggested · approved by L&amp;D</AiLabel></div>
              <div className="mt-2 text-[20px] font-bold">Portfolio Stress Testing</div>
              <p className="mt-1 text-[16px] text-ink-2">With Credit Analysis at Level {level}, the next journey builds risk-modelling skills for senior credit roles.</p>
            </section>
          )}
          <section>
            <h2 className="text-[22px] font-bold tracking-tight">Who sees this journey</h2>
            <ul className="mt-3 space-y-2 text-[16px]">
              <li className="flex gap-2.5"><span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />{name}: progress and next step</li>
              <li className="flex gap-2.5"><span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />{person?.supervisor ?? 'Supervisor'}: team progress on the supervisor dashboard</li>
              <li className="flex gap-2.5"><span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />HR / L&amp;D: progress across the bank by competency level</li>
            </ul>
            <p className="mt-2 text-[14px] text-ink-3">Progress at admin, manager and trainee level (FR 243).</p>
          </section>
        </aside>
      </div>
    </div>
  );
}
