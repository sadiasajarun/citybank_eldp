/**
 * Structured master records (FR 23–34, 38–42): tags with short codes, training titles with category and competency,
 * venues with short name, address, capacity and documents, vendors with contacts, TIN, BIN and documents.
 * Duplicate check on the first field; archive and restore; changes stay on this screen in the demo.
 * Also the annual training calendar month view (FR 43–44, 182).
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Paperclip, Plus, Upload } from 'lucide-react';
import { MASTERS } from '../../data';
import { VENDORS, VENUES } from '../../org';
import { useDemo } from '../../store';
import { batchesOf, type Batch } from '../../seed/bank';
import { Badge, Btn, cx, inputCls, Modal } from '../../components/ui';

interface FieldDef { key: string; label: string; options?: string[]; wide?: boolean; file?: boolean }
interface Cfg { fr: string; noun: string; fields: FieldDef[]; seed: Record<string, string>[] }
const code = (t: string) => t.split(/[\s&/-]+/).filter(Boolean).map((w) => w[0]).join('').toUpperCase().slice(0, 4);

export const RECORD_TABS: Record<string, Cfg> = {
  'Tags / Labels': {
    fr: 'FR 23–24', noun: 'tag',
    fields: [{ key: 'short', label: 'Short tag' }, { key: 'name', label: 'Tag label' }, { key: 'desc', label: 'Description', wide: true }],
    seed: MASTERS.tags.map((t) => ({ short: code(t), name: t, desc: `${t} programmes and courses` })),
  },
  'Training Title': {
    fr: 'FR 28–30', noun: 'training title',
    fields: [{ key: 'name', label: 'Training title', wide: true }, { key: 'category', label: 'Category', options: MASTERS.categories }, { key: 'competency', label: 'Competency', options: MASTERS.competencies }, { key: 'tags', label: 'Tags' }],
    seed: [
      { name: 'Advanced Credit Risk Management', category: MASTERS.categories[0], competency: MASTERS.competencies[0], tags: 'Credit, Risk' },
      { name: 'AML & CFT Refresher', category: MASTERS.categories[1] ?? MASTERS.categories[0], competency: MASTERS.competencies[1] ?? MASTERS.competencies[0], tags: 'AML' },
      { name: 'Information Security Awareness', category: MASTERS.categories[1] ?? MASTERS.categories[0], competency: MASTERS.competencies[1] ?? MASTERS.competencies[0], tags: 'ICT, ISS' },
      { name: 'Customer Experience Excellence', category: MASTERS.categories[2] ?? MASTERS.categories[0], competency: MASTERS.competencies[2] ?? MASTERS.competencies[0], tags: 'CRM' },
      { name: 'Leadership Essentials for Managers', category: MASTERS.categories[2] ?? MASTERS.categories[0], competency: MASTERS.competencies[3] ?? MASTERS.competencies[0], tags: 'City Future Fit' },
    ],
  },
  Venue: {
    fr: 'FR 31–34', noun: 'venue',
    fields: [{ key: 'name', label: 'Venue name', wide: true }, { key: 'short', label: 'Short name' }, { key: 'capacity', label: 'Capacity' }, { key: 'address', label: 'Address', wide: true }, { key: 'docs', label: 'Documents', file: true }],
    seed: VENUES.map((v, i) => ({ name: v.name, short: code(v.name), capacity: ['40', '24', '120', '30'][i] ?? '30', address: v.address, docs: i === 0 ? 'Floor plan.pdf' : '' })),
  },
  Vendor: {
    fr: 'FR 38–42', noun: 'vendor',
    fields: [{ key: 'name', label: 'Vendor name', wide: true }, { key: 'contact', label: 'Contact person' }, { key: 'phone', label: 'Phone' }, { key: 'email', label: 'Email' }, { key: 'tin', label: 'TIN' }, { key: 'bin', label: 'BIN' }, { key: 'docs', label: 'Documents', file: true }],
    seed: VENDORS.map((v, i) => ({ name: v, contact: ['Shahed Karim', 'Tania Akter', 'Rubel Hossain', 'Mithila Roy'][i % 4], phone: `01711-00${100 + i}`, email: `contact${i + 1}@vendor.example`, tin: `52${i}4-78${i}1-90${i}2`, bin: `00${i}1234${i}5-0101`, docs: i % 2 ? '' : 'Trade licence.pdf' })),
  },
};

export function RecordSetup({ tab }: { tab: string }) {
  const s = useDemo();
  const cfg = RECORD_TABS[tab];
  const [rows, setRows] = useState<Record<string, string>[]>(() => cfg.seed.map((r) => ({ ...r, archived: '' })));
  const [open, setOpen] = useState(false);
  const blank = () => Object.fromEntries(cfg.fields.map((f) => [f.key, f.options?.[0] ?? '']));
  const [f, setF] = useState<Record<string, string>>(blank);
  const first = cfg.fields[0].key;
  const term = (f[first] ?? '').trim().toLowerCase();
  const dup = rows.some((r) => r[first].toLowerCase() === term);
  const similar = term.length > 2 && !dup ? rows.find((r) => r[first].toLowerCase().includes(term)) : undefined;
  const save = () => {
    setRows([{ ...f, archived: '' }, ...rows]);
    s.logEvent('hr', 'Setup entry added', `${tab}: ${f[cfg.fields.find((x) => x.key === 'name') ? 'name' : first]} (${cfg.fr})`);
    setOpen(false); setF(blank());
  };
  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2"><span className="text-[15px] text-ink-2">{rows.filter((r) => !r.archived).length} active · duplicate check on {cfg.fields[0].label.toLowerCase()}</span><Btn onClick={() => setOpen(true)}><Plus size={16} />Add {cfg.noun}</Btn></div>
      <div className="overflow-x-auto rounded-xl ring-1 ring-line">
        <table className="w-full min-w-[820px] text-left text-[15px]">
          <thead className="bg-canvas text-[13px] uppercase tracking-wide text-ink-3"><tr>{cfg.fields.map((x) => <th key={x.key} className="px-4 py-2.5 font-semibold">{x.label}</th>)}<th className="px-4 py-2.5 font-semibold">Status</th><th /></tr></thead>
          <tbody className="divide-y divide-line">
            {rows.map((r, i) => (
              <tr key={r[first] + i} className={cx(r.archived && 'text-ink-3')}>
                {cfg.fields.map((x) => <td key={x.key} className={cx('px-4 py-2.5', x.key === 'short' && 'font-mono text-[13px] font-semibold text-brand', x.key === 'name' && 'font-medium')}>{x.file ? (r[x.key] ? <span className="inline-flex items-center gap-1.5"><Paperclip size={14} />{r[x.key]}</span> : <span className="text-ink-3">—</span>) : r[x.key] || '—'}</td>)}
                <td className="px-4 py-2.5"><Badge t={r.archived ? 'neutral' : 'ok'}>{r.archived ? 'Archived' : 'Active'}</Badge></td>
                <td className="px-4 py-2.5 text-right"><button onClick={() => { setRows(rows.map((y, j) => (j === i ? { ...y, archived: y.archived ? '' : 'yes' } : y))); s.logEvent('hr', 'Setup entry updated', `${tab}: ${r[first]}`); }} className="text-[14px] font-medium text-brand hover:underline">{r.archived ? 'Restore' : 'Archive'}</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Modal open={open} onClose={() => setOpen(false)} title={`Add ${cfg.noun} · ${cfg.fr}`} footer={<><Btn v="secondary" onClick={() => setOpen(false)}>Cancel</Btn><Btn disabled={!term || dup} onClick={save}>Save</Btn></>}>
        <div className="grid gap-3 sm:grid-cols-2">
          {cfg.fields.map((x) => (
            <label key={x.key} className={cx('text-[15px]', x.wide && 'sm:col-span-2')}>{x.label}
              {x.options ? <select value={f[x.key]} onChange={(e) => setF({ ...f, [x.key]: e.target.value })} className={cx(inputCls, 'mt-1')}>{x.options.map((o) => <option key={o}>{o}</option>)}</select>
                : x.file ? <span className="mt-1 flex items-center gap-2"><label className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-lg border border-line px-3 text-[15px]"><Upload size={15} />Choose file<input type="file" className="hidden" onChange={(e) => setF({ ...f, [x.key]: e.target.files?.[0]?.name ?? '' })} /></label><span className="text-[14px] text-ink-3">{f[x.key] || 'No file'}</span></span>
                  : <input value={f[x.key]} onChange={(e) => setF({ ...f, [x.key]: e.target.value })} className={cx(inputCls, 'mt-1')} />}
            </label>
          ))}
        </div>
        {term.length > 2 && <p className={cx('mt-3 text-[14px] font-semibold', dup ? 'text-brand' : similar ? 'text-warn' : 'text-ok')}>{dup ? 'This entry already exists. A duplicate cannot be added.' : similar ? `Similar entry exists: ${similar[first]}. Check before saving.` : 'No duplicate found.'}</p>}
      </Modal>
    </div>
  );
}

/* ---------------- annual training calendar: month view (FR 43–44, 182) ---------------- */
const MONTH = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const MON3 = MONTH.map((m) => m.slice(0, 3));
const parse = (d: string) => { const [dd, mm, yy] = d.split(' '); return { day: +dd, month: MON3.indexOf(mm), year: +yy }; };
const CAT_TONE = ['bg-sky-50 text-sky-900 ring-sky-200', 'bg-brand-soft text-brand-dark ring-brand/30', 'bg-ok-soft text-ok ring-ok/30', 'bg-amber-50 text-amber-900 ring-amber-200', 'bg-violet-50 text-violet-900 ring-violet-200'];

