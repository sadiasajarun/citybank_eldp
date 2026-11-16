import { useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Upload } from 'lucide-react';
import { TRAINING } from '../../data';
import { attendedIds, DEMO_DATE, roster, trainingStatus, useDemo, type Programme } from '../../store';
import { FactGroup, PageHead, Section } from '../../components/Templates';
import { DataTable, type Column } from '../../components/DataTable';
import { Alert, Badge, Btn, cx, Drawer, Field, inputCls, Modal } from '../../components/ui';
import { FrRef, SourceTag } from '../../components/Source';

const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONTHS = [{ y: 2026, m: 10, label: 'November 2026' }, { y: 2026, m: 11, label: 'December 2026' }];
const WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/** '12 Nov 2026' → { y, m, d } */
const parseDay = (s: string) => {
  const [d, mon, y] = s.split(' ');
  return { y: Number(y), m: MON.indexOf(mon), d: Number(d) };
};
const keyOf = (y: number, m: number, d: number) => `${y}-${m}-${d}`;

interface Item {
  id: string; title: string; dateLabel: string; days: string[]; sortKey: number; venue: string; medium: string; mode: string;
  status: string; participants: number; attended: number | null; trainer: string; loadProfile: 'Yes' | 'No'; fromRequest?: string; story: boolean; canTake: boolean;
}

const STATUS_TONE: Record<string, string> = { Today: 'warn', Scheduled: 'info', 'Invitation Sent': 'info', Completed: 'ok', Postponed: 'neutral', Deleted: 'neutral', Rescheduled: 'info' };

