import { QrCode } from 'lucide-react';
import { TRAINING } from '../data';
import { ptResults, useDemo } from '../store';
import { personaFor } from '../components/perspective';
import { Card, PageHeader, Table, Td } from '../components/ui';

export function CertificateCard({ name = 'Ayesha Rahman', course = 'Annual Information Security Awareness 2026', issued = 'Issued 12 November 2026 · Valid until 12 November 2027', id = 'CERT-2026-088412' }: { name?: string; course?: string; issued?: string; id?: string }) {
  return (
    <div className="anim-slide relative mx-auto max-w-2xl rounded-xl border-4 border-double border-brand/40 bg-white p-8 text-center shadow-lg">
      <img src="/brand/citybank-logo.png" alt="City Bank" className="mx-auto mb-2 h-16 w-auto" />
      <div className="text-[14px] font-bold text-ink-3">City Bank PLC · Learning &amp; Development</div>
      <h2 className="mt-3 text-2xl font-extrabold">Certificate of Completion</h2>
      <p className="mt-4 text-[14.5px] text-ink-2">This is to certify that</p>
      <div className="mt-1 text-3xl font-extrabold text-brand">{name}</div>
      <p className="mt-3 text-[14.5px] text-ink-2">has successfully completed</p>
      <div className="text-lg font-bold">{course}</div>
      <div className="mt-1 text-[14px] text-ink-3">{issued}</div>
      <div className="mt-6 flex items-end justify-between">
        <div className="text-left"><div className="mb-1 h-px w-40 bg-ink-3" /><div className="text-[14px] text-ink-3">Digital signature (placeholder)<br />Head of Learning &amp; Development</div></div>
        <div className="text-center"><QrCode size={56} className="mx-auto" /><div className="text-[14px] text-ink-3">Scan to verify · {id}</div></div>
      </div>
    </div>
  );
}

export function Certificates() {
  const s = useDemo();
  const me = personaFor('employee', s.employeeId);
  const res = ptResults(s).find((r) => r.id === s.employeeId);
  const passed = s.pta.released && res?.status === 'Passed';
  const isE1 = s.employeeId === 'e1';
  return (
    <div><PageHeader title="Certificates" sub="Verifiable with QR code" />
      {passed ? (
        <div className="mb-6">
          <p className="mb-3 text-[15px] text-ink-2">Generated automatically when the trainer published the result{res?.score != null ? ` · score ${res.score}%` : ''}. A copy is in {me.name.split(' ')[0]}’s learning record.</p>
          <CertificateCard name={me.name} course={TRAINING.title} issued={`Issued 20 November 2026 · ${TRAINING.dates}`} id={`CERT-2026-${TRAINING.requestId.slice(-5)}-${s.employeeId.toUpperCase()}`} />
        </div>
      ) : s.pta.released && res?.status === 'Failed' ? (
        <Card className="mb-6"><p className="text-[14.5px] text-ink-2">No certificate for {TRAINING.title}: the assessment was not passed. A re-attempt can be assigned by HR.</p></Card>
      ) : null}
      {isE1 && s.courseCompleted ? <CertificateCard name={me.name} /> : isE1 ? <Card><p className="text-[14.5px] text-ink-2">Complete Information Security Awareness to issue a new certificate.</p></Card> : null}
      <Card className="mt-4" title="Earlier certificates" pad={false}><Table head={['Certificate', 'Issued', 'Expiry']}>{[['AML & CFT Refresher 2025', 'Nov 2025', 'Nov 2026'], ['Code of Conduct 2026', 'Mar 2026', 'Mar 2027'], ['Credit Fundamentals', 'Aug 2026', '—']].map(([a, b, c]) => <tr key={a}><Td><b>{a}</b></Td><Td>{b}</Td><Td>{c}</Td></tr>)}</Table></Card>
    </div>
  );
}
