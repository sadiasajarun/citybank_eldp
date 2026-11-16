import { ArrowRight } from 'lucide-react';
import { useDemo } from '../store';
import { creditGap } from '../org';
import { MODULES, type ModuleKey } from '../coverage';
import { PageHead } from '../components/Templates';
import { FrRef } from '../components/Source';
import { cx } from '../components/ui';
import { useSwitchRole } from '../components/perspective';
import type { Role } from '../types';

type Tone = 'ok' | 'warn' | 'info' | 'neutral';
interface HubRow { module: ModuleKey; t: string; d: string; status: string; tone: Tone; role: Role; to: string; emp?: string; fr: string; ai?: boolean }

/* ---------------- Learning hub, grouped by the five modules (O3) ---------------- */
export function LearningHub() {
  const s = useDemo();
  const go = useSwitchRole();
  const today = s.programmes.filter((p) => p.status === 'Today').length;
  const scheduled = s.programmes.filter((p) => p.status === 'Scheduled').length + (s.scheduled && !s.completed ? 1 : 0);
  const overdue = s.enrollments.filter((e) => e.status === 'Overdue' && !(e.personId === 'e1' && s.courseCompleted)).length;
  const gap = creditGap().length;
  const rows: HubRow[] = [
    { module: 'TMS', t: 'Training Calendar', d: 'Programmes across the bank, each with its status and attendance', status: `${today} today · ${scheduled} scheduled`, tone: today ? 'warn' : 'info', role: 'hr', to: '/hr/calendar', fr: 'FR 43–44, 182' },
    { module: 'TMS', t: 'Training feedback', d: 'Post-training feedback attached to Advanced Credit Risk Management', status: s.feedbackSubmitted ? 'Submitted' : s.attendanceSubmitted ? 'Open for feedback' : 'Opens after the training', tone: s.feedbackSubmitted ? 'ok' : s.attendanceSubmitted ? 'warn' : 'neutral', role: 'employee', to: '/employee/feedback', emp: 'e1', fr: 'FR 4, 122–124, 222' },
    { module: 'LMS', t: 'Mandatory e-learning', d: 'Information Security Awareness 2026 · modules, checkpoint, certificate', status: s.courseCompleted ? 'Completed' : `${s.courseProgress}% complete · due 20 Nov`, tone: s.courseCompleted ? 'ok' : 'warn', role: 'employee', to: '/learning/course', emp: 'e1', fr: 'FR 190–198' },
    { module: 'LMS', t: 'Course enrolments', d: 'Enrolments, progress, overdue learners and reminders', status: `${overdue} overdue`, tone: overdue ? 'warn' : 'ok', role: 'hr', to: '/hr/courses', fr: 'FR 200–201' },
    { module: 'LMS', t: 'Post-training assessment results', d: 'Every attendee’s result for Advanced Credit Risk Management', status: s.pta.released ? 'Released' : s.attendanceSubmitted ? 'With the trainer' : 'After the training', tone: s.pta.released ? 'ok' : 'neutral', role: 'hr', to: '/assessment/results', fr: 'FR 214, 217' },
    { module: 'LMS', t: 'AML assessment (standalone exam)', d: 'Secure exam, integrity review and marking, independent of any training', status: s.aiScore.state !== 'suggested' ? `Decided by the trainer · ${s.aiScore.score}/10` : 'Awaiting trainer review', tone: s.aiScore.state !== 'suggested' ? 'ok' : 'info', role: 'employee', to: '/assessment', emp: 'e1', fr: 'FR 210–212, 247' },
    { module: 'LMS', t: 'Certificates', d: 'QR-verified certificates for every completed course', status: s.courseCompleted ? '1 new certificate' : 'No new certificates', tone: s.courseCompleted ? 'ok' : 'neutral', role: 'employee', to: '/employee/certificates', emp: 'e1', fr: 'FR 198' },
    { module: 'LMS', t: 'Knowledge Corner', d: 'Policies, case packs and videos, protected and searchable', status: s.materialLinked ? 'New training material linked' : 'Browse resources', tone: s.materialLinked ? 'ok' : 'neutral', role: 'employee', to: '/knowledge', fr: 'FR 227–229' },
    { module: 'LMS', t: 'Physical Library', d: 'Search books, check availability and request one', status: 'Browse books', tone: 'neutral', role: 'employee', to: '/library', fr: 'FR 230–240' },
    { module: 'L&D management', t: 'Divisional requirement', d: 'Training Needs Assessment / Divisional Requirement: officers below target feed the request', status: s.requestSubmitted ? 'Request submitted' : `${creditGap('Corporate Banking').length} below target in Corporate Banking`, tone: s.requestSubmitted ? 'ok' : 'warn', role: 'division_head', to: '/division', fr: 'FR 186, 15' },
    { module: 'L&D management', t: 'Training needs assessment', d: 'Programme-wise TNA and individual development plans', status: `${gap} officers below target bank-wide`, tone: 'info', role: 'hr', to: '/tna', fr: 'FR 186–189' },
    { module: 'L&D management', t: 'Competency profile', d: 'Current versus target levels and the priority gap', status: 'Credit Analysis is the priority gap', tone: 'warn', role: 'hr', to: '/competency', fr: 'FR 241–242' },
    { module: 'L&D management', t: 'Learning journey', d: 'Credit Analysis, level 2 to level 4 · five milestones', status: `${s.journeyDone} of 5 milestones`, tone: s.journeyDone >= 5 ? 'ok' : 'info', role: 'employee', to: '/journey', emp: 'e1', fr: 'FR 243' },
    { module: 'Enterprise workflow', t: 'Reports', d: 'Employee, division, label, period, gender and multi-criteria reports with export', status: 'Computed from the records', tone: 'neutral', role: 'hr', to: '/reports', fr: 'FR 175–184' },
    { module: 'Enterprise workflow', t: 'Mobile app', d: 'Accept invitations, mark attendance and learn on the go', status: 'Preview', tone: 'neutral', role: 'employee', to: '/mobile', emp: 'e1', fr: 'FR 246' },
    { module: 'AI-assisted', t: 'AI training suggestions', d: 'Suggested trainings from skill gaps, role and mandatory courses · a person decides', status: 'AI-suggested · a person decides', tone: 'info', role: 'hr', to: '/reports?type=ai', fr: 'FR 185', ai: true },
    { module: 'AI-assisted', t: 'AI-assisted marking', d: 'The trainer accepts or adjusts the AI-suggested score with a reason', status: s.pta.decision === 'pending' ? 'Awaiting the trainer' : 'Decided by the trainer', tone: s.pta.decision === 'pending' ? 'neutral' : 'ok', role: 'trainer', to: '/assessment/review', fr: 'FR 213', ai: true },
    { module: 'AI-assisted', t: 'Feedback themes', d: 'AI-suggested themes from training feedback, reviewed by L&D', status: s.feedbackSubmitted ? 'Themes ready for review' : 'After feedback', tone: s.feedbackSubmitted ? 'info' : 'neutral', role: 'hr', to: '/hr/planned', fr: 'FR 226', ai: true },
    { module: 'AI-assisted', t: 'Learning assistant', d: 'Ask questions about the course content (preview)', status: 'Preview', tone: 'neutral', role: 'employee', to: '/learning/course', emp: 'e1', fr: 'FR 245', ai: true },
  ];
  const tone = { ok: 'bg-ok-soft text-ok', warn: 'bg-warn-soft text-warn', info: 'bg-info-soft text-info', neutral: 'bg-canvas text-ink-2' };
  return (
    <div>
      <PageHead title="Learning" meta="Everything employees learn, practise and prove, grouped by the five platform modules and connected to one learning record." fr="FR 186–247" />
      {MODULES.map((m) => {
        const list = rows.filter((r) => r.module === m.key);
        if (!list.length) return null;
        return (
          <section key={m.key} className="mt-10 first:mt-0">
            <div className="mb-3 flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <h2 className="text-[24px] font-bold tracking-tight">{m.name}</h2>
              <FrRef>{m.frs}</FrRef>
            </div>
            <p className="mb-4 text-[16px] text-ink-3">{m.desc}</p>
            <ul className="overflow-hidden rounded-2xl border border-line bg-white">
              {list.map((r) => (
                <li key={r.t} className="border-b border-line last:border-0">
                  <button onClick={() => go(r.role, r.to, r.emp)} className="group grid w-full items-center gap-4 px-6 py-5 text-left hover:bg-[#faf8f5] md:grid-cols-[1.4fr_1fr_auto]">
                    <span>
                      <span className="flex flex-wrap items-center gap-2"><span className="text-[18px] font-bold">{r.t}</span><span className="rounded-md border border-line px-2 py-0.5 text-[14px] font-semibold text-ink-3">{m.key}</span><FrRef>{r.fr}</FrRef></span>
                      <span className="mt-0.5 block text-[16px] text-ink-2">{r.d}</span>
                    </span>
                    <span><span className={cx('inline-block rounded-full px-3 py-1 text-[14px] font-semibold', tone[r.tone])}>{r.status}</span></span>
                    <span className="flex items-center gap-1.5 text-[15px] font-semibold text-brand">Open <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" /></span>
                  </button>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
