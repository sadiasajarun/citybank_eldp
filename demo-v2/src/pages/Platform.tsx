import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Folder, Lock, Search, ShieldCheck } from 'lucide-react';
import { INTEGRATIONS } from '../data';
import { useDemo } from '../store';
import type { AuditEvent } from '../types';
import { Badge, Btn, Card, cx, Kpi, Modal, PageHeader, Progress, SimTag, Table, Td } from '../components/ui';

export function Integrations() {
  return (
    <div>
      <PageHeader title="Integration Health" sub="Adapters behind stable internal interfaces; every call logged with correlation ID" />
      <div className="mb-4"><SimTag>Demo integration · simulated connected state — no live City Bank system is connected</SimTag></div>
      <Card pad={false}><Table head={['System', 'Purpose', 'Interface', 'Direction', 'Status', 'Last activity']}>
        {INTEGRATIONS.map((i) => <tr key={i.name}><Td><b>{i.name}</b></Td><Td>{i.desc}</Td><Td className="text-[14px] text-ink-3">{i.iface}</Td><Td>{i.dir}</Td><Td><Badge t="ok">Connected</Badge></Td><Td className="text-[14px] text-ink-3">{i.sync}</Td></tr>)}
      </Table></Card>
      <p className="mt-3 text-[14px] text-ink-3">Core banking, RTGS, EFT and cheque clearing are outside LMS integration scope.</p>
    </div>
  );
}

export function AuditPage() {
  const audit = useDemo((s) => s.audit);
  const seeded: AuditEvent[] = [{ id: 900, at: '12 Nov 2026 09:14', actor: 'Nusrat Jahan', actorRole: 'HR Admin', action: 'Login via City Bank SSO', detail: 'Session bound to device · Dhaka HO' }];
  const rows = [...audit, ...seeded];
  return (
    <div><PageHeader title="Audit Logs" sub="Append-only · forwarded to the Bank SIEM (simulated)" />
      <Card pad={false}><Table head={['Time', 'Actor', 'Action', 'Detail', 'Approval']}>
        {rows.map((a) => <tr key={a.id}><Td className="whitespace-nowrap text-[14px]">{a.at}</Td><Td><b>{a.actor}</b><div className="text-[14px] text-ink-3">{a.actorRole}</div></Td><Td className="font-semibold">{a.action}</Td><Td>{a.detail}{a.previous ? <div className="text-[14px] text-ink-3">Previous: {a.previous} → New: {a.next}</div> : null}</Td><Td>{a.approvedBy ? <span className="text-[14px] font-semibold text-ok">{a.approvedBy}</span> : '—'}</Td></tr>)}
      </Table></Card></div>
  );
}

export function Security() {
  return (
    <div><PageHeader title="Users, Roles & Security" sub="Role, record and field-level privileges with maker-checker" />
      <div className="mb-4 grid gap-3 md:grid-cols-4"><Kpi label="Active roles" value={8} /><Kpi label="Maker-checker rules" value={6} /><Kpi label="Concurrent sessions" value="Policy: 1" /><Kpi label="Session time-out" value="15 min" /></div>
      <Card pad={false}><Table head={['Role', 'Inherits', 'Scope', 'Maker-checker']}>
        {[['Employee', '—', 'Own records'], ['Supervisor', 'Employee', 'Direct reports'], ['Division Head / Learning Champion', 'Supervisor', 'Division'], ['Trainer', 'Employee', 'Assigned sessions'], ['HR Admin', 'Supervisor', 'All training operations'], ['Admin', '—', 'Users, config, integrations'], ['External Trainer', '—', 'Assigned sessions'], ['External Trainee', '—', 'Own records']].map(([a, b, c], i) => <tr key={a}><Td><b>{a}</b></Td><Td>{b}</Td><Td>{c}</Td><Td>{i === 4 || i === 5 ? <Badge t="warn"><Lock size={10} /> Required for critical actions</Badge> : '—'}</Td></tr>)}
      </Table></Card>
      <p className="mt-3 flex items-center gap-1.5 text-[14px] text-ink-3"><ShieldCheck size={13} /> Internal-only administration · on-premise deployment at City Bank DC with warm DR at DRS.</p></div>
  );
}

export function Knowledge() {
  const [q, setQ] = useState('');
  const [doc, setDoc] = useState<string | null>(null);
  const cats = ['Banking Foundation', 'AML & Compliance', 'Credit', 'Risk', 'Leadership', 'Customer Experience', 'Digital Banking', 'Sustainable Finance'];
  const docs = [['Credit_Risk_Case_Pack_v3.pdf', 'Credit', 'PDF · preview-only'], ['AML Red Flags Video', 'AML & Compliance', 'Video · watermark'], ['Leadership Essentials Deck', 'Leadership', 'PPTX · download'], ['Basel III Quick Guide', 'Risk', 'PDF · preview-only'], ['Customer Journey Playbook', 'Customer Experience', 'Word'], ['Green Finance Policy', 'Sustainable Finance', 'PDF']];
  return (
    <div><PageHeader title="Knowledge Corner" sub="Folders, policies, videos and documents with permission control" />
      <div className="mb-4 flex items-center gap-2 rounded-lg border border-line bg-white px-3 py-2"><Search size={15} className="text-ink-3" /><input aria-label="Search knowledge" value={q} onChange={(e) => setQ(e.target.value)} className="flex-1 text-[14.5px] outline-none" placeholder="Search resources, tags, folders" /></div>
      <div className="mb-5 grid grid-cols-2 gap-3 md:grid-cols-4">{cats.map((c) => <button key={c} onClick={() => setQ(c)} className="card flex items-center gap-2.5 p-3 text-left text-[14.5px] font-semibold hover:shadow-md"><Folder size={16} className="text-brand" />{c}</button>)}</div>
      <Card pad={false}><Table head={['Resource', 'Folder', 'Protection', '']}>
        {docs.filter((d) => (d[0] + d[1]).toLowerCase().includes(q.toLowerCase())).map(([a, b, c]) => <tr key={a}><Td><span className="flex items-center gap-2 font-semibold"><BookOpen size={14} className="text-ink-3" />{a}</span></Td><Td>{b}</Td><Td><Badge t="neutral">{c}</Badge></Td><Td><Btn size="sm" v="secondary" onClick={() => setDoc(a)}>Open</Btn></Td></tr>)}
      </Table></Card>
      <Modal open={!!doc} onClose={() => setDoc(null)} title={doc ?? ''} footer={<Btn v="secondary" onClick={() => setDoc(null)}>Close</Btn>}>
        <div className="grid aspect-[4/3] place-items-center rounded-xl border border-line bg-canvas text-center text-[16px] text-ink-2">
          <div><BookOpen size={28} className="mx-auto mb-2 text-ink-3" />Preview of {doc}<div className="mt-1 text-[14px] text-ink-3">Preview only · watermark CBL-10482 · download and print follow the folder's protection setting (FR 227)</div></div>
        </div>
      </Modal></div>
  );
}

