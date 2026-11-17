/**
 * System administration (FR 21, 244; maker-checker, audit and system settings are proposed, FR 248–249):
 * roles & permissions matrix, users & accounts, maker-checker queue and audit log, bank integrations, system settings.
 * Changes to roles and permissions go to the maker-checker queue; a maker cannot approve their own change.
 */
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { CheckCircle2, Download, KeyRound, Pencil, Plug, RefreshCw, Search, ShieldCheck, Upload, UserPlus, Users, XCircle } from 'lucide-react';
import { PERSONAS } from '../../data';
import { useDemo, type AdminSettings } from '../../store';
import { ADMIN_MODULES, ADMIN_ROLES, INTEGRATIONS_16, ROLE_ACCOUNTS, type UserRow } from '../../seed/bank';
import { downloadCsv } from '../../components/DataTable';
import { Panel, StatCard } from '../../components/Dash';
import { Badge, cx, Modal } from '../../components/ui';
import { SourceTag } from '../../components/Source';

type Tab = 'roles' | 'users' | 'maker-checker' | 'integrations' | 'settings';
const TABS: [Tab, string][] = [['roles', '1. Roles & permissions'], ['users', '2. Users & accounts'], ['maker-checker', '3. Maker-checker & audit log'], ['integrations', '4. Bank integrations (SSO / SIEM)'], ['settings', '5. System settings']];
const input = 'min-h-11 rounded-lg border border-line bg-white px-3 text-[15px] outline-none focus:border-brand';
const Toggle = ({ on, onClick, label }: { on: boolean; onClick: () => void; label: string }) => (
  <button role="switch" aria-checked={on} aria-label={label} onClick={onClick} className={cx('h-7 w-12 shrink-0 rounded-full p-0.5 transition-colors', on ? 'bg-brand' : 'bg-line')}><span className={cx('block h-6 w-6 rounded-full bg-white shadow transition-transform', on && 'translate-x-5')} /></button>
);

/** Banner + KPIs, shared with the System Admin home. */
export function AdminOverview() {
  const s = useDemo();
  const nav = useNavigate();
  const pending = s.admin.mc.filter((m) => m.status === 'Pending');
  const online = INTEGRATIONS_16.filter((i) => i.status === 'Online').length;
  return (
    <div className="space-y-5">
      {pending.length > 0 && (
        <div className="flex flex-wrap items-center gap-4 rounded-2xl bg-brand-soft/60 px-5 py-4 ring-1 ring-brand/30">
          <span className="grid h-11 w-11 place-items-center rounded-xl bg-brand text-white"><ShieldCheck size={22} /></span>
          <span className="min-w-0 flex-1"><span className="flex flex-wrap items-center gap-2 text-[17px] font-semibold">Maker-checker approvals waiting <span className="rounded-full bg-brand px-2.5 py-0.5 text-[13px] text-white">{pending.length} pending</span></span><span className="text-[15px] text-ink-2">Sensitive changes need an independent checker. Latest: <b>{pending[0].type}</b> by {pending[0].maker}.</span></span>
          <button onClick={() => nav('/admin/maker-checker')} className="min-h-11 rounded-lg bg-brand px-4 font-medium text-white">Review queue</button>
        </div>
      )}
      <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <li><StatCard label="Active user accounts" value={s.admin.users.filter((u) => u.status === 'Active').length} icon={Users} sub={`${ADMIN_ROLES.length} City Bank RBAC roles`} onClick={() => nav('/admin/users')} /></li>
        <li><StatCard label="Role profiles" value={ADMIN_ROLES.length} icon={KeyRound} tone="ink" sub="Policy-enforced RBAC matrix" onClick={() => nav('/admin/roles')} /></li>
        <li><StatCard label="Maker-checker queue" value={pending.length} icon={ShieldCheck} tone="amber" sub={`${s.audit.length} audit events logged`} onClick={() => nav('/admin/maker-checker')} /></li>
        <li><StatCard label="Bank integrations" value={`${online} / ${INTEGRATIONS_16.length}`} icon={Plug} tone="ok" sub="HRIS, leave, Teams, SSO, SIEM" onClick={() => nav('/admin/integrations')} /></li>
      </ul>
    </div>
  );
}

