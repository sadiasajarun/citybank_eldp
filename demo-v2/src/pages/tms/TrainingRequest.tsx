import { useEffect, useId, useMemo, useRef, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Check, CheckCircle2, Download, FileText, Plus, Upload, X } from 'lucide-react';
import { MASTERS, REQUEST_QUEUE, TRAINING } from '../../data';
import { creditGap, CREDIT_TARGET, GAP_TEXT, findByEid, findById, inDivision, searchPeople, TRAINERS, type Person } from '../../org';
import { requestStatus, useDemo, type TrainerRow } from '../../store';
import { Badge, Btn, cx, inputCls } from '../../components/ui';
import { DataTable, downloadCsv, type Column } from '../../components/DataTable';
import { FactGroup, PageHead, StepForm } from '../../components/Templates';
import { FrRef, SourceTag } from '../../components/Source';
import { useSwitchRole } from '../../components/perspective';

/* ================================================================== */
/* Small form pieces shared by the TMS step forms (request, nomination  */
/* setup, scheduling).                                                  */
/* ================================================================== */

/** Labelled field with a 15px label, optional requirement number and hint. */
export function FormField({ label, fr, hint, children, className }: { label: string; fr?: string; hint?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <label className={cx('block', className)}>
      <span className="mb-1.5 flex items-center gap-2 text-[15px] font-semibold text-ink-2">{label}{fr && <FrRef>{fr}</FrRef>}</span>
      {children}
      {hint && <span className="mt-1.5 block text-[14px] text-ink-3">{hint}</span>}
    </label>
  );
}

/** Multi-select of the Training Tags / Labels master (FR 23–24): all 27 tags. */
export function TagPicker({ value, onChange, disabled }: { value: string[]; onChange: (v: string[]) => void; disabled?: boolean }) {
  const toggle = (t: string) => onChange(value.includes(t) ? value.filter((x) => x !== t) : [...value, t]);
  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label="Training tags / labels">
      {MASTERS.tags.map((t) => {
        const on = value.includes(t);
        return (
          <button key={t} type="button" aria-pressed={on} disabled={disabled} onClick={() => toggle(t)}
            className={cx('inline-flex items-center gap-1 rounded-full border px-3 py-1 text-[14px] font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60', on ? 'border-ink bg-ink text-white' : 'border-line bg-white text-ink-2 hover:border-ink/30')}>
            {on && <Check size={14} />}{t}
          </button>
        );
      })}
    </div>
  );
}

const trainerLabel = (t: (typeof TRAINERS)[number]) => `${t.name}${t.eid ? ` · ${t.eid}` : ''} · ${t.type}`;

/** Trainer rows (FR 58–61, 79–83, 107–111): Trainer Details · Topic Name · Session Duration · Remove, plus Add More. */
export function TrainerRowsEditor({ rows, onChange, disabled }: { rows: TrainerRow[]; onChange: (rows: TrainerRow[]) => void; disabled?: boolean }) {
  const listId = useId();
  const set = (i: number, p: Partial<TrainerRow>) => onChange(rows.map((r, k) => (k === i ? { ...r, ...p } : r)));
  const pick = (i: number, v: string) => {
    const q = v.trim().toLowerCase();
    const t = TRAINERS.find((x) => trainerLabel(x).toLowerCase() === q || x.name.toLowerCase() === q || (!!x.eid && x.eid.toLowerCase() === q));
    set(i, t ? { trainerId: t.id, name: t.name } : { trainerId: '', name: v });
  };
  return (
    <div>
      <datalist id={listId}>{TRAINERS.map((t) => <option key={t.id} value={trainerLabel(t)} />)}</datalist>
      <div className="hidden grid-cols-[minmax(0,1.4fr)_minmax(0,1.2fr)_150px_96px] gap-3 pb-2 md:grid">
        {['Trainer Details', 'Topic Name', 'Session Duration', ''].map((h) => <span key={h} className="text-[15px] font-semibold text-ink-2">{h}</span>)}
      </div>
      <ul className="space-y-4">
        {rows.map((r, i) => {
          const t = TRAINERS.find((x) => x.id === r.trainerId);
          return (
            <li key={i} className="grid gap-3 border-b border-line pb-4 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1.2fr)_150px_96px] md:border-0 md:pb-0">
              <div>
                <input list={listId} aria-label={`Trainer Details, row ${i + 1}`} className={inputCls} disabled={disabled} placeholder="Search by name or EID"
                  value={t ? trainerLabel(t) : r.name} onChange={(e) => pick(i, e.target.value)} />
                <span className={cx('mt-1 block text-[14px]', t ? 'text-ink-3' : r.name ? 'text-warn' : 'text-ink-3')}>
                  {t ? `${t.designation} · ${t.institute}${t.type === 'Internal' ? ' · details from HRIS' : ' · Trainer setup'}` : r.name ? 'Not in the Trainer setup yet. Pick a trainer from the list.' : 'Internal trainers by EID, external by name'}
                </span>
              </div>
              <input aria-label={`Topic Name, row ${i + 1}`} className={inputCls} disabled={disabled} placeholder="Topic Name" value={r.topic} onChange={(e) => set(i, { topic: e.target.value })} />
              <input aria-label={`Session Duration, row ${i + 1}`} className={inputCls} disabled={disabled} placeholder="e.g. 3 h" value={r.duration} onChange={(e) => set(i, { duration: e.target.value })} />
              <div><Btn v="ghost" disabled={disabled} icon={<X size={16} />} onClick={() => onChange(rows.filter((_, k) => k !== i))} label={`Remove trainer row ${i + 1}`}>Remove</Btn></div>
            </li>
          );
        })}
      </ul>
      {rows.length === 0 && <p className="py-3 text-[16px] text-ink-3">No trainers added. Use Add More to add one.</p>}
      <div className="mt-4"><Btn v="secondary" disabled={disabled} icon={<Plus size={16} />} onClick={() => onChange([...rows, { trainerId: '', name: '', topic: '', duration: '' }])}>Add More</Btn></div>
    </div>
  );
}

