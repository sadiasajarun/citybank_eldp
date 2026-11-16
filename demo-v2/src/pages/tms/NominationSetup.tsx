import { useMemo, useRef, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Check, CheckCircle2, FileText, Plus, X } from 'lucide-react';
import { MASTERS, REQUEST_QUEUE, TRAINING } from '../../data';
import { creditGap, DIVISIONS, inDivision, VENDORS, VENUES } from '../../org';
import { useDemo } from '../../store';
import { Alert, Btn, cx, inputCls } from '../../components/ui';
import { DataTable, type Column } from '../../components/DataTable';
import { FactGroup, NotYet, PageHead, StepForm } from '../../components/Templates';
import { FrRef, SourceTag } from '../../components/Source';
import { FormField, RailCard, TagPicker, TrainerRowsEditor } from './TrainingRequest';

/* ---------------- helpers shared with Nominations and Scheduling ---------------- */

/** "2026-11-14T17:00" → "14 Nov 2026, 17:00". */
export const fmtDeadline = (v: string) => {
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return v;
  return `${d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}, ${d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`;
};

const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
/**
 * Venue clash check against the planned training calendar (FR 71, 99): returns the booked date when the
 * venue is already booked on one of the training days in `dates` (e.g. "18–19 November 2026 · 09:30–17:30").
 */
export const venueClash = (venue: string, dates: string): string | null => {
  const v = VENUES.find((x) => x.name === venue);
  const m = dates.match(/(\d{1,2})(?:\s*[–-]\s*(\d{1,2}))?\s+([A-Za-z]{3})[A-Za-z]*\s+(\d{4})/);
  if (!v || !m) return null;
  const from = Number(m[1]), to = Number(m[2] ?? m[1]), mon = m[3].toLowerCase(), year = m[4];
  return v.bookedOn.find((b) => {
    const [d, bm, by] = b.split(' ');
    return by === year && bm.toLowerCase().slice(0, 3) === mon && MONTHS.includes(mon) && Number(d) >= from && Number(d) <= to;
  }) ?? null;
};

export const FREE_VENUE = VENUES.find((v) => v.bookedOn.length === 0)?.name ?? VENUES[0].name;

const PLACEHOLDERS = ['{Training}', '{Dates}', '{Deadline}', '{Learning Champion}', '{Nominate link}'];
const TRAINING_START = '2026-11-18T09:30';
const DEMO_NOW = '2026-11-12T00:00';
const REPEATS = ['Single day', 'Repeat daily · 2 days', 'Repeat weekly · 2 sessions'];

/* ================================================================== */
/* Training Nomination Request Setup · HR (FR 67–87)                  */
/* ================================================================== */
const STEPS = ['Program', 'Trainer', 'Nomination'];

