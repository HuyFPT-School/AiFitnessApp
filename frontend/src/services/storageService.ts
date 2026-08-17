import { WorkoutHistoryItem, UserSettings, MealLogItem, DailyNutritionSummary, UserProfile } from '../types';
import { ApiClient } from './apiClient';

const STORAGE_KEYS = {
  SETTINGS: 'aifitcoach_settings_v1',
  USER: 'aifitcoach_current_user_v1'
};

const DEFAULT_SETTINGS: UserSettings = {
  geminiApiKey: 'AIzaSyA7mjSYqhM-vgzL1vX6nmQFlX9sovZSG5g',
  voiceCoachEnabled: true,
  repSoundEnabled: true,
  voiceSpeed: 1.05,
  voicePitch: 1.0,
  cameraMirror: true,
  countdownSeconds: 3,
  skeletonLineColor: '#eab308',
  skeletonJointColor: '#0d9488',
  dailyCalorieTarget: 2000,
  dailyProteinTarget: 130,
  dailyCarbsTarget: 220,
  dailyFatTarget: 55
};

export interface OverallStats {
  totalWorkouts: number;
  totalReps: number;
  totalCalories: number;
  totalDurationSeconds: number;
  averageAccuracyScore: number;
  streakDays: number;
  lastWorkoutDate: string;
}

export class StorageService {
  /**
   * Generates a unique scope key for the currently logged in user
   * Example: "user_6a81cb54..." or "user_luumynhathuy_gmail_com" or "guest"
   */
  private static getUserScope(): string {
    const user = this.getCurrentUser();
    if (!user) return 'guest';
    const raw = user._id || user.email || 'user';
    return raw.replace(/[^a-zA-Z0-9_]/g, '_');
  }

  private static getHistoryKey(): string {
    return `aifitcoach_history_${this.getUserScope()}`;
  }

  private static getStatsKey(): string {
    return `aifitcoach_stats_${this.getUserScope()}`;
  }

  private static getMealsKey(): string {
    return `aifitcoach_meals_${this.getUserScope()}`;
  }

