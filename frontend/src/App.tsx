import { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { LandingPage } from './components/Home/LandingPage';
import { CameraView } from './components/WorkoutStudio/CameraView';
import { ExerciseLibrary } from './components/ExerciseLibrary/ExerciseLibrary';
import { AiCoachChat } from './components/AiCoachChat/AiCoachChat';
import { HistoryAnalytics } from './components/HistoryAnalytics/HistoryAnalytics';
import { NutritionScanner } from './components/NutritionScanner/NutritionScanner';
import { WorkoutPlanGenerator } from './components/WorkoutPlan/WorkoutPlanGenerator';
import { SettingsModal } from './components/SettingsModal';
import { AuthModal } from './components/Auth/AuthModal';
import { CreateExerciseModal } from './components/Admin/CreateExerciseModal';
import { ExerciseInfo, UserSettings, UserProfile } from './types';
import { EXERCISES } from './data/exercises';
import { StorageService } from './services/storageService';
import { audioCoach } from './engine/audioCoach';

export function App() {
  const [currentTab, setCurrentTab] = useState<'home' | 'studio' | 'plan' | 'nutrition' | 'library' | 'coach' | 'history'>('home');
  const [selectedExercise, setSelectedExercise] = useState<ExerciseInfo>(EXERCISES[0]);
  const [settings, setSettings] = useState<UserSettings>(StorageService.getSettings());
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isCreateExerciseOpen, setIsCreateExerciseOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => StorageService.getCurrentUser());
  const [isMuted, setIsMuted] = useState(!settings.voiceCoachEnabled);
  const [historyCount, setHistoryCount] = useState(0);
  const [totalCalories, setTotalCalories] = useState(0);

  useEffect(() => {
    // Sync stats
    const stats = StorageService.getOverallStats();
    setTotalCalories(stats.totalCalories);

    const history = StorageService.getHistory();
    setHistoryCount(history.length);

    // Sync audio settings
    audioCoach.setVoiceSettings(settings.voiceSpeed, settings.voicePitch);
    audioCoach.setMuted(isMuted);
  }, [settings, isMuted, currentTab]);

  const handleOpenAuth = (mode: 'login' | 'register' = 'login') => {
    setAuthMode(mode);
    setIsAuthOpen(true);
  };

  const handleAuthSuccess = (user: UserProfile) => {
    setCurrentUser(user);
    setSettings(StorageService.getSettings());
  };

  const handleLogout = () => {
    StorageService.clearCurrentUser();
    setCurrentUser(null);
    audioCoach.speak('Đã đăng xuất tài khoản.');
  };

  const handleToggleMute = () => {
    const nextMute = !isMuted;
    setIsMuted(nextMute);
    audioCoach.setMuted(nextMute);
    if (!nextMute) {
      audioCoach.speak('Âm thanh đã bật.');
    }
  };

  const handleSelectAndStartExercise = (exercise?: ExerciseInfo) => {
    if (exercise) {
      setSelectedExercise(exercise);
    }
    setCurrentTab('studio');
  };

  const handleStartExerciseFromRoutine = (exercise: ExerciseInfo, targetReps?: number) => {
    setSelectedExercise(exercise);
    setCurrentTab('studio');
    audioCoach.speak(
      `Bắt đầu bài tập ${exercise.nameVi}. Mục tiêu ${targetReps || exercise.defaultTargetReps} ${
        exercise.isHoldExercise ? 'giây' : 'lần'
      }.`
    );
  };

  return (
    <div className="min-h-screen bg-[var(--bg-canvas)] text-[var(--text-primary)] flex flex-col transition-colors duration-300">
      {/* Top Navbar */}
      <Navbar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        totalCalories={totalCalories}
        isMuted={isMuted}
        onToggleMute={handleToggleMute}
        onOpenSettings={() => setIsSettingsOpen(true)}
        historyCount={historyCount}
        currentUser={currentUser}
        onOpenAuth={handleOpenAuth}
        onLogout={handleLogout}
        onOpenCreateExercise={() => setIsCreateExerciseOpen(true)}
      />

      {/* Main Tab Content */}
      <main className="flex-1 pb-12">
        {currentTab === 'home' && (
          <LandingPage
            onStartWorkout={handleSelectAndStartExercise}
            onNavigateTab={setCurrentTab}
          />
        )}

        {currentTab === 'studio' && (
          <CameraView
            selectedExercise={selectedExercise}
            onSelectExercise={setSelectedExercise}
            onOpenAiCoach={() => setCurrentTab('coach')}
          />
        )}

        {currentTab === 'plan' && (
          <WorkoutPlanGenerator
            onStartExerciseInStudio={handleStartExerciseFromRoutine}
            availableExercises={EXERCISES}
          />
        )}

        {currentTab === 'nutrition' && (
          <NutritionScanner
            onStartExercise={handleSelectAndStartExercise}
            currentUser={currentUser}
          />
        )}

        {currentTab === 'library' && (
          <ExerciseLibrary
            onSelectAndStart={handleSelectAndStartExercise}
            currentUser={currentUser}
            onOpenCreateExercise={() => setIsCreateExerciseOpen(true)}
          />
        )}

        {currentTab === 'coach' && <AiCoachChat />}

        {currentTab === 'history' && (
          <HistoryAnalytics
            onStartNewWorkout={() => setCurrentTab('studio')}
            currentUser={currentUser}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-[var(--border-card)] bg-[var(--bg-canvas)] py-4 text-center font-mono text-[11px] text-[var(--text-muted)]">
        <div className="mx-auto max-w-[1680px] px-4 sm:px-8 xl:px-12 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>FITCOACH PRO • QUÉT TƯ THẾ REAL-TIME &amp; QUÉT CALO KHẨU PHẦN ĂN • GEMINI MULTIMODAL AI</span>
          <span className="text-[#ca8a04] dark:text-[#eab308]">100% ON-DEVICE EDGE AI PRIVACY</span>
        </div>
      </footer>

      {/* Auth Modal (Login / Register) */}
      <AuthModal
        isOpen={isAuthOpen}
        initialMode={authMode}
        onClose={() => setIsAuthOpen(false)}
        onAuthSuccess={handleAuthSuccess}
      />

      {/* Admin Exercise Creator Modal */}
      <CreateExerciseModal
        isOpen={isCreateExerciseOpen}
        onClose={() => setIsCreateExerciseOpen(false)}
        onExerciseCreated={newEx => {
          audioCoach.speak(`Đã tạo bài tập ${newEx.nameVi} thành công.`);
          setCurrentTab('library');
        }}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onSettingsChanged={newSettings => {
          setSettings(newSettings);
          setIsMuted(!newSettings.voiceCoachEnabled);
        }}
      />
    </div>
  );
}

export default App;
