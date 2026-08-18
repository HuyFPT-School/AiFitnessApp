import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  Camera,
  CameraOff,
  FlipHorizontal,
  Play,
  Square,
  Sparkles,
  Info,
  ChevronRight,
  ShieldCheck,
  Video,
  Check,
  X,
  Dumbbell
} from 'lucide-react';
import { ExerciseInfo, AnalysisFeedback, WorkoutSessionSummary } from '../../types';
import { poseEngine } from '../../engine/poseEngine';
import { BiomechanicsEngine } from '../../engine/biomechanics';
import { audioCoach } from '../../engine/audioCoach';
import { WorkoutMetrics } from './WorkoutMetrics';
import { RealtimeFeedbackBadge } from './RealtimeFeedbackBadge';
import { WorkoutCompleteModal } from './WorkoutCompleteModal';
import { ExerciseAnimation } from '../Common/ExerciseAnimation';
import { CATEGORY_MAP } from '../ExerciseLibrary/ExerciseLibrary';

interface CameraViewProps {
  selectedExercise?: ExerciseInfo;
  onSelectExercise: (ex: ExerciseInfo) => void;
  onOpenAiCoach: () => void;
  availableExercises?: ExerciseInfo[];
}

export const CameraView: React.FC<CameraViewProps> = ({
  selectedExercise: initialSelectedExercise,
  onSelectExercise,
  onOpenAiCoach,
  availableExercises = []
}) => {
  const selectedExercise = initialSelectedExercise || (availableExercises.length > 0 ? availableExercises[0] : null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number | null>(null);
  const biomechanicsRef = useRef<BiomechanicsEngine | null>(
    selectedExercise ? new BiomechanicsEngine(selectedExercise.id) : null
  );

  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isModelLoading, setIsModelLoading] = useState(false);
  const [isWorkoutActive, setIsWorkoutActive] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<AnalysisFeedback | null>(null);
  const [durationSeconds, setDurationSeconds] = useState(0);
  const [isMirrored, setIsMirrored] = useState(true);
  const [fps, setFps] = useState(0);
  const [completedSession, setCompletedSession] = useState<WorkoutSessionSummary | null>(null);
  const [isCompleteModalOpen, setIsCompleteModalOpen] = useState(false);

  const isWorkoutActiveRef = useRef(false);
  const fpsFramesRef = useRef<number[]>([]);
  const timerIntervalRef = useRef<number | null>(null);

  useEffect(() => {
    isWorkoutActiveRef.current = isWorkoutActive;
  }, [isWorkoutActive]);

  // Sync exercise change with BiomechanicsEngine
  useEffect(() => {
    if (!selectedExercise) return;
    if (!biomechanicsRef.current) {
      biomechanicsRef.current = new BiomechanicsEngine(selectedExercise.id);
    } else {
      biomechanicsRef.current.setExercise(selectedExercise.id);
      biomechanicsRef.current.reset();
    }
    setFeedback(null);
    setDurationSeconds(0);
    setIsWorkoutActive(false);
  }, [selectedExercise]);

  // Start / Stop Camera Stream
  const startCamera = async () => {
    try {
      setIsModelLoading(true);
      await poseEngine.initialize();

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        },
        audio: false
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setIsCameraActive(true);
      }
    } catch (err) {
      console.error('Camera access error:', err);
      alert('Không thể mở Camera. Vui lòng cho phép quyền truy cập máy ảnh trong trình duyệt.');
    } finally {
      setIsModelLoading(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    if (requestRef.current) {
      cancelAnimationFrame(requestRef.current);
      requestRef.current = null;
    }
    setIsCameraActive(false);
    stopWorkout();
  };

  const handleStartWorkoutWithCountdown = () => {
    setCountdown(3);
    audioCoach.playCountdownBeep(false);

    let current = 3;
    const interval = setInterval(() => {
      current--;
      if (current > 0) {
        setCountdown(current);
        audioCoach.playCountdownBeep(false);
      } else {
        clearInterval(interval);
        setCountdown(null);
        audioCoach.playCountdownBeep(true);
        startWorkout();
      }
    }, 1000);
  };

  const startWorkout = () => {
    if (!selectedExercise) return;
    biomechanicsRef.current?.reset();
    setDurationSeconds(0);
    setIsWorkoutActive(true);
    audioCoach.speak(`Bắt đầu tập ${selectedExercise.nameVi}!`, true);

    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    timerIntervalRef.current = window.setInterval(() => {
      setDurationSeconds(prev => prev + 1);
    }, 1000);
  };

  const stopWorkout = useCallback(() => {
    if (!isWorkoutActive || !selectedExercise) return;
    setIsWorkoutActive(false);

    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }

    const reps = selectedExercise.isHoldExercise
      ? biomechanicsRef.current?.getHoldSeconds() || 0
      : biomechanicsRef.current?.getRepCount() || 0;

    const avgAccuracy = biomechanicsRef.current?.getAverageAccuracy() || 0;
    const mistakes = biomechanicsRef.current?.getAllMistakes() || [];
    const records = biomechanicsRef.current?.getRepRecords() || [];

    // Capture snapshot for analysis
    let snapshotBase64: string | undefined;
    if (videoRef.current && canvasRef.current) {
      try {
        snapshotBase64 = canvasRef.current.toDataURL('image/jpeg', 0.8);
      } catch {
        // Ignore
      }
    }

    const summary: WorkoutSessionSummary = {
      exerciseId: selectedExercise.id,
      exerciseName: selectedExercise.nameVi,
      reps,
      durationSeconds,
      accuracyScore: avgAccuracy,
      mistakes,
      repRecords: records,
      snapshotBase64
    };

    setCompletedSession(summary);
    setIsCompleteModalOpen(true);
  }, [isWorkoutActive, selectedExercise, durationSeconds]);

  // Main Detection Loop
  const detectFrame = useCallback(() => {
    if (
      videoRef.current &&
      canvasRef.current &&
      videoRef.current.readyState >= 2
    ) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');

      if (ctx) {
        if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
          canvas.width = video.videoWidth || 640;
          canvas.height = video.videoHeight || 480;
        }

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Run Pose Detection
        const now = performance.now();
        const landmarks = poseEngine.detectPoseForVideo(video, now);

        if (landmarks && biomechanicsRef.current) {
          // Biomechanics Analysis (Only counts reps & speaks when workout is active)
          const currentFeedback = biomechanicsRef.current.analyzeFrame(landmarks, isWorkoutActiveRef.current);
          setFeedback(currentFeedback);

          // Render Skeleton
          poseEngine.renderSkeleton(
            ctx,
            landmarks,
            canvas.width,
            canvas.height,
            currentFeedback.status,
            currentFeedback.keyAngles,
            isMirrored
          );
        }

        // Calculate FPS
        fpsFramesRef.current.push(now);
        fpsFramesRef.current = fpsFramesRef.current.filter(t => now - t <= 1000);
        setFps(fpsFramesRef.current.length);
      }
    }

    requestRef.current = requestAnimationFrame(detectFrame);
  }, [isMirrored]);

  useEffect(() => {
    if (isCameraActive) {
      requestRef.current = requestAnimationFrame(detectFrame);
    }
    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [isCameraActive, detectFrame]);

  // Auto-finish if target reps reached
  useEffect(() => {
    if (isWorkoutActive && selectedExercise && biomechanicsRef.current) {
      const current = selectedExercise.isHoldExercise
        ? biomechanicsRef.current.getHoldSeconds()
        : biomechanicsRef.current.getRepCount();

      if (current >= selectedExercise.defaultTargetReps && current > 0) {
        stopWorkout();
      }
    }
  }, [feedback, isWorkoutActive, selectedExercise, stopWorkout]);

  const exerciseList = availableExercises;

  // Render Loading state if exercises are still being loaded from MongoDB Atlas
  if (!selectedExercise) {
    return (
      <div className="mx-auto flex max-w-[1720px] w-full min-h-[60vh] flex-col items-center justify-center p-8 text-center space-y-4 animate-in fade-in duration-300">
        <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-[#eab308]/15 border border-[#eab308]/30 text-[#ca8a04] dark:text-[#eab308] shadow-sm">
          <Dumbbell className="h-8 w-8 animate-bounce" />
        </div>
        <div>
          <h3 className="font-heading text-xl font-bold text-[var(--text-primary)]">
            Đang Tải Dữ Liệu Phòng Tập...
          </h3>
          <p className="mt-1 text-xs text-[var(--text-muted)]">
            Đang đồng bộ danh sách bài tập từ MongoDB Atlas &amp; Redis Cloud.
          </p>
        </div>
        <div className="h-1.5 w-48 overflow-hidden rounded-full bg-[var(--bg-card)]">
          <div className="h-full w-full animate-pulse bg-[#eab308]" />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-[1720px] w-full flex-col space-y-4 p-4 sm:p-6 xl:px-8 animate-in fade-in duration-300">
      {/* Main Studio Viewport (Left Vertical Exercise List + Center Video + Right Info) */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        {/* Left Column: Vertical Exercise Selector (Hàng Dọc) */}
        <div className="lg:col-span-3 xl:col-span-3 flex flex-col space-y-3 order-2 lg:order-1">
          <div className="card-impeccable p-4 sm:p-5 flex flex-col space-y-3">
            <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
              <div className="flex items-center space-x-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#eab308]/15 text-[#ca8a04] dark:text-[#eab308]">
                  <Dumbbell className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="font-heading text-xs sm:text-sm font-extrabold text-[var(--text-primary)]">
                    DANH SÁCH BÀI TẬP
                  </h3>
                  <p className="text-[10px] text-[var(--text-muted)] font-mono">
                    {exerciseList.length > 0 ? `${exerciseList.length} Bài Tập (MongoDB)` : 'Đang tải từ MongoDB...'}
                  </p>
                </div>
              </div>
            </div>

            {/* Vertical Exercise Cards List */}
            <div className="flex flex-col space-y-2 max-h-[620px] overflow-y-auto pr-1 scrollbar-thin">
              {exerciseList.length === 0 ? (
                <div className="space-y-2.5 py-2">
                  {[1, 2, 3, 4, 5, 6].map(i => (
                    <div
                      key={i}
                      className="h-16 rounded-2xl bg-[var(--bg-canvas)] animate-pulse border border-[var(--border-subtle)]"
                    />
                  ))}
                </div>
              ) : (
                exerciseList.map(ex => {
                  const isSelected = selectedExercise && ex.id === selectedExercise.id;
                  return (
                    <button
                      key={ex.id}
                      onClick={() => {
                        if (isWorkoutActive) stopWorkout();
                        onSelectExercise(ex);
                      }}
                      className={`flex items-center justify-between rounded-2xl p-3 text-left transition-all cursor-pointer border ${
                        isSelected
                          ? 'border-[#eab308] bg-[#eab308]/15 shadow-sm ring-1 ring-[#eab308]/40'
                          : 'border-[var(--border-subtle)] bg-[var(--bg-canvas)] hover:border-[#eab308]/50 hover:bg-[var(--bg-card)]'
                      }`}
                    >
                      <div className="space-y-0.5 min-w-0 pr-2">
                        <div className="flex items-center space-x-1.5">
                          <span
                            className={`h-1.5 w-1.5 rounded-full flex-shrink-0 ${
                              isSelected ? 'bg-[#eab308] animate-pulse' : 'bg-transparent'
                            }`}
                          />
                          <h4
                            className={`font-heading text-xs font-bold truncate ${
                              isSelected ? 'text-[var(--text-primary)]' : 'text-[var(--text-secondary)]'
                            }`}
                          >
                            {ex.nameVi}
                          </h4>
                        </div>
                        <p className="text-[10px] text-[var(--text-muted)] font-mono truncate pl-3">
                          {ex.nameEn}
                        </p>
                      </div>

                      <div className="flex flex-col items-end space-y-1 flex-shrink-0">
                        <span
                          className={`rounded-md px-1.5 py-0.5 text-[9px] font-bold font-mono ${
                            isSelected
                              ? 'bg-[#eab308] text-neutral-950'
                              : 'bg-[var(--bg-card)] text-[var(--text-muted)] border border-[var(--border-subtle)]'
                          }`}
                        >
                          {ex.difficulty}
                        </span>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Center Video Screen */}
        <div className="lg:col-span-6 xl:col-span-6 flex flex-col space-y-3 order-1 lg:order-2">
          <div className="relative aspect-video w-full overflow-hidden rounded-3xl border border-[var(--border-card)] bg-[var(--bg-card)] shadow-lg flex items-center justify-center">
            {/* Background Subtle Mesh Grid */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(234,179,8,0.05)_0%,transparent_70%)] pointer-events-none" />

            {/* Video Element */}
            <video
              ref={videoRef}
              playsInline
              muted
              className={`h-full w-full object-cover ${
                isMirrored ? 'scale-x-[-1]' : ''
              } ${isCameraActive ? 'block' : 'hidden'}`}
            />

            {/* Skeleton Canvas Overlay */}
            <canvas
              ref={canvasRef}
              className="absolute inset-0 h-full w-full object-cover pointer-events-none z-10"
            />

            {/* Camera Inactive Placeholder (Harmonious White/Champagne Studio Surface) */}
            {!isCameraActive && !isModelLoading && (
              <div className="flex flex-col items-center justify-center p-6 text-center space-y-4 z-20">
                <div className="relative flex h-20 w-20 items-center justify-center rounded-3xl bg-[#eab308]/15 border border-[#eab308]/30 text-[#ca8a04] dark:text-[#eab308] shadow-sm">
                  <Camera className="h-10 w-10" />
                  <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#0d9488] opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-[#0d9488]"></span>
                  </span>
                </div>

                <div>
                  <h3 className="font-heading text-2xl font-extrabold text-[var(--text-primary)]">
                    Sẵn Sàng Quét Tư Thế Với AI
                  </h3>
                  <p className="mt-1 max-w-md text-xs text-[var(--text-secondary)] leading-relaxed">
                    AI sẽ tự động nhận diện 33 điểm khớp trên cơ thể, tính toán góc độ chuẩn xác và đếm rep theo thời gian thực.
                  </p>
                </div>

                <button
                  onClick={startCamera}
                  className="btn-kinpaku flex items-center space-x-2 px-8 py-3.5 text-xs font-bold uppercase tracking-wider cursor-pointer"
                >
                  <Video className="h-4 w-4" />
                  <span>BẬT CAMERA TẬP NGAY</span>
                </button>
              </div>
            )}

            {/* Model Loading State */}
            {isModelLoading && (
              <div className="flex flex-col items-center justify-center p-6 text-center space-y-3 z-20 font-mono">
                <div className="h-9 w-9 animate-spin rounded-full border-3 border-[#eab308] border-t-transparent" />
                <p className="text-xs font-semibold text-[var(--text-primary)]">
                  Đang khởi tạo mô hình MediaPipe Vision AI (WebAssembly GPU)...
                </p>
              </div>
            )}

            {/* Countdown Overlay */}
            {countdown !== null && (
              <div className="absolute inset-0 z-30 flex items-center justify-center bg-[var(--bg-card)]/90 backdrop-blur-sm">
                <div className="animate-ping font-heading text-9xl font-black text-[#ca8a04] dark:text-[#eab308]">
                  {countdown}
                </div>
              </div>
            )}

            {/* Top-Bar Overlay inside Camera */}
            {isCameraActive && (
              <div className="absolute top-4 left-4 right-4 z-20 flex items-center justify-between pointer-events-auto">
                <div className="flex items-center space-x-2">
                  <span className="flex items-center space-x-1.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)]/90 px-3 py-1.5 text-xs font-bold text-[var(--text-primary)] backdrop-blur-md shadow-sm">
                    <span className="h-2 w-2 rounded-full bg-[#0d9488] animate-pulse" />
                    <span>AI LIVE {fps > 0 ? `(${fps} FPS)` : ''}</span>
                  </span>
                  <span className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)]/90 px-3 py-1.5 text-xs font-bold text-[#ca8a04] dark:text-[#eab308] backdrop-blur-md shadow-sm">
                    {selectedExercise.nameVi}
                  </span>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setIsMirrored(prev => !prev)}
                    className={`flex h-9 w-9 items-center justify-center rounded-xl border transition-all cursor-pointer ${
                      isMirrored
                        ? 'border-[#eab308]/50 bg-[#eab308]/20 text-[#ca8a04] dark:text-[#eab308]'
                        : 'border-[var(--border-subtle)] bg-[var(--bg-card)]/90 text-[var(--text-secondary)]'
                    }`}
                    title="Lật gương camera"
                  >
                    <FlipHorizontal className="h-4 w-4" />
                  </button>

                  <button
                    onClick={stopCamera}
                    className="flex h-9 w-9 items-center justify-center rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-500/20 transition-all cursor-pointer"
                    title="Tắt Camera"
                  >
                    <CameraOff className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Bottom Real-time Feedback inside Camera */}
            {isCameraActive && (
              <div className="absolute bottom-4 left-4 right-4 z-20 flex flex-col items-center pointer-events-auto">
                <RealtimeFeedbackBadge feedback={feedback} isActive={isWorkoutActive} />
              </div>
            )}
          </div>

          {/* Camera Controls Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[var(--border-card)] bg-[var(--bg-card)] p-4 shadow-sm">
            <div className="flex items-center space-x-3">
              {!isWorkoutActive ? (
                <button
                  onClick={
                    isCameraActive
                      ? handleStartWorkoutWithCountdown
                      : async () => {
                          await startCamera();
                          handleStartWorkoutWithCountdown();
                        }
                  }
                  className="btn-kinpaku flex items-center space-x-2 px-6 py-3 text-xs font-bold uppercase tracking-wider cursor-pointer"
                >
                  <Play className="h-4 w-4 fill-current" />
                  <span>BẮT ĐẦU TẬP</span>
                </button>
              ) : (
                <button
                  onClick={stopWorkout}
                  className="flex items-center space-x-2 rounded-xl bg-rose-600 px-6 py-3 text-xs font-bold text-white uppercase tracking-wider hover:bg-rose-700 active:scale-95 transition-all cursor-pointer shadow-md shadow-rose-600/25"
                >
                  <Square className="h-4 w-4 fill-current" />
                  <span>KẾT THÚC HIỆP</span>
                </button>
              )}

              <button
                onClick={onOpenAiCoach}
                className="btn-hairline flex items-center space-x-1.5 px-4 py-3 text-xs font-bold uppercase tracking-wider cursor-pointer"
              >
                <Sparkles className="h-4 w-4 text-[#0d9488]" />
                <span>Hỏi HLV AI</span>
              </button>
            </div>

            <div className="flex items-center space-x-2 text-xs text-[var(--text-muted)]">
              <Info className="h-4 w-4 text-[#ca8a04] dark:text-[#eab308]" />
              <span className="hidden sm:inline">{selectedExercise.cameraAdvice}</span>
            </div>
          </div>

          {/* Metrics Panel */}
          <WorkoutMetrics
            exercise={selectedExercise}
            repCount={isWorkoutActive ? biomechanicsRef.current?.getRepCount() || 0 : 0}
            holdSeconds={isWorkoutActive ? biomechanicsRef.current?.getHoldSeconds() || 0 : 0}
            durationSeconds={isWorkoutActive ? durationSeconds : 0}
            feedback={feedback}
            targetReps={selectedExercise.defaultTargetReps}
          />
        </div>

        {/* Right Info Sidebar */}
        <div className="lg:col-span-3 xl:col-span-3 flex flex-col space-y-4 order-3">
          {/* Exercise Overview Card with Animated Motion Reference */}
          <div className="card-impeccable p-6 space-y-4">
            {/* Animated 3D Reference */}
            <div className="flex items-center justify-center">
              <ExerciseAnimation
                exerciseId={selectedExercise.id}
                exerciseName={selectedExercise.nameVi || selectedExercise.nameEn}
                gifUrl={selectedExercise.gifUrl}
                size="md"
              />
            </div>

            <div className="flex items-start justify-between">
              <div>
                <span className="rounded-lg bg-[#eab308]/15 px-2.5 py-0.5 text-xs font-bold text-[#ca8a04] dark:text-[#eab308]">
                  {CATEGORY_MAP[selectedExercise.category] || selectedExercise.category}
                </span>
                <h3 className="mt-1.5 font-heading text-xl font-bold text-[var(--text-primary)]">
                  {selectedExercise.nameVi}
                </h3>
                <p className="text-xs text-[var(--text-muted)] font-mono">
                  {selectedExercise.nameEn}
                </p>
              </div>

              <div className="text-right font-mono">
                <span className="text-[11px] text-[var(--text-muted)] uppercase font-semibold">Mục tiêu</span>
                <p className="text-base font-bold text-[#ca8a04] dark:text-[#eab308]">
                  {selectedExercise.defaultTargetReps}{' '}
                  {selectedExercise.isHoldExercise ? 's' : 'reps'}
                </p>
              </div>
            </div>

            <p className="text-xs leading-relaxed text-[var(--text-secondary)]">
              {selectedExercise.description}
            </p>

            {/* Target Muscles */}
            <div className="space-y-2 pt-3 border-t border-[var(--border-subtle)]">
              <span className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider">
                Nhóm Cơ Tác Động
              </span>
              <div className="flex flex-wrap gap-1.5">
                {selectedExercise.targetMuscles.map((muscle, idx) => (
                  <span
                    key={idx}
                    className="rounded-lg bg-[var(--bg-canvas)] px-2.5 py-1 text-xs font-medium text-[var(--text-secondary)] border border-[var(--border-subtle)]"
                  >
                    {muscle}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Form Rules & Common Mistakes */}
          <div className="card-impeccable p-6 space-y-4">
            <div className="space-y-2">
              <h4 className="flex items-center space-x-1.5 text-xs font-bold uppercase tracking-wider text-[#0d9488]">
                <ShieldCheck className="h-4 w-4" />
                <span>Quy Tắc Chuẩn Form (AI Check)</span>
              </h4>
              <ul className="space-y-2 text-xs text-[var(--text-secondary)]">
                {selectedExercise.keyFormRules.map((rule, idx) => (
                  <li key={idx} className="flex items-start space-x-2">
                    <Check className="h-3.5 w-3.5 text-[#0d9488] flex-shrink-0 mt-0.5" />
                    <span className="leading-relaxed">{rule}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-2 pt-4 border-t border-[var(--border-subtle)]">
              <h4 className="flex items-center space-x-1.5 text-xs font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">
                <ChevronRight className="h-4 w-4" />
                <span>Lỗi Sai Cần Tránh</span>
              </h4>
              <ul className="space-y-2 text-xs text-[var(--text-secondary)]">
                {selectedExercise.commonMistakes.map((mistake, idx) => (
                  <li key={idx} className="flex items-start space-x-2">
                    <X className="h-3.5 w-3.5 text-rose-500 flex-shrink-0 mt-0.5" />
                    <span className="leading-relaxed">{mistake}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Workout Completion Modal */}
      <WorkoutCompleteModal
        isOpen={isCompleteModalOpen}
        session={completedSession}
        onClose={() => setIsCompleteModalOpen(false)}
        onRestart={() => {
          setIsCompleteModalOpen(false);
          handleStartWorkoutWithCountdown();
        }}
      />
    </div>
  );
};
