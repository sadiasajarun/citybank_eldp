import { QrCode } from 'lucide-react';
import { useDemo } from '../store';
import { Card, PageHeader, Table, Td } from '../components/ui';

export function CertificateCard({ name = 'Ayesha Rahman', course = 'Annual Information Security Awareness 2026' }: { name?: string; course?: string }) {
  return (
    <div className="anim-slide relative mx-auto max-w-2xl rounded-xl border-4 border-double border-brand/40 bg-white p-8 text-center shadow-lg">
      <img src="/brand/citybank-logo.png" alt="City Bank" className="mx-auto mb-2 h-16 w-auto" />
      <div className="text-[14px] font-bold text-ink-3">City Bank PLC · Learning &amp; Development</div>
      <h2 className="mt-3 text-2xl font-extrabold">Certificate of Completion</h2>
      <p className="mt-4 text-[14.5px] text-ink-2">This is to certify that</p>
      <div className="mt-1 text-3xl font-extrabold text-brand">{name}</div>
      <p className="mt-3 text-[14.5px] text-ink-2">has successfully completed</p>
      <div className="text-lg font-bold">{course}</div>
      <div className="mt-1 text-[14px] text-ink-3">Issued 12 November 2026 · Valid until 12 November 2027</div>
      <div className="mt-6 flex items-end justify-between">
        <div className="text-left"><div className="mb-1 h-px w-40 bg-ink-3" /><div className="text-[14px] text-ink-3">Digital signature (placeholder)<br />Head of Learning &amp; Development</div></div>
        <div className="text-center"><QrCode size={56} className="mx-auto" /><div className="text-[14px] text-ink-3">Scan to verify · CERT-2026-088412</div></div>
      </div>
    </div>
  );
}

export function Certificates() {
  const s = useDemo();
  return (
    <div><PageHeader title="Certificates" sub="Verifiable with QR code" />
      {s.courseCompleted ? <CertificateCard /> : <Card><p className="text-[14.5px] text-ink-2">Complete Information Security Awareness to issue a new certificate.</p></Card>}
      <Card className="mt-4" title="Earlier certificates" pad={false}><Table head={['Certificate', 'Issued', 'Expiry']}>{[['AML & CFT Refresher 2025', 'Nov 2025', 'Nov 2026'], ['Code of Conduct 2026', 'Mar 2026', 'Mar 2027'], ['Credit Fundamentals', 'Aug 2026', '—']].map(([a, b, c]) => <tr key={a}><Td><b>{a}</b></Td><Td>{b}</Td><Td>{c}</Td></tr>)}</Table></Card>
    </div>
  );
}
