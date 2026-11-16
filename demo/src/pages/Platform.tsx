import { useState } from 'react';
import { BookOpen, Folder, Lock, Search, ShieldCheck } from 'lucide-react';
import { INTEGRATIONS } from '../data';
import { roster, useDemo } from '../store';
import type { AuditEvent } from '../types';
import { BarChart, Badge, Btn, Card, cx, Kpi, LineChart, PageHeader, Progress, SimTag, Table, Td, AiLabel } from '../components/ui';

export function Analytics() {
  const s = useDemo();
  const done = s.completed;
  const hours = 38420 + (s.attendanceSubmitted ? roster(s).length * 16 : 0);
  const [div, setDiv] = useState('All divisions');
  return (
    <div>
      <PageHeader title="L&D Executive Dashboard" sub="All workflows feed one enterprise intelligence layer" actions={
        <select className="rounded-lg border border-line bg-white px-3 py-2 text-[13px] font-semibold" value={div} onChange={(e) => setDiv(e.target.value)} aria-label="Division filter">{['All divisions', 'Corporate Banking', 'SME Banking', 'Retail Banking', 'Risk Management'].map((d) => <option key={d}>{d}</option>)}</select>} />
      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-5">
        <Kpi label="Workforce Learning" value="8,742" sub="active learners" />
        <Kpi label="Mandatory Completion" value={s.courseCompleted ? '94.7%' : '94.6%'} tone="ok" />
        <Kpi label="Learning Hours" value={hours.toLocaleString('en-IN')} sub={s.attendanceSubmitted ? 'YTD · +512 h just added' : 'YTD'} tone={s.attendanceSubmitted ? 'ok' : undefined} />
        <Kpi label="Active Programs" value={74 + (s.scheduled ? 0 : 0)} />
        <Kpi label="Training Investment" value={done ? 'BDT 6.42M' : 'BDT 4.98M'} sub={done ? '+ 14.4 lakh this programme' : 'YTD'} />
        <Kpi label="Avg. Cost / Employee" value={done ? 'BDT 734' : 'BDT 570'} />
        <Kpi label="Assessment Pass Rate" value="91%" />
        <Kpi label="Feedback Score" value="4.6 / 5" />
        <Kpi label="Competency Gaps" value="12" sub="priority areas" tone="warn" />
        <Kpi label="Upcoming Training" value={s.scheduled ? 9 : 8} />
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <Card title="Completion by Division"><BarChart data={[{ label: 'Corporate Banking', value: 92 }, { label: 'SME Banking', value: 95 }, { label: 'Retail Banking', value: 97 }, { label: 'Risk Management', value: 99 }, { label: 'Operations', value: 90 }]} max={100} /></Card>
        <Card title="Mandatory Learning Risk" action={<AiLabel>AI-assisted · explainable</AiLabel>}>
          {[['Information Security', 'Medium', 'warn'], ['AML & CFT', 'Low', 'ok'], ['Data Privacy', 'High', 'brand']].map(([a, b, c]) => <div key={a} className="flex items-center justify-between border-b border-line py-2.5 text-[13px] last:border-0"><span className="font-semibold">{a}</span><Badge t={c}>{b} risk</Badge></div>)}
          <p className="mt-2 text-[11px] text-ink-3">Risk score from completion velocity and days to deadline. No automatic action.</p>
        </Card>
        <Card title="Top Competency Gaps"><BarChart data={[{ label: 'Credit Analysis', value: 38 }, { label: 'Digital Banking', value: 29 }, { label: 'Leadership', value: 24 }, { label: 'Risk Awareness', value: 18 }]} unit="%" color="bg-ink" /></Card>
        <Card title="Learning Hours Trend (000)"><LineChart points={[27.1, 29.4, 31.2, 33.0, 35.6, hours / 1000]} labels={['Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov']} /></Card>
        <Card title="Training Investment Trend (BDT M)"><LineChart points={[0.6, 0.7, 0.9, 0.8, 1.1, done ? 1.6 : 1.1]} labels={['Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov']} /></Card>
        <Card title="Feedback Sentiment"><div className="text-3xl font-extrabold text-ok">89%</div><div className="mb-2 text-xs text-ink-3">positive</div><Progress value={89} tone="ok" /><p className="mt-3 text-[13px]">Themes: practical examples · trainer expertise · session duration</p></Card>
      </div>
      <p className="mt-4 text-xs text-ink-3">Filters available in production: Division, Department, Branch, Grade, Gender, Training Category, Date Range. Power BI reads the same reporting schema. <SimTag /></p>
    </div>
  );
}

