import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Lock, RotateCcw, ShieldCheck } from 'lucide-react';
import { useDemo } from '../store';
import { JOURNEY, journeyIndex } from '../lifecycle';

/** A calm, light welcome: trust, development and one clear way in. */
export function Login() {
  const nav = useNavigate();
  const s = useDemo();
  const [busy, setBusy] = useState<'sso' | 'demo' | null>(null);
  const progress = journeyIndex(s);
  // Signing in always starts the story where City Bank's process starts: Farzana Haque, Division Head,
  // raising the training request. Continuing a half-finished demo is a separate, explicit choice.
  const enter = (mode: 'sso' | 'demo' | 'resume') => {
    setBusy(mode === 'resume' ? 'sso' : mode);
    setTimeout(() => {
      if (mode !== 'resume') { s.reset(); useDemo.setState({ toast: null }); }
      s.setRole('division_head');
      s.setEmployee('e1');
      s.setTour(true);
      nav('/overview');
    }, 750);
  };
  return (
    <div className="relative min-h-full overflow-hidden bg-[#fbf8f4] text-ink">
      {/* soft background shapes */}
      <div aria-hidden className="pointer-events-none absolute -right-40 -top-40 h-[640px] w-[640px] rounded-full bg-[radial-gradient(circle,rgba(215,25,32,.10),transparent_65%)]" />
      <div aria-hidden className="pointer-events-none absolute -bottom-56 -left-40 h-[560px] w-[560px] rounded-full bg-[radial-gradient(circle,rgba(180,140,100,.10),transparent_65%)]" />

      <div className="relative mx-auto flex min-h-full max-w-[1400px] flex-col px-8 py-8 lg:px-16">
        <header className="flex items-center justify-between">
          <img src="/brand/citybank-logo.png" alt="City Bank — making sense of money" className="h-16 w-auto lg:h-20" />
          <span className="rounded-full border border-[#e9dfd3] bg-white/70 px-4 py-1.5 text-[14px] font-medium text-ink-2">Demonstration environment · simulated data</span>
        </header>

        <main className="grid flex-1 items-center gap-12 py-10 lg:grid-cols-[1.05fr_1fr]">
          <section className="anim-up max-w-xl">
            <p className="text-[17px] font-semibold text-brand">Enterprise Learning &amp; Development Platform</p>
            <h1 className="mt-4 text-[44px] font-extrabold leading-[1.08] tracking-tight lg:text-[56px]">Welcome to City Bank ELDP</h1>
            <p className="mt-5 text-[21px] leading-relaxed text-ink-2">Your learning, development and capability journey starts here.</p>
            <p className="mt-4 text-[17px] leading-relaxed text-ink-3">A secure platform connecting employee learning, capability growth and workforce development.</p>

            <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center">
              <button onClick={() => enter('sso')} disabled={busy !== null} aria-busy={busy === 'sso'}
                className="flex min-h-14 items-center justify-center gap-3 rounded-xl bg-brand px-7 text-[17px] font-bold text-white shadow-lg shadow-brand/20 transition-colors hover:bg-brand-dark focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand disabled:opacity-80">
                {busy === 'sso' ? <><span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />Signing you in securely…</> : <>Continue with City Bank SSO <ArrowRight size={19} /></>}
              </button>
              <button onClick={() => enter('demo')} disabled={busy !== null}
                className="flex min-h-14 items-center justify-center gap-2 rounded-xl border border-[#e2d6c8] bg-white px-6 text-[16px] font-semibold text-ink hover:border-ink/30 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand">
                {busy === 'demo' ? 'Opening the guided demonstration…' : 'Explore the demonstration'}
              </button>
            </div>
            <p className="mt-5 flex items-center gap-2 text-[15px] text-ink-3"><Lock size={16} />Secure access through City Bank Identity &amp; Access Management.</p>
            {progress > 0 && (
              <div className="anim-fade mt-6 flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl border border-[#e9dfd3] bg-white/80 px-4 py-3 text-[15px]">
                <span className="text-ink-2">Signing in starts a fresh demonstration with the Division Head. A previous run stopped{progress < JOURNEY.length ? ` at step ${progress + 1} of ${JOURNEY.length}` : ' after the final step'}.</span>
                <button onClick={() => enter('resume')} disabled={busy !== null} className="flex items-center gap-1.5 font-semibold text-brand hover:underline"><RotateCcw size={15} />Resume that run instead</button>
              </div>
            )}
          </section>

          <section aria-hidden className="anim-fade relative hidden lg:block">
            <DevelopmentIllustration />
          </section>
        </main>

        <footer className="flex flex-wrap items-center justify-between gap-4 border-t border-[#ece3d8] pt-5 text-[15px]">
          <button onClick={() => { s.setRole('employee'); s.setEmployee('e1'); nav('/employee'); }} className="font-semibold text-ink-2 underline-offset-4 hover:text-brand hover:underline">External trainer or trainee? Sign in here</button>
          <span className="flex items-center gap-2 text-ink-3"><ShieldCheck size={16} />Prepared by RiseUp Labs for City Bank PLC</span>
        </footer>
      </div>
    </div>
  );
}

