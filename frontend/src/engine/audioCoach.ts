export interface SupportedLanguage {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
  samplePhrase: string;
  category: 'neural' | 'google';
}

export const SUPPORTED_LANGUAGES: SupportedLanguage[] = [
  {
    code: 'vi_nam',
    name: 'HLV Nam Minh (Neural AI • Dứt Khoát)',
    nativeName: 'Tiếng Việt - HLV Nam',
    flag: '',
    samplePhrase: 'Xin chào! Huấn luyện viên AI sẵn sàng đồng hành cùng bạn.',
    category: 'neural'
  },
  {
    code: 'vi_nu',
    name: 'HLV Hoài My (Neural AI • Truyền Cảm)',
    nativeName: 'Tiếng Việt - HLV Nữ',
    flag: '',
    samplePhrase: 'Chào bạn! Hãy tập trung vào nhịp thở và giữ đúng tư thế nhé.',
    category: 'neural'
  },
  {
    code: 'vi',
    name: 'Tiếng Việt (Google Natural Voice)',
    nativeName: 'Tiếng Việt',
    flag: '',
    samplePhrase: 'Xin chào! Huấn luyện viên AI sẵn sàng đồng hành cùng bạn.',
    category: 'google'
  },
  {
    code: 'fr',
    name: 'Coach Henri (Français Neural)',
    nativeName: 'Français',
    flag: '',
    samplePhrase: 'Bonjour! Votre coach sportif IA est prêt à vous accompagner.',
    category: 'neural'
  },
  {
    code: 'en',
    name: 'Coach Guy (English Neural)',
    nativeName: 'English',
    flag: '',
    samplePhrase: 'Hello! Your AI Fitness Coach is ready to train with you.',
    category: 'neural'
  },
  {
    code: 'ja',
    name: 'Keita (日本語 Neural)',
    nativeName: '日本語',
    flag: '',
    samplePhrase: 'こんにちは！AIフィットネスコーチと一緒にトレーニングしましょう。',
    category: 'neural'
  },
  {
    code: 'ko',
    name: 'InJoon (한국어 Neural)',
    nativeName: '한국어',
    flag: '',
    samplePhrase: '안녕하세요! AI 피트니스 코치와 함께 운동을 시작하세요.',
    category: 'neural'
  }
];

class AudioCoach {
  private synth: SpeechSynthesis | null = null;
  private audioCtx: AudioContext | null = null;
  private isMuted: boolean = false;
  private voiceSpeed: number = 1.05;
  private voicePitch: number = 1.0;
  private currentLanguage: string = 'vi_nam'; // Default to Nam Minh Neural
  private currentAudioElement: HTMLAudioElement | null = null;
  private lastSpokenTime: number = 0;
  private lastSpokenText: string = '';

  constructor() {
    if (typeof window !== 'undefined') {
      const savedLang = localStorage.getItem('fitcoach_voice_lang');
      if (savedLang) {
        this.currentLanguage = savedLang;
      }
      if ('speechSynthesis' in window) {
        this.synth = window.speechSynthesis;
      }
    }
  }

  public getLanguage(): string {
    return this.currentLanguage;
  }

  public setLanguage(langCode: string) {
    this.currentLanguage = langCode;
    try {
      localStorage.setItem('fitcoach_voice_lang', langCode);
    } catch {
      // Ignore
    }
  }

