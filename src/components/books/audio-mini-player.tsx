"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Rewind,
  FastForward,
  Play,
  Pause,
  Square,
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
  const playButtonRef = useRef<HTMLButtonElement | null>(null);
  const miniButtonRef = useRef<HTMLButtonElement | null>(null);

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
  const [mounted, setMounted] = useState(false);
  const [supportsBackdrop, setSupportsBackdrop] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [announcement, setAnnouncement] = useState("");
  const [rewindClicked, setRewindClicked] = useState(false);
  const [forwardClicked, setForwardClicked] = useState(false);

  // Mount and browser capabilities detection
  useEffect(() => {
    setMounted(true);
    if (typeof window !== "undefined") {
      const supported =
        (window.CSS &&
          (CSS.supports("backdrop-filter", "blur(1px)") ||
            CSS.supports("-webkit-backdrop-filter", "blur(1px)"))) ??
        true;
      setSupportsBackdrop(supported);
      setIsMobile(window.innerWidth < 640);

      const handleResize = () => setIsMobile(window.innerWidth < 640);
      window.addEventListener("resize", handleResize);
      return () => window.removeEventListener("resize", handleResize);
    }
  }, []);

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
    setAnnouncement("Audio player opened");

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

  // Focus management: focus play button when cassette appears
  useEffect(() => {
    if (!isMinimized && track) {
      const timer = setTimeout(() => {
        playButtonRef.current?.focus();
      }, 150);
      return () => clearTimeout(timer);
    } else if (isMinimized) {
      miniButtonRef.current?.focus();
    }
  }, [isMinimized, track]);

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

  // Seek +/- 10s with edge handling
  const seekDelta = useCallback(
    (deltaSeconds: number) => {
      const audio = audioRef.current;
      if (!audio) return;
      playMechanicalClick();

      let target: number;
      if (deltaSeconds < 0) {
        // Rewind: if current time < 10s, go to 0:00
        target = Math.max(0, audio.currentTime + deltaSeconds);
      } else {
        // Forward: if near end, go to end
        const total = duration || 100;
        target = Math.min(total, audio.currentTime + deltaSeconds);
      }

      audio.currentTime = target;
      setCurrentTime(target);
    },
    [duration],
  );

  const handleRewindClick = useCallback(() => {
    setRewindClicked(true);
    setTimeout(() => setRewindClicked(false), 250);
    seekDelta(-10);
  }, [seekDelta]);

  const handleForwardClick = useCallback(() => {
    setForwardClicked(true);
    setTimeout(() => setForwardClicked(false), 250);
    seekDelta(10);
  }, [seekDelta]);

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

  // Keyboard controls:
  // Space = Play/Pause
  // Left arrow = back 10s
  // Right arrow = forward 10s
  // Esc = Minimize (same as clicking outside)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!track) return;
      if (["input", "textarea"].includes((e.target as HTMLElement)?.tagName?.toLowerCase())) return;

      if (e.code === "Space") {
        e.preventDefault();
        togglePlay();
      } else if (e.code === "ArrowLeft") {
        e.preventDefault();
        handleRewindClick();
      } else if (e.code === "ArrowRight") {
        e.preventDefault();
        handleForwardClick();
      } else if (e.code === "Escape") {
        e.preventDefault();
        if (volumeSliderOpen) {
          setVolumeSliderOpen(false);
        } else {
          playMechanicalClick();
          setIsMinimized(true);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [track, togglePlay, handleRewindClick, handleForwardClick, volumeSliderOpen]);

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
  const leftTapeExtra = 24 - 18 * progressRatio;
  const rightTapeExtra = 6 + 18 * progressRatio;

  // Reel spin duration (3s at 1x speed, scaled by playback rate)
  const spinDuration = 3 / Math.max(0.25, playbackRate);

  // Portal content for the full-screen cinematic blur overlay
  const overlayPortal =
    mounted &&
    typeof document !== "undefined" &&
    createPortal(
      <AnimatePresence>
        {!isMinimized && track ? (
          <motion.div
            key="cassette-cinematic-blur-overlay"
            role="presentation"
            aria-hidden="true"
            onClick={() => {
              playMechanicalClick();
              setIsMinimized(true);
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: prefersReduced ? 0 : 0.3 }}
            className="fixed inset-0 z-40 cursor-pointer overflow-hidden transition-[backdrop-filter,background-color] duration-300"
            style={{
              backgroundColor: supportsBackdrop
                ? "rgba(10, 22, 40, 0.65)"
                : "rgba(10, 22, 40, 0.85)",
              backdropFilter: supportsBackdrop
                ? isMobile
                  ? "blur(8px) saturate(0.8)"
                  : "blur(12px) saturate(0.8)"
                : undefined,
              WebkitBackdropFilter: supportsBackdrop
                ? isMobile
                  ? "blur(8px) saturate(0.8)"
                  : "blur(12px) saturate(0.8)"
                : undefined,
              willChange: "backdrop-filter",
            }}
          >
            {/* Edge Vignette */}
            <div
              className="pointer-events-none absolute inset-0"
              style={{
                boxShadow: "inset 0 0 200px rgba(0, 0, 0, 0.4)",
              }}
            />
          </motion.div>
        ) : null}
      </AnimatePresence>,
      document.body,
    );

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

      {/* Screen reader live region */}
      <div className="sr-only" role="status" aria-live="polite">
        {announcement}
      </div>

      {/* Embedded CSS for authentic continuous spin, play pulse, and button press */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
          @keyframes cassette-spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          @keyframes cassette-play-pulse {
            0%, 100% { box-shadow: 0 0 0 0 rgba(26, 54, 93, 0.4), inset 0 -2px 0 rgba(0,0,0,0.25); }
            50% { box-shadow: 0 0 0 6px rgba(26, 54, 93, 0.15), inset 0 -2px 0 rgba(0,0,0,0.25); }
          }
        `,
        }}
      />

      {/* THE FULL-SCREEN BLUR OVERLAY PORTAL */}
      {overlayPortal}

      {/* Floating Minimized Badge */}
      <AnimatePresence>
        {isMinimized ? (
          <motion.button
            ref={miniButtonRef}
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
            title="Expand cassette player"
            className="fixed bottom-4 right-4 z-50 flex items-center gap-2.5 rounded-2xl border border-[#1A365D] bg-[#0F1B2D] px-3.5 py-2 shadow-[0_12px_28px_rgba(0,0,0,0.6)] backdrop-blur transition-all cursor-pointer"
          >
            <div
              className={`relative grid size-6 place-items-center rounded-full bg-[#1A365D] text-[#FDFBF7] transition-all ${
                isPlaying ? "ring-2 ring-[#3B82F6] ring-offset-1 animate-pulse" : ""
              }`}
              style={{
                animation:
                  isPlaying && !prefersReduced
                    ? `cassette-spin ${spinDuration}s linear infinite`
                    : "none",
              }}
            >
              <div className="size-1.5 rounded-full bg-[#3B82F6]" />
            </div>
            <div className="text-start">
              <p className="font-serif text-[11px] font-bold text-[#FDFBF7] line-clamp-1">
                {track.title}
              </p>
              <p className="font-mono text-[9px] text-[#FEF3C7]/90 font-bold">
                {isPlaying ? formatTime(currentTime) : "Paused"}
              </p>
            </div>
          </motion.button>
        ) : null}
      </AnimatePresence>

      {/* THE CASSETTE PLAYER (FIXED COLORS: NEVER CHANGE WITH SITE THEME) */}
      <AnimatePresence>
        {!isMinimized ? (
          <motion.div
            key="retro-cassette-modal"
            role="dialog"
            aria-label="Audio player"
            aria-modal="true"
            initial={{ y: 120, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 120, opacity: 0 }}
            transition={{
              type: "spring",
              stiffness: 260,
              damping: 20,
              duration: prefersReduced ? 0 : 0.4,
            }}
            className="fixed bottom-3 sm:bottom-4 left-1/2 -translate-x-1/2 z-50 w-[90vw] sm:w-[420px] select-none touch-none flex flex-col items-center gap-2"
          >
            {/* CASSETTE BODY: #F2EBDC (warm cream), Border: #1A365D (1px), Shadow: 0 20px 40px rgba(0,0,0,0.3), Radius: 12px */}
            <div
              className="relative w-full aspect-[626/405] p-1 overflow-hidden"
              style={{
                backgroundColor: "#F2EBDC",
                border: "1px solid #1A365D",
                borderRadius: "12px",
                boxShadow: "0 20px 40px rgba(0, 0, 0, 0.3)",
              }}
            >
              {/* CASSETTE WINDOW: background #0F1B2D (dark navy), rounded corners 8px */}
              <div
                className="absolute pointer-events-none"
                style={{
                  left: "20.8%",
                  top: "34.8%",
                  width: "58.4%",
                  height: "23.2%",
                  backgroundColor: "#0F1B2D",
                  borderRadius: "8px",
                  zIndex: 2,
                }}
              />

              {/* REAL CASSETTE SVG: provides plastic shell, label texture, screws, notches */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/cassette.svg"
                alt="Compact cassette tape"
                className="w-full h-full object-contain pointer-events-none select-none relative z-10"
              />

              {/* WINDOW CONTROLS: Close (X) & Minimize (—) */}
              <div className="absolute top-[3%] right-[3%] z-30 flex items-center gap-1">
                {/* Minimize Button */}
                <button
                  type="button"
                  onClick={() => {
                    playMechanicalClick();
                    setIsMinimized(true);
                  }}
                  aria-label="Minimize cassette player"
                  title="Minimize"
                  className="grid size-5 sm:size-6 place-items-center rounded-full bg-[#1A365D]/15 text-[#1A365D] hover:bg-[#1A365D]/30 transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#1A365D]"
                >
                  <Minus className="size-3" />
                </button>

                {/* Close Button: closes completely & stops audio */}
                <button
                  type="button"
                  onClick={() => {
                    playMechanicalClick();
                    stopPlayback();
                    onClose();
                  }}
                  aria-label="Close audio player"
                  title="Close"
                  className="grid size-5 sm:size-6 place-items-center rounded-full bg-[#1A365D]/15 text-[#1A365D] hover:bg-red-500 hover:text-white transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-red-500"
                >
                  <X className="size-3" />
                </button>
              </div>

              {/* LABEL (TOP SECTION): Background #1A365D (navy) */}
              <div
                className="absolute pointer-events-none flex items-center justify-between rounded-md px-2.5 py-1.5 shadow-sm z-20"
                style={{
                  top: "12%",
                  left: "8.5%",
                  width: "83%",
                  backgroundColor: "#1A365D",
                }}
              >
                {/* Left: Book Title "Interchange 1" in #FDFBF7 (serif), Subtitle in #FDFBF7, Institute in #FDFBF7 at 70% opacity */}
                <div className="flex flex-col min-w-0 pr-2">
                  <h3
                    className="font-serif text-[12px] sm:text-[14px] font-bold leading-none tracking-tight"
                    style={{ color: "#FDFBF7" }}
                  >
                    {track.bookTitle || "Interchange 1"}
                  </h3>
                  <p
                    className="font-sans text-[10px] sm:text-[11.5px] font-semibold leading-tight mt-1"
                    style={{ color: "#FDFBF7" }}
                  >
                    {track.title}
                  </p>
                  <p
                    className="font-sans text-[8px] sm:text-[9.5px] font-medium leading-none mt-1"
                    style={{ color: "rgba(253, 251, 247, 0.7)" }}
                  >
                    Basir Language Institute
                  </p>
                </div>

                {/* Right: "SIDE A" tag (cream #F2EBDC background, navy #1A365D text) + Time display in #FDFBF7 monospace */}
                <div className="shrink-0 flex items-center gap-1.5 pt-0.5">
                  <span
                    className="font-sans text-[8px] sm:text-[9px] font-bold tracking-wider uppercase px-1.5 py-0.5 rounded shadow-xs"
                    style={{
                      backgroundColor: "#F2EBDC",
                      color: "#1A365D",
                    }}
                  >
                    SIDE A
                  </span>
                  <div
                    className="font-mono text-[9px] sm:text-[11px] font-bold px-1.5 py-0.5 rounded shadow-xs"
                    style={{
                      backgroundColor: "#0A1628",
                      color: "#FDFBF7",
                    }}
                  >
                    {formatTime(currentTime)} / {formatTime(duration)}
                  </div>
                </div>
              </div>

              {/* LEFT REEL (rotates during playback): Body #E8E4DC, Spokes #1A365D, Hole #0A1628, Tape Ring #2A1F14 */}
              <div
                className="absolute -translate-x-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none z-20"
                style={{
                  left: "30.1%",
                  top: "46.2%",
                  width: "15.6%",
                  aspectRatio: "1 / 1",
                }}
              >
                {/* Dark brown tape ring around reel: #2A1F14 (thick on left, shrinks as audio plays) */}
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

                {/* 6-Spoke Reel Hub SVG */}
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
                  {/* Reel body: #E8E4DC */}
                  <circle cx="0" cy="0" r="32" fill="#E8E4DC" stroke="#D1CDC4" strokeWidth="1" />
                  <circle cx="0" cy="0" r="26" fill="#E8E4DC" stroke="#D1CDC4" strokeWidth="1" />

                  {/* Spokes: #1A365D (navy, thin lines) */}
                  {[0, 60, 120, 180, 240, 300].map((deg) => {
                    const rad = (deg * Math.PI) / 180;
                    return (
                      <line
                        key={deg}
                        x1={Math.cos(rad) * 6}
                        y1={Math.sin(rad) * 6}
                        x2={Math.cos(rad) * 31}
                        y2={Math.sin(rad) * 31}
                        stroke="#1A365D"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                      />
                    );
                  })}

                  {/* Center hole: #0A1628 (dark navy) */}
                  <circle cx="0" cy="0" r="6" fill="#0A1628" stroke="#1A365D" strokeWidth="1" />

                  {/* Drive spindle teeth */}
                  {[0, 120, 240].map((deg) => {
                    const rad = (deg * Math.PI) / 180;
                    return (
                      <circle
                        key={deg}
                        cx={Math.cos(rad) * 8}
                        cy={Math.sin(rad) * 8}
                        r="1.4"
                        fill="#E8E4DC"
                      />
                    );
                  })}
                </svg>
              </div>

              {/* RIGHT REEL (rotates during playback): Body #E8E4DC, Spokes #1A365D, Hole #0A1628, Tape Ring #2A1F14 */}
              <div
                className="absolute -translate-x-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none z-20"
                style={{
                  left: "69.4%",
                  top: "46.2%",
                  width: "15.6%",
                  aspectRatio: "1 / 1",
                }}
              >
                {/* Dark brown tape ring around reel: #2A1F14 (thin on right, grows as audio plays) */}
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

                {/* 6-Spoke Reel Hub SVG */}
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
                  {/* Reel body: #E8E4DC */}
                  <circle cx="0" cy="0" r="32" fill="#E8E4DC" stroke="#D1CDC4" strokeWidth="1" />
                  <circle cx="0" cy="0" r="26" fill="#E8E4DC" stroke="#D1CDC4" strokeWidth="1" />

                  {/* Spokes: #1A365D (navy, thin lines) */}
                  {[0, 60, 120, 180, 240, 300].map((deg) => {
                    const rad = (deg * Math.PI) / 180;
                    return (
                      <line
                        key={deg}
                        x1={Math.cos(rad) * 6}
                        y1={Math.sin(rad) * 6}
                        x2={Math.cos(rad) * 31}
                        y2={Math.sin(rad) * 31}
                        stroke="#1A365D"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                      />
                    );
                  })}

                  {/* Center hole: #0A1628 (dark navy) */}
                  <circle cx="0" cy="0" r="6" fill="#0A1628" stroke="#1A365D" strokeWidth="1" />

                  {/* Drive spindle teeth */}
                  {[0, 120, 240].map((deg) => {
                    const rad = (deg * Math.PI) / 180;
                    return (
                      <circle
                        key={deg}
                        cx={Math.cos(rad) * 8}
                        cy={Math.sin(rad) * 8}
                        r="1.4"
                        fill="#E8E4DC"
                      />
                    );
                  })}
                </svg>
              </div>

              {/* PROGRESS BAR (MAGNETIC TAPE): Track #D1D5DB (light gray), Fill #3B82F6 (blue), Knob #3B82F6 (blue circle) */}
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
                className="absolute h-[4px] cursor-pointer rounded-full transition-all z-20"
                style={{
                  top: "67%",
                  left: "8%",
                  width: "84%",
                  backgroundColor: "#D1D5DB",
                }}
              >
                {/* Blue fill: #3B82F6 */}
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${progressPercent}%`,
                    backgroundColor: "#3B82F6",
                  }}
                />

                {/* Draggable Knob: #3B82F6 (blue circle) */}
                <div
                  className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 size-[10px] rounded-full border-2 border-white shadow-[0_1px_4px_rgba(0,0,0,0.3)] transition-transform hover:scale-125"
                  style={{
                    left: `${progressPercent}%`,
                    backgroundColor: "#3B82F6",
                  }}
                />
              </div>
            </div>

            {/* BUTTONS (AT BOTTOM): Background #F2EBDC, Icons #1A365D, Border 1px solid rgba(26,54,93,0.15) */}
            <div
              className="flex items-center justify-between gap-1.5 sm:gap-2 w-full px-3 py-2 rounded-xl shadow-[0_6px_16px_rgba(0,0,0,0.15)]"
              style={{
                backgroundColor: "#F2EBDC",
                border: "1px solid rgba(26, 54, 93, 0.15)",
              }}
            >
              {/* 1. Skip Back 10s (Cream button, Navy icon) */}
              <button
                type="button"
                onClick={handleRewindClick}
                aria-label="Back 10s"
                title="Back 10s"
                className={`group relative flex size-10 sm:size-12 items-center justify-center rounded-lg shadow-[0_2px_4px_rgba(0,0,0,0.08)] transition-all active:scale-95 cursor-pointer hover:bg-white ${
                  rewindClicked ? "scale-90 opacity-70" : ""
                }`}
                style={{
                  backgroundColor: "#F2EBDC",
                  color: "#1A365D",
                  border: "1px solid rgba(26, 54, 93, 0.15)",
                }}
              >
                <Rewind className="size-5 fill-current" />
                <span
                  className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 rounded px-2 py-0.5 text-[10px] font-semibold opacity-0 shadow-md transition-opacity group-hover:opacity-100 whitespace-nowrap"
                  style={{
                    backgroundColor: "#0A1628",
                    color: "#FDFBF7",
                    border: "1px solid rgba(26, 54, 93, 0.3)",
                  }}
                >
                  Back 10s
                </span>
              </button>

              {/* 2. Play / Pause: Active is #1A365D (navy) background with cream icon; Inactive is cream with navy icon */}
              <button
                ref={playButtonRef}
                type="button"
                onClick={togglePlay}
                aria-label={isPlaying ? "Pause audio" : "Play audio"}
                title="Play / Pause (Space)"
                style={{
                  backgroundColor: isPlaying ? "#1A365D" : "#F2EBDC",
                  color: isPlaying ? "#F2EBDC" : "#1A365D",
                  border: isPlaying ? "1px solid #1A365D" : "1px solid rgba(26, 54, 93, 0.15)",
                  boxShadow: isPlaying
                    ? "0 4px 14px rgba(26, 54, 93, 0.35)"
                    : "0 2px 4px rgba(0, 0, 0, 0.08)",
                  animation:
                    isPlaying && !prefersReduced ? "cassette-play-pulse 2s infinite" : "none",
                }}
                className="flex size-12 sm:size-14 items-center justify-center rounded-xl transition-all active:scale-95 cursor-pointer hover:opacity-95"
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
                className="flex size-10 sm:size-12 items-center justify-center rounded-lg shadow-[0_2px_4px_rgba(0,0,0,0.08)] transition-all active:scale-95 cursor-pointer hover:bg-white"
                style={{
                  backgroundColor: "#F2EBDC",
                  color: "#1A365D",
                  border: "1px solid rgba(26, 54, 93, 0.15)",
                }}
              >
                <Square className="size-4 sm:size-5 fill-current" />
              </button>

              {/* 4. Skip Forward 10s (Cream button, Navy icon) */}
              <button
                type="button"
                onClick={handleForwardClick}
                aria-label="Forward 10s"
                title="Forward 10s"
                className={`group relative flex size-10 sm:size-12 items-center justify-center rounded-lg shadow-[0_2px_4px_rgba(0,0,0,0.08)] transition-all active:scale-95 cursor-pointer hover:bg-white ${
                  forwardClicked ? "scale-90 opacity-70" : ""
                }`}
                style={{
                  backgroundColor: "#F2EBDC",
                  color: "#1A365D",
                  border: "1px solid rgba(26, 54, 93, 0.15)",
                }}
              >
                <FastForward className="size-5 fill-current" />
                <span
                  className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 rounded px-2 py-0.5 text-[10px] font-semibold opacity-0 shadow-md transition-opacity group-hover:opacity-100 whitespace-nowrap"
                  style={{
                    backgroundColor: "#0A1628",
                    color: "#FDFBF7",
                    border: "1px solid rgba(26, 54, 93, 0.3)",
                  }}
                >
                  Forward 10s
                </span>
              </button>

              {/* 5. Speed (1x) */}
              <button
                type="button"
                onClick={cycleSpeed}
                aria-label="Playback speed"
                title={`Speed: ${playbackRate}x (click to change)`}
                className="flex size-10 sm:size-12 items-center justify-center rounded-lg shadow-[0_2px_4px_rgba(0,0,0,0.08)] transition-all active:scale-95 cursor-pointer hover:bg-white"
                style={{
                  backgroundColor: "#F2EBDC",
                  color: "#1A365D",
                  border: "1px solid rgba(26, 54, 93, 0.15)",
                }}
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
                  className="flex size-10 sm:size-12 items-center justify-center rounded-lg shadow-[0_2px_4px_rgba(0,0,0,0.08)] transition-all active:scale-95 cursor-pointer hover:bg-white"
                  style={{
                    backgroundColor: "#F2EBDC",
                    color: "#1A365D",
                    border: "1px solid rgba(26, 54, 93, 0.15)",
                  }}
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
                      className="absolute bottom-full right-0 mb-2 flex items-center gap-2 rounded-xl p-2.5 shadow-xl z-40"
                      style={{
                        backgroundColor: "#F2EBDC",
                        border: "1px solid rgba(26, 54, 93, 0.2)",
                      }}
                    >
                      <button
                        type="button"
                        onClick={toggleMute}
                        className="hover:opacity-75 transition-opacity"
                        style={{ color: "#1A365D" }}
                      >
                        {isMuted ? (
                          <VolumeX className="size-4 text-[#1A365D]" />
                        ) : (
                          <Volume2 className="size-4 text-[#1A365D]" />
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
                        className="h-1.5 w-20 cursor-pointer accent-[#3B82F6]"
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
