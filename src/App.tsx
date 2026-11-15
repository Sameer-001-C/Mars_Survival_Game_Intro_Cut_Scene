import { useCallback, useEffect, useRef, useState } from 'react';
import { SoundEngine } from './audio/soundEngine';
import { CutsceneHUD } from './components/CutsceneHUD';
import { ModalOverlay } from './components/ModalOverlay';
import { SurvivalHUD } from './components/SurvivalHUD';
import { TitleOverlay } from './components/TitleOverlay';
import {
  createInitialObjectives,
  type ChapterId,
  type GamePhase,
} from './cutscene/timeline';
import { CutsceneEngine, type EngineHudSnapshot } from './scene/CutsceneEngine';

const INITIAL_HUD: EngineHudSnapshot = {
  phase: 'title',
  chapterId: 'earth_farewell',
  chapterIndex: 1,
  chapterTitle: 'Launch Complex Departure',
  location: 'Kennedy Orbital Complex · Launch Wing B',
  localTime: 0,
  localProgress: 0,
  totalProgress: 0,
  subtitleSpeaker: null,
  subtitleText: null,
  subtitleTone: 'normal',
  countdownNumber: 5,
  ignited: false,
  altitudeKm: 0,
  velocityKms: 0,
  transitMonths: 0,
  transitDays: 0,
  transitDistanceMkm: 0,
  transitPercent: 0,
  solNumber: 0,
  stormAlertActive: false,
  commsLost: false,
  blackoutOpacity: 0,
  helmetCracked: false,
  objectives: createInitialObjectives(),
  waypoints: [],
  survivalElapsedSec: 0,
  oxygenPercent: 42,
};

function mapPhaseToBodyState(phase: GamePhase): string {
  if (phase === 'title') return 'title';
  if (phase === 'paused') return 'paused';
  if (phase === 'complete') return 'gameover';
  return 'playing';
}

export default function App() {
  const canvasMountRef = useRef<HTMLDivElement | null>(null);
  const engineRef = useRef<CutsceneEngine | null>(null);
  const soundRef = useRef<SoundEngine | null>(null);

  const [hud, setHud] = useState<EngineHudSnapshot>(INITIAL_HUD);
  const [muted, setMuted] = useState(false);

  const syncBodyState = useCallback((phase: GamePhase) => {
    document.body.dataset.state = mapPhaseToBodyState(phase);
    document.body.dataset.phase = phase;
  }, []);

  useEffect(() => {
    const mount = canvasMountRef.current;
    if (!mount) return;

    const sound = new SoundEngine();
    soundRef.current = sound;
    sound.prefetchCutsceneVoiceovers(['earth_farewell', 'boarding', 'launch']);

    const unlockOnce = () => sound.unlock(true);
    window.addEventListener('pointerdown', unlockOnce, { passive: true });
    window.addEventListener('keydown', unlockOnce, { passive: true });

    const engine = new CutsceneEngine(mount, sound, (snapshot) => {
      syncBodyState(snapshot.phase);
      setHud(snapshot);
    });
    engineRef.current = engine;

    const params = new URLSearchParams(window.location.search);
    if (params.get('autostart') === '1') {
      engine.startCutscene(true);
    } else {
      syncBodyState('title');
    }

    return () => {
      window.removeEventListener('pointerdown', unlockOnce);
      window.removeEventListener('keydown', unlockOnce);
      engine.dispose();
      engineRef.current = null;
      sound.silenceLoops();
      soundRef.current = null;
    };
  }, [syncBodyState]);

  const handleStart = useCallback(() => {
    soundRef.current?.unlock(true);
    document.body.dataset.state = 'playing';
    engineRef.current?.startCutscene(true);
  }, []);

  const handleSkipToSurvival = useCallback(() => {
    soundRef.current?.unlock(true);
    document.body.dataset.state = 'playing';
    engineRef.current?.skipToSurvival();
  }, []);

  const handleJumpChapter = useCallback((id: ChapterId) => {
    soundRef.current?.unlock(true);
    engineRef.current?.jumpToChapter(id);
  }, []);

  const handlePause = useCallback(() => {
    engineRef.current?.pause();
  }, []);

  const handleResume = useCallback(() => {
    soundRef.current?.unlock(true);
    engineRef.current?.resume();
  }, []);

  const handleReturnTitle = useCallback(() => {
    engineRef.current?.returnToTitle();
  }, []);

  const handleToggleMute = useCallback(() => {
    const sound = soundRef.current;
    if (!sound) return;
    sound.unlock(true);
    const next = !sound.isMuted();
    sound.setMuted(next);
    setMuted(next);
  }, []);

  // Global keyboard shortcuts
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (hud.phase === 'title' && (e.code === 'Enter' || e.code === 'Space')) {
        e.preventDefault();
        handleStart();
        return;
      }
      if (hud.phase === 'cutscene' && e.code === 'KeyS') {
        e.preventDefault();
        handleSkipToSurvival();
        return;
      }
      if (e.code === 'KeyM') {
        e.preventDefault();
        handleToggleMute();
        return;
      }
      if (e.code === 'Escape' || e.code === 'KeyP') {
        if (hud.phase === 'cutscene' || hud.phase === 'survival') {
          e.preventDefault();
          handlePause();
        } else if (hud.phase === 'paused') {
          e.preventDefault();
          handleResume();
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [
    hud.phase,
    handleStart,
    handleSkipToSurvival,
    handleToggleMute,
    handlePause,
    handleResume,
  ]);

  return (
    <main className="relative w-screen h-screen overflow-hidden bg-[#090a0d]">
      {/* Isolated WebGL mount container */}
      <div ref={canvasMountRef} className="fixed inset-0 w-full h-full z-0" />

      {hud.phase === 'title' && (
        <TitleOverlay
          muted={muted}
          onStart={handleStart}
          onSkipToMars={handleSkipToSurvival}
          onToggleMute={handleToggleMute}
        />
      )}

      {hud.phase === 'cutscene' && (
        <CutsceneHUD
          hud={hud}
          muted={muted}
          onSkip={handleSkipToSurvival}
          onJumpChapter={handleJumpChapter}
          onPause={handlePause}
          onToggleMute={handleToggleMute}
        />
      )}

      {hud.phase === 'survival' && (
        <SurvivalHUD
          hud={hud}
          muted={muted}
          onReplayCutscene={handleStart}
          onPause={handlePause}
          onToggleMute={handleToggleMute}
        />
      )}

      {(hud.phase === 'paused' || hud.phase === 'complete') && (
        <ModalOverlay
          mode={hud.phase}
          hud={hud}
          onResume={handleResume}
          onReplayCutscene={handleStart}
          onReturnTitle={handleReturnTitle}
        />
      )}
    </main>
  );
}