  private getAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.audioCtx) {
      const AudioCtxClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtxClass) {
        this.audioCtx = new AudioCtxClass();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume().catch(() => {});
    }
    return this.audioCtx;
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (muted) {
      if (this.currentAudioElement) {
        this.currentAudioElement.pause();
        this.currentAudioElement = null;
      }
      if (this.synth) {
        this.synth.cancel();
      }
    }
  }

  public setVoiceSettings(speed: number, pitch: number, langCode?: string) {
    this.voiceSpeed = speed;
    this.voicePitch = pitch;
    if (langCode) {
      this.setLanguage(langCode);
    }
  }

  /**
   * Speak using Neural AI Stream (FastAPI/Express Proxy) with automatic Google TTS fallback
   */
  public speak(text: string, force: boolean = false, interrupt: boolean = true) {
    if (this.isMuted) return;

    const now = Date.now();
    if (!force && text === this.lastSpokenText && now - this.lastSpokenTime < 2200) {
      return;
    }

    if (interrupt) {
      if (this.currentAudioElement) {
        try {
          this.currentAudioElement.pause();
          this.currentAudioElement.currentTime = 0;
        } catch {
          // Ignore
        }
        this.currentAudioElement = null;
      }
      if (this.synth) {
        try {
          this.synth.cancel();
        } catch {
          // Ignore
        }
      }
    }

    this.lastSpokenTime = now;
    this.lastSpokenText = text;

    const lang = this.currentLanguage || 'vi_nam';

    // 1. Primary Method: Neural AI TTS Stream (FastAPI or Node Proxy)
    const neuralUrl = `http://localhost:5050/api/ai/tts-neural?text=${encodeURIComponent(
      text.slice(0, 200)
    )}&voice=${encodeURIComponent(lang)}&speed=${this.voiceSpeed}`;

    try {
      const audio = new Audio(neuralUrl);
      this.currentAudioElement = audio;
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch(err => {
          console.warn('Neural TTS play failed, trying direct Google TTS fallback:', err);
          this.speakViaDirectGoogleTTS(text, lang);
        });
      }
      return;
    } catch {
      this.speakViaDirectGoogleTTS(text, lang);
    }
  }

  private speakViaDirectGoogleTTS(text: string, lang: string) {
    try {
      const googleLang = lang.startsWith('vi') ? 'vi' : lang;
      const googleUrl = `https://translate.google.com/translate_tts?ie=UTF-8&tl=${encodeURIComponent(
        googleLang
      )}&client=tw-ob&q=${encodeURIComponent(text.slice(0, 200))}`;

      const audio = new Audio(googleUrl);
      audio.playbackRate = Math.max(0.8, Math.min(1.4, this.voiceSpeed));
      this.currentAudioElement = audio;
      audio.play().catch(() => {
        this.speakViaBrowserTTS(text, lang);
      });
    } catch {
      this.speakViaBrowserTTS(text, lang);
    }
  }

  private speakViaBrowserTTS(text: string, lang: string) {
    if (!this.synth) return;

    try {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = this.voiceSpeed;
      utterance.pitch = this.voicePitch;
      utterance.lang = lang.startsWith('vi') ? 'vi-VN' : lang === 'fr' ? 'fr-FR' : lang;

      const voices = this.synth.getVoices();
      const matched = voices.find(v => v.lang.toLowerCase().startsWith(lang.toLowerCase()));
      if (matched) {
        utterance.voice = matched;
      }

      this.synth.speak(utterance);
    } catch (err) {
      console.warn('Browser TTS fallback error:', err);
    }
  }

  /* ---------------- Synthesizer Sound Effects ---------------- */
  public playRepSound(repCount: number) {
    if (this.isMuted) return;
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      const baseFreq = 587.33; // D5
      const freq = Math.min(880, baseFreq + (repCount % 10) * 20);

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.25, ctx.currentTime + 0.12);

      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.15);
    } catch {
      // Ignore
    }
  }

  public playWarningSound() {
    if (this.isMuted) return;
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(160, ctx.currentTime + 0.18);

      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.2);
    } catch {
      // Ignore
    }
  }

  public playSuccessCelebration() {
    if (this.isMuted) return;
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;

      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
      notes.forEach((freq, index) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const startTime = ctx.currentTime + index * 0.1;

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, startTime);

        gain.gain.setValueAtTime(0.2, startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.25);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(startTime);
        osc.stop(startTime + 0.25);
      });
    } catch {
      // Ignore
    }
  }

  public playCountdownBeep(isFinal: boolean = false) {
    if (this.isMuted) return;
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(isFinal ? 880 : 440, ctx.currentTime);

      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + (isFinal ? 0.3 : 0.15));

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + (isFinal ? 0.3 : 0.15));
    } catch {
      // Ignore
    }
  }
}

export const audioCoach = new AudioCoach();