export function Administration() {
  const { tab: raw } = useParams();
  const nav = useNavigate();
  const tab: Tab = TABS.some(([k]) => k === raw) ? (raw as Tab) : 'roles';
  return (
    <div className="mx-auto max-w-[1440px]">
      <header className="mb-5 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-3"><h1 className="text-[34px] font-semibold tracking-tight">System administration</h1><span className="rounded-full bg-canvas px-3 py-0.5 text-[14px] ring-1 ring-line">Admin only</span></div>
          <p className="mt-1 flex flex-wrap items-center gap-2 text-[16px] text-ink-2">Users, role permissions, security governance, bank integrations and system settings (FR 21, 244). <SourceTag kind="fictional" /><SourceTag kind="proposed">Maker-checker and settings proposed · FR 248–249</SourceTag></p>
        </div>
        <div className="flex gap-2"><button onClick={() => nav('/hr/setup')} className="min-h-11 rounded-lg border border-line px-4 text-[15px]">Global master setup →</button><button onClick={() => nav('/admin/users')} className="flex min-h-11 items-center gap-2 rounded-lg bg-brand px-4 text-[15px] font-medium text-white"><Users size={16} />Manage users &amp; accounts</button></div>
      </header>
      <AdminOverview />
      <div role="tablist" className="mt-6 flex flex-wrap gap-1 rounded-xl bg-white p-1 ring-1 ring-line">{TABS.map(([k, l]) => <button key={k} role="tab" aria-selected={tab === k} onClick={() => nav(`/admin/${k}`)} className={cx('rounded-lg px-4 py-2 text-[15px]', tab === k ? 'bg-brand-soft font-semibold text-brand' : 'text-ink-2 hover:text-ink')}>{l}</button>)}</div>
      <div className="mt-6">
        {tab === 'roles' && <Roles />}
        {tab === 'users' && <UsersTab />}
        {tab === 'maker-checker' && <MakerChecker />}
        {tab === 'integrations' && <IntegrationsTab />}
        {tab === 'settings' && <Settings />}
      </div>
    </div>
  );
}

