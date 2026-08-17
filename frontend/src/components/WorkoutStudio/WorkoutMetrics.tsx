import React from 'react';
import { Flame, Clock, Target, CheckCircle } from 'lucide-react';
import { ExerciseInfo, AnalysisFeedback } from '../../types';

interface WorkoutMetricsProps {
  exercise: ExerciseInfo;
  repCount: number;
  holdSeconds: number;
  durationSeconds: number;
  feedback: AnalysisFeedback | null;
  targetReps: number;
}

export const WorkoutMetrics: React.FC<WorkoutMetricsProps> = ({
  exercise,
  repCount,
  holdSeconds,
  durationSeconds,
  feedback,
  targetReps
}) => {
  const isHold = !!exercise.isHoldExercise;
  const currentCount = isHold ? holdSeconds : repCount;
  const progressPercent = Math.min(100, Math.round((currentCount / targetReps) * 100));

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainder = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${remainder.toString().padStart(2, '0')}`;
  };

  const caloriesBurned = Math.round((durationSeconds / 60) * exercise.caloriesPerMinute * 10) / 10;
  const score = feedback?.score ?? 100;

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4 w-full">
      {/* Primary Counter */}
      <div className="relative overflow-hidden rounded-2xl border border-[var(--border-card)] bg-[var(--bg-card)] p-4 shadow-sm">
        <div className="flex items-center justify-between text-[var(--text-muted)]">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#ca8a04] dark:text-[#eab308]">
            {isHold ? 'THỜI GIAN GIỮ' : 'SỐ LẦN LẶP (REPS)'}
          </span>
          <Target className="h-4 w-4 text-[#ca8a04] dark:text-[#eab308]" />
        </div>

        <div className="mt-1 flex items-baseline space-x-1.5 font-mono">
          <span className="font-heading text-3xl sm:text-4xl font-extrabold text-[var(--text-primary)]">
            {currentCount}
          </span>
          <span className="text-xs text-[var(--text-muted)] font-semibold">
            / {targetReps} {isHold ? 's' : 'reps'}
          </span>
        </div>

        {/* Progress Bar */}
        <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-[var(--bg-surface-inset)]">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#eab308] to-[#ca8a04] transition-all duration-300 shadow-sm"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Accuracy Form Score */}
      <div className="relative overflow-hidden rounded-2xl border border-[var(--border-card)] bg-[var(--bg-card)] p-4 shadow-sm">
        <div className="flex items-center justify-between text-[var(--text-muted)]">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#0d9488]">
            ĐỘ CHUẨN FORM
          </span>
          <CheckCircle className="h-4 w-4 text-[#0d9488]" />
        </div>

        <div className="mt-1 flex items-baseline space-x-1 font-mono">
          <span
            className={`font-heading text-3xl sm:text-4xl font-extrabold ${
              score >= 85
                ? 'text-[#0d9488]'
                : score >= 65
                ? 'text-amber-600 dark:text-amber-400'
                : 'text-rose-600 dark:text-rose-400'
            }`}
          >
            {score}
          </span>
          <span className="text-xs text-[var(--text-muted)] font-semibold">%</span>
        </div>

        <p className="mt-2 text-[11px] text-[var(--text-secondary)] font-medium">
          {score >= 85 ? 'Kỹ thuật tối ưu' : score >= 65 ? 'Cần chỉnh góc nhẹ' : 'Lỗi kỹ thuật'}
        </p>
      </div>

      {/* Workout Timer */}
      <div className="relative overflow-hidden rounded-2xl border border-[var(--border-card)] bg-[var(--bg-card)] p-4 shadow-sm">
        <div className="flex items-center justify-between text-[var(--text-muted)]">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-primary)]">
            THỜI GIAN
          </span>
          <Clock className="h-4 w-4 text-[var(--text-muted)]" />
        </div>

        <div className="mt-1 flex items-baseline space-x-1 font-mono">
          <span className="font-heading text-3xl sm:text-4xl font-extrabold text-[var(--text-primary)]">
            {formatTime(durationSeconds)}
          </span>
        </div>

        <p className="mt-2 text-[11px] text-[var(--text-muted)]">
          Thời gian vận động
        </p>
      </div>

      {/* Calories Burned */}
      <div className="relative overflow-hidden rounded-2xl border border-[var(--border-card)] bg-[var(--bg-card)] p-4 shadow-sm">
        <div className="flex items-center justify-between text-[var(--text-muted)]">
          <span className="text-[11px] font-bold uppercase tracking-wider text-orange-600 dark:text-orange-400">
            CALO TIÊU HAO
          </span>
          <Flame className="h-4 w-4 text-orange-500" />
        </div>

        <div className="mt-1 flex items-baseline space-x-1 font-mono">
          <span className="font-heading text-3xl sm:text-4xl font-extrabold text-orange-600 dark:text-orange-400">
            {caloriesBurned}
          </span>
          <span className="text-xs text-[var(--text-muted)] font-semibold">kcal</span>
        </div>

        <p className="mt-2 text-[11px] text-[var(--text-muted)]">
          ~{exercise.caloriesPerMinute} kcal/phút
        </p>
      </div>
    </div>
  );
};
