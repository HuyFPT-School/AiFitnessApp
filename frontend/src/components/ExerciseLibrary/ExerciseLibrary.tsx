import React, { useState, useEffect } from 'react';
import {
  Flame,
  Target,
  Play,
  ShieldCheck,
  AlertCircle,
  Search,
  Sparkles,
  Trash2,
  Pencil,
  Crown,
  X
} from 'lucide-react';
import { ExerciseInfo, ExerciseCategory, UserProfile } from '../../types';
import { ExerciseAnimation } from '../Common/ExerciseAnimation';
import { CreateExerciseModal } from '../Admin/CreateExerciseModal';
import { ApiClient } from '../../services/apiClient';

interface ExerciseLibraryProps {
  onSelectAndStart: (exercise: ExerciseInfo) => void;
  currentUser?: UserProfile | null;
  onOpenCreateExercise?: () => void;
}

const CATEGORIES: ('All' | ExerciseCategory)[] = [
  'All',
  'Legs',
  'Chest',
  'Core',
  'Arms',
  'Shoulders',
  'Yoga'
];

export const CATEGORY_MAP: Record<string, string> = {
  All: 'Tất cả',
  Legs: 'Chân & Mông',
  Chest: 'Ngực',
  Core: 'Cơ Lõi & Bụng',
  Arms: 'Tay',
  Shoulders: 'Vai',
  Yoga: 'Dẻo Dai & Yoga',
  FullBody: 'Toàn Thân'
};

