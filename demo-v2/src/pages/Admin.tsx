import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { MASTERS } from '../data';
import { findByEid, TRAINERS, VENDORS, VENUES } from '../org';
import { PageHead } from '../components/Templates';
import { FrRef, SourceTag } from '../components/Source';
import { downloadCsv } from '../components/DataTable';
import { useDemo } from '../store';
import { ROLE_LABEL } from '../lifecycle';
import type { Role } from '../types';
import { Alert, Badge, Btn, cx, Field, inputCls, Modal, Table, Tabs, Td } from '../components/ui';
import { Fr, PageTitle } from './Roles';

/* ---------------- Setup Options (FR 22–48) · partially demonstrated ---------------- */
const SETUP_TABS = ['Competency', 'Tags / Labels', 'Category', 'Mode of Training', 'Training Medium', 'Training Title', 'Venue', 'Trainer', 'Vendor', 'Training Calendar', 'Feedback Setup', 'External Trainee'];
const SETUP_FR: Record<string, string> = { Competency: 'FR 22', 'Tags / Labels': 'FR 23–24', Category: 'FR 25', 'Mode of Training': 'FR 27', 'Training Medium': 'FR 26', 'Training Title': 'FR 28–30', Venue: 'FR 31–34', Trainer: 'FR 35–37', Vendor: 'FR 38–42', 'Training Calendar': 'FR 43–44', 'Feedback Setup': 'FR 45–46', 'External Trainee': 'FR 47–48' };
const SEED_LISTS: Record<string, string[]> = {
  Competency: MASTERS.competencies, 'Tags / Labels': MASTERS.tags, Category: MASTERS.categories, 'Mode of Training': MASTERS.modes, 'Training Medium': MASTERS.mediums,
  'Training Title': ['Advanced Credit Risk Management', 'AML & CFT Refresher', 'Information Security Awareness', 'Customer Experience Excellence', 'Leadership Essentials for Managers', 'Sustainable Finance Fundamentals'],
  Venue: VENUES.map((v) => v.name), Vendor: VENDORS,
};

