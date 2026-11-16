/** Trainer sets up the course before participants start (FR 19, 190–198, 210–213). */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Check, Plus, X } from 'lucide-react';
import { TRAINING } from '../../data';
import { useDemo } from '../../store';
import { PageHead } from '../../components/Templates';
import { Badge, cx, inputCls } from '../../components/ui';

export const DEFAULT_MODULES = ['Credit risk frameworks', 'Financial statement analysis', 'Cash flow and early-warning signals', 'Portfolio case studies'];

export function CourseSetup() {
  const s = useDemo();
  const nav = useNavigate();
  const done = s.courseSetup;
  const [mods, setMods] = useState<string[]>(s.courseModules.length ? s.courseModules : DEFAULT_MODULES);
  const [neu, setNeu] = useState('');
  const [obj, setObj] = useState(20);
  const [desc, setDesc] = useState(1);
  const [pass, setPass] = useState(70);
  const [mins, setMins] = useState(45);
  const [ai, setAi] = useState(true);
  const [aiEval, setAiEval] = useState(true);
  const [release, setRelease] = useState('2026-11-17');
  const card = 'rounded-2xl bg-white px-6 py-5 ring-1 ring-line';
  const lbl = 'mb-1 block text-[14px] text-ink-3';
  return (
    <div className="mx-auto max-w-[1180px]">
      <PageHead title="Course setup" meta={`${TRAINING.title} · set before participants start`} fr="FR 19, 190–198, 210–213"
        tags={<Badge t={done ? 'ok' : 'warn'}>{done ? 'Ready for participants' : 'To set up'}</Badge>} />
      <div className="grid gap-6 lg:grid-cols-2">
        <section className={card}>
          <h2 className="text-[20px] font-semibold">Modules</h2>
          <ol className="mt-3 space-y-2">
            {mods.map((m, i) => (
              <li key={i} className="flex items-center gap-3">
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-canvas text-[14px]">{i + 1}</span>
                <input aria-label={`Module ${i + 1}`} disabled={done} className={inputCls} value={m} onChange={(e) => setMods(mods.map((x, k) => (k === i ? e.target.value : x)))} />
                {!done && mods.length > 1 && <button aria-label={`Remove module ${i + 1}`} onClick={() => setMods(mods.filter((_, k) => k !== i))} className="text-ink-3 hover:text-ink"><X size={18} /></button>}
              </li>
            ))}
          </ol>
          {!done && (
            <div className="mt-3 flex gap-2">
              <input aria-label="New module" className={inputCls} placeholder="Add a module" value={neu} onChange={(e) => setNeu(e.target.value)} />
              <button disabled={!neu.trim()} onClick={() => { setMods([...mods, neu.trim()]); setNeu(''); }} className="flex min-h-11 items-center gap-1.5 rounded-lg border border-line bg-white px-4 text-[15px] disabled:opacity-50"><Plus size={16} />Add</button>
            </div>
          )}
        </section>

        <section className={card}>
          <h2 className="text-[20px] font-semibold">Assessment</h2>
          <div className="mt-3 grid grid-cols-2 gap-4">
            <label><span className={lbl}>Objective questions</span><input type="number" disabled={done} className={inputCls} value={obj} onChange={(e) => setObj(Number(e.target.value))} /></label>
            <label><span className={lbl}>Descriptive questions</span><input type="number" disabled={done} className={inputCls} value={desc} onChange={(e) => setDesc(Number(e.target.value))} /></label>
            <label><span className={lbl}>Pass mark (%)</span><input type="number" disabled={done} className={inputCls} value={pass} onChange={(e) => setPass(Number(e.target.value))} /></label>
            <label><span className={lbl}>Duration (minutes)</span><input type="number" disabled={done} className={inputCls} value={mins} onChange={(e) => setMins(Number(e.target.value))} /></label>
          </div>
          <label className="mt-4 flex items-center gap-3 text-[16px]"><input type="checkbox" disabled={done} checked={aiEval} onChange={(e) => setAiEval(e.target.checked)} className="h-5 w-5 accent-brand" />AI suggests scores for descriptive answers · you decide</label>
        </section>

        <section className={card}>
          <h2 className="text-[20px] font-semibold">Learning resources</h2>
          <p className="mt-2 text-[16px]">{s.materialUploaded ? 'Credit_Risk_Case_Pack_v3.pdf' : 'No material uploaded yet'}</p>
          <p className="text-[14px] text-ink-3">{s.materialLinked ? 'Linked by HR' : s.materialLinkRequested ? 'With HR to link' : s.materialUploaded ? 'Uploaded · request the HR link from your workspace' : 'Upload from your workspace'}</p>
          <button onClick={() => nav('/trainer?s=materials')} className="mt-3 text-[15px] text-brand hover:underline">Open materials →</button>
        </section>

        <section className={card}>
          <h2 className="text-[20px] font-semibold">For participants</h2>
          <label className="mt-3 flex items-center gap-3 text-[16px]"><input type="checkbox" disabled={done} checked={ai} onChange={(e) => setAi(e.target.checked)} className="h-5 w-5 accent-brand" />AI course assistant answers questions on the modules</label>
          <label className="mt-4 block max-w-xs"><span className={lbl}>Course opens on</span><input type="date" disabled={done} className={inputCls} value={release} onChange={(e) => setRelease(e.target.value)} /></label>
        </section>
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-end gap-4">
        {done ? (
          <span className="flex items-center gap-2 text-[16px] text-ok"><Check size={18} />Saved · {s.courseModules.length} modules, assessment and AI assistant ready</span>
        ) : (
          <button onClick={() => s.setupCourse(mods.filter((m) => m.trim()), `${obj} objective + ${desc} descriptive · pass ${pass}% · ${mins} min${aiEval ? ' · AI-suggested scores' : ''}`)}
            className={cx('flex min-h-12 items-center gap-2 rounded-xl bg-brand px-6 text-[16px] font-medium text-white hover:bg-brand-dark')}>Save course setup <ArrowRight size={17} /></button>
        )}
      </div>
    </div>
  );
}