export function CalendarSetup() {
  const s = useDemo();
  const nav = useNavigate();
  const [month, setMonth] = useState(10);
  const [cat, setCat] = useState('All');
  const [uploaded, setUploaded] = useState(false);
  const all = batchesOf(s);
  const cats = ['All', ...new Set(all.map((b) => b.category))];
  const tone = (c: string) => CAT_TONE[cats.indexOf(c) % CAT_TONE.length];
  const inMonth = all.filter((b) => { const d = parse(b.start); return d.year === 2026 && d.month === month && (cat === 'All' || b.category === cat); });
  const first = new Date(2026, month, 1).getDay();
  const days = new Date(2026, month + 1, 0).getDate();
  const cells: (number | null)[] = [...Array.from({ length: first }, () => null), ...Array.from({ length: days }, (_, i) => i + 1)];
  while (cells.length % 7) cells.push(null);
  const on = (d: number) => inMonth.filter((b) => parse(b.start).day === d);
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3 rounded-xl bg-brand-soft/40 px-4 py-3 ring-1 ring-brand/20">
        <span className="flex-1 text-[15px]"><b>Yearly Excel training calendar import.</b> {uploaded ? 'Approved_Training_Plan_2026.xlsx imported · 18 batches (simulated).' : 'Upload the approved yearly plan; scheduled trainings then accumulate here (FR 43–44).'}</span>
        <label className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-lg border border-line bg-white px-4 text-[15px]"><Upload size={16} />Upload .xlsx plan<input type="file" className="hidden" onChange={() => { setUploaded(true); s.logEvent('admin', 'Training calendar uploaded', 'Approved calendar 2026 · 18 batches (simulated)'); }} /></label>
        <Btn v="secondary" onClick={() => nav('/hr/calendar')}>Open the training calendar</Btn>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <button onClick={() => setMonth((m) => Math.max(0, m - 1))} aria-label="Previous month" className="grid h-10 w-10 place-items-center rounded-lg border border-line"><ChevronLeft size={18} /></button>
        <span className="min-w-[150px] text-center text-[18px] font-semibold">{MONTH[month]} 2026</span>
        <button onClick={() => setMonth((m) => Math.min(11, m + 1))} aria-label="Next month" className="grid h-10 w-10 place-items-center rounded-lg border border-line"><ChevronRight size={18} /></button>
        <span className="ml-2 text-[15px] text-ink-3">{inMonth.length} programme{inMonth.length === 1 ? '' : 's'} this month</span>
      </div>
      <div className="flex flex-wrap gap-2">{cats.map((c) => <button key={c} onClick={() => setCat(c)} className={cx('rounded-full px-3 py-1 text-[14px] ring-1', cat === c ? 'bg-brand text-white ring-brand' : 'bg-white ring-line hover:ring-ink/30')}>{c}</button>)}</div>
      <div className="grid grid-cols-7 overflow-hidden rounded-xl ring-1 ring-line">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => <div key={d} className="border-b border-line bg-canvas py-2 text-center text-[13px] font-semibold uppercase text-ink-3">{d}</div>)}
        {cells.map((d, i) => (
          <div key={i} className={cx('min-h-[96px] border-b border-r border-line p-1.5', !d && 'bg-canvas/40')}>
            {d && <div className="text-[14px] font-medium">{d}</div>}
            {d && on(d).map((b: Batch) => <button key={b.id} onClick={() => nav('/hr/planned')} title={`${b.title} · ${b.venue}`} className={cx('mt-1 block w-full truncate rounded px-1.5 py-0.5 text-left text-[12px] font-medium ring-1', tone(b.category), b.story && 'ring-2 ring-brand')}>{b.title}</button>)}
          </div>
        ))}
      </div>
    </div>
  );
}
