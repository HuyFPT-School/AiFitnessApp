import {
  ExerciseId,
  Landmark,
  JointAngles,
  AnalysisFeedback,
  RepRecord,
  ExercisePhase
} from '../types';
import { audioCoach } from './audioCoach';

// MediaPipe landmark indices
export const POSE_LANDMARKS = {
  NOSE: 0,
  LEFT_EYE_INNER: 1,
  LEFT_EYE: 2,
  LEFT_EYE_OUTER: 3,
  RIGHT_EYE_INNER: 4,
  RIGHT_EYE: 5,
  RIGHT_EYE_OUTER: 6,
  LEFT_EAR: 7,
  RIGHT_EAR: 8,
  MOUTH_LEFT: 9,
  MOUTH_RIGHT: 10,
  LEFT_SHOULDER: 11,
  RIGHT_SHOULDER: 12,
  LEFT_ELBOW: 13,
  RIGHT_ELBOW: 14,
  LEFT_WRIST: 15,
  RIGHT_WRIST: 16,
  LEFT_PINKY: 17,
  RIGHT_PINKY: 18,
  LEFT_INDEX: 19,
  RIGHT_INDEX: 20,
  LEFT_THUMB: 21,
  RIGHT_THUMB: 22,
  LEFT_HIP: 23,
  RIGHT_HIP: 24,
  LEFT_KNEE: 25,
  RIGHT_KNEE: 26,
  LEFT_ANKLE: 27,
  RIGHT_ANKLE: 28,
  LEFT_HEEL: 29,
  RIGHT_HEEL: 30,
  LEFT_FOOT_INDEX: 31,
  RIGHT_FOOT_INDEX: 32
};

export class AngleSmoother {
  private alpha: number;
  private prevAngles: Map<string, number> = new Map();

  constructor(alpha: number = 0.45) {
    this.alpha = alpha;
  }

  public smooth(key: string, value: number): number {
    const prev = this.prevAngles.get(key);
    if (prev === undefined || isNaN(prev)) {
      this.prevAngles.set(key, value);
      return value;
    }
    const smoothed = this.alpha * value + (1 - this.alpha) * prev;
    this.prevAngles.set(key, smoothed);
    return Math.round(smoothed * 10) / 10;
  }

  public reset() {
    this.prevAngles.clear();
  }
}

export function calculateAngle(a: Landmark, b: Landmark, c: Landmark): number {
  if (!a || !b || !c) return 0;

  const radians =
    Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x);
  let angle = Math.abs((radians * 180.0) / Math.PI);

  if (angle > 180.0) {
    angle = 360.0 - angle;
  }
  return Math.round(angle);
}

export function calculateTorsoInclination(shoulder: Landmark, hip: Landmark): number {
  if (!shoulder || !hip) return 0;
  const dy = Math.abs(hip.y - shoulder.y);
  const dx = Math.abs(hip.x - shoulder.x);
  const angleRad = Math.atan2(dx, dy);
  return Math.round((angleRad * 180.0) / Math.PI);
}

export class BiomechanicsEngine {
  private exerciseType: ExerciseId = 'squat';
  private stage: ExercisePhase = 'idle';
  private repCount: number = 0;
  private holdTimerSec: number = 0;
  private holdStartTimestamp: number = 0;
  private repStartTimestamp: number = 0;
  private repScores: number[] = [];
  private currentRepMistakes: Set<string> = new Set();
  private repRecords: RepRecord[] = [];
  private smoother: AngleSmoother = new AngleSmoother(0.45);
  private minPrimaryAngleDuringRep: number = 180;
  private maxPrimaryAngleDuringRep: number = 0;
  private lastWarningSpokenTime: number = 0;

  constructor(exerciseId: ExerciseId = 'squat') {
    this.setExercise(exerciseId);
  }

  public setExercise(exerciseId: ExerciseId) {
    this.exerciseType = exerciseId;
    this.reset();
  }