export function Integrations() {
  return (
    <div>
      <PageHeader title="Integration Health" sub="Adapters behind stable internal interfaces; every call logged with correlation ID" />
      <div className="mb-4"><SimTag>Demo integration · simulated connected state — no live City Bank system is connected</SimTag></div>
      <Card pad={false}><Table head={['System', 'Purpose', 'Interface', 'Direction', 'Status', 'Last activity']}>
        {INTEGRATIONS.map((i) => <tr key={i.name}><Td><b>{i.name}</b></Td><Td>{i.desc}</Td><Td className="text-xs text-ink-3">{i.iface}</Td><Td>{i.dir}</Td><Td><Badge t="ok">Connected</Badge></Td><Td className="text-xs text-ink-3">{i.sync}</Td></tr>)}
      </Table></Card>
      <p className="mt-3 text-xs text-ink-3">Core banking, RTGS, EFT and cheque clearing are outside LMS integration scope.</p>
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
        {rows.map((a) => <tr key={a.id}><Td className="whitespace-nowrap text-xs">{a.at}</Td><Td><b>{a.actor}</b><div className="text-[11px] text-ink-3">{a.actorRole}</div></Td><Td className="font-semibold">{a.action}</Td><Td>{a.detail}{a.previous ? <div className="text-[11px] text-ink-3">Previous: {a.previous} → New: {a.next}</div> : null}</Td><Td>{a.approvedBy ? <span className="text-xs font-semibold text-ok">{a.approvedBy}</span> : '—'}</Td></tr>)}
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
      <p className="mt-3 flex items-center gap-1.5 text-xs text-ink-3"><ShieldCheck size={13} /> Internal-only administration · on-premise deployment at City Bank DC with warm DR at DRS.</p></div>
  );
}