export function NominationSetup() {
  const s = useDemo();
  const nav = useNavigate();
  const [step, setStep] = useState(0);
  const [saved, setSaved] = useState<boolean[]>([false, false, false]);
  const docRef = useRef<HTMLInputElement>(null);
  const n = s.nomSetup;
  const set = s.setNomSetup;

  const titles = useMemo(() => [...new Set([TRAINING.title, ...REQUEST_QUEUE.map((r) => r.title)])], []);
  const chosen = DIVISIONS.filter((d) => n.divisions[d.name]);
  const clash = venueClash(n.venue, n.dates);
  const deadlineOk = n.deadline > DEMO_NOW && n.deadline < TRAINING_START;
  const titleKnown = titles.some((t) => t.toLowerCase() === n.title.trim().toLowerCase());

  const head = (
    <PageHead title="Training Nomination Request Setup" fr="FR 67–87"
      meta={<>Nomination request <b>{TRAINING.nominationId}</b> · {s.nominationRequested ? 'fixed' : 'fixed on save'} · linked to {TRAINING.requestId}</>}
      tags={<SourceTag kind="fictional" />} />
  );

  if (!s.reviewed) return <div>{head}<NotYet title="No accepted request to collect nominations for" after="HR accepts the training request with Create Nomination Request" /></div>;

  if (s.nominationRequested) {
    return (
      <div>
        {head}
        <div className="mx-auto max-w-3xl rounded-2xl border border-line bg-white p-8">
          <div className="flex items-start gap-4">
            <CheckCircle2 size={40} className="shrink-0 text-ok" />
            <div>
              <h2 className="text-[24px] font-bold">Nomination request sent</h2>
              <p className="mt-1 text-[16px] text-ink-2">{TRAINING.nominationId} went to {chosen.length} Learning Champion{chosen.length === 1 ? '' : 's'} with the nominate link. Nominations received before the deadline load into the participant list (FR 88).</p>
            </div>
          </div>
          <div className="mt-6">
            <FactGroup title="What was sent" rows={[
              ['Training', n.title],
              ['Dates', n.dates],
              ['Venue', n.venue],
              ['Nomination Deadline', fmtDeadline(n.deadline)],
              ['Learning Champions', chosen.map((d) => `${d.learningChampion} (${d.name})`).join(', ')],
              ['Documents', n.docs.join(', ') || 'None'],
            ]} />
          </div>
          <div className="mt-6 flex flex-wrap justify-end gap-3">
            <Btn v="secondary" onClick={() => nav('/r/hr')}>Back to My work</Btn>
            <Btn onClick={() => nav('/hr/nomination-status')}>Next: review nomination status <ArrowRight size={16} /></Btn>
          </div>
        </div>
      </div>
    );
  }

  const saveNext = (i: number) => { setSaved((x) => x.map((v, k) => (k === i ? true : v))); setStep(i + 1); };
  const allOn = chosen.length === DIVISIONS.length;
  const setAll = (on: boolean) => set({ divisions: Object.fromEntries(DIVISIONS.map((d) => [d.name, on])) });

  /* live email preview */
  const lc = chosen[0]?.learningChampion ?? 'Learning Champion';
  const fill = (t: string) => t.replaceAll('{Training}', n.title).replaceAll('{Dates}', n.dates).replaceAll('{Deadline}', fmtDeadline(n.deadline)).replaceAll('{Learning Champion}', lc);
  const preview = (t: string): ReactNode[] => fill(t).split('{Nominate link}').flatMap((part, i) => (i === 0 ? [part] : [<span key={i} className="font-semibold text-brand underline">Nominate in ELDP →</span>, part]));

  const recipientCols: Column<(typeof DIVISIONS)[number]>[] = [
    { key: 'send', header: 'Send', render: (d) => <input type="checkbox" aria-label={`Send to ${d.name}`} checked={!!n.divisions[d.name]} onChange={(e) => set({ divisions: { ...n.divisions, [d.name]: e.target.checked } })} /> },
    { key: 'div', header: 'Division', sort: (d) => d.name, render: (d) => <b className="text-[16px]">{d.name}</b> },
    { key: 'lc', header: 'Learning Champion', render: (d) => d.learningChampion },
    { key: 'hc', header: 'Head count', sort: (d) => inDivision(d.name).length, render: (d) => inDivision(d.name).length, className: 'tabular-nums' },
    { key: 'gap', header: 'Below Credit Analysis target', sort: (d) => creditGap(d.name).length, render: (d) => creditGap(d.name).length, className: 'tabular-nums' },
  ];

  const footer = (
    <>
      {step > 0 && <Btn v="secondary" onClick={() => setStep(step - 1)}>Previous</Btn>}
      <span className="flex-1" />
      {step === 1 && <Btn v="secondary" onClick={() => setStep(2)}>Skip & Next</Btn>}
      {step < 2 && <Btn onClick={() => saveNext(step)}>Save & Next</Btn>}
      {step === 2 && (
        <>
          {(!chosen.length || !deadlineOk) && <span className="text-[15px] text-warn">{!chosen.length ? 'Choose at least one division.' : 'Set a deadline before the training starts.'}</span>}
          <Btn disabled={!chosen.length || !deadlineOk} onClick={() => s.sendNomination()}>Save & Send Nomination Request</Btn>
        </>
      )}
    </>
  );

  const rail = (
    <RailCard>
      <div>
        <div className="text-[15px] text-ink-3">Nomination request ID</div>
        <div className="text-[20px] font-bold">{TRAINING.nominationId}</div>
        <div className="text-[14px] text-ink-3">Automatic, fixed on save (FR 67)</div>
      </div>
      <div>
        <div className="text-[15px] text-ink-3">Linked request</div>
        <Btn v="link" onClick={() => nav(`/hr/requests/${TRAINING.requestId}`)}>{TRAINING.requestId} · Corporate Banking</Btn>
      </div>
      <ul className="space-y-2">
        {STEPS.map((x, i) => (
          <li key={x} className="flex items-center gap-2 text-[16px]">
            <span className={cx('grid h-6 w-6 place-items-center rounded-full text-[14px] font-bold', saved[i] ? 'bg-ok text-white' : i === step ? 'bg-brand text-white' : 'bg-canvas text-ink-3')}>{saved[i] ? <Check size={14} /> : i + 1}</span>{x}
          </li>
        ))}
      </ul>
      <div>
        <div className="text-[16px] font-semibold">What happens after sending</div>
        <ul className="mt-1.5 list-disc space-y-1 pl-5 text-[15px] text-ink-2">
          <li>Each chosen Learning Champion gets the email with the nominate link (FR 86–87).</li>
          <li>The link opens their own dashboard with the nomination window (FR 88).</li>
          <li>Nominations received before the deadline appear in Training Nomination Status.</li>
        </ul>
      </div>
    </RailCard>
  );

  return (
    <div>
      {head}
      <StepForm steps={STEPS} current={step} onStep={setStep} done={saved} footer={footer} rail={rail}>
        {step === 0 && (
          <div className="grid gap-6 md:grid-cols-2">
            <p className="text-[16px] text-ink-2 md:col-span-2">Pre-filled from {TRAINING.requestId}. Every field can be changed.</p>
            <FormField className="md:col-span-2" label="Training Title" fr="FR 68" hint={titleKnown ? 'From the Training Title setup.' : <span className="text-warn">Not in the Training Title setup. Pick a title from the search list.</span>}>
              <input list="nom-titles" className={inputCls} value={n.title} onChange={(e) => set({ title: e.target.value })} placeholder="Search by keyword" />
              <datalist id="nom-titles">{titles.map((t) => <option key={t} value={t} />)}</datalist>
            </FormField>
            <FormField label="Date & time" fr="FR 69"><input className={inputCls} value={n.dates} onChange={(e) => set({ dates: e.target.value })} /></FormField>
            <FormField label="Man-hours per participant" fr="FR 69"><input className={inputCls} inputMode="numeric" value={n.manHours} onChange={(e) => set({ manHours: e.target.value })} /></FormField>
            <FormField label="Repeat schedule" fr="FR 69">
              <select className={inputCls} value={n.repeat} onChange={(e) => set({ repeat: e.target.value })}>{[...new Set([n.repeat, ...REPEATS])].map((r) => <option key={r}>{r}</option>)}</select>
            </FormField>
            <FormField label="Venue" fr="FR 70–71" hint="From the Venue setup, checked against the planned training calendar.">
              <select className={inputCls} value={n.venue} onChange={(e) => set({ venue: e.target.value })}>{VENUES.map((v) => <option key={v.name} value={v.name}>{v.name} · {v.address}</option>)}</select>
            </FormField>
            <div className="md:col-span-2">
              {clash
                ? <Alert kind="warn" title={`Venue clash: ${n.venue} is already booked on ${clash}`} action={<Btn size="sm" v="secondary" onClick={() => set({ venue: FREE_VENUE })}>Use {FREE_VENUE.split(' — ')[1] ?? FREE_VENUE}</Btn>}>The planned training calendar has another booking at this venue on a training day. Choose another venue or change the dates.</Alert>
                : <p className="flex items-center gap-2 text-[16px] font-semibold text-ok"><CheckCircle2 size={18} />{n.venue} is free on the training days (training calendar)</p>}
            </div>
            <FormField label="Category" fr="FR 72"><select className={inputCls} value={n.category} onChange={(e) => set({ category: e.target.value })}>{MASTERS.categories.map((c) => <option key={c}>{c}</option>)}</select></FormField>
            <FormField label="Mode" fr="FR 73"><select className={inputCls} value={n.mode} onChange={(e) => set({ mode: e.target.value })}>{MASTERS.modes.map((c) => <option key={c}>{c}</option>)}</select></FormField>
            <FormField label="Medium" fr="FR 74"><select className={inputCls} value={n.medium} onChange={(e) => set({ medium: e.target.value })}>{MASTERS.mediums.map((c) => <option key={c}>{c}</option>)}</select></FormField>
            <FormField label="PDUs" fr="FR 76"><input className={inputCls} inputMode="numeric" value={n.pdus} onChange={(e) => set({ pdus: e.target.value })} /></FormField>
            <FormField className="md:col-span-2" label="Organized By" fr="FR 77" hint="From the Vendor setup.">
              <select className={inputCls} value={n.organizedBy} onChange={(e) => set({ organizedBy: e.target.value })}>{[...new Set([n.organizedBy, ...VENDORS])].map((v) => <option key={v}>{v}</option>)}</select>
            </FormField>
            <div className="md:col-span-2">
              <div className="mb-2 flex items-center gap-2 text-[15px] font-semibold text-ink-2">Tags <FrRef>FR 75</FrRef><span className="font-normal text-ink-3">· {n.tags.length} selected</span></div>
              <TagPicker value={n.tags} onChange={(tags) => set({ tags })} />
            </div>
          </div>
        )}

        {step === 1 && (
          <div>
            <div className="mb-4 flex items-center gap-2"><h2 className="text-[22px] font-bold">Trainer</h2><FrRef>FR 79–84</FrRef></div>
            <TrainerRowsEditor rows={n.trainers} onChange={(trainers) => set({ trainers })} />
          </div>
        )}

        {step === 2 && (
          <div className="space-y-8">
            <section>
              <div className="mb-3 flex items-center gap-2"><h2 className="text-[22px] font-bold">Recipients</h2><FrRef>FR 86</FrRef></div>
              <DataTable rows={DIVISIONS} columns={recipientCols} rowKey={(d) => d.name} label="divisions" maxHeight={340}
                toolbar={<label className="flex items-center gap-2 text-[15px] font-semibold"><input type="checkbox" checked={allOn} ref={(el) => { if (el) el.indeterminate = !allOn && chosen.length > 0; }} onChange={(e) => setAll(e.target.checked)} />Select all</label>} />
            </section>

            <FormField label="Nomination Deadline" fr="FR 85" hint={deadlineOk ? `Closes ${fmtDeadline(n.deadline)} · the training starts ${fmtDeadline(TRAINING_START)}` : <span className="text-warn">The deadline must be after today and before the training starts ({fmtDeadline(TRAINING_START)}).</span>}>
              <input type="datetime-local" className={cx(inputCls, 'max-w-sm')} value={n.deadline} onChange={(e) => set({ deadline: e.target.value })} />
            </FormField>

            <section>
              <div className="mb-3 flex items-center gap-2"><h2 className="text-[22px] font-bold">Email to Learning Champions</h2><FrRef>FR 86–87</FrRef></div>
              <div className="grid gap-6 lg:grid-cols-2">
                <div className="space-y-4">
                  <FormField label="Subject"><input className={inputCls} value={n.subject} onChange={(e) => set({ subject: e.target.value })} /></FormField>
                  <FormField label="Message"><textarea rows={9} className={inputCls} value={n.body} onChange={(e) => set({ body: e.target.value })} /></FormField>
                  <div>
                    <div className="mb-1.5 text-[15px] font-semibold text-ink-2">Insert a fill-in field</div>
                    <div className="flex flex-wrap gap-2">
                      {PLACEHOLDERS.map((p) => <button key={p} type="button" onClick={() => set({ body: `${n.body}${n.body.endsWith('\n') || !n.body ? '' : ' '}${p}` })} className="rounded-full border border-line px-3 py-1 text-[14px] font-semibold text-ink-2 hover:border-ink/30">{p}</button>)}
                    </div>
                  </div>
                </div>
                <div>
                  <div className="mb-1.5 text-[15px] font-semibold text-ink-2">Live preview · as {lc} sees it</div>
                  <div className="rounded-xl border border-line bg-[#faf8f5] p-5 text-[16px] leading-relaxed">
                    <div className="border-b border-line pb-3"><span className="text-ink-3">Subject: </span><b>{fill(n.subject)}</b></div>
                    <div className="whitespace-pre-wrap pt-3">{preview(n.body)}</div>
                  </div>
                </div>
              </div>
            </section>

            <section>
              <div className="mb-2 text-[15px] font-semibold text-ink-2">Documents</div>
              <input ref={docRef} type="file" className="sr-only" tabIndex={-1} aria-label="Add document"
                onChange={(e) => { const f = e.target.files?.[0]; if (f && !n.docs.includes(f.name)) set({ docs: [...n.docs, f.name] }); e.target.value = ''; }} />
              <div className="flex flex-wrap items-center gap-2">
                {n.docs.map((d) => (
                  <span key={d} className="inline-flex items-center gap-2 rounded-lg border border-line px-3 py-1.5 text-[15px]">
                    <FileText size={16} className="text-ink-3" />{d}
                    <button type="button" aria-label={`Remove ${d}`} onClick={() => set({ docs: n.docs.filter((x) => x !== d) })} className="text-ink-3 hover:text-ink"><X size={16} /></button>
                  </span>
                ))}
                <Btn v="secondary" size="sm" icon={<Plus size={16} />} onClick={() => docRef.current?.click()}>Add document</Btn>
              </div>
            </section>

            <p className="border-t border-line pt-5 text-[17px]">
              Will send to <b>{chosen.length} Learning Champion{chosen.length === 1 ? '' : 's'}</b>
              {chosen.length > 0 && <> ({chosen.map((d) => d.learningChampion).join(', ')})</>} · deadline <b>{fmtDeadline(n.deadline)}</b> · {n.docs.length} document{n.docs.length === 1 ? '' : 's'}
            </p>
          </div>
        )}
      </StepForm>
    </div>
  );
}