  public reset() {
    this.stage = 'idle';
    this.repCount = 0;
    this.holdTimerSec = 0;
    this.holdStartTimestamp = 0;
    this.repStartTimestamp = 0;
    this.repScores = [];
    this.currentRepMistakes.clear();
    this.repRecords = [];
    this.smoother.reset();
    this.minPrimaryAngleDuringRep = 180;
    this.maxPrimaryAngleDuringRep = 0;
    this.lastWarningSpokenTime = 0;
  }

  public getRepCount(): number {
    return this.repCount;
  }

  public getHoldSeconds(): number {
    return this.holdTimerSec;
  }

  public getRepRecords(): RepRecord[] {
    return this.repRecords;
  }

  public getAverageAccuracy(): number {
    if (this.repScores.length === 0) return 90;
    const sum = this.repScores.reduce((acc, v) => acc + v, 0);
    return Math.round(sum / this.repScores.length);
  }

  public getAllMistakes(): string[] {
    const mistakes = new Set<string>();
    for (const r of this.repRecords) {
      r.mistakes.forEach(m => mistakes.add(m));
    }
    return Array.from(mistakes);
  }

  private warn(message: string) {
    const now = Date.now();
    if (now - this.lastWarningSpokenTime > 3200) {
      audioCoach.playWarningSound();
      audioCoach.speak(message);
      this.lastWarningSpokenTime = now;
    }
  }

  private triggerRepFinish(score: number) {
    this.repCount++;
    this.repScores.push(score);

    const duration =
      this.repStartTimestamp > 0 ? Date.now() - this.repStartTimestamp : 1500;

    const record: RepRecord = {
      repNumber: this.repCount,
      durationMs: duration,
      minPrimaryAngle: this.minPrimaryAngleDuringRep,
      maxPrimaryAngle: this.maxPrimaryAngleDuringRep,
      formScore: score,
      status: score >= 85 ? 'perfect' : score >= 65 ? 'acceptable' : 'imperfect',
      mistakes: Array.from(this.currentRepMistakes),
      timestamp: Date.now()
    };

    this.repRecords.push(record);
    audioCoach.playRepSound(this.repCount);

    if (score >= 90) {
      audioCoach.speak(`${this.repCount}! Rất chuẩn`, false, true);
    } else if (this.currentRepMistakes.size > 0) {
      const topMistake = Array.from(this.currentRepMistakes)[0];
      audioCoach.speak(`${this.repCount}. Chú ý ${topMistake}`);
    } else {
      audioCoach.speak(`${this.repCount}`);
    }

    this.currentRepMistakes.clear();
    this.minPrimaryAngleDuringRep = 180;
    this.maxPrimaryAngleDuringRep = 0;
    this.repStartTimestamp = Date.now();
  }

