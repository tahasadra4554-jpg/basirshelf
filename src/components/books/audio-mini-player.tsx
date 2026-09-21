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

  // Reel tape ring extra radius percentage:
  // Left starts thick (24% extra) and shrinks to 6%
  // Right starts thin (6% extra) and grows to 24%
  const leftTapeExtra = 24 - 18 * progressRatio;
  const rightTapeExtra = 6 + 18 * progressRatio;

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
            className="fixed bottom-4 right-4 z-50 flex items-center gap-2.5 rounded-2xl border border-[#1A365D]/30 bg-[#F5EFE6] px-3.5 py-2 shadow-[0_12px_28px_rgba(26,54,93,0.3)] backdrop-blur transition-all cursor-pointer"
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

      {/* STEP 4 & 5: CASSETTE PLAYER (AUTHENTIC SVG BASE + INTERACTIVE OVERLAYS) */}
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
            className="fixed bottom-3 sm:bottom-4 left-1/2 -translate-x-1/2 z-50 w-[90vw] sm:w-[420px] select-none touch-none flex flex-col items-center gap-2"
          >
            {/* STEP 2: THE REAL PRE-MADE SVG CASSETTE TAPE CONTAINER */}
            <div className="relative w-full aspect-[626/405] drop-shadow-[0_20px_40px_rgba(0,0,0,0.38)]">
              {/* REAL CASSETTE SVG: provides plastic shell, label, window, screws, notches */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/cassette.svg"
                alt="Compact cassette tape"
                className="w-full h-full object-contain pointer-events-none select-none"
              />

              {/* STEP 3-F: WINDOW CONTROLS (Minimize & Close buttons) */}
              <div className="absolute top-[3%] right-[3%] z-30 flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => {
                    playMechanicalClick();
                    setIsMinimized(true);
                  }}
                  aria-label="Minimize cassette player"
                  title="Minimize"
                  className="grid size-5 place-items-center rounded-full bg-slate-800/10 text-[#1A365D] hover:bg-slate-800/20 hover:text-black transition-all cursor-pointer"
                >
                  <Minus className="size-3" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    playMechanicalClick();
                    onClose();
                  }}
                  aria-label="Close audio player"
                  title="Close"
                  className="grid size-5 place-items-center rounded-full bg-slate-800/10 text-[#1A365D] hover:bg-red-500 hover:text-white transition-all cursor-pointer"
                >
                  <X className="size-3" />
                </button>
              </div>

              {/* STEP 3-A: TEXT OVERLAY ON LABEL (top: 13.5%, left: 8.5%) */}
              <div
                className="absolute pointer-events-none flex items-start justify-between"
                style={{
                  top: "13.5%",
                  left: "8.5%",
                  width: "83%",
                }}
              >
                {/* Left: Book Title & Unit (cleanly aligned with vintage label lines), Institute */}
                <div className="flex flex-col min-w-0 pr-2">
                  <h3 className="font-serif text-[12px] sm:text-[14px] font-bold text-[#1A365D] leading-none tracking-tight">
                    {track.bookTitle || "Interchange 1"}
                  </h3>
                  <p className="font-sans text-[10px] sm:text-[11.5px] font-semibold text-[#1E293B] leading-tight mt-1">
                    {track.title}
                  </p>
                  <p className="font-sans text-[8px] sm:text-[9.5px] text-slate-500 font-medium leading-none mt-1">
                    Basir Language Institute
                  </p>
                </div>

                {/* Right: SIDE A badge + Monospace Time Display */}
                <div className="shrink-0 flex items-center gap-1.5 pt-0.5">
                  <span className="font-sans text-[8px] sm:text-[9px] font-bold tracking-wider text-[#1A365D] uppercase px-1 py-0.5 rounded border border-[#1A365D]/20 bg-white/70">
                    SIDE A
                  </span>
                  <div className="font-mono text-[9px] sm:text-[11px] font-bold text-[#1A365D] bg-white/85 px-1.5 py-0.5 rounded border border-[#1A365D]/15 shadow-xs">
                    {formatTime(currentTime)} / {formatTime(duration)}
                  </div>
                </div>
              </div>

              {/* STEP 3-B & 3-C: LEFT REEL OVERLAY (inside SVG window, rotates during playback) */}
              <div
                className="absolute -translate-x-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none"
                style={{
                  left: "30.1%",
                  top: "46.2%",
                  width: "15.6%",
                  aspectRatio: "1 / 1",
                }}
              >
                {/* Dark brown tape ring (left: thicker ring, shrinks as audio plays) */}
                <div
                  className="absolute rounded-full pointer-events-none shadow-sm"
                  style={{
                    backgroundColor: "#2A1F14",
                    width: `${100 + leftTapeExtra}%`,
                    height: `${100 + leftTapeExtra}%`,
                    border: "1px solid #1A130C",
                    transition: "width 0.2s linear, height 0.2s linear",
                  }}
                />

                {/* 6-Spoke Reel Hub SVG (rotates continuously during playback) */}
                <svg
                  viewBox="-40 -40 80 80"
                  className="relative z-10 w-full h-full drop-shadow-sm overflow-visible"
                  style={{
                    animation:
                      isPlaying && !prefersReduced
                        ? `cassette-spin ${spinDuration}s linear infinite`
                        : "none",
                  }}
                >
                  {/* Outer reel hub ring */}
                  <circle cx="0" cy="0" r="32" fill="#E8E8E8" stroke="#CBD5E1" strokeWidth="1.5" />
                  <circle cx="0" cy="0" r="26" fill="#F8FAFC" stroke="#E2E8F0" strokeWidth="1" />

                  {/* Six Spokes (lines from center to edge, 60 degrees apart) */}
                  {[0, 60, 120, 180, 240, 300].map((deg) => {
                    const rad = (deg * Math.PI) / 180;
                    return (
                      <line
                        key={deg}
                        x1={Math.cos(rad) * 6}
                        y1={Math.sin(rad) * 6}
                        x2={Math.cos(rad) * 31}
                        y2={Math.sin(rad) * 31}
                        stroke="#94A3B8"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                      />
                    );
                  })}

                  {/* Center hole: 8px diameter, dark */}
                  <circle cx="0" cy="0" r="6" fill="#0A1628" stroke="#334155" strokeWidth="1" />

                  {/* Drive spindle teeth */}
                  {[0, 120, 240].map((deg) => {
                    const rad = (deg * Math.PI) / 180;
                    return (
                      <circle
                        key={deg}
                        cx={Math.cos(rad) * 8}
                        cy={Math.sin(rad) * 8}
                        r="1.4"
                        fill="#E8E8E8"
                      />
                    );
                  })}
                </svg>
              </div>

              {/* STEP 3-B & 3-C: RIGHT REEL OVERLAY (inside SVG window, rotates during playback) */}
              <div
                className="absolute -translate-x-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none"
                style={{
                  left: "69.4%",
                  top: "46.2%",
                  width: "15.6%",
                  aspectRatio: "1 / 1",
                }}
              >
                {/* Dark brown tape ring (right: thinner ring, grows as audio plays) */}
                <div
                  className="absolute rounded-full pointer-events-none shadow-sm"
                  style={{
                    backgroundColor: "#2A1F14",
                    width: `${100 + rightTapeExtra}%`,
                    height: `${100 + rightTapeExtra}%`,
                    border: "1px solid #1A130C",
                    transition: "width 0.2s linear, height 0.2s linear",
                  }}
                />

                {/* 6-Spoke Reel Hub SVG (rotates continuously during playback) */}
                <svg
                  viewBox="-40 -40 80 80"
                  className="relative z-10 w-full h-full drop-shadow-sm overflow-visible"
                  style={{
                    animation:
                      isPlaying && !prefersReduced
                        ? `cassette-spin ${spinDuration}s linear infinite`
                        : "none",
                  }}
                >
                  {/* Outer reel hub ring */}
                  <circle cx="0" cy="0" r="32" fill="#E8E8E8" stroke="#CBD5E1" strokeWidth="1.5" />
                  <circle cx="0" cy="0" r="26" fill="#F8FAFC" stroke="#E2E8F0" strokeWidth="1" />

                  {/* Six Spokes (lines from center to edge, 60 degrees apart) */}
                  {[0, 60, 120, 180, 240, 300].map((deg) => {
                    const rad = (deg * Math.PI) / 180;
                    return (
                      <line
                        key={deg}
                        x1={Math.cos(rad) * 6}
                        y1={Math.sin(rad) * 6}
                        x2={Math.cos(rad) * 31}
                        y2={Math.sin(rad) * 31}
                        stroke="#94A3B8"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                      />
                    );
                  })}

                  {/* Center hole: 8px diameter, dark */}
                  <circle cx="0" cy="0" r="6" fill="#0A1628" stroke="#334155" strokeWidth="1" />

                  {/* Drive spindle teeth */}
                  {[0, 120, 240].map((deg) => {
                    const rad = (deg * Math.PI) / 180;
                    return (
                      <circle
                        key={deg}
                        cx={Math.cos(rad) * 8}
                        cy={Math.sin(rad) * 8}
                        r="1.4"
                        fill="#E8E8E8"
                      />
                    );
                  })}
                </svg>
              </div>

              {/* STEP 3-E: MAGNETIC TAPE PROGRESS BAR (thin 4px horizontal line below reels) */}
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
                className="absolute h-[4px] cursor-pointer rounded-full bg-[#CBD5E1] transition-all"
                style={{
                  top: "67%",
                  left: "8%",
                  width: "84%",
                }}
              >
                {/* Indigo fill */}
                <div
                  className="h-full rounded-full bg-[#5A67D8]"
                  style={{ width: `${progressPercent}%` }}
                />

                {/* Draggable Knob */}
                <div
                  className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 size-[10px] rounded-full bg-[#5A67D8] border-2 border-white shadow-md transition-transform hover:scale-125"
                  style={{ left: `${progressPercent}%` }}
                />
              </div>
            </div>

            {/* STEP 3-D: BUTTONS DECK (row of 6 buttons with solid cream backing tray) */}
            <div className="flex items-center justify-between gap-1.5 sm:gap-2 w-full px-2.5 py-1.5 rounded-2xl bg-[#F5EFE6]/95 border border-[#1A365D]/20 shadow-[0_8px_20px_rgba(26,54,93,0.18)]">
              {/* 1. Rewind (-10s) */}
              <button
                type="button"
                onClick={() => seekDelta(-10)}
                aria-label="Rewind 10 seconds"
                title="Rewind 10s (Left Arrow)"
                className="flex size-10 sm:size-12 items-center justify-center rounded-xl border border-[#1A365D]/20 bg-[#FAF6EE] text-[#1A365D] shadow-[0_2px_4px_rgba(0,0,0,0.06),inset_0_-2px_0_rgba(0,0,0,0.08)] transition-all active:scale-95 active:shadow-[inset_0_2px_4px_rgba(0,0,0,0.2)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5A67D8] cursor-pointer hover:bg-white"
              >
                <RotateCcw className="size-4 sm:size-5" />
              </button>

              {/* 2. Play / Pause (LARGER, active indigo #5A67D8 background with white icon) */}
              <button
                type="button"
                onClick={togglePlay}
                aria-label={isPlaying ? "Pause audio" : "Play audio"}
                title="Play / Pause (Space)"
                style={{
                  animation:
                    isPlaying && !prefersReduced ? "cassette-play-pulse 2s infinite" : "none",
                }}
                className={`flex size-12 sm:size-14 items-center justify-center rounded-2xl border transition-all active:scale-95 active:shadow-[inset_0_2px_4px_rgba(0,0,0,0.25)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5A67D8] cursor-pointer ${
                  isPlaying
                    ? "border-[#5A67D8] bg-[#5A67D8] text-white shadow-[0_4px_14px_rgba(90,103,216,0.45),inset_0_-2px_0_rgba(0,0,0,0.25)]"
                    : "border-[#1A365D]/25 bg-[#FAF6EE] text-[#1A365D] shadow-[0_3px_8px_rgba(0,0,0,0.12),inset_0_-2px_0_rgba(0,0,0,0.1)] hover:bg-white"
                }`}
              >
                {isPlaying ? (
                  <Pause className="size-6 sm:size-7 fill-current" />
                ) : (
                  <Play className="size-6 sm:size-7 fill-current ml-0.5" />
                )}
              </button>

              {/* 3. Stop (Resets to 0:00) */}
              <button
                type="button"
                onClick={stopPlayback}
                aria-label="Stop audio"
                title="Stop (Reset to 0:00)"
                className="flex size-10 sm:size-12 items-center justify-center rounded-xl border border-[#1A365D]/20 bg-[#FAF6EE] text-[#1A365D] shadow-[0_2px_4px_rgba(0,0,0,0.06),inset_0_-2px_0_rgba(0,0,0,0.08)] transition-all active:scale-95 active:shadow-[inset_0_2px_4px_rgba(0,0,0,0.2)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5A67D8] cursor-pointer hover:bg-white"
              >
                <Square className="size-4 sm:size-5 fill-current" />
              </button>

              {/* 4. Forward (+10s) */}
              <button
                type="button"
                onClick={() => seekDelta(10)}
                aria-label="Fast forward 10 seconds"
                title="Forward 10s (Right Arrow)"
                className="flex size-10 sm:size-12 items-center justify-center rounded-xl border border-[#1A365D]/20 bg-[#FAF6EE] text-[#1A365D] shadow-[0_2px_4px_rgba(0,0,0,0.06),inset_0_-2px_0_rgba(0,0,0,0.08)] transition-all active:scale-95 active:shadow-[inset_0_2px_4px_rgba(0,0,0,0.2)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5A67D8] cursor-pointer hover:bg-white"
              >
                <RotateCw className="size-4 sm:size-5" />
              </button>

              {/* 5. Speed (1x) */}
              <button
                type="button"
                onClick={cycleSpeed}
                aria-label="Playback speed"
                title={`Speed: ${playbackRate}x (click to change)`}
                className="flex size-10 sm:size-12 items-center justify-center rounded-xl border border-[#1A365D]/20 bg-[#FAF6EE] text-[#1A365D] shadow-[0_2px_4px_rgba(0,0,0,0.06),inset_0_-2px_0_rgba(0,0,0,0.08)] transition-all active:scale-95 active:shadow-[inset_0_2px_4px_rgba(0,0,0,0.2)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5A67D8] cursor-pointer hover:bg-white"
              >
                <span className="font-mono text-xs sm:text-sm font-bold">
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
                  className="flex size-10 sm:size-12 items-center justify-center rounded-xl border border-[#1A365D]/20 bg-[#FAF6EE] text-[#1A365D] shadow-[0_2px_4px_rgba(0,0,0,0.06),inset_0_-2px_0_rgba(0,0,0,0.08)] transition-all active:scale-95 active:shadow-[inset_0_2px_4px_rgba(0,0,0,0.2)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5A67D8] cursor-pointer hover:bg-white"
                >
                  {isMuted || volume === 0 ? (
                    <VolumeX className="size-4 sm:size-5" />
                  ) : (
                    <Volume2 className="size-4 sm:size-5" />
                  )}
                </button>

                {/* Volume Slider Popover */}
                <AnimatePresence>
                  {volumeSliderOpen ? (
                    <motion.div
                      initial={{ opacity: 0, y: 6, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 6, scale: 0.95 }}
                      className="absolute bottom-full right-0 mb-2 flex items-center gap-2 rounded-xl border border-[#1A365D]/25 bg-[#FAF6EE] p-2.5 shadow-xl z-40"
                    >
                      <button
                        type="button"
                        onClick={toggleMute}
                        className="text-[#1A365D] hover:opacity-75"
                      >
                        {isMuted ? (
                          <VolumeX className="size-4" />
                        ) : (
                          <Volume2 className="size-4" />
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
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
