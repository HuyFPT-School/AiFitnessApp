import React, { useState, useEffect, useRef } from 'react';
import {
  Home,
  Activity,
  BookOpen,
  Bot,
  History,
  Settings,
  Volume2,
  VolumeX,
  Flame,
  Zap,
  Sun,
  Moon,
  Utensils,
  User,
  LogOut,
  ChevronDown,
  Target,
  Mail,
  ShieldCheck,
  Sparkles,
  Calendar,
  Crown
} from 'lucide-react';
import { UserProfile } from '../types';

interface NavbarProps {
  currentTab: 'home' | 'studio' | 'plan' | 'nutrition' | 'library' | 'coach' | 'history';
  onSelectTab: (tab: 'home' | 'studio' | 'plan' | 'nutrition' | 'library' | 'coach' | 'history') => void;
  totalCalories: number;
  isMuted: boolean;
  onToggleMute: () => void;
  onOpenSettings: () => void;
  historyCount: number;
  currentUser: UserProfile | null;
  onOpenAuth: (mode?: 'login' | 'register') => void;
  onLogout: () => void;
  onOpenCreateExercise?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onSelectTab,
  totalCalories,
  isMuted,
  onToggleMute,
  onOpenSettings,
  historyCount,
  currentUser,
  onOpenAuth,
  onLogout,
  onOpenCreateExercise
}) => {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setIsProfileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem('fitcoach_theme') as 'light' | 'dark' | null;
    const active = saved || 'light';
    setTheme(active);
    document.documentElement.setAttribute('data-theme', active);
  }, []);

  const toggleTheme = () => {
    const next = theme === 'light' ? 'dark' : 'light';
    setTheme(next);
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('fitcoach_theme', next);
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-[var(--border-card)] bg-[var(--bg-canvas)]/90 backdrop-blur-xl transition-all shadow-xs">
      <div className="mx-auto flex max-w-[1680px] items-center justify-between px-4 py-3 sm:px-8 xl:px-12">
        {/* Brand Logo & Wordmark */}
        <div
          onClick={() => onSelectTab('home')}
          className="flex cursor-pointer items-center space-x-3 group"
        >
          <div className="relative flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-tr from-[#eab308] to-[#ca8a04] text-[#1c1917] shadow-md shadow-[#eab308]/25 group-hover:scale-105 transition-transform">
            <Zap className="h-5 w-5 fill-[#1c1917] stroke-[2.5]" />
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#0d9488] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-[#0d9488]"></span>
            </span>
          </div>

          <div>
            <div className="flex items-center space-x-2">
              <span className="font-heading text-xl font-extrabold tracking-tight text-[var(--text-primary)]">
                FIT<span className="text-[#ca8a04] dark:text-[#eab308]">COACH</span>
              </span>
              <span className="rounded-full border border-[#eab308]/30 bg-[#eab308]/15 px-2 py-0.5 font-mono text-[9px] font-bold tracking-wider text-[#ca8a04] dark:text-[#eab308]">
                AI PRO
              </span>
            </div>
            <p className="text-[11px] text-[var(--text-muted)] font-medium hidden sm:block">
              Biomechanics Pose &amp; Food Calorie Vision
            </p>
          </div>
        </div>

        {/* Center Navigation Pills */}
        <nav className="flex items-center space-x-1 rounded-2xl bg-[var(--bg-card)] p-1 border border-[var(--border-subtle)]">
          <button
            onClick={() => onSelectTab('home')}
            className={`flex items-center space-x-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition-all cursor-pointer ${
              currentTab === 'home'
                ? 'btn-kinpaku text-[#1c1917]'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-canvas)]'
            }`}
          >
            <Home className="h-4 w-4" />
            <span className="hidden lg:inline">Trang Chủ</span>
          </button>

          <button
            onClick={() => onSelectTab('studio')}
            className={`flex items-center space-x-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition-all cursor-pointer ${
              currentTab === 'studio'
                ? 'btn-kinpaku text-[#1c1917]'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-canvas)]'
            }`}
          >
            <Activity className="h-4 w-4" />
            <span className="hidden lg:inline">Phòng Tập</span>
          </button>

          {/* AI Workout Routine Generator Tab */}
          <button
            onClick={() => onSelectTab('plan')}
            className={`flex items-center space-x-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition-all cursor-pointer ${
              currentTab === 'plan'
                ? 'btn-kinpaku text-[#1c1917]'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-canvas)]'
            }`}
          >
            <Calendar className="h-4 w-4 text-[#eab308]" />
            <span className="hidden sm:inline">Giáo Án AI</span>
          </button>

          {/* New Nutrition & Food Scanner Tab */}
          <button
            onClick={() => onSelectTab('nutrition')}
            className={`flex items-center space-x-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition-all cursor-pointer relative ${
              currentTab === 'nutrition'
                ? 'btn-kinpaku text-[#1c1917]'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-canvas)]'
            }`}
          >
            <Utensils className="h-4 w-4 text-[#0d9488]" />
            <span className="hidden sm:inline">Quét Dinh Dưỡng</span>
            <span className="absolute -top-1 -right-1 flex h-2 w-2 rounded-full bg-[#0d9488] animate-ping sm:hidden" />
          </button>

          <button
            onClick={() => onSelectTab('library')}
            className={`flex items-center space-x-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition-all cursor-pointer ${
              currentTab === 'library'
                ? 'btn-kinpaku text-[#1c1917]'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-canvas)]'
            }`}
          >
            <BookOpen className="h-4 w-4" />
            <span className="hidden lg:inline">Thư Viện</span>
          </button>

          <button
            onClick={() => onSelectTab('coach')}
            className={`flex items-center space-x-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition-all cursor-pointer ${
              currentTab === 'coach'
                ? 'btn-kinpaku text-[#1c1917]'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-canvas)]'
            }`}
          >
            <Bot className="h-4 w-4 text-[#0d9488]" />
            <span className="hidden lg:inline">HLV Gemini</span>
          </button>

          <button
            onClick={() => onSelectTab('history')}
            className={`flex items-center space-x-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition-all cursor-pointer ${
              currentTab === 'history'
                ? 'btn-kinpaku text-[#1c1917]'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-canvas)]'
            }`}
          >
            <History className="h-4 w-4" />
            <span className="hidden lg:inline">Lịch Sử</span>
            {historyCount > 0 && (
              <span className="ml-1 rounded-full bg-[var(--bg-canvas)] px-1.5 py-0.2 font-mono text-[9px] font-bold text-[#ca8a04] dark:text-[#eab308]">
                {historyCount}
              </span>
            )}
          </button>
        </nav>

        {/* Right Tools & Calories */}
        <div className="flex items-center space-x-2">
          {/* Theme Mode Toggle */}
          <button
            onClick={toggleTheme}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[#eab308]/50 transition-all cursor-pointer"
            title={theme === 'light' ? 'Chuyển sang Dark Mode' : 'Chuyển sang Light Champagne Mode'}
          >
            {theme === 'light' ? <Moon className="h-4 w-4 text-[#ca8a04]" /> : <Sun className="h-4 w-4 text-[#eab308]" />}
          </button>

          {/* Calorie Telemetry Pill */}
          <div className="hidden items-center space-x-1.5 rounded-xl border border-orange-500/25 bg-orange-500/10 px-3.5 py-1.5 text-xs font-semibold text-orange-700 dark:text-orange-300 sm:flex">
            <Flame className="h-4 w-4 text-orange-500 animate-pulse" />
            <span>
              <strong className="font-mono">{totalCalories}</strong> kcal
            </span>
          </div>

          {/* Voice Mute Toggle */}
          <button
            onClick={onToggleMute}
            className={`flex h-9 w-9 items-center justify-center rounded-xl border transition-all cursor-pointer ${
              isMuted
                ? 'border-rose-500/40 bg-rose-500/10 text-rose-600 dark:text-rose-400'
                : 'border-[#0d9488]/30 bg-[#0d9488]/10 text-[#0d9488] hover:bg-[#0d9488]/20'
            }`}
            title={isMuted ? 'Bật giọng nói HLV AI' : 'Tắt giọng nói HLV AI'}
          >
            {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          </button>

          {/* Settings Button */}
          <button
            onClick={onOpenSettings}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] text-[var(--text-muted)] hover:border-[#eab308]/50 hover:text-[var(--text-primary)] transition-all cursor-pointer"
            title="Cài đặt hệ thống &amp; Giọng nói"
          >
            <Settings className="h-4 w-4" />
          </button>

          {/* User Auth / Profile Pill */}
          {currentUser ? (
            <div className="relative" ref={profileMenuRef}>
              <button
                onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                className="flex items-center space-x-2.5 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] px-3 py-1.5 text-xs font-semibold text-[var(--text-primary)] hover:border-[#eab308]/60 transition-all cursor-pointer shadow-xs"
                title={`${currentUser.name} (${currentUser.email})`}
              >
                {/* Avatar Icon / Picture */}
                {currentUser.avatarUrl ? (
                  <img
                    src={currentUser.avatarUrl}
                    alt={currentUser.name}
                    className="h-7 w-7 rounded-xl object-cover border border-[#eab308]/40 shadow-xs"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-gradient-to-tr from-[#eab308] to-[#ca8a04] text-neutral-950 font-extrabold text-xs uppercase shadow-xs">
                    {currentUser.name.charAt(0)}
                  </div>
                )}

                {/* Name & Email Container */}
                <div className="hidden sm:flex flex-col items-start text-left leading-tight">
                  <span className="font-bold text-xs text-[var(--text-primary)] max-w-[130px] truncate">
                    {currentUser.name}
                  </span>
                  <span className="flex items-center space-x-1 text-[10px] text-[var(--text-muted)] max-w-[130px] truncate">
                    <Mail className="h-2.5 w-2.5 text-[#0d9488] shrink-0" />
                    <span className="truncate">{currentUser.email}</span>
                  </span>
                </div>

                <ChevronDown className="h-3.5 w-3.5 text-[var(--text-muted)]" />
              </button>

              {/* Profile Dropdown Menu */}
              {isProfileMenuOpen && (
                <div className="absolute right-0 mt-2 w-72 rounded-3xl border border-[var(--border-card)] bg-[var(--bg-card)] p-4 shadow-2xl space-y-3.5 z-50 animate-in fade-in zoom-in-95 duration-150">
                  {/* User Header Profile */}
                  <div className="flex items-center space-x-3 border-b border-[var(--border-subtle)] pb-3">
                    {currentUser.avatarUrl ? (
                      <img
                        src={currentUser.avatarUrl}
                        alt={currentUser.name}
                        className="h-11 w-11 rounded-2xl object-cover border border-[#eab308]/50 shadow-md"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-tr from-[#eab308] to-[#ca8a04] text-neutral-950 font-extrabold text-base uppercase shadow-md">
                        {currentUser.name.charAt(0)}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-sm text-[var(--text-primary)] truncate">{currentUser.name}</p>
                      <p className="flex items-center space-x-1 text-xs text-[var(--text-muted)] truncate">
                        <Mail className="h-3 w-3 text-[#0d9488] shrink-0" />
                        <span className="truncate">{currentUser.email}</span>
                      </p>
                    </div>
                  </div>

                  {/* Quick User Stats */}
                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between items-center rounded-xl bg-[var(--bg-surface-inset)] px-3 py-2 text-xs">
                      <span className="text-[var(--text-muted)] flex items-center space-x-1.5">
                        <Target className="h-3.5 w-3.5 text-[#ca8a04] dark:text-[#eab308]" />
                        <span>Mục tiêu Calo:</span>
                      </span>
                      <span className="font-bold text-[#ca8a04] dark:text-[#eab308]">{currentUser.dailyCalorieTarget || 2000} kcal/ngày</span>
                    </div>

                    <div className="flex justify-between items-center rounded-xl bg-[var(--bg-surface-inset)] px-3 py-2 text-xs">
                      <span className="text-[var(--text-muted)] flex items-center space-x-1.5">
                        <User className="h-3.5 w-3.5 text-[#0d9488]" />
                        <span>Chỉ số thể chất:</span>
                      </span>
                      <span className="font-medium text-[var(--text-primary)]">{currentUser.heightCm} cm • {currentUser.weightKg} kg</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-1 border-t border-[var(--border-subtle)] space-y-1">
                    {(currentUser.role === 'admin' || currentUser.email === 'luumynhathuy@gmail.com') && onOpenCreateExercise && (
                      <button
                        onClick={() => {
                          setIsProfileMenuOpen(false);
                          onOpenCreateExercise();
                        }}
                        className="w-full flex items-center space-x-2 rounded-xl bg-[#eab308]/15 hover:bg-[#eab308] text-[#ca8a04] hover:text-neutral-950 dark:text-[#eab308] px-3 py-2 text-xs font-bold transition-all cursor-pointer shadow-xs mb-1"
                      >
                        <Crown className="h-4 w-4" />
                        <span>+ Tạo Bài Tập Mới (Admin)</span>
                      </button>
                    )}

                    <button
                      onClick={() => {
                        setIsProfileMenuOpen(false);
                        onOpenSettings();
                      }}
                      className="w-full flex items-center space-x-2 rounded-xl px-3 py-2 text-xs font-semibold text-[var(--text-secondary)] hover:bg-[var(--bg-surface-inset)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
                    >
                      <Settings className="h-4 w-4" />
                      <span>Cài Đặt Mục Tiêu Thể Hình</span>
                    </button>

                    <button
                      onClick={() => {
                        setIsProfileMenuOpen(false);
                        onLogout();
                      }}
                      className="w-full flex items-center space-x-2 rounded-xl px-3 py-2 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>Đăng Xuất Tài Khoản</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={() => onOpenAuth('login')}
              className="flex items-center space-x-1.5 rounded-xl border border-[#eab308]/40 bg-[#eab308]/15 px-3.5 py-1.5 text-xs font-bold text-[#ca8a04] dark:text-[#eab308] hover:bg-[#eab308] hover:text-neutral-950 transition-all cursor-pointer shadow-xs"
            >
              <User className="h-3.5 w-3.5" />
              <span>Đăng Nhập</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