  public extractAngles(landmarks: Landmark[]): JointAngles {
    const leftHip = landmarks[POSE_LANDMARKS.LEFT_HIP];
    const rightHip = landmarks[POSE_LANDMARKS.RIGHT_HIP];
    const leftKnee = landmarks[POSE_LANDMARKS.LEFT_KNEE];
    const rightKnee = landmarks[POSE_LANDMARKS.RIGHT_KNEE];
    const leftAnkle = landmarks[POSE_LANDMARKS.LEFT_ANKLE];
    const rightAnkle = landmarks[POSE_LANDMARKS.RIGHT_ANKLE];

    const leftShoulder = landmarks[POSE_LANDMARKS.LEFT_SHOULDER];
    const rightShoulder = landmarks[POSE_LANDMARKS.RIGHT_SHOULDER];
    const leftElbow = landmarks[POSE_LANDMARKS.LEFT_ELBOW];
    const rightElbow = landmarks[POSE_LANDMARKS.RIGHT_ELBOW];
    const leftWrist = landmarks[POSE_LANDMARKS.LEFT_WRIST];
    const rightWrist = landmarks[POSE_LANDMARKS.RIGHT_WRIST];

    const rawLeftKneeAngle = calculateAngle(leftHip, leftKnee, leftAnkle);
    const rawRightKneeAngle = calculateAngle(rightHip, rightKnee, rightAnkle);
    const rawLeftHipAngle = calculateAngle(leftShoulder, leftHip, leftKnee);
    const rawRightHipAngle = calculateAngle(rightShoulder, rightHip, rightKnee);

    const rawLeftElbowAngle = calculateAngle(leftShoulder, leftElbow, leftWrist);
    const rawRightElbowAngle = calculateAngle(rightShoulder, rightElbow, rightWrist);
    const rawLeftShoulderAngle = calculateAngle(leftHip, leftShoulder, leftElbow);
    const rawRightShoulderAngle = calculateAngle(rightHip, rightShoulder, rightElbow);

    const avgShoulder = {
      x: (leftShoulder.x + rightShoulder.x) / 2,
      y: (leftShoulder.y + rightShoulder.y) / 2
    };
    const avgHip = {
      x: (leftHip.x + rightHip.x) / 2,
      y: (leftHip.y + rightHip.y) / 2
    };
    const avgAnkle = {
      x: (leftAnkle.x + rightAnkle.x) / 2,
      y: (leftAnkle.y + rightAnkle.y) / 2
    };

    const rawTorso = calculateTorsoInclination(avgShoulder, avgHip);
    const rawSpine = calculateAngle(avgShoulder, avgHip, avgAnkle);

    return {
      leftKnee: this.smoother.smooth('leftKnee', rawLeftKneeAngle),
      rightKnee: this.smoother.smooth('rightKnee', rawRightKneeAngle),
      leftHip: this.smoother.smooth('leftHip', rawLeftHipAngle),
      rightHip: this.smoother.smooth('rightHip', rawRightHipAngle),
      leftElbow: this.smoother.smooth('leftElbow', rawLeftElbowAngle),
      rightElbow: this.smoother.smooth('rightElbow', rawRightElbowAngle),
      leftShoulder: this.smoother.smooth('leftShoulder', rawLeftShoulderAngle),
      rightShoulder: this.smoother.smooth('rightShoulder', rawRightShoulderAngle),
      torsoAngle: this.smoother.smooth('torsoAngle', rawTorso),
      spineStraightness: this.smoother.smooth('spineStraightness', rawSpine)
    };
  }

  public analyzeFrame(landmarks: Landmark[], isActive: boolean = true): AnalysisFeedback {
    if (!landmarks || landmarks.length < 33) {
      return {
        text: 'Đang tìm cơ thể người tập trong khung hình...',
        status: 'warning',
        score: 0,
        repCount: isActive ? this.repCount : 0,
        phase: 'idle',
        keyAngles: {},
        errorsDetected: ['Không phát hiện đủ các khớp cơ thể']
      };
    }

    const angles = this.extractAngles(landmarks);

    // If workout is NOT active yet (camera preview / positioning mode), do NOT count reps or play voice cues
    if (!isActive) {
      return {
        text: 'Sẵn sàng bắt đầu: Đứng vào khung hình và bấm "BẮT ĐẦU TẬP".',
        status: 'good',
        score: 100,
        repCount: 0,
        phase: 'idle',
        keyAngles: angles,
        errorsDetected: []
      };
    }

    switch (this.exerciseType) {
      case 'squat':
        return this.analyzeSquat(landmarks, angles);
      case 'pushup':
        return this.analyzePushup(landmarks, angles);
      case 'plank':
        return this.analyzePlank(landmarks, angles);
      case 'lunge':
        return this.analyzeLunge(landmarks, angles);
      case 'bicep_curl':
        return this.analyzeBicepCurl(landmarks, angles);
      case 'jumping_jack':
        return this.analyzeJumpingJack(landmarks, angles);
      case 'shoulder_press':
        return this.analyzeShoulderPress(landmarks, angles);
      case 'warrior_yoga':
        return this.analyzeWarriorYoga(landmarks, angles);
      default:
        return this.analyzeSquat(landmarks, angles);
    }
  }

