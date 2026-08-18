import {
  WorkoutHistoryItem,
  MealLogItem,
  DailyNutritionSummary,
  WorkoutSessionSummary,
  GeminiAnalysisResult,
  FoodScanResult,
  WorkoutRoutineInput,
  WorkoutRoutine
} from '../types';

import { GeminiService } from './geminiService';

const getApiBaseUrl = (): string => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  if (typeof window !== 'undefined') {
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return 'http://localhost:5050/api';
    }
  }
  return 'https://fitnessapp-27yw.onrender.com/api';
};

const API_BASE_URL = getApiBaseUrl();

export class ApiClient {
  private static token: string | null = localStorage.getItem('aifitcoach_auth_token');

  public static setToken(token: string | null): void {
    this.token = token;
    if (token) {
      localStorage.setItem('aifitcoach_auth_token', token);
    } else {
      localStorage.removeItem('aifitcoach_auth_token');
    }
  }

  public static getToken(): string | null {
    return this.token || localStorage.getItem('aifitcoach_auth_token');
  }

  public static async checkHealth(): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE_URL}/health`, { method: 'GET' });
      return res.ok;
    } catch {
      return false;
    }
  }

  private static async request<T>(endpoint: string, options: RequestInit = {}): Promise<T | null> {
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(options.headers as Record<string, string>)
      };

      const token = this.getToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers
      });

      if (!res.ok) {
        throw new Error(`API Error: ${res.statusText}`);
      }

      const json = await res.json();
      return json.data ?? json;
    } catch (err) {
      return null;
    }
  }

  /* ------------------- Auth ------------------- */
  public static async login(email: string, password: string): Promise<any | null> {
    const res = await this.request<any>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    if (res && res.token) {
      this.setToken(res.token);
    }
    return res;
  }

  public static async register(userData: any): Promise<any | null> {
    const res = await this.request<any>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData)
    });
    if (res && res.token) {
      this.setToken(res.token);
    }
    return res;
  }

  public static async googleAuth(googleData: {
    email: string;
    name?: string;
    avatarUrl?: string;
    googleId?: string;
  }): Promise<any | null> {
    const res = await this.request<any>('/auth/google', {
      method: 'POST',
      body: JSON.stringify(googleData)
    });
    if (res && res.token) {
      this.setToken(res.token);
    }
    return res;
  }

  public static async getProfile(): Promise<any | null> {
    return await this.request('/auth/profile');
  }

  /* ------------------- Workouts ------------------- */
  public static async saveWorkout(item: WorkoutHistoryItem): Promise<boolean> {
    const res = await this.request('/workouts', {
      method: 'POST',
      body: JSON.stringify(item)
    });
    return !!res;
  }

  public static async getWorkouts(): Promise<WorkoutHistoryItem[] | null> {
    return await this.request<WorkoutHistoryItem[]>('/workouts');
  }

  public static async getStats(): Promise<any | null> {
    return await this.request('/workouts/stats');
  }

  public static async deleteWorkout(id: string): Promise<boolean> {
    const res = await this.request(`/workouts/${id}`, { method: 'DELETE' });
    return !!res;
  }

  /* ------------------- Nutrition ------------------- */
  public static async saveMeal(meal: MealLogItem): Promise<boolean> {
    const res = await this.request('/nutrition/meals', {
      method: 'POST',
      body: JSON.stringify(meal)
    });
    return !!res;
  }

  public static async getMeals(): Promise<MealLogItem[] | null> {
    return await this.request<MealLogItem[]>('/nutrition/meals');
  }

  public static async getDailyNutrition(dateStr?: string): Promise<DailyNutritionSummary | null> {
    const query = dateStr ? `?date=${dateStr}` : '';
    return await this.request<DailyNutritionSummary>(`/nutrition/daily${query}`);
  }

  public static async deleteMeal(id: string): Promise<boolean> {
    const res = await this.request(`/nutrition/meals/${id}`, { method: 'DELETE' });
    return !!res;
  }

  /* ------------------- Exercises (Admin & Library) ------------------- */
  public static async getExercises(): Promise<any[] | null> {
    return await this.request<any[]>('/exercises');
  }

  public static async createExercise(exerciseData: any): Promise<any | null> {
    return await this.request<any>('/exercises', {
      method: 'POST',
      body: JSON.stringify(exerciseData)
    });
  }

  public static async updateExercise(id: string, exerciseData: any): Promise<any | null> {
    return await this.request<any>(`/exercises/${id}`, {
      method: 'PUT',
      body: JSON.stringify(exerciseData)
    });
  }

  public static async deleteExercise(id: string): Promise<boolean> {
    const res = await this.request(`/exercises/${id}`, { method: 'DELETE' });
    return !!res;
  }

  /* ------------------- Server-side AI Proxy ------------------- */
  public static async analyzeWorkout(session: WorkoutSessionSummary): Promise<GeminiAnalysisResult | null> {
    return await this.request<GeminiAnalysisResult>('/ai/analyze-workout', {
      method: 'POST',
      body: JSON.stringify({ session })
    });
  }

  public static async scanFood(query: string, imageBase64?: string): Promise<FoodScanResult | null> {
    return await this.request<FoodScanResult>('/ai/scan-food', {
      method: 'POST',
      body: JSON.stringify({ query, imageBase64 })
    });
  }

  public static async generateRoutine(input: WorkoutRoutineInput): Promise<WorkoutRoutine> {
    try {
      const res = await this.request<any>('/ai/generate-routine', {
        method: 'POST',
        body: JSON.stringify(input)
      });
      if (res && (res.mainRoutine || res.mainWorkout)) {
        return {
          title: res.title || `Giáo Án Tập Luyện Khoa Học`,
          goal: res.goal || res.targetGoal || 'Tăng cơ giảm mỡ',
          level: res.level || res.difficulty || 'Người mới bắt đầu',
          durationMinutes: Number(res.durationMinutes || res.estimatedDurationMinutes) || input.durationMinutes || 20,
          estimatedCalories: Number(res.estimatedCalories || res.estimatedCaloriesBurn) || 210,
          overview: res.overview || 'Giáo án khoa học tối ưu hóa kích hoạt sợi cơ và phục hồi.',
          warmUp: Array.isArray(res.warmUp) ? res.warmUp : [],
          mainRoutine: Array.isArray(res.mainRoutine || res.mainWorkout)
            ? (res.mainRoutine || res.mainWorkout).map((item: any) => ({
                exerciseId: item.exerciseId || 'squat',
                exerciseName: item.exerciseName || item.nameVi || item.name || 'Squat (Gánh Đùi)',
                exerciseNameEn: item.exerciseNameEn || item.nameEn || 'Bodyweight Squat',
                sets: Number(item.sets) || 3,
                reps: typeof item.reps === 'number' ? item.reps : parseInt(item.repsOrSeconds || '12', 10) || 12,
                isHold: item.isHold ?? (item.exerciseId === 'plank' || item.exerciseId === 'warrior_yoga'),
                restSeconds: Number(item.restSeconds) || 45,
                formCue: item.formCue || 'Kiểm soát nhịp thở và giữ form chuẩn trong suốt chuyển động.',
                targetMuscle: item.targetMuscle || 'Toàn thân',
                gifUrl: item.gifUrl
              }))
            : [],
          coolDown: Array.isArray(res.coolDown) ? res.coolDown : [],
          coachTip: res.coachTip || 'Bổ sung đủ nước và 25-30g đạm sau buổi tập để phục hồi cơ nạc tốt nhất.'
        };
      }
    } catch (err) {
      console.warn('Backend generateRoutine error, falling back to GeminiService:', err);
    }
    return GeminiService.generatePersonalizedRoutine(input);
  }
}