export const ExerciseLibrary: React.FC<ExerciseLibraryProps> = ({
  onSelectAndStart,
  currentUser,
  onOpenCreateExercise
}) => {
  const [selectedCategory, setSelectedCategory] = useState<'All' | ExerciseCategory>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeModalExercise, setActiveModalExercise] = useState<ExerciseInfo | null>(null);
  const [customExercises, setCustomExercises] = useState<ExerciseInfo[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isCreateOrEditModalOpen, setIsCreateOrEditModalOpen] = useState(false);
  const [editingExercise, setEditingExercise] = useState<ExerciseInfo | null>(null);

  // Fetch exercises 100% from MongoDB Atlas
  const loadExercises = async () => {
    setIsLoading(true);
    try {
      const res = await ApiClient.getExercises();
      if (res && Array.isArray(res)) {
        const formatted: ExerciseInfo[] = res.map(item => ({
          id: (item._id || item.id) as any,
          nameVi: item.nameVi,
          nameEn: item.nameEn,
          category: item.category || 'Legs',
          difficulty: item.difficulty || 'Trung bình',
          caloriesPerMinute: item.caloriesPerMinute || 8,
          targetMuscles: item.targetMuscles || [],
          iconName: item.iconName || 'Dumbbell',
          description: item.description || '',
          keyFormRules: item.keyFormRules || [],
          commonMistakes: item.commonMistakes || [],
          defaultTargetReps: item.defaultTargetReps || 12,
          isHoldExercise: item.isHoldExercise,
          idealHoldDurationSec: item.idealHoldDurationSec,
          cameraAdvice: item.cameraAdvice || 'Đứng cách camera 2-3m để AI quan sát toàn thân.',
          gifUrl: item.gifUrl
        }));
        setCustomExercises(formatted);
      } else {
        setCustomExercises([]);
      }
    } catch {
      setCustomExercises([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadExercises();
  }, []);

  const allExercises = customExercises;

  const handleDeleteExercise = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Bạn có chắc chắn muốn xóa bài tập này khỏi hệ thống không?')) {
      const ok = await ApiClient.deleteExercise(id);
      if (ok) {
        setCustomExercises(prev => prev.filter(item => (item.id as any) !== id));
      }
    }
  };

  const filteredExercises = allExercises.filter(ex => {
    const matchesCategory = selectedCategory === 'All' || ex.category === selectedCategory;
    const matchesSearch =
      ex.nameVi.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ex.nameEn.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ex.targetMuscles.some(m => m.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const isAdmin = currentUser?.role === 'admin' || currentUser?.email === 'luumynhathuy@gmail.com';

  return (
    <div className="mx-auto max-w-[1680px] w-full space-y-6 p-4 sm:p-8 xl:px-12 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-3xl border border-[var(--border-card)] bg-[var(--bg-card)] p-6 sm:p-8 shadow-sm">
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-extrabold uppercase tracking-wider text-[#ca8a04] dark:text-[#eab308]">
              DANH MỤC ĐỘNG TÁC THỂ THAO
            </span>
            {isAdmin && (
              <span className="flex items-center space-x-1 rounded-full bg-[#eab308] text-neutral-950 px-2 py-0.5 text-[10px] font-black uppercase font-mono">
                <Crown className="h-3 w-3 inline" />
                <span>ADMIN STUDIO</span>
              </span>
            )}
          </div>
          <h1 className="font-heading text-3xl sm:text-4xl font-extrabold text-[var(--text-primary)]">
            Thư Viện Bài Tập AI FitCoach
          </h1>
          <p className="text-xs text-[var(--text-muted)] sm:text-sm max-w-2xl leading-relaxed">
            Tất cả các bài tập đều được trang bị ảnh động 3D giải phẫu cơ bắp và góc chuẩn sinh cơ học, giúp bạn dễ dàng hình dung kỹ thuật trước khi tập.
          </p>
        </div>

        {/* Admin Create Exercise Action Button */}
        {isAdmin && (
          <button
            onClick={() => {
              setEditingExercise(null);
              setIsCreateOrEditModalOpen(true);
            }}
            className="flex items-center justify-center space-x-2 rounded-2xl bg-[#eab308] hover:bg-[#ca8a04] text-neutral-950 px-5 py-3 text-xs font-bold transition-all shadow-lg hover:shadow-[#eab308]/25 cursor-pointer flex-shrink-0"
          >
            <Sparkles className="h-4 w-4" />
            <span>+ Tạo Bài Tập Mới (Admin)</span>
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Category Pills */}
        <div className="flex items-center space-x-2 overflow-x-auto w-full sm:w-auto pb-1 scrollbar-none">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`flex-shrink-0 rounded-xl px-4 py-2 text-xs font-bold transition-all cursor-pointer ${
                selectedCategory === cat
                  ? 'btn-kinpaku text-[#1c1917]'
                  : 'bg-[var(--bg-card)] text-[var(--text-muted)] hover:text-[var(--text-primary)] border border-[var(--border-subtle)]'
              }`}
            >
              {CATEGORY_MAP[cat] || cat}
            </button>
          ))}
        </div>

        {/* Search Bar */}
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-muted)]" />
          <input
            type="text"
            placeholder="Tìm kiếm bài tập, nhóm cơ..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] pl-10 pr-4 py-2.5 text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none focus:border-[#eab308]/60 transition-colors"
          />
        </div>
      </div>

      {/* Loading Skeleton */}
      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
            <div
              key={i}
              className="flex flex-col justify-between overflow-hidden rounded-3xl border border-[var(--border-card)] bg-[var(--bg-card)] p-5 animate-pulse space-y-4"
            >
              <div className="aspect-[4/3] w-full rounded-2xl bg-neutral-200 dark:bg-neutral-800" />
              <div className="space-y-2">
                <div className="h-4 w-1/3 rounded bg-neutral-200 dark:bg-neutral-800" />
                <div className="h-5 w-3/4 rounded bg-neutral-200 dark:bg-neutral-800" />
                <div className="h-3 w-full rounded bg-neutral-200 dark:bg-neutral-800" />
              </div>
              <div className="h-9 w-full rounded-xl bg-neutral-200 dark:bg-neutral-800" />
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && filteredExercises.length === 0 && (
        <div className="text-center py-16 space-y-3 rounded-3xl border border-[var(--border-card)] bg-[var(--bg-card)] p-8">
          <Target className="h-12 w-12 mx-auto text-[var(--text-muted)] animate-bounce" />
          <h3 className="font-heading text-lg font-bold text-[var(--text-primary)]">
            Không tìm thấy bài tập phù hợp
          </h3>
          <p className="text-xs text-[var(--text-muted)] max-w-md mx-auto">
            Không có bài tập nào trên MongoDB Atlas khớp với từ khóa tìm kiếm hoặc danh mục đã chọn.
          </p>
        </div>
      )}

      {/* Exercise Grid from MongoDB Atlas */}
      {!isLoading && filteredExercises.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filteredExercises.map(exercise => {
            return (
              <div
                key={exercise.id}
                onClick={() => setActiveModalExercise(exercise)}
                className="group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-[var(--border-card)] bg-[var(--bg-card)] p-5 transition-all duration-200 hover:-translate-y-1 hover:border-[#eab308]/50 hover:shadow-xl cursor-pointer"
              >
              {/* Exercise 3D/Anatomical Animation */}
              <div className="relative mb-4 aspect-[4/3] w-full overflow-hidden rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface-inset)]">
                <ExerciseAnimation
                  exerciseId={exercise.id}
                  exerciseName={exercise.nameVi || exercise.nameEn}
                  gifUrl={exercise.gifUrl}
                  size="full"
                  className="h-full w-full object-contain transition-transform duration-300 group-hover:scale-105"
                />

                {/* Badge Category & Difficulty */}
                <div className="absolute top-2.5 left-2.5 flex items-center space-x-1.5">
                  <span className="rounded-lg bg-black/60 px-2 py-0.5 text-[10px] font-bold text-white backdrop-blur-md">
                    {CATEGORY_MAP[exercise.category] || exercise.category}
                  </span>
                  <span
                    className={`rounded-lg px-2 py-0.5 text-[10px] font-bold backdrop-blur-md ${
                      exercise.difficulty === 'Dễ'
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : exercise.difficulty === 'Trung bình'
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                    }`}
                  >
                    {exercise.difficulty}
                  </span>
                </div>

                {/* Admin Actions: Edit & Delete Buttons */}
                {isAdmin && (
                  <div className="absolute top-2.5 right-2.5 flex items-center space-x-1.5 z-20">
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        setEditingExercise(exercise);
                        setIsCreateOrEditModalOpen(true);
                      }}
                      title="Chỉnh sửa bài tập (Admin)"
                      className="rounded-lg bg-[#eab308] hover:bg-[#ca8a04] p-1.5 text-neutral-950 transition-all shadow-md cursor-pointer font-bold"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>

                    <button
                      onClick={e => handleDeleteExercise(exercise.id as any, e)}
                      title="Xóa bài tập (Admin)"
                      className="rounded-lg bg-rose-500/85 hover:bg-rose-600 p-1.5 text-white transition-all shadow-md cursor-pointer"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
              </div>

              {/* Information */}
              <div className="space-y-3">
                <div>
                  <h3 className="font-heading text-lg font-bold text-[var(--text-primary)] group-hover:text-[#ca8a04] dark:group-hover:text-[#eab308] transition-colors line-clamp-1">
                    {exercise.nameVi}
                  </h3>
                  <p className="text-xs text-[var(--text-muted)]">{exercise.nameEn}</p>
                </div>

                {/* Target Muscle Pills */}
                <div className="flex flex-wrap gap-1">
                  {exercise.targetMuscles.slice(0, 3).map((muscle, idx) => (
                    <span
                      key={idx}
                      className="rounded-md bg-[var(--bg-surface-inset)] px-2 py-0.5 text-[10px] font-medium text-[var(--text-secondary)] border border-[var(--border-subtle)]"
                    >
                      {muscle}
                    </span>
                  ))}
                </div>

                {/* Key Metrics Bar */}
                <div className="flex items-center justify-between border-t border-[var(--border-subtle)] pt-3 text-xs text-[var(--text-muted)]">
                  <div className="flex items-center space-x-1">
                    <Flame className="h-3.5 w-3.5 text-[#0d9488]" />
                    <span>~{exercise.caloriesPerMinute} kcal/p</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Target className="h-3.5 w-3.5 text-[#ca8a04] dark:text-[#eab308]" />
                    <span>
                      {exercise.isHoldExercise
                        ? `${exercise.idealHoldDurationSec || 30}s`
                        : `${exercise.defaultTargetReps} reps`}
                    </span>
                  </div>
                </div>
              </div>

              {/* Start Workout Button */}
              <div className="mt-4 pt-2">
                <button
                  onClick={e => {
                    e.stopPropagation();
                    onSelectAndStart(exercise);
                  }}
                  className="w-full flex items-center justify-center space-x-2 rounded-2xl bg-[#eab308] hover:bg-[#ca8a04] text-neutral-950 py-2.5 text-xs font-bold transition-all shadow-md hover:shadow-[#eab308]/20 cursor-pointer"
                >
                  <Play className="h-3.5 w-3.5 fill-current" />
                  <span>Bắt Đầu Tập Ngay</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
      )}

      {/* Modal Detailed Exercise Guide */}
      {activeModalExercise && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-xl max-h-[85vh] overflow-y-auto rounded-3xl border border-[var(--border-card)] bg-[var(--bg-card)] p-6 sm:p-8 shadow-2xl space-y-5 text-[var(--text-primary)]">
            <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
              <div>
                <h2 className="font-heading text-2xl font-bold">{activeModalExercise.nameVi}</h2>
                <p className="text-xs text-[var(--text-muted)]">{activeModalExercise.nameEn}</p>
              </div>
              <button
                onClick={() => setActiveModalExercise(null)}
                className="rounded-xl p-2 text-[var(--text-muted)] hover:bg-[var(--bg-surface-inset)] cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Animation preview */}
            <div className="w-full h-64 sm:h-80 overflow-hidden rounded-2xl border border-[var(--border-subtle)] bg-white dark:bg-neutral-900 flex items-center justify-center p-2 shadow-inner">
              <ExerciseAnimation
                exerciseId={activeModalExercise.id}
                exerciseName={activeModalExercise.nameVi || activeModalExercise.nameEn}
                gifUrl={activeModalExercise.gifUrl}
                size="full"
                className="h-full w-full object-contain"
              />
            </div>

            {/* Description */}
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              {activeModalExercise.description}
            </p>

            {/* Key Form Rules */}
            <div className="space-y-2 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 p-4 text-xs">
              <div className="flex items-center space-x-1.5 font-bold text-emerald-500">
                <ShieldCheck className="h-4 w-4" />
                <span>Quy Tắc Chuẩn Form:</span>
              </div>
              <ul className="list-disc list-inside space-y-1 text-[var(--text-primary)]">
                {activeModalExercise.keyFormRules.map((rule, idx) => (
                  <li key={idx}>{rule}</li>
                ))}
              </ul>
            </div>

            {/* Common Mistakes */}
            <div className="space-y-2 rounded-2xl bg-rose-500/10 border border-rose-500/20 p-4 text-xs">
              <div className="flex items-center space-x-1.5 font-bold text-rose-500">
                <AlertCircle className="h-4 w-4" />
                <span>Lỗi Sai Cần Tránh:</span>
              </div>
              <ul className="list-disc list-inside space-y-1 text-[var(--text-primary)]">
                {activeModalExercise.commonMistakes.map((mistake, idx) => (
                  <li key={idx}>{mistake}</li>
                ))}
              </ul>
            </div>

            {/* Action CTAs */}
            <div className="space-y-2 pt-2">
              <button
                onClick={() => {
                  const ex = activeModalExercise;
                  setActiveModalExercise(null);
                  onSelectAndStart(ex);
                }}
                className="w-full flex items-center justify-center space-x-2 rounded-2xl bg-[#eab308] hover:bg-[#ca8a04] text-neutral-950 py-3 text-xs font-bold transition-all shadow-lg cursor-pointer"
              >
                <Play className="h-4 w-4 fill-current" />
                <span>Vào Studio Quét Tư Thế &amp; Đếm Rep</span>
              </button>

              {isAdmin && (
                <button
                  onClick={() => {
                    const ex = activeModalExercise;
                    setActiveModalExercise(null);
                    setEditingExercise(ex);
                    setIsCreateOrEditModalOpen(true);
                  }}
                  className="w-full flex items-center justify-center space-x-2 rounded-2xl border border-[#eab308]/60 bg-[#eab308]/10 hover:bg-[#eab308]/20 text-[#ca8a04] dark:text-[#eab308] py-2.5 text-xs font-bold transition-all cursor-pointer"
                >
                  <Pencil className="h-3.5 w-3.5" />
                  <span>Chỉnh Sửa Thông Số Bài Tập Này (Admin)</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Create / Edit Exercise Modal */}
      <CreateExerciseModal
        isOpen={isCreateOrEditModalOpen}
        onClose={() => {
          setIsCreateOrEditModalOpen(false);
          setEditingExercise(null);
        }}
        exerciseToEdit={editingExercise}
        onExerciseCreated={() => {
          loadExercises();
        }}
      />
    </div>
  );
};