export function LibraryPage() {
  const [req, setReq] = useState<string[]>([]);
  return (
    <div><PageHeader title="Physical Library" sub="Books issued to employees with return dates" />
      <Card pad={false}><Table head={['Book', 'Author', 'Status', 'Due', '']}>
        {[['Credit Risk Management in Banks', 'Joetta Colquitt', 'Available', '—'], ['Basel III Implementation', 'BIBM', 'Issued', '18 Nov 2026'], ['The Essentials of Risk Management', 'Crouhy', 'Overdue', '02 Nov 2026'], ['Anti-Money Laundering Handbook', 'Bangladesh Bank', 'Available', '—']].map(([a, b, c, d]) => <tr key={a}><Td><b>{a}</b></Td><Td>{b}</Td><Td><Badge t={c === 'Available' ? 'ok' : c === 'Overdue' ? 'brand' : 'info'}>{c}</Badge></Td><Td>{d}</Td><Td>{c === 'Available' && <Btn size="sm" v="secondary" disabled={req.includes(a)} onClick={() => setReq([...req, a])}>{req.includes(a) ? 'Requested' : 'Request Book'}</Btn>}</Td></tr>)}
      </Table></Card></div>
  );
}

export function Mobile() {
  const s = useDemo();
  const nav = useNavigate();
  const [scr, setScr] = useState(0);
  const screens = ['Home', 'My Learning', 'Course Player', 'Invitation', 'Certificate'];
  return (
    <div>
      <PageHeader title="Mobile Preview" sub="Flutter Android / iOS · offline course playback, low-bandwidth mode, push notifications" />
      <div className="mb-4 flex flex-wrap gap-1.5">{screens.map((x, i) => <button key={x} onClick={() => setScr(i)} className={cx('rounded-lg border px-3 py-1.5 text-[14px] font-semibold', scr === i ? 'border-brand bg-brand-soft text-brand-dark' : 'border-line bg-white')}>{x}</button>)}</div>
      <div className="mx-auto w-[300px] rounded-[36px] border-[10px] border-ink bg-canvas p-3 shadow-2xl" style={{ minHeight: 560 }}>
        <div className="mb-3 flex items-center justify-between px-1 text-[14px] font-bold"><span>09:41</span><span>City Bank ELDP</span></div>
        {scr === 0 && <div className="space-y-3"><div className="text-base font-extrabold">Good morning, Ayesha</div><div className="card p-3"><div className="th">Mandatory</div><div className="text-[14.5px] font-bold">Information Security</div><Progress value={s.courseProgress} /></div><div className="card p-3"><div className="th">Upcoming</div><div className="text-[14.5px] font-bold">Advanced Credit Risk Management</div><div className="text-[14px] text-ink-3">18–19 Nov · Learning Center</div></div></div>}
        {scr === 1 && <div className="space-y-2">{['Information Security · 65%', 'Credit Fundamentals · Done', 'AML Certification · Exam 30 Nov'].map((x) => <div key={x} className="card p-3 text-[14.5px] font-semibold">{x}</div>)}</div>}
        {scr === 2 && <div><div className="mb-2 grid aspect-video place-items-center rounded-lg bg-ink text-white"><span className="text-[14px]">▶ Module 2 · 720p auto</span></div><div className="card p-3 text-[14px]"><b>Offline available</b> · Subtitles: English / বাংলা</div></div>}
        {scr === 3 && <div className="card space-y-2 p-3"><div className="th">Invitation</div><div className="text-[15.5px] font-bold">Advanced Credit Risk Management</div><div className="text-[14px] text-ink-3">18–19 Nov 2026 · City Bank Learning Center</div><Btn className="w-full" disabled={s.participation.e1 !== 'Invited'} onClick={() => s.accept('e1')}>{s.participation.e1 === 'Accepted' ? 'Accepted' : 'Accept'}</Btn><Btn v="secondary" className="w-full" onClick={() => nav('/employee')}>Withdraw Request</Btn></div>}
        {scr === 4 && <div className="card p-4 text-center"><img src="/brand/citybank-logo.png" alt="City Bank" className="mx-auto mb-2 h-12 w-auto" /><div className="text-[14.5px] font-extrabold">Certificate of Completion</div><div className="my-2 text-sm font-bold text-brand">Ayesha Rahman</div><div className="text-[14px]">Information Security Awareness 2026</div></div>}
      </div>
    </div>
  );
}
