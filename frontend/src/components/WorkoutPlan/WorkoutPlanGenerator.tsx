import React, { useState } from 'react';
import {
  Sparkles,
  Calendar,
  Flame,
  Clock,
  Target,
  Award,
  Play,
  RotateCcw,
  Zap,
  Activity,
  CheckCircle2,
  ChevronRight,
  Shield,
  Dumbbell,
  Heart,
  TrendingUp,
  Sliders,
  ArrowRight,
  Circle,
  Globe,
  Trophy
} from 'lucide-react';
import { ExerciseInfo, WorkoutRoutine, WorkoutRoutineInput } from '../../types';
import { ExerciseAnimation } from '../Common/ExerciseAnimation';
import { ApiClient } from '../../services/apiClient';
import { EXERCISES } from '../../data/exercises';

interface WorkoutPlanGeneratorProps {
  onStartExerciseInStudio: (exercise: ExerciseInfo, targetReps?: number) => void;
  availableExercises?: ExerciseInfo[];
}

export const WorkoutPlanGenerator: React.FC<WorkoutPlanGeneratorProps> = ({
  onStartExerciseInStudio,
  availableExercises = EXERCISES
}) => {
  // Input states
  const [goal, setGoal] = useState<'hypertrophy' | 'hiit' | 'posture' | 'abs' | 'mobility'>('hypertrophy');
  const [fitnessLevel, setFitnessLevel] = useState<'beginner' | 'intermediate' | 'advanced'>('beginner');
  const [durationMinutes, setDurationMinutes] = useState(20);
  const [focusArea, setFocusArea] = useState<'fullbody' | 'lower' | 'upper' | 'core'>('fullbody');

  const [isLoading, setIsLoading] = useState(false);
  const [generatedRoutine, setGeneratedRoutine] = useState<WorkoutRoutine | null>(null);

  const handleGenerate = async () => {
    setIsLoading(true);
    try {
      const input: WorkoutRoutineInput = {
        goal,
        fitnessLevel,
        durationMinutes,
        focusArea
      };
      const res = await ApiClient.generateRoutine(input);
      if (res) {
        setGeneratedRoutine(res);
      }
    } catch (err) {
      console.error('Error generating routine:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartRoutineExercise = (routineEx: any) => {
    // Look for matching exercise in library
    const matched = availableExercises.find(
      e =>
        e.id === routineEx.exerciseId ||
        e.nameVi.toLowerCase().includes(routineEx.exerciseName?.toLowerCase() || '') ||
        e.nameEn.toLowerCase().includes(routineEx.exerciseNameEn?.toLowerCase() || '')
    ) || availableExercises[0];

    const customizedExercise: ExerciseInfo = {
      ...matched,
      defaultTargetReps: routineEx.reps || matched.defaultTargetReps,
      isHoldExercise: routineEx.isHold ?? matched.isHoldExercise
    };

    onStartExerciseInStudio(customizedExercise, routineEx.reps);
  };

  return (
    <div className="mx-auto max-w-[1680px] w-full space-y-8 p-4 sm:p-8 xl:px-12 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 rounded-3xl border border-[var(--border-card)] bg-[var(--bg-card)] p-6 sm:p-8 shadow-sm">
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <span className="flex items-center space-x-1.5 rounded-full bg-[#eab308]/15 px-3 py-1 text-xs font-extrabold text-[#ca8a04] dark:text-[#eab308] border border-[#eab308]/30">
              <Sparkles className="h-3.5 w-3.5 text-[#eab308]" />
              <span>AI PERSONAL TRAINER (PT ẢO)</span>
            </span>
          </div>
          <h1 className="font-heading text-3xl sm:text-4xl font-extrabold text-[var(--text-primary)]">
            Tạo Giáo Án Tập Luyện Bằng AI
          </h1>
          <p className="text-xs text-[var(--text-muted)] sm:text-sm max-w-2xl leading-relaxed">
            Thiết kế lịch trình tập luyện khoa học 3 giai đoạn (Khởi động → Khối bài tập chính → Giãn cơ), 
            tối ưu riêng theo thể trạng và quỹ thời gian của bạn chỉ trong vài giây.
          </p>
        </div>

        {generatedRoutine && (
          <button
            onClick={() => setGeneratedRoutine(null)}
            className="flex items-center space-x-2 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface-inset)] hover:bg-[var(--bg-card)] px-5 py-3 text-xs font-bold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all cursor-pointer flex-shrink-0"
          >
            <RotateCcw className="h-4 w-4" />
            <span>Tạo Giáo Án Khác</span>
          </button>
        )}
      </div>

      {/* Main Content Area */}
      {!generatedRoutine ? (
        /* STEP 1: 4-PARAMETER QUESTIONNAIRE */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 space-y-6">
            {/* Card 1: Goal */}
            <div className="card-impeccable p-6 sm:p-8 space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-sm font-bold uppercase tracking-wider text-[var(--text-primary)] flex items-center space-x-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#eab308] text-neutral-950 text-xs font-black">1</span>
                  <span>Mục Tiêu Tập Luyện Của Bạn</span>
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  {
                    id: 'hypertrophy',
                    icon: Dumbbell,
                    title: 'Tăng Cơ Giảm Mỡ',
                    desc: 'Tăng cơ bắp, nét khối và săn chắc cơ thể toàn diện'
                  },
                  {
                    id: 'hiit',
                    icon: Flame,
                    title: 'Đốt Mỡ Siêu Tốc (HIIT)',
                    desc: 'Kích hoạt nhịp tim cao, đốt calo tối đa cả sau khi tập'
                  },
                  {
                    id: 'posture',
                    icon: Shield,
                    title: 'Chỉnh Dáng & Chống Gù',
                    desc: 'Mở rộng lồng ngực, tăng sức mạnh lưng và giữ trục thẳng'
                  },
                  {
                    id: 'abs',
                    icon: Zap,
                    title: 'Săn Chắc Cơ Bụng 6 Múi',
                    desc: 'Tập trung siết cơ lõi, rãnh bụng số 11 và cơ liên sườn'
                  },
                  {
                    id: 'mobility',
                    icon: Activity,
                    title: 'Dẻo Dai & Phục Hồi',
                    desc: 'Linh hoạt bao hoạt dịch khớp, giải tỏa áp lực và mệt mỏi'
                  }
                ].map(item => {
                  const Icon = item.icon;
                  const isSelected = goal === item.id;
                  return (
                    <div
                      key={item.id}
                      onClick={() => setGoal(item.id as any)}
                      className={`relative flex items-start space-x-3.5 rounded-2xl border p-4 transition-all duration-200 cursor-pointer ${
                        isSelected
                          ? 'border-[#eab308] bg-[#eab308]/10 shadow-md ring-1 ring-[#eab308]/50'
                          : 'border-[var(--border-subtle)] bg-[var(--bg-surface-inset)] hover:border-[#eab308]/40 hover:bg-[var(--bg-card)]'
                      }`}
                    >
                      <div
                        className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl transition-colors ${
                          isSelected
                            ? 'bg-[#eab308] text-neutral-950 font-bold shadow-xs'
                            : 'bg-[var(--bg-card)] text-[#ca8a04] dark:text-[#eab308] border border-[var(--border-subtle)]'
                        }`}
                      >
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-xs font-bold text-[var(--text-primary)]">{item.title}</h4>
                        <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">{item.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Card 2: Fitness Level & Duration */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Fitness Level */}
              <div className="card-impeccable p-6 space-y-4">
                <label className="text-sm font-bold uppercase tracking-wider text-[var(--text-primary)] flex items-center space-x-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#eab308] text-neutral-950 text-xs font-black">2</span>
                  <span>Trình Độ Thể Lực</span>
                </label>

                <div className="space-y-2.5">
                  {[
                    {
                      id: 'beginner',
                      color: 'fill-emerald-500 text-emerald-500',
                      label: 'Người Mới Bắt Đầu',
                      desc: 'Mới tập hoặc trở lại sau thời gian dài'
                    },
                    {
                      id: 'intermediate',
                      color: 'fill-amber-500 text-amber-500',
                      label: 'Trung Cấp (3-6 tháng)',
                      desc: 'Đã nắm vững kỹ thuật form cơ bản'
                    },
                    {
                      id: 'advanced',
                      color: 'fill-rose-500 text-rose-500',
                      label: 'Nâng Cao (Athlete)',
                      desc: 'Thể lực bền bỉ, chịu tải nặng tốt'
                    }
                  ].map(item => (
                    <div
                      key={item.id}
                      onClick={() => setFitnessLevel(item.id as any)}
                      className={`rounded-2xl border p-3 transition-all cursor-pointer ${
                        fitnessLevel === item.id
                          ? 'border-[#eab308] bg-[#eab308]/10 ring-1 ring-[#eab308]/50'
                          : 'border-[var(--border-subtle)] bg-[var(--bg-surface-inset)] hover:border-[#eab308]/40'
                      }`}
                    >
                      <div className="font-bold text-xs text-[var(--text-primary)] flex items-center space-x-1.5">
                        <Circle className={`h-2 w-2 ${item.color}`} />
                        <span>{item.label}</span>
                      </div>
                      <div className="text-[10px] text-[var(--text-muted)] mt-0.5 pl-3.5">{item.desc}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Workout Duration */}
              <div className="card-impeccable p-6 space-y-4">
                <label className="text-sm font-bold uppercase tracking-wider text-[var(--text-primary)] flex items-center space-x-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#eab308] text-neutral-950 text-xs font-black">3</span>
                  <span>Thời Lượng Buổi Tập</span>
                </label>

                <div className="grid grid-cols-2 gap-2.5">
                  {[
                    { min: 10, icon: Zap, label: '10 Phút', sub: 'Tập nhanh' },
                    { min: 15, icon: Clock, label: '15 Phút', sub: 'Express' },
                    { min: 20, icon: Flame, label: '20 Phút', sub: 'Chuẩn (Đề xuất)' },
                    { min: 30, icon: Trophy, label: '30 Phút', sub: 'Tối ưu hiệu quả' },
                    { min: 45, icon: Shield, label: '45 Phút', sub: 'Chuyên sâu' }
                  ].map(item => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.min}
                        type="button"
                        onClick={() => setDurationMinutes(item.min)}
                        className={`rounded-2xl border p-3 text-left transition-all cursor-pointer ${
                          durationMinutes === item.min
                            ? 'border-[#eab308] bg-[#eab308]/10 ring-1 ring-[#eab308]/50'
                            : 'border-[var(--border-subtle)] bg-[var(--bg-surface-inset)] hover:border-[#eab308]/40'
                        }`}
                      >
                        <div className="font-bold text-xs text-[var(--text-primary)] flex items-center space-x-1.5">
                          <Icon className="h-3.5 w-3.5 text-[#ca8a04] dark:text-[#eab308]" />
                          <span>{item.label}</span>
                        </div>
                        <div className="text-[10px] text-[var(--text-muted)] mt-0.5">{item.sub}</div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Card 3: Focus Area */}
            <div className="card-impeccable p-6 space-y-4">
              <label className="text-sm font-bold uppercase tracking-wider text-[var(--text-primary)] flex items-center space-x-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#eab308] text-neutral-950 text-xs font-black">4</span>
                <span>Nhóm Cơ Trọng Tâm</span>
              </label>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { id: 'fullbody', icon: Globe, label: 'Toàn Thân', desc: 'Full Body' },
                  { id: 'lower', icon: Activity, label: 'Thân Dưới', desc: 'Mông - Đùi' },
                  { id: 'upper', icon: Dumbbell, label: 'Thân Trên', desc: 'Ngực - Tay - Vai' },
                  { id: 'core', icon: Zap, label: 'Cơ Bụng', desc: 'Core & Abs' }
                ].map(item => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setFocusArea(item.id as any)}
                      className={`rounded-2xl border p-3 text-center transition-all cursor-pointer flex flex-col items-center justify-center space-y-1 ${
                        focusArea === item.id
                          ? 'border-[#eab308] bg-[#eab308]/10 ring-1 ring-[#eab308]/50'
                          : 'border-[var(--border-subtle)] bg-[var(--bg-surface-inset)] hover:border-[#eab308]/40'
                      }`}
                    >
                      <Icon className="h-4 w-4 text-[#ca8a04] dark:text-[#eab308]" />
                      <div className="font-bold text-xs text-[var(--text-primary)]">{item.label}</div>
                      <div className="text-[10px] text-[var(--text-muted)]">{item.desc}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* CTA Generate Button */}
            <div className="pt-2">
              <button
                type="button"
                onClick={handleGenerate}
                disabled={isLoading}
                className="w-full flex items-center justify-center space-x-2.5 rounded-2xl bg-[#eab308] hover:bg-[#ca8a04] text-neutral-950 py-4 text-sm font-bold transition-all shadow-xl hover:shadow-[#eab308]/25 cursor-pointer disabled:opacity-50"
              >
                {isLoading ? (
                  <div className="flex items-center space-x-2">
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-neutral-950 border-t-transparent" />
                    <span>AI Gemini Đang Thiết Kế Giáo Án Riêng Cho Bạn...</span>
                  </div>
                ) : (
                  <>
                    <Sparkles className="h-5 w-5 fill-current" />
                    <span>Tạo Giáo Án Ngay (AI Workout Routine)</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Right Sidebar: AI Features & Highlights */}
          <div className="lg:col-span-4 space-y-5">
            <div className="card-impeccable p-6 space-y-4">
              <h3 className="font-heading text-lg font-bold text-[var(--text-primary)] flex items-center space-x-2">
                <Award className="h-5 w-5 text-[#ca8a04] dark:text-[#eab308]" />
                <span>Tiêu Chuẩn Khoa Học 3 Giai Đoạn</span>
              </h3>

              <div className="space-y-4 text-xs text-[var(--text-secondary)]">
                <div className="flex items-start space-x-3 rounded-2xl bg-[var(--bg-surface-inset)] p-3 border border-[var(--border-subtle)]">
                  <div className="rounded-xl bg-amber-500/20 text-amber-500 p-2 font-bold">1</div>
                  <div>
                    <h5 className="font-bold text-[var(--text-primary)]">Khởi Động Làm Nóng (Warm-up)</h5>
                    <p className="text-[11px] text-[var(--text-muted)] mt-0.5">Xoay khớp và kích hoạt nhịp tim 2-3 phút phòng tránh chấn thương.</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3 rounded-2xl bg-[var(--bg-surface-inset)] p-3 border border-[var(--border-subtle)]">
                  <div className="rounded-xl bg-[#eab308] text-neutral-950 p-2 font-black">2</div>
                  <div>
                    <h5 className="font-bold text-[var(--text-primary)]">Khối Bài Tập Chính (Main Workout)</h5>
                    <p className="text-[11px] text-[var(--text-muted)] mt-0.5">Phân bổ thứ tự bài hợp lý, quy định Sets, Reps và thời gian nghỉ phục hồi.</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3 rounded-2xl bg-[var(--bg-surface-inset)] p-3 border border-[var(--border-subtle)]">
                  <div className="rounded-xl bg-teal-500/20 text-teal-500 p-2 font-bold">3</div>
                  <div>
                    <h5 className="font-bold text-[var(--text-primary)]">Giãn Cơ & Hạ Nhiệt (Cool-down)</h5>
                    <p className="text-[11px] text-[var(--text-muted)] mt-0.5">Kéo giãn tĩnh giải tỏa axit lactic, giảm đau mỏi cơ bắp sau buổi tập.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="card-impeccable p-6 space-y-3 bg-gradient-to-br from-[#eab308]/10 via-transparent to-transparent">
              <h4 className="font-bold text-xs uppercase tracking-wider text-[#ca8a04] dark:text-[#eab308] flex items-center space-x-1.5">
                <Zap className="h-4 w-4" />
                <span>1-Click Kết Nối Camera AI</span>
              </h4>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                Mỗi bài tập trong giáo án đều được trang bị nút <strong>"Tập Với AI Camera"</strong> — tự động nạp bài tập vào phòng studio và bật máy quét 33 khớp xương để theo dõi form tức thì.
              </p>
            </div>
          </div>
        </div>
      ) : (
        /* STEP 2: ATHLETE-GRADE 3-PHASE ROUTINE VISUALIZATION */
        <div className="space-y-8 animate-in fade-in zoom-in-95 duration-300">
          {/* Routine Summary Card */}
          <div className="rounded-3xl border border-[#eab308]/40 bg-gradient-to-r from-[var(--bg-card)] via-[var(--bg-card)] to-[#eab308]/10 p-6 sm:p-8 shadow-lg space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--border-subtle)] pb-4">
              <div>
                <span className="rounded-full bg-[#eab308] text-neutral-950 px-2.5 py-0.5 text-[10px] font-extrabold uppercase font-mono tracking-wider">
                  GIÁO ÁN ĐÃ TẠO THÀNH CÔNG
                </span>
                <h2 className="mt-1.5 font-heading text-2xl sm:text-3xl font-extrabold text-[var(--text-primary)]">
                  {generatedRoutine.title}
                </h2>
              </div>

              <div className="flex items-center space-x-4">
                <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface-inset)] px-4 py-2 text-center">
                  <span className="text-[10px] uppercase font-bold text-[var(--text-muted)]">Thời lượng</span>
                  <p className="font-mono text-base font-extrabold text-[#ca8a04] dark:text-[#eab308]">
                    {generatedRoutine.durationMinutes} Phút
                  </p>
                </div>
                <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface-inset)] px-4 py-2 text-center">
                  <span className="text-[10px] uppercase font-bold text-[var(--text-muted)]">Calo đốt cháy</span>
                  <p className="font-mono text-base font-extrabold text-rose-500">
                    ~{generatedRoutine.estimatedCalories} kcal
                  </p>
                </div>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed">
              {generatedRoutine.overview}
            </p>
          </div>

          {/* 3 PHASES */}
          <div className="space-y-8">
            {/* GIAI ĐOẠN 1: KHỞI ĐỘNG (WARM-UP) */}
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/20 text-amber-500 font-black text-sm">
                  1
                </div>
                <div>
                  <h3 className="font-heading text-xl font-bold text-[var(--text-primary)] flex items-center space-x-2">
                    <span>Giai Đoạn 1: Khởi Động Làm Nóng (Warm-up)</span>
                    <span className="rounded-lg bg-amber-500/15 px-2 py-0.5 text-xs text-amber-600 dark:text-amber-400 font-bold font-mono">
                      ~2-3 Phút
                    </span>
                  </h3>
                  <p className="text-xs text-[var(--text-muted)]">Bôi trơn các bao hoạt dịch khớp và nâng nhịp tim nhẹ nhàng.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {generatedRoutine.warmUp.map((w, idx) => (
                  <div
                    key={idx}
                    className="card-impeccable p-5 space-y-2 border-amber-500/30 bg-amber-500/5 hover:border-amber-500/60 transition-all"
                  >
                    <div className="flex items-center justify-between text-xs font-bold text-amber-600 dark:text-amber-400">
                      <span>Động tác #{idx + 1}</span>
                      <span className="font-mono">{w.durationSeconds}s</span>
                    </div>
                    <h4 className="font-bold text-sm text-[var(--text-primary)]">{w.name}</h4>
                    <p className="text-xs text-[var(--text-muted)] leading-relaxed">{w.instruction}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* GIAI ĐOẠN 2: KHỐI BÀI TẬP CHÍNH (MAIN WORKOUT) */}
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#eab308] text-neutral-950 font-black text-sm shadow-md">
                  2
                </div>
                <div>
                  <h3 className="font-heading text-xl font-bold text-[var(--text-primary)] flex items-center space-x-2">
                    <span>Giai Đoạn 2: Khối Bài Tập Chính (Main Workout Routine)</span>
                    <span className="rounded-lg bg-[#eab308]/20 px-2 py-0.5 text-xs text-[#ca8a04] dark:text-[#eab308] font-bold font-mono">
                      AI Vision Tracking
                    </span>
                  </h3>
                  <p className="text-xs text-[var(--text-muted)]">Phân bổ thứ tự bài tập tối ưu kèm nút 1-chạm kết nối Camera AI.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {generatedRoutine.mainRoutine.map((item, idx) => {
                  const isHoldExercise = item.isHold || item.exerciseId === 'plank' || item.exerciseId === 'warrior_yoga';
                  const effectiveSets = item.sets && item.sets >= 2 ? item.sets : 3;
                  const effectiveReps = isHoldExercise
                    ? item.reps && item.reps >= 15
                      ? item.reps
                      : 30
                    : item.reps && item.reps >= 5
                    ? item.reps
                    : 12;

                  return (
                    <div
                      key={idx}
                      className="group relative flex flex-col justify-between rounded-3xl border border-[var(--border-card)] bg-[var(--bg-card)] p-5 transition-all duration-200 hover:border-[#eab308]/60 hover:shadow-xl space-y-4"
                    >
                      <div className="flex items-start space-x-4">
                        {/* 3D GIF preview */}
                        <div className="h-28 w-28 flex-shrink-0 overflow-hidden rounded-2xl border border-[var(--border-subtle)] bg-white dark:bg-neutral-900 p-1 flex items-center justify-center">
                          <ExerciseAnimation
                            exerciseId={item.exerciseId}
                            exerciseName={item.exerciseName}
                            gifUrl={item.gifUrl}
                            size="full"
                            className="h-full w-full object-contain"
                          />
                        </div>

                        {/* Info & Metrics */}
                        <div className="flex-1 space-y-2 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="rounded-lg bg-[#eab308]/15 px-2 py-0.5 text-[10px] font-bold text-[#ca8a04] dark:text-[#eab308]">
                              Bài #{idx + 1}
                            </span>
                            <span className="text-[11px] font-mono text-[var(--text-muted)] font-semibold">
                              Nghỉ: {item.restSeconds || 45}s
                            </span>
                          </div>

                          <h4 className="font-heading text-base font-bold text-[var(--text-primary)] line-clamp-1">
                            {item.exerciseName}
                          </h4>
                          <p className="text-[11px] text-[var(--text-muted)] font-mono">{item.exerciseNameEn}</p>

                          <div className="flex items-center space-x-2 pt-1">
                            <span className="rounded-md bg-[var(--bg-surface-inset)] px-2 py-1 text-[11px] font-mono font-bold text-[var(--text-primary)] border border-[var(--border-subtle)]">
                              {effectiveSets} Hiệp (Sets)
                            </span>
                            <span className="rounded-md bg-[#eab308]/20 px-2 py-1 text-[11px] font-mono font-bold text-[#ca8a04] dark:text-[#eab308] border border-[#eab308]/40">
                              {effectiveReps} {isHoldExercise ? 'giây' : 'reps'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Form Cue */}
                      <div className="rounded-2xl bg-[var(--bg-surface-inset)] p-3 text-xs border border-[var(--border-subtle)] space-y-1">
                        <div className="font-bold text-[11px] text-[#0d9488] flex items-center space-x-1">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          <span>Mẹo Form Chuẩn (AI Form Cue):</span>
                        </div>
                        <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed">
                          {item.formCue}
                        </p>
                      </div>

                      {/* 1-Click Bridge to Camera View */}
                      <button
                        type="button"
                        onClick={() =>
                          handleStartRoutineExercise({
                            ...item,
                            reps: effectiveReps,
                            sets: effectiveSets,
                            isHold: isHoldExercise
                          })
                        }
                        className="w-full flex items-center justify-center space-x-2 rounded-2xl bg-[#eab308] hover:bg-[#ca8a04] text-neutral-950 py-3 text-xs font-bold transition-all shadow-md hover:shadow-[#eab308]/25 cursor-pointer font-heading"
                      >
                        <Play className="h-4 w-4 fill-current" />
                        <span>
                          Tập Với AI Camera ({effectiveReps} {isHoldExercise ? 's' : 'reps'})
                        </span>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* GIAI ĐOẠN 3: GIÃN CƠ & HẠ NHIỆT (COOL-DOWN) */}
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-500/20 text-teal-500 font-black text-sm">
                  3
                </div>
                <div>
                  <h3 className="font-heading text-xl font-bold text-[var(--text-primary)] flex items-center space-x-2">
                    <span>Giai Đoạn 3: Giãn Cơ &amp; Hạ Nhiệt (Cool-down)</span>
                    <span className="rounded-lg bg-teal-500/15 px-2 py-0.5 text-xs text-teal-600 dark:text-teal-400 font-bold font-mono">
                      ~2-3 Phút
                    </span>
                  </h3>
                  <p className="text-xs text-[var(--text-muted)]">Kéo giãn tĩnh giải tỏa axit lactic và giảm đau nhức cơ bắp (DOMS).</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {generatedRoutine.coolDown.map((c, idx) => (
                  <div
                    key={idx}
                    className="card-impeccable p-5 space-y-2 border-teal-500/30 bg-teal-500/5 hover:border-teal-500/60 transition-all"
                  >
                    <div className="flex items-center justify-between text-xs font-bold text-teal-600 dark:text-teal-400">
                      <span>Giãn cơ #{idx + 1}</span>
                      <span className="font-mono">{c.durationSeconds}s</span>
                    </div>
                    <h4 className="font-bold text-sm text-[var(--text-primary)]">{c.name}</h4>
                    <p className="text-xs text-[var(--text-muted)] leading-relaxed">{c.instruction}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Coach Tip */}
            <div className="rounded-3xl border border-[#0d9488]/30 bg-[#0d9488]/10 p-6 flex items-start space-x-4">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl bg-[#0d9488] text-white shadow-md">
                <Sparkles className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <h4 className="font-heading text-sm font-bold text-[#0d9488]">
                  Lời Khuyên Phục Hồi Từ Huấn Luyện Viên AI
                </h4>
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                  {generatedRoutine.coachTip}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