/** Select Participant by EID or name (FR 63, 113): type, then pick from the HRIS matches. */
export function PersonSearch({ onPick, exclude = [], label = 'Select Participant', fr }: { onPick: (p: Person) => void; exclude?: string[]; label?: string; fr?: string }) {
  const [q, setQ] = useState('');
  const hits = searchPeople(q).filter((p) => !exclude.includes(p.id));
  const listId = useId();
  const choose = (p: Person) => { onPick(p); setQ(''); };
  return (
    <div className="relative">
      <FormField label={label} fr={fr} hint="Search by name or Employee ID (EID). Details come from HRIS (fictional data).">
        <input role="combobox" aria-expanded={!!q} aria-controls={listId} className={inputCls} value={q} placeholder="e.g. Ayesha or CBL-10482"
          onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && hits[0]) { e.preventDefault(); choose(hits[0]); } if (e.key === 'Escape') setQ(''); }} />
      </FormField>
      {q && (
        <ul id={listId} role="listbox" className="absolute left-0 right-0 top-[74px] z-20 max-h-72 overflow-y-auto rounded-xl border border-line bg-white py-1 shadow-lg">
          {hits.length === 0 && <li className="px-4 py-3 text-[15px] text-ink-3">No employee matches “{q}”{searchPeople(q).length ? ' who is not already on the list' : ''}.</li>}
          {hits.map((p) => (
            <li key={p.id} role="option" aria-selected={false}>
              <button type="button" onClick={() => choose(p)} className="w-full px-4 py-2.5 text-left text-[15px] hover:bg-canvas">
                <b>{p.name}</b> · {p.eid}<span className="block text-[14px] text-ink-3">{p.designation} · {p.division} · {p.grade}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** Bulk upload of EIDs from a CSV file (FR 63, 113), with a template download. Parsing is real; HRIS lookup is fictional. */
export function CsvUpload({ onIds, label = 'Bulk upload (CSV)' }: { onIds: (ids: string[]) => void; label?: string }) {
  const ref = useRef<HTMLInputElement>(null);
  const [result, setResult] = useState<string | null>(null);
  const read = async (f: File) => {
    const text = await f.text();
    const tokens = text.split(/[\s,;]+/).map((t) => t.replace(/"/g, '').trim()).filter((t) => /^CBL-\d+$/i.test(t));
    const ids: string[] = [];
    const unknown: string[] = [];
    tokens.forEach((t) => { const p = findByEid(t); if (p) { if (!ids.includes(p.id)) ids.push(p.id); } else unknown.push(t.toUpperCase()); });
    onIds(ids);
    setResult(`${f.name}: ${ids.length} employee${ids.length === 1 ? '' : 's'} matched by EID${unknown.length ? ` · not found in HRIS: ${unknown.join(', ')}` : ''}${!tokens.length ? ' · no EIDs (CBL-xxxxx) found in the file' : ''}`);
  };
  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        <input ref={ref} type="file" accept=".csv,text/csv,.txt" className="sr-only" aria-label={label} tabIndex={-1}
          onChange={(e) => { const f = e.target.files?.[0]; if (f) void read(f); e.target.value = ''; }} />
        <Btn v="secondary" icon={<Upload size={16} />} onClick={() => ref.current?.click()}>{label}</Btn>
        <Btn v="link" icon={<Download size={16} />} onClick={() => downloadCsv('participant_upload_template.csv', ['EID', 'Name (optional)'], [['CBL-10482', 'Ayesha Rahman'], ['CBL-09371', 'Tanvir Hasan']])}>Download template</Btn>
      </div>
      {result && <p className="mt-2 text-[15px] text-ink-2" role="status">{result}</p>}
    </div>
  );
}

/** A light side card used by the step forms' right rail. */
export function RailCard({ children }: { children: ReactNode }) {
  return <div className="space-y-5 rounded-2xl border border-line bg-white p-6">{children}</div>;
}

/* ================================================================== */
/* Training Request · Division Head / Learning Champion (FR 14, 49–64) */
/* ================================================================== */
const STEPS = ['Program', 'Trainer', 'Nominations', 'Review & submit'];
const JUSTIFICATION = `Credit Analysis is below target for ${GAP_TEXT} Relationship Managers and Credit Analysts in Corporate Banking. FY2027 portfolio quality targets need this uplift before the Q1 lending cycle.`;

export function TrainingRequest() {
  const s = useDemo();
  const nav = useNavigate();
  const switchRole = useSwitchRole();
  const [step, setStep] = useState(0);
  const [saved, setSaved] = useState<boolean[]>([false, false, false, false]);
  const [exited, setExited] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const d = s.draft;

  // Opening the request form is the Division Head acting on the business need (journey step 1).
  useEffect(() => { if (s.role === 'division_head') s.confirmNeed(); }, [s.role]);

  const gap = useMemo(() => creditGap('Corporate Banking'), []);
  const divisionSize = useMemo(() => inDivision('Corporate Banking').length, []);
  const picked = d.participantIds.map((id) => findById(id)).filter((p): p is Person => !!p);
  const idFixed = !!d.savedAt || saved.some(Boolean);
  const norm = d.title.trim().toLowerCase();
  const dupSetup = !!norm && norm === TRAINING.title.toLowerCase();
  const dupReq = REQUEST_QUEUE.find((r) => r.id !== TRAINING.requestId && r.title.toLowerCase() === norm);
  const sessions = d.repeat === 'Single day' ? 1 : Math.max(1, d.repeatDays);
  const pax = picked.length || d.participants;

  const head = (
    <PageHead title="Training Request" fr="FR 14, 49–64"
      meta={<>Request ID <b>{TRAINING.requestId}</b> · {idFixed || s.requestSubmitted ? 'fixed' : 'sequential, fixed when saved'} · Corporate Banking Division</>}
      tags={<><SourceTag kind="fictional" /><Badge>{requestStatus(s)}</Badge></>} />
  );

  /* ---------- finished states ---------- */
  if (s.requestSubmitted) {
    return (
      <div>
        {head}
        <div className="mx-auto max-w-2xl rounded-2xl border border-line bg-white p-8 text-center">
          <CheckCircle2 size={44} className="mx-auto text-ok" />
          <h2 className="mt-3 text-[24px] font-bold">Request {TRAINING.requestId} submitted to HR</h2>
          <p className="mt-2 text-[16px] text-ink-2">{d.title || TRAINING.title} · {pax} proposed participants · status <Badge>{requestStatus(s)}</Badge></p>
          <p className="mt-1 text-[16px] text-ink-2">HR Admin reviews it next and either asks divisions for nominations or schedules it directly.</p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Btn v="secondary" onClick={() => nav('/r/division_head')}>Back to My work</Btn>
            <Btn onClick={() => switchRole('hr', `/hr/requests/${TRAINING.requestId}`)}>See it in HR’s review <ArrowRight size={16} /></Btn>
          </div>
        </div>
      </div>
    );
  }
  if (exited) {
    return (
      <div>
        {head}
        <div className="mx-auto max-w-2xl rounded-2xl border border-line bg-white p-8 text-center">
          <CheckCircle2 size={44} className="mx-auto text-ok" />
          <h2 className="mt-3 text-[24px] font-bold">Draft saved{d.savedAt ? ` at ${d.savedAt}` : ''}</h2>
          <p className="mt-2 text-[16px] text-ink-2">{d.title || 'Untitled request'} · {pax} participants selected. Nothing has gone to HR yet. Open the request again to finish and submit it.</p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Btn v="secondary" onClick={() => setExited(false)}>Continue editing</Btn>
            <Btn onClick={() => nav('/r/division_head')}>Back to My work</Btn>
          </div>
        </div>
      </div>
    );
  }

  const saveNext = (i: number) => { setSaved((x) => x.map((v, k) => (k === i ? true : v))); setStep(i + 1); };
  const addIds = (ids: string[]) => s.setDraft({ participantIds: [...d.participantIds, ...ids.filter((id) => !d.participantIds.includes(id))] });
  const removeId = (id: string) => s.setDraft({ participantIds: d.participantIds.filter((x) => x !== id) });
  const setTrainers = (rows: TrainerRow[]) => s.setDraft({ trainers: rows, trainer: rows.filter((r) => r.name).map((r) => r.name).join(' + ') });
  const gapLeft = gap.filter((p) => !d.participantIds.includes(p.id));

  const personCols = (action: (p: Person) => ReactNode): Column<Person>[] => [
    { key: 'name', header: 'Employee', render: (p) => <b className="text-[16px]">{p.name}</b>, sort: (p) => p.name },
    { key: 'eid', header: 'EID', render: (p) => p.eid, sort: (p) => p.eid },
    { key: 'des', header: 'Designation', render: (p) => p.designation, filter: (p) => p.designation },
    { key: 'lvl', header: 'Credit Analysis', render: (p) => <span className={p.creditLevel < CREDIT_TARGET ? 'font-semibold text-warn' : 'text-ink-2'}>Level {p.creditLevel} of target {CREDIT_TARGET}</span>, sort: (p) => p.creditLevel },
    { key: 'act', header: '', render: action },
  ];

  /* ---------- footer per step ---------- */
  const footer = (
    <>
      {step > 0 && <Btn v="secondary" onClick={() => setStep(step - 1)}>Previous</Btn>}
      <span className="flex-1" />
      {step === 1 && <Btn v="secondary" onClick={() => setStep(2)}>Skip & Next</Btn>}
      {step === 2 && <Btn v="secondary" onClick={() => { s.saveDraft(); setExited(true); }}>Save & Exit</Btn>}
      {step < 3 && <Btn onClick={() => saveNext(step)}>Save & Next</Btn>}
      {step === 3 && (
        <>
          {!d.title.trim() && <span className="text-[15px] text-warn">Add a Training Title on the Program tab first.</span>}
          <Btn disabled={!d.title.trim()} onClick={() => s.submitRequest()}>Submit to HR</Btn>
        </>
      )}
    </>
  );


  return (
    <div>
      {head}
      <StepForm steps={STEPS} current={step} onStep={setStep} done={saved} footer={footer}>
        {step === 0 && (
          <div className="grid gap-6 md:grid-cols-2">
            <div className="md:col-span-2">
              <FormField label="Training Title" fr="FR 50"
                hint={dupSetup ? <span className="font-semibold text-warn">This title already exists in the Training Title setup. The request is linked to it, not duplicated.</span>
                  : dupReq ? <span className="font-semibold text-warn">A request with this title is already open: {dupReq.id} ({dupReq.division}). Check with HR before raising another.</span>
                  : 'Checked against the Training Title setup for duplicates (FR 28–30).'}>
                <input className={inputCls} value={d.title} onChange={(e) => s.setDraft({ title: e.target.value })} placeholder="e.g. Advanced Credit Risk Management" />
              </FormField>
              {d.title !== TRAINING.title && (
                <div className="mt-2 flex flex-wrap items-center gap-2 text-[15px] text-ink-2">
                  <span>Suggested from the competency gap: <b>{TRAINING.title}</b></span>
                  <Btn v="link" onClick={() => s.setDraft({ title: TRAINING.title, justification: d.justification || JUSTIFICATION })}>Use suggested</Btn>
                </div>
              )}
            </div>
            <FormField label="Date & time" fr="FR 51"><input className={inputCls} value={d.dates} onChange={(e) => s.setDraft({ dates: e.target.value })} /></FormField>
            <FormField label="Man-hour per participant" fr="FR 51"><input className={inputCls} value={d.duration} onChange={(e) => s.setDraft({ duration: e.target.value })} /></FormField>
            <FormField label="Repeat schedule" fr="FR 51">
              <select className={inputCls} value={d.repeat} onChange={(e) => s.setDraft({ repeat: e.target.value as typeof d.repeat })}>
                {(['Single day', 'Repeat daily', 'Repeat weekly'] as const).map((r) => <option key={r}>{r}</option>)}
              </select>
            </FormField>
            <FormField label="Number of sessions" hint={`${sessions} session${sessions > 1 ? 's' : ''} · ${d.repeat === 'Repeat weekly' ? 'same day each week' : d.repeat === 'Repeat daily' ? 'consecutive days' : 'one day'}`}>
              <input type="number" min={1} max={10} className={inputCls} disabled={d.repeat === 'Single day'} value={d.repeat === 'Single day' ? 1 : d.repeatDays} onChange={(e) => s.setDraft({ repeatDays: Math.min(10, Math.max(1, Number(e.target.value) || 1)) })} />
            </FormField>
            <FormField label="Venue (suggested)" fr="FR 52" hint="Free text. HR confirms the venue against the Venue setup and calendar.">
              <input className={inputCls} value={d.venue} onChange={(e) => s.setDraft({ venue: e.target.value })} />
            </FormField>
            <div className="hidden md:block" />
            <FormField label="Training Mode" fr="FR 53" hint="Mode of Training setup (FR 27)">
              <select className={inputCls} value={d.mode} onChange={(e) => s.setDraft({ mode: e.target.value })}>{MASTERS.modes.map((m) => <option key={m}>{m}</option>)}</select>
            </FormField>
            <FormField label="Training Medium" fr="FR 54" hint="Training Medium setup (FR 26)">
              <select className={inputCls} value={d.medium} onChange={(e) => s.setDraft({ medium: e.target.value })}>{MASTERS.mediums.map((m) => <option key={m}>{m}</option>)}</select>
            </FormField>
            <div className="md:col-span-2">
              <div className="mb-2 flex items-center gap-2 text-[15px] font-semibold text-ink-2">Training Tags / Labels (multiple) <FrRef>FR 55</FrRef><span className="font-normal text-ink-3">· {d.tags.length} selected</span></div>
              <TagPicker value={d.tags} onChange={(tags) => s.setDraft({ tags })} />
            </div>
            <div className="md:col-span-2">
              <div className="mb-2 flex items-center gap-2 text-[15px] font-semibold text-ink-2">Upload Content (optional) <FrRef>FR 56</FrRef><SourceTag kind="simulated">Simulated upload</SourceTag></div>
              <input ref={fileRef} type="file" className="sr-only" tabIndex={-1} aria-label="Upload Content"
                onChange={(e) => { const f = e.target.files?.[0]; if (f && !d.attachments.includes(f.name)) s.setDraft({ attachments: [...d.attachments, f.name] }); e.target.value = ''; }} />
              <div className="flex flex-wrap items-center gap-2">
                {d.attachments.map((a) => (
                  <span key={a} className="inline-flex items-center gap-2 rounded-lg border border-line px-3 py-1.5 text-[15px]">
                    <FileText size={16} className="text-ink-3" />{a}
                    <button type="button" aria-label={`Remove ${a}`} onClick={() => s.setDraft({ attachments: d.attachments.filter((x) => x !== a) })} className="text-ink-3 hover:text-ink"><X size={16} /></button>
                  </span>
                ))}
                <Btn v="secondary" icon={<Upload size={16} />} onClick={() => fileRef.current?.click()}>{d.attachments.length ? 'Add another file' : 'Upload Content'}</Btn>
              </div>
              <p className="mt-1.5 text-[14px] text-ink-3">The file name is stored with the request; the file itself stays on this device in the demo.</p>
            </div>
            <FormField className="hidden" label="">
              <span />
            </FormField>
          </div>
        )}

        {step === 1 && (
          <div>
            <div className="mb-4 flex items-center gap-2"><h2 className="text-[22px] font-bold">Trainer</h2><FrRef>FR 58–62</FrRef></div>
            <p className="mb-5 text-[16px] text-ink-2">Suggest the trainers you have in mind. HR confirms them when the training is scheduled. You can skip this tab.</p>
            <TrainerRowsEditor rows={d.trainers} onChange={setTrainers} />
          </div>
        )}

        {step === 2 && (
          <div className="space-y-8">
            <div>
              <div className="mb-4 flex items-center gap-2"><h2 className="text-[22px] font-bold">Nominations</h2><FrRef>FR 63–64</FrRef></div>
              <div className="grid gap-6 lg:grid-cols-2">
                <PersonSearch exclude={d.participantIds} onPick={(p) => addIds([p.id])} />
                <div>
                  <div className="mb-1.5 text-[15px] font-semibold text-ink-2">Or bulk upload</div>
                  <CsvUpload onIds={addIds} />
                </div>
              </div>
            </div>

            <section>
              <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
                <div>
                  <h3 className="text-[20px] font-bold">Suggested from the competency gap</h3>
                  <p className="text-[15px] text-ink-3">Corporate Banking officers below the Credit Analysis target ({gap.length} of {divisionSize} in the division) · competency data, fictional</p>
                </div>
                <Btn v="secondary" disabled={!gapLeft.length} onClick={() => addIds(gapLeft.map((p) => p.id))}>{gapLeft.length ? `Add all ${gapLeft.length}` : 'All added'}</Btn>
              </div>
              <DataTable rows={gap} rowKey={(p) => p.id} searchText={(p) => `${p.name} ${p.eid}`} maxHeight={300} label="officers"
                columns={personCols((p) => d.participantIds.includes(p.id) ? <span className="text-[15px] font-semibold text-ok">Added</span> : <Btn v="link" onClick={() => addIds([p.id])}>Add</Btn>)} />
            </section>

            <section>
              <h3 className="mb-3 text-[20px] font-bold">Selected participants · {picked.length}</h3>
              <DataTable rows={picked} rowKey={(p) => p.id} searchText={(p) => `${p.name} ${p.eid}`} maxHeight={320} label="participants"
                emptyText="No participants selected yet. Search above, upload a CSV, or add the suggested officers."
                columns={personCols((p) => <Btn v="link" onClick={() => removeId(p.id)}>Remove</Btn>)} />
            </section>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-8">
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-[22px] font-bold">Review & submit</h2>
              <SourceTag kind="proposed" />
            </div>
            <p className="-mt-5 text-[16px] text-ink-2">Annexure-II ends the request form at Save & Exit (FR 64). This review step, and sending the request to HR from here, is our proposal.</p>
            <FactGroup title="Program" rows={[
              ['Training Title', d.title || <span className="text-warn">Not entered</span>],
              ['Requirement source', d.sources.join(' · ') || 'Competency and role gap'],
              ['Date & time', d.dates],
              ['Repeat schedule', `${d.repeat} · ${sessions} session${sessions > 1 ? 's' : ''}`],
              ['Man-hour per participant', d.duration],
              ['Venue (suggested)', d.venue],
              ['Training Mode · Medium', `${d.mode} · ${d.medium}`],
              ['Tags / Labels', d.tags.join(', ') || '—'],
              ['Content', d.attachments.join(', ') || 'None uploaded'],
            ]} />
            <FactGroup title="Trainer" rows={d.trainers.length ? d.trainers.map((t, i) => [`Trainer ${i + 1}`, `${t.name || 'Not chosen'} · ${t.topic || 'no topic'} · ${t.duration || '—'}`]) : [['Trainers', 'Skipped · HR assigns']]} />
            <FactGroup title="Nominations" rows={[
              ['Proposed participants', String(pax)],
              ['Named participants', picked.length ? `${picked.slice(0, 5).map((p) => p.name).join(', ')}${picked.length > 5 ? ` and ${picked.length - 5} more` : ''}` : 'None named yet · HR collects nominations next'],
            ]} />
            <div className="rounded-2xl bg-[#faf8f5] p-6">
              <div className="text-[16px] font-semibold">What happens after you submit</div>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-[16px] text-ink-2">
                <li>{TRAINING.requestId} goes to HR Admin’s inbox as Pending HR Review.</li>
                <li>HR either asks divisions for nominations or schedules the training directly (FR 66).</li>
                <li>You can follow the status from My work.</li>
              </ul>
            </div>
          </div>
        )}
      </StepForm>
    </div>
  );
}
