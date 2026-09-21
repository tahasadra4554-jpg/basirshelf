"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  FastForward,
  Minus,
  Pause,
  Play,
  Rewind,
  Square,
  Volume2,
  VolumeX,
  X,
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

// Subtle mechanical latch click sound via Web Audio API
function playMechanicalClick() {
  try {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(680, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(120, ctx.currentTime + 0.035);

    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.035);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.04);
  } catch {
    // Ignore if blocked by browser autoplay policy
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
  const [isSpoolingFast, setIsSpoolingFast] = useState<"forward" | "rewind" | null>(null);

  const prefersReduced = useReducedMotion();

  // Load volume preference from localStorage
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

  // Pause audio if external video plays
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

  const stopPlayback = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    playMechanicalClick();
    audio.pause();
    audio.currentTime = 0;
    setCurrentTime(0);
    setIsPlaying(false);
  }, []);

  const seekDelta = useCallback(
    (deltaSeconds: number) => {
      const audio = audioRef.current;
      if (!audio) return;
      playMechanicalClick();

      const isRewinding = deltaSeconds < 0;
      setIsSpoolingFast(isRewinding ? "rewind" : "forward");
      setTimeout(() => setIsSpoolingFast(null), 400);

      const target = Math.max(0, Math.min(duration || 100, audio.currentTime + deltaSeconds));
      audio.currentTime = target;
      setCurrentTime(target);
    },
    [duration],
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
    playMechanicalClick();
    if (!audioRef.current) return;
    const next = !isMuted;
    setIsMuted(next);
    audioRef.current.muted = next;
  };

  const changeSpeed = (rate: number) => {
    playMechanicalClick();
    setPlaybackRate(rate);
    if (audioRef.current) {
      audioRef.current.playbackRate = rate;
    }
    setSpeedMenuOpen(false);
  };

  // Tape calculation (shrink left reel from r=31 to r=17, grow right reel from r=17 to r=31)
  const progressRatio = duration > 0 ? Math.min(1, Math.max(0, currentTime / duration)) : 0;
  const leftTapeRadius = 31 - progressRatio * 14;
  const rightTapeRadius = 17 + progressRatio * 14;

  // Rotation duration in seconds (faster with higher rate, 3x faster when seeking)
  const rotationDuration = isSpoolingFast
    ? "0.7s"
    : `${Math.max(0.8, 3 / playbackRate)}s`;

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

      {/* Minimized Floating Cassette Badge */}
      <AnimatePresence>
        {isMinimized ? (
          <motion.button
            key="minimized-cassette"
            type="button"
            onClick={() => {
              playMechanicalClick();
              setIsMinimized(false);
            }}
            initial={{ scale: 0, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0, opacity: 0, y: 20 }}
            whileHover={{ scale: 1.06 }}
            whileTap={{ scale: 0.95 }}
            aria-label="Expand cassette audio player"
            className="fixed bottom-4 right-4 z-50 flex items-center gap-2.5 rounded-2xl border border-[#1A365D]/25 bg-[#F5EFE6] px-3.5 py-2 shadow-[0_12px_28px_rgba(26,54,93,0.3)] backdrop-blur transition-all"
          >
            {/* Mini spinning reel */}
            <div
              className={cn(
                "relative grid size-6 place-items-center rounded-full bg-[#1A365D] text-white",
                isPlaying && !prefersReduced && "animate-spin",
              )}
              style={{ animationDuration: "2s" }}
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

      {/* Full Retro Cassette Tape Body (Aspect ratio 1.6 / 1) */}
      <AnimatePresence>
        {!isMinimized ? (
          <motion.div
            key="retro-cassette-modal"
            role="region"
            aria-label="Retro cassette audio player"
            initial={
              prefersReduced
                ? { opacity: 0, y: 30 }
                : { y: 120, opacity: 0, rotate: -2, scale: 0.94 }
            }
            animate={
              prefersReduced
                ? { opacity: 1, y: 0 }
                : { y: 0, opacity: 1, rotate: 0, scale: 1 }
            }
            exit={
              prefersReduced
                ? { opacity: 0, y: 30 }
                : { y: 120, opacity: 0, rotate: 1, scale: 0.94 }
            }
            transition={{ type: "spring", stiffness: 260, damping: 22 }}
            className="fixed bottom-3 sm:bottom-5 left-1/2 -translate-x-1/2 z-50 w-[min(420px,calc(100vw-1.5rem))] select-none touch-none"
          >
            {/* Step 1: The Cassette Body (aspect-ratio 1.6 / 1, cream #F5EFE6, rounded 16px, soft shadow) */}
            <div
              className="relative flex flex-col justify-between overflow-hidden rounded-[16px] border border-[#1A365D]/20 p-2.5 sm:p-3 shadow-[0_20px_40px_rgba(26,54,93,0.22),0_4px_12px_rgba(0,0,0,0.08)]"
              style={{
                backgroundColor: "#F5EFE6",
                aspectRatio: "1.6 / 1",
              }}
            >
              {/* Step 2: The Label (Top section ~25% height) */}
              <div
                className="relative flex h-[25%] flex-col justify-between overflow-hidden rounded-lg px-2.5 py-1.5 shadow-sm"
                style={{ backgroundColor: "#1A365D", color: "#FDFBF7" }}
              >
                {/* Header Row: Title on Left, Time & Window Controls on Right */}
                <div className="flex items-start justify-between gap-2">
                  {/* Left Side: "Interchange 1 — Unit X" in serif font, and Institute below */}
                  <div className="min-w-0 flex-1">
                    <p className="font-serif text-xs sm:text-sm font-bold tracking-tight text-[#FDFBF7] truncate">
                      {track.bookTitle ? `${track.bookTitle} — ` : ""}
                      {track.title}
                    </p>
                    <p className="text-[9px] sm:text-[10px] text-slate-300 font-medium">
                      Basir Language Institute
                    </p>
                  </div>

                  {/* Right Side: Monospace Time "00:00 / 00:12" and Controls */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="font-mono text-[10px] sm:text-[11px] font-bold text-amber-300">
                      {formatTime(currentTime)} / {formatTime(duration)}
                    </span>

                    {/* Minimize button */}
                    <button
                      type="button"
                      onClick={() => {
                        playMechanicalClick();
                        setIsMinimized(true);
                      }}
                      aria-label="Minimize cassette player"
                      className="grid size-5 place-items-center rounded text-white/70 hover:bg-white/10 hover:text-white transition-colors"
                    >
                      <Minus className="size-3" />
                    </button>

                    {/* Close button */}
                    <button
                      type="button"
                      onClick={() => {
                        playMechanicalClick();
                        onClose();
                      }}
                      aria-label="Close audio player"
                      className="grid size-5 place-items-center rounded text-white/70 hover:bg-red-500/20 hover:text-red-400 transition-colors"
                    >
                      <X className="size-3" />
                    </button>
                  </div>
                </div>

                {/* Subtle horizontal line separating the label from the reels */}
                <div className="h-[1px] w-full bg-white/15" />
              </div>

              {/* Step 3: The Reel Window (Middle section ~50% height) */}
              <div className="relative flex h-[48%] items-center justify-center overflow-hidden rounded-lg border border-black/40 bg-[#0B1120] px-3 shadow-[inset_0_3px_8px_rgba(0,0,0,0.8)]">
                {/* Horizontal tape ribbon across background */}
                <div
                  className="pointer-events-none absolute inset-x-8 top-1/2 -translate-y-1/2 h-3.5 bg-gradient-to-r from-[#2A170A] via-[#1E1007] to-[#2A170A] opacity-75"
                  aria-hidden="true"
                />

                {/* Central tape guide ruler marks: 100 50 0 */}
                <div
                  className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 flex flex-col items-center opacity-85"
                  aria-hidden="true"
                >
                  <div className="flex items-center gap-1.5 font-mono text-[7px] font-bold tracking-widest text-slate-400">
                    <span>100</span>
                    <span className="h-1 w-0.5 bg-slate-500" />
                    <span>50</span>
                    <span className="h-1 w-0.5 bg-slate-500" />
                    <span>0</span>
                  </div>
                  <div className="mt-0.5 h-1 w-12 rounded bg-black/60 border border-white/10 overflow-hidden">
                    <div
                      className="h-full bg-amber-400 transition-all"
                      style={{ width: `${progressRatio * 100}%` }}
                    />
                  </div>
                </div>

                {/* TWO REELS INSIDE: Left Reel & Right Reel (Both rotate continuously during playback!) */}
                <div className="flex w-full items-center justify-around">
                  {/* LEFT REEL (Supply Reel) */}
                  <div className="relative size-[64px] sm:size-[72px] shrink-0 grid place-items-center">
                    <svg viewBox="0 0 80 80" className="size-full">
                      {/* Dark Ring of Tape Around Reel (Starts thick, shrinks as audio plays) */}
                      <circle
                        cx="40"
                        cy="40"
                        r={Math.max(16, leftTapeRadius)}
                        fill="#2A170A"
                        stroke="#190E06"
                        strokeWidth="1"
                        className="transition-all duration-200"
                      />

                      {/* Rotating White Hub with 6 Spokes and Center Hole */}
                      <g
                        className={cn(isPlaying && !prefersReduced && "animate-spin")}
                        style={{
                          transformOrigin: "40px 40px",
                          animationDuration: rotationDuration,
                          animationPlayState: isPlaying ? "running" : "paused",
                        }}
                      >
                        {/* Circle Outline of Hub */}
                        <circle
                          cx="40"
                          cy="40"
                          r="16"
                          fill="#FAF8F5"
                          stroke="#94A3B8"
                          strokeWidth="1.5"
                        />

                        {/* 6 Spokes from Center to Edge */}
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
                              stroke="#475569"
                              strokeWidth="2.5"
                              strokeLinecap="round"
                            />
                          );
                        })}

                        {/* Center Hole */}
                        <circle cx="40" cy="40" r="5" fill="#0B1120" />
                      </g>
                    </svg>
                  </div>

                  {/* RIGHT REEL (Take-up Reel) */}
                  <div className="relative size-[64px] sm:size-[72px] shrink-0 grid place-items-center">
                    <svg viewBox="0 0 80 80" className="size-full">
                      {/* Dark Ring of Tape Around Reel (Starts thin, grows as audio plays) */}
                      <circle
                        cx="40"
                        cy="40"
                        r={Math.max(16, rightTapeRadius)}
                        fill="#2A170A"
                        stroke="#190E06"
                        strokeWidth="1"
                        className="transition-all duration-200"
                      />

                      {/* Rotating White Hub with 6 Spokes and Center Hole */}
                      <g
                        className={cn(isPlaying && !prefersReduced && "animate-spin")}
                        style={{
                          transformOrigin: "40px 40px",
                          animationDuration: rotationDuration,
                          animationPlayState: isPlaying ? "running" : "paused",
                        }}
                      >
                        {/* Circle Outline of Hub */}
                        <circle
                          cx="40"
                          cy="40"
                          r="16"
                          fill="#FAF8F5"
                          stroke="#94A3B8"
                          strokeWidth="1.5"
                        />

                        {/* 6 Spokes from Center to Edge */}
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
                              stroke="#475569"
                              strokeWidth="2.5"
                              strokeLinecap="round"
                            />
                          );
                        })}

                        {/* Center Hole */}
                        <circle cx="40" cy="40" r="5" fill="#0B1120" />
                      </g>
                    </svg>
                  </div>
                </div>
              </div>

              {/* Step 5: The Magnetic Tape Progress Line (3-4px line between window and buttons) */}
              <div className="relative flex items-center py-1">
                <input
                  type="range"
                  min={0}
                  max={duration || 100}
                  step={0.5}
                  value={currentTime}
                  onChange={handleSeekChange}
                  aria-label="Seek magnetic tape position"
                  aria-valuemin={0}
                  aria-valuemax={duration || 100}
                  aria-valuenow={currentTime}
                  className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-slate-300 accent-[#5A67D8] focus-visible:ring-2 focus-visible:ring-[#5A67D8] focus-visible:outline-none"
                  style={{
                    background: `linear-gradient(to right, #5A67D8 ${progressRatio * 100}%, #CBD5E1 ${progressRatio * 100}%)`,
                  }}
                />
              </div>

              {/* Step 4: The Buttons (Bottom section ~25% height, INSIDE the cassette body!) */}
              <div className="flex h-[20%] items-center justify-between gap-1 sm:gap-2">
                {/* 1. Rewind (-10s) */}
                <button
                  type="button"
                  onClick={() => seekDelta(-10)}
                  aria-label="Rewind 10 seconds"
                  title="Rewind 10s (Left Arrow)"
                  className="flex flex-1 items-center justify-center h-8 sm:h-9 rounded-lg border border-[#1A365D]/20 bg-[#FAF6EE] text-[#1A365D] shadow-[0_2px_4px_rgba(0,0,0,0.06),inset_0_-2px_0_rgba(0,0,0,0.1)] transition-all hover:bg-white active:scale-95 active:shadow-[inset_0_2px_4px_rgba(0,0,0,0.18)] focus-visible:ring-2 focus-visible:ring-[#5A67D8] focus-visible:outline-none"
                >
                  <Rewind className="size-3.5 sm:size-4 fill-current" />
                </button>

                {/* 2. Play / Pause Button (Bigger, glows/indigo when playing!) */}
                <button
                  type="button"
                  onClick={togglePlay}
                  aria-label={isPlaying ? "Pause audio" : "Play audio"}
                  title="Play / Pause (Space)"
                  className={cn(
                    "flex flex-[1.3] items-center justify-center h-8 sm:h-9 rounded-lg border transition-all active:scale-95 focus-visible:ring-2 focus-visible:ring-[#5A67D8] focus-visible:outline-none",
                    isPlaying
                      ? "border-[#5A67D8] bg-[#5A67D8] text-white shadow-[0_2px_10px_rgba(90,103,216,0.5),inset_0_-2px_0_rgba(0,0,0,0.2)]"
                      : "border-[#1A365D]/25 bg-[#FAF6EE] text-[#1A365D] shadow-[0_2px_4px_rgba(0,0,0,0.06),inset_0_-2px_0_rgba(0,0,0,0.1)] hover:bg-white",
                  )}
                >
                  {isPlaying ? (
                    <Pause className="size-4 fill-current" />
                  ) : (
                    <Play className="size-4 fill-current ml-0.5" />
                  )}
                </button>

                {/* 3. Stop (Resets to 0:00) */}
                <button
                  type="button"
                  onClick={stopPlayback}
                  aria-label="Stop audio"
                  title="Stop (Reset to 0:00)"
                  className="flex flex-1 items-center justify-center h-8 sm:h-9 rounded-lg border border-[#1A365D]/20 bg-[#FAF6EE] text-[#1A365D] shadow-[0_2px_4px_rgba(0,0,0,0.06),inset_0_-2px_0_rgba(0,0,0,0.1)] transition-all hover:bg-white active:scale-95 active:shadow-[inset_0_2px_4px_rgba(0,0,0,0.18)] focus-visible:ring-2 focus-visible:ring-[#5A67D8] focus-visible:outline-none"
                >
                  <Square className="size-3.5 sm:size-4 fill-current" />
                </button>

                {/* 4. Forward (+10s) */}
                <button
                  type="button"
                  onClick={() => seekDelta(10)}
                  aria-label="Fast forward 10 seconds"
                  title="Forward 10s (Right Arrow)"
                  className="flex flex-1 items-center justify-center h-8 sm:h-9 rounded-lg border border-[#1A365D]/20 bg-[#FAF6EE] text-[#1A365D] shadow-[0_2px_4px_rgba(0,0,0,0.06),inset_0_-2px_0_rgba(0,0,0,0.1)] transition-all hover:bg-white active:scale-95 active:shadow-[inset_0_2px_4px_rgba(0,0,0,0.18)] focus-visible:ring-2 focus-visible:ring-[#5A67D8] focus-visible:outline-none"
                >
                  <FastForward className="size-3.5 sm:size-4 fill-current" />
                </button>

                {/* 5. Speed (0.5x to 2x) */}
                <div className="relative flex-1 flex">
                  <button
                    type="button"
                    onClick={() => {
                      playMechanicalClick();
                      setSpeedMenuOpen(!speedMenuOpen);
                      setVolumeSliderOpen(false);
                    }}
                    aria-label="Playback speed"
                    title={`Speed: ${playbackRate}x`}
                    className="flex w-full items-center justify-center h-8 sm:h-9 rounded-lg border border-[#1A365D]/20 bg-[#FAF6EE] text-[#1A365D] shadow-[0_2px_4px_rgba(0,0,0,0.06),inset_0_-2px_0_rgba(0,0,0,0.1)] transition-all hover:bg-white active:scale-95 focus-visible:ring-2 focus-visible:ring-[#5A67D8] focus-visible:outline-none"
                  >
                    <span className="font-mono text-[10px] sm:text-[11px] font-bold text-[#1A365D]">
                      {playbackRate}x
                    </span>
                  </button>

                  <AnimatePresence>
                    {speedMenuOpen ? (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 8 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 8 }}
                        className="absolute bottom-11 right-0 z-50 flex flex-col gap-0.5 rounded-lg border border-[#1A365D]/20 bg-[#FAF6EE] p-1 shadow-lg"
                      >
                        {[0.5, 0.75, 1, 1.25, 1.5, 2].map((rate) => (
                          <button
                            key={rate}
                            type="button"
                            onClick={() => changeSpeed(rate)}
                            className={cn(
                              "rounded px-2 py-0.5 text-[11px] font-mono font-semibold transition-colors",
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

                {/* 6. Volume Control */}
                <div className="relative flex-1 flex">
                  <button
                    type="button"
                    onClick={() => {
                      playMechanicalClick();
                      setVolumeSliderOpen(!volumeSliderOpen);
                      setSpeedMenuOpen(false);
                    }}
                    aria-label="Volume settings"
                    className="flex w-full items-center justify-center h-8 sm:h-9 rounded-lg border border-[#1A365D]/20 bg-[#FAF6EE] text-[#1A365D] shadow-[0_2px_4px_rgba(0,0,0,0.06),inset_0_-2px_0_rgba(0,0,0,0.1)] transition-all hover:bg-white active:scale-95 focus-visible:ring-2 focus-visible:ring-[#5A67D8] focus-visible:outline-none"
                  >
                    {isMuted || volume === 0 ? (
                      <VolumeX className="size-3.5 sm:size-4 text-red-600" />
                    ) : (
                      <Volume2 className="size-3.5 sm:size-4 text-[#1A365D]" />
                    )}
                  </button>

                  <AnimatePresence>
                    {volumeSliderOpen ? (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 8 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 8 }}
                        className="absolute bottom-11 right-0 z-50 flex w-32 flex-col gap-1.5 rounded-lg border border-[#1A365D]/20 bg-[#FAF6EE] p-2.5 shadow-lg"
                      >
                        <div className="flex items-center justify-between text-[10px] font-semibold text-[#1A365D]">
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
                          className="rounded bg-[#1A365D]/10 py-0.5 text-center text-[9px] font-semibold text-[#1A365D] hover:bg-[#1A365D]/20 transition-colors"
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