export function Knowledge() {
  const [q, setQ] = useState('');
  const cats = ['Banking Foundation', 'AML & Compliance', 'Credit', 'Risk', 'Leadership', 'Customer Experience', 'Digital Banking', 'Sustainable Finance'];
  const docs = [['Credit_Risk_Case_Pack_v3.pdf', 'Credit', 'PDF · preview-only'], ['AML Red Flags Video', 'AML & Compliance', 'Video · watermark'], ['Leadership Essentials Deck', 'Leadership', 'PPTX · download'], ['Basel III Quick Guide', 'Risk', 'PDF · preview-only'], ['Customer Journey Playbook', 'Customer Experience', 'Word'], ['Green Finance Policy', 'Sustainable Finance', 'PDF']];
  return (
    <div><PageHeader title="Knowledge Corner" sub="Folders, policies, videos and documents with permission control" />
      <div className="mb-4 flex items-center gap-2 rounded-lg border border-line bg-white px-3 py-2"><Search size={15} className="text-ink-3" /><input aria-label="Search knowledge" value={q} onChange={(e) => setQ(e.target.value)} className="flex-1 text-[13px] outline-none" placeholder="Search resources, tags, folders" /></div>
      <div className="mb-5 grid grid-cols-2 gap-3 md:grid-cols-4">{cats.map((c) => <button key={c} onClick={() => setQ(c)} className="card flex items-center gap-2.5 p-3 text-left text-[13px] font-semibold hover:shadow-md"><Folder size={16} className="text-brand" />{c}</button>)}</div>
      <Card pad={false}><Table head={['Resource', 'Folder', 'Protection', '']}>
        {docs.filter((d) => (d[0] + d[1]).toLowerCase().includes(q.toLowerCase())).map(([a, b, c]) => <tr key={a}><Td><span className="flex items-center gap-2 font-semibold"><BookOpen size={14} className="text-ink-3" />{a}</span></Td><Td>{b}</Td><Td><Badge t="neutral">{c}</Badge></Td><Td><Btn size="sm" v="secondary">Open</Btn></Td></tr>)}
      </Table></Card></div>
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

export function Tna() {
  return (
    <div><PageHeader title="Training Needs Assessment" sub="Divisional, programme-wise and individual development plans" />
      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Divisional TNA"><BarChart data={[{ label: 'Corporate Banking', value: 12 }, { label: 'SME Banking', value: 9 }, { label: 'Risk Management', value: 6 }, { label: 'Operations', value: 14 }]} unit=" needs" color="bg-ink" /></Card>
        <Card title="Skill-gap summary" action={<AiLabel>AI-assisted</AiLabel>}><ul className="space-y-2 text-[13px]">{['Credit Analysis · 38% below target', 'Digital Banking · 29% below target', 'Leadership · 24% below target'].map((x) => <li key={x} className="flex items-center justify-between rounded-lg border border-line p-2.5">{x}<Badge t="warn">Review</Badge></li>)}</ul></Card>
        <Card title="Survey-driven need collection"><p className="text-[13px]">Programme-wise TNA survey: 412 / 520 responses (79%). Closes 20 Nov 2026.</p><div className="mt-3"><Progress value={79} /></div></Card>
        <Card title="Individual Development Plans"><p className="text-[13px]">1,284 IDPs active · 86 awaiting supervisor review.</p></Card>
      </div></div>
  );
}

export function Mobile() {
  const s = useDemo();
  const [scr, setScr] = useState(0);
  const screens = ['Home', 'My Learning', 'Course Player', 'Invitation', 'Certificate'];
  return (
    <div>
      <PageHeader title="Mobile Preview" sub="Flutter Android / iOS · offline course playback, low-bandwidth mode, push notifications" />
      <div className="mb-4 flex flex-wrap gap-1.5">{screens.map((x, i) => <button key={x} onClick={() => setScr(i)} className={cx('rounded-lg border px-3 py-1.5 text-xs font-semibold', scr === i ? 'border-brand bg-brand-soft text-brand-dark' : 'border-line bg-white')}>{x}</button>)}</div>
      <div className="mx-auto w-[300px] rounded-[36px] border-[10px] border-ink bg-canvas p-3 shadow-2xl" style={{ minHeight: 560 }}>
        <div className="mb-3 flex items-center justify-between px-1 text-[11px] font-bold"><span>09:41</span><span>City Bank ELDP</span></div>
        {scr === 0 && <div className="space-y-3"><div className="text-base font-extrabold">Good morning, Ayesha</div><div className="card p-3"><div className="th">Mandatory</div><div className="text-[13px] font-bold">Information Security</div><Progress value={s.courseProgress} /></div><div className="card p-3"><div className="th">Upcoming</div><div className="text-[13px] font-bold">Advanced Credit Risk Management</div><div className="text-xs text-ink-3">18–19 Nov · Learning Center</div></div></div>}
        {scr === 1 && <div className="space-y-2">{['Information Security · 65%', 'Credit Fundamentals · Done', 'AML Certification · Exam 30 Nov'].map((x) => <div key={x} className="card p-3 text-[13px] font-semibold">{x}</div>)}</div>}
        {scr === 2 && <div><div className="mb-2 grid aspect-video place-items-center rounded-lg bg-ink text-white"><span className="text-xs">▶ Module 2 · 720p auto</span></div><div className="card p-3 text-xs"><b>Offline available</b> · Subtitles: English / বাংলা</div></div>}
        {scr === 3 && <div className="card space-y-2 p-3"><div className="th">Invitation</div><div className="text-[14px] font-bold">Advanced Credit Risk Management</div><div className="text-xs text-ink-3">18–19 Nov 2026 · City Bank Learning Center</div><Btn className="w-full">Accept</Btn><Btn v="secondary" className="w-full">Request Withdrawal</Btn></div>}
        {scr === 4 && <div className="card p-4 text-center"><img src="/brand/citybank-logo.png" alt="City Bank" className="mx-auto mb-2 h-12 w-auto" /><div className="text-[13px] font-extrabold">Certificate of Completion</div><div className="my-2 text-sm font-bold text-brand">Ayesha Rahman</div><div className="text-xs">Information Security Awareness 2026</div></div>}
      </div>
    </div>
  );
}
