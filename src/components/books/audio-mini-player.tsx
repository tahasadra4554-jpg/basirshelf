"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play,
  Pause,
  Square,
  RotateCcw,
  RotateCw,
  Volume2,
  VolumeX,
  X,
  Minus,
} from "lucide-react";

export interface AudioTrack {
  id?: string;
  title: string;
  bookTitle?: string;
  audioUrl: string;
  unitNumber?: string | number;
  sectionId?: string;
}

export type CassetteTrack = AudioTrack;

interface AudioMiniPlayerProps {
  track: AudioTrack | null;
  onClose: () => void;
}

// Generate an authentic mechanical click sound with Web Audio API
function playMechanicalClick(frequency = 180, duration = 0.035) {
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(frequency, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + duration);

    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + duration);
    setTimeout(() => {
      ctx.close().catch(() => {});
    }, duration * 1000 + 100);
  } catch {
    // Ignore audio context failures
  }
}

function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return "00:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

export function AudioMiniPlayer({ track, onClose }: AudioMiniPlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const progressLineRef = useRef<HTMLDivElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [volumeSliderOpen, setVolumeSliderOpen] = useState(false);
  const [isDraggingKnob, setIsDraggingKnob] = useState(false);
  const [prefersReduced, setPrefersReduced] = useState(false);

  // Check reduced motion preference
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReduced(mq.matches);
    const handler = (e: MediaQueryListEvent) => setPrefersReduced(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  // Restore saved volume
  useEffect(() => {
    try {
      const savedVol = localStorage.getItem("basirshelf:cassette:volume");
      if (savedVol !== null) {
        const v = parseFloat(savedVol);
        if (!isNaN(v) && v >= 0 && v <= 1) {
          setVolume(v);
          setIsMuted(v === 0);
        }
      }
    } catch {
      // Ignore
    }
  }, []);

  // Sync track change
  useEffect(() => {
    if (!track) {
      setIsPlaying(false);
      setCurrentTime(0);
      return;
    }
    setCurrentTime(0);
    setIsMinimized(false);

    const audio = audioRef.current;
    if (audio) {
      audio.src = track.audioUrl;
      audio.playbackRate = playbackRate;
      audio.volume = isMuted ? 0 : volume;

      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => setIsPlaying(true))
          .catch(() => setIsPlaying(false));
      }
    }
  }, [track, playbackRate, isMuted, volume]);

  // Audio element listeners
  const handleTimeUpdate = () => {
    if (audioRef.current && !isDraggingKnob) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration || 0);
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
  };

  // Play / Pause toggle
  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    playMechanicalClick();

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      window.dispatchEvent(new CustomEvent("basirshelf:pause-video"));
      audio
        .play()
        .then(() => setIsPlaying(true))
        .catch(() => setIsPlaying(false));
    }
  }, [isPlaying]);

  // Stop playback (resets to 0:00)
  const stopPlayback = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    playMechanicalClick();
    audio.pause();
    audio.currentTime = 0;
    setCurrentTime(0);
    setIsPlaying(false);
  }, []);

  // Seek +/- 10s
  const seekDelta = useCallback(
    (deltaSeconds: number) => {
      const audio = audioRef.current;
      if (!audio) return;
      playMechanicalClick();
      const target = Math.max(0, Math.min(duration || 100, audio.currentTime + deltaSeconds));
      audio.currentTime = target;
      setCurrentTime(target);
    },
    [duration],
  );

  // Speed cycle: 0.75x -> 1x -> 1.25x -> 1.5x -> 2x -> 0.75x
  const cycleSpeed = useCallback(() => {
    playMechanicalClick();
    const speeds = [0.75, 1, 1.25, 1.5, 2];
    const currentIndex = speeds.indexOf(playbackRate);
    const nextSpeed = speeds[(currentIndex + 1) % speeds.length];
    setPlaybackRate(nextSpeed);
    if (audioRef.current) {
      audioRef.current.playbackRate = nextSpeed;
    }
  }, [playbackRate]);

  // Volume slider handler
  const handleVolumeChange = (newVol: number) => {
    setVolume(newVol);
    setIsMuted(newVol === 0);
    if (audioRef.current) {
      audioRef.current.volume = newVol;
      audioRef.current.muted = newVol === 0;
    }
    try {
      localStorage.setItem("basirshelf:cassette:volume", String(newVol));
    } catch {
      // Ignore
    }
  };

  const toggleMute = () => {
    playMechanicalClick();
    if (isMuted) {
      setIsMuted(false);
      if (audioRef.current) audioRef.current.muted = false;
    } else {
      setIsMuted(true);
      if (audioRef.current) audioRef.current.muted = true;
    }
  };

  // Keyboard controls (Space = Play/Pause, Left = -10s, Right = +10s, Esc = Close)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!track) return;
      if (["input", "textarea"].includes((e.target as HTMLElement)?.tagName?.toLowerCase())) return;

      if (e.code === "Space") {
        e.preventDefault();
        togglePlay();
      } else if (e.code === "ArrowLeft") {
        e.preventDefault();
        seekDelta(-10);
      } else if (e.code === "ArrowRight") {
        e.preventDefault();
        seekDelta(10);
      } else if (e.code === "Escape") {
        e.preventDefault();
        if (volumeSliderOpen) setVolumeSliderOpen(false);
        else onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [track, togglePlay, seekDelta, volumeSliderOpen, onClose]);

  // Draggable Magnetic Tape Progress Knob
  const updateProgressFromPointer = useCallback(
    (clientX: number) => {
      if (!progressLineRef.current || !duration) return;
      const rect = progressLineRef.current.getBoundingClientRect();
      const clickX = Math.max(0, Math.min(clientX - rect.left, rect.width));
      const ratio = clickX / rect.width;
      const targetTime = ratio * duration;
      setCurrentTime(targetTime);
      if (audioRef.current) {
        audioRef.current.currentTime = targetTime;
      }
    },
    [duration],
  );

  const handlePointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    setIsDraggingKnob(true);
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    updateProgressFromPointer(e.clientX);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDraggingKnob) return;
    e.preventDefault();
    updateProgressFromPointer(e.clientX);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!isDraggingKnob) return;
    setIsDraggingKnob(false);
    (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
  };

  if (!track) return null;

  // Normalized progress: 0 to 1
  const progressRatio = duration > 0 ? Math.min(1, Math.max(0, currentTime / duration)) : 0;
  const progressPercent = progressRatio * 100;

  // Reel tape thickness:
  // Left starts at 16px and shrinks to 4px: 16 - 12 * progressRatio
  // Right starts at 4px and grows to 16px: 4 + 12 * progressRatio
  const leftTapeThickness = 16 - 12 * progressRatio;
  const rightTapeThickness = 4 + 12 * progressRatio;

  // Reel spin duration (3s at 1x speed, scaled by playback rate)
  const spinDuration = 3 / Math.max(0.25, playbackRate);

  return (
    <>
      <audio
        ref={audioRef}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onLoadedData={(e) => setDuration(e.currentTarget.duration || 0)}
        onDurationChange={(e) => setDuration(e.currentTarget.duration || 0)}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={handleEnded}
        preload="auto"
      />

      {/* Embedded CSS for authentic continuous spin and play pulse */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
          @keyframes cassette-spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          @keyframes cassette-play-pulse {
            0%, 100% { box-shadow: 0 0 0 0 rgba(90, 103, 216, 0.45), inset 0 -2px 0 rgba(0,0,0,0.25); }
            50% { box-shadow: 0 0 0 6px rgba(90, 103, 216, 0.1), inset 0 -2px 0 rgba(0,0,0,0.25); }
          }
        `,
        }}
      />

      {/* Floating Minimized Badge */}
      <AnimatePresence>
        {isMinimized ? (
          <motion.button
            key="minimized-cassette"
            onClick={() => {
              playMechanicalClick();
              setIsMinimized(false);
            }}
            initial={{ scale: 0, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0, opacity: 0, y: 20 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            aria-label="Expand cassette audio player"
            className="fixed bottom-4 right-4 z-50 flex items-center gap-2.5 rounded-2xl border border-[#1A365D]/30 bg-[#F5EFE6] px-3.5 py-2 shadow-[0_12px_28px_rgba(26,54,93,0.3)] backdrop-blur transition-all"
          >
            <div
              className="relative grid size-6 place-items-center rounded-full bg-[#1A365D] text-white"
              style={{
                animation:
                  isPlaying && !prefersReduced
                    ? `cassette-spin ${spinDuration}s linear infinite`
                    : "none",
              }}
            >
              <div className="size-1.5 rounded-full bg-[#F5EFE6]" />
            </div>
            <div className="text-start">
              <p className="font-serif text-[11px] font-bold text-[#1A365D] line-clamp-1">
                {track.title}
              </p>
              <p className="font-mono text-[9px] text-[#5A67D8] font-bold">
                {isPlaying ? formatTime(currentTime) : "Paused"}
              </p>
            </div>
          </motion.button>
        ) : null}
      </AnimatePresence>

      {/* STEP 4: ANIMATIONS - Entry slide up from bottom with spring (stiffness 260, damping 20), 400ms */}
      <AnimatePresence>
        {!isMinimized ? (
          <motion.div
            key="retro-cassette-modal"
            role="region"
            aria-label="Retro cassette audio player"
            initial={{ y: 120, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 120, opacity: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 20, duration: 0.4 }}
            className="fixed bottom-3 sm:bottom-4 left-1/2 -translate-x-1/2 z-50 w-[90vw] sm:w-[420px] select-none touch-none"
          >
            {/* STEP 2-A: THE CASSETTE BODY CONTAINER */}
            {/* Aspect ratio 1.6 / 1, background #F5EFE6 subtle gradient, border 1px solid rgba(26,54,93,0.2), rounded 12px, soft shadow */}
            <div
              className="relative overflow-hidden rounded-[12px] border border-[#1A365D]/20 p-2 sm:p-2.5 shadow-[0_20px_40px_rgba(26,54,93,0.2),0_4px_12px_rgba(0,0,0,0.08)]"
              style={{
                aspectRatio: "1.6 / 1",
                background: "linear-gradient(180deg, #FBF7F0 0%, #EFE8DC 100%)",
              }}
            >
              {/* STEP 2-F: FOUR CORNER SCREWS (6px circles, gray with tiny dark dot) */}
              <div className="absolute top-1.5 left-1.5 size-[6px] rounded-full bg-[#9CA3AF] shadow-[inset_0_1px_1px_rgba(0,0,0,0.5)] flex items-center justify-center pointer-events-none z-20">
                <div className="size-[2px] rounded-full bg-[#374151]" />
              </div>
              <div className="absolute top-1.5 right-1.5 size-[6px] rounded-full bg-[#9CA3AF] shadow-[inset_0_1px_1px_rgba(0,0,0,0.5)] flex items-center justify-center pointer-events-none z-20">
                <div className="size-[2px] rounded-full bg-[#374151]" />
              </div>
              <div className="absolute bottom-1.5 left-1.5 size-[6px] rounded-full bg-[#9CA3AF] shadow-[inset_0_1px_1px_rgba(0,0,0,0.5)] flex items-center justify-center pointer-events-none z-20">
                <div className="size-[2px] rounded-full bg-[#374151]" />
              </div>
              <div className="absolute bottom-1.5 right-1.5 size-[6px] rounded-full bg-[#9CA3AF] shadow-[inset_0_1px_1px_rgba(0,0,0,0.5)] flex items-center justify-center pointer-events-none z-20">
                <div className="size-[2px] rounded-full bg-[#374151]" />
              </div>

              {/* STEP 2-F: SIDE EDGE NOTCHES (tiny rectangles cut into the border) */}
              <div className="absolute -left-[1px] top-1/2 -translate-y-1/2 w-[3px] h-4 bg-[#DED6C7] rounded-r-sm border-y border-r border-[#1A365D]/30 shadow-[inset_1px_0_1px_rgba(0,0,0,0.15)] pointer-events-none z-20" />
              <div className="absolute -right-[1px] top-1/2 -translate-y-1/2 w-[3px] h-4 bg-[#DED6C7] rounded-l-sm border-y border-l border-[#1A365D]/30 shadow-[inset_-1px_0_1px_rgba(0,0,0,0.15)] pointer-events-none z-20" />

              {/* STEP 2-A: CSS GRID WITH 3 ROWS: label (22%), window (50%), controls (28%) */}
              <div
                className="grid h-full w-full"
                style={{
                  gridTemplateRows: "22% 50% 28%",
                }}
              >
                {/* ======================================================== */}
                {/* STEP 2-B: THE LABEL (TOP 22%)                            */}
                {/* Background navy #1A365D, rounded top corners only        */}
                {/* Left: Book title serif 18px, Unit sans-serif 13px cream,  */}
                {/*       Basir Language Institute 10px gray                 */}
                {/* Right: SIDE A tag top right, Monospace 00:04 / 04:46 12px */}
                {/* Do NOT cut off text with ellipsis                         */}
                {/* ======================================================== */}
                <div
                  className="relative flex h-full w-full items-stretch justify-between overflow-hidden rounded-t-[8px] px-3 py-1 shadow-sm"
                  style={{ backgroundColor: "#1A365D" }}
                >
                  {/* Left Side text stack */}
                  <div className="flex flex-col justify-center min-w-0 pr-2">
                    <h3 className="font-serif text-[15px] sm:text-[18px] font-bold leading-tight text-[#FDFBF7] tracking-tight">
                      {track.bookTitle || "Interchange 1"}
                    </h3>
                    <p className="font-sans text-[11px] sm:text-[13px] font-medium leading-tight text-[#F5EFE6]">
                      {track.title}
                    </p>
                    <p className="font-sans text-[9px] sm:text-[10px] text-slate-300 font-normal leading-none mt-0.5">
                      Basir Language Institute
                    </p>
                  </div>

                  {/* Right Side: SIDE A tag + controls + Monospace time */}
                  <div className="flex flex-col items-end justify-between shrink-0 h-full py-0.5 pl-2">
                    <div className="flex items-center gap-1.5">
                      <span className="rounded border border-white/30 bg-white/10 px-1.5 py-0.5 font-sans text-[8px] sm:text-[9px] font-bold tracking-wider text-[#FDFBF7] uppercase leading-none">
                        SIDE A
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          playMechanicalClick();
                          setIsMinimized(true);
                        }}
                        aria-label="Minimize cassette player"
                        className="grid size-4 place-items-center rounded text-white/70 hover:bg-white/20 hover:text-white transition-colors"
                      >
                        <Minus className="size-2.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          playMechanicalClick();
                          onClose();
                        }}
                        aria-label="Close audio player"
                        className="grid size-4 place-items-center rounded text-white/70 hover:bg-red-500/30 hover:text-red-300 transition-colors"
                      >
                        <X className="size-2.5" />
                      </button>
                    </div>

                    <span className="font-mono text-[10px] sm:text-[12px] font-semibold text-[#FDFBF7] tracking-tight">
                      {formatTime(currentTime)} / {formatTime(duration)}
                    </span>
                  </div>
                </div>

                {/* ======================================================== */}
                {/* STEP 2-C: THE WINDOW (MIDDLE 50%)                         */}
                {/* Background very dark navy #0A1628, inner shadow, rounded 8px*/}
                {/* Two Reels side by side, centered horizontally            */}
                {/* Outer circle: 64px diameter, light gray/white #E8E8E8    */}
                {/* Six SPOKES inside (thin lines center to edge)            */}
                {/* CENTER HOLE (8px diameter, dark)                         */}
                {/* TAPE RING around reel: dark brown/black #2A1F14           */}
                {/* Left shrinks (16->4px), right grows (4->16px)            */}
                {/* Reels rotate continuously @keyframes spin 3s duration    */}
                {/* ======================================================== */}
                <div
                  className="relative my-1 flex items-center justify-around overflow-hidden rounded-[8px] px-3 shadow-[inset_0_4px_12px_rgba(0,0,0,0.85)]"
                  style={{ backgroundColor: "#0A1628" }}
                >
                  {/* Horizontal connecting tape ribbon */}
                  <div className="absolute top-1/2 left-0 right-0 h-2 -translate-y-1/2 bg-[#2A1F14] opacity-85 pointer-events-none" />

                  {/* Center Tape Gauge: 100 | 50 | 0 */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 flex flex-col items-center pointer-events-none">
                    <div className="flex items-center gap-2 font-mono text-[8px] text-amber-200/60 font-bold tracking-widest">
                      <span>100</span>
                      <span>50</span>
                      <span>0</span>
                    </div>
                    <div className="mt-0.5 flex w-12 items-center justify-between px-1">
                      <div className="h-2 w-[1px] bg-amber-200/50" />
                      <div className="h-1.5 w-[1px] bg-amber-200/35" />
                      <div className="h-2 w-[1px] bg-amber-200/50" />
                      <div className="h-1.5 w-[1px] bg-amber-200/35" />
                      <div className="h-2 w-[1px] bg-amber-200/50" />
                    </div>
                  </div>

                  {/* LEFT REEL: 64px diameter SVG circle, 6 spokes, 8px center hole, dark tape ring */}
                  <div className="relative z-0 flex items-center justify-center">
                    <svg
                      viewBox="-55 -55 110 110"
                      className="size-16 sm:size-20 overflow-visible"
                      aria-hidden="true"
                    >
                      {/* Tape Ring around left reel (thick ring dark brown/black #2A1F14, starts 16px, shrinks to 4px) */}
                      <circle
                        cx="0"
                        cy="0"
                        r={32 + leftTapeThickness}
                        fill="#2A1F14"
                        stroke="#1F160E"
                        strokeWidth="1"
                      />
                      <circle
                        cx="0"
                        cy="0"
                        r={32 + leftTapeThickness * 0.75}
                        fill="none"
                        stroke="#3D2E20"
                        strokeWidth="0.75"
                        opacity="0.5"
                      />
                      <circle
                        cx="0"
                        cy="0"
                        r={32 + leftTapeThickness * 0.4}
                        fill="none"
                        stroke="#1F160E"
                        strokeWidth="0.75"
                        opacity="0.5"
                      />

                      {/* Rotating Reel Hub: 64px diameter (r = 32px), 6 spokes, 8px hole */}
                      <g
                        style={{
                          transformOrigin: "0px 0px",
                          animation:
                            isPlaying && !prefersReduced
                              ? `cassette-spin ${spinDuration}s linear infinite`
                              : "none",
                        }}
                      >
                        {/* Outer circle (the reel body): 64px diameter, light gray/white #E8E8E8 */}
                        <circle
                          cx="0"
                          cy="0"
                          r="32"
                          fill="#E8E8E8"
                          stroke="#D1D5DB"
                          strokeWidth="1.5"
                        />

                        {/* Hub recess */}
                        <circle
                          cx="0"
                          cy="0"
                          r="25"
                          fill="#F3F4F6"
                          stroke="#E5E7EB"
                          strokeWidth="1"
                        />

                        {/* Six SPOKES inside (thin lines from center to edge, 60 degrees apart) */}
                        {[0, 60, 120, 180, 240, 300].map((deg) => {
                          const rad = (deg * Math.PI) / 180;
                          return (
                            <line
                              key={deg}
                              x1={Math.cos(rad) * 4}
                              y1={Math.sin(rad) * 4}
                              x2={Math.cos(rad) * 31}
                              y2={Math.sin(rad) * 31}
                              stroke="#9CA3AF"
                              strokeWidth="1.5"
                              strokeLinecap="round"
                            />
                          );
                        })}

                        {/* Center Hole: 8px diameter (radius 4px), dark #0A1628 */}
                        <circle
                          cx="0"
                          cy="0"
                          r="4"
                          fill="#0A1628"
                          stroke="#374151"
                          strokeWidth="1"
                        />

                        {/* Spindle drive teeth */}
                        {[0, 120, 240].map((deg) => {
                          const rad = (deg * Math.PI) / 180;
                          return (
                            <circle
                              key={deg}
                              cx={Math.cos(rad) * 5.5}
                              cy={Math.sin(rad) * 5.5}
                              r="1.2"
                              fill="#E8E8E8"
                            />
                          );
                        })}
                      </g>
                    </svg>
                  </div>

                  {/* RIGHT REEL: 64px diameter SVG circle, 6 spokes, 8px center hole, dark tape ring */}
                  <div className="relative z-0 flex items-center justify-center">
                    <svg
                      viewBox="-55 -55 110 110"
                      className="size-16 sm:size-20 overflow-visible"
                      aria-hidden="true"
                    >
                      {/* Tape Ring around right reel (thick ring dark brown/black #2A1F14, starts 4px, grows to 16px) */}
                      <circle
                        cx="0"
                        cy="0"
                        r={32 + rightTapeThickness}
                        fill="#2A1F14"
                        stroke="#1F160E"
                        strokeWidth="1"
                      />
                      <circle
                        cx="0"
                        cy="0"
                        r={32 + rightTapeThickness * 0.75}
                        fill="none"
                        stroke="#3D2E20"
                        strokeWidth="0.75"
                        opacity="0.5"
                      />
                      <circle
                        cx="0"
                        cy="0"
                        r={32 + rightTapeThickness * 0.4}
                        fill="none"
                        stroke="#1F160E"
                        strokeWidth="0.75"
                        opacity="0.5"
                      />

                      {/* Rotating Reel Hub: 64px diameter (r = 32px), 6 spokes, 8px hole */}
                      <g
                        style={{
                          transformOrigin: "0px 0px",
                          animation:
                            isPlaying && !prefersReduced
                              ? `cassette-spin ${spinDuration}s linear infinite`
                              : "none",
                        }}
                      >
                        {/* Outer circle (the reel body): 64px diameter, light gray/white #E8E8E8 */}
                        <circle
                          cx="0"
                          cy="0"
                          r="32"
                          fill="#E8E8E8"
                          stroke="#D1D5DB"
                          strokeWidth="1.5"
                        />

                        {/* Hub recess */}
                        <circle
                          cx="0"
                          cy="0"
                          r="25"
                          fill="#F3F4F6"
                          stroke="#E5E7EB"
                          strokeWidth="1"
                        />

                        {/* Six SPOKES inside (thin lines from center to edge, 60 degrees apart) */}
                        {[0, 60, 120, 180, 240, 300].map((deg) => {
                          const rad = (deg * Math.PI) / 180;
                          return (
                            <line
                              key={deg}
                              x1={Math.cos(rad) * 4}
                              y1={Math.sin(rad) * 4}
                              x2={Math.cos(rad) * 31}
                              y2={Math.sin(rad) * 31}
                              stroke="#9CA3AF"
                              strokeWidth="1.5"
                              strokeLinecap="round"
                            />
                          );
                        })}

                        {/* Center Hole: 8px diameter (radius 4px), dark #0A1628 */}
                        <circle
                          cx="0"
                          cy="0"
                          r="4"
                          fill="#0A1628"
                          stroke="#374151"
                          strokeWidth="1"
                        />

                        {/* Spindle drive teeth */}
                        {[0, 120, 240].map((deg) => {
                          const rad = (deg * Math.PI) / 180;
                          return (
                            <circle
                              key={deg}
                              cx={Math.cos(rad) * 5.5}
                              cy={Math.sin(rad) * 5.5}
                              r="1.2"
                              fill="#E8E8E8"
                            />
                          );
                        })}
                      </g>
                    </svg>
                  </div>
                </div>

                {/* ======================================================== */}
                {/* STEP 2-D & 2-E: CONTROLS (BOTTOM 28%)                    */}
                {/* Magnetic tape progress bar at top                        */}
                {/* Row of 6 buttons built INTO cassette body                */}
                {/* ======================================================== */}
                <div className="relative flex flex-col justify-between py-0.5">
                  {/* STEP 2-D: MAGNETIC TAPE PROGRESS BAR */}
                  {/* THIN line, 4px height, full width minus 24px padding     */}
                  {/* Background light gray #D1D5DB, filled indigo #5A67D8     */}
                  {/* 10px circular draggable knob                             */}
                  <div
                    ref={progressLineRef}
                    onPointerDown={handlePointerDown}
                    onPointerMove={handlePointerMove}
                    onPointerUp={handlePointerUp}
                    onPointerCancel={handlePointerUp}
                    role="slider"
                    aria-label="Seek magnetic tape"
                    aria-valuemin={0}
                    aria-valuemax={Math.round(duration || 100)}
                    aria-valuenow={Math.round(currentTime)}
                    className="relative mx-3 h-[4px] cursor-pointer rounded-full bg-[#D1D5DB] transition-all"
                  >
                    {/* Filled portion: indigo #5A67D8 */}
                    <div
                      className="h-full rounded-full bg-[#5A67D8]"
                      style={{ width: `${progressPercent}%` }}
                    />

                    {/* Small knob: 10px circle */}
                    <div
                      className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 size-[10px] rounded-full bg-[#5A67D8] border border-white shadow-sm transition-transform hover:scale-125"
                      style={{ left: `${progressPercent}%` }}
                    />
                  </div>

                  {/* STEP 2-E: ROW OF 6 BUTTONS BUILT INTO CASSETTE BODY */}
                  {/* Rewind, Play/Pause, Stop, Forward, Speed, Volume          */}
                  {/* Each button: 44x44px rounded rect, cream bg, navy icon    */}
                  {/* Press effect: scale(0.95) + inset shadow                  */}
                  {/* Play button LARGER (56x56px), indigo #5A67D8 bg + pulse   */}
                  {/* Spaced evenly with 8px gap                                */}
                  <div className="flex items-center justify-between gap-1.5 sm:gap-2 px-3 pt-0.5">
                    {/* 1. Rewind (-10s) */}
                    <button
                      type="button"
                      onClick={() => seekDelta(-10)}
                      aria-label="Rewind 10 seconds"
                      title="Rewind 10s (Left Arrow)"
                      className="flex size-[34px] sm:size-[44px] items-center justify-center rounded-lg border border-[#1A365D]/20 bg-[#F5EFE6] text-[#1A365D] shadow-[0_2px_4px_rgba(0,0,0,0.06),inset_0_-2px_0_rgba(0,0,0,0.08)] transition-all active:scale-95 active:shadow-[inset_0_2px_4px_rgba(0,0,0,0.25)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5A67D8]"
                    >
                      <RotateCcw className="size-3.5 sm:size-4" />
                    </button>

                    {/* 2. Play / Pause (LARGER 56x56px, active indigo #5A67D8 with white icon, pulse) */}
                    <button
                      type="button"
                      onClick={togglePlay}
                      aria-label={isPlaying ? "Pause audio" : "Play audio"}
                      title="Play / Pause (Space)"
                      style={{
                        animation:
                          isPlaying && !prefersReduced ? "cassette-play-pulse 2s infinite" : "none",
                      }}
                      className={`flex size-[44px] sm:size-[56px] items-center justify-center rounded-xl border transition-all active:scale-95 active:shadow-[inset_0_2px_4px_rgba(0,0,0,0.25)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5A67D8] ${
                        isPlaying
                          ? "border-[#5A67D8] bg-[#5A67D8] text-white"
                          : "border-[#1A365D]/25 bg-[#F5EFE6] text-[#1A365D] shadow-[0_2px_6px_rgba(0,0,0,0.08),inset_0_-2px_0_rgba(0,0,0,0.1)]"
                      }`}
                    >
                      {isPlaying ? (
                        <Pause className="size-5 sm:size-6 fill-current" />
                      ) : (
                        <Play className="size-5 sm:size-6 fill-current ml-0.5" />
                      )}
                    </button>

                    {/* 3. Stop (Resets to 0:00) */}
                    <button
                      type="button"
                      onClick={stopPlayback}
                      aria-label="Stop audio"
                      title="Stop (Reset to 0:00)"
                      className="flex size-[34px] sm:size-[44px] items-center justify-center rounded-lg border border-[#1A365D]/20 bg-[#F5EFE6] text-[#1A365D] shadow-[0_2px_4px_rgba(0,0,0,0.06),inset_0_-2px_0_rgba(0,0,0,0.08)] transition-all active:scale-95 active:shadow-[inset_0_2px_4px_rgba(0,0,0,0.25)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5A67D8]"
                    >
                      <Square className="size-3.5 sm:size-4 fill-current" />
                    </button>

                    {/* 4. Forward (+10s) */}
                    <button
                      type="button"
                      onClick={() => seekDelta(10)}
                      aria-label="Fast forward 10 seconds"
                      title="Forward 10s (Right Arrow)"
                      className="flex size-[34px] sm:size-[44px] items-center justify-center rounded-lg border border-[#1A365D]/20 bg-[#F5EFE6] text-[#1A365D] shadow-[0_2px_4px_rgba(0,0,0,0.06),inset_0_-2px_0_rgba(0,0,0,0.08)] transition-all active:scale-95 active:shadow-[inset_0_2px_4px_rgba(0,0,0,0.25)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5A67D8]"
                    >
                      <RotateCw className="size-3.5 sm:size-4" />
                    </button>

                    {/* 5. Speed (1x) */}
                    <button
                      type="button"
                      onClick={cycleSpeed}
                      aria-label="Playback speed"
                      title={`Speed: ${playbackRate}x (click to change)`}
                      className="flex size-[34px] sm:size-[44px] items-center justify-center rounded-lg border border-[#1A365D]/20 bg-[#F5EFE6] text-[#1A365D] shadow-[0_2px_4px_rgba(0,0,0,0.06),inset_0_-2px_0_rgba(0,0,0,0.08)] transition-all active:scale-95 active:shadow-[inset_0_2px_4px_rgba(0,0,0,0.25)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5A67D8]"
                    >
                      <span className="font-mono text-[10px] sm:text-[11px] font-bold">
                        {playbackRate}x
                      </span>
                    </button>

                    {/* 6. Volume */}
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => {
                          playMechanicalClick();
                          setVolumeSliderOpen((v) => !v);
                        }}
                        aria-label={isMuted ? "Unmute audio" : "Mute audio"}
                        title="Volume control"
                        className="flex size-[34px] sm:size-[44px] items-center justify-center rounded-lg border border-[#1A365D]/20 bg-[#F5EFE6] text-[#1A365D] shadow-[0_2px_4px_rgba(0,0,0,0.06),inset_0_-2px_0_rgba(0,0,0,0.08)] transition-all active:scale-95 active:shadow-[inset_0_2px_4px_rgba(0,0,0,0.25)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5A67D8]"
                      >
                        {isMuted || volume === 0 ? (
                          <VolumeX className="size-3.5 sm:size-4" />
                        ) : (
                          <Volume2 className="size-3.5 sm:size-4" />
                        )}
                      </button>

                      {/* Volume Slider Popover */}
                      <AnimatePresence>
                        {volumeSliderOpen ? (
                          <motion.div
                            initial={{ opacity: 0, y: 6, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 6, scale: 0.95 }}
                            className="absolute bottom-full right-0 mb-2 flex items-center gap-2 rounded-xl border border-[#1A365D]/25 bg-[#FAF6EE] p-2 shadow-xl z-30"
                          >
                            <button
                              type="button"
                              onClick={toggleMute}
                              className="text-[#1A365D] hover:opacity-75"
                            >
                              {isMuted ? (
                                <VolumeX className="size-3.5" />
                              ) : (
                                <Volume2 className="size-3.5" />
                              )}
                            </button>
                            <input
                              type="range"
                              min="0"
                              max="1"
                              step="0.05"
                              value={isMuted ? 0 : volume}
                              onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                              aria-label="Volume slider"
                              className="h-1.5 w-20 cursor-pointer accent-[#5A67D8]"
                            />
                          </motion.div>
                        ) : null}
                      </AnimatePresence>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
