import React, { useState } from 'react';
import {
  Flame,
  Target,
  Trophy,
  CheckCircle2,
  Calendar,
  Trash2,
  Clock,
  ChevronRight,
  Bot,
  X
} from 'lucide-react';
import { WorkoutHistoryItem, UserProfile } from '../../types';
import { StorageService, OverallStats } from '../../services/storageService';

interface HistoryAnalyticsProps {
  onStartNewWorkout: () => void;
  currentUser?: UserProfile | null;
}

export const HistoryAnalytics: React.FC<HistoryAnalyticsProps> = ({ onStartNewWorkout, currentUser }) => {
  const [history, setHistory] = useState<WorkoutHistoryItem[]>(StorageService.getHistory());
  const [stats, setStats] = useState<OverallStats>(StorageService.getOverallStats());
  const [selectedItem, setSelectedItem] = useState<WorkoutHistoryItem | null>(null);

  React.useEffect(() => {
    // 1. Initial local load
    setHistory(StorageService.getHistory());
    setStats(StorageService.getOverallStats());

    // 2. Immediate cloud sync from MongoDB Atlas
    StorageService.syncFromCloud().then(cloudWorkouts => {
      if (cloudWorkouts && Array.isArray(cloudWorkouts)) {
        setHistory(cloudWorkouts);
        setStats(StorageService.getOverallStats());
      }
    });
  }, [currentUser]);

  const handleClear = () => {
    if (confirm('Bạn có chắc chắn muốn xóa toàn bộ lịch sử tập luyện của tài khoản này không?')) {
      StorageService.clearHistory();
      setHistory([]);
      setStats(StorageService.getOverallStats());
      setSelectedItem(null);
    }
  };

  return (
    <div className="mx-auto max-w-[1680px] w-full space-y-6 p-4 sm:p-8 xl:px-12 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[var(--border-subtle)] pb-4">
        <div>
          <span className="text-xs font-extrabold uppercase tracking-wider text-[#ca8a04] dark:text-[#eab308]">
            NHẬT KÝ VÀ TIẾN ĐỘ TẬP LUYỆN
          </span>
          <h1 className="font-heading text-3xl sm:text-4xl font-extrabold text-[var(--text-primary)]">
            Lịch Sử &amp; Thống Kê Sinh Học
          </h1>
          <p className="text-xs text-[var(--text-muted)]">
            Theo dõi tổng số rep, calo tiêu hao và điểm độ chuẩn form theo thời gian
          </p>
        </div>

        {history.length > 0 && (
          <button
            onClick={handleClear}
            className="flex items-center space-x-1.5 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-2.5 text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-500/20 transition-all cursor-pointer"
          >
            <Trash2 className="h-4 w-4" />
            <span>Xóa Lịch Sử</span>
          </button>
        )}
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-5">
        {/* Total Workouts */}
        <div className="card-impeccable p-6">
          <div className="flex items-center justify-between text-[var(--text-muted)]">
            <span className="text-xs font-bold uppercase tracking-wider text-[#ca8a04] dark:text-[#eab308]">
              BUỔI TẬP
            </span>
            <Trophy className="h-4 w-4 text-[#ca8a04] dark:text-[#eab308]" />
          </div>
          <p className="mt-2 font-heading text-3xl sm:text-4xl font-extrabold text-[var(--text-primary)]">
            {stats.totalWorkouts}
          </p>
          <span className="mt-1 block text-xs text-[var(--text-muted)] font-medium">
            Chuỗi {stats.streakDays} ngày liên tiếp
          </span>
        </div>

        {/* Total Reps */}
        <div className="card-impeccable p-6">
          <div className="flex items-center justify-between text-[var(--text-muted)]">
            <span className="text-xs font-bold uppercase tracking-wider text-[#0d9488]">
              TỔNG REPS
            </span>
            <Target className="h-4 w-4 text-[#0d9488]" />
          </div>
          <p className="mt-2 font-heading text-3xl sm:text-4xl font-extrabold text-[var(--text-primary)]">
            {stats.totalReps}
          </p>
          <span className="mt-1 block text-xs text-[var(--text-muted)] font-medium">Lần lặp hoàn thành</span>
        </div>

        {/* Total Calories */}
        <div className="card-impeccable p-6">
          <div className="flex items-center justify-between text-[var(--text-muted)]">
            <span className="text-xs font-bold uppercase tracking-wider text-orange-600 dark:text-orange-400">
              TỔNG CALO
            </span>
            <Flame className="h-4 w-4 text-orange-500" />
          </div>
          <p className="mt-2 font-heading text-3xl sm:text-4xl font-extrabold text-orange-600 dark:text-orange-400">
            {stats.totalCalories}
          </p>
          <span className="mt-1 block text-xs text-[var(--text-muted)] font-medium">kcal tiêu hao</span>
        </div>

        {/* Avg Form Score */}
        <div className="card-impeccable p-6">
          <div className="flex items-center justify-between text-[var(--text-muted)]">
            <span className="text-xs font-bold uppercase tracking-wider text-[#0d9488]">
              CHUẨN FORM TB
            </span>
            <CheckCircle2 className="h-4 w-4 text-[#0d9488]" />
          </div>
          <p className="mt-2 font-heading text-3xl sm:text-4xl font-extrabold text-[#0d9488]">
            {stats.averageAccuracyScore || 85}%
          </p>
          <span className="mt-1 block text-xs text-[var(--text-muted)] font-medium">AI Biomechanics</span>
        </div>
      </div>

      {/* History List or Empty State */}
      {history.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-[var(--border-subtle)] p-12 text-center space-y-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--bg-card)] text-[var(--text-muted)] border border-[var(--border-subtle)]">
            <Target className="h-8 w-8 text-[#ca8a04] dark:text-[#eab308]" />
          </div>
          <div>
            <h3 className="font-heading text-2xl font-bold text-[var(--text-primary)]">Chưa có dữ liệu tập luyện nào</h3>
            <p className="mt-1 max-w-sm text-xs text-[var(--text-muted)]">
              Hãy hoàn thành một hiệp tập trong phòng tập để ghi nhận dữ liệu sinh cơ học và đánh giá của Gemini AI.
            </p>
          </div>
          <button
            onClick={onStartNewWorkout}
            className="btn-kinpaku px-8 py-3 text-xs font-bold uppercase tracking-wider cursor-pointer"
          >
            Bắt Đầu Tập Ngay
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#ca8a04] dark:text-[#eab308]">
            CHI TIẾT CÁC BUỔI TẬP ({history.length})
          </h3>

          <div className="grid grid-cols-1 gap-3">
            {history.map(item => (
              <div
                key={item.id}
                onClick={() => setSelectedItem(item)}
                className="group card-impeccable flex cursor-pointer flex-col sm:flex-row items-start sm:items-center justify-between p-5"
              >
                <div className="flex items-center space-x-4">
                  <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-[#eab308]/15 text-[#ca8a04] dark:text-[#eab308] border border-[#eab308]/25 group-hover:scale-105 transition-transform">
                    <Target className="h-6 w-6" />
                  </div>

                  <div>
                    <h4 className="font-heading text-lg font-bold text-[var(--text-primary)] group-hover:text-[#ca8a04] dark:group-hover:text-[#eab308] transition-colors">
                      {item.exerciseName}
                    </h4>
                    <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[var(--text-muted)]">
                      <span className="flex items-center space-x-1">
                        <Calendar className="h-3.5 w-3.5" />
                        <span>{item.date}</span>
                      </span>
                      <span className="flex items-center space-x-1 font-mono">
                        <Clock className="h-3.5 w-3.5" />
                        <span>{item.durationSeconds}s</span>
                      </span>
                      <span className="flex items-center space-x-1 text-orange-600 dark:text-orange-400 font-mono">
                        <Flame className="h-3.5 w-3.5" />
                        <span>{item.caloriesBurned} kcal</span>
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-3 sm:mt-0 flex items-center space-x-4 self-end sm:self-auto">
                  <div className="text-right">
                    <span className="font-heading text-2xl font-extrabold text-[var(--text-primary)] font-mono">
                      {item.reps} reps
                    </span>
                    <span
                      className={`block text-xs font-bold ${
                        item.accuracyScore >= 85
                          ? 'text-[#0d9488]'
                          : item.accuracyScore >= 70
                          ? 'text-amber-600 dark:text-amber-400'
                          : 'text-rose-600 dark:text-rose-400'
                      }`}
                    >
                      {item.accuracyScore}% Form
                    </span>
                  </div>

                  <ChevronRight className="h-5 w-5 text-[var(--text-muted)] group-hover:text-[#ca8a04] dark:group-hover:text-[#eab308] transition-colors" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Selected Item Review Modal */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg rounded-3xl border border-[var(--border-card)] bg-[var(--bg-card)] p-6 sm:p-8 shadow-2xl space-y-4">
            <div className="flex items-start justify-between border-b border-[var(--border-subtle)] pb-4">
              <div>
                <h3 className="font-heading text-2xl font-bold text-[var(--text-primary)]">
                  {selectedItem.exerciseName}
                </h3>
                <p className="text-xs text-[var(--text-muted)] font-mono">{selectedItem.date}</p>
              </div>
              <button
                onClick={() => setSelectedItem(null)}
                className="rounded-xl p-2 text-[var(--text-muted)] hover:bg-[var(--bg-surface-inset)] hover:text-[var(--text-primary)] cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-3 gap-2 rounded-2xl bg-[var(--bg-surface-inset)] p-4 text-center font-mono">
              <div>
                <span className="text-[10px] text-[var(--text-muted)] uppercase font-semibold">Số Reps</span>
                <p className="font-heading text-2xl font-extrabold text-[var(--text-primary)]">
                  {selectedItem.reps}
                </p>
              </div>
              <div className="border-x border-[var(--border-subtle)]">
                <span className="text-[10px] text-[var(--text-muted)] uppercase font-semibold">Độ chuẩn form</span>
                <p className="font-heading text-2xl font-extrabold text-[#0d9488]">
                  {selectedItem.accuracyScore}%
                </p>
              </div>
              <div>
                <span className="text-[10px] text-[var(--text-muted)] uppercase font-semibold">Calo tiêu hao</span>
                <p className="font-heading text-2xl font-extrabold text-orange-600 dark:text-orange-400">
                  {selectedItem.caloriesBurned} kcal
                </p>
              </div>
            </div>

            {/* AI Analysis section */}
            {selectedItem.analysis ? (
              <div className="space-y-2 rounded-2xl border border-[#eab308]/30 bg-[var(--bg-surface-inset)] p-4 text-xs">
                <div className="flex items-center space-x-1.5 font-bold text-[#ca8a04] dark:text-[#eab308] uppercase text-xs">
                  <Bot className="h-4 w-4 text-[#0d9488]" />
                  <span>Đánh giá từ Gemini AI ({selectedItem.analysis.grade})</span>
                </div>
                <p className="leading-relaxed text-[var(--text-secondary)]">
                  {selectedItem.analysis.summary}
                </p>
                {selectedItem.analysis.actionableFixes.length > 0 && (
                  <div className="pt-2 border-t border-[var(--border-subtle)]">
                    <span className="text-[#0d9488] font-bold text-xs">Mẹo cải thiện:</span>
                    <p className="text-[var(--text-muted)] mt-0.5">
                      {selectedItem.analysis.actionableFixes[0]}
                    </p>
                  </div>
                )}
              </div>
            ) : null}

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedItem(null)}
                className="btn-hairline px-6 py-2.5 text-xs font-bold cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
