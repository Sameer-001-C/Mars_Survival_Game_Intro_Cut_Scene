import React from 'react';
import { Pause, RotateCcw, Volume2, VolumeX, CheckCircle2, Circle } from 'lucide-react';
import type { EngineHudSnapshot } from '../scene/CutsceneEngine';

interface SurvivalHUDProps {
  hud: EngineHudSnapshot;
  muted: boolean;
  onReplayCutscene: () => void;
  onPause: () => void;
  onToggleMute: () => void;
}

export const SurvivalHUD: React.FC<SurvivalHUDProps> = ({
  hud,
  muted,
  onReplayCutscene,
  onPause,
  onToggleMute,
}) => {
  return (
    <div className="fixed inset-0 z-20 pointer-events-none">
      {/* Subtle cracked visor framing */}
      <svg
        aria-hidden="true"
        viewBox="0 0 1440 900"
        preserveAspectRatio="none"
        className="fixed inset-0 w-full h-full pointer-events-none opacity-40"
      >
        <path
          d="M 1220 0 L 1140 135 L 1230 215 L 1110 310 M 1140 135 L 1030 165"
          fill="none"
          stroke="rgba(255,255,255,0.4)"
          strokeWidth="1.8"
        />
      </svg>

      {/* Center crosshair */}
      <div
        aria-hidden="true"
        className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full border border-white/60 pointer-events-none"
      />

      {/* World-to-screen objective waypoint markers */}
      {hud.waypoints.map((wp) =>
        wp.visible ? (
          <div
            key={wp.id}
            style={{ transform: `translate(${Math.round(wp.x)}px, ${Math.round(wp.y)}px)` }}
            className="fixed top-0 left-0 -translate-x-1/2 -translate-y-full pointer-events-none"
          >
            <div className="px-2.5 py-1 rounded bg-[#0c1017]/90 border border-amber-400/50 text-center whitespace-nowrap">
              <div className="text-[11px] font-medium text-amber-300">{wp.label}</div>
              <div className="text-[10px] font-mono-tech text-slate-300 tabular-nums">
                {wp.distanceM} m
              </div>
            </div>
          </div>
        ) : null
      )}

      {/* Top-left: Suit Vitals & Survival Objectives */}
      <div className="fixed top-5 left-5 flex flex-col gap-3 max-w-xs">
        <div className="px-4 py-3 rounded-lg bg-[#0b0e14]/90 border border-white/15">
          <div className="flex items-center justify-between gap-6 mb-1.5">
            <span className="text-[11px] font-mono-tech text-amber-400">SOL 23 · STRANDED</span>
            <span className="text-xs font-mono-tech text-white tabular-nums">
              O2 {hud.oxygenPercent}%
            </span>
          </div>
          <div className="w-52 h-1.5 rounded-full bg-slate-800 overflow-hidden">
            <div
              className={`h-full transition-[width] duration-200 ${
                hud.oxygenPercent < 25 ? 'bg-red-500' : 'bg-sky-400'
              }`}
              style={{ width: `${hud.oxygenPercent}%` }}
            />
          </div>
        </div>

        <div className="px-4 py-3 rounded-lg bg-[#0b0e14]/90 border border-white/15">
          <div className="text-[11px] font-mono-tech text-slate-400 mb-2">SURVIVAL OBJECTIVES</div>
          <ul className="flex flex-col gap-1.5 text-xs">
            {hud.objectives.map((obj) => (
              <li
                key={obj.id}
                className={`flex items-center gap-2 ${
                  obj.completed ? 'text-emerald-300 line-through' : 'text-slate-100'
                }`}
              >
                {obj.completed ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                ) : (
                  <Circle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                )}
                <span>{obj.label}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Top-right utility controls */}
      <div className="fixed top-5 right-5 flex items-center gap-2 pointer-events-auto">
        <button
          type="button"
          onClick={(e) => {
            e.currentTarget.blur();
            onReplayCutscene();
          }}
          className="inline-flex items-center gap-1.5 px-3.5 h-9 rounded-lg bg-[#0b0e14]/90 hover:bg-[#161c28] border border-white/15 text-xs font-medium text-slate-200 whitespace-nowrap shrink-0 cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Replay Cutscene</span>
        </button>

        <button
          type="button"
          onClick={(e) => {
            e.currentTarget.blur();
            onToggleMute();
          }}
          tabIndex={-1}
          aria-label={muted ? 'Unmute audio' : 'Mute audio'}
          className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-[#0b0e14]/90 hover:bg-[#161c28] border border-white/15 text-slate-200 cursor-pointer"
        >
          {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
        </button>

        <button
          type="button"
          onClick={(e) => {
            e.currentTarget.blur();
            onPause();
          }}
          tabIndex={-1}
          aria-label="Pause"
          className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-[#0b0e14]/90 hover:bg-[#161c28] border border-white/15 text-slate-200 cursor-pointer"
        >
          <Pause className="w-4 h-4" />
        </button>
      </div>

      {/* Bottom control hint */}
      <div className="fixed bottom-4 inset-x-0 flex justify-center px-4 pointer-events-none">
        <div className="px-4 py-1.5 rounded-md bg-[#090c12]/85 border border-white/10 text-xs font-mono-tech text-slate-200">
          WASD or Arrow Keys Move · Drag Mouse or Q/E Look · Reach the Ares II Legacy Hab Airlock
        </div>
      </div>
    </div>
  );
};