/** A quiet "growth path": milestones rising along a curve, with a few people-development cards. */
function DevelopmentIllustration() {
  const steps = [
    { x: 60, y: 360, t: 'Need' }, { x: 170, y: 300, t: 'Training' }, { x: 290, y: 250, t: 'Learning' },
    { x: 410, y: 175, t: 'Assessment' }, { x: 520, y: 95, t: 'Capability' },
  ];
  return (
    <div className="relative mx-auto aspect-[6/5] w-full max-w-[600px]">
      <svg viewBox="0 0 600 500" className="absolute inset-0 h-full w-full">
        <defs>
          <linearGradient id="path" x1="0" x2="1" y1="1" y2="0"><stop offset="0" stopColor="#e9d9c6" /><stop offset="1" stopColor="#d71920" /></linearGradient>
        </defs>
        <circle cx="330" cy="250" r="210" fill="#fff" opacity=".7" />
        <circle cx="330" cy="250" r="150" fill="none" stroke="#efe5da" strokeWidth="1.5" />
        <path d="M60 360 C 130 330, 140 310, 170 300 S 250 262, 290 250 S 380 200, 410 175 S 490 112, 520 95" fill="none" stroke="url(#path)" strokeWidth="4" strokeLinecap="round" />
        {steps.map((p, i) => (
          <g key={p.t}>
            <circle cx={p.x} cy={p.y} r={i === steps.length - 1 ? 15 : 11} fill={i === steps.length - 1 ? '#d71920' : '#fff'} stroke={i === steps.length - 1 ? '#d71920' : '#d9c7b3'} strokeWidth="3" />
            <text x={p.x} y={p.y + 36} textAnchor="middle" fontSize="15" fontWeight="600" fill="#4a515d" fontFamily="Inter, Segoe UI, sans-serif">{p.t}</text>
          </g>
        ))}
      </svg>
      <div className="absolute left-[2%] top-[8%] rounded-2xl border border-[#efe5da] bg-white px-5 py-4 shadow-sm">
        <div className="text-[14px] text-ink-3">This month</div>
        <div className="text-[26px] font-extrabold tracking-tight">3,842 hours</div>
        <div className="text-[14px] text-ink-2">of learning across the bank</div>
      </div>
      <div className="absolute bottom-[4%] right-[2%] flex items-center gap-3 rounded-2xl border border-[#efe5da] bg-white px-5 py-4 shadow-sm">
        <span className="grid h-11 w-11 place-items-center rounded-full bg-brand-soft text-[15px] font-bold text-brand-dark">AR</span>
        <div><div className="text-[16px] font-bold">Certificate earned</div><div className="text-[14px] text-ink-3">Information Security Awareness</div></div>
      </div>
    </div>
  );
}
