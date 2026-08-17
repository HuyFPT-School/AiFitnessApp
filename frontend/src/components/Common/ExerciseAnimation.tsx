import React, { useState, useEffect } from 'react';
import { Dumbbell } from 'lucide-react';

interface ExerciseAnimationProps {
  exerciseId: string;
  exerciseName?: string;
  gifUrl?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  isAnimated?: boolean;
}

// 100% Instant Local Fast-Loading Assets
const LOCAL_GIF_MAP: Record<string, string> = {
  squat: '/exercises/squat.gif',
  pushup: '/exercises/pushup.gif',
  plank: '/exercises/plank.gif',
  lunge: '/exercises/lunge.gif',
  bicep_curl: '/exercises/bicep_curl.gif',
  jumping_jack: '/exercises/jumping_jack.gif',
  shoulder_press: '/exercises/shoulder_press.gif',
  warrior_yoga: '/exercises/warrior_yoga.gif',
  deadlift: '/exercises/deadlift.gif'
};

const CDN_JSDELIVR = 'https://cdn.jsdelivr.net/gh/hasaneyldrm/exercises-dataset@main/videos';
const CDN_GITHUB_RAW = 'https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos';

function resolveExerciseKey(id: string, name?: string): string {
  const normalizedId = (id || '').toLowerCase();
  if (LOCAL_GIF_MAP[normalizedId]) return normalizedId;

  const text = `${normalizedId} ${(name || '').toLowerCase()}`;
  if (text.includes('squat') || text.includes('gánh đùi')) return 'squat';
  if (text.includes('pushup') || text.includes('push-up') || text.includes('hít đất')) return 'pushup';
  if (text.includes('plank') || text.includes('đo ván')) return 'plank';
  if (text.includes('lunge') || text.includes('chùng chân')) return 'lunge';
  if (text.includes('bicep') || text.includes('cuốn tay')) return 'bicep_curl';
  if (text.includes('jumping') || text.includes('nhảy bật')) return 'jumping_jack';
  if (text.includes('shoulder') || text.includes('đẩy vai')) return 'shoulder_press';
  if (text.includes('warrior') || text.includes('chiến binh') || text.includes('yoga')) return 'warrior_yoga';
  if (text.includes('deadlift') || text.includes('rdl') || text.includes('kéo tạ đùi sau')) return 'deadlift';

  return '';
}

export const ExerciseAnimation: React.FC<ExerciseAnimationProps> = ({
  exerciseId,
  exerciseName,
  gifUrl,
  className = '',
  size = 'md'
}) => {
  const resolvedKey = resolveExerciseKey(exerciseId, exerciseName);

  // Extract dataset filename if present (e.g. 1756-gEyURal.gif)
  const extractFilename = (url?: string): string | null => {
    if (!url) return null;
    const match = url.match(/([0-9]{4}-[a-zA-Z0-9_-]+\.gif)/i);
    return match ? match[1] : null;
  };

  const filename = extractFilename(gifUrl);

  const getBestSource = () => {
    // 1. If custom uploaded base64 data URL
    if (gifUrl && gifUrl.startsWith('data:')) return gifUrl;

    // 2. High priority: Core exercise fast static asset
    if (resolvedKey && LOCAL_GIF_MAP[resolvedKey]) return LOCAL_GIF_MAP[resolvedKey];

    // 3. High-speed Global CDN from GitHub exercises-dataset
    if (filename) {
      return `${CDN_JSDELIVR}/${filename}`;
    }

    // 4. Custom remote gifUrl if provided
    if (gifUrl && gifUrl.trim() !== '') return gifUrl;

    // 5. Default fallback
    return '/exercises/squat.gif';
  };

  const [imgSrc, setImgSrc] = useState<string>(getBestSource());
  const [retryStep, setRetryStep] = useState<number>(0);
  const [hasFailedAll, setHasFailedAll] = useState(false);

  useEffect(() => {
    setImgSrc(getBestSource());
    setRetryStep(0);
    setHasFailedAll(false);
  }, [exerciseId, exerciseName, gifUrl]);

  const sizeClasses: Record<string, string> = {
    sm: 'w-24 h-24',
    md: 'w-full aspect-square',
    lg: 'w-full aspect-square',
    xl: 'w-full aspect-square',
    full: 'w-full h-full'
  };

  const handleError = () => {
    if (filename) {
      if (retryStep === 0) {
        // Fallback 1: GitHub Raw CDN
        setRetryStep(1);
        setImgSrc(`${CDN_GITHUB_RAW}/${filename}`);
        return;
      }
      if (retryStep === 1) {
        // Fallback 2: Local dataset video path (if present on machine)
        setRetryStep(2);
        setImgSrc(`/dataset_videos/${filename}`);
        return;
      }
    }

    if (resolvedKey && LOCAL_GIF_MAP[resolvedKey] && imgSrc !== LOCAL_GIF_MAP[resolvedKey]) {
      setImgSrc(LOCAL_GIF_MAP[resolvedKey]);
    } else if (imgSrc !== '/exercises/squat.gif') {
      setImgSrc('/exercises/squat.gif');
    } else {
      setHasFailedAll(true);
    }
  };

  return (
    <div
      className={`relative overflow-hidden rounded-2xl bg-white dark:bg-neutral-900 border border-[var(--border-card)] flex items-center justify-center p-2 group ${sizeClasses[size] || 'w-full h-full'} ${className}`}
    >
      {/* 3D Dynamic Animated GIF */}
      {!hasFailedAll ? (
        <img
          src={imgSrc}
          alt={`${exerciseName || exerciseId} animation`}
          onError={handleError}
          className="w-full h-full object-contain mix-blend-multiply dark:mix-blend-normal rounded-xl transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
        />
      ) : (
        <div className="flex flex-col items-center justify-center space-y-2 text-center p-4 text-[var(--text-muted)]">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#eab308]/15 text-[#ca8a04] dark:text-[#eab308]">
            <Dumbbell className="h-6 w-6 animate-pulse" />
          </div>
          <span className="text-xs font-bold text-[var(--text-primary)]">Mô Hình Sinh Cơ Học 3D</span>
          <span className="text-[10px] text-[var(--text-muted)]">AI Pose Tracking</span>
        </div>
      )}
    </div>
  );
};
