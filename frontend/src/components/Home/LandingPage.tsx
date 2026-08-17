import React, { useState } from 'react';
import {
  Activity,
  Bot,
  Volume2,
  Sparkles,
  ArrowRight,
  Play,
  CheckCircle2,
  ChevronDown,
  Flame,
  Target,
  Calculator,
  Lock,
  Cpu,
  Calendar,
  Utensils,
  Lightbulb
} from 'lucide-react';
import { ExerciseInfo } from '../../types';
import { HeroAiScannerAnimation } from './HeroAiScannerAnimation';
import { ExerciseAnimation } from '../Common/ExerciseAnimation';

interface LandingPageProps {
  exercises?: ExerciseInfo[];
  onStartWorkout: (exercise?: ExerciseInfo) => void;
  onNavigateTab: (tab: 'studio' | 'plan' | 'nutrition' | 'library' | 'coach' | 'history') => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  exercises = [],
  onStartWorkout,
  onNavigateTab
}) => {
  // BMI & Calorie Calculator State
  const [weight, setWeight] = useState<number>(68);
  const [height, setHeight] = useState<number>(172);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  const bmi = Math.round((weight / Math.pow(height / 100, 2)) * 10) / 10;
  const getBmiCategory = (val: number) => {
    if (val < 18.5) {
      return {
        text: 'Thiếu Cân • Cần Tăng Cơ',
        color: 'text-[#0d9488]',
        badgeBg: 'bg-[#0d9488]/10 border-[#0d9488]/30',
        advice: 'Tập trung các bài tập kháng lực toàn thân (Squat, Push-up) kết hợp bổ sung dinh dưỡng giàu protein để tăng khối cơ bắp nạc.'
      };
    }
    if (val < 24.9) {
      return {
        text: 'Cân Đối Lý Tưởng • Thể Trạng Tốt',
        color: 'text-[#ca8a04] dark:text-[#eab308]',
        badgeBg: 'bg-[#eab308]/10 border-[#eab308]/30',
        advice: 'Thể trạng tuyệt vời! Duy trì lịch tập 3-4 buổi/tuần với Squat, Lunge và Plank để duy trì độ dẻo dai và sức mạnh cơ lõi.'
      };
    }
    if (val < 29.9) {
      return {
        text: 'Thừa Cân Nhẹ • Cần Tăng Đốt Calo',
        color: 'text-orange-600 dark:text-orange-400',
        badgeBg: 'bg-orange-500/10 border-orange-500/30',
        advice: 'Kết hợp Jumping Jack (Cardio cường độ cao) cùng Squat và Plank để tối ưu lượng calo tiêu thụ và củng cố cơ lõi.'
      };
    }
    return {
      text: 'Chỉ Số Cao • Cần Bảo Vệ Khớp',
      color: 'text-rose-600 dark:text-rose-400',
      badgeBg: 'bg-rose-500/10 border-rose-500/30',
      advice: 'Ưu tiên các bài tập ít áp lực dằn lên khớp gối, kiểm soát nhịp thở và điều chỉnh thâm hụt calo an toàn theo từng tuần.'
    };
  };
  const bmiInfo = getBmiCategory(bmi);

  const faqs = [
    {
      q: 'AI FitCoach quét cơ thể như thế nào và có cần cảm biến gắn trên người không?',
      a: 'Hoàn toàn KHÔNG cần bất kỳ thiết bị đeo hay cảm biến vật lý nào. AI FitCoach tích hợp mô hình thị giác máy tính MediaPipe Pose của Google kết hợp WebAssembly & WebGL. Hệ thống tự động phát hiện 33 toạ độ khớp xương trên cơ thể bạn qua webcam máy tính hoặc camera điện thoại với độ trễ 0ms.'
    },
    {
      q: 'Tính năng Quét Khẩu Phần Ăn AI hoạt động như thế nào?',
      a: 'Bạn chỉ cần bật camera chụp đĩa thức ăn, tải ảnh lên hoặc nhập tên món. Gemini Multimodal Vision AI sẽ tự động nhận diện món ăn, bóc tách chính xác lượng Calo, Protein, Carbs, Fat, chất xơ và quy đổi số phút tập Squat, Hít đất cần thiết để đốt cháy lượng calo đó.'
    },
    {
      q: 'Hình ảnh video từ camera của tôi có được bảo mật riêng tư không?',
      a: 'Tuyệt đối an toàn. Toàn bộ quá trình quét hình ảnh và tính toán góc sinh học diễn ra 100% cục bộ (On-Device Edge AI) ngay trên chip GPU trình duyệt của bạn. Video camera không bao giờ bị lưu lại hay gửi lên bất kỳ máy chủ nào.'
    },
    {
      q: 'Gemini AI đóng vai trò gì sau mỗi buổi tập?',
      a: 'Sau khi hoàn thành hiệp tập, dữ liệu chuyển động (số rep, độ chuẩn form %, danh sách lỗi kỹ thuật phát hiện) sẽ được gửi đến mô hình Google Gemini AI để tạo bản báo cáo sinh cơ học chuyên sâu: phân tích cơ bắp tác động, cảnh báo chấn thương sụn khớp và đưa ra bài học cải thiện cho hiệp tiếp theo.'
    }
  ];

  return (
    <div className="mx-auto max-w-[1680px] w-full space-y-16 px-4 py-8 sm:px-8 xl:px-12 animate-in fade-in duration-300 impeccable-grid">
      {/* 1. HERO SECTION (With Live AI Scanner Animation on the Right) */}
      <section className="relative overflow-hidden rounded-3xl border border-[var(--border-card)] bg-[var(--bg-card)] p-6 sm:p-12 lg:p-16 shadow-xl">
        {/* Glowing aura spheres */}
        <div className="absolute top-0 right-0 w-[550px] h-[550px] bg-[#eab308]/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[450px] h-[450px] bg-[#0d9488]/5 rounded-full blur-3xl pointer-events-none" />

        {/* Hero Split Layout: Left Pitch & Right Animated AI Scanner */}
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:items-center">
          {/* Left Column */}
          <div className="lg:col-span-7 space-y-6 text-left">
            <div className="inline-flex items-center space-x-2 rounded-full border border-[#eab308]/30 bg-[#eab308]/10 px-4 py-1.5 text-xs font-bold text-[#ca8a04] dark:text-[#eab308]">
              <Sparkles className="h-3.5 w-3.5" />
              <span>KỶ NGUYÊN SINH CƠ HỌC &amp; DINH DƯỠNG THÔNG MINH</span>
            </div>

            <h1 className="font-heading text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-[var(--text-primary)] leading-[1.08]">
              Quét Tư Thế &amp; Calo Khẩu Phần Ăn{' '}
              <span className="text-[#ca8a04] dark:text-[#eab308]">
                Thời Gian Thực
              </span>
            </h1>

            <p className="text-sm sm:text-base lg:text-lg text-[var(--text-secondary)] leading-relaxed max-w-2xl">
              Tích hợp AI thị giác nhận diện 33 điểm khớp xương đếm rep sửa form, kết hợp <strong>Camera quét Calo &amp; Macro đĩa thức ăn</strong> cùng <strong>Google Gemini Multimodal AI</strong>.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
              <button
                onClick={() => onStartWorkout()}
                className="btn-kinpaku w-full sm:w-auto flex items-center justify-center space-x-2.5 px-8 py-4 text-xs sm:text-sm font-bold uppercase tracking-wider cursor-pointer"
              >
                <Play className="h-4 w-4 fill-current" />
                <span>BẬT CAMERA TẬP NGAY</span>
              </button>

              <button
                onClick={() => onNavigateTab('plan')}
                className="btn-hairline w-full sm:w-auto flex items-center justify-center space-x-2.5 px-6 py-4 text-xs sm:text-sm font-bold uppercase tracking-wider cursor-pointer border-[#eab308]/50 text-[#ca8a04] dark:text-[#eab308] hover:border-[#eab308]"
              >
                <Calendar className="h-4 w-4" />
                <span>Tạo Giáo Án AI</span>
              </button>

              <button
                onClick={() => onNavigateTab('nutrition')}
                className="btn-hairline w-full sm:w-auto flex items-center justify-center space-x-2.5 px-6 py-4 text-xs sm:text-sm font-bold uppercase tracking-wider cursor-pointer border-[#0d9488]/40 text-[#0d9488] hover:border-[#0d9488]"
              >
                <Utensils className="h-4 w-4" />
                <span>Quét Calo Bữa Ăn</span>
              </button>

              <button
                onClick={() => onNavigateTab('coach')}
                className="btn-hairline w-full sm:w-auto flex items-center justify-center space-x-2 px-5 py-4 text-xs sm:text-sm font-bold uppercase tracking-wider cursor-pointer"
              >
                <Bot className="h-4 w-4 text-[#0d9488]" />
                <span>Hỏi HLV AI</span>
              </button>
            </div>

            <div className="pt-4 flex flex-wrap items-center gap-y-3 gap-x-6 text-xs font-semibold text-[var(--text-muted)]">
              <span className="flex items-center space-x-2">
                <CheckCircle2 className="h-4 w-4 text-[#0d9488]" />
                <span>30-60 FPS WebAssembly</span>
              </span>
              <span className="flex items-center space-x-2">
                <Lock className="h-4 w-4 text-[#ca8a04] dark:text-[#eab308]" />
                <span>100% Bảo Mật Riêng Tư</span>
              </span>
              <span className="flex items-center space-x-2">
                <Volume2 className="h-4 w-4 text-[#0d9488]" />
                <span>HLV Giọng Nói Tiếng Việt</span>
              </span>
            </div>
          </div>

          {/* Right Column: Interactive AI Scanner Animation */}
          <div className="lg:col-span-5 flex items-center justify-center">
            <HeroAiScannerAnimation />
          </div>
        </div>
      </section>

      {/* 2. 8 SUPPORTED EXERCISES WITH LIVE 3D ANIMATIONS */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[var(--border-subtle)] pb-4">
          <div>
            <span className="text-xs font-extrabold uppercase tracking-wider text-[#ca8a04] dark:text-[#eab308]">
              DANH MỤC 8 ĐỘNG TÁC CHUẨN FORM
            </span>
            <h2 className="font-heading text-2xl sm:text-4xl font-bold text-[var(--text-primary)]">
              Chọn Bài Tập Để Bắt Đầu
            </h2>
          </div>

          <button
            onClick={() => onNavigateTab('library')}
            className="flex items-center space-x-1.5 text-xs font-bold text-[#ca8a04] dark:text-[#eab308] hover:underline transition-colors cursor-pointer"
          >
            <span>XEM THƯ VIỆN &amp; HƯỚNG DẪN CHI TIẾT</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {exercises.slice(0, 4).map(exercise => (
            <div
              key={exercise.id}
              className="group card-impeccable flex flex-col justify-between p-5"
            >
              <div>
                {/* 3D Exercise Animation Container (Seamless Harmonized Blend) */}
                <div className="mb-4 flex items-center justify-center">
                  <ExerciseAnimation
                    exerciseId={exercise.id}
                    exerciseName={exercise.nameVi || exercise.nameEn}
                    gifUrl={exercise.gifUrl}
                    size="md"
                  />
                </div>

                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="rounded-lg bg-[#eab308]/15 px-2.5 py-0.5 text-[11px] font-bold text-[#ca8a04] dark:text-[#eab308]">
                    {exercise.category}
                  </span>
                  <span className="text-[var(--text-muted)] font-medium">
                    {exercise.difficulty}
                  </span>
                </div>

                <h3 className="font-heading text-lg font-bold text-[var(--text-primary)] group-hover:text-[#ca8a04] dark:group-hover:text-[#eab308] transition-colors">
                  {exercise.nameVi}
                </h3>
                <p className="text-xs text-[var(--text-muted)] line-clamp-2 leading-relaxed mt-1">
                  {exercise.description}
                </p>
              </div>

              <div className="mt-5 pt-3 border-t border-[var(--border-subtle)] flex items-center justify-between text-xs">
                <span className="text-orange-600 dark:text-orange-400 font-semibold flex items-center space-x-1 font-mono">
                  <Flame className="h-3.5 w-3.5" />
                  <span>~{exercise.caloriesPerMinute} kcal/p</span>
                </span>

                <button
                  onClick={() => onStartWorkout(exercise)}
                  className="btn-kinpaku flex items-center space-x-1.5 px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider cursor-pointer"
                >
                  <Play className="h-3 w-3 fill-current" />
                  <span>Tập Ngay</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 3. CORE CAPABILITIES (BENTO GRID) */}
      <section className="space-y-6">
        <div className="text-center space-y-2">
          <span className="text-xs font-extrabold uppercase tracking-wider text-[#ca8a04] dark:text-[#eab308]">
            HỆ SINH THÁI TẬP LUYỆN TOÀN DIỆN
          </span>
          <h2 className="font-heading text-3xl sm:text-5xl font-bold text-[var(--text-primary)]">
            Trải Nghiệm Tập Luyện &amp; Dinh Dưỡng Thông Minh
          </h2>
          <p className="text-xs sm:text-sm text-[var(--text-muted)] max-w-xl mx-auto">
            Hệ thống nhận diện chuyển động và phân tích dinh dưỡng tự động với trí tuệ nhân tạo.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {/* Bento 1 */}
          <div className="card-impeccable p-6 space-y-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#eab308]/15 text-[#ca8a04] dark:text-[#eab308]">
              <Cpu className="h-6 w-6" />
            </div>
            <h3 className="font-heading text-xl font-bold text-[var(--text-primary)]">
              Độ Trễ 0ms GPU Trình Duyệt
            </h3>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              Mô hình MediaPipe Pose Landmarker được tăng tốc phần cứng WebGL / WebAssembly, xử lý 30-60 FPS mượt mà ngay trên thiết bị.
            </p>
          </div>

          {/* Bento 2 */}
          <div className="card-impeccable p-6 space-y-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#0d9488]/15 text-[#0d9488]">
              <Target className="h-6 w-6" />
            </div>
            <h3 className="font-heading text-xl font-bold text-[var(--text-primary)]">
              Chống Cheat Rep &amp; Sửa Form
            </h3>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              Phân tích từng góc chuyển động: loại bỏ rep nhấp nhô nửa vời, dùng đà vung tay, gối sụp vào trong hoặc võng lưng.
            </p>
          </div>

          {/* Bento 3: Multimodal Food Scanner */}
          <div
            onClick={() => onNavigateTab('nutrition')}
            className="card-impeccable p-6 space-y-3 cursor-pointer group hover:border-[#0d9488]/50"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#0d9488]/15 text-[#0d9488] group-hover:scale-105 transition-transform">
              <Utensils className="h-6 w-6" />
            </div>
            <h3 className="font-heading text-xl font-bold text-[var(--text-primary)] group-hover:text-[#0d9488] transition-colors">
              Quét Calo &amp; Macro Bữa Ăn
            </h3>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              Chụp ảnh đĩa thức ăn, bóc tách Calo, Protein, Carbs, Fat và tự động quy đổi thời gian tập luyện để đốt cháy năng lượng.
            </p>
          </div>

          {/* Bento 4 */}
          <div className="card-impeccable p-6 space-y-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-500/15 text-orange-600 dark:text-orange-400">
              <Flame className="h-6 w-6" />
            </div>
            <h3 className="font-heading text-xl font-bold text-[var(--text-primary)]">
              Đo Lường Calo &amp; Nhật Ký
            </h3>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              Cộng dồn calo nạp vào từ bữa ăn và calo tiêu hao từ buổi tập, duy trì chuỗi ngày tập luyện liên tiếp (streak).
            </p>
          </div>
        </div>
      </section>

      {/* 4. BMI & METABOLIC RATE CALCULATOR */}
      <section className="card-impeccable p-6 sm:p-10 space-y-6">
        <div className="flex items-center space-x-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#eab308]/15 text-[#ca8a04] dark:text-[#eab308]">
            <Calculator className="h-6 w-6" />
          </div>
          <div>
            <h2 className="font-heading text-xl font-bold text-[var(--text-primary)] sm:text-2xl">
              Công Cụ Tính Chỉ Số Thể Trọng (BMI Calculator)
            </h2>
            <p className="text-xs text-[var(--text-muted)]">
              Kiểm tra nhanh thể trạng và nhận khuyến nghị bài tập phù hợp từ AI
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Controls */}
          <div className="lg:col-span-6 space-y-5">
            <div>
              <div className="flex justify-between text-xs font-bold text-[var(--text-primary)] mb-2">
                <span>CÂN NẶNG:</span>
                <span className="text-[#ca8a04] dark:text-[#eab308] font-mono text-sm">{weight} KG</span>
              </div>
              <input
                type="range"
                min="40"
                max="130"
                value={weight}
                onChange={e => setWeight(parseInt(e.target.value))}
                className="w-full accent-[#eab308] cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs font-bold text-[var(--text-primary)] mb-2">
                <span>CHIỀU CAO:</span>
                <span className="text-[#ca8a04] dark:text-[#eab308] font-mono text-sm">{height} CM</span>
              </div>
              <input
                type="range"
                min="130"
                max="210"
                value={height}
                onChange={e => setHeight(parseInt(e.target.value))}
                className="w-full accent-[#eab308] cursor-pointer"
              />
            </div>
          </div>

          {/* Result Card */}
          <div className="lg:col-span-6 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface-inset)] p-5 flex flex-col justify-between space-y-4">
            <div className="flex items-baseline justify-between">
              <div>
                <span className="text-xs text-[var(--text-muted)] uppercase font-semibold">Chỉ Số BMI Của Bạn</span>
                <p className="font-heading text-4xl font-extrabold text-[var(--text-primary)]">{bmi}</p>
              </div>
              <span className={`font-bold text-xs px-3 py-1 rounded-full border ${bmiInfo.badgeBg} ${bmiInfo.color}`}>
                {bmiInfo.text}
              </span>
            </div>

            <p className="text-xs text-[var(--text-secondary)] leading-relaxed bg-[var(--bg-card)] p-3.5 rounded-xl border border-[var(--border-subtle)] flex items-start space-x-2">
              <Lightbulb className="h-4 w-4 text-[#eab308] flex-shrink-0 mt-0.5" />
              <span>
                <strong>Lời khuyên từ HLV AI:</strong> {bmiInfo.advice}
              </span>
            </p>

            <button
              onClick={() => onStartWorkout()}
              className="btn-kinpaku w-full py-3 text-xs font-bold uppercase tracking-wider cursor-pointer"
            >
              Bắt Đầu Tập Luyện Với AI Ngay
            </button>
          </div>
        </div>
      </section>

      {/* 5. FAQ ACCORDION */}
      <section className="space-y-6">
        <div className="text-center space-y-2">
          <span className="text-xs font-extrabold uppercase tracking-wider text-[#ca8a04] dark:text-[#eab308]">
            HỎI ĐÁP PHỔ BIẾN
          </span>
          <h2 className="font-heading text-3xl sm:text-4xl font-bold text-[var(--text-primary)]">
            Câu Hỏi Thường Gặp
          </h2>
        </div>

        <div className="mx-auto max-w-3xl space-y-3">
          {faqs.map((faq, idx) => {
            const isOpen = openFaqIndex === idx;
            return (
              <div
                key={idx}
                className="overflow-hidden rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] transition-all"
              >
                <button
                  onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                  className="flex w-full items-center justify-between p-5 text-left text-xs sm:text-sm font-bold text-[var(--text-primary)] hover:text-[#ca8a04] dark:hover:text-[#eab308] transition-colors cursor-pointer"
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    className={`h-4 w-4 text-[var(--text-muted)] transition-transform duration-200 ${
                      isOpen ? 'rotate-180 text-[#ca8a04] dark:text-[#eab308]' : ''
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="px-5 pb-5 text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed border-t border-[var(--border-subtle)] pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* 6. CALL TO ACTION BANNER */}
      <section className="relative overflow-hidden rounded-3xl border border-[#eab308]/30 bg-gradient-to-r from-[var(--bg-card)] via-[var(--bg-surface-inset)] to-[var(--bg-card)] p-8 sm:p-12 text-center space-y-6 shadow-xl">
        <div className="mx-auto max-w-2xl space-y-3">
          <h2 className="font-heading text-3xl sm:text-5xl font-extrabold text-[var(--text-primary)]">
            Sẵn Sàng Nâng Tầm Buổi Tập Hôm Nay?
          </h2>
          <p className="text-xs sm:text-sm text-[var(--text-muted)]">
            Trải nghiệm cảm giác có một Huấn luyện viên AI soi từng góc khớp và đếm từng rep theo thời gian thực.
          </p>
        </div>

        <button
          onClick={() => onStartWorkout()}
          className="btn-kinpaku inline-flex items-center space-x-2 px-10 py-4 text-sm font-bold uppercase tracking-wider cursor-pointer"
        >
          <Play className="h-4 w-4 fill-current" />
          <span>VÀO PHÒNG TẬP AI NGAY</span>
        </button>
      </section>
    </div>
  );
};
