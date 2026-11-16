import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { TRAINING } from '../../data';
import { roster, useDemo } from '../../store';
import { CheckList, DecisionLayout, DecisionPanel, FactGroup, NotYet, PageHead, ReasonModal } from '../../components/Templates';
import { SourceTag } from '../../components/Source';
import { useSwitchRole } from '../../components/perspective';
import { Alert, Badge, Btn } from '../../components/ui';

/** Budget lines prepared by HR (fictional demonstration data). */
const LINES: [string, string, number][] = [
  ['Internal trainer honorarium', 'Nafis Ahmed · 2 days', 120000],
  ['External trainer fee', 'Dr. Farhan Chowdhury · BIBM', 480000],
  ['Venue & logistics', 'City Bank Learning Center', 320000],
  ['Meals', '32 participants × 2 days', 384000],
  ['Training material & printing', 'Case packs, certificates', 136000],
];
/** FY26 L&D budget position before this request (fictional). */
const FY_BUDGET = 42000000;
const COMMITTED = 17460000;

const bdt = (n: number) => `BDT ${n.toLocaleString('en-IN')}`;

export function FinanceApproval() {
  const s = useDemo();
  const nav = useNavigate();
  const switchRole = useSwitchRole();
  const [ret, setRet] = useState(false);

  const head = (
    <PageHead
      title="Training budget approval"
      meta={`Training ${TRAINING.trainingId} · ${TRAINING.title} · ${TRAINING.dates}`}
      sub="Received from Nusrat Jahan, HR Admin"
      fr="Proposed · FR 135"
      tags={<><SourceTag kind="proposed">Proposed workflow, based on FR 135</SourceTag><SourceTag kind="fictional" />{s.scheduled && <Badge t={s.budgetApproved ? 'ok' : 'warn'}>{s.budgetApproved ? 'Approved' : s.budgetReturned ? 'Returned to HR' : 'Awaiting your approval'}</Badge>}</>}
    />
  );
  if (!s.scheduled) {
    return <div>{head}<NotYet title="No budget waiting for approval" after="HR schedules the training and sends the budget to Finance" /></div>;
  }

  const total = LINES.reduce((a, [, , v]) => a + v, 0);
  const participants = roster(s).length;
  const perHead = participants ? Math.round(total / participants) : 0;
  const headroom = FY_BUDGET - COMMITTED;
  const sent = s.audit.find((a) => a.action === 'Training scheduled' || a.action === 'Budget resubmitted');
  const approved = s.audit.find((a) => a.action === 'Budget approved');

  const panel = s.budgetApproved ? (
    <DecisionPanel title="Budget approved" what={<>Approval no. <b>{TRAINING.approvalNo}</b>{approved ? ` · ${approved.at.slice(12)}` : ''}. HR now sends the invitations; the approval no. fills the Planned Training record (FR 135).</>}>
      <Alert kind="ok" title={`${bdt(total)} approved`}>Maker: Nusrat Jahan · Checker: Rezaul Karim</Alert>
      <Btn v="secondary" onClick={() => nav('/r/finance')}>Back to My work</Btn>
    </DecisionPanel>
  ) : s.budgetReturned ? (
    <DecisionPanel title="Returned to HR" what="HR attaches what you asked for and resubmits. It comes back to your tasks.">
      <Alert kind="warn" title="Your reason">{s.budgetReturnReason}</Alert>
      <Btn onClick={() => switchRole('hr', '/hr/schedule')}>See it as HR Admin <ArrowRight size={16} /></Btn>
      <Btn v="secondary" onClick={() => nav('/r/finance')}>Back to My work</Btn>
    </DecisionPanel>
  ) : (
    <DecisionPanel
      what={`HR prepared a budget of ${bdt(total)}. You are the checker: approve it or return it with a reason.`}
      note="One person prepares the budget and another approves it (maker-checker). Annexure-II only requires the budget fields; this approval step is our proposal."
    >
      <Btn size="lg" onClick={() => s.approveBudget()}>Approve budget</Btn>
      <p className="-mt-1 text-[15px] text-ink-2">Next: HR sends invitations to trainers and participants.</p>
      <Btn v="secondary" onClick={() => setRet(true)}>Return to HR</Btn>
    </DecisionPanel>
  );

  return (
    <div>
      {head}
      <DecisionLayout panel={panel}>
        <div className="space-y-10">
          <section>
            <h2 className="mb-3 text-[20px] font-bold tracking-tight">Budget breakdown</h2>
            <div className="overflow-x-auto rounded-2xl border border-line bg-white">
              <table className="w-full text-left text-[16px]">
                <thead className="bg-[#f7f5f2] text-[14px] text-ink-3">
                  <tr><th className="px-5 py-3 font-semibold">Line</th><th className="px-5 py-3 font-semibold">Detail</th><th className="px-5 py-3 text-right font-semibold">Amount</th></tr>
                </thead>
                <tbody>
                  {LINES.map(([k, d, v]) => (
                    <tr key={k} className="border-t border-line"><td className="px-5 py-3 font-medium">{k}</td><td className="px-5 py-3 text-ink-2">{d}</td><td className="px-5 py-3 text-right tabular-nums">{bdt(v)}</td></tr>
                  ))}
                  <tr className="border-t-2 border-line text-[17px] font-bold"><td className="px-5 py-3.5" colSpan={2}>Total</td><td className="px-5 py-3.5 text-right tabular-nums">{bdt(total)}</td></tr>
                </tbody>
              </table>
            </div>
          </section>

          <FactGroup title="Maker-checker" rows={[
            ['Maker', `Nusrat Jahan, HR Admin${sent ? ` · sent ${sent.at.slice(12)}` : ''}`],
            ['Checker', 'Rezaul Karim, Senior Manager, Financial Control (you)'],
            ['Rule', 'The person who prepares a budget cannot approve it'],
          ]} />

          <FactGroup title="Budget position" rows={[
            ['FY26 L&D budget', bdt(FY_BUDGET)],
            ['Headroom before this request', bdt(headroom)],
            ['Headroom after approval', <span key="after" className={headroom - total < 0 ? 'text-brand' : ''}>{bdt(headroom - total)}</span>],
            ['Cost per participant', `${bdt(perHead)} · ${participants} participants on the final list`],
            ['Category', `${TRAINING.category} · ${TRAINING.mode} · ${TRAINING.medium}`],
          ]} />

          <CheckList title="Checks before you approve" items={[
            { label: 'Within budget', text: `${bdt(total)} fits the FY26 Functional headroom of ${bdt(headroom)}.`, ok: headroom >= total, source: 'Finance system' },
            { label: 'Participants confirmed', text: `${participants} participants finalised by HR; meals are budgeted for 32.`, ok: participants <= 32, source: 'Training Nomination Status' },
            { label: 'Quotations', text: 'Venue and material quotations attached; the BIBM trainer fee is quoted in the programme profile.', ok: true, source: 'Training Scheduling documents' },
          ]} />
        </div>
      </DecisionLayout>

      <ReasonModal
        open={ret}
        title="Return to HR"
        intro="HR gets the budget back with your reason, fixes it and resubmits."
        confirm="Return to HR"
        suggested="Please attach BIBM's quotation for the external trainer fee."
        onClose={() => setRet(false)}
        onConfirm={(reason) => { s.returnBudget(reason); setRet(false); switchRole('hr', '/hr/schedule'); }}
      />
    </div>
  );
}