function Roles() {
  const s = useDemo();
  const pendingFor = (role: string, i: number) => s.admin.mc.some((m) => m.status === 'Pending' && m.apply?.kind === 'perm' && m.apply.role === role && m.apply.index === i);
  return (
    <Panel title="Role-based access and module permissions" sub="Each City Bank role sees only what applies to its job. A change becomes a request for a second administrator (FR 21)" action={<a href="#/admin/users" className="rounded-lg border border-line px-3 py-2 text-[15px]">Manage user directory &amp; role assignment →</a>}>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1100px] text-left text-[15px]">
          <thead className="text-[13px] uppercase tracking-wide text-ink-3"><tr><th className="py-2 pr-4 font-semibold">Role</th><th className="py-2 pr-4 font-semibold">Accounts</th>{ADMIN_MODULES.map((m) => <th key={m} className="py-2 pr-4 text-center font-semibold">{m}</th>)}</tr></thead>
          <tbody className="divide-y divide-line">
            {ADMIN_ROLES.map((r) => (
              <tr key={r}>
                <td className="py-3 pr-4"><span className="rounded-md bg-canvas px-2 py-0.5 font-medium ring-1 ring-line">{r}</span></td>
                <td className="py-3 pr-4 tabular-nums">{s.admin.users.filter((u) => u.role === r).length || ROLE_ACCOUNTS[r]}</td>
                {ADMIN_MODULES.map((m, i) => <td key={m} className="py-3 pr-4 text-center"><span className="inline-flex flex-col items-center gap-1"><Toggle on={s.admin.perms[r][i]} label={`${r}: ${m}`} onClick={() => !pendingFor(r, i) && s.proposePermission(r, i, m)} />{pendingFor(r, i) && <span className="text-[11px] font-medium text-amber-700">Pending checker</span>}</span></td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-[14px] text-ink-3">Field-level and record-level rules (for example, salary-grade fields hidden from trainers) apply on top of this matrix.</p>
    </Panel>
  );
}

function UsersTab() {
  const s = useDemo();
  const [q, setQ] = useState('');
  const [div, setDiv] = useState('All divisions');
  const [role, setRole] = useState('All roles');
  const [st, setSt] = useState('All status');
  const [edit, setEdit] = useState<UserRow | null>(null);
  const [newRole, setNewRole] = useState<UserRow['role']>('Employee');
  const users = s.admin.users;
  const rows = users.filter((u) => `${u.name} ${u.eid} ${u.email}`.toLowerCase().includes(q.toLowerCase()) && (div === 'All divisions' || u.division === div) && (role === 'All roles' || u.role === role) && (st === 'All status' || u.status === st));
  return (
    <div className="space-y-5">
      <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <li><StatCard label="Total directory users" value={users.length} icon={Users} sub="Synced with the HRIS master" /></li>
        <li><StatCard label="Active accounts" value={users.filter((u) => u.status === 'Active').length} icon={CheckCircle2} tone="ok" sub={`${users.filter((u) => u.status !== 'Active').length} inactive or locked`} /></li>
        <li><StatCard label="Privileged admins" value={users.filter((u) => u.role === 'System Admin' || u.role === 'HR Admin').length} icon={ShieldCheck} tone="amber" sub="System Admin and HR Admin (dual control)" /></li>
        <li><StatCard label="External accounts" value={2} icon={UserPlus} tone="ink" sub="External trainee and faculty" /></li>
      </ul>
      <Panel title="User & RBAC management" sub="City Bank employee accounts, role assignments, HRIS sync and bulk provisioning"
        action={<div className="flex flex-wrap gap-2"><button onClick={() => downloadCsv('users.csv', ['EID', 'Name', 'Email', 'Designation', 'Grade', 'Division', 'Branch', 'Role', 'Status'], rows.map((u) => [u.eid, u.name, u.email, u.designation, u.grade, u.division, u.branch, u.role, u.status]))} className="flex min-h-10 items-center gap-2 rounded-lg border border-line px-3 text-[15px]"><Download size={16} />Export Excel</button><button onClick={() => useDemo.setState({ toast: 'Bulk import validated 45 rows; sent to the maker-checker queue (simulated)' })} className="flex min-h-10 items-center gap-2 rounded-lg border border-line px-3 text-[15px]"><Upload size={16} />Bulk import CSV / Excel</button><button onClick={() => useDemo.setState({ toast: 'New users are created from the HRIS sync; manual accounts are for external trainees (simulated)' })} className="flex min-h-10 items-center gap-2 rounded-lg bg-brand px-4 text-[15px] font-medium text-white"><UserPlus size={16} />Add user</button></div>}>
        <div className="mb-4 flex flex-wrap gap-3">
          <label className="relative min-w-[240px] flex-1"><Search size={17} className="absolute left-3 top-3 text-ink-3" /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, EID or email" className={cx(input, 'w-full pl-9')} /></label>
          <select value={div} onChange={(e) => setDiv(e.target.value)} className={input} aria-label="Division">{['All divisions', ...new Set(users.map((u) => u.division))].map((x) => <option key={x}>{x}</option>)}</select>
          <select value={role} onChange={(e) => setRole(e.target.value)} className={input} aria-label="Role">{['All roles', ...ADMIN_ROLES].map((x) => <option key={x}>{x}</option>)}</select>
          <select value={st} onChange={(e) => setSt(e.target.value)} className={input} aria-label="Status">{['All status', 'Active', 'Inactive', 'Locked'].map((x) => <option key={x}>{x}</option>)}</select>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1080px] text-left text-[15px]">
            <thead className="text-[13px] uppercase tracking-wide text-ink-3"><tr>{['Employee ID', 'Employee', 'Designation & grade', 'Division / branch', 'Role', 'Status', 'Actions'].map((h) => <th key={h} className="py-2 pr-4 font-semibold">{h}</th>)}</tr></thead>
            <tbody className="divide-y divide-line">
              {rows.map((u) => (
                <tr key={u.eid}>
                  <td className="py-3 pr-4"><span className="rounded bg-canvas px-1.5 py-0.5 font-mono text-[13px] ring-1 ring-line">{u.eid}</span></td>
                  <td className="py-3 pr-4"><span className="block font-medium">{u.name}</span><span className="text-[13px] text-ink-3">{u.email}</span></td>
                  <td className="py-3 pr-4"><span className="block">{u.designation}</span><span className="text-[13px] text-ink-3">Grade: {u.grade}</span></td>
                  <td className="py-3 pr-4"><span className="block">{u.division}</span><span className="text-[13px] text-ink-3">{u.branch}</span></td>
                  <td className="py-3 pr-4"><span className="rounded-md bg-sky-50 px-2 py-0.5 text-[13px] text-sky-800 ring-1 ring-sky-100">{u.role}</span></td>
                  <td className="py-3 pr-4"><Badge t={u.status === 'Active' ? 'ok' : u.status === 'Locked' ? 'brand' : 'neutral'}>{u.status}</Badge></td>
                  <td className="py-3 pr-4 whitespace-nowrap">
                    <button onClick={() => { setEdit(u); setNewRole(u.role); }} className="inline-flex items-center gap-1.5 rounded-lg border border-line px-2.5 py-1.5 text-[14px]"><Pencil size={14} />Role</button>
                    <button onClick={() => s.setUserStatus(u.eid, u.status === 'Active' ? 'Locked' : 'Active')} className="ml-2 rounded-lg px-2.5 py-1.5 text-[14px] text-brand hover:bg-brand-soft">{u.status === 'Active' ? 'Lock' : 'Unlock'}</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
      <Modal open={!!edit} onClose={() => setEdit(null)} title={`Change role · ${edit?.name ?? ''}`} footer={<><button onClick={() => setEdit(null)} className="min-h-11 rounded-lg border border-line px-4">Cancel</button><button disabled={!edit || newRole === edit.role} onClick={() => { if (edit) s.proposeRole(edit.eid, newRole); setEdit(null); }} className="min-h-11 rounded-lg bg-brand px-4 font-medium text-white disabled:opacity-40">Send for approval</button></>}>
        <label className="block text-[15px]">New role<select value={newRole} onChange={(e) => setNewRole(e.target.value as UserRow['role'])} className={cx(input, 'mt-1 w-full')}>{ADMIN_ROLES.map((r) => <option key={r}>{r}</option>)}</select></label>
        <p className="mt-3 text-[14px] text-ink-3">Role changes need a second administrator (maker-checker). The change applies when the checker approves.</p>
      </Modal>
    </div>
  );
}

function MakerChecker() {
  const s = useDemo();
  const me = PERSONAS.admin.name;
  const [q, setQ] = useState('');
  const [actor, setActor] = useState('All roles');
  const audit = s.audit.filter((a) => `${a.action} ${a.detail} ${a.actor}`.toLowerCase().includes(q.toLowerCase()) && (actor === 'All roles' || a.actorRole === actor));
  return (
    <div className="space-y-6">
      <Panel title="Maker-checker dual-control queue" sub="Independent checker review for sensitive role, permission, bond and migration actions · proposed (FR 248–249)">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] text-left text-[15px]">
            <thead className="text-[13px] uppercase tracking-wide text-ink-3"><tr>{['Action type', 'Maker', 'Summary', 'Status', 'Decision'].map((h) => <th key={h} className="py-2 pr-4 font-semibold">{h}</th>)}</tr></thead>
            <tbody className="divide-y divide-line">
              {s.admin.mc.map((m) => {
                const own = m.maker.startsWith(me);
                return (
                  <tr key={m.id}>
                    <td className="py-3 pr-4 font-medium">{m.type}</td>
                    <td className="py-3 pr-4 text-ink-2">{m.maker}</td>
                    <td className="max-w-[420px] py-3 pr-4">{m.summary}</td>
                    <td className="py-3 pr-4"><Badge t={m.status === 'Pending' ? 'warn' : m.status === 'Approved' ? 'ok' : 'brand'}>{m.status}</Badge></td>
                    <td className="py-3 whitespace-nowrap">
                      {m.status === 'Pending' ? (own
                        ? <span className="text-[14px] text-ink-3">You made this change; another admin must check it</span>
                        : <><button onClick={() => s.decideMc(m.id, 'Approved')} className="inline-flex items-center gap-1.5 rounded-lg border border-ok px-3 py-1.5 text-[14px] text-ok"><CheckCircle2 size={15} />Approve</button><button onClick={() => s.decideMc(m.id, 'Rejected')} className="ml-2 inline-flex items-center gap-1.5 rounded-lg border border-brand px-3 py-1.5 text-[14px] text-brand"><XCircle size={15} />Reject</button></>)
                        : <span className="text-[14px] text-ink-3">{m.checker}</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Panel>
      <Panel title={`Audit log (${s.audit.length})`} sub="Append-only; forwarded to the Bank SIEM (simulated)" action={<button onClick={() => downloadCsv('audit-log.csv', ['Time', 'Actor', 'Role', 'Action', 'Detail', 'Approved by'], audit.map((a) => [a.at, a.actor, a.actorRole, a.action, a.detail, a.approvedBy ?? '']))} className="flex min-h-10 items-center gap-2 rounded-lg border border-line px-3 text-[15px]"><Download size={16} />Export</button>}>
        <div className="mb-4 flex flex-wrap gap-3">
          <label className="relative min-w-[240px] flex-1"><Search size={17} className="absolute left-3 top-3 text-ink-3" /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search action, detail or person" className={cx(input, 'w-full pl-9')} /></label>
          <select value={actor} onChange={(e) => setActor(e.target.value)} className={input} aria-label="Actor role">{['All roles', ...new Set(s.audit.map((a) => a.actorRole))].map((x) => <option key={x}>{x}</option>)}</select>
        </div>
        {audit.length ? (
          <div className="max-h-[480px] overflow-y-auto">
            <table className="w-full text-left text-[15px]">
              <thead className="sticky top-0 bg-white text-[13px] uppercase tracking-wide text-ink-3"><tr>{['Time', 'Actor', 'Action', 'Detail', 'Approval'].map((h) => <th key={h} className="py-2 pr-4 font-semibold">{h}</th>)}</tr></thead>
              <tbody className="divide-y divide-line">{audit.map((a) => <tr key={a.id}><td className="py-2.5 pr-4 whitespace-nowrap tabular-nums text-ink-3">{a.at}</td><td className="py-2.5 pr-4"><span className="block">{a.actor}</span><span className="text-[13px] text-ink-3">{a.actorRole}</span></td><td className="py-2.5 pr-4 font-medium">{a.action}</td><td className="py-2.5 pr-4 text-ink-2">{a.detail}</td><td className="py-2.5 text-ink-3">{a.approvedBy ?? '—'}</td></tr>)}</tbody>
            </table>
          </div>
        ) : <p className="text-ink-2">No events yet. Actions anywhere in the demo appear here.</p>}
      </Panel>
    </div>
  );
}

function IntegrationsTab() {
  const s = useDemo();
  const tone = (st: string) => (st === 'Online' ? 'ok' : st === 'Degraded' ? 'warn' : 'brand');
  return (
    <Panel title={`Connected City Bank systems (${INTEGRATIONS_16.filter((i) => i.status === 'Online').length}/${INTEGRATIONS_16.length} online)`} sub="HRIS, leave, attendance, meeting rooms, Teams / Zoom, Outlook, SMS / WhatsApp, Power BI, IAM SSO and SIEM (FR 244) · simulated">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[960px] text-left text-[15px]">
          <thead className="text-[13px] uppercase tracking-wide text-ink-3"><tr>{['System', 'Category', 'Last sync & details', 'Status', ''].map((h) => <th key={h} className="py-2 pr-4 font-semibold">{h}</th>)}</tr></thead>
          <tbody className="divide-y divide-line">
            {INTEGRATIONS_16.map((i) => (
              <tr key={i.system}>
                <td className="py-3 pr-4 font-medium">{i.system}</td>
                <td className="py-3 pr-4 text-ink-2">{i.category}</td>
                <td className="py-3 pr-4 text-ink-2">{s.admin.synced[i.system] ?? i.lastSync} · {i.detail}</td>
                <td className="py-3 pr-4"><Badge t={tone(i.status)}>{i.status}</Badge></td>
                <td className="py-3 text-right"><button onClick={() => s.syncIntegration(i.system)} className="inline-flex items-center gap-1.5 rounded-lg border border-line px-3 py-1.5 text-[14px]"><RefreshCw size={14} />{i.status === 'Degraded' ? 'Retry' : 'Sync'}</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}

function Settings() {
  const s = useDemo();
  const [f, setF] = useState<AdminSettings>(s.admin.settings);
  const rows: [keyof AdminSettings, string, string][] = [
    ['ssoMfa', 'Enforce SSO + MFA for administrator and HR logins', 'Bank IAM OIDC with TOTP on intranet and internet portals'],
    ['makerChecker', 'Enforce maker-checker dual control', 'Second checker for role updates, bond settlements and legacy Excel commits'],
    ['smsWhatsapp', 'Enable SMS and WhatsApp alert channels', 'Nominations, exam reminders and overdue alerts alongside Outlook email'],
    ['concurrentSessions', 'Allow concurrent sessions', 'Off: one active session per user (newest wins)'],
  ];
  return (
    <Panel title="Platform configuration and policy defaults" sub="Security policies, bilingual defaults and service parameters · proposed (FR 248–249, FR 193)" action={<button onClick={() => s.saveSettings(f)} className="min-h-10 rounded-lg bg-brand px-4 text-[15px] font-medium text-white">Save system settings</button>}>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="text-[15px]">Portal display title<input value={f.portalTitle} onChange={(e) => setF({ ...f, portalTitle: e.target.value })} className={cx(input, 'mt-1 w-full')} /></label>
        <label className="text-[15px]">Default portal language<select value={f.language} onChange={(e) => setF({ ...f, language: e.target.value as AdminSettings['language'] })} className={cx(input, 'mt-1 w-full')}><option>English</option><option>Bangla</option></select></label>
        <label className="text-[15px]">Idle session timeout (minutes)<input type="number" value={f.idleTimeout} onChange={(e) => setF({ ...f, idleTimeout: +e.target.value })} className={cx(input, 'mt-1 w-full')} /></label>
        <label className="text-[15px]">Default training bond lock-in (months)<input type="number" value={f.bondLockIn} onChange={(e) => setF({ ...f, bondLockIn: +e.target.value })} className={cx(input, 'mt-1 w-full')} /></label>
      </div>
      <ul className="mt-5 space-y-3">{rows.map(([k, t, d]) => <li key={k} className="flex items-center justify-between gap-4 rounded-xl border border-line px-4 py-3"><span><span className="block text-[16px] font-medium">{t}</span><span className="text-[14px] text-ink-3">{d}</span></span><Toggle on={f[k] as boolean} label={t} onClick={() => setF({ ...f, [k]: !f[k] })} /></li>)}</ul>
    </Panel>
  );
}