export function TrainingCalendar() {
  const s = useDemo();
  const nav = useNavigate();
  const [month, setMonth] = useState(0);
  const [openId, setOpenId] = useState<string | null>(null);
  const [take, setTake] = useState<Item | null>(null);
  const [count, setCount] = useState('');
  const [calFile, setCalFile] = useState<{ name: string; by: string; at: string }>({ name: 'Approved_Training_Calendar_2026.xlsx', by: 'Arif Mahmud (Admin)', at: '05 Jan 2026' });
  const fileRef = useRef<HTMLInputElement>(null);

  const items: Item[] = useMemo(() => {
    const prog = s.programmes.map((p: Programme): Item => {
      const d = parseDay(p.date);
      return {
        id: p.id, title: p.title, dateLabel: p.date, days: [keyOf(d.y, d.m, d.d)], sortKey: d.y * 10000 + d.m * 100 + d.d, venue: p.venue, medium: p.medium, mode: p.mode,
        status: p.status, participants: p.participants, attended: p.attended, trainer: p.trainer, loadProfile: p.fromRequest ? 'No' : 'Yes', fromRequest: p.fromRequest, story: false,
        canTake: p.status === 'Today' || p.status === 'Scheduled',
      };
    });
    if (!s.scheduled) return prog;
    const status = s.completed ? 'Completed' : s.planned.status !== 'Scheduled' ? s.planned.status : trainingStatus(s);
    const story: Item = {
      id: TRAINING.trainingId, title: TRAINING.title, dateLabel: '18–19 Nov 2026', days: [keyOf(2026, 10, 18), keyOf(2026, 10, 19)], sortKey: 2026 * 10000 + 10 * 100 + 18,
      venue: TRAINING.venue, medium: 'Classroom + Webinar', mode: 'In-house + External-local', status, participants: roster(s).length,
      attended: s.attendanceSubmitted ? attendedIds(s).length : null, trainer: s.sched.trainers.map((t) => t.name).join(', '),
      loadProfile: s.sched.loadProfile, story: true, canTake: false,
    };
    return [...prog, story].sort((a, b) => a.sortKey - b.sortKey);
  }, [s.programmes, s.scheduled, s.completed, s.planned.status, s.attendanceSubmitted, s.invitesSent, s.attendance, s.attendance2, s.participation, s.resolutions, s.addedParticipants, s.sched]);

  const open = items.find((x) => x.id === openId) ?? null;
  const byDay = (k: string) => items.filter((x) => x.days.includes(k));

  const cur = MONTHS[month];
  const first = new Date(cur.y, cur.m, 1).getDay();
  const daysIn = new Date(cur.y, cur.m + 1, 0).getDate();
  const cells: (number | null)[] = [...Array(first).fill(null), ...Array.from({ length: daysIn }, (_, i) => i + 1)];
  while (cells.length % 7) cells.push(null);
  const isToday = (d: number) => DEMO_DATE.getFullYear() === cur.y && DEMO_DATE.getMonth() === cur.m && DEMO_DATE.getDate() === d;
  const monthCount = items.filter((x) => x.days.some((k) => k.startsWith(`${cur.y}-${cur.m}-`))).length;

  const upload = (f: File | undefined) => {
    if (!f) return;
    const at = '12 Nov 2026';
    setCalFile({ name: f.name, by: 'Arif Mahmud (Admin)', at });
    s.logEvent('admin', 'Training calendar uploaded', `${f.name} · approved training calendar 2026 (simulated storage, FR 43)`);
    useDemo.setState({ toast: `Approved calendar uploaded: ${f.name}` });
  };

  const submitTake = () => {
    if (!take) return;
    const n = Number(count);
    s.takeProgrammeAttendance(take.id, n);
    useDemo.setState({ toast: `Attendance recorded: ${take.title} · ${n} of ${take.participants}` });
    setTake(null);
    setCount('');
  };
  const countOk = take !== null && count.trim() !== '' && Number.isInteger(Number(count)) && Number(count) >= 0 && Number(count) <= take.participants;

  const columns: Column<Item>[] = [
    { key: 'id', header: 'Training ID', sort: (r) => r.id, render: (r) => <span className="font-semibold tabular-nums">{r.id}</span> },
    { key: 'title', header: 'Training Name', sort: (r) => r.title, render: (r) => <div><div className="font-semibold">{r.title}</div>{r.story && <div className="text-[14px] text-ink-3">The guided example training</div>}</div> },
    { key: 'date', header: 'Date', sort: (r) => r.sortKey, render: (r) => <span className="whitespace-nowrap">{r.dateLabel}</span> },
    { key: 'venue', header: 'Venue', render: (r) => r.venue },
    { key: 'medium', header: 'Medium', filter: (r) => r.medium, render: (r) => <div><div>{r.medium}</div><div className="text-[14px] text-ink-3">{r.mode}</div></div> },
    { key: 'att', header: 'Attendance', sort: (r) => r.attended ?? -1, render: (r) => (r.attended === null ? <span className="text-ink-3">{r.participants} invited</span> : <span className="tabular-nums">{r.attended} of {r.participants}</span>) },
    { key: 'status', header: 'Status', filter: (r) => r.status, render: (r) => <Badge t={STATUS_TONE[r.status] ?? 'neutral'}>{r.status}</Badge> },
    { key: 'act', header: '', render: (r) => <Btn v="link" onClick={() => setOpenId(r.id)}>Details</Btn> },
  ];

  return (
    <div>
      <PageHead
        title="Training Calendar"
        meta="Planned programmes from Training Scheduling, accumulated on the approved annual calendar"
        fr="FR 43–44, 182"
        tags={<SourceTag kind="fictional" />}
      />

      <div className="mb-8 flex flex-wrap items-center gap-x-4 gap-y-2 rounded-2xl border border-line bg-[#faf8f5] px-5 py-4">
        <span className="text-[16px]"><b>Approved training calendar 2026</b> uploaded by Admin · {calFile.name} · {calFile.by} · {calFile.at}</span>
        <FrRef>FR 43</FrRef>
        <span className="flex-1" />
        <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv,.pdf" className="hidden" onChange={(e) => { upload(e.target.files?.[0]); e.target.value = ''; }} />
        <Btn v="secondary" size="sm" icon={<Upload size={15} />} onClick={() => fileRef.current?.click()}>Upload new version</Btn>
        <SourceTag kind="simulated" />
      </div>

      <Section title={cur.label} action={
        <div className="flex items-center gap-2">
          <span className="text-[15px] text-ink-3">{monthCount} programme{monthCount === 1 ? '' : 's'} this month</span>
          <Btn v="secondary" size="sm" disabled={month === 0} onClick={() => setMonth(0)} label="Previous month" icon={<ChevronLeft size={16} />}>November</Btn>
          <Btn v="secondary" size="sm" disabled={month === 1} onClick={() => setMonth(1)} label="Next month">December <ChevronRight size={16} /></Btn>
        </div>
      }>
        <div className="overflow-x-auto rounded-2xl border border-line bg-white">
          <div className="grid min-w-[720px] grid-cols-7">
            {WEEK.map((w) => <div key={w} className="border-b border-line bg-[#f7f5f2] px-3 py-2 text-[14px] font-semibold text-ink-3">{w}</div>)}
            {cells.map((d, i) => (
              <div key={i} className={cx('min-h-[96px] border-b border-line p-2', i % 7 !== 6 && 'border-r', d === null && 'bg-canvas/60', (i % 7 === 5 || i % 7 === 6) && d !== null && 'bg-[#fbfbfc]')}>
                {d !== null && (
                  <>
                    <div className={cx('mb-1 grid h-7 w-7 place-items-center rounded-full text-[14px] font-semibold', isToday(d) ? 'bg-brand text-white' : 'text-ink-2')} aria-label={isToday(d) ? 'Today' : undefined}>{d}</div>
                    <div className="space-y-1">
                      {byDay(keyOf(cur.y, cur.m, d)).map((x) => (
                        <button key={x.id} onClick={() => setOpenId(x.id)} className={cx('block w-full truncate rounded-md border px-2 py-1 text-left text-[14px] font-semibold', x.story ? 'border-brand/30 bg-brand-soft text-brand-dark' : x.status === 'Completed' ? 'border-ok/20 bg-ok-soft text-ok' : x.status === 'Today' ? 'border-warn/30 bg-warn-soft text-warn' : 'border-info/20 bg-info-soft text-info')} title={x.title}>
                          {x.title}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
        <p className="mt-2 text-[15px] text-ink-3">Today is {DEMO_DATE.getDate()} {MON[DEMO_DATE.getMonth()]} {DEMO_DATE.getFullYear()} in this demonstration. Select a programme to open its details.</p>
      </Section>

      <Section title="All programmes" fr="FR 44, 182">
        <DataTable<Item>
          rows={items}
          columns={columns}
          rowKey={(r) => r.id}
          searchText={(r) => `${r.id} ${r.title} ${r.venue} ${r.trainer}`}
          searchPlaceholder="Search by training, ID or venue"
          label="programmes"
          activeKey={openId}
        />
      </Section>

      <Drawer open={!!open} onClose={() => setOpenId(null)} title={open?.title ?? ''}>
        {open && (
          <div>
            <div className="mb-5 flex flex-wrap items-center gap-2"><Badge t={STATUS_TONE[open.status] ?? 'neutral'}>{open.status}</Badge><SourceTag kind="fictional" /></div>
            <FactGroup title="Programme details" rows={[
              ['Training ID', open.id],
              ['Date', open.dateLabel],
              ['Venue', open.venue],
              ['Medium · Mode', `${open.medium} · ${open.mode}`],
              ['Trainer', open.trainer],
              ['Participants', String(open.participants)],
              ['Attendance', open.attended === null ? 'Not taken yet' : `${open.attended} of ${open.participants} attended`],
              ['Load Training Profile', <span key="lp">{open.loadProfile}{open.fromRequest ? ` · scheduled directly from request ${open.fromRequest}` : open.loadProfile === 'No' ? ' · scheduled directly from the request' : ' · nomination-led'}</span>],
            ]} />
            {open.loadProfile === 'No' && <p className="mt-3 text-[15px] text-ink-3">Scheduled directly from Training Request Received, without a nomination round (FR 66).</p>}
            <div className="mt-6 flex flex-wrap gap-3">
              {open.story && (
                <>
                  <Btn v="secondary" onClick={() => nav('/hr/planned')}>Open in Planned Training</Btn>
                  <Btn onClick={() => nav('/hr/attendance')}>Open attendance register</Btn>
                </>
              )}
              {!open.story && open.canTake && <Btn onClick={() => { setTake(open); setCount(''); setOpenId(null); }}>Take attendance</Btn>}
              {!open.story && !open.canTake && <Alert kind={open.status === 'Completed' ? 'ok' : 'info'} title={open.status === 'Completed' ? 'Attendance submitted' : `Programme ${open.status.toLowerCase()}`}>{open.status === 'Completed' ? 'Records were written to the Training Database.' : 'Attendance opens when the programme is scheduled again.'}</Alert>}
            </div>
          </div>
        )}
      </Drawer>

      <Modal open={!!take} onClose={() => setTake(null)} title={`Take attendance · ${take?.title ?? ''}`} footer={<><Btn v="secondary" onClick={() => setTake(null)}>Cancel</Btn><Btn disabled={!countOk} onClick={submitTake}>Submit attendance</Btn></>}>
        {take && (
          <div>
            <p className="mb-4 text-[16px] text-ink-2">{take.dateLabel} · {take.venue} · {take.participants} participants. Enter how many attended; the programme moves to Completed and the count reaches the dashboards.</p>
            <Field label={`Attended (0 to ${take.participants})`} hint={!countOk && count !== '' ? <span className="text-brand">Enter a whole number from 0 to {take.participants}.</span> : undefined}>
              <input className={inputCls} inputMode="numeric" value={count} onChange={(e) => setCount(e.target.value)} placeholder={String(take.participants)} />
            </Field>
            <button className="mt-2 text-[15px] font-semibold text-brand hover:underline" onClick={() => setCount(String(take.participants - 2))}>Use the sign-in sheet count: {take.participants - 2}</button>
          </div>
        )}
      </Modal>
    </div>
  );
}
