import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, CheckCircle2, Star } from 'lucide-react';
import { TRAINING } from '../../data';
import { attendedIds, useDemo } from '../../store';
import { NotYet, PageHead, PersonBanner, Section } from '../../components/Templates';
import { Btn, cx, inputCls } from '../../components/ui';
import { SourceTag } from '../../components/Source';

/** Post-training feedback components (FR 222) on a five-point Likert / star scale (FR 223). */
const AREAS: { key: string; label: string; q: string }[] = [
  { key: 'content', label: 'Content', q: 'The content was clear, practical and well organised.' },
  { key: 'trainer', label: 'Trainer', q: 'Nafis Ahmed and Dr. Farhan Chowdhury explained well and answered questions.' },
  { key: 'relevance', label: 'Relevance to my role', q: 'I can use what I learned in my credit work next week.' },
  { key: 'logistics', label: 'Logistics', q: 'Venue, timing, materials and the webinar link worked well.' },
];
const LIKERT = ['Poor', 'Fair', 'Good', 'Very good', 'Excellent'];

export function FeedbackPage() {
  const s = useDemo();
  const nav = useNavigate();
  const [rating, setRating] = useState<Record<string, number>>({});
  const [comment, setComment] = useState('');
  const fr = 'FR 4, 221–223';
  const head = <PageHead title="Training Feedback" meta={`${TRAINING.title} · ${TRAINING.dates}`} fr={fr} tags={<SourceTag kind="fictional" />} />;

  if (!s.attendanceSubmitted) {
    return <div>{head}<NotYet title="No feedback request yet" after="HR submits attendance for the training (Submit & Update Training Database)" /></div>;
  }

  const attended = attendedIds(s).includes(s.employeeId);
  if (!attended) {
    return (
      <div>
        {head}
        <PersonBanner empId={s.employeeId} />
        <div className="rounded-2xl border border-line bg-white px-8 py-10 text-center">
          <h2 className="text-[22px] font-bold">No feedback request for you</h2>
          <p className="mx-auto mt-2 max-w-xl text-[16px] text-ink-2">Feedback requests go to employees who attended {TRAINING.title}. The attendance register does not show you as attending.</p>
          <div className="mt-6 flex justify-center"><Btn onClick={() => nav('/employee')}>Back to My learning</Btn></div>
        </div>
      </div>
    );
  }

  if (s.feedbackSubmitted) {
    return (
      <div>
        {head}
        <PersonBanner empId={s.employeeId} />
        <div className="mx-auto max-w-2xl rounded-2xl border border-line bg-white px-8 py-10 text-center">
          <CheckCircle2 size={44} className="mx-auto text-ok" />
          <h2 className="mt-3 text-[24px] font-bold">Thank you for your feedback</h2>
          <p className="mx-auto mt-2 max-w-lg text-[16px] text-ink-2">Your response for {TRAINING.title} is recorded. HR sees the combined results, with themes suggested by AI and confirmed by L&amp;D before anything is published.</p>
          {Object.keys(rating).length > 0 && (
            <dl className="mx-auto mt-6 grid max-w-md grid-cols-2 gap-3 text-left">
              {AREAS.map((a) => <div key={a.key} className="rounded-lg bg-canvas px-4 py-2"><dt className="text-[14px] text-ink-3">{a.label}</dt><dd className="text-[16px] font-semibold">{rating[a.key]} / 5 · {LIKERT[(rating[a.key] ?? 1) - 1]}</dd></div>)}
            </dl>
          )}
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <Btn v="secondary" onClick={() => nav('/employee/record')}>See my learning record</Btn>
            <Btn onClick={() => nav('/employee')}>Back to My learning <ArrowRight size={16} /></Btn>
          </div>
        </div>
      </div>
    );
  }

  const missing = AREAS.filter((a) => !rating[a.key]).length;
  return (
    <div>
      {head}
      <PersonBanner empId={s.employeeId} reason="Attended 18–19 Nov · feedback requested by HR" />
      <div className="mx-auto max-w-3xl rounded-2xl border border-line bg-white">
        <div className="p-7">
          <Section title="How was the training?">
            <p className="-mt-2 mb-5 text-[16px] text-ink-2">Rate each area from 1 (Poor) to 5 (Excellent). It takes about a minute.</p>
            <ul className="divide-y divide-line border-y border-line">
              {AREAS.map((a) => (
                <li key={a.key} className="flex flex-wrap items-center justify-between gap-4 py-4">
                  <div className="min-w-0">
                    <div className="text-[17px] font-semibold">{a.label}</div>
                    <div className="text-[15px] text-ink-2">{a.q}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex gap-1" role="radiogroup" aria-label={a.label}>
                      {[1, 2, 3, 4, 5].map((n) => (
                        <button key={n} role="radio" aria-checked={rating[a.key] === n} aria-label={`${a.label}: ${n} of 5, ${LIKERT[n - 1]}`} onClick={() => setRating({ ...rating, [a.key]: n })} className="rounded p-0.5 focus-visible:outline-2 focus-visible:outline-brand">
                          <Star size={26} className={n <= (rating[a.key] ?? 0) ? 'fill-amber-400 text-amber-400' : 'text-slate-300'} />
                        </button>
                      ))}
                    </div>
                    <span className={cx('w-24 text-[15px]', rating[a.key] ? 'font-semibold text-ink' : 'text-ink-3')}>{rating[a.key] ? LIKERT[rating[a.key] - 1] : 'Not rated'}</span>
                  </div>
                </li>
              ))}
            </ul>
          </Section>
          <label className="mt-6 block">
            <span className="text-[15px] font-semibold text-ink-2">Comment (optional)</span>
            <textarea rows={3} className={cx(inputCls, 'mt-1.5 text-[16px]')} value={comment} onChange={(e) => setComment(e.target.value)} placeholder="What worked well, and what should change next time?" />
          </label>
        </div>
        <div className="flex flex-wrap items-center gap-3 border-t border-line px-7 py-4">
          <Btn v="link" onClick={() => nav('/employee')}>Back to My learning</Btn>
          <span className="flex-1" />
          {missing > 0 && <span className="text-[15px] text-ink-3">Rate {missing} more area{missing > 1 ? 's' : ''} to submit</span>}
          <Btn disabled={missing > 0} onClick={() => s.submitFeedback(rating, comment)}>Submit Feedback</Btn>
        </div>
      </div>
    </div>
  );
}
