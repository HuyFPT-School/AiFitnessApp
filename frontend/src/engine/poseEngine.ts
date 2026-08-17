import { FilesetResolver, PoseLandmarker } from '@mediapipe/tasks-vision';
import { Landmark } from '../types';
import { POSE_LANDMARKS } from './biomechanics';

// Standard MediaPipe Pose connections
export const POSE_CONNECTIONS = [
  // Face
  [POSE_LANDMARKS.NOSE, POSE_LANDMARKS.LEFT_EYE],
  [POSE_LANDMARKS.LEFT_EYE, POSE_LANDMARKS.LEFT_EAR],
  [POSE_LANDMARKS.NOSE, POSE_LANDMARKS.RIGHT_EYE],
  [POSE_LANDMARKS.RIGHT_EYE, POSE_LANDMARKS.RIGHT_EAR],

  // Upper Body
  [POSE_LANDMARKS.LEFT_SHOULDER, POSE_LANDMARKS.RIGHT_SHOULDER],
  [POSE_LANDMARKS.LEFT_SHOULDER, POSE_LANDMARKS.LEFT_ELBOW],
  [POSE_LANDMARKS.LEFT_ELBOW, POSE_LANDMARKS.LEFT_WRIST],
  [POSE_LANDMARKS.RIGHT_SHOULDER, POSE_LANDMARKS.RIGHT_ELBOW],
  [POSE_LANDMARKS.RIGHT_ELBOW, POSE_LANDMARKS.RIGHT_WRIST],

  // Torso
  [POSE_LANDMARKS.LEFT_SHOULDER, POSE_LANDMARKS.LEFT_HIP],
  [POSE_LANDMARKS.RIGHT_SHOULDER, POSE_LANDMARKS.RIGHT_HIP],
  [POSE_LANDMARKS.LEFT_HIP, POSE_LANDMARKS.RIGHT_HIP],

  // Lower Body
  [POSE_LANDMARKS.LEFT_HIP, POSE_LANDMARKS.LEFT_KNEE],
  [POSE_LANDMARKS.LEFT_KNEE, POSE_LANDMARKS.LEFT_ANKLE],
  [POSE_LANDMARKS.LEFT_ANKLE, POSE_LANDMARKS.LEFT_HEEL],
  [POSE_LANDMARKS.LEFT_HEEL, POSE_LANDMARKS.LEFT_FOOT_INDEX],
  [POSE_LANDMARKS.LEFT_ANKLE, POSE_LANDMARKS.LEFT_FOOT_INDEX],

  [POSE_LANDMARKS.RIGHT_HIP, POSE_LANDMARKS.RIGHT_KNEE],
  [POSE_LANDMARKS.RIGHT_KNEE, POSE_LANDMARKS.RIGHT_ANKLE],
  [POSE_LANDMARKS.RIGHT_ANKLE, POSE_LANDMARKS.RIGHT_HEEL],
  [POSE_LANDMARKS.RIGHT_HEEL, POSE_LANDMARKS.RIGHT_FOOT_INDEX],
  [POSE_LANDMARKS.RIGHT_ANKLE, POSE_LANDMARKS.RIGHT_FOOT_INDEX]
];

export class PoseEngine {
  private landmarker: PoseLandmarker | null = null;
  private isInitializing: boolean = false;
  private isModelReady: boolean = false;

