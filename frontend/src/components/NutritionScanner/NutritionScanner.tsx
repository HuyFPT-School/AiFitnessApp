import React, { useState, useRef, useEffect } from 'react';
import {
  Camera,
  Upload,
  Sparkles,
  Flame,
  Utensils,
  CheckCircle2,
  PlusCircle,
  RefreshCw,
  Trash2,
  Play,
  Heart,
  Image as ImageIcon,
  Target,
  Scale,
  Info
} from 'lucide-react';
import {
  FoodScanResult,
  MealLogItem,
  DailyNutritionSummary,
  MealType,
  ExerciseInfo,
  UserProfile
} from '../../types';
import { GeminiService } from '../../services/geminiService';
import { StorageService } from '../../services/storageService';
import { EXERCISES } from '../../data/exercises';

interface NutritionScannerProps {
  onStartExercise: (exercise: ExerciseInfo) => void;
  currentUser?: UserProfile | null;
}

type SampleCategory = 'all' | 'high_protein' | 'lean_cut' | 'vietnamese' | 'breakfast';

interface QuickSample {
  name: string;
  category: SampleCategory;
  icon: string;
  tag: string;
  calEst: number;
  proteinEst: number;
}

const QUICK_SAMPLES: QuickSample[] = [
  { name: 'Phở bò tái nạm Hà Nội', category: 'vietnamese', icon: 'dish', tag: 'Truyền thống', calEst: 485, proteinEst: 32 },
  { name: 'Cơm tấm sườn nướng trứng ốp la', category: 'vietnamese', icon: 'dish', tag: 'Năng lượng cao', calEst: 680, proteinEst: 36 },
  { name: 'Salad ức gà áp chảo sốt mè', category: 'lean_cut', icon: 'salad', tag: 'Lean Cut / Giảm mỡ', calEst: 360, proteinEst: 38 },
  { name: 'Bánh mì thịt trứng pate', category: 'breakfast', icon: 'bread', tag: 'Bữa sáng nhanh', calEst: 510, proteinEst: 24 },
  { name: 'Cháo yến mạch chuối & bơ đậu phộng', category: 'breakfast', icon: 'oatmeal', tag: 'Pre-workout', calEst: 430, proteinEst: 18 },
  { name: 'Bò bít tết khoai lang & măng tây', category: 'high_protein', icon: 'steak', tag: 'Tăng cơ nạc', calEst: 560, proteinEst: 45 },
  { name: 'Bún chả thịt nướng Hà Nội', category: 'vietnamese', icon: 'dish', tag: 'Truyền thống', calEst: 590, proteinEst: 28 },
  { name: 'Trứng ốp la 2 quả & bơ sáp bánh mì đen', category: 'high_protein', icon: 'egg', tag: 'Keto / Low-carb', calEst: 390, proteinEst: 20 },
  { name: 'Cá hồi áp chảo sốt bơ tỏi & bông cải xanh', category: 'high_protein', icon: 'fish', tag: 'Omega-3', calEst: 460, proteinEst: 35 },
  { name: 'Sinh tố chuối Whey Protein sữa hạnh nhân', category: 'high_protein', icon: 'smoothie', tag: 'Post-workout', calEst: 290, proteinEst: 30 }
];