  private analyzeSquat(landmarks: Landmark[], angles: JointAngles): AnalysisFeedback {
    const avgKnee = ((angles.leftKnee || 180) + (angles.rightKnee || 180)) / 2;
    const errors: string[] = [];
    let score = 100;
    let text = 'Đứng thẳng, sẵn sàng bắt đầu';
    let status: 'good' | 'warning' | 'bad' = 'good';

    this.minPrimaryAngleDuringRep = Math.min(this.minPrimaryAngleDuringRep, avgKnee);
    this.maxPrimaryAngleDuringRep = Math.max(this.maxPrimaryAngleDuringRep, avgKnee);

    // Valgus knee check (distance between knees vs distance between ankles)
    const lKnee = landmarks[POSE_LANDMARKS.LEFT_KNEE];
    const rKnee = landmarks[POSE_LANDMARKS.RIGHT_KNEE];
    const lAnkle = landmarks[POSE_LANDMARKS.LEFT_ANKLE];
    const rAnkle = landmarks[POSE_LANDMARKS.RIGHT_ANKLE];

    const kneeDist = Math.abs(lKnee.x - rKnee.x);
    const ankleDist = Math.abs(lAnkle.x - rAnkle.x);

    if (avgKnee < 130 && kneeDist < ankleDist * 0.75) {
      errors.push('Gối chụm vào trong (Knee Valgus)');
      this.currentRepMistakes.add('Mở gối theo hướng mũi chân');
      score -= 20;
      this.warn('Mở rộng đầu gối ra');
    }

    if ((angles.torsoAngle || 0) > 50 && avgKnee < 140) {
      errors.push('Gập người quá sâu');
      this.currentRepMistakes.add('Giữ thẳng lưng ngực mở');
      score -= 15;
    }

    if (avgKnee > 160) {
      if (this.stage === 'down') {
        const finalScore = this.minPrimaryAngleDuringRep <= 100 ? Math.max(60, score) : Math.max(40, score - 25);
        this.triggerRepFinish(finalScore);
      }
      this.stage = 'up';
      text = this.repCount === 0 ? 'Bắt đầu: Hạ hông từ từ ra sau' : 'Tốt! Tiếp tục hạ hông xuống';
    } else if (avgKnee < 105) {
      this.stage = 'down';
      if (avgKnee <= 90) {
        text = '✓ Độ sâu hoàn hảo! Đẩy gót chân đứng lên';
        status = 'good';
      } else {
        text = 'Hạ thêm một chút nữa để đùi song song sàn';
        status = 'warning';
      }
    } else if (this.stage === 'up' && avgKnee < 150) {
      text = 'Đang xuống... Giữ thẳng lưng và mở gối';
      status = errors.length > 0 ? 'warning' : 'good';
    }

    if (errors.length > 0) {
      status = 'warning';
      text = `⚠️ ${errors[0]}!`;
    }

    return {
      text,
      status,
      score: Math.max(20, score),
      repCount: this.repCount,
      phase: this.stage === 'down' ? 'down' : this.stage === 'up' ? 'up' : 'holding',
      keyAngles: {
        leftKnee: angles.leftKnee,
        rightKnee: angles.rightKnee,
        torsoAngle: angles.torsoAngle
      },
      errorsDetected: errors,
      guidanceTip: 'Mẹo: Tưởng tượng đang ngồi xuống ghế, dồn trọng tâm về gót chân.'
    };
  }

