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

  public static async generateRoutine(input: WorkoutRoutineInput): Promise<WorkoutRoutine | null> {
    return await this.request<WorkoutRoutine>('/ai/generate-routine', {
      method: 'POST',
      body: JSON.stringify(input)
    });
  }
}
