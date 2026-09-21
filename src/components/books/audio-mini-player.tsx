"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  FastForward,
  Gauge,
  Headphones,
  Minus,
  Pause,
  Play,
  Rewind,
  RotateCcw,
  Square,
  Volume2,
  VolumeX,
  X,
  Sparkles,
} from "lucide-react";

import { cn } from "@/lib/utils";

export interface AudioTrack {
  title: string;
  audioUrl: string;
  bookTitle?: string;
  unitNumber?: string | number;
  sectionId?: string;
}

interface AudioMiniPlayerProps {
  track: AudioTrack | null;
  onClose: () => void;
}

function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return "00:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins < 10 ? "0" : ""}${mins}:${secs < 10 ? "0" : ""}${secs}`;
}

// Generate an authentic mechanical click sound using Web Audio API
function playMechanicalClick(soundEnabled = true) {
  if (!soundEnabled) return;
  try {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(720, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(140, ctx.currentTime + 0.035);

    gain.gain.setValueAtTime(0.09, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.035);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.04);
  } catch {
    // Ignore audio context failures if audio gesture policy blocks
  }
}

export function AudioMiniPlayer({ track, onClose }: AudioMiniPlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isMinimized, setIsMinimized] = useState(false);
  const [speedMenuOpen, setSpeedMenuOpen] = useState(false);
  const [volumeSliderOpen, setVolumeSliderOpen] = useState(false);
  const [soundFeedback, setSoundFeedback] = useState(true);
  const [isSpoolingFast, setIsSpoolingFast] = useState<"forward" | "rewind" | null>(null);

  const prefersReduced = useReducedMotion();

  // Load user audio preferences from localStorage
  useEffect(() => {
    try {
      const savedVol = localStorage.getItem("basirshelf:cassette:volume");
      if (savedVol !== null) {
        const v = parseFloat(savedVol);
        if (!isNaN(v) && v >= 0 && v <= 1) {
          setVolume(v);
          if (audioRef.current) audioRef.current.volume = v;
        }
      }
      const savedSound = localStorage.getItem("basirshelf:cassette:sound");
      if (savedSound !== null) {
        setSoundFeedback(savedSound === "true");
      }
    } catch {
      // Ignore
    }
  }, []);

  // Autoplay & reset when track changes
  useEffect(() => {
    if (!track) {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      setIsPlaying(false);
      return;
    }

    const audio = audioRef.current;
    if (audio) {
      audio.src = track.audioUrl;
      audio.playbackRate = playbackRate;
      audio.currentTime = 0;
      setCurrentTime(0);
      setIsMinimized(false);

      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            setIsPlaying(true);
            window.dispatchEvent(new CustomEvent("basirshelf:pause-video"));
          })
          .catch(() => {
            setIsPlaying(false);
          });
      }
    }
  }, [track]);

  // Coordinate with external video playback (pause audio if video starts)
  useEffect(() => {
    const handlePauseAudio = () => {
      if (audioRef.current && !audioRef.current.paused) {
        audioRef.current.pause();
        setIsPlaying(false);
      }
    };

    window.addEventListener("basirshelf:pause-audio", handlePauseAudio);
    return () => {
      window.removeEventListener("basirshelf:pause-audio", handlePauseAudio);
    };
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if user is typing in an input or textarea
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        return;
      }

      if (!track) return;

      if (e.code === "Space") {
        e.preventDefault();
        togglePlay();
      } else if (e.code === "ArrowLeft") {
        e.preventDefault();
        seekDelta(-5);
      } else if (e.code === "ArrowRight") {
        e.preventDefault();
        seekDelta(5);
      } else if (e.code === "ArrowUp") {
        e.preventDefault();
        changeVolume(Math.min(1, volume + 0.1));
      } else if (e.code === "ArrowDown") {
        e.preventDefault();
        changeVolume(Math.max(0, volume - 0.1));
      } else if (e.code === "Escape") {
        e.preventDefault();
        if (speedMenuOpen) setSpeedMenuOpen(false);
        else if (volumeSliderOpen) setVolumeSliderOpen(false);
        else onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [track, isPlaying, volume, speedMenuOpen, volumeSliderOpen]);

  // Audio event listeners
  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
  };

  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    playMechanicalClick(soundFeedback);

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
  }, [isPlaying, soundFeedback]);

  const stopPlayback = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    playMechanicalClick(soundFeedback);
    audio.pause();
    audio.currentTime = 0;
    setCurrentTime(0);
    setIsPlaying(false);
  }, [soundFeedback]);

  const seekDelta = useCallback(
    (deltaSeconds: number) => {
      const audio = audioRef.current;
      if (!audio) return;
      playMechanicalClick(soundFeedback);

      const isRewinding = deltaSeconds < 0;
      setIsSpoolingFast(isRewinding ? "rewind" : "forward");
      setTimeout(() => setIsSpoolingFast(null), 400);

      const target = Math.max(0, Math.min(duration || 100, audio.currentTime + deltaSeconds));
      audio.currentTime = target;
      setCurrentTime(target);
    },
    [duration, soundFeedback],
  );

  const handleSeekChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const target = Number(e.target.value);
    setCurrentTime(target);
    if (audioRef.current) {
      audioRef.current.currentTime = target;
    }
  };

  const changeVolume = (newVol: number) => {
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
    playMechanicalClick(soundFeedback);
    if (!audioRef.current) return;
    const next = !isMuted;
    setIsMuted(next);
    audioRef.current.muted = next;
  };

  const changeSpeed = (rate: number) => {
    playMechanicalClick(soundFeedback);
    setPlaybackRate(rate);
    if (audioRef.current) {
      audioRef.current.playbackRate = rate;
    }
    setSpeedMenuOpen(false);
  };

  // Tape calculation (shrink left reel from r=28 to r=14, grow right reel from r=14 to r=28)
  const progressRatio = duration > 0 ? Math.min(1, Math.max(0, currentTime / duration)) : 0;
  const leftTapeRadius = 28 - progressRatio * 14;
  const rightTapeRadius = 14 + progressRatio * 14;

  // Rotation duration in seconds (faster with higher rate, 3x faster when seeking)
  const baseRotationDuration = isSpoolingFast
    ? 0.7
    : isPlaying && !prefersReduced
      ? Math.max(0.8, 3 / playbackRate)
      : 0;

  // Parse title: "Unit 1 — Nice to meet you" -> "Unit 1", "Nice to meet you"
  const titleParts = track?.title ? track.title.split("—").map((p) => p.trim()) : ["", ""];
  const unitLabel = titleParts[0] || (track?.unitNumber ? `Unit ${track.unitNumber}` : "Side A");
  const unitSubtitle = titleParts[1] || track?.title || "Audio Lesson";

  if (!track) return null;

  return (
    <>
      {/* Hidden audio element */}
      <audio
        ref={audioRef}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
        onPlay={() => {
          setIsPlaying(true);
          window.dispatchEvent(new CustomEvent("basirshelf:pause-video"));
        }}
        onPause={() => setIsPlaying(false)}
      />

      {/* Minimized Floating Cassette Icon Badge */}
      <AnimatePresence>
        {isMinimized ? (
          <motion.button
            key="minimized-cassette"
            type="button"
            onClick={() => {
              playMechanicalClick(soundFeedback);
              setIsMinimized(false);
            }}
            initial={{ scale: 0, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0, opacity: 0, y: 20 }}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.95 }}
            aria-label="Expand cassette audio player"
            className="fixed bottom-5 right-5 z-50 flex items-center gap-2.5 rounded-full border border-[#1A365D]/30 bg-[#FAF6EE] px-4 py-2.5 shadow-[0_12px_28px_rgba(26,54,93,0.35)] backdrop-blur transition-all"
          >
            {/* Mini rotating reel */}
            <div
              className={cn(
                "relative grid size-7 place-items-center rounded-full bg-[#1A365D] text-white shadow-sm",
                isPlaying && !prefersReduced && "animate-spin",
              )}
              style={{ animationDuration: "2s" }}
            >
              <div className="size-2 rounded-full border border-white/60 bg-[#FAF6EE]" />
              <div className="absolute h-4 w-0.5 bg-white/40" />
              <div className="absolute h-0.5 w-4 bg-white/40" />
            </div>

            <div className="text-start">
              <p className="font-serif text-xs font-bold leading-tight text-[#1A365D] line-clamp-1">
                {unitLabel}
              </p>
              <p className="font-mono text-[10px] text-[#5A67D8] font-semibold">
                {isPlaying ? formatTime(currentTime) : "Paused"}
              </p>
            </div>
          </motion.button>
        ) : null}
      </AnimatePresence>

      {/* Full Retro Cassette Player Body */}
      <AnimatePresence>
        {!isMinimized ? (
          <motion.div
            key="retro-cassette-modal"
            role="region"
            aria-label="Retro cassette audio player"
            initial={
              prefersReduced
                ? { opacity: 0, y: 40 }
                : { y: 120, opacity: 0, rotate: -2, scale: 0.92 }
            }
            animate={
              prefersReduced
                ? { opacity: 1, y: 0 }
                : { y: 0, opacity: 1, rotate: 0, scale: 1 }
            }
            exit={
              prefersReduced
                ? { opacity: 0, y: 40 }
                : { y: 120, opacity: 0, rotate: 1, scale: 0.92 }
            }
            transition={{ type: "spring", stiffness: 260, damping: 22 }}
            className="fixed bottom-3 sm:bottom-5 left-1/2 -translate-x-1/2 z-50 w-[min(440px,calc(100vw-1.25rem))] select-none touch-none"
          >
            {/* The Classic Cassette Tape Outer Shell */}
            <div className="relative overflow-hidden rounded-[20px] border border-[#1A365D]/25 bg-gradient-to-b from-[#FAF6EE] via-[#F5EFE6] to-[#EBE2D1] p-3.5 sm:p-4 shadow-[0_20px_50px_rgba(26,54,93,0.32),0_4px_12px_rgba(0,0,0,0.1)]">
              {/* Corner Metallic Screws */}
              <div
                className="pointer-events-none absolute top-2.5 left-2.5 grid size-3 place-items-center rounded-full bg-slate-300 shadow-inner"
                aria-hidden="true"
              >
                <div className="h-2 w-0.5 bg-slate-500/80 rotate-45" />
              </div>
              <div
                className="pointer-events-none absolute top-2.5 right-2.5 grid size-3 place-items-center rounded-full bg-slate-300 shadow-inner"
                aria-hidden="true"
              >
                <div className="h-2 w-0.5 bg-slate-500/80 -rotate-45" />
              </div>
              <div
                className="pointer-events-none absolute bottom-2.5 left-2.5 grid size-3 place-items-center rounded-full bg-slate-300 shadow-inner"
                aria-hidden="true"
              >
                <div className="h-2 w-0.5 bg-slate-500/80 -rotate-12" />
              </div>
              <div
                className="pointer-events-none absolute bottom-2.5 right-2.5 grid size-3 place-items-center rounded-full bg-slate-300 shadow-inner"
                aria-hidden="true"
              >
                <div className="h-2 w-0.5 bg-slate-500/80 rotate-75" />
              </div>

              {/* Top Section: Window Actions & Cassette Brand Ribbon */}
              <div className="flex items-center justify-between pb-1 px-1">
                <div className="flex items-center gap-1.5">
                  <span className="inline-block size-2 rounded-full bg-red-500/80 animate-pulse" />
                  <span className="font-mono text-[9px] sm:text-[10px] tracking-wider text-[#1A365D]/75 font-bold uppercase">
                    Stereo Cassette · Type I Normal Bias
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  {/* Minimize button */}
                  <button
                    type="button"
                    onClick={() => {
                      playMechanicalClick(soundFeedback);
                      setIsMinimized(true);
                    }}
                    aria-label="Minimize cassette player"
                    className="grid size-6 place-items-center rounded-md text-[#1A365D]/60 hover:bg-[#1A365D]/10 hover:text-[#1A365D] transition-colors"
                  >
                    <Minus className="size-3.5" />
                  </button>

                  {/* Close button */}
                  <button
                    type="button"
                    onClick={() => {
                      playMechanicalClick(soundFeedback);
                      onClose();
                    }}
                    aria-label="Close audio player"
                    className="grid size-6 place-items-center rounded-md text-[#1A365D]/60 hover:bg-red-500/10 hover:text-red-600 transition-colors"
                  >
                    <X className="size-3.5" />
                  </button>
                </div>
              </div>

              {/* Vintage Cassette Label Sticker (Navy #1A365D) */}
              <div className="relative mt-1 rounded-xl border border-white/20 bg-[#1A365D] p-2.5 sm:p-3 text-[#FDFBF7] shadow-md">
                {/* Vintage Color Accent Stripes */}
                <div
                  className="pointer-events-none absolute inset-x-0 top-0 h-1 overflow-hidden rounded-t-xl flex"
                  aria-hidden="true"
                >
                  <div className="w-1/2 bg-amber-500" />
                  <div className="w-1/4 bg-[#5A67D8]" />
                  <div className="w-1/4 bg-red-500" />
                </div>

                <div className="flex items-start justify-between gap-2 pt-0.5">
                  <div className="min-w-0 flex-1">
                    <p className="font-serif text-sm sm:text-base font-bold tracking-tight text-[#FDFBF7] truncate">
                      {track.bookTitle || "Interchange"}
                    </p>
                    <p className="font-sans text-[11px] sm:text-xs font-semibold text-amber-300 truncate">
                      {unitLabel} — {unitSubtitle}
                    </p>
                  </div>

                  <div className="shrink-0 text-end">
                    <span className="inline-block rounded border border-white/30 bg-black/30 px-1.5 py-0.5 font-mono text-[9px] font-bold text-white uppercase tracking-wider">
                      Side A
                    </span>
                    <p className="mt-0.5 font-mono text-[10px] sm:text-[11px] font-semibold text-amber-300">
                      {formatTime(currentTime)} / {formatTime(duration)}
                    </p>
                  </div>
                </div>

                <div className="mt-1 flex items-center justify-between border-t border-white/10 pt-1 text-[9px] text-white/60">
                  <span>Basir Language Institute</span>
                  <span className="font-mono">120µs EQ</span>
                </div>
              </div>

              {/* Center Tape Deck Window with Transparent Viewport & Rotating Reels */}
              <div className="relative mt-2.5 rounded-xl border border-black/30 bg-gradient-to-b from-[#0F172A] to-[#020617] p-2.5 sm:p-3 shadow-[inset_0_4px_12px_rgba(0,0,0,0.8)]">
                {/* Horizontal Magnetic Tape Ribbon Line across background */}
                <div
                  className="pointer-events-none absolute inset-x-8 top-1/2 -translate-y-1/2 h-4 bg-gradient-to-r from-[#3B2516] via-[#2A180C] to-[#3B2516] opacity-75 rounded-sm"
                  aria-hidden="true"
                />

                {/* Central Tape Gauge & Level Indicator Marks */}
                <div
                  className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 flex flex-col items-center justify-center text-center opacity-80"
                  aria-hidden="true"
                >
                  <div className="flex items-center gap-2 font-mono text-[8px] font-bold tracking-widest text-slate-400">
                    <span>100</span>
                    <span className="h-1.5 w-0.5 bg-slate-500" />
                    <span>50</span>
                    <span className="h-1.5 w-0.5 bg-slate-500" />
                    <span>0</span>
                  </div>
                  <div className="mt-0.5 flex h-1.5 w-14 items-center justify-between px-0.5 bg-black/60 rounded border border-white/10">
                    <div
                      className="h-full bg-amber-400 rounded-sm transition-all"
                      style={{ width: `${progressRatio * 100}%` }}
                    />
                  </div>
                </div>

                {/* The Two Mechanical SVG Cassette Reels (Left = Supply, Right = Takeup) */}
                <div className="relative z-0 flex items-center justify-around py-1">
                  {/* Left Reel (Supply Reel) */}
                  <div className="relative size-[64px] sm:size-[72px] shrink-0 grid place-items-center">
                    <svg viewBox="0 0 80 80" className="size-full">
                      {/* Dark Brown Magnetic Tape Pack (Shrinks as audio plays) */}
                      <circle
                        cx="40"
                        cy="40"
                        r={Math.max(16, leftTapeRadius)}
                        fill="#3E2718"
                        stroke="#5A3922"
                        strokeWidth="1.5"
                        className="transition-all duration-300"
                      />

                      {/* Rotating 6-Spoke White Hub */}
                      <g
                        className={cn(
                          isPlaying && !prefersReduced && "origin-center animate-spin",
                        )}
                        style={{
                          transformOrigin: "40px 40px",
                          animationDuration: baseRotationDuration
                            ? `${baseRotationDuration}s`
                            : "3s",
                          animationPlayState: isPlaying ? "running" : "paused",
                          filter: isSpoolingFast ? "blur(0.5px)" : "none",
                        }}
                      >
                        {/* Outer White Hub Ring */}
                        <circle
                          cx="40"
                          cy="40"
                          r="16"
                          fill="#FAF8F5"
                          stroke="#CBD5E1"
                          strokeWidth="1.5"
                        />
                        {/* 6 Drive Teeth/Spokes */}
                        {Array.from({ length: 6 }).map((_, i) => {
                          const rad = (i * 60 * Math.PI) / 180;
                          const x2 = 40 + 13 * Math.cos(rad);
                          const y2 = 40 + 13 * Math.sin(rad);
                          return (
                            <line
                              key={i}
                              x1="40"
                              y1="40"
                              x2={x2}
                              y2={y2}
                              stroke="#64748B"
                              strokeWidth="2.5"
                              strokeLinecap="round"
                            />
                          );
                        })}
                        {/* Center Spindle Hole */}
                        <circle cx="40" cy="40" r="5" fill="#020617" />
                      </g>
                    </svg>
                  </div>

                  {/* Right Reel (Takeup Reel) */}
                  <div className="relative size-[64px] sm:size-[72px] shrink-0 grid place-items-center">
                    <svg viewBox="0 0 80 80" className="size-full">
                      {/* Dark Brown Magnetic Tape Pack (Grows as audio plays) */}
                      <circle
                        cx="40"
                        cy="40"
                        r={Math.max(16, rightTapeRadius)}
                        fill="#3E2718"
                        stroke="#5A3922"
                        strokeWidth="1.5"
                        className="transition-all duration-300"
                      />

                      {/* Rotating 6-Spoke White Hub */}
                      <g
                        className={cn(
                          isPlaying && !prefersReduced && "origin-center animate-spin",
                        )}
                        style={{
                          transformOrigin: "40px 40px",
                          animationDuration: baseRotationDuration
                            ? `${baseRotationDuration}s`
                            : "3s",
                          animationPlayState: isPlaying ? "running" : "paused",
                          filter: isSpoolingFast ? "blur(0.5px)" : "none",
                        }}
                      >
                        {/* Outer White Hub Ring */}
                        <circle
                          cx="40"
                          cy="40"
                          r="16"
                          fill="#FAF8F5"
                          stroke="#CBD5E1"
                          strokeWidth="1.5"
                        />
                        {/* 6 Drive Teeth/Spokes */}
                        {Array.from({ length: 6 }).map((_, i) => {
                          const rad = (i * 60 * Math.PI) / 180;
                          const x2 = 40 + 13 * Math.cos(rad);
                          const y2 = 40 + 13 * Math.sin(rad);
                          return (
                            <line
                              key={i}
                              x1="40"
                              y1="40"
                              x2={x2}
                              y2={y2}
                              stroke="#64748B"
                              strokeWidth="2.5"
                              strokeLinecap="round"
                            />
                          );
                        })}
                        {/* Center Spindle Hole */}
                        <circle cx="40" cy="40" r="5" fill="#020617" />
                      </g>
                    </svg>
                  </div>
                </div>
              </div>

              {/* Magnetic Tape Progress Slider */}
              <div className="mt-3 px-1">
                <div className="relative flex items-center">
                  <input
                    type="range"
                    min={0}
                    max={duration || 100}
                    step={0.5}
                    value={currentTime}
                    onChange={handleSeekChange}
                    aria-label="Seek audio tape position"
                    aria-valuemin={0}
                    aria-valuemax={duration || 100}
                    aria-valuenow={currentTime}
                    className="h-2 w-full cursor-pointer appearance-none rounded-full bg-slate-300/80 accent-[#5A67D8] focus-visible:ring-2 focus-visible:ring-[#5A67D8] focus-visible:outline-none"
                    style={{
                      background: `linear-gradient(to right, #5A67D8 ${progressRatio * 100}%, #CBD5E1 ${progressRatio * 100}%)`,
                    }}
                  />
                </div>
              </div>

              {/* Physical Tactile Tape Deck Control Buttons */}
              <div className="mt-3 flex items-center justify-between gap-1.5 sm:gap-2 pt-1">
                {/* Rewind -10s */}
                <button
                  type="button"
                  onClick={() => seekDelta(-10)}
                  aria-label="Rewind 10 seconds"
                  title="Rewind 10s (Left Arrow)"
                  className="grid size-9 sm:size-10 place-items-center rounded-xl border border-[#1A365D]/20 bg-white/90 text-[#1A365D] shadow-[0_2px_4px_rgba(0,0,0,0.06),inset_0_-2px_0_rgba(0,0,0,0.12)] transition-all hover:bg-white active:translate-y-0.5 active:shadow-[inset_0_2px_4px_rgba(0,0,0,0.2)] focus-visible:ring-2 focus-visible:ring-[#5A67D8] focus-visible:outline-none"
                >
                  <Rewind className="size-4 fill-current" />
                </button>

                {/* Main Play / Pause Button (Emphasized & Tactile) */}
                <motion.button
                  type="button"
                  onClick={togglePlay}
                  animate={
                    isPlaying && !prefersReduced
                      ? { scale: [1, 1.04, 1] }
                      : { scale: 1 }
                  }
                  transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                  aria-label={isPlaying ? "Pause audio" : "Play audio"}
                  title="Play / Pause (Space)"
                  className={cn(
                    "grid size-11 sm:size-12 place-items-center rounded-2xl border transition-all active:translate-y-0.5 focus-visible:ring-2 focus-visible:ring-[#5A67D8] focus-visible:outline-none",
                    isPlaying
                      ? "border-[#5A67D8] bg-[#5A67D8] text-white shadow-[0_4px_16px_rgba(90,103,216,0.5),inset_0_-2px_0_rgba(0,0,0,0.2)]"
                      : "border-[#1A365D]/30 bg-white text-[#1A365D] shadow-[0_4px_12px_rgba(26,54,93,0.15),inset_0_-3px_0_rgba(0,0,0,0.15)] hover:bg-[#FAF6EE]",
                  )}
                >
                  {isPlaying ? (
                    <Pause className="size-5 fill-current" />
                  ) : (
                    <Play className="size-5 fill-current ml-0.5" />
                  )}
                </motion.button>

                {/* Stop Button */}
                <button
                  type="button"
                  onClick={stopPlayback}
                  aria-label="Stop audio"
                  title="Stop and reset to 0:00"
                  className="grid size-9 sm:size-10 place-items-center rounded-xl border border-[#1A365D]/20 bg-white/90 text-[#1A365D] shadow-[0_2px_4px_rgba(0,0,0,0.06),inset_0_-2px_0_rgba(0,0,0,0.12)] transition-all hover:bg-white active:translate-y-0.5 active:shadow-[inset_0_2px_4px_rgba(0,0,0,0.2)] focus-visible:ring-2 focus-visible:ring-[#5A67D8] focus-visible:outline-none"
                >
                  <Square className="size-4 fill-current" />
                </button>

                {/* Fast-Forward +10s */}
                <button
                  type="button"
                  onClick={() => seekDelta(10)}
                  aria-label="Fast forward 10 seconds"
                  title="Forward 10s (Right Arrow)"
                  className="grid size-9 sm:size-10 place-items-center rounded-xl border border-[#1A365D]/20 bg-white/90 text-[#1A365D] shadow-[0_2px_4px_rgba(0,0,0,0.06),inset_0_-2px_0_rgba(0,0,0,0.12)] transition-all hover:bg-white active:translate-y-0.5 active:shadow-[inset_0_2px_4px_rgba(0,0,0,0.2)] focus-visible:ring-2 focus-visible:ring-[#5A67D8] focus-visible:outline-none"
                >
                  <FastForward className="size-4 fill-current" />
                </button>

                {/* Playback Speed Control Popover */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => {
                      playMechanicalClick(soundFeedback);
                      setSpeedMenuOpen(!speedMenuOpen);
                      setVolumeSliderOpen(false);
                    }}
                    aria-label="Adjust playback speed"
                    title={`Speed: ${playbackRate}x`}
                    className="grid size-9 sm:size-10 place-items-center rounded-xl border border-[#1A365D]/20 bg-white/90 text-[#1A365D] shadow-[0_2px_4px_rgba(0,0,0,0.06),inset_0_-2px_0_rgba(0,0,0,0.12)] transition-all hover:bg-white active:translate-y-0.5 focus-visible:ring-2 focus-visible:ring-[#5A67D8] focus-visible:outline-none"
                  >
                    <span className="font-mono text-[11px] font-bold text-[#1A365D]">
                      {playbackRate}x
                    </span>
                  </button>

                  <AnimatePresence>
                    {speedMenuOpen ? (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 10 }}
                        className="absolute bottom-12 right-0 z-50 flex flex-col gap-1 rounded-xl border border-[#1A365D]/20 bg-[#FAF6EE] p-1.5 shadow-xl"
                      >
                        {[0.5, 0.75, 1, 1.25, 1.5, 2].map((rate) => (
                          <button
                            key={rate}
                            type="button"
                            onClick={() => changeSpeed(rate)}
                            className={cn(
                              "rounded-lg px-2.5 py-1 text-xs font-mono font-semibold transition-colors",
                              playbackRate === rate
                                ? "bg-[#1A365D] text-white"
                                : "text-[#1A365D] hover:bg-[#1A365D]/10",
                            )}
                          >
                            {rate}x
                          </button>
                        ))}
                      </motion.div>
                    ) : null}
                  </AnimatePresence>
                </div>

                {/* Volume Button & Slider */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => {
                      playMechanicalClick(soundFeedback);
                      setVolumeSliderOpen(!volumeSliderOpen);
                      setSpeedMenuOpen(false);
                    }}
                    aria-label="Volume settings"
                    className="grid size-9 sm:size-10 place-items-center rounded-xl border border-[#1A365D]/20 bg-white/90 text-[#1A365D] shadow-[0_2px_4px_rgba(0,0,0,0.06),inset_0_-2px_0_rgba(0,0,0,0.12)] transition-all hover:bg-white active:translate-y-0.5 focus-visible:ring-2 focus-visible:ring-[#5A67D8] focus-visible:outline-none"
                  >
                    {isMuted || volume === 0 ? (
                      <VolumeX className="size-4 text-red-600" />
                    ) : (
                      <Volume2 className="size-4" />
                    )}
                  </button>

                  <AnimatePresence>
                    {volumeSliderOpen ? (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 10 }}
                        className="absolute bottom-12 right-0 z-50 flex w-36 flex-col gap-2 rounded-xl border border-[#1A365D]/20 bg-[#FAF6EE] p-3 shadow-xl"
                      >
                        <div className="flex items-center justify-between text-[11px] font-semibold text-[#1A365D]">
                          <span>Volume</span>
                          <span className="font-mono">{Math.round(isMuted ? 0 : volume * 100)}%</span>
                        </div>
                        <input
                          type="range"
                          min={0}
                          max={1}
                          step={0.05}
                          value={isMuted ? 0 : volume}
                          onChange={(e) => changeVolume(parseFloat(e.target.value))}
                          className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-slate-300 accent-[#5A67D8]"
                        />
                        <button
                          type="button"
                          onClick={toggleMute}
                          className="rounded-lg bg-[#1A365D]/10 py-1 text-center text-[10px] font-semibold text-[#1A365D] hover:bg-[#1A365D]/20 transition-colors"
                        >
                          {isMuted ? "Unmute" : "Mute"}
                        </button>
                      </motion.div>
                    ) : null}
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