  private analyzePushup(landmarks: Landmark[], angles: JointAngles): AnalysisFeedback {
    const avgElbow = ((angles.leftElbow || 180) + (angles.rightElbow || 180)) / 2;
    const avgHip = ((angles.leftHip || 180) + (angles.rightHip || 180)) / 2;
    const errors: string[] = [];
    let score = 100;
    let text = 'Vào tư thế Plank cao, chuẩn bị hít đất';
    let status: 'good' | 'warning' | 'bad' = 'good';

    this.minPrimaryAngleDuringRep = Math.min(this.minPrimaryAngleDuringRep, avgElbow);
    this.maxPrimaryAngleDuringRep = Math.max(this.maxPrimaryAngleDuringRep, avgElbow);

    if (avgHip < 150) {
      errors.push('Võng lưng hoặc nhô mông');
      this.currentRepMistakes.add('Siết cơ bụng giữ người thẳng');
      score -= 25;
      this.warn('Siết bụng, thẳng người như tấm ván');
    }

    if (avgElbow > 155) {
      if (this.stage === 'down') {
        const finalScore = this.minPrimaryAngleDuringRep <= 95 ? Math.max(60, score) : Math.max(40, score - 30);
        this.triggerRepFinish(finalScore);
      }
      this.stage = 'up';
      text = 'Hạ ngực có kiểm soát, hít vào';
    } else if (avgElbow < 90) {
      this.stage = 'down';
      text = '✓ Ngực chạm điểm sâu! Đẩy mạnh lên';
      status = 'good';
    } else if (this.stage === 'up' && avgElbow < 140) {
      text = 'Hạ thấp thêm nữa, khuỷu tay 45 độ';
      status = errors.length > 0 ? 'warning' : 'good';
    }

    if (errors.length > 0) {
      status = 'bad';
      text = `⚠️ ${errors[0]}!`;
    }

    return {
      text,
      status,
      score: Math.max(20, score),
      repCount: this.repCount,
      phase: this.stage === 'down' ? 'down' : this.stage === 'up' ? 'up' : 'holding',
      keyAngles: {
        leftElbow: angles.leftElbow,
        rightElbow: angles.rightElbow,
        leftHip: angles.leftHip
      },
      errorsDetected: errors,
      guidanceTip: 'Mẹo: Giữ cùi chỏ chếch góc 45 độ so với thân để bảo vệ khớp vai.'
    };
  }

  private analyzePlank(landmarks: Landmark[], angles: JointAngles): AnalysisFeedback {
    const avgHip = ((angles.leftHip || 180) + (angles.rightHip || 180)) / 2;
    const avgKnee = ((angles.leftKnee || 180) + (angles.rightKnee || 180)) / 2;
    const errors: string[] = [];
    let score = 100;
    let status: 'good' | 'warning' | 'bad' = 'good';
    let text = 'Vào vị trí plank, thẳng thân người';
    const now = Date.now();

    if (avgHip >= 155 && avgHip <= 195 && avgKnee >= 155) {
      if (this.holdStartTimestamp === 0) {
        this.holdStartTimestamp = now;
      }
      this.holdTimerSec = Math.floor((now - this.holdStartTimestamp) / 1000);
      status = 'good';
      text = `✓ Giữ vững! Đã plank được ${this.holdTimerSec} giây`;

      if (this.holdTimerSec > 0 && this.holdTimerSec % 10 === 0 && now - this.lastWarningSpokenTime > 5000) {
        audioCoach.speak(`${this.holdTimerSec} giây, rất tốt!`);
        this.lastWarningSpokenTime = now;
      }
    } else {
      if (avgHip < 150) {
        errors.push('Hông bị võng xuống');
        score -= 30;
        this.warn('Nâng hông lên một chút, siết cơ bụng');
      } else if (avgHip > 200) {
        errors.push('Mông nhô quá cao');
        score -= 25;
        this.warn('Hạ mông xuống ngang trục vai');
      }
      status = 'warning';
      text = errors.length > 0 ? `⚠️ ${errors[0]}` : 'Điều chỉnh thân người thẳng trục';
    }

    return {
      text,
      status,
      score,
      repCount: this.holdTimerSec,
      phase: 'holding',
      holdTimeSeconds: this.holdTimerSec,
      keyAngles: {
        leftHip: angles.leftHip,
        spineStraightness: angles.spineStraightness
      },
      errorsDetected: errors,
      guidanceTip: 'Mẹo: Mắt nhìn xuống sàn, hít thở đều, không nín thở.'
    };
  }

