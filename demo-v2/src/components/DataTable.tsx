import { useMemo, useState, type ReactNode } from 'react';
import { ArrowDown, ArrowUp, ArrowUpDown, Search, X } from 'lucide-react';
import { cx } from './ui';

/**
 * Shared list table (F4): search, per-column filters shown as chips, sortable headers (aria-sort),
 * optional grouping, filter-aware selection with shift-range, sticky header, empty state, and a
 * bulk-action bar attached to the table.
 */
export interface Column<T> {
  key: string;
  header: string;
  render: (row: T) => ReactNode;
  /** Value used for sorting; omit to make the column unsortable. */
  sort?: (row: T) => string | number;
  /** Value used for filtering; the distinct values become the filter options. */
  filter?: (row: T) => string;
  className?: string;
  width?: string;
}

interface Props<T> {
  rows: T[];
  columns: Column<T>[];
  rowKey: (row: T) => string;
  /** Text searched by the search box (name, EID …). */
  searchText?: (row: T) => string;
  searchPlaceholder?: string;
  /** Group rows under headings, in the order of `groupOrder`. */
  groupBy?: (row: T) => string;
  groupOrder?: string[];
  selectable?: boolean;
  canSelect?: (row: T) => boolean;
  /** Bulk actions shown when rows are selected. `clear` empties the selection. */
  bulk?: (selected: T[], clear: () => void) => ReactNode;
  /** Always-visible footer actions (e.g. the page's primary action), rendered in the same bar. */
  footer?: ReactNode;
  onRowClick?: (row: T) => void;
  activeKey?: string | null;
  rowClassName?: (row: T) => string;
  emptyText?: string;
  maxHeight?: number;
  initialFilters?: Record<string, string>;
  /** Extra controls in the toolbar (e.g. day tabs, export). */
  toolbar?: ReactNode;
  /** Report the visible rows (after filters) to the parent, e.g. for a progress line. */
  label?: string;
  testId?: string;
}

