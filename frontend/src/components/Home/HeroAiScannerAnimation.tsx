import React, { useState, useEffect } from 'react';
import { Activity, ChevronLeft, ChevronRight } from 'lucide-react';
import { ExerciseInfo } from '../../types';
import { ExerciseAnimation } from '../Common/ExerciseAnimation';

interface HeroAiScannerAnimationProps {
  exercises?: ExerciseInfo[];
}

export const HeroAiScannerAnimation: React.FC<HeroAiScannerAnimationProps> = ({
  exercises = []
}) => {
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [repCount, setRepCount] = useState(14);

  const currentExercise = exercises[selectedIdx] || exercises[0];

  useEffect(() => {
    const interval = setInterval(() => {
      setRepCount(r => (r >= 25 ? 1 : r + 1));
    }, 2400);
    return () => clearInterval(interval);
  }, [selectedIdx]);

  const handleNext = () => {
    if (exercises.length === 0) return;
    setSelectedIdx(prev => (prev + 1) % exercises.length);
  };

  const handlePrev = () => {
    if (exercises.length === 0) return;
    setSelectedIdx(prev => (prev - 1 + exercises.length) % exercises.length);
  };

  if (!currentExercise) {
    return (
      <div className="relative w-full max-w-lg lg:max-w-xl mx-auto rounded-3xl border border-[var(--border-card)] bg-[var(--bg-card)] p-8 shadow-xl text-center">
        <div className="h-64 w-full rounded-2xl bg-[var(--bg-canvas)] animate-pulse" />
      </div>
    );
  }

  return (
    <div className="relative w-full max-w-lg lg:max-w-xl mx-auto rounded-3xl border border-[var(--border-card)] bg-[var(--bg-card)] p-5 sm:p-6 shadow-xl overflow-hidden flex flex-col space-y-4">
      {/* Background Aura */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(234,179,8,0.06)_0%,transparent_70%)] pointer-events-none" />

      {/* Top HUD Telemetry Bar */}
      <div className="relative z-10 flex items-center justify-between font-mono text-xs">
        <div className="flex items-center space-x-2 rounded-full bg-[var(--bg-canvas)] border border-[var(--border-subtle)] px-3 py-1 text-[var(--text-secondary)]">
          <span className="h-2 w-2 rounded-full bg-[#ca8a04] dark:bg-[#eab308] animate-ping" />
          <span className="font-bold text-[var(--text-primary)] uppercase">{currentExercise.nameEn}</span>
        </div>

        <div className="flex items-center space-x-1">
          <button
            onClick={handlePrev}
            className="flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--bg-canvas)] border border-[var(--border-subtle)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
            title="Động tác trước"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={handleNext}
            className="flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--bg-canvas)] border border-[var(--border-subtle)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
            title="Động tác tiếp theo"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Center 3D Gym Visual Animated Display Container (Pure Seamless White in Light Mode, Dark in Dark Mode) */}
      <div className="relative z-10 aspect-square w-full rounded-2xl bg-[var(--bg-surface-inset)] border border-[var(--border-card)] p-2 flex items-center justify-center overflow-hidden shadow-xs group">
        {/* Scanning Laser Line */}
        <div className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-[#eab308] to-transparent shadow-[0_0_12px_#eab308] animate-laser-scan pointer-events-none z-20 opacity-80" />

        {/* 3D Exercise GIF Animation with Seamless Blend */}
        <ExerciseAnimation
          exerciseId={currentExercise.id}
          exerciseName={`${currentExercise.nameEn} ${currentExercise.nameVi}`}
          gifUrl={currentExercise.gifUrl}
          className="w-full h-full border-0 bg-transparent shadow-none"
          size="full"
        />

        {/* Floating Top Angle Badge */}
        <div className="absolute top-3 right-3 z-20 flex items-center space-x-1 rounded-lg bg-[var(--bg-card)]/90 px-2.5 py-1 text-xs font-mono font-bold text-[#ca8a04] dark:text-[#eab308] border border-[var(--border-subtle)] shadow-sm backdrop-blur-sm">
          <Activity className="h-3.5 w-3.5 text-[#eab308]" />
          <span>GÓC CHUẨN: 90°</span>
        </div>

        {/* Target Muscles Pill */}
        <div className="absolute bottom-3 left-3 z-20 flex items-center space-x-1 rounded-lg bg-[var(--bg-card)]/90 px-2.5 py-1 text-[11px] font-medium text-[var(--text-secondary)] border border-[var(--border-subtle)] shadow-sm backdrop-blur-sm">
          <span className="text-[#0d9488] font-bold">CƠ TÁC ĐỘNG:</span>
          <span>{currentExercise.targetMuscles.slice(0, 2).join(', ')}</span>
        </div>
      </div>

      {/* Exercise Quick Switcher Dots / Mini Tabs */}
      <div className="relative z-10 flex items-center justify-center space-x-1.5 overflow-x-auto py-1 scrollbar-none">
        {exercises.map((ex, idx) => (
          <button
            key={ex.id}
            onClick={() => setSelectedIdx(idx)}
            className={`px-3 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer whitespace-nowrap ${
              selectedIdx === idx
                ? 'btn-kinpaku text-[#1c1917] shadow-sm scale-105'
                : 'bg-[var(--bg-canvas)] text-[var(--text-muted)] hover:text-[var(--text-primary)] border border-[var(--border-subtle)]'
            }`}
          >
            {ex.nameVi}
          </button>
        ))}
      </div>

      {/* Bottom Live Telemetry Metrics */}
      <div className="relative z-10 grid grid-cols-3 gap-2 rounded-2xl bg-[var(--bg-canvas)] border border-[var(--border-subtle)] p-3.5 text-center shadow-xs font-mono">
        <div>
          <span className="text-[10px] text-[var(--text-muted)] uppercase font-semibold">SỐ REPS</span>
          <p className="font-heading text-2xl font-extrabold text-[var(--text-primary)]">
            {repCount} <span className="text-xs text-[#ca8a04] dark:text-[#eab308] font-bold">/ {currentExercise.defaultTargetReps}</span>
          </p>
        </div>

        <div className="border-x border-[var(--border-subtle)]">
          <span className="text-[10px] text-[var(--text-muted)] uppercase font-semibold">CHUẨN FORM</span>
          <p className="font-heading text-2xl font-extrabold text-[#0d9488]">
            98.5%
          </p>
        </div>

        <div>
          <span className="text-[10px] text-[var(--text-muted)] uppercase font-semibold">TIÊU HAO</span>
          <p className="font-heading text-2xl font-extrabold text-orange-600 dark:text-orange-400">
            ~{currentExercise.caloriesPerMinute * 4} <span className="text-xs text-[var(--text-muted)]">kcal</span>
          </p>
        </div>
      </div>
    </div>
  );
};
