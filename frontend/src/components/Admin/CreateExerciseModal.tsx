import React, { useState, useRef } from 'react';
import {
  X,
  Plus,
  Dumbbell,
  Sparkles,
  Flame,
  Zap,
  Activity,
  CheckCircle2,
  AlertCircle,
  Camera,
  Upload,
  FileImage,
  Link,
  Trash2,
  FolderOpen
} from 'lucide-react';
import { ApiClient } from '../../services/apiClient';

interface CreateExerciseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExerciseCreated: (exercise: any) => void;
  exerciseToEdit?: any | null;
}

export const CreateExerciseModal: React.FC<CreateExerciseModalProps> = ({
  isOpen,
  onClose,
  onExerciseCreated,
  exerciseToEdit
}) => {
  const isEditMode = !!exerciseToEdit;

  const [nameVi, setNameVi] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [category, setCategory] = useState<'Legs' | 'Chest' | 'Core' | 'Arms' | 'Shoulders' | 'Yoga' | 'FullBody'>('Legs');
  const [difficulty, setDifficulty] = useState<'Dễ' | 'Trung bình' | 'Nâng cao'>('Trung bình');
  const [caloriesPerMinute, setCaloriesPerMinute] = useState(8);
  const [defaultTargetReps, setDefaultTargetReps] = useState(12);
  const [isHoldExercise, setIsHoldExercise] = useState(false);
  const [idealHoldDurationSec, setIdealHoldDurationSec] = useState(30);
  const [targetMuscles, setTargetMuscles] = useState('Đùi trước, Mông, Cơ lõi');
  const [iconName, setIconName] = useState('Dumbbell');
  const [description, setDescription] = useState('');
  const [keyFormRules, setKeyFormRules] = useState(
    '1. Giữ lưng thẳng tự nhiên\n2. Siết chặt cơ lõi khi thực hiện\n3. Hít vào khi hạ xuống, thở ra khi phát lực'
  );
  const [commonMistakes, setCommonMistakes] = useState(
    '1. Cong hoặc gập thắt lưng\n2. Chụm khớp sai hướng\n3. Thở không đều'
  );
  const [cameraAdvice, setCameraAdvice] = useState('Đứng cách camera 2-3m để AI nhận diện toàn bộ cơ thể theo góc nghiêng 45 độ.');

  // Media upload states
  const [mediaSource, setMediaSource] = useState<'upload' | 'url'>('url');
  const [gifUrl, setGifUrl] = useState('');
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [uploadedFileSize, setUploadedFileSize] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // AI Biomechanics threshold configs
  const [primaryAngle, setPrimaryAngle] = useState('leftKnee');
  const [minAngle, setMinAngle] = useState(75);
  const [maxAngle, setMaxAngle] = useState(165);
  const [repThresholdDown, setRepThresholdDown] = useState(90);
  const [repThresholdUp, setRepThresholdUp] = useState(155);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Populate data when editing an existing exercise
  React.useEffect(() => {
    if (exerciseToEdit) {
      setNameVi(exerciseToEdit.nameVi || '');
      setNameEn(exerciseToEdit.nameEn || '');
      setCategory(exerciseToEdit.category || 'Legs');
      setDifficulty(exerciseToEdit.difficulty || 'Trung bình');
      setCaloriesPerMinute(exerciseToEdit.caloriesPerMinute || 8);
      setDefaultTargetReps(exerciseToEdit.defaultTargetReps || 12);
      setIsHoldExercise(!!exerciseToEdit.isHoldExercise);
      setIdealHoldDurationSec(exerciseToEdit.idealHoldDurationSec || 30);
      setTargetMuscles(
        Array.isArray(exerciseToEdit.targetMuscles)
          ? exerciseToEdit.targetMuscles.join(', ')
          : exerciseToEdit.targetMuscles || ''
      );
      setIconName(exerciseToEdit.iconName || 'Dumbbell');
      setDescription(exerciseToEdit.description || '');
      setKeyFormRules(
        Array.isArray(exerciseToEdit.keyFormRules)
          ? exerciseToEdit.keyFormRules.join('\n')
          : exerciseToEdit.keyFormRules || ''
      );
      setCommonMistakes(
        Array.isArray(exerciseToEdit.commonMistakes)
          ? exerciseToEdit.commonMistakes.join('\n')
          : exerciseToEdit.commonMistakes || ''
      );
      setCameraAdvice(exerciseToEdit.cameraAdvice || '');
      setGifUrl(exerciseToEdit.gifUrl || '');
      setUploadedFileName(exerciseToEdit.gifUrl ? 'Đang dùng ảnh động hiện tại' : null);
      if (exerciseToEdit.customBiomechanics) {
        setPrimaryAngle(exerciseToEdit.customBiomechanics.primaryAngle || 'leftKnee');
        setMinAngle(exerciseToEdit.customBiomechanics.minAngle || 75);
        setMaxAngle(exerciseToEdit.customBiomechanics.maxAngle || 165);
        setRepThresholdDown(exerciseToEdit.customBiomechanics.repThresholdDown || 90);
        setRepThresholdUp(exerciseToEdit.customBiomechanics.repThresholdUp || 155);
      }
    } else {
      // Reset form to defaults
      setNameVi('');
      setNameEn('');
      setCategory('Legs');
      setDifficulty('Trung bình');
      setCaloriesPerMinute(8);
      setDefaultTargetReps(12);
      setIsHoldExercise(false);
      setIdealHoldDurationSec(30);
      setTargetMuscles('Đùi trước, Mông, Cơ lõi');
      setIconName('Dumbbell');
      setDescription('');
      setKeyFormRules('1. Giữ lưng thẳng tự nhiên\n2. Siết chặt cơ lõi khi thực hiện\n3. Hít vào khi hạ xuống, thở ra khi phát lực');
      setCommonMistakes('1. Cong hoặc gập thắt lưng\n2. Chụm khớp sai hướng\n3. Thở không đều');
      setCameraAdvice('Đứng cách camera 2-3m để AI nhận diện toàn bộ cơ thể theo góc nghiêng 45 độ.');
      setGifUrl('');
      setUploadedFileName(null);
    }
    setErrorMessage(null);
    setSuccessMessage(null);
  }, [exerciseToEdit, isOpen]);

  if (!isOpen) return null;

  // Handle file selection from File Explorer
  const handleFileChange = (file: File) => {
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMessage('Vui lòng chọn tệp hình ảnh hoặc ảnh động GIF.');
      return;
    }

    // Format size
    const sizeInMb = (file.size / (1024 * 1024)).toFixed(2);
    const sizeStr = file.size > 1024 * 1024 ? `${sizeInMb} MB` : `${(file.size / 1024).toFixed(0)} KB`;
    setUploadedFileName(file.name);
    setUploadedFileSize(sizeStr);
    setErrorMessage(null);

    const reader = new FileReader();
    reader.onload = e => {
      const result = e.target?.result as string;
      setGifUrl(result);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleClearMedia = () => {
    setGifUrl('');
    setUploadedFileName(null);
    setUploadedFileSize(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!nameVi || !nameEn) {
      setErrorMessage('Vui lòng nhập đầy đủ tên bài tập tiếng Việt và tiếng Anh.');
      return;
    }

    setIsLoading(true);
    try {
      const exercisePayload = {
        nameVi,
        nameEn,
        category,
        difficulty,
        caloriesPerMinute: Number(caloriesPerMinute) || 8,
        defaultTargetReps: Number(defaultTargetReps) || 12,
        isHoldExercise,
        idealHoldDurationSec: Number(idealHoldDurationSec) || 30,
        targetMuscles: targetMuscles.split(',').map(s => s.trim()).filter(Boolean),
        iconName,
        description,
        keyFormRules: keyFormRules.split('\n').map(s => s.trim()).filter(Boolean),
        commonMistakes: commonMistakes.split('\n').map(s => s.trim()).filter(Boolean),
        cameraAdvice,
        gifUrl: gifUrl.trim() || undefined,
        customBiomechanics: {
          primaryAngle,
          minAngle: Number(minAngle) || 75,
          maxAngle: Number(maxAngle) || 165,
          repThresholdDown: Number(repThresholdDown) || 90,
          repThresholdUp: Number(repThresholdUp) || 155
        }
      };

      if (isEditMode) {
        const id = exerciseToEdit._id || exerciseToEdit.id;
        const res = await ApiClient.updateExercise(id, exercisePayload);
        if (res) {
          setSuccessMessage(`Đã cập nhật bài tập "${nameVi}" thành công trên MongoDB Atlas!`);
          setTimeout(() => {
            onExerciseCreated(res);
            onClose();
          }, 800);
        } else {
          setErrorMessage('Không thể cập nhật bài tập. Vui lòng kiểm tra quyền Admin.');
        }
      } else {
        const res = await ApiClient.createExercise(exercisePayload);
        if (res) {
          setSuccessMessage(`Đã tạo thành công bài tập "${nameVi}" lên hệ thống AI FitCoach & MongoDB Atlas!`);
          setTimeout(() => {
            onExerciseCreated(res);
            onClose();
          }, 800);
        } else {
          setErrorMessage('Không thể tạo bài tập. Vui lòng kiểm tra quyền Admin.');
        }
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Lỗi khi lưu bài tập.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl border border-[var(--border-card)] bg-[var(--bg-card)] p-6 sm:p-8 shadow-2xl space-y-6 text-[var(--text-primary)]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-4">
          <div className="flex items-center space-x-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#eab308]/20 text-[#ca8a04] dark:text-[#eab308] border border-[#eab308]/30 shadow-md">
              <Sparkles className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="font-heading text-xl font-bold tracking-tight">
                  {isEditMode ? 'Chỉnh Sửa Bài Tập AI FitCoach' : 'Tạo Bài Tập AI FitCoach Mới'}
                </h2>
                <span className="rounded-full bg-[#eab308] text-neutral-950 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider font-mono">
                  ADMIN STUDIO
                </span>
              </div>
              <p className="text-xs text-[var(--text-muted)]">
                {isEditMode
                  ? 'Cập nhật thông số sinh cơ học, luật form và ảnh động bài tập.'
                  : 'Thiết lập chuyển động, góc độ nhận diện AI và ảnh động trực quan.'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl p-2 text-[var(--text-muted)] hover:bg-[var(--bg-surface-inset)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Alerts */}
        {errorMessage && (
          <div className="flex items-center space-x-2 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-3.5 text-xs font-medium text-rose-600 dark:text-rose-400">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="flex items-center space-x-2 rounded-2xl border border-[#0d9488]/30 bg-[#0d9488]/10 p-3.5 text-xs font-medium text-[#0d9488]">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5 text-xs">
          {/* Section 1: Basic Info */}
          <div className="space-y-3">
            <h3 className="font-bold text-sm text-[var(--text-primary)] flex items-center space-x-2 border-b border-[var(--border-subtle)] pb-2">
              <Dumbbell className="h-4 w-4 text-[#ca8a04] dark:text-[#eab308]" />
              <span>1. Thông Tin Cơ Bản Của Bài Tập</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-bold text-[var(--text-secondary)]">Tên tiếng Việt *</label>
                <input
                  type="text"
                  required
                  value={nameVi}
                  onChange={e => setNameVi(e.target.value)}
                  placeholder="vd: Bulgarian Split Squat (Squat 1 Chân)"
                  className="w-full rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface-inset)] px-3.5 py-2.5 text-xs text-[var(--text-primary)] outline-none focus:border-[#eab308]/60 transition-colors"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-[var(--text-secondary)]">Tên tiếng Anh *</label>
                <input
                  type="text"
                  required
                  value={nameEn}
                  onChange={e => setNameEn(e.target.value)}
                  placeholder="vd: Bulgarian Split Squat"
                  className="w-full rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface-inset)] px-3.5 py-2.5 text-xs text-[var(--text-primary)] outline-none focus:border-[#eab308]/60 transition-colors"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="font-bold text-[var(--text-secondary)]">Nhóm cơ (Category)</label>
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value as any)}
                  className="w-full rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface-inset)] px-3 py-2 text-xs font-semibold text-[var(--text-primary)] outline-none cursor-pointer"
                >
                  <option value="Legs">Chân &amp; Mông (Legs)</option>
                  <option value="Chest">Ngực (Chest)</option>
                  <option value="Core">Cơ Lõi &amp; Bụng (Core)</option>
                  <option value="Arms">Tay Trước &amp; Sau (Arms)</option>
                  <option value="Shoulders">Vai (Shoulders)</option>
                  <option value="Yoga">Dẻo Dai &amp; Yoga</option>
                  <option value="FullBody">Toàn Thân (FullBody)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-[var(--text-secondary)]">Độ khó</label>
                <select
                  value={difficulty}
                  onChange={e => setDifficulty(e.target.value as any)}
                  className="w-full rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface-inset)] px-3 py-2 text-xs font-semibold text-[var(--text-primary)] outline-none cursor-pointer"
                >
                  <option value="Dễ">Dễ (Người mới)</option>
                  <option value="Trung bình">Trung bình</option>
                  <option value="Nâng cao">Nâng cao</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-[var(--text-secondary)]">Calo tiêu hao (kcal/phút)</label>
                <input
                  type="number"
                  min="1"
                  max="30"
                  value={caloriesPerMinute}
                  onChange={e => setCaloriesPerMinute(Number(e.target.value) || 8)}
                  className="w-full rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface-inset)] px-3 py-2 text-xs text-[var(--text-primary)] outline-none focus:border-[#eab308]/60"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-bold text-[var(--text-secondary)]">Nhóm cơ tác động (cách nhau dấu phẩy)</label>
              <input
                type="text"
                value={targetMuscles}
                onChange={e => setTargetMuscles(e.target.value)}
                placeholder="vd: Cơ đùi trước (Quadriceps), Cơ mông (Glutes), Cơ lõi"
                className="w-full rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface-inset)] px-3.5 py-2 text-xs text-[var(--text-primary)] outline-none focus:border-[#eab308]/60"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-[var(--text-secondary)]">Mô tả bài tập</label>
              <textarea
                rows={2}
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="vd: Bài tập cô lập một chân phát triển sức mạnh và độ thăng bằng khớp gối..."
                className="w-full rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface-inset)] px-3.5 py-2 text-xs text-[var(--text-primary)] outline-none focus:border-[#eab308]/60 resize-none"
              />
            </div>

            {/* ẢNH ĐỘNG GIF / FILE EXPLORER UPLOAD */}
            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between">
                <label className="font-bold text-[var(--text-secondary)] flex items-center space-x-1.5">
                  <FileImage className="h-4 w-4 text-[#ca8a04] dark:text-[#eab308]" />
                  <span>Ảnh Động GIF Hướng Dẫn Kỹ Thuật (3D Animation)</span>
                </label>

                {/* Tab Switcher: File Explorer vs URL */}
                <div className="flex items-center space-x-1 rounded-xl bg-[var(--bg-surface-inset)] p-1 text-[11px] font-bold">
                  <button
                    type="button"
                    onClick={() => setMediaSource('upload')}
                    className={`flex items-center space-x-1 rounded-lg px-2.5 py-1 transition-all cursor-pointer ${
                      mediaSource === 'upload'
                        ? 'bg-[#eab308] text-neutral-950 shadow-xs font-extrabold'
                        : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                    }`}
                  >
                    <FolderOpen className="h-3 w-3" />
                    <span>File Explorer</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setMediaSource('url')}
                    className={`flex items-center space-x-1 rounded-lg px-2.5 py-1 transition-all cursor-pointer ${
                      mediaSource === 'url'
                        ? 'bg-[#eab308] text-neutral-950 shadow-xs font-extrabold'
                        : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                    }`}
                  >
                    <Link className="h-3 w-3" />
                    <span>Link URL</span>
                  </button>
                </div>
              </div>

              {/* Upload Mode: File Explorer Drag & Drop */}
              {mediaSource === 'upload' ? (
                <div>
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/gif,image/png,image/jpeg,image/webp"
                    onChange={e => {
                      if (e.target.files && e.target.files.length > 0) {
                        handleFileChange(e.target.files[0]);
                      }
                    }}
                    className="hidden"
                  />

                  {!gifUrl ? (
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      onDragOver={e => {
                        e.preventDefault();
                        setIsDragging(true);
                      }}
                      onDragLeave={() => setIsDragging(false)}
                      onDrop={handleDrop}
                      className={`flex flex-col items-center justify-center rounded-3xl border-2 border-dashed p-6 text-center transition-all cursor-pointer ${
                        isDragging
                          ? 'border-[#eab308] bg-[#eab308]/10'
                          : 'border-[var(--border-subtle)] bg-[var(--bg-surface-inset)] hover:border-[#eab308]/50 hover:bg-[var(--bg-card)]'
                      }`}
                    >
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#eab308]/15 text-[#ca8a04] dark:text-[#eab308] mb-2 shadow-xs">
                        <Upload className="h-6 w-6" />
                      </div>
                      <p className="font-bold text-xs text-[var(--text-primary)]">
                        Bấm để chọn tệp GIF từ máy tính (File Explorer)
                      </p>
                      <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
                        Hoặc kéo thả tệp .gif / .png / .jpg vào đây
                      </p>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between rounded-2xl border border-[var(--border-subtle)] bg-white dark:bg-neutral-900 p-3 shadow-xs">
                      <div className="flex items-center space-x-3 min-w-0">
                        <img
                          src={gifUrl}
                          alt="Uploaded GIF preview"
                          className="h-16 w-16 rounded-xl object-contain mix-blend-multiply dark:mix-blend-normal bg-neutral-50 dark:bg-neutral-800 border border-[var(--border-subtle)] shrink-0"
                        />
                        <div className="min-w-0 text-left">
                          <p className="font-bold text-xs text-[var(--text-primary)] truncate max-w-[240px]">
                            {uploadedFileName || 'Ảnh động GIF bài tập'}
                          </p>
                          <p className="text-[10px] text-[#0d9488] font-mono mt-0.5">
                            {uploadedFileSize || 'Đã tải lên sẵn sàng'} • 3D Animation
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface-inset)] hover:bg-[var(--bg-card)] px-2.5 py-1.5 text-[11px] font-bold text-[var(--text-primary)] transition-all cursor-pointer"
                        >
                          Đổi tệp
                        </button>
                        <button
                          type="button"
                          onClick={handleClearMedia}
                          className="rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 p-1.5 transition-colors cursor-pointer"
                          title="Xóa tệp"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* URL Input Mode */
                <div className="space-y-2">
                  <input
                    type="url"
                    value={gifUrl}
                    onChange={e => {
                      setGifUrl(e.target.value);
                      setUploadedFileName('URL Link trực tiếp');
                    }}
                    placeholder="https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/..."
                    className="w-full rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface-inset)] px-3.5 py-2 text-xs text-[var(--text-primary)] outline-none focus:border-[#eab308]/60 font-mono"
                  />

                  {/* Quick Dataset Presets */}
                  <div className="space-y-1">
                    <span className="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-wider flex items-center space-x-1">
                      <Zap className="h-3 w-3 text-[#ca8a04] dark:text-[#eab308]" />
                      <span>Gợi ý ảnh động chuẩn từ Gym Dataset (1-chạm để chọn):</span>
                    </span>
                    <div className="flex flex-wrap gap-1.5 pt-0.5">
                      {[
                        { label: 'Barbell RDL (Đùi sau & Mông)', url: 'https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1756-gEyURal.gif' },
                        { label: 'Barbell Deadlift', url: 'https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0032-ila4NZS.gif' },
                        { label: 'Dumbbell RDL', url: 'https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1459-rR0LJzx.gif' },
                        { label: 'Stiff-Leg Deadlift', url: 'https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0116-hrVQWvE.gif' },
                        { label: 'Dumbbell Bench Press', url: 'https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0014-r7cT9YD.gif' },
                        { label: 'Dumbbell Hammer Curl', url: 'https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0300-nUwVh7b.gif' }
                      ].map((preset, pIdx) => (
                        <button
                          key={pIdx}
                          type="button"
                          onClick={() => {
                            setGifUrl(preset.url);
                            setUploadedFileName(preset.label);
                          }}
                          className={`rounded-lg px-2 py-1 text-[10px] font-semibold border transition-all cursor-pointer ${
                            gifUrl === preset.url
                              ? 'bg-[#eab308] text-neutral-950 border-[#ca8a04] font-bold shadow-xs'
                              : 'bg-[var(--bg-surface-inset)] text-[var(--text-secondary)] border-[var(--border-subtle)] hover:border-[#eab308]/50 hover:text-[var(--text-primary)]'
                          }`}
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {gifUrl && (
                    <div className="flex items-center space-x-3 rounded-2xl border border-[var(--border-subtle)] bg-white dark:bg-neutral-900 p-2">
                      <img
                        src={gifUrl}
                        alt="Preview GIF"
                        className="h-14 w-14 rounded-xl object-contain mix-blend-multiply dark:mix-blend-normal"
                        onError={e => {
                          (e.target as any).style.display = 'none';
                        }}
                      />
                      <div className="text-[11px] text-[var(--text-muted)] min-w-0">
                        <p className="font-bold text-[var(--text-primary)]">Xem trước ảnh động bài tập</p>
                        <p className="text-[10px] truncate max-w-xs">{gifUrl}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Section 2: AI Biomechanics Rule Configuration */}
          <div className="space-y-3 pt-2">
            <h3 className="font-bold text-sm text-[var(--text-primary)] flex items-center space-x-2 border-b border-[var(--border-subtle)] pb-2">
              <Activity className="h-4 w-4 text-[#0d9488]" />
              <span>2. Cấu Hình Thuật Toán Sinh Cơ Học AI (AI Biomechanics)</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="font-bold text-[var(--text-secondary)]">Khớp quan sát chính</label>
                <select
                  value={primaryAngle}
                  onChange={e => setPrimaryAngle(e.target.value)}
                  className="w-full rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface-inset)] px-3 py-2 text-xs font-semibold text-[var(--text-primary)] outline-none cursor-pointer"
                >
                  <option value="leftKnee">Gối (Knee Angle)</option>
                  <option value="leftElbow">Khuỷu tay (Elbow Angle)</option>
                  <option value="leftHip">Hông (Hip Angle)</option>
                  <option value="leftShoulder">Khớp vai (Shoulder Angle)</option>
                  <option value="torsoAngle">Độ nghiêng thân người (Torso)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-[var(--text-secondary)]">Ngưỡng góc khi Xuống (Down)</label>
                <input
                  type="number"
                  value={repThresholdDown}
                  onChange={e => setRepThresholdDown(Number(e.target.value) || 90)}
                  placeholder="90"
                  className="w-full rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface-inset)] px-3 py-2 text-xs text-[var(--text-primary)] outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-[var(--text-secondary)]">Ngưỡng góc khi Lên (Up)</label>
                <input
                  type="number"
                  value={repThresholdUp}
                  onChange={e => setRepThresholdUp(Number(e.target.value) || 155)}
                  placeholder="155"
                  className="w-full rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface-inset)] px-3 py-2 text-xs text-[var(--text-primary)] outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-bold text-[var(--text-secondary)]">Quy tắc chuẩn Form (Mỗi dòng 1 ý)</label>
                <textarea
                  rows={3}
                  value={keyFormRules}
                  onChange={e => setKeyFormRules(e.target.value)}
                  className="w-full rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface-inset)] px-3.5 py-2 text-xs text-[var(--text-primary)] outline-none resize-none font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-[var(--text-secondary)]">Lỗi sai phổ biến (Mỗi dòng 1 ý)</label>
                <textarea
                  rows={3}
                  value={commonMistakes}
                  onChange={e => setCommonMistakes(e.target.value)}
                  className="w-full rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface-inset)] px-3.5 py-2 text-xs text-[var(--text-primary)] outline-none resize-none font-mono"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-bold text-[var(--text-secondary)] flex items-center space-x-1">
                <Camera className="h-3.5 w-3.5 text-[#0d9488]" />
                <span>Lời khuyên góc đặt Camera cho người tập</span>
              </label>
              <input
                type="text"
                value={cameraAdvice}
                onChange={e => setCameraAdvice(e.target.value)}
                className="w-full rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface-inset)] px-3.5 py-2 text-xs text-[var(--text-primary)] outline-none"
              />
            </div>
          </div>

          {/* Submit button */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-[var(--border-subtle)]">
            <button
              type="button"
              onClick={onClose}
              className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface-inset)] px-4 py-2.5 text-xs font-bold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
            >
              Hủy Bỏ
            </button>

            <button
              type="submit"
              disabled={isLoading}
              className="flex items-center space-x-2 rounded-2xl bg-[#eab308] hover:bg-[#ca8a04] text-neutral-950 px-6 py-2.5 text-xs font-bold transition-all shadow-lg hover:shadow-[#eab308]/25 cursor-pointer disabled:opacity-50"
            >
              {isLoading ? (
                <span>Đang lưu lên Database...</span>
              ) : (
                <>
                  <Plus className="h-4 w-4" />
                  <span>{isEditMode ? 'Cập Nhật Thay Đổi' : 'Lưu Bài Tập Vào Hệ Thống'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
