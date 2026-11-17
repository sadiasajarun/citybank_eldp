/** Shared assessment helpers: exam and question lists (seed + staff-created), question sets, simulated face frames. */
import { Monitor, Users } from 'lucide-react';
import { TRAINING } from '../../data';
import type { DemoState, ProctorKind } from '../../store';
import { EXAMS, QUESTIONS, type Exam, type Question } from '../../seed/bank';
import { cx } from '../../components/ui';

export const PTA_EXAM: Exam = { id: 'PTA', title: `${TRAINING.title} · post-training assessment`, linked: TRAINING.title, date: '20 Nov 2026', status: 'Completed', candidates: 30, avg: 74, pass: 90, duration: 45, passMark: 70, proctored: true, scripts: 30 };
export const allExams = (s: DemoState): Exam[] => [...s.customExams, ...EXAMS];
export const findExam = (s: DemoState, id: string): Exam | undefined => (id === 'PTA' ? PTA_EXAM : allExams(s).find((e) => e.id === id));
export const allQuestions = (s: DemoState): Question[] => [...s.customQuestions, ...QUESTIONS];

const TOPIC_OF: Record<string, string[]> = { EX001: ['AML & CFT'], EX004: ['Islamic Banking', 'AML & CFT'], EX006: ['Cyber Security', 'Risk Management'], EX007: ['AML & CFT', 'Risk Management', 'Cyber Security'], EX008: ['Foreign Trade'] };
/** Objective questions for an exam (8): topic match first, then any objective question. */
export function questionsFor(s: DemoState, examId: string): Question[] {
  const obj = allQuestions(s).filter((q) => q.options && q.answer !== undefined);
  const topics = TOPIC_OF[examId] ?? [];
  const first = obj.filter((q) => topics.includes(q.topic));
  return [...first, ...obj.filter((q) => !first.includes(q))].slice(0, 8);
}

export const KIND: Record<ProctorKind, { label: string; color: string }> = {
  tab: { label: 'Tab switches', color: '#d71920' },
  focus: { label: 'Focus lost', color: '#f97316' },
  face: { label: 'Face not visible', color: '#7c3aed' },
  multi: { label: 'Multiple faces', color: '#be185d' },
  gaze: { label: 'Gaze away', color: '#0284c7' },
  head: { label: 'Head pose', color: '#0d9488' },
  copy: { label: 'Copy-paste attempts', color: '#475569' },
};
export const mmss = (sec: number) => `${String(Math.floor(sec / 60)).padStart(2, '0')}:${String(Math.floor(sec % 60)).padStart(2, '0')}`;

/** Simulated camera frame: a neutral silhouette, varied by event kind. Labelled simulated wherever it is shown. */
export function Frame({ kind, label, className, dark = true }: { kind?: ProctorKind | 'id' | 'live'; label?: string; className?: string; dark?: boolean }) {
  const bg = dark ? '#1b1e25' : '#e8eaee';
  const fg = dark ? '#5b6474' : '#a3aab6';
  const head = kind === 'head' ? 'translate(-14 0) rotate(-14 60 40)' : kind === 'gaze' ? 'translate(0 4)' : '';
  return (
    <div className={cx('relative overflow-hidden rounded-lg', className)} style={{ background: bg }}>
      {kind === 'tab' || kind === 'focus' ? (
        <div className="grid h-full w-full place-items-center text-[12px]" style={{ color: fg }}><Monitor size={28} /><span className="absolute bottom-1.5">{kind === 'tab' ? 'Other tab' : 'Window blurred'}</span></div>
      ) : (
        <svg viewBox="0 0 120 90" className="h-full w-full" aria-hidden>
          {kind !== 'face' && <g transform={head}><circle cx="60" cy="36" r="15" fill={fg} /><path d="M30 90 C32 64 88 64 90 90 Z" fill={fg} /></g>}
          {kind === 'multi' && <g opacity="0.8"><circle cx="98" cy="42" r="10" fill={fg} /><path d="M80 90 C82 72 114 72 116 90 Z" fill={fg} /></g>}
          {kind === 'gaze' && <path d="M66 34 l14 -6" stroke="#38bdf8" strokeWidth="2" />}
          {kind === 'face' && <text x="60" y="50" textAnchor="middle" fontSize="10" fill={fg}>No face</text>}
          {kind === 'multi' && <Users x="4" y="4" width="12" height="12" color="#f472b6" />}
        </svg>
      )}
      {label && <span className="absolute left-1.5 top-1.5 rounded bg-black/50 px-1.5 py-0.5 text-[11px] text-white">{label}</span>}
    </div>
  );
}