  public async initialize(): Promise<boolean> {
    if (this.isModelReady && this.landmarker) return true;
    if (this.isInitializing) return false;

    this.isInitializing = true;
    try {
      const vision = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
      );

      this.landmarker = await PoseLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath:
            'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task',
          delegate: 'GPU'
        },
        runningMode: 'VIDEO',
        numPoses: 1,
        minPoseDetectionConfidence: 0.5,
        minPosePresenceConfidence: 0.5,
        minTrackingConfidence: 0.5
      });

      this.isModelReady = true;
      this.isInitializing = false;
      return true;
    } catch (err) {
      console.warn('GPU delegate failed or network issue, falling back to CPU mode', err);
      try {
        const vision = await FilesetResolver.forVisionTasks(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
        );

        this.landmarker = await PoseLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath:
              'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task',
            delegate: 'CPU'
          },
          runningMode: 'VIDEO',
          numPoses: 1,
          minPoseDetectionConfidence: 0.5,
          minPosePresenceConfidence: 0.5,
          minTrackingConfidence: 0.5
        });

        this.isModelReady = true;
        this.isInitializing = false;
        return true;
      } catch (cpuErr) {
        console.error('Failed to initialize PoseLandmarker:', cpuErr);
        this.isInitializing = false;
        return false;
      }
    }
  }

  public detectPoseForVideo(
    videoElement: HTMLVideoElement,
    timestampMs: number
  ): Landmark[] | null {
    if (!this.landmarker || !this.isModelReady) return null;
    if (videoElement.readyState < 2) return null;

    try {
      const result = this.landmarker.detectForVideo(videoElement, timestampMs);
      if (result && result.landmarks && result.landmarks.length > 0) {
        return result.landmarks[0] as Landmark[];
      }
    } catch (err) {
      // Frame skip or timestamp duplicate
    }
    return null;
  }

  public renderSkeleton(
    ctx: CanvasRenderingContext2D,
    landmarks: Landmark[],
    width: number,
    height: number,
    status: 'good' | 'warning' | 'bad' = 'good',
    keyAngles?: Record<string, number | undefined>,
    mirror: boolean = true
  ) {
    if (!landmarks || landmarks.length === 0) return;

    ctx.save();
    if (mirror) {
      ctx.translate(width, 0);
      ctx.scale(-1, 1);
    }

    // Athletic color system for high-contrast visibility
    let boneColor = '#a3e635'; // Volt Lime (Energized & friendly)
    let jointColor = '#06b6d4'; // Electric Cyan (Joint pivot)
    let glowColor = 'rgba(163, 230, 53, 0.45)';

    if (status === 'warning') {
      boneColor = '#f59e0b'; // Solar Amber
      jointColor = '#fbbf24';
      glowColor = 'rgba(245, 158, 11, 0.45)';
    } else if (status === 'bad') {
      boneColor = '#f43f5e'; // Coral Pulse
      jointColor = '#fb7185';
      glowColor = 'rgba(244, 63, 94, 0.5)';
    }

    // 1. Draw glowing bones (lines)
    ctx.shadowBlur = 12;
    ctx.shadowColor = glowColor;
    ctx.lineWidth = 4;
    ctx.strokeStyle = boneColor;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    for (const [startIndex, endIndex] of POSE_CONNECTIONS) {
      const start = landmarks[startIndex];
      const end = landmarks[endIndex];

      if (!start || !end) continue;
      // Skip low visibility landmarks
      if ((start.visibility ?? 1) < 0.4 || (end.visibility ?? 1) < 0.4) continue;

      ctx.beginPath();
      ctx.moveTo(start.x * width, start.y * height);
      ctx.lineTo(end.x * width, end.y * height);
      ctx.stroke();
    }

    // 2. Draw key joint nodes
    for (let i = 0; i < landmarks.length; i++) {
      const p = landmarks[i];
      if (!p || (p.visibility ?? 1) < 0.4) continue;

      const px = p.x * width;
      const py = p.y * height;

      // Outer halo
      ctx.beginPath();
      ctx.arc(px, py, 6, 0, 2 * Math.PI);
      ctx.fillStyle = jointColor;
      ctx.shadowBlur = 14;
      ctx.shadowColor = glowColor;
      ctx.fill();

      // Inner bright center
      ctx.beginPath();
      ctx.arc(px, py, 2.5, 0, 2 * Math.PI);
      ctx.fillStyle = '#ffffff';
      ctx.shadowBlur = 0;
      ctx.fill();
    }

    ctx.restore();

    // 3. Draw Angle Badges if present (non-mirrored text for readability)
    if (keyAngles) {
      ctx.save();
      ctx.font = 'bold 12px "Outfit", "JetBrains Mono", sans-serif';

      const renderAngleBadge = (landmarkIndex: number, angleVal?: number, label?: string) => {
        if (angleVal === undefined || isNaN(angleVal)) return;
        const p = landmarks[landmarkIndex];
        if (!p || (p.visibility ?? 1) < 0.4) return;

        let posX = p.x * width;
        if (mirror) {
          posX = width - posX;
        }
        const posY = p.y * height - 16;

        const text = `${label ? label + ': ' : ''}${Math.round(angleVal)}°`;
        const textWidth = ctx.measureText(text).width;
        const padX = 8;
        const padY = 4;

        // Badge background (Frosted obsidian capsule)
        ctx.fillStyle = 'rgba(9, 13, 22, 0.92)';
        ctx.strokeStyle = boneColor;
        ctx.lineWidth = 1.5;
        ctx.shadowBlur = 10;
        ctx.shadowColor = glowColor;

        const bgX = posX - textWidth / 2 - padX;
        const bgY = posY - 12 - padY;
        const bgW = textWidth + padX * 2;
        const bgH = 18 + padY;

        ctx.beginPath();
        ctx.roundRect(bgX, bgY, bgW, bgH, 6);
        ctx.fill();
        ctx.stroke();

        // Text
        ctx.fillStyle = '#ffffff';
        ctx.shadowBlur = 0;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, posX, posY - 2);
      };

      if (keyAngles.leftKnee !== undefined) {
        renderAngleBadge(POSE_LANDMARKS.LEFT_KNEE, keyAngles.leftKnee, 'Gối T');
      }
      if (keyAngles.rightKnee !== undefined) {
        renderAngleBadge(POSE_LANDMARKS.RIGHT_KNEE, keyAngles.rightKnee, 'Gối P');
      }
      if (keyAngles.leftElbow !== undefined) {
        renderAngleBadge(POSE_LANDMARKS.LEFT_ELBOW, keyAngles.leftElbow, 'Khuỷu T');
      }
      if (keyAngles.rightElbow !== undefined) {
        renderAngleBadge(POSE_LANDMARKS.RIGHT_ELBOW, keyAngles.rightElbow, 'Khuỷu P');
      }
      if (keyAngles.leftHip !== undefined) {
        renderAngleBadge(POSE_LANDMARKS.LEFT_HIP, keyAngles.leftHip, 'Hông');
      }

      ctx.restore();
    }
  }
}

export const poseEngine = new PoseEngine();