  public static getSettings(): UserSettings {
    try {
      const user = this.getCurrentUser();
      const stored = localStorage.getItem(`${STORAGE_KEYS.SETTINGS}_${this.getUserScope()}`) || localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (user) {
          if (user.dailyCalorieTarget) parsed.dailyCalorieTarget = user.dailyCalorieTarget;
          if (user.dailyProteinTarget) parsed.dailyProteinTarget = user.dailyProteinTarget;
          if (user.dailyCarbsTarget) parsed.dailyCarbsTarget = user.dailyCarbsTarget;
          if (user.dailyFatTarget) parsed.dailyFatTarget = user.dailyFatTarget;
        }
        return { ...DEFAULT_SETTINGS, ...parsed };
      }
    } catch {
      // Fallback
    }
    return DEFAULT_SETTINGS;
  }

  public static saveSettings(settings: UserSettings): void {
    try {
      localStorage.setItem(`${STORAGE_KEYS.SETTINGS}_${this.getUserScope()}`, JSON.stringify(settings));
    } catch {
      // Ignore
    }
  }

  /* ==========================================================================
     WORKOUT HISTORY & STATS (SCOPED BY CURRENT USER)
     ========================================================================== */

  public static getHistory(): WorkoutHistoryItem[] {
    try {
      const key = this.getHistoryKey();
      const stored = localStorage.getItem(key);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {
      // Fallback
    }
    return [];
  }

  public static saveWorkout(item: WorkoutHistoryItem): void {
    try {
      const key = this.getHistoryKey();
      const history = this.getHistory();
      history.unshift(item);
      localStorage.setItem(key, JSON.stringify(history.slice(0, 100)));

      const stats = this.getOverallStats();
      stats.totalWorkouts += 1;
      stats.totalReps += item.reps;
      stats.totalCalories += item.caloriesBurned;
      stats.totalDurationSeconds += item.durationSeconds;

      const totalScores = history.reduce((sum, h) => sum + (h.accuracyScore || 85), 0);
      stats.averageAccuracyScore = Math.round(totalScores / history.length);

      const today = new Date().toISOString().split('T')[0];
      if (stats.lastWorkoutDate !== today) {
        stats.streakDays += 1;
        stats.lastWorkoutDate = today;
      }

      localStorage.setItem(this.getStatsKey(), JSON.stringify(stats));

      // Asynchronous background sync to Node.js / MongoDB Backend
      ApiClient.saveWorkout(item).catch(() => {});
    } catch {
      // Ignore
    }
  }

  public static getOverallStats(): OverallStats {
    try {
      const key = this.getStatsKey();
      const stored = localStorage.getItem(key);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {
      // Fallback
    }
    return {
      totalWorkouts: 0,
      totalReps: 0,
      totalCalories: 0,
      totalDurationSeconds: 0,
      averageAccuracyScore: 0,
      streakDays: 0,
      lastWorkoutDate: ''
    };
  }

  public static clearHistory(): void {
    try {
      localStorage.removeItem(this.getHistoryKey());
      localStorage.removeItem(this.getStatsKey());
    } catch {
      // Ignore
    }
  }

  /* ==========================================================================
     MEAL LOGS & NUTRITION TRACKING (SCOPED BY CURRENT USER)
     ========================================================================== */

  public static getMeals(): MealLogItem[] {
    try {
      const key = this.getMealsKey();
      const stored = localStorage.getItem(key);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {
      // Fallback
    }
    return [];
  }

  public static saveMeal(meal: MealLogItem): void {
    try {
      const key = this.getMealsKey();
      const meals = this.getMeals();
      meals.unshift(meal);
      localStorage.setItem(key, JSON.stringify(meals.slice(0, 200)));

      // Asynchronous background sync to Node.js / MongoDB Backend
      ApiClient.saveMeal(meal).catch(() => {});
    } catch {
      // Ignore
    }
  }

  public static deleteMeal(id: string): void {
    try {
      const key = this.getMealsKey();
      const meals = this.getMeals().filter(m => m.id !== id);
      localStorage.setItem(key, JSON.stringify(meals));

      // Asynchronous background sync to Node.js / MongoDB Backend
      ApiClient.deleteMeal(id).catch(() => {});
    } catch {
      // Ignore
    }
  }

  public static getDailyNutrition(dateStr?: string): DailyNutritionSummary {
    const targetDate = dateStr || new Date().toISOString().split('T')[0];
    const settings = this.getSettings();
    const allMeals = this.getMeals();
    const dayMeals = allMeals.filter(m => m.date === targetDate);

    const totalCalories = dayMeals.reduce((sum, m) => sum + m.calories, 0);
    const targetCalories = settings.dailyCalorieTarget || 2000;
    const remainingCalories = Math.max(0, targetCalories - totalCalories);

    const consumedProtein = dayMeals.reduce((sum, m) => sum + (m.macros?.protein || 0), 0);
    const consumedCarbs = dayMeals.reduce((sum, m) => sum + (m.macros?.carbs || 0), 0);
    const consumedFat = dayMeals.reduce((sum, m) => sum + (m.macros?.fat || 0), 0);
    const consumedFiber = dayMeals.reduce((sum, m) => sum + (m.macros?.fiber || 0), 0);

    return {
      date: targetDate,
      targetCalories,
      totalCalories,
      remainingCalories,
      targetMacros: {
        protein: settings.dailyProteinTarget || 130,
        carbs: settings.dailyCarbsTarget || 220,
        fat: settings.dailyFatTarget || 55
      },
      consumedMacros: {
        protein: Math.round(consumedProtein * 10) / 10,
        carbs: Math.round(consumedCarbs * 10) / 10,
        fat: Math.round(consumedFat * 10) / 10,
        fiber: Math.round(consumedFiber * 10) / 10
      },
      meals: dayMeals
    };
  }

  /* ------------------- Current User & Cloud Sync ------------------- */
  public static getCurrentUser(): UserProfile | null {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.USER);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {
      // Ignore
    }
    return null;
  }

  public static saveCurrentUser(user: UserProfile): void {
    try {
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
      if (user.token) {
        ApiClient.setToken(user.token);
      }
      // Also sync user's targets with settings
      const settings = this.getSettings();
      if (user.dailyCalorieTarget) settings.dailyCalorieTarget = user.dailyCalorieTarget;
      if (user.dailyProteinTarget) settings.dailyProteinTarget = user.dailyProteinTarget;
      if (user.dailyCarbsTarget) settings.dailyCarbsTarget = user.dailyCarbsTarget;
      if (user.dailyFatTarget) settings.dailyFatTarget = user.dailyFatTarget;
      this.saveSettings(settings);

      // Trigger cloud sync
      this.syncFromCloud().catch(() => {});
    } catch {
      // Ignore
    }
  }

  public static clearCurrentUser(): void {
    try {
      localStorage.removeItem(STORAGE_KEYS.USER);
      ApiClient.setToken(null);
    } catch {
      // Ignore
    }
  }

  /**
   * Sync user history and meals from MongoDB Atlas
   */
  public static async syncFromCloud(): Promise<WorkoutHistoryItem[]> {
    try {
      const workouts = await ApiClient.getWorkouts();
      if (workouts && Array.isArray(workouts) && workouts.length > 0) {
        const key = this.getHistoryKey();
        localStorage.setItem(key, JSON.stringify(workouts));

        // Recompute stats
        const totalReps = workouts.reduce((s: number, w: any) => s + (w.reps || 0), 0);
        const totalCal = workouts.reduce((s: number, w: any) => s + (w.caloriesBurned || 0), 0);
        const totalSec = workouts.reduce((s: number, w: any) => s + (w.durationSeconds || 0), 0);
        const avgAcc = workouts.length > 0
          ? Math.round(workouts.reduce((s: number, w: any) => s + (w.accuracyScore || 85), 0) / workouts.length)
          : 0;

        const uniqueDates = Array.from(
          new Set(workouts.map((w: any) => w.date || w.createdAt?.split('T')[0]))
        ).filter(Boolean);

        const stats: OverallStats = {
          totalWorkouts: workouts.length,
          totalReps,
          totalCalories: totalCal,
          totalDurationSeconds: totalSec,
          averageAccuracyScore: avgAcc,
          streakDays: Math.max(1, uniqueDates.length),
          lastWorkoutDate: (uniqueDates[0] as string) || ''
        };
        localStorage.setItem(this.getStatsKey(), JSON.stringify(stats));

        const meals = await ApiClient.getMeals();
        if (meals && Array.isArray(meals)) {
          const mealsKey = this.getMealsKey();
          localStorage.setItem(mealsKey, JSON.stringify(meals));
        }

        return workouts;
      }
    } catch {
      // Ignore
    }
    return this.getHistory();
  }
}