  private analyzeLunge(landmarks: Landmark[], angles: JointAngles): AnalysisFeedback {
    const minKnee = Math.min(angles.leftKnee || 180, angles.rightKnee || 180);
    const errors: string[] = [];
    let score = 100;
    let text = 'Bước một chân tới trước, chuẩn bị hạ gối';
    let status: 'good' | 'warning' | 'bad' = 'good';

    this.minPrimaryAngleDuringRep = Math.min(this.minPrimaryAngleDuringRep, minKnee);

    if ((angles.torsoAngle || 0) > 35) {
      errors.push('Thân trên bị nghiêng');
      score -= 20;
    }

    if (minKnee > 150) {
      if (this.stage === 'down') {
        this.triggerRepFinish(score);
      }
      this.stage = 'up';
      text = 'Hạ gối chân sau thẳng góc 90 độ';
    } else if (minKnee < 95) {
      this.stage = 'down';
      text = '✓ Độ sâu 90° lý tưởng! Đạp chân nâng người lên';
    }

    return {
      text,
      status,
      score,
      repCount: this.repCount,
      phase: this.stage === 'down' ? 'down' : 'up',
      keyAngles: {
        leftKnee: angles.leftKnee,
        rightKnee: angles.rightKnee,
        torsoAngle: angles.torsoAngle
      },
      errorsDetected: errors,
      guidanceTip: 'Mẹo: Đầu gối chân trước không chồm vượt quá mũi chân.'
    };
  }

  private analyzeBicepCurl(landmarks: Landmark[], angles: JointAngles): AnalysisFeedback {
    const avgElbow = ((angles.leftElbow || 180) + (angles.rightElbow || 180)) / 2;
    const avgShoulder = ((angles.leftShoulder || 0) + (angles.rightShoulder || 0)) / 2;
    const errors: string[] = [];
    let score = 100;
    let text = 'Khóa cố định khuỷu tay sát sườn';
    let status: 'good' | 'warning' | 'bad' = 'good';

    this.minPrimaryAngleDuringRep = Math.min(this.minPrimaryAngleDuringRep, avgElbow);
    this.maxPrimaryAngleDuringRep = Math.max(this.maxPrimaryAngleDuringRep, avgElbow);

    if (avgShoulder > 45) {
      errors.push('Cùi chỏ bị vung ra trước (dùng đà)');
      this.currentRepMistakes.add('Khóa cùi chỏ sát người');
      score -= 20;
      this.warn('Khóa cùi chỏ sát sườn, không vung tay');
    }

    if (avgElbow > 150) {
      if (this.stage === 'inflection') {
        const finalScore = this.minPrimaryAngleDuringRep <= 55 ? Math.max(70, score) : Math.max(50, score - 20);
        this.triggerRepFinish(finalScore);
      }
      this.stage = 'up';
      text = 'Cuốn tạ lên, siết chặt bắp tay';
    } else if (avgElbow < 50) {
      this.stage = 'inflection';
      text = '✓ Đỉnh co cơ hoàn hảo! Hạ tạ từ từ';
    }

    return {
      text: errors.length > 0 ? `⚠️ ${errors[0]}` : text,
      status: errors.length > 0 ? 'warning' : status,
      score,
      repCount: this.repCount,
      phase: this.stage === 'inflection' ? 'inflection' : 'up',
      keyAngles: {
        leftElbow: angles.leftElbow,
        rightElbow: angles.rightElbow
      },
      errorsDetected: errors,
      guidanceTip: 'Mẹo: Hạ tạ chậm 2 giây để kích thích sợi cơ tối đa.'
    };
  }

  private analyzeJumpingJack(landmarks: Landmark[], angles: JointAngles): AnalysisFeedback {
    const avgShoulder = ((angles.leftShoulder || 0) + (angles.rightShoulder || 0)) / 2;
    const lAnkle = landmarks[POSE_LANDMARKS.LEFT_ANKLE];
    const rAnkle = landmarks[POSE_LANDMARKS.RIGHT_ANKLE];
    const feetSpread = Math.abs(lAnkle.x - rAnkle.x);

    let text = 'Nhảy dang tay chân nhịp nhàng';
    let status: 'good' | 'warning' | 'bad' = 'good';

    if (avgShoulder > 140 && feetSpread > 0.3) {
      if (this.stage !== 'holding') {
        this.stage = 'holding';
      }
      text = '✓ Mở rộng tay chân tốt!';
    } else if (avgShoulder < 50 && feetSpread < 0.2) {
      if (this.stage === 'holding') {
        this.triggerRepFinish(95);
      }
      this.stage = 'idle';
      text = 'Bật nhảy tiếp tục';
    }

    return {
      text,
      status,
      score: 95,
      repCount: this.repCount,
      phase: this.stage === 'holding' ? 'holding' : 'idle',
      keyAngles: {
        leftShoulder: angles.leftShoulder,
        rightShoulder: angles.rightShoulder
      },
      errorsDetected: [],
      guidanceTip: 'Mẹo: Tiếp đất bằng mũi chân nhẹ nhàng để giảm chấn động khớp.'
    };
  }