export const NutritionScanner: React.FC<NutritionScannerProps> = ({ onStartExercise, currentUser }) => {
  // Input Modes: 'text' | 'camera' | 'upload'
  const [inputMode, setInputMode] = useState<'text' | 'camera' | 'upload'>('text');
  const [textQuery, setTextQuery] = useState('');
  const [selectedImageBase64, setSelectedImageBase64] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<FoodScanResult | null>(null);
  const [portionScale, setPortionScale] = useState<number>(1.0); // 0.5x, 1.0x, 1.5x, 2.0x
  const [selectedMealType, setSelectedMealType] = useState<MealType>('lunch');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [sampleFilter, setSampleFilter] = useState<SampleCategory>('all');

  // Daily Nutrition Summary
  const [dailyData, setDailyData] = useState<DailyNutritionSummary>(StorageService.getDailyNutrition());

  useEffect(() => {
    setDailyData(StorageService.getDailyNutrition());
    if (currentUser) {
      StorageService.syncFromCloud().then(() => {
        setDailyData(StorageService.getDailyNutrition());
      });
    }
  }, [currentUser]);

  // Camera Refs & State
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);

  const refreshDailyData = () => {
    setDailyData(StorageService.getDailyNutrition());
  };

  // Start Camera Stream
  const startCameraStream = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'environment'
        },
        audio: false
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setIsCameraActive(true);
      }
    } catch (err) {
      console.error('Camera error:', err);
      alert('Không thể mở camera. Vui lòng cho phép quyền truy cập camera trong trình duyệt.');
    }
  };

  const stopCameraStream = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(t => t.stop());
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  };

  useEffect(() => {
    if (inputMode === 'camera') {
      startCameraStream();
    } else {
      stopCameraStream();
    }
    return () => {
      stopCameraStream();
    };
  }, [inputMode]);

  // Capture Photo from Camera
  const capturePhoto = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth || 640;
    canvas.height = videoRef.current.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      const base64 = canvas.toDataURL('image/jpeg', 0.85);
      setSelectedImageBase64(base64);
      stopCameraStream();
      handleScan(base64, 'Ảnh chụp món ăn từ camera');
    }
  };

  // Handle File Upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      setSelectedImageBase64(base64);
      handleScan(base64, file.name);
    };
    reader.readAsDataURL(file);
  };

  // Execute AI Scan
  const handleScan = async (imgBase64?: string | null, queryText?: string) => {
    const query = queryText || textQuery || 'Món ăn dinh dưỡng thể thao';
    const image = imgBase64 || selectedImageBase64 || undefined;

    setIsScanning(true);
    setPortionScale(1.0);
    try {
      const result = await GeminiService.analyzeFood(query, image);
      setScanResult(result);
    } catch (err) {
      console.warn('Food scan error:', err);
    } finally {
      setIsScanning(false);
    }
  };

  // Save to Daily Log with portion scaling
  const handleSaveToDaily = () => {
    if (!scanResult) return;

    const now = new Date();
    const timeStr = now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    const dateStr = now.toISOString().split('T')[0];

    const scaledCalories = Math.round(scanResult.totalCalories * portionScale);
    const scaledMacros = {
      protein: Math.round(scanResult.macros.protein * portionScale * 10) / 10,
      carbs: Math.round(scanResult.macros.carbs * portionScale * 10) / 10,
      fat: Math.round(scanResult.macros.fat * portionScale * 10) / 10,
      fiber: Math.round((scanResult.macros.fiber || 0) * portionScale * 10) / 10
    };

    const item: MealLogItem = {
      id: 'meal_' + Date.now(),
      date: dateStr,
      timeStr,
      timestamp: Date.now(),
      mealType: selectedMealType,
      dishName: scanResult.dishName + (portionScale !== 1.0 ? ` (${portionScale}x)` : ''),
      servingPortion: portionScale,
      calories: scaledCalories,
      macros: scaledMacros,
      ingredients: scanResult.ingredients.map(ing => ({
        ...ing,
        weightGrams: Math.round(ing.weightGrams * portionScale),
        calories: Math.round(ing.calories * portionScale),
        protein: Math.round(ing.protein * portionScale * 10) / 10,
        carbs: Math.round(ing.carbs * portionScale * 10) / 10,
        fat: Math.round(ing.fat * portionScale * 10) / 10
      })),
      imageBase64: scanResult.imageBase64
    };

    StorageService.saveMeal(item);
    refreshDailyData();
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  const handleDeleteMeal = (id: string) => {
    StorageService.deleteMeal(id);
    refreshDailyData();
  };

  // Filtered samples
  const filteredSamples = QUICK_SAMPLES.filter(
    s => sampleFilter === 'all' || s.category === sampleFilter
  );

  // Scaled Active Result Values
  const activeCalories = scanResult ? Math.round(scanResult.totalCalories * portionScale) : 0;
  const activeProtein = scanResult ? Math.round(scanResult.macros.protein * portionScale * 10) / 10 : 0;
  const activeCarbs = scanResult ? Math.round(scanResult.macros.carbs * portionScale * 10) / 10 : 0;
  const activeFat = scanResult ? Math.round(scanResult.macros.fat * portionScale * 10) / 10 : 0;
  const activeFiber = scanResult ? Math.round((scanResult.macros.fiber || 0) * portionScale * 10) / 10 : 0;

  // Calorie percentages of daily budget
  const calPercent = Math.min(100, Math.round((dailyData.totalCalories / dailyData.targetCalories) * 100));
  const proteinPercent = Math.min(100, Math.round((dailyData.consumedMacros.protein / dailyData.targetMacros.protein) * 100));
  const carbsPercent = Math.min(100, Math.round((dailyData.consumedMacros.carbs / dailyData.targetMacros.carbs) * 100));
  const fatPercent = Math.min(100, Math.round((dailyData.consumedMacros.fat / dailyData.targetMacros.fat) * 100));

  return (
    <div className="mx-auto max-w-[1680px] w-full space-y-8 p-4 sm:p-8 xl:px-12 animate-in fade-in duration-300">
      {/* 1. Header Banner */}
      <div className="rounded-3xl border border-[var(--border-card)] bg-[var(--bg-card)] p-6 sm:p-8 space-y-3 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center space-x-2 rounded-full border border-[#eab308]/30 bg-[#eab308]/10 px-3.5 py-1 text-xs font-bold text-[#ca8a04] dark:text-[#eab308]">
              <Sparkles className="h-3.5 w-3.5" />
              <span>AI FOOD &amp; MACRO SCANNER • GEMINI VISION PROTOCOL</span>
            </div>
            <h1 className="mt-2 font-heading text-3xl sm:text-4xl font-extrabold text-[var(--text-primary)]">
              Quét Khẩu Phần Ăn &amp; Tính Calo Thông Minh
            </h1>
            <p className="text-xs text-[var(--text-muted)] sm:text-sm max-w-2xl leading-relaxed">
              Nhận diện hình ảnh món ăn qua Camera hoặc mô tả, bóc tách chính xác Calo, Protein, Carbs, Fat và tự động quy đổi thời gian tập luyện để đốt cháy năng lượng nạp vào.
            </p>
          </div>

          {/* Daily Telemetry Cards */}
          <div className="grid grid-cols-2 gap-3 sm:flex sm:items-center sm:space-x-4 font-mono text-xs">
            <div className="rounded-2xl bg-[var(--bg-canvas)] border border-[var(--border-subtle)] p-3.5 shadow-xs">
              <span className="text-[10px] text-[var(--text-muted)] uppercase font-semibold block">ĐÃ NẠP HÔM NAY</span>
              <p className="font-heading text-xl font-extrabold text-orange-600 dark:text-orange-400">
                {dailyData.totalCalories} <span className="text-xs text-[var(--text-muted)]">/ {dailyData.targetCalories} kcal</span>
              </p>
            </div>

            <div className="rounded-2xl bg-[var(--bg-canvas)] border border-[var(--border-subtle)] p-3.5 shadow-xs">
              <span className="text-[10px] text-[var(--text-muted)] uppercase font-semibold block">CÒN LẠI</span>
              <p className="font-heading text-xl font-extrabold text-[#0d9488]">
                {dailyData.remainingCalories} <span className="text-xs text-[var(--text-muted)]">kcal</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Main Scanner Split Viewport */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left Column: Multimodal Input Hub & Daily Targets */}
        <div className="lg:col-span-6 space-y-5">
          {/* Input Mode Card */}
          <div className="card-impeccable p-6 space-y-5">
            {/* Mode Switcher Tabs */}
            <div className="grid grid-cols-3 gap-2 rounded-2xl bg-[var(--bg-canvas)] p-1.5 border border-[var(--border-subtle)] text-xs font-bold">
              <button
                onClick={() => setInputMode('text')}
                className={`flex items-center justify-center space-x-1.5 rounded-xl py-2.5 transition-all cursor-pointer ${
                  inputMode === 'text'
                    ? 'btn-kinpaku text-[#1c1917]'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                }`}
              >
                <Utensils className="h-4 w-4" />
                <span>Nhập Tên / Mẫu</span>
              </button>

              <button
                onClick={() => setInputMode('camera')}
                className={`flex items-center justify-center space-x-1.5 rounded-xl py-2.5 transition-all cursor-pointer ${
                  inputMode === 'camera'
                    ? 'btn-kinpaku text-[#1c1917]'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                }`}
              >
                <Camera className="h-4 w-4" />
                <span>Chụp Camera</span>
              </button>

              <button
                onClick={() => setInputMode('upload')}
                className={`flex items-center justify-center space-x-1.5 rounded-xl py-2.5 transition-all cursor-pointer ${
                  inputMode === 'upload'
                    ? 'btn-kinpaku text-[#1c1917]'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                }`}
              >
                <Upload className="h-4 w-4" />
                <span>Tải Ảnh Lên</span>
              </button>
            </div>

            {/* Mode 1: Camera Capture Viewport with Target Framing HUD */}
            {inputMode === 'camera' && (
              <div className="space-y-4 animate-in fade-in duration-200">
                {selectedImageBase64 ? (
                  /* Captured Photo Preview */
                  <div className="space-y-3">
                    <div className="relative aspect-video w-full rounded-2xl overflow-hidden border border-[var(--border-subtle)] shadow-xs">
                      <img
                        src={selectedImageBase64}
                        alt="Ảnh chụp món ăn"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-3 right-3 flex items-center space-x-2">
                        <button
                          onClick={() => {
                            setSelectedImageBase64(null);
                            startCameraStream();
                          }}
                          className="flex items-center space-x-1 rounded-xl bg-black/70 px-3 py-1.5 text-xs font-bold text-white hover:bg-black/90 backdrop-blur-md transition-all cursor-pointer"
                        >
                          <RefreshCw className="h-3.5 w-3.5" />
                          <span>Chụp lại</span>
                        </button>
                      </div>
                    </div>

                    <button
                      onClick={() => handleScan(selectedImageBase64)}
                      disabled={isScanning}
                      className="btn-kinpaku w-full py-3.5 flex items-center justify-center space-x-2 text-xs font-bold uppercase tracking-wider cursor-pointer"
                    >
                      <Sparkles className="h-4 w-4" />
                      <span>QUÉT LẠI ẢNH CHỤP NÀY</span>
                    </button>
                  </div>
                ) : (
                  /* Live Camera View */
                  <>
                    <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-[var(--border-card)] bg-black shadow-inner flex items-center justify-center">
                      <video
                        ref={videoRef}
                        playsInline
                        muted
                        className="h-full w-full object-cover"
                      />

                      {/* Smart Food Scanner Reticle */}
                      <div className="absolute inset-6 border-2 border-dashed border-[#eab308]/70 rounded-2xl pointer-events-none flex flex-col items-center justify-between p-4">
                        <span className="rounded-full bg-black/70 px-3 py-1 text-[11px] font-bold text-[#eab308] font-mono backdrop-blur-md">
                          AI FOOD VISION LENS
                        </span>
                        <span className="rounded-full bg-black/60 px-3 py-1 text-[10px] text-white font-mono backdrop-blur-md">
                          CĂN CHỈNH ĐĨA THỨC ĂN VÀO KHUNG NGẮM
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={capturePhoto}
                      disabled={isScanning}
                      className="btn-kinpaku w-full py-4 flex items-center justify-center space-x-2 text-xs font-bold uppercase tracking-wider cursor-pointer"
                    >
                      <Camera className="h-4 w-4" />
                      <span>CHỤP ẢNH &amp; PHÂN TÍCH CALO VỚI GEMINI AI</span>
                    </button>
                  </>
                )}
              </div>
            )}

            {/* Mode 2: Drag-and-drop & File Upload (No Redundant Duplicate Frame) */}
            {inputMode === 'upload' && (
              <div className="space-y-4 animate-in fade-in duration-200">
                {selectedImageBase64 ? (
                  /* Image Preview Card (Replaces the dropzone cleanly) */
                  <div className="space-y-3">
                    <div className="relative aspect-video w-full rounded-2xl overflow-hidden border border-[var(--border-subtle)] shadow-xs group">
                      <img
                        src={selectedImageBase64}
                        alt="Ảnh món ăn"
                        className="w-full h-full object-cover"
                      />

                      {/* Top Action Floating Bar */}
                      <div className="absolute top-3 right-3 flex items-center space-x-2">
                        <label className="flex items-center space-x-1 rounded-xl bg-black/75 px-3 py-1.5 text-xs font-bold text-white hover:bg-black/90 backdrop-blur-md transition-all cursor-pointer">
                          <RefreshCw className="h-3.5 w-3.5" />
                          <span>Đổi ảnh khác</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleFileUpload}
                            className="hidden"
                          />
                        </label>

                        <button
                          onClick={() => {
                            setSelectedImageBase64(null);
                            setScanResult(null);
                          }}
                          className="flex h-8 w-8 items-center justify-center rounded-xl bg-black/75 text-rose-400 hover:bg-rose-600 hover:text-white backdrop-blur-md transition-all cursor-pointer"
                          title="Xóa ảnh"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    <button
                      onClick={() => handleScan(selectedImageBase64)}
                      disabled={isScanning}
                      className="btn-kinpaku w-full py-3.5 flex items-center justify-center space-x-2 text-xs font-bold uppercase tracking-wider cursor-pointer"
                    >
                      <Sparkles className="h-4 w-4" />
                      <span>QUÉT LẠI ẢNH NÀY VỚI GEMINI AI</span>
                    </button>
                  </div>
                ) : (
                  /* Empty Dropzone State */
                  <label className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[var(--border-subtle)] bg-[var(--bg-canvas)] p-8 hover:border-[#eab308]/70 transition-all cursor-pointer group text-center space-y-3">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#eab308]/15 text-[#ca8a04] dark:text-[#eab308] group-hover:scale-105 transition-transform">
                      <ImageIcon className="h-7 w-7" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-[var(--text-primary)]">
                        Kéo thả ảnh đĩa thức ăn vào đây hoặc <span className="text-[#ca8a04] dark:text-[#eab308] underline">chọn từ thiết bị</span>
                      </p>
                      <p className="text-[11px] text-[var(--text-muted)] mt-1">
                        Hỗ trợ JPG, PNG, WebP (Tự động nén tối ưu trước khi gửi AI)
                      </p>
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
            )}

            {/* Mode 3: Text Input & Categorized Quick Samples */}
            {inputMode === 'text' && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-[var(--text-primary)]">
                    NHẬP TÊN MÓN HOẶC MÔ TẢ KHẨU PHẦN:
                  </label>
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={textQuery}
                      onChange={e => setTextQuery(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleScan()}
                      placeholder="Ví dụ: 1 tô phở bò tái nạm, 1 quả trứng chần, ít bánh phở..."
                      className="flex-1 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-canvas)] px-4 py-3 text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none focus:border-[#eab308]/60 transition-colors"
                    />
                    <button
                      onClick={() => handleScan()}
                      disabled={!textQuery.trim() || isScanning}
                      className="btn-kinpaku px-6 text-xs font-bold uppercase tracking-wider disabled:opacity-40 cursor-pointer"
                    >
                      Quét
                    </button>
                  </div>
                </div>

                {/* Sample Category Filter Pills */}
                <div className="space-y-2 pt-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider">
                      CHỌN MẪU MÓN ĂN THỂ HÌNH:
                    </span>
                    <div className="flex space-x-1 text-[10px] font-bold">
                      <button
                        onClick={() => setSampleFilter('all')}
                        className={`px-2 py-0.5 rounded-md cursor-pointer ${
                          sampleFilter === 'all' ? 'bg-[#eab308] text-[#1c1917]' : 'text-[var(--text-muted)]'
                        }`}
                      >
                        Tất cả
                      </button>
                      <button
                        onClick={() => setSampleFilter('high_protein')}
                        className={`px-2 py-0.5 rounded-md cursor-pointer ${
                          sampleFilter === 'high_protein' ? 'bg-[#eab308] text-[#1c1917]' : 'text-[var(--text-muted)]'
                        }`}
                      >
                        Tăng cơ
                      </button>
                      <button
                        onClick={() => setSampleFilter('lean_cut')}
                        className={`px-2 py-0.5 rounded-md cursor-pointer ${
                          sampleFilter === 'lean_cut' ? 'bg-[#eab308] text-[#1c1917]' : 'text-[var(--text-muted)]'
                        }`}
                      >
                        Giảm mỡ
                      </button>
                      <button
                        onClick={() => setSampleFilter('vietnamese')}
                        className={`px-2 py-0.5 rounded-md cursor-pointer ${
                          sampleFilter === 'vietnamese' ? 'bg-[#eab308] text-[#1c1917]' : 'text-[var(--text-muted)]'
                        }`}
                      >
                        Món Việt
                      </button>
                    </div>
                  </div>

                  {/* Sample Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
                    {filteredSamples.map((sample, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          setTextQuery(sample.name);
                          handleScan(null, sample.name);
                        }}
                        className="flex items-center justify-between rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-canvas)] p-2.5 text-left text-xs font-semibold text-[var(--text-secondary)] hover:border-[#eab308]/60 hover:text-[var(--text-primary)] hover:bg-[var(--bg-card)] transition-all cursor-pointer group shadow-2xs"
                      >
                        <div className="flex items-center space-x-2 truncate">
                          <Utensils className="h-3.5 w-3.5 text-[#0d9488] flex-shrink-0" />
                          <span className="truncate text-xs">{sample.name}</span>
                        </div>
                        <span className="text-[10px] font-mono text-orange-600 dark:text-orange-400 font-bold ml-1 flex-shrink-0">
                          ~{sample.calEst} kcal
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Daily Nutrition Target Progress Dashboard */}
          <div className="card-impeccable p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
              <div className="flex items-center space-x-2">
                <Target className="h-5 w-5 text-[#ca8a04] dark:text-[#eab308]" />
                <h3 className="font-heading text-lg font-bold text-[var(--text-primary)]">
                  Tiến Độ Dinh Dưỡng Hôm Nay
                </h3>
              </div>
              <span className="text-xs font-mono text-[var(--text-muted)]">
                {new Date().toLocaleDateString('vi-VN')}
              </span>
            </div>

            {/* Calories Progress Bar */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-bold font-mono">
                <span className="text-[var(--text-primary)]">ĐÃ NẠP: {dailyData.totalCalories} kcal ({calPercent}%)</span>
                <span className="text-[#ca8a04] dark:text-[#eab308]">MỤC TIÊU: {dailyData.targetCalories} kcal</span>
              </div>
              <div className="h-3 w-full overflow-hidden rounded-full bg-[var(--bg-canvas)] border border-[var(--border-subtle)]">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#eab308] to-[#ca8a04] transition-all duration-500 shadow-xs"
                  style={{ width: `${calPercent}%` }}
                />
              </div>
            </div>

            {/* Macros 3 Progress Badges */}
            <div className="grid grid-cols-3 gap-3 pt-2">
              {/* Protein */}
              <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-canvas)] p-3 space-y-1 font-mono">
                <div className="flex justify-between text-[10px] text-[var(--text-muted)] font-bold">
                  <span>PROTEIN</span>
                  <span>{proteinPercent}%</span>
                </div>
                <p className="font-heading text-lg font-extrabold text-[#0d9488]">
                  {dailyData.consumedMacros.protein}g
                </p>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--bg-card)]">
                  <div
                    className="h-full bg-[#0d9488] rounded-full transition-all"
                    style={{ width: `${proteinPercent}%` }}
                  />
                </div>
                <span className="text-[9px] text-[var(--text-muted)] block">/ {dailyData.targetMacros.protein}g mục tiêu</span>
              </div>

              {/* Carbs */}
              <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-canvas)] p-3 space-y-1 font-mono">
                <div className="flex justify-between text-[10px] text-[var(--text-muted)] font-bold">
                  <span>CARBS</span>
                  <span>{carbsPercent}%</span>
                </div>
                <p className="font-heading text-lg font-extrabold text-amber-600 dark:text-amber-400">
                  {dailyData.consumedMacros.carbs}g
                </p>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--bg-card)]">
                  <div
                    className="h-full bg-amber-500 rounded-full transition-all"
                    style={{ width: `${carbsPercent}%` }}
                  />
                </div>
                <span className="text-[9px] text-[var(--text-muted)] block">/ {dailyData.targetMacros.carbs}g mục tiêu</span>
              </div>

              {/* Fat */}
              <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-canvas)] p-3 space-y-1 font-mono">
                <div className="flex justify-between text-[10px] text-[var(--text-muted)] font-bold">
                  <span>FAT</span>
                  <span>{fatPercent}%</span>
                </div>
                <p className="font-heading text-lg font-extrabold text-rose-600 dark:text-rose-400">
                  {dailyData.consumedMacros.fat}g
                </p>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--bg-card)]">
                  <div
                    className="h-full bg-rose-500 rounded-full transition-all"
                    style={{ width: `${fatPercent}%` }}
                  />
                </div>
                <span className="text-[9px] text-[var(--text-muted)] block">/ {dailyData.targetMacros.fat}g mục tiêu</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Scan Result, Portion Scale, & Exercise Burn Conversion */}
        <div className="lg:col-span-6 space-y-4">
          {isScanning ? (
            <div className="card-impeccable p-12 flex flex-col items-center justify-center text-center space-y-4 min-h-[420px]">
              <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-[#eab308]/20 border border-[#eab308]/40">
                <Sparkles className="h-8 w-8 text-[#ca8a04] dark:text-[#eab308] animate-spin" />
              </div>
              <div>
                <h3 className="font-heading text-xl font-bold text-[var(--text-primary)]">
                  Gemini Multimodal AI Đang Phân Tích Món Ăn...
                </h3>
                <p className="text-xs text-[var(--text-muted)] mt-1 max-w-sm">
                  Đang nhận diện từng thành phần nguyên liệu, tính toán Calo, bóc tách Protein, Carbs, Fat và tính thời gian tập luyện đốt mỡ...
                </p>
              </div>
            </div>
          ) : scanResult ? (
            <div className="card-impeccable p-6 space-y-6 animate-in fade-in duration-300">
              {/* Dish Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--border-subtle)] pb-4">
                <div>
                  <span className="text-[10px] font-bold text-[#0d9488] uppercase tracking-wider">
                    KẾT QUẢ PHÂN TÍCH AI ({scanResult.confidenceScore}% ĐỘ TIN CẬY)
                  </span>
                  <h2 className="font-heading text-2xl sm:text-3xl font-extrabold text-[var(--text-primary)]">
                    {scanResult.dishName}
                  </h2>
                  <div className="flex items-center space-x-2 mt-0.5 text-xs text-[var(--text-muted)] font-mono">
                    <span>{scanResult.servingSize}</span>
                    {scanResult.glycemicIndex && (
                      <span className="rounded-md bg-[var(--bg-canvas)] px-2 py-0.2 text-[10px] text-[var(--text-secondary)] border border-[var(--border-subtle)]">
                        GI: {scanResult.glycemicIndex}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-canvas)] px-3.5 py-1.5 text-center font-mono shadow-2xs">
                    <span className="text-[9px] text-[var(--text-muted)] uppercase block font-semibold">HEALTH SCORE</span>
                    <span className="font-heading text-lg font-bold text-[#0d9488]">
                      {scanResult.healthScore}/100
                    </span>
                  </div>
                </div>
              </div>

              {/* Portion Scale Adjuster (0.5x, 1.0x, 1.5x, 2.0x) */}
              <div className="flex items-center justify-between rounded-2xl bg-[var(--bg-canvas)] p-3 border border-[var(--border-subtle)] text-xs">
                <div className="flex items-center space-x-2">
                  <Scale className="h-4 w-4 text-[#ca8a04] dark:text-[#eab308]" />
                  <span className="font-bold text-[var(--text-primary)]">ĐIỀU CHỈNH KHẨU PHẦN:</span>
                </div>
                <div className="flex items-center space-x-1.5 font-bold font-mono">
                  {[0.5, 1.0, 1.5, 2.0].map(scale => (
                    <button
                      key={scale}
                      onClick={() => setPortionScale(scale)}
                      className={`px-3 py-1 rounded-xl transition-all cursor-pointer ${
                        portionScale === scale
                          ? 'btn-kinpaku text-[#1c1917] shadow-xs'
                          : 'bg-[var(--bg-card)] text-[var(--text-muted)] border border-[var(--border-subtle)] hover:text-[var(--text-primary)]'
                      }`}
                    >
                      {scale}x
                    </button>
                  ))}
                </div>
              </div>

              {/* Total Calorie & Macros Dashboard */}
              <div className="grid grid-cols-5 gap-2 rounded-2xl bg-[var(--bg-canvas)] border border-[var(--border-subtle)] p-3 sm:p-4 text-center font-mono shadow-xs">
                <div>
                  <span className="text-[10px] text-[var(--text-muted)] uppercase font-semibold">TỔNG CALO</span>
                  <p className="font-heading text-xl sm:text-2xl font-extrabold text-orange-600 dark:text-orange-400">
                    {activeCalories}
                  </p>
                  <span className="text-[9px] text-[var(--text-muted)]">kcal</span>
                </div>

                <div className="border-l border-[var(--border-subtle)]">
                  <span className="text-[10px] text-[var(--text-muted)] uppercase font-semibold">PROTEIN</span>
                  <p className="font-heading text-lg sm:text-xl font-extrabold text-[#0d9488]">
                    {activeProtein}g
                  </p>
                  <span className="text-[9px] text-[var(--text-muted)]">Đạm</span>
                </div>

                <div className="border-l border-[var(--border-subtle)]">
                  <span className="text-[10px] text-[var(--text-muted)] uppercase font-semibold">CARBS</span>
                  <p className="font-heading text-lg sm:text-xl font-extrabold text-amber-600 dark:text-amber-400">
                    {activeCarbs}g
                  </p>
                  <span className="text-[9px] text-[var(--text-muted)]">Đường bột</span>
                </div>

                <div className="border-l border-[var(--border-subtle)]">
                  <span className="text-[10px] text-[var(--text-muted)] uppercase font-semibold">FAT</span>
                  <p className="font-heading text-lg sm:text-xl font-extrabold text-rose-600 dark:text-rose-400">
                    {activeFat}g
                  </p>
                  <span className="text-[9px] text-[var(--text-muted)]">Chất béo</span>
                </div>

                <div className="border-l border-[var(--border-subtle)]">
                  <span className="text-[10px] text-[var(--text-muted)] uppercase font-semibold">FIBER</span>
                  <p className="font-heading text-lg sm:text-xl font-extrabold text-emerald-600 dark:text-emerald-400">
                    {activeFiber}g
                  </p>
                  <span className="text-[9px] text-[var(--text-muted)]">Chất xơ</span>
                </div>
              </div>

              {/* Detailed Ingredients Table */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-primary)]">
                  Bảng Thành Phần Bóc Tách Chi Tiết:
                </h3>
                <div className="overflow-x-auto rounded-2xl border border-[var(--border-subtle)] shadow-xs">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[var(--bg-canvas)] border-b border-[var(--border-subtle)] text-[var(--text-muted)] font-mono text-[10px] uppercase">
                      <tr>
                        <th className="px-3.5 py-2.5">Nguyên liệu</th>
                        <th className="px-3.5 py-2.5">Khối lượng</th>
                        <th className="px-3.5 py-2.5">Calo</th>
                        <th className="px-3.5 py-2.5">Protein</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border-subtle)] font-mono">
                      {scanResult.ingredients.map((item, idx) => (
                        <tr key={idx} className="hover:bg-[var(--bg-canvas)]/50 transition-colors">
                          <td className="px-3.5 py-2.5 font-sans font-medium text-[var(--text-primary)]">
                            {item.name}
                          </td>
                          <td className="px-3.5 py-2.5 text-[var(--text-muted)]">
                            {Math.round(item.weightGrams * portionScale)}g
                          </td>
                          <td className="px-3.5 py-2.5 text-orange-600 dark:text-orange-400 font-bold">
                            {Math.round(item.calories * portionScale)} kcal
                          </td>
                          <td className="px-3.5 py-2.5 text-[#0d9488] font-bold">
                            {Math.round(item.protein * portionScale * 10) / 10}g
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Exercise Burn Equivalents & Direct Workout Launcher */}
              <div className="space-y-3 rounded-2xl border border-[#eab308]/30 bg-[var(--bg-canvas)] p-4 shadow-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Flame className="h-4 w-4 text-orange-500" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-primary)]">
                      Quy Đổi Bài Tập Để Đốt Cháy {activeCalories} kcal:
                    </h3>
                  </div>
                  <span className="text-[10px] font-mono text-[var(--text-muted)]">AI VISION SYNC</span>
                </div>

                <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                  {scanResult.burnEstimates.slice(0, 3).map((burn, idx) => {
                    const matchedEx = EXERCISES.find(e => e.id === burn.exerciseId) || EXERCISES[0];
                    const scaledMins = Math.round(burn.durationMinutes * portionScale);
                    return (
                      <div
                        key={idx}
                        className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-3 flex flex-col justify-between space-y-2 shadow-xs"
                      >
                        <div>
                          <span className="text-[11px] font-bold text-[var(--text-primary)] block">
                            {burn.exerciseNameVi}
                          </span>
                          <span className="font-heading text-lg font-extrabold text-[#ca8a04] dark:text-[#eab308] font-mono">
                            ~{scaledMins} phút
                          </span>
                        </div>

                        <button
                          onClick={() => onStartExercise(matchedEx)}
                          className="btn-kinpaku w-full py-1.5 flex items-center justify-center space-x-1 text-[10px] font-bold uppercase tracking-wider cursor-pointer"
                        >
                          <Play className="h-3 w-3 fill-current" />
                          <span>Tập Bài Này Ngay</span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* AI Dietary Advice & Healthier Swaps */}
              <div className="space-y-2 text-xs">
                <h3 className="font-bold uppercase tracking-wider text-[var(--text-primary)] flex items-center space-x-1.5">
                  <Heart className="h-4 w-4 text-rose-500" />
                  <span>Lời Khuyên Dinh Dưỡng Từ HLV AI:</span>
                </h3>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <div className="rounded-xl border border-[#0d9488]/30 bg-[var(--bg-canvas)] p-3 space-y-1">
                    <span className="text-[#0d9488] font-bold text-[11px] uppercase">Mục tiêu tăng cơ (Bulking):</span>
                    <p className="text-[var(--text-secondary)] leading-relaxed">
                      {scanResult.dietaryAdvice.muscleBuilding}
                    </p>
                  </div>

                  <div className="rounded-xl border border-amber-500/30 bg-[var(--bg-canvas)] p-3 space-y-1">
                    <span className="text-amber-600 dark:text-amber-400 font-bold text-[11px] uppercase">Mục tiêu giảm mỡ (Cutting):</span>
                    <p className="text-[var(--text-secondary)] leading-relaxed">
                      {scanResult.dietaryAdvice.fatLoss}
                    </p>
                  </div>
                </div>

                {scanResult.dietaryAdvice.healthierAlternative && (
                  <div className="flex items-start space-x-2 rounded-xl bg-[var(--bg-canvas)] border border-[var(--border-subtle)] p-3 text-[var(--text-secondary)]">
                    <Info className="h-4 w-4 text-[#ca8a04] dark:text-[#eab308] flex-shrink-0 mt-0.5" />
                    <span>
                      <strong className="text-[var(--text-primary)]">Gợi ý tối ưu calo:</strong> {scanResult.dietaryAdvice.healthierAlternative}
                    </span>
                  </div>
                )}
              </div>

              {/* Save to Daily Log Controls */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-[var(--border-subtle)]">
                <div className="flex items-center space-x-2 w-full sm:w-auto">
                  <span className="text-xs font-semibold text-[var(--text-muted)]">Thêm vào:</span>
                  <select
                    value={selectedMealType}
                    onChange={e => setSelectedMealType(e.target.value as MealType)}
                    className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-canvas)] px-3 py-2 text-xs text-[var(--text-primary)] font-bold outline-none cursor-pointer"
                  >
                    <option value="breakfast">Bữa Sáng</option>
                    <option value="lunch">Bữa Trưa</option>
                    <option value="dinner">Bữa Tối</option>
                    <option value="snack">Bữa Phụ</option>
                  </select>
                </div>

                <button
                  onClick={handleSaveToDaily}
                  className="btn-kinpaku w-full sm:w-auto px-6 py-2.5 flex items-center justify-center space-x-2 text-xs font-bold uppercase tracking-wider cursor-pointer"
                >
                  {saveSuccess ? (
                    <>
                      <CheckCircle2 className="h-4 w-4" />
                      <span>ĐÃ LƯU VÀO NHẬT KÝ!</span>
                    </>
                  ) : (
                    <>
                      <PlusCircle className="h-4 w-4" />
                      <span>LƯU VÀO NHẬT KÝ NGÀY ({activeCalories} kcal)</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            /* Empty State */
            <div className="card-impeccable p-12 flex flex-col items-center justify-center text-center space-y-4 min-h-[420px]">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--bg-canvas)] border border-[var(--border-subtle)] text-[#ca8a04] dark:text-[#eab308]">
                <Utensils className="h-8 w-8" />
              </div>
              <div>
                <h3 className="font-heading text-xl font-bold text-[var(--text-primary)]">
                  Chưa Có Dữ Liệu Quét
                </h3>
                <p className="text-xs text-[var(--text-muted)] mt-1 max-w-sm">
                  Hãy chụp ảnh đĩa thức ăn qua Camera, tải ảnh lên hoặc chọn một món ăn thể thao từ danh mục bên trái để AI tiến hành bóc tách Calo và Macro.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 3. Daily Meal Log Timeline */}
      <div className="card-impeccable p-6 sm:p-8 space-y-4">
        <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-4">
          <div>
            <h3 className="font-heading text-2xl font-bold text-[var(--text-primary)]">
              Nhật Ký Bữa Ăn Hôm Nay ({dailyData.meals.length})
            </h3>
            <p className="text-xs text-[var(--text-muted)]">
              Tổng cộng: <strong className="text-orange-600 dark:text-orange-400 font-mono">{dailyData.totalCalories} kcal</strong> • <strong className="text-[#0d9488] font-mono">{dailyData.consumedMacros.protein}g Protein</strong>
            </p>
          </div>

          <button
            onClick={refreshDailyData}
            className="flex items-center space-x-1.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-canvas)] px-3.5 py-1.5 text-xs font-bold text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Làm mới</span>
          </button>
        </div>

        {dailyData.meals.length === 0 ? (
          <div className="py-8 text-center text-xs text-[var(--text-muted)]">
            Hôm nay bạn chưa ghi nhận bữa ăn nào. Hãy quét món ăn đầu tiên của bạn ở trên!
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {dailyData.meals.map(meal => {
              const mealLabel =
                meal.mealType === 'breakfast'
                  ? 'Bữa Sáng'
                  : meal.mealType === 'lunch'
                  ? 'Bữa Trưa'
                  : meal.mealType === 'dinner'
                  ? 'Bữa Tối'
                  : 'Bữa Phụ';

              return (
                <div
                  key={meal.id}
                  className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-canvas)] p-4 flex flex-col justify-between space-y-3 relative group shadow-2xs"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="rounded-md bg-[#eab308]/15 px-2 py-0.5 text-[10px] font-bold text-[#ca8a04] dark:text-[#eab308]">
                        {mealLabel} • {meal.timeStr}
                      </span>
                      <h4 className="mt-1.5 font-heading text-base font-bold text-[var(--text-primary)]">
                        {meal.dishName}
                      </h4>
                    </div>

                    <button
                      onClick={() => handleDeleteMeal(meal.id)}
                      className="text-[var(--text-muted)] hover:text-rose-500 transition-colors p-1 cursor-pointer"
                      title="Xóa bữa này"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="flex items-baseline justify-between border-t border-[var(--border-subtle)] pt-2 font-mono text-xs">
                    <span className="font-heading text-lg font-bold text-orange-600 dark:text-orange-400">
                      {meal.calories} kcal
                    </span>
                    <span className="text-[#0d9488] font-bold">
                      {meal.macros?.protein || 0}g Pro
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
