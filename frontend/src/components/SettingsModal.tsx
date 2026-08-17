import React, { useState } from 'react';
import { X, Sliders, Mic, Eye, CheckCircle2, RotateCcw, Volume2, Utensils } from 'lucide-react';
import { UserSettings } from '../types';
import { StorageService } from '../services/storageService';
import { audioCoach, SUPPORTED_LANGUAGES } from '../engine/audioCoach';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSettingsChanged: (settings: UserSettings) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  onSettingsChanged
}) => {
  const [settings, setSettings] = useState<UserSettings>(StorageService.getSettings());
  const [selectedLanguage, setSelectedLanguage] = useState<string>(audioCoach.getLanguage());
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSave = () => {
    StorageService.saveSettings(settings);
    audioCoach.setVoiceSettings(settings.voiceSpeed, settings.voicePitch, selectedLanguage);
    audioCoach.setMuted(!settings.voiceCoachEnabled);
    onSettingsChanged(settings);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 800);
  };

  const handleTestVoice = () => {
    const langObj = SUPPORTED_LANGUAGES.find(l => l.code === selectedLanguage) || SUPPORTED_LANGUAGES[0];
    audioCoach.setLanguage(selectedLanguage);
    audioCoach.speak(langObj.samplePhrase, true);
  };

  const handleResetDefaults = () => {
    const defaults: UserSettings = {
      geminiApiKey: (import.meta as any).env?.VITE_GEMINI_API_KEY || '',
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
    setSettings(defaults);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-3xl border border-[var(--border-card)] bg-[var(--bg-card)] p-6 sm:p-8 shadow-2xl space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-4">
          <div className="flex items-center space-x-3">
            <div className="rounded-2xl bg-[#eab308]/15 p-2.5 text-[#ca8a04] dark:text-[#eab308] border border-[#eab308]/25">
              <Sliders className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-heading text-2xl font-bold text-[var(--text-primary)]">Cài Đặt Hệ Thống</h2>
              <p className="text-xs text-[var(--text-muted)]">Tùy chỉnh giọng nói HLV, dinh dưỡng &amp; camera</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl p-2 text-[var(--text-muted)] hover:bg-[var(--bg-surface-inset)] hover:text-[var(--text-primary)] cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="space-y-4 text-xs">

          {/* Voice Coach settings */}
          <div className="space-y-3 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface-inset)] p-4">
            <div className="flex items-center justify-between">
              <span className="flex items-center space-x-2 font-bold text-[var(--text-primary)]">
                <Mic className="h-4 w-4 text-[#0d9488]" />
                <span>HLV GIỌNG NÓI TIẾNG VIỆT</span>
              </span>
              <input
                type="checkbox"
                checked={settings.voiceCoachEnabled}
                onChange={e =>
                  setSettings({ ...settings, voiceCoachEnabled: e.target.checked })
                }
                className="h-4 w-4 accent-[#eab308] cursor-pointer"
              />
            </div>

            {settings.voiceCoachEnabled && (
              <div className="space-y-3 pt-2">
                {/* Multi-Language Neural & Google Voice Selector */}
                <div>
                  <label className="block text-[11px] text-[var(--text-muted)] font-semibold mb-1">
                    Chất Giọng &amp; Ngôn Ngữ HLV (Neural AI Voice Engine):
                  </label>
                  <select
                    value={selectedLanguage}
                    onChange={e => {
                      setSelectedLanguage(e.target.value);
                      audioCoach.setLanguage(e.target.value);
                    }}
                    className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] px-3 py-2.5 text-xs text-[var(--text-primary)] font-semibold outline-none cursor-pointer"
                  >
                    <optgroup label="Giọng Huấn Luyện Viên AI (VieNeu-TTS Neural Voice)">
                      {SUPPORTED_LANGUAGES.filter(l => l.category === 'neural').map(lang => (
                        <option key={lang.code} value={lang.code}>
                          {lang.name}
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label="Giọng Đọc Chuẩn Google Dịch">
                      {SUPPORTED_LANGUAGES.filter(l => l.category === 'google').map(lang => (
                        <option key={lang.code} value={lang.code}>
                          {lang.name}
                        </option>
                      ))}
                    </optgroup>
                  </select>
                  <p className="text-[10px] text-[var(--text-muted)] mt-1">
                    Công nghệ VieNeu-TTS &amp; Neural Voice AI phát âm cảm xúc, dứt khoát như HLV thể hình thật.
                  </p>
                </div>

                <div>
                  <div className="flex justify-between text-xs text-[var(--text-secondary)] mb-1.5 font-medium">
                    <span>Tốc độ đọc: {settings.voiceSpeed}x</span>
                  </div>
                  <input
                    type="range"
                    min="0.8"
                    max="1.5"
                    step="0.05"
                    value={settings.voiceSpeed}
                    onChange={e =>
                      setSettings({ ...settings, voiceSpeed: parseFloat(e.target.value) })
                    }
                    className="w-full accent-[#eab308] cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between pt-1">
                  <button
                    type="button"
                    onClick={handleTestVoice}
                    className="flex items-center space-x-1.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] px-3.5 py-1.5 text-xs font-bold text-[var(--text-primary)] hover:bg-[var(--bg-surface-inset)] transition-colors cursor-pointer"
                  >
                    <Volume2 className="h-4 w-4" />
                    <span>Thử giọng nói AI</span>
                  </button>
                  <span className="text-[11px] text-[var(--text-muted)]">Web Speech vi-VN Engine</span>
                </div>
              </div>
            )}
          </div>

          {/* Daily Nutrition & Calorie Targets */}
          <div className="space-y-3 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface-inset)] p-4">
            <div className="flex items-center space-x-2 font-bold text-[var(--text-primary)]">
              <Utensils className="h-4 w-4 text-[#0d9488]" />
              <span>MỤC TIÊU DINH DƯỠNG TRONG NGÀY (DAILY TARGETS)</span>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-[11px] text-[var(--text-muted)] font-semibold mb-1">
                  Mục tiêu Calo (kcal):
                </label>
                <input
                  type="number"
                  value={settings.dailyCalorieTarget || 2000}
                  onChange={e =>
                    setSettings({ ...settings, dailyCalorieTarget: parseInt(e.target.value) || 2000 })
                  }
                  className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] px-3 py-2 text-xs text-[var(--text-primary)] font-mono outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] text-[var(--text-muted)] font-semibold mb-1">
                  Mục tiêu Protein (g):
                </label>
                <input
                  type="number"
                  value={settings.dailyProteinTarget || 130}
                  onChange={e =>
                    setSettings({ ...settings, dailyProteinTarget: parseInt(e.target.value) || 130 })
                  }
                  className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] px-3 py-2 text-xs text-[var(--text-primary)] font-mono outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] text-[var(--text-muted)] font-semibold mb-1">
                  Mục tiêu Carbs (g):
                </label>
                <input
                  type="number"
                  value={settings.dailyCarbsTarget || 220}
                  onChange={e =>
                    setSettings({ ...settings, dailyCarbsTarget: parseInt(e.target.value) || 220 })
                  }
                  className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] px-3 py-2 text-xs text-[var(--text-primary)] font-mono outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] text-[var(--text-muted)] font-semibold mb-1">
                  Mục tiêu Fat (g):
                </label>
                <input
                  type="number"
                  value={settings.dailyFatTarget || 55}
                  onChange={e =>
                    setSettings({ ...settings, dailyFatTarget: parseInt(e.target.value) || 55 })
                  }
                  className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] px-3 py-2 text-xs text-[var(--text-primary)] font-mono outline-none"
                />
              </div>
            </div>
          </div>

          {/* Camera & Visuals */}
          <div className="space-y-3 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface-inset)] p-4">
            <div className="flex items-center justify-between">
              <span className="flex items-center space-x-2 font-bold text-[var(--text-primary)]">
                <Eye className="h-4 w-4 text-[#ca8a04] dark:text-[#eab308]" />
                <span>LẬT GƯƠNG CAMERA (MIRROR)</span>
              </span>
              <input
                type="checkbox"
                checked={settings.cameraMirror}
                onChange={e =>
                  setSettings({ ...settings, cameraMirror: e.target.checked })
                }
                className="h-4 w-4 accent-[#eab308] cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-[var(--border-subtle)]">
              <span className="text-xs text-[var(--text-secondary)]">Đếm ngược trước khi tập:</span>
              <select
                value={settings.countdownSeconds}
                onChange={e =>
                  setSettings({ ...settings, countdownSeconds: parseInt(e.target.value) })
                }
                className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] px-3 py-1.5 text-xs text-[var(--text-primary)] outline-none"
              >
                <option value={0}>Không đếm ngược</option>
                <option value={3}>3 giây</option>
                <option value={5}>5 giây</option>
                <option value={10}>10 giây</option>
              </select>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between border-t border-[var(--border-subtle)] pt-4">
          <button
            onClick={handleResetDefaults}
            className="flex items-center space-x-1.5 text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Mặc định</span>
          </button>

          <div className="flex items-center space-x-2">
            <button
              onClick={onClose}
              className="rounded-xl px-5 py-2.5 text-xs font-bold text-[var(--text-muted)] hover:bg-[var(--bg-surface-inset)] cursor-pointer"
            >
              Đóng
            </button>
            <button
              onClick={handleSave}
              className="btn-kinpaku flex items-center space-x-1.5 px-6 py-2.5 text-xs font-bold uppercase tracking-wider cursor-pointer"
            >
              {savedSuccess ? (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  <span>ĐÃ LƯU!</span>
                </>
              ) : (
                <span>LƯU CÀI ĐẶT</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
