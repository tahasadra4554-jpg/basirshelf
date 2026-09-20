"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Headphones, Pause, Play, Volume2, VolumeX, X } from "lucide-react";

export interface AudioTrack {
  title: string;
  audioUrl: string;
  bookTitle?: string;
}

interface AudioMiniPlayerProps {
  track: AudioTrack | null;
  onClose: () => void;
}

function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
}

export function AudioMiniPlayer({ track, onClose }: AudioMiniPlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const prefersReduced = useReducedMotion();

  // Reset & autoplay when track changes
  useEffect(() => {
    if (!track) {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      return;
    }

    const audio = audioRef.current;
    if (audio) {
      audio.src = track.audioUrl;
      audio.currentTime = 0;
      setCurrentTime(0);
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            setIsPlaying(true);
            // Tell any active video player to pause
            window.dispatchEvent(new CustomEvent("basirshelf:pause-video"));
          })
          .catch(() => {
            setIsPlaying(false);
          });
      }
    }
  }, [track]);

  // Coordinate with external video playback (pause when video starts)
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

  // Time & status updates from the audio element
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

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      // Pause any active video before resuming audio
      window.dispatchEvent(new CustomEvent("basirshelf:pause-video"));
      audio.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = Number(e.target.value);
    setCurrentTime(time);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
    }
  };

  const toggleMute = () => {
    if (audioRef.current) {
      const next = !isMuted;
      audioRef.current.muted = next;
      setIsMuted(next);
    }
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <AnimatePresence>
      {track ? (
        <motion.div
          key="audio-mini-player"
          role="region"
          aria-label="Audio lesson player"
          initial={prefersReduced ? { opacity: 0 } : { y: 60, opacity: 0, scale: 0.96 }}
          animate={prefersReduced ? { opacity: 1 } : { y: 0, opacity: 1, scale: 1 }}
          exit={prefersReduced ? { opacity: 0 } : { y: 60, opacity: 0, scale: 0.96 }}
          transition={{ type: "spring", stiffness: 350, damping: 28 }}
          className="fixed inset-x-3 bottom-4 z-50 mx-auto max-w-lg sm:inset-x-6"
        >
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

          <div className="relative overflow-hidden rounded-2xl border border-white/20 bg-card/90 p-3.5 shadow-2xl backdrop-blur-xl dark:border-white/10 dark:bg-[#101828]/95 sm:p-4">
            {/* Top row: icon, track title, controls */}
            <div className="flex items-center gap-3">
              {/* Headphones badge */}
              <div
                className={`grid size-10 shrink-0 place-items-center rounded-xl bg-purple-500/10 text-purple-600 transition-transform dark:text-purple-400 ${
                  isPlaying && !prefersReduced ? "scale-105" : ""
                }`}
                aria-hidden="true"
              >
                <Headphones className="size-5" />
              </div>

              {/* Title info */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="eyebrow text-[10px] text-purple-600 dark:text-purple-400">
                    Audio Lesson
                  </span>
                  {track.bookTitle ? (
                    <>
                      <span className="text-[10px] text-muted-foreground">•</span>
                      <span className="truncate text-[10px] text-muted-foreground">
                        {track.bookTitle}
                      </span>
                    </>
                  ) : null}
                </div>
                <p className="truncate font-serif text-sm font-semibold text-navy dark:text-foreground">
                  {track.title}
                </p>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-1">
                {/* Mute button */}
                <button
                  type="button"
                  onClick={toggleMute}
                  aria-label={isMuted ? "Unmute audio" : "Mute audio"}
                  className="grid size-8 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                >
                  {isMuted ? (
                    <VolumeX className="size-4" aria-hidden="true" />
                  ) : (
                    <Volume2 className="size-4" aria-hidden="true" />
                  )}
                </button>

                {/* Play / Pause button */}
                <button
                  type="button"
                  onClick={togglePlay}
                  aria-label={isPlaying ? "Pause audio" : "Play audio"}
                  className="grid size-9 place-items-center rounded-full bg-navy text-navy-foreground shadow-soft transition-transform hover:scale-105 active:scale-95 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none dark:bg-indigo dark:text-white"
                >
                  {isPlaying ? (
                    <Pause className="size-4" aria-hidden="true" />
                  ) : (
                    <Play className="size-4 fill-current ml-0.5" aria-hidden="true" />
                  )}
                </button>

                {/* Close button */}
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Close audio player"
                  className="grid size-8 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                >
                  <X className="size-4" aria-hidden="true" />
                </button>
              </div>
            </div>

            {/* Bottom row: seek slider & timestamps */}
            <div className="mt-3 flex items-center gap-2.5">
              <span className="num-latin w-8 text-end text-[11px] font-medium text-muted-foreground">
                {formatTime(currentTime)}
              </span>

              <div className="relative flex-1">
                <input
                  type="range"
                  min={0}
                  max={duration || 100}
                  step={0.5}
                  value={currentTime}
                  onChange={handleSeek}
                  aria-label="Seek audio position"
                  className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-secondary accent-indigo focus-visible:ring-2 focus-visible:ring-indigo focus-visible:outline-none"
                  style={{
                    background: `linear-gradient(to right, #5A67D8 ${progressPercent}%, var(--color-secondary, #E2E8F0) ${progressPercent}%)`,
                  }}
                />
              </div>

              <span className="num-latin w-8 text-start text-[11px] font-medium text-muted-foreground">
                {formatTime(duration)}
              </span>
            </div>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
