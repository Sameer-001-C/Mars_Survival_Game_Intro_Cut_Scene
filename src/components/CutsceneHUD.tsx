import React, { useState } from 'react';
import {
  FastForward,
  Pause,
  Volume2,
  VolumeX,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
} from 'lucide-react';
import { CUTSCENE_CHAPTERS, type ChapterId } from '../cutscene/timeline';
import type { EngineHudSnapshot } from '../scene/CutsceneEngine';

interface CutsceneHUDProps {
  hud: EngineHudSnapshot;
  muted: boolean;
  onSkip: () => void;
  onJumpChapter: (id: ChapterId) => void;
  onPause: () => void;
  onToggleMute: () => void;
}

export const CutsceneHUD: React.FC<CutsceneHUDProps> = ({
  hud,
  muted,
  onSkip,
  onJumpChapter,
  onPause,
  onToggleMute,
}) => {
  const [dockCollapsed, setDockCollapsed] = useState(false);

  return (
    <div className="fixed inset-0 z-20 pointer-events-none flex flex-col justify-between">
      {/* Subtle cinematic letterbox bars (compact so viewport stays spacious) */}
      <div
        aria-hidden="true"
        className="fixed top-0 inset-x-0 h-11 bg-[#07090d]/90 border-b border-white/10 pointer-events-none"
      />
      <div
        aria-hidden="true"
        className="fixed bottom-0 inset-x-0 h-10 bg-[#07090d]/90 border-t border-white/10 pointer-events-none"
      />

      {/* Visor crack SVG overlay during storm impact & awakening */}
      {hud.helmetCracked && (
        <svg
          aria-hidden="true"
          viewBox="0 0 1440 900"
          preserveAspectRatio="none"
          className="fixed inset-0 w-full h-full pointer-events-none opacity-55"
        >
          <path
            d="M 1180 0 L 1110 145 L 1195 230 L 1075 340 M 1110 145 L 980 185 L 910 140 M 1195 230 L 1310 275"
            fill="none"
            stroke="rgba(255,255,255,0.45)"
            strokeWidth="2"
          />
          <path
            d="M 1180 0 L 1110 145 L 1195 230 L 1075 340"
            fill="none"
            stroke="rgba(255,180,120,0.22)"
            strokeWidth="5"
          />
        </svg>
      )}

      {/* Blackout fade layer between storm strike and Sol 23 awakening */}
      {hud.blackoutOpacity > 0.01 && (
        <div
          aria-hidden="true"
          className="fixed inset-0 bg-[#040507] pointer-events-none"
          style={{ opacity: hud.blackoutOpacity }}
        />
      )}

      {/* Top HUD Bar */}
      <header className="relative z-10 flex items-center justify-between px-5 h-11">
        <div className="flex items-center gap-3 text-xs font-mono-tech text-slate-200 whitespace-nowrap">
          <span className="text-amber-400 font-semibold">
            0{hud.chapterIndex} / 08
          </span>
          <span aria-hidden="true" className="text-slate-600">
            ·
          </span>
          <span className="font-sans font-semibold text-white">{hud.chapterTitle}</span>
          <span aria-hidden="true" className="hidden sm:inline text-slate-600">
            ·
          </span>
          <span className="hidden sm:inline text-slate-400">{hud.location}</span>
        </div>

        <div className="flex items-center gap-2 pointer-events-auto">
          <button
            type="button"
            onClick={(e) => {
              e.currentTarget.blur();
              onToggleMute();
            }}
            tabIndex={-1}
            aria-label={muted ? 'Unmute audio' : 'Mute audio'}
            className="inline-flex items-center justify-center w-8 h-8 rounded bg-[#141923] hover:bg-[#1e2533] border border-white/15 text-slate-200 transition-colors cursor-pointer"
          >
            {muted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.currentTarget.blur();
              onPause();
            }}
            tabIndex={-1}
            aria-label="Pause cutscene"
            className="inline-flex items-center justify-center w-8 h-8 rounded bg-[#141923] hover:bg-[#1e2533] border border-white/15 text-slate-200 transition-colors cursor-pointer"
          >
            <Pause className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            data-skip-cutscene="true"
            onClick={(e) => {
              e.currentTarget.blur();
              onSkip();
            }}
            className="inline-flex items-center gap-1.5 px-3.5 h-8 rounded bg-[#d95b2b] hover:bg-[#e86938] text-white text-xs font-semibold whitespace-nowrap shrink-0 transition-colors cursor-pointer"
          >
            <span>Skip Cutscene</span>
            <FastForward className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* Center Sequence Beats (Countdown, 8-Month Transit, Sol Timelapse, Storm Alert) */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6">
        {/* Chapter 3: Countdown & Liftoff Telemetry (top-right so rocket remains unobstructed) */}
        {hud.chapterId === 'launch' && (
          <div className="fixed top-16 right-6 text-right">
            {!hud.ignited ? (
              <div className="px-6 py-4 rounded-xl bg-[#090c12]/88 border border-white/15">
                <div className="text-[11px] font-mono-tech text-amber-400 tracking-widest mb-1">
                  TERMINAL LAUNCH COUNTDOWN
                </div>
                <div className="font-display text-6xl md:text-7xl font-bold text-white leading-none tabular-nums">
                  T-{hud.countdownNumber}
                </div>
              </div>
            ) : (
              <div className="px-4 py-3 rounded-lg bg-[#090c12]/88 border border-white/15">
                <div className="text-[11px] font-mono-tech text-amber-400">ASCENT TELEMETRY</div>
                <div className="text-lg font-mono-tech font-semibold text-white tabular-nums">
                  ALT {hud.altitudeKm} KM · {hud.velocityKms} KM/S
                </div>
              </div>
            )}
          </div>
        )}

        {/* Chapter 4: 8-Month Transit Animation Overlay (anchored upper band so 3D ship & planets stay unobstructed) */}
        {hud.chapterId === 'transit_8_months' && (
          <div className="fixed top-16 left-1/2 -translate-x-1/2 w-[min(520px,92vw)] px-6 py-4 rounded-xl bg-[#090c12]/90 border border-white/15">
            <div className="flex items-baseline justify-between mb-2.5">
              <div>
                <div className="text-[11px] font-mono-tech text-sky-400">TRANS-MARS CRUISE</div>
                <div className="font-display text-2xl md:text-3xl font-bold text-white tabular-nums">
                  {hud.transitMonths.toFixed(1)} Months Elapsed
                </div>
              </div>
              <div className="text-right font-mono-tech">
                <div className="text-sm font-semibold text-amber-400 tabular-nums">
                  DAY {String(hud.transitDays).padStart(3, '0')} / 240
                </div>
                <div className="text-xs text-slate-400 tabular-nums">
                  {hud.transitDistanceMkm}M / 225M KM
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs font-mono-tech text-sky-300 shrink-0">EARTH</span>
              <div className="flex-1 h-2 rounded-full bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-amber-500 transition-[width] duration-100"
                  style={{ width: `${hud.transitPercent}%` }}
                />
              </div>
              <span className="text-xs font-mono-tech text-[#e06d44] shrink-0">MARS</span>
            </div>
          </div>
        )}

        {/* Chapter 6: Sol Timelapse Counter */}
        {hud.chapterId === 'mars_arrival_timelapse' && hud.solNumber > 1 && (
          <div className="fixed top-16 left-6 px-4 py-3 rounded-lg bg-[#0d0a09]/85 border border-amber-500/30">
            <div className="text-[11px] font-mono-tech text-amber-400">SURFACE TIMELAPSE</div>
            <div className="font-display text-3xl font-bold text-white tabular-nums">
              SOL {String(hud.solNumber).padStart(2, '0')}
            </div>
          </div>
        )}

        {/* Chapter 7: Critical Dust Storm & Comms Lost Alert */}
        {hud.stormAlertActive && (
          <div className="fixed top-16 inset-x-0 flex justify-center px-4">
            <div className="inline-flex items-center gap-3 px-5 py-2.5 rounded-lg bg-[#3b0e08]/92 border border-red-400/50 text-red-100">
              <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
              <div className="text-xs md:text-sm font-mono-tech">
                <span className="font-bold text-red-300">DUST STORM EVACUATION</span>
                <span aria-hidden="true" className="mx-2 text-red-400/60">
                  ·
                </span>
                <span>
                  {hud.commsLost
                    ? 'TEAM COMMS LOST — MAV ASCENDING WITHOUT YOU'
                    : 'WIND SHEAR 185 KM/H — REACH MAV IMMEDIATELY'}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Subtitle + Collapsible Chapter Dock */}
      <div className="relative z-10 flex flex-col items-center pb-12 px-4 gap-3">
        {hud.subtitleText && (
          <div
            className={`max-w-2xl w-full px-5 py-3 rounded-lg border text-center ${
              hud.subtitleTone === 'critical'
                ? 'bg-[#2a0c09]/92 border-red-400/45 text-red-50'
                : hud.subtitleTone === 'alert'
                  ? 'bg-[#211509]/92 border-amber-400/45 text-amber-50'
                  : 'bg-[#0a0d14]/90 border-white/15 text-slate-100'
            }`}
          >
            <div className="text-[11px] font-mono-tech tracking-wider text-amber-400 mb-0.5">
              {hud.subtitleSpeaker}
            </div>
            <p className="text-sm md:text-base leading-snug">{hud.subtitleText}</p>
          </div>
        )}

        {/* Collapsible bottom chapter scrubber dock */}
        <div className="pointer-events-auto flex flex-col items-center">
          <button
            type="button"
            onClick={(e) => {
              e.currentTarget.blur();
              setDockCollapsed((c) => !c);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-t-md bg-[#11151f]/95 border border-b-0 border-white/15 text-[11px] font-mono-tech text-slate-300 hover:text-white cursor-pointer"
          >
            {dockCollapsed ? (
              <>
                <ChevronUp className="w-3 h-3" />
                <span>Show Chapters</span>
              </>
            ) : (
              <>
                <ChevronDown className="w-3 h-3" />
                <span>Hide Chapters</span>
              </>
            )}
          </button>

          {!dockCollapsed && (
            <div className="flex flex-wrap justify-center gap-1 p-1.5 rounded-lg bg-[#0d111a]/95 border border-white/15 max-w-[94vw]">
              {CUTSCENE_CHAPTERS.map((ch) => {
                const active = ch.id === hud.chapterId;
                return (
                  <button
                    key={ch.id}
                    type="button"
                    onClick={(e) => {
                      e.currentTarget.blur();
                      onJumpChapter(ch.id);
                    }}
                    className={`px-2.5 py-1.5 rounded text-xs font-medium whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                      active
                        ? 'bg-[#d95b2b] text-white'
                        : 'text-slate-300 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    {ch.index}. {ch.title}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
