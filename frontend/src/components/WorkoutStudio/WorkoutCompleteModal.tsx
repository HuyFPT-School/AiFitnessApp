import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  Trophy,
  Flame,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Bot,
  ArrowRight,
  ShieldAlert,
  Dumbbell
} from 'lucide-react';
import {
  WorkoutSessionSummary,
  GeminiAnalysisResult,
  WorkoutHistoryItem
} from '../../types';
import { GeminiService } from '../../services/geminiService';
import { StorageService } from '../../services/storageService';
import { audioCoach } from '../../engine/audioCoach';

interface WorkoutCompleteModalProps {
  isOpen: boolean;
  session: WorkoutSessionSummary | null;
  onClose: () => void;
  onRestart: () => void;
}

export const WorkoutCompleteModal: React.FC<WorkoutCompleteModalProps> = ({
  isOpen,
  session,
  onClose,
  onRestart
}) => {
  const [analysis, setAnalysis] = useState<GeminiAnalysisResult | null>(null);
  const [isLoadingAi, setIsLoadingAi] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    if (isOpen && session) {
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch {
        // Ignore
      }

      audioCoach.playSuccessCelebration();
      loadGeminiAnalysis();
    } else {
      setAnalysis(null);
      setIsSaved(false);
    }
  }, [isOpen, session]);

  const loadGeminiAnalysis = async () => {
    if (!session) return;
    setIsLoadingAi(true);

    try {
      const result = await GeminiService.analyzeWorkoutSession(session);
      setAnalysis(result);

      const calories = Math.round(
        (session.durationSeconds / 60) * 8
      );

      const historyItem: WorkoutHistoryItem = {
        id: 'session_' + Date.now(),
        exerciseId: session.exerciseId,
        exerciseName: session.exerciseName,
        date: new Date().toLocaleDateString('vi-VN', {
          hour: '2-digit',
          minute: '2-digit',
          day: '2-digit',
          month: '2-digit',
          year: 'numeric'
        }),
        reps: session.reps,
        durationSeconds: session.durationSeconds,
        accuracyScore: session.accuracyScore,
        caloriesBurned: calories,
        analysis: result
      };

      StorageService.saveWorkout(historyItem);
      setIsSaved(true);
    } catch (err) {
      console.warn('Failed to load analysis:', err);
    } finally {
      setIsLoadingAi(false);
    }
  };

  if (!isOpen || !session) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/80 p-4 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative my-8 w-full max-w-2xl overflow-hidden rounded-3xl border border-[var(--border-card)] bg-[var(--bg-card)] p-6 sm:p-8 shadow-2xl space-y-6">
        {/* Celebration Header */}
        <div className="flex flex-col items-center text-center space-y-2">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-[#eab308] to-[#ca8a04] text-[#1c1917] shadow-lg shadow-[#eab308]/25">
            <Trophy className="h-8 w-8 stroke-[2.5]" />
          </div>
          <h2 className="font-heading text-3xl sm:text-4xl font-extrabold text-[var(--text-primary)]">
            Hoàn Thành Buổi Tập!
          </h2>
          <p className="text-xs text-[var(--text-muted)]">
            Bài tập: <span className="text-[#ca8a04] dark:text-[#eab308] font-bold">{session.exerciseName}</span>
          </p>
        </div>

        {/* Key Summary Stats */}
        <div className="grid grid-cols-3 gap-3 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface-inset)] p-4 text-center font-mono">
          <div>
            <span className="text-[11px] text-[var(--text-muted)] uppercase font-semibold">Hoàn thành</span>
            <p className="font-heading text-3xl font-extrabold text-[var(--text-primary)]">
              {session.reps}
            </p>
            <span className="text-[11px] text-[var(--text-muted)]">reps / s</span>
          </div>

          <div className="border-x border-[var(--border-subtle)]">
            <span className="text-[11px] text-[var(--text-muted)] uppercase font-semibold">Chuẩn Form</span>
            <p
              className={`font-heading text-3xl font-extrabold ${
                session.accuracyScore >= 85
                  ? 'text-[#0d9488]'
                  : session.accuracyScore >= 70
                  ? 'text-amber-600 dark:text-amber-400'
                  : 'text-rose-600 dark:text-rose-400'
              }`}
            >
              {session.accuracyScore}%
            </p>
            <span className="text-[11px] text-[var(--text-muted)]">AI Score</span>
          </div>

          <div>
            <span className="text-[11px] text-[var(--text-muted)] uppercase font-semibold">Thời Gian</span>
            <p className="font-heading text-3xl font-extrabold text-orange-600 dark:text-orange-400">
              {session.durationSeconds}s
            </p>
            <span className="text-[11px] text-[var(--text-muted)] flex items-center justify-center space-x-1">
              <Flame className="h-3.5 w-3.5 text-orange-500" />
              <span>~{Math.round((session.durationSeconds / 60) * 8)} kcal</span>
            </span>
          </div>
        </div>

        {/* Gemini AI Biomechanics Breakdown */}
        <div className="space-y-4 rounded-2xl border border-[#eab308]/30 bg-[var(--bg-surface-inset)] p-5">
          <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
            <div className="flex items-center space-x-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#eab308]/20 text-[#ca8a04] dark:text-[#eab308]">
                <Bot className="h-4 w-4" />
              </div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-primary)] flex items-center space-x-1.5">
                <span>Đánh Giá Sinh Cơ Học Từ Gemini AI</span>
                <Sparkles className="h-3.5 w-3.5 text-[#ca8a04] dark:text-[#eab308]" />
              </h3>
            </div>
            {analysis && (
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-bold border ${
                  analysis.grade === 'Xuất sắc'
                    ? 'bg-[#0d9488]/15 text-[#0d9488] border-[#0d9488]/30'
                    : analysis.grade === 'Tốt'
                    ? 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30'
                    : 'bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-500/30'
                }`}
              >
                Hạng: {analysis.grade}
              </span>
            )}
          </div>

          {isLoadingAi ? (
            <div className="flex flex-col items-center justify-center py-6 space-y-2">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#eab308] border-t-transparent" />
              <p className="text-xs text-[var(--text-muted)] font-mono">
                Gemini AI đang phân tích quỹ đạo góc khớp &amp; biomechanics...
              </p>
            </div>
          ) : analysis ? (
            <div className="space-y-3.5 text-xs">
              <p className="leading-relaxed text-[var(--text-secondary)] bg-[var(--bg-card)] p-3.5 rounded-xl border border-[var(--border-subtle)]">
                {analysis.summary}
              </p>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {/* Strengths */}
                <div className="space-y-1.5 rounded-xl border border-[#0d9488]/25 bg-[var(--bg-card)] p-3.5">
                  <span className="flex items-center space-x-1.5 font-bold text-[#0d9488] text-xs">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Điểm Làm Tốt</span>
                  </span>
                  <ul className="space-y-1 text-[var(--text-secondary)]">
                    {analysis.strengths.map((str, idx) => (
                      <li key={idx} className="flex items-start space-x-1.5">
                        <span className="text-[#0d9488] font-bold">•</span>
                        <span>{str}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Actionable Fixes */}
                <div className="space-y-1.5 rounded-xl border border-amber-500/25 bg-[var(--bg-card)] p-3.5">
                  <span className="flex items-center space-x-1.5 font-bold text-amber-700 dark:text-amber-400 text-xs">
                    <AlertTriangle className="h-4 w-4" />
                    <span>Hướng Sửa Kỹ Thuật</span>
                  </span>
                  <ul className="space-y-1 text-[var(--text-secondary)]">
                    {analysis.actionableFixes.map((fix, idx) => (
                      <li key={idx} className="flex items-start space-x-1.5">
                        <span className="text-amber-600 dark:text-amber-400 font-bold">•</span>
                        <span>{fix}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Injury Alert */}
              {analysis.injuryRiskAlert && (
                <div className="flex items-center space-x-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-3 text-[var(--text-secondary)]">
                  <ShieldAlert className="h-4 w-4 text-[#0d9488] flex-shrink-0" />
                  <span className="text-xs">{analysis.injuryRiskAlert}</span>
                </div>
              )}
            </div>
          ) : null}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-[var(--border-subtle)] pt-4">
          <div className="text-xs text-[var(--text-muted)] flex items-center space-x-1">
            {isSaved && (
              <>
                <CheckCircle2 className="h-3.5 w-3.5 text-[#0d9488]" />
                <span>Đã lưu tự động vào Lịch sử tập luyện</span>
              </>
            )}
          </div>

          <div className="flex items-center space-x-3 w-full sm:w-auto">
            <button
              onClick={onRestart}
              className="btn-hairline flex-1 sm:flex-none flex items-center justify-center space-x-2 px-5 py-3 text-xs cursor-pointer"
            >
              <Dumbbell className="h-4 w-4" />
              <span>Tập Lại Hiệp Này</span>
            </button>

            <button
              onClick={onClose}
              className="btn-kinpaku flex-1 sm:flex-none flex items-center justify-center space-x-2 px-7 py-3 text-xs font-bold uppercase tracking-wider cursor-pointer"
            >
              <span>Xong &amp; Tiếp Tục</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