  private analyzeShoulderPress(landmarks: Landmark[], angles: JointAngles): AnalysisFeedback {
    const avgElbow = ((angles.leftElbow || 180) + (angles.rightElbow || 180)) / 2;
    let text = 'Đẩy thẳng tạ lên qua đầu';
    let status: 'good' | 'warning' | 'bad' = 'good';
    const errors: string[] = [];
    const score = 100;

    if (avgElbow > 160) {
      if (this.stage === 'down') {
        this.triggerRepFinish(score);
      }
      this.stage = 'up';
      text = '✓ Đẩy hết tầm! Hạ khuỷu tay ngang vai';
    } else if (avgElbow < 90) {
      this.stage = 'down';
      text = 'Đẩy mạnh lên trên đỉnh đầu';
    }

    return {
      text,
      status,
      score,
      repCount: this.repCount,
      phase: this.stage === 'up' ? 'up' : 'down',
      keyAngles: {
        leftElbow: angles.leftElbow,
        rightElbow: angles.rightElbow
      },
      errorsDetected: errors,
      guidanceTip: 'Mẹo: Giữ thân người ổn định, không ưỡn thắt lưng.'
    };
  }

  private analyzeWarriorYoga(landmarks: Landmark[], angles: JointAngles): AnalysisFeedback {
    const lKnee = angles.leftKnee || 180;
    const rKnee = angles.rightKnee || 180;
    const bentKnee = Math.min(lKnee, rKnee);
    const straightKnee = Math.max(lKnee, rKnee);
    const avgShoulder = ((angles.leftShoulder || 0) + (angles.rightShoulder || 0)) / 2;
    const errors: string[] = [];
    let score = 100;
    let status: 'good' | 'warning' | 'bad' = 'good';
    let text = 'Vào tư thế Chiến Binh II (Warrior II)';
    const now = Date.now();

    if (bentKnee >= 80 && bentKnee <= 115 && straightKnee >= 155 && avgShoulder >= 80 && avgShoulder <= 115) {
      if (this.holdStartTimestamp === 0) {
        this.holdStartTimestamp = now;
      }
      this.holdTimerSec = Math.floor((now - this.holdStartTimestamp) / 1000);
      status = 'good';
      text = `✓ Tư thế Chiến Binh vững vàng! (${this.holdTimerSec}s)`;

      if (this.holdTimerSec > 0 && this.holdTimerSec % 10 === 0 && now - this.lastWarningSpokenTime > 5000) {
        audioCoach.speak(`Chiến binh rất tốt, ${this.holdTimerSec} giây!`);
        this.lastWarningSpokenTime = now;
      }
    } else {
      if (bentKnee > 120) {
        errors.push('Gối trước chưa hạ đủ sâu 90°');
        score -= 20;
      }
      if (avgShoulder < 75) {
        errors.push('Hai tay chưa dang ngang song song');
        score -= 15;
      }
      status = 'warning';
      text = errors.length > 0 ? `⚠️ ${errors[0]}` : 'Dang ngang 2 tay, gập gối trước 90 độ';
    }

    return {
      text,
      status,
      score,
      repCount: this.holdTimerSec,
      phase: 'holding',
      holdTimeSeconds: this.holdTimerSec,
      keyAngles: {
        leftKnee: angles.leftKnee,
        rightKnee: angles.rightKnee,
        leftShoulder: angles.leftShoulder,
        rightShoulder: angles.rightShoulder
      },
      errorsDetected: errors,
      guidanceTip: 'Mẹo: Mắt nhìn theo ngón tay trước, hít sâu mở rộng ngực.'
    };
  }
}