export function DataTable<T>({ rows, columns, rowKey, searchText, searchPlaceholder = 'Search by name or Employee ID', groupBy, groupOrder, selectable, canSelect, bulk, footer, onRowClick, activeKey, rowClassName, emptyText = 'No rows match these filters.', maxHeight = 560, initialFilters = {}, toolbar, label = 'rows', testId }: Props<T>) {
  const [q, setQ] = useState('');
  const [filters, setFilters] = useState<Record<string, string>>(initialFilters);
  const [sort, setSort] = useState<{ key: string; dir: 1 | -1 } | null>(null);
  const [sel, setSel] = useState<Set<string>>(new Set());
  const [anchor, setAnchor] = useState<string | null>(null);
  const [grouped, setGrouped] = useState(true);

  const filterCols = columns.filter((c) => c.filter);
  const options = useMemo(() => Object.fromEntries(filterCols.map((c) => [c.key, [...new Set(rows.map((r) => c.filter!(r)))].filter(Boolean).sort()])), [rows, columns]);

  const visible = useMemo(() => {
    let out = rows.filter((r) => (!q || (searchText?.(r) ?? '').toLowerCase().includes(q.toLowerCase())) && filterCols.every((c) => !filters[c.key] || c.filter!(r) === filters[c.key]));
    if (sort) {
      const col = columns.find((c) => c.key === sort.key);
      if (col?.sort) out = [...out].sort((a, b) => { const x = col.sort!(a), y = col.sort!(b); return (x < y ? -1 : x > y ? 1 : 0) * sort.dir; });
    }
    return out;
  }, [rows, q, filters, sort, columns]);

  const selectableRows = visible.filter((r) => !canSelect || canSelect(r));
  const selectedRows = rows.filter((r) => sel.has(rowKey(r)));
  const allOn = selectableRows.length > 0 && selectableRows.every((r) => sel.has(rowKey(r)));
  const someOn = selectableRows.some((r) => sel.has(rowKey(r)));
  const clear = () => setSel(new Set());

  const toggleRow = (r: T, shift: boolean) => {
    const k = rowKey(r);
    const next = new Set(sel);
    if (shift && anchor) {
      const keys = selectableRows.map(rowKey);
      const a = keys.indexOf(anchor), b = keys.indexOf(k);
      if (a >= 0 && b >= 0) { const [lo, hi] = a < b ? [a, b] : [b, a]; keys.slice(lo, hi + 1).forEach((x) => next.add(x)); setSel(next); return; }
    }
    if (next.has(k)) next.delete(k); else next.add(k);
    setSel(next);
    setAnchor(k);
  };
  const toggleAll = () => {
    const next = new Set(sel);
    if (allOn) selectableRows.forEach((r) => next.delete(rowKey(r))); else selectableRows.forEach((r) => next.add(rowKey(r)));
    setSel(next);
  };
  const setSortKey = (k: string) => setSort((s) => (s?.key === k ? (s.dir === 1 ? { key: k, dir: -1 } : null) : { key: k, dir: 1 }));
  const activeFilters = Object.entries(filters).filter(([, v]) => v);

  const groups: [string, T[]][] = groupBy && grouped
    ? (groupOrder ?? [...new Set(visible.map(groupBy))]).map((g) => [g, visible.filter((r) => groupBy(r) === g)] as [string, T[]]).filter(([, rs]) => rs.length)
    : [['', visible]];

  const cols = (selectable ? 1 : 0) + columns.length;

  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-white" data-testid={testId}>
      {/* toolbar */}
      <div className="flex flex-wrap items-center gap-3 border-b border-line px-4 py-3">
        {searchText && (
          <label className="flex min-w-[240px] flex-1 items-center gap-2 rounded-lg border border-line px-3 py-2 focus-within:border-brand md:max-w-xs">
            <Search size={16} className="text-ink-3" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={searchPlaceholder} aria-label={searchPlaceholder} className="w-full bg-transparent text-[15px] outline-none" />
          </label>
        )}
        {filterCols.map((c) => (
          <label key={c.key} className="flex items-center gap-2 text-[15px]">
            <span className="text-ink-3">{c.header}</span>
            <select value={filters[c.key] ?? ''} onChange={(e) => setFilters({ ...filters, [c.key]: e.target.value })} className="rounded-lg border border-line bg-white px-2.5 py-2 text-[15px] outline-none focus:border-brand">
              <option value="">All</option>
              {options[c.key].map((o) => <option key={o}>{o}</option>)}
            </select>
          </label>
        ))}
        {groupBy && <label className="flex items-center gap-2 text-[15px] text-ink-2"><input type="checkbox" checked={grouped} onChange={(e) => setGrouped(e.target.checked)} />Group</label>}
        <span className="flex-1" />
        {toolbar}
        <span className="text-[15px] text-ink-3" aria-live="polite">Showing {visible.length} of {rows.length} {label}</span>
      </div>
      {activeFilters.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 border-b border-line bg-[#faf8f5] px-4 py-2">
          {activeFilters.map(([k, v]) => (
            <button key={k} onClick={() => setFilters({ ...filters, [k]: '' })} className="flex items-center gap-1.5 rounded-full border border-line bg-white px-3 py-1 text-[14px] font-semibold hover:border-ink/30">
              {columns.find((c) => c.key === k)?.header}: {v} <X size={14} />
            </button>
          ))}
          <button onClick={() => setFilters({})} className="text-[14px] font-semibold text-brand hover:underline">Clear filters</button>
        </div>
      )}
      {/* table */}
      <div className="overflow-auto scroll-thin" style={{ maxHeight }}>
        <table className="w-full border-collapse text-left text-[15px]">
          <thead className="sticky top-0 z-10 bg-[#f7f5f2]">
            <tr>
              {selectable && (
                <th className="w-12 px-4 py-3">
                  <input type="checkbox" aria-label="Select all visible rows" checked={allOn} ref={(el) => { if (el) el.indeterminate = !allOn && someOn; }} onChange={toggleAll} disabled={!selectableRows.length} />
                </th>
              )}
              {columns.map((c) => {
                const on = sort?.key === c.key;
                return (
                  <th key={c.key} scope="col" aria-sort={on ? (sort!.dir === 1 ? 'ascending' : 'descending') : 'none'} className={cx('whitespace-nowrap px-4 py-3 text-[14px] font-semibold text-ink-3', c.width)}>
                    {c.sort ? (
                      <button onClick={() => setSortKey(c.key)} className="flex items-center gap-1.5 hover:text-ink">
                        {c.header}{on ? (sort!.dir === 1 ? <ArrowUp size={14} /> : <ArrowDown size={14} />) : <ArrowUpDown size={14} className="opacity-40" />}
                      </button>
                    ) : c.header}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {visible.length === 0 && (
              <tr><td colSpan={cols} className="px-4 py-12 text-center">
                <div className="text-[16px] font-semibold">{emptyText}</div>
                {(activeFilters.length > 0 || q) && <button onClick={() => { setFilters({}); setQ(''); }} className="mt-2 text-[15px] font-semibold text-brand hover:underline">Clear filters</button>}
              </td></tr>
            )}
            {groups.map(([g, rs]) => (
              <GroupRows key={g || 'all'} title={g} count={rs.length} cols={cols}>
                {rs.map((r) => {
                  const k = rowKey(r);
                  const can = !canSelect || canSelect(r);
                  return (
                    <tr key={k} onClick={onRowClick ? () => onRowClick(r) : undefined} className={cx('border-t border-line align-middle', onRowClick && 'cursor-pointer hover:bg-[#faf8f5]', activeKey === k && 'bg-[#faf8f5]', sel.has(k) && 'bg-brand-soft/30', rowClassName?.(r))}>
                      {selectable && (
                        <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                          {can && <input type="checkbox" aria-label="Select row" checked={sel.has(k)} onChange={() => undefined} onClick={(e) => toggleRow(r, e.shiftKey)} />}
                        </td>
                      )}
                      {columns.map((c) => <td key={c.key} className={cx('px-4 py-3', c.className)}>{c.render(r)}</td>)}
                    </tr>
                  );
                })}
              </GroupRows>
            ))}
          </tbody>
        </table>
      </div>
      {/* action bar */}
      {((selectable && bulk && selectedRows.length > 0) || footer) && (
        <div className="sticky bottom-0 flex flex-wrap items-center gap-3 border-t border-line bg-white px-4 py-3">
          {selectable && bulk && selectedRows.length > 0 && (
            <>
              <span className="text-[15px] font-semibold">{selectedRows.length} selected</span>
              {bulk(selectedRows, clear)}
              <button onClick={clear} className="text-[15px] font-semibold text-ink-2 hover:text-ink">Clear selection</button>
            </>
          )}
          <span className="flex-1" />
          {footer}
        </div>
      )}
    </div>
  );
}

function GroupRows({ title, count, cols, children }: { title: string; count: number; cols: number; children: ReactNode }) {
  return (
    <>
      {title && <tr className="border-t border-line bg-[#faf8f5]"><td colSpan={cols} className="px-4 py-2 text-[14px] font-bold text-ink-2">{title} · {count}</td></tr>}
      {children}
    </>
  );
}

/** Small CSV export used by reports and dashboards. */
export function downloadCsv(name: string, header: string[], rows: (string | number)[][]) {
  const esc = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
  const csv = [header, ...rows].map((r) => r.map(esc).join(',')).join('\n');
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}