function ListSetup({ tab }: { tab: string }) {
  const s = useDemo();
  const [items, setItems] = useState<{ name: string; archived: boolean }[]>(() => (SEED_LISTS[tab] ?? []).map((name) => ({ name, archived: false })));
  const [v, setV] = useState('');
  const term = v.trim().toLowerCase();
  const hit = term.length > 2 ? items.find((x) => x.name.toLowerCase().includes(term)) : undefined;
  const exact = items.some((x) => x.name.toLowerCase() === term);
  const add = () => {
    setItems([...items, { name: v.trim() }].map((x) => ({ archived: false, ...x })));
    s.logEvent('hr', 'Setup entry added', `${tab}: ${v.trim()} (${SETUP_FR[tab]})`);
    setV('');
  };
  const toggle = (name: string) => {
    setItems(items.map((x) => (x.name === name ? { ...x, archived: !x.archived } : x)));
    s.logEvent('hr', 'Setup entry updated', `${tab}: ${name}`);
  };
  return (
    <div className="space-y-5">
      <div className="max-w-2xl">
        <Field label={`Search before adding (${SETUP_FR[tab]})`} hint={term.length > 2 ? (exact ? <span className="font-semibold text-brand">This entry already exists. A duplicate cannot be added.</span> : hit ? <span className="font-semibold text-warn">Similar entry exists: “{hit.name}”. Check before adding.</span> : <span className="font-semibold text-ok">No duplicate found · entry allowed</span>) : <span className="text-ink-3">Type at least 3 letters to search.</span>}>
          <div className="flex gap-2"><input className={inputCls} value={v} onChange={(e) => setV(e.target.value)} placeholder={`New ${tab.toLowerCase()} entry`} /><Btn disabled={!v.trim() || exact} onClick={add}>Add</Btn></div>
        </Field>
      </div>
      <ul className="flex flex-wrap gap-2">
        {items.map((x) => (
          <li key={x.name} className={cx('flex items-center gap-2 rounded-lg border px-3 py-1.5 text-[15px] font-semibold', x.archived ? 'border-dashed border-line text-ink-3 line-through' : 'border-line bg-white')}>
            {x.name}<button onClick={() => toggle(x.name)} className="text-[14px] font-medium text-brand hover:underline">{x.archived ? 'Restore' : 'Archive'}</button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function SetupMasters() {
  const s = useDemo();
  const [tab, setTab] = useState(SETUP_TABS[0]);
  const [trainers, setTrainers] = useState(TRAINERS.map((t) => ({ ...t })));
  const [tModal, setTModal] = useState(false);
  const [tForm, setTForm] = useState({ type: 'Internal', eid: '', name: '', designation: '', institute: 'City Bank' });
  const [questions, setQuestions] = useState([['Content was relevant to my role', 'MCQ'], ['Trainer explained concepts clearly', 'Tick-box'], ['Venue and logistics', 'MCQ'], ['What should we improve?', 'Text box']]);
  const [q, setQ] = useState(''), [qt, setQt] = useState('MCQ');
  const [externals, setExternals] = useState([['City Brokerage Ltd.', 'CBR-0211', 'Shams Arefin', 'Analyst', '01912-000000']]);
  const [calUploaded, setCalUploaded] = useState(false);
  const lookup = () => { const p = findByEid(tForm.eid); if (p) setTForm({ ...tForm, name: p.name, designation: p.designation, institute: 'City Bank' }); };
  const uploadCsv = (file: File | undefined, apply: (rows: string[][]) => void) => {
    if (!file) return;
    file.text().then((t) => apply(t.split(/\r?\n/).slice(1).filter(Boolean).map((l) => l.split(',').map((c) => c.replace(/^"|"$/g, '').trim()))));
  };
  return (
    <div>
      <PageHead title="Setup Options" fr="FR 22–48" meta="Master lists reused by the request, nomination, scheduling and bond screens" tags={<><SourceTag kind="concept">Partially demonstrated: changes stay on this screen in the demo</SourceTag><SourceTag kind="fictional" /></>} />
      <div className="overflow-hidden rounded-2xl border border-line bg-white">
        <Tabs tabs={SETUP_TABS} value={tab} onChange={setTab} />
        <div className="p-6">
          <div className="mb-4"><FrRef>{SETUP_FR[tab]}</FrRef></div>
          {SEED_LISTS[tab] && <ListSetup key={tab} tab={tab} />}
          {tab === 'Trainer' && (
            <div>
              <div className="mb-3 flex flex-wrap items-center gap-2"><span className="text-[15px] text-ink-2">Internal trainers pull their details from the Employee Database by Employee ID.</span><span className="flex-1" />
                <Btn v="secondary" onClick={() => downloadCsv('trainer-bulk-template.csv', ['Type', 'Employee ID', 'Name', 'Designation', 'Institute', 'Contact No.', 'Email', 'LinkedIn Profile Link'], [])}>Bulk upload template</Btn>
                <label className="inline-flex min-h-11 cursor-pointer items-center rounded-lg border border-line bg-white px-4 text-[15px] font-semibold hover:border-ink/30">Bulk upload<input type="file" accept=".csv" className="hidden" onChange={(e) => uploadCsv(e.target.files?.[0], (rows) => { setTrainers([...trainers, ...rows.map((r, i) => ({ id: `u${i}`, type: (r[0] === 'External' ? 'External' : 'Internal') as 'Internal' | 'External', eid: r[1] ?? '', name: r[2] ?? '', designation: r[3] ?? '', institute: r[4] ?? '' }))]); s.logEvent('hr', 'Trainers bulk uploaded', `${rows.length} rows (FR 37)`); })} /></label>
                <Btn onClick={() => setTModal(true)}>Add trainer</Btn></div>
              <Table head={['Type', 'Employee ID', 'Name', 'Designation', 'Institute']}>{trainers.map((t) => <tr key={t.id + t.name}><Td><Badge t={t.type === 'Internal' ? 'info' : 'neutral'}>{t.type}</Badge></Td><Td>{t.eid || '—'}</Td><Td className="font-semibold">{t.name}</Td><Td>{t.designation}</Td><Td>{t.institute}</Td></tr>)}</Table>
              <Modal open={tModal} onClose={() => setTModal(false)} title="Add trainer" footer={<><Btn v="secondary" onClick={() => setTModal(false)}>Cancel</Btn><Btn disabled={!tForm.name.trim()} onClick={() => { setTrainers([...trainers, { id: `n${trainers.length}`, type: tForm.type as 'Internal' | 'External', eid: tForm.eid, name: tForm.name, designation: tForm.designation, institute: tForm.institute }]); s.logEvent('hr', 'Trainer added', `${tForm.name} (${tForm.type}) · FR 35–36`); setTModal(false); }}>Add trainer</Btn></>}>
                <div className="grid gap-3">
                  <Field label="Type"><select className={inputCls} value={tForm.type} onChange={(e) => setTForm({ ...tForm, type: e.target.value })}><option>Internal</option><option>External</option></select></Field>
                  {tForm.type === 'Internal' && <Field label="Employee ID" hint="Press Look up to pull details from the Employee Database (simulated)"><div className="flex gap-2"><input className={inputCls} value={tForm.eid} onChange={(e) => setTForm({ ...tForm, eid: e.target.value })} placeholder="e.g. CBL-10482" /><Btn v="secondary" onClick={lookup}>Look up</Btn></div></Field>}
                  <Field label="Name"><input className={inputCls} value={tForm.name} onChange={(e) => setTForm({ ...tForm, name: e.target.value })} /></Field>
                  <Field label="Designation"><input className={inputCls} value={tForm.designation} onChange={(e) => setTForm({ ...tForm, designation: e.target.value })} /></Field>
                  <Field label="Institute"><input className={inputCls} value={tForm.institute} onChange={(e) => setTForm({ ...tForm, institute: e.target.value })} /></Field>
                </div>
              </Modal>
            </div>
          )}
          {tab === 'Training Calendar' && (
            <div className="space-y-4">
              <p className="text-[16px] text-ink-2">The Admin uploads the approved yearly calendar. Scheduled trainings then accumulate here automatically (FR 43–44).</p>
              <div className="flex flex-wrap gap-2">
                <label className="inline-flex min-h-11 cursor-pointer items-center rounded-lg bg-brand px-4 text-[15px] font-bold text-white hover:bg-brand-dark">Upload approved calendar 2026<input type="file" className="hidden" onChange={() => { setCalUploaded(true); s.logEvent('admin', 'Training calendar uploaded', 'Approved calendar 2026 (simulated)'); }} /></label>
                <Btn v="secondary" onClick={() => switchToCalendar()}>Open the training calendar</Btn>
              </div>
              {calUploaded && <Alert kind="ok" title="Approved calendar 2026 uploaded (simulated)" />}
            </div>
          )}
          {tab === 'Feedback Setup' && (
            <div className="max-w-2xl space-y-3">
              {questions.map(([text, type]) => <div key={text} className="flex items-center justify-between rounded-lg border border-line px-4 py-3 text-[16px]"><span>{text}</span><Badge t="neutral">{type}</Badge></div>)}
              <div className="flex flex-wrap gap-2 pt-2"><input className={cx(inputCls, 'flex-1')} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Add New Question" aria-label="Add New Question" /><select className={cx(inputCls, 'w-40')} value={qt} onChange={(e) => setQt(e.target.value)}><option>MCQ</option><option>Text box</option><option>Tick-box</option></select><Btn disabled={!q.trim()} onClick={() => { setQuestions([...questions, [q.trim(), qt]]); s.logEvent('hr', 'Feedback question added', `${q.trim()} · ${qt} (FR 45–46)`); setQ(''); }}>Add New Question</Btn></div>
            </div>
          )}
          {tab === 'External Trainee' && (
            <div>
              <div className="mb-3 flex flex-wrap gap-2"><span className="flex-1" />
                <Btn v="secondary" onClick={() => downloadCsv('external-trainee-template.csv', ['Company Name', 'Company Employee ID', 'Name', 'Designation / Role', 'Contact No.'], [])}>Bulk upload template</Btn>
                <label className="inline-flex min-h-11 cursor-pointer items-center rounded-lg border border-line bg-white px-4 text-[15px] font-semibold hover:border-ink/30">Bulk upload<input type="file" accept=".csv" className="hidden" onChange={(e) => uploadCsv(e.target.files?.[0], (rows) => { setExternals([...externals, ...rows]); s.logEvent('hr', 'External trainees uploaded', `${rows.length} rows (FR 48)`); })} /></label>
              </div>
              <Table head={['Company Name', 'Company Employee ID', 'Name', 'Designation / Role', 'Contact No.']}>{externals.map((r) => <tr key={r.join('|')}>{r.map((c, i) => <Td key={i}>{c}</Td>)}</tr>)}</Table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
const switchToCalendar = () => { window.location.hash = '#/hr/calendar'; };

/* ---------------- Reports ---------------- */
/* ---------------- Connected Bank ---------------- */
interface Dept { name: string; gives: string; gets: string; systems: string; role?: Role; to?: string; fr: string }
const DEPTS: Dept[] = [
  { name: 'Business Divisions', gives: 'Training needs, requests, nominations', gets: 'Division dashboards, team records', systems: 'ELDP role: Division Head / Learning Champion', role: 'division_head', to: '/r/division_head', fr: 'FR 13–15, 88' },
  { name: 'Human Resources (L&D)', gives: 'Scheduling, invitations, attendance, bonds', gets: 'One training database, reports', systems: 'HRIS · employee master, grades, reporting lines', role: 'hr', to: '/r/hr', fr: 'FR 20–21, 244' },
  { name: 'Finance & Accounts', gives: 'Budget approval (checker)', gets: 'Investment, cost per employee', systems: 'Approval no., payment no., actual expense', role: 'finance', to: '/finance', fr: 'FR 135, 142' },
  { name: 'IT Division', gives: 'SSO, security, integrations', gets: 'Audit and security events', systems: 'IAM / AD, SIEM, IBM MQ / OSB', role: 'admin', to: '/r/admin', fr: 'FR 246–249' },
  { name: 'Administration / Facilities', gives: 'Venue availability', gets: 'Room bookings', systems: 'Meeting-room booking system', fr: 'FR 71, 99, 244' },
  { name: 'Compliance & AMLD', gives: 'Mandatory courses and deadlines', gets: 'Compliance status, risk alerts', systems: 'Mandatory rules, AI risk flags', role: 'employee', to: '/learning/course', fr: 'FR 190, 209' },
  { name: 'Internal Control & Audit', gives: 'Audit policy', gets: 'Append-only audit trail', systems: 'Audit log, maker-checker evidence', role: 'admin', to: '/admin/audit', fr: 'TR' },
  { name: 'Branches & Employees', gives: 'Attendance, feedback, records', gets: 'Learning, exams, certificates', systems: 'Leave portal, attendance system, Teams / Zoom, mobile app', role: 'employee', to: '/employee', fr: 'FR 1–7, 143, 246' },
];
export function ConnectedBank() {
  const nav = useNavigate();
  const s = useDemo();
  const card = (d: Dept) => (
    <button key={d.name} onClick={() => { if (d.role) s.setRole(d.role); if (d.to) nav(d.to); }} className="group h-full rounded-2xl border border-line bg-white p-5 text-left transition-colors hover:border-ink/30">
      <div className="flex items-start justify-between gap-2"><h3 className="text-[16.5px] font-extrabold">{d.name}</h3><Fr>{d.fr}</Fr></div>
      <div className="mt-3 space-y-2 text-[14px]"><div><span className="th">Gives ELDP</span><div>{d.gives}</div></div><div><span className="th">Gets from ELDP</span><div>{d.gets}</div></div><div className="text-ink-3">{d.systems}</div></div>
      {d.role && <div className="mt-3 flex items-center gap-1 text-[14px] font-bold text-brand">Open as {ROLE_LABEL[d.role]} <ArrowRight size={12} /></div>}
    </button>
  );
  return (
    <div>
      <PageTitle eyebrow="Connected Bank" fr="FR 244" title="One platform, every department" sub="What each department gives the ELDP and what it gets back. Integrations are simulated in this demo; production uses adapters behind stable interfaces." />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">{DEPTS.slice(0, 4).map(card)}</div>
      <div className="relative my-6 overflow-hidden rounded-2xl bg-graphite px-8 py-6 text-white">
        <div className="pointer-events-none absolute inset-0 opacity-60" style={{ background: 'radial-gradient(600px 160px at 50% 0%, rgba(215,25,32,.35), transparent 70%)' }} />
        <div className="relative flex flex-wrap items-center justify-between gap-6">
          <div><div className="eyebrow text-[14px] text-red-300">City Bank ELDP</div><div className="mt-1 text-[22px] font-extrabold tracking-tight">One training record · one identity · one audit trail</div></div>
          <div className="flex flex-wrap gap-2">{['HRIS', 'Leave portal', 'Attendance system', 'Meeting room', 'Performance modules', 'Customer service portal', 'Teams / Zoom', 'Outlook', 'SMS', 'WhatsApp', 'Power BI', 'SIEM'].map((x) => <span key={x} className="rounded-lg border border-white/12 bg-white/5 px-2.5 py-1 text-[14px] font-semibold">{x}</span>)}</div>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">{DEPTS.slice(4).map(card)}</div>
    </div>
  );
}

/* ---------------- Requirements coverage ---------------- */
