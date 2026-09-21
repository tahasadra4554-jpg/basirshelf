"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
} from "framer-motion";
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  FileText,
  Headphones,
  ImageIcon,
  Play,
  RotateCw,
  X,
} from "lucide-react";

import type { Section } from "@/lib/types";

import { cn } from "@/lib/utils";

// Mechanical 24-Teeth Gear Outline SVG Path (Computed for 340x340 viewBox, center 170,170)
const GEAR_SVG_PATH = (() => {
  const cx = 170;
  const cy = 170;
  const teeth = 24;
  const rOuter = 162; // Outer tip of tooth
  const rInner = 144; // Root trough between teeth
  const toothWidth = 0.45; // Fraction of step for tooth top
  const step = (2 * Math.PI) / teeth;

  let d = "";
  for (let i = 0; i < teeth; i++) {
    const angleStart = i * step;
    const a1 = angleStart;
    const a2 = angleStart + step * (1 - toothWidth) * 0.5;
    const a3 = angleStart + step * (1 + toothWidth) * 0.5;
    const a4 = (i + 1) * step;

    const x1 = cx + rInner * Math.cos(a1);
    const y1 = cy + rInner * Math.sin(a1);
    const x2 = cx + rOuter * Math.cos(a2);
    const y2 = cy + rOuter * Math.sin(a2);
    const x3 = cx + rOuter * Math.cos(a3);
    const y3 = cy + rOuter * Math.sin(a3);
    const x4 = cx + rInner * Math.cos(a4);
    const y4 = cy + rInner * Math.sin(a4);

    if (i === 0) {
      d += `M ${x1.toFixed(2)} ${y1.toFixed(2)} `;
    } else {
      d += `L ${x1.toFixed(2)} ${y1.toFixed(2)} `;
    }
    d += `L ${x2.toFixed(2)} ${y2.toFixed(2)} `;
    d += `L ${x3.toFixed(2)} ${y3.toFixed(2)} `;
    d += `L ${x4.toFixed(2)} ${y4.toFixed(2)} `;
  }
  d += "Z";
  return d;
})();

// Web Audio Mechanical Tick Sound Generator
function playMechanicalTick(isMajor = false) {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    // Crisp metallic click frequencies
    osc.frequency.setValueAtTime(isMajor ? 1200 : 800, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(120, ctx.currentTime + 0.025);

    gain.gain.setValueAtTime(isMajor ? 0.25 : 0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.025);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.026);
  } catch {
    // Ignore audio restriction errors
  }
}

interface GearDialModalProps {
  section: Section | null;
  bookTitle?: string;
  onClose: () => void;
  onSelectOption: (optionId: "video" | "audio" | "images" | "pdf", section: Section) => void;
}

export function GearDialModal({
  section,
  bookTitle,
  onClose,
  onSelectOption,
}: GearDialModalProps) {
  const id = useId();
  const prefersReduced = useReducedMotion();
  const dialRef = useRef<HTMLDivElement>(null);

  // Available media flags
  const rawImages = section?.images_url || section?.image_url;
  const hasImages = Boolean(rawImages && rawImages.trim().length > 0);
  const hasVideo = Boolean(section?.video_url && section.video_url.trim().length > 0);
  const hasAudio = Boolean(section?.audio_url && section.audio_url.trim().length > 0);
  const hasHandout = Boolean(section?.handout_url && section.handout_url.trim().length > 0);

  // 4 Cardinal Media Options positioned at 90° intervals:
  // 0°: Video (Top/12 o'clock)
  // 90°: Audio (Right/3 o'clock)
  // 180°: Images (Bottom/6 o'clock)
  // 270°: PDF (Left/9 o'clock)
  const options = [
    {
      id: "video" as const,
      label: "Video",
      subtitle: "Watch lesson video",
      icon: Play,
      baseAngle: 0,
      color: "#F59E0B",
      bgBadge: "bg-amber-500",
      glowColor: "rgba(245, 158, 11, 0.45)",
      available: hasVideo,
    },
    {
      id: "audio" as const,
      label: "Audio",
      subtitle: "Listen to audio lesson",
      icon: Headphones,
      baseAngle: 90,
      color: "#F59E0B",
      bgBadge: "bg-amber-500",
      glowColor: "rgba(245, 158, 11, 0.45)",
      available: hasAudio,
    },
    {
      id: "images" as const,
      label: "Images",
      subtitle: "Open image gallery",
      icon: ImageIcon,
      baseAngle: 180,
      color: "#F59E0B",
      bgBadge: "bg-amber-500",
      glowColor: "rgba(245, 158, 11, 0.45)",
      available: hasImages,
    },
    {
      id: "pdf" as const,
      label: "PDF",
      subtitle: "Read lesson handout",
      icon: FileText,
      baseAngle: 270,
      color: "#F59E0B",
      bgBadge: "bg-amber-500",
      glowColor: "rgba(245, 158, 11, 0.45)",
      available: hasHandout,
    },
  ];

  // Raw rotation motion value
  const rawRotation = useMotionValue(0);

  // Smooth spring physics for snappiness & mechanical weight
  const rotation = useSpring(rawRotation, {
    stiffness: 280,
    damping: 26,
    mass: 0.9,
  });

  // Track active index
  const [activeIndex, setActiveIndex] = useState(0);
  const lastDetentAngle = useRef(0);

  // Counter-rotation motion value so option icons remain upright
  const counterRotation = useMotionValue(0);

  // Update active index whenever rotation changes
  useEffect(() => {
    const unsubscribe = rotation.on("change", (latest) => {
      counterRotation.set(-latest);

      // Normalize angle to [0, 360)
      const normalized = (((-latest % 360) + 360) % 360);
      // Closest cardinal option (each sector is 90 degrees, offset by 45)
      const index = Math.round(normalized / 90) % 4;

      setActiveIndex((prev) => {
        if (prev !== index) {
          playMechanicalTick(true);
        }
        return index;
      });

      // Sound feedback every 10 degrees of turn
      if (Math.abs(latest - lastDetentAngle.current) >= 10) {
        lastDetentAngle.current = latest;
        playMechanicalTick(false);
      }
    });

    return () => unsubscribe();
  }, [rotation, counterRotation]);

  // Pointer dragging state
  const isDragging = useRef(false);
  const startAngle = useRef(0);
  const startRotation = useRef(0);
  const lastPointerAngle = useRef(0);
  const angularVelocity = useRef(0);

  // Calculate angle between dial center and pointer
  const getAngle = useCallback((clientX: number, clientY: number) => {
    if (!dialRef.current) return 0;
    const rect = dialRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const dx = clientX - centerX;
    const dy = clientY - centerY;
    return (Math.atan2(dy, dx) * 180) / Math.PI;
  }, []);

  const handlePointerDown = (e: React.PointerEvent) => {
    // Only capture primary button
    if (e.button !== 0) return;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    isDragging.current = true;
    startAngle.current = getAngle(e.clientX, e.clientY);
    startRotation.current = rawRotation.get();
    lastPointerAngle.current = startAngle.current;
    angularVelocity.current = 0;
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging.current) return;
    const currentAngle = getAngle(e.clientX, e.clientY);
    let delta = currentAngle - startAngle.current;

    // Handle wrapping around 180 / -180 boundary
    if (delta > 180) delta -= 360;
    if (delta < -180) delta += 360;

    let frameDelta = currentAngle - lastPointerAngle.current;
    if (frameDelta > 180) frameDelta -= 360;
    if (frameDelta < -180) frameDelta += 360;
    angularVelocity.current = frameDelta;
    lastPointerAngle.current = currentAngle;

    rawRotation.set(startRotation.current + delta);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!isDragging.current) return;
    isDragging.current = false;
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      // Ignore
    }

    // Inertia & snap to nearest 90-degree detent
    const currentRot = rawRotation.get();
    const targetWithMomentum = currentRot + angularVelocity.current * 4;
    const snapped = Math.round(targetWithMomentum / 90) * 90;
    rawRotation.set(snapped);
  };

  // Keyboard accessibility: Left/Right arrow rotates dial
  useEffect(() => {
    if (!section) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "ArrowRight" || e.key === "ArrowDown") {
        e.preventDefault();
        stepDial(1);
      } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        e.preventDefault();
        stepDial(-1);
      } else if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        handleSelectActive();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [section, activeIndex]);

  const stepDial = (direction: 1 | -1) => {
    const current = Math.round(rawRotation.get() / 90) * 90;
    // Step by 90 degrees
    const next = current + direction * -90;
    rawRotation.set(next);
  };

  const rotateToOption = (targetIndex: number) => {
    // Current normalized index
    const currentRot = rawRotation.get();
    const currentNorm = (((-currentRot % 360) + 360) % 360);
    const currentIndex = Math.round(currentNorm / 90) % 4;

    let diff = targetIndex - currentIndex;
    if (diff > 2) diff -= 4;
    if (diff < -2) diff += 4;

    rawRotation.set(currentRot - diff * 90);
  };

  const handleSelectActive = () => {
    if (!section) return;
    const active = options[activeIndex];
    if (active.available) {
      onSelectOption(active.id, section);
      onClose();
    }
  };

  if (!section) return null;

  const activeOption = options[activeIndex];
  const ActiveIcon = activeOption.icon;

  return (
    <AnimatePresence>
      {section ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`Media selector dial for ${section.title}`}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 select-none"
        >
          {/* Deep Navy Backdrop with transparency */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-[#0A1628]/85 backdrop-blur-[12px]"
          />

          {/* Close button at top-4 right-4 */}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close selector dial"
            className="absolute top-4 right-4 z-50 grid size-10 place-items-center rounded-full border border-amber-500/30 bg-[#0F1B2D] text-[#FEF3C7] shadow-lg backdrop-blur-md transition-all hover:bg-amber-500/20 hover:text-[#FCD34D] active:scale-95 sm:size-11"
          >
            <X className="size-5" />
          </button>

          {/* Dial Container - Centered */}
          <motion.div
            initial={prefersReduced ? { opacity: 0 } : { scale: 0.5, opacity: 0 }}
            animate={prefersReduced ? { opacity: 1 } : { scale: 1, opacity: 1 }}
            exit={prefersReduced ? { opacity: 0 } : { scale: 0.5, opacity: 0 }}
            transition={{ type: "spring", stiffness: 280, damping: 26 }}
            className="relative z-10 m-auto flex w-full max-w-sm flex-col items-center justify-center py-1 sm:max-w-md sm:py-2"
          >
            {/* Header info */}
            <div className="mb-1 text-center sm:mb-2 shrink-0">
              <span className="eyebrow text-[9px] tracking-[0.2em] text-[#FBBF24] sm:text-[10px]">
                {bookTitle ? `${bookTitle} • Unit Selector` : "Unit Media Dial"}
              </span>
              <h2 className="mt-0.5 font-serif text-base font-bold tracking-tight text-[#FDFBF7] sm:text-xl">
                {section.title}
              </h2>
              <p className="mt-0.5 text-[11px] text-[#FEF3C7]/80 sm:text-xs">
                Drag the wheel to rotate • Pointer at top selects
              </p>
            </div>

            {/* Gear Dial Area - Dead center */}
            <div className="gear-dial relative my-1 sm:my-2 size-[260px] sm:size-[320px] md:size-[340px] max-w-[85vw] max-h-[60vh] aspect-square shrink-0 m-auto">
              {/* Fixed 12 o'clock Top Pointer / Marker */}
              <div
                className="pointer-events-none absolute -top-3.5 left-1/2 z-30 flex -translate-x-1/2 flex-col items-center"
                aria-hidden="true"
              >
                <div
                  className="size-0 border-x-[11px] border-x-transparent border-t-[16px] transition-all"
                  style={{
                    borderTopColor: "#F59E0B",
                    filter: "drop-shadow(0 0 10px rgba(245, 158, 11, 0.6))",
                  }}
                />
                <div
                  className="h-2.5 w-0.5 rounded-full transition-colors bg-[#F59E0B]"
                />
              </div>

              {/* Interactive Rotating Wheel */}
              <div
                ref={dialRef}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerUp}
                tabIndex={0}
                role="slider"
                aria-label="Media Option Dial"
                aria-valuemin={0}
                aria-valuemax={3}
                aria-valuenow={activeIndex}
                aria-valuetext={activeOption.label}
                className="size-full cursor-grab active:cursor-grabbing outline-none focus-visible:ring-4 focus-visible:ring-[#F59E0B]/50 rounded-full"
              >
                <motion.div
                  style={{ rotate: rotation }}
                  className="relative size-full select-none"
                >
                  {/* Mechanical Gear SVG */}
                  <svg
                    viewBox="0 0 340 340"
                    className="size-full drop-shadow-[0_16px_36px_rgba(0,0,0,0.65)]"
                  >
                    <defs>
                      {/* Amber Rim Gradient */}
                      <linearGradient id={`gear-teeth-grad-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#D97706" />
                        <stop offset="35%" stopColor="#F59E0B" />
                        <stop offset="65%" stopColor="#B45309" />
                        <stop offset="100%" stopColor="#78350F" />
                      </linearGradient>

                      {/* Concentric Disc Radial Gradient */}
                      <radialGradient id={`gear-face-grad-${id}`} cx="50%" cy="50%" r="50%">
                        <stop offset="0%" stopColor="#1A365D" />
                        <stop offset="60%" stopColor="#0F1B2D" />
                        <stop offset="90%" stopColor="#0A1628" />
                        <stop offset="100%" stopColor="#1A365D" />
                      </radialGradient>

                      {/* Center Hub Metallic Ring */}
                      <linearGradient id={`hub-grad-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#FBBF24" />
                        <stop offset="50%" stopColor="#D97706" />
                        <stop offset="100%" stopColor="#78350F" />
                      </linearGradient>
                    </defs>

                    {/* Outer Gear Teeth Path */}
                    <path
                      d={GEAR_SVG_PATH}
                      fill={`url(#gear-teeth-grad-${id})`}
                      stroke="#F59E0B"
                      strokeWidth="1.5"
                      strokeOpacity="0.8"
                    />

                    {/* Outer Bevel Ring: Amber #F59E0B */}
                    <circle
                      cx="170"
                      cy="170"
                      r="138"
                      fill="none"
                      stroke="#F59E0B"
                      strokeWidth="2.5"
                      strokeOpacity="0.9"
                    />

                    {/* Recessed Gear Face */}
                    <circle
                      cx="170"
                      cy="170"
                      r="136"
                      fill={`url(#gear-face-grad-${id})`}
                    />

                    {/* Milled Tick Marks (Swiss Watch/Machinery Bezel) */}
                    {Array.from({ length: 36 }).map((_, i) => {
                      const angle = (i * 10 * Math.PI) / 180;
                      const r1 = i % 9 === 0 ? 122 : 127;
                      const r2 = 133;
                      const x1 = 170 + r1 * Math.cos(angle);
                      const y1 = 170 + r1 * Math.sin(angle);
                      const x2 = 170 + r2 * Math.cos(angle);
                      const y2 = 170 + r2 * Math.sin(angle);
                      return (
                        <line
                          key={i}
                          x1={x1}
                          y1={y1}
                          x2={x2}
                          y2={y2}
                          stroke="#FBBF24"
                          strokeWidth={i % 9 === 0 ? "2" : "1"}
                          strokeOpacity={i % 9 === 0 ? "0.9" : "0.4"}
                        />
                      );
                    })}

                    {/* Inner Groove Track */}
                    <circle
                      cx="170"
                      cy="170"
                      r="70"
                      fill="none"
                      stroke="#F59E0B"
                      strokeWidth="1.5"
                      strokeDasharray="4 4"
                      strokeOpacity="0.4"
                    />

                    {/* Center Axle Hub */}
                    <circle
                      cx="170"
                      cy="170"
                      r="46"
                      fill={`url(#hub-grad-${id})`}
                      stroke="#F59E0B"
                      strokeWidth="2"
                    />
                    <circle
                      cx="170"
                      cy="170"
                      r="36"
                      fill="#0F1B2D"
                      stroke="#F59E0B"
                      strokeWidth="1.5"
                    />

                    {/* Center Hub Rivets / Bolts */}
                    {Array.from({ length: 6 }).map((_, i) => {
                      const boltAngle = (i * 60 * Math.PI) / 180;
                      const bx = 170 + 41 * Math.cos(boltAngle);
                      const by = 170 + 41 * Math.sin(boltAngle);
                      return (
                        <circle
                          key={i}
                          cx={bx}
                          cy={by}
                          r="2.5"
                          fill="#FCD34D"
                          stroke="#78350F"
                          strokeWidth="0.8"
                        />
                      );
                    })}
                  </svg>

                  {/* Center Jewel / Dial Core */}
                  <div className="pointer-events-none absolute inset-0 grid place-items-center">
                    <div
                      className="grid size-12 place-items-center rounded-full border border-amber-500/40 bg-gradient-to-br from-[#F59E0B] to-[#B45309] shadow-inner transition-colors"
                      style={{
                        boxShadow: "0 0 20px rgba(245, 158, 11, 0.5)",
                      }}
                    >
                      <RotateCw className="size-4 animate-spin text-[#0A1628] [animation-duration:12s]" />
                    </div>
                  </div>

                  {/* The 4 Option Badges Around the Dial (Radius: 104px) */}
                  {options.map((opt, idx) => {
                    const rad = ((opt.baseAngle - 90) * Math.PI) / 180;
                    const r = 104;
                    const topPos = 170 + r * Math.sin(rad);
                    const leftPos = 170 + r * Math.cos(rad);

                    const isActive = idx === activeIndex;
                    const OptIcon = opt.icon;

                    return (
                      <div
                        key={opt.id}
                        onPointerDown={(e) => {
                          e.stopPropagation();
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          rotateToOption(idx);
                        }}
                        style={{
                          position: "absolute",
                          top: `${(topPos / 340) * 100}%`,
                          left: `${(leftPos / 340) * 100}%`,
                          transform: "translate(-50%, -50%)",
                        }}
                        className="cursor-pointer"
                      >
                        {/* Counter-rotate badge content so icons and labels stay upright */}
                        <motion.div
                          animate={{
                            scale: isActive ? 1.18 : 0.9,
                          }}
                          transition={{ type: "spring", stiffness: 350, damping: 25 }}
                          className={cn(
                            "flex flex-col items-center justify-center rounded-2xl p-2 transition-all border",
                            isActive
                              ? "bg-[#0F1B2D] shadow-2xl ring-2 ring-[#F59E0B] border-[#F59E0B] backdrop-blur-md"
                              : "bg-[#0A1628]/80 border-amber-500/20 opacity-70 hover:opacity-100",
                            !opt.available && "opacity-35",
                          )}
                          style={{
                            rotate: counterRotation,
                            boxShadow: isActive
                              ? "0 0 24px rgba(245, 158, 11, 0.45), 0 4px 12px rgba(0,0,0,0.5)"
                              : undefined,
                          }}
                        >
                          <span
                            className={cn(
                              "grid size-9 place-items-center rounded-xl shadow-md transition-transform",
                              isActive
                                ? "bg-[#F59E0B] text-[#0A1628]"
                                : "bg-[#1A365D] text-[#FBBF24]",
                            )}
                          >
                            <OptIcon className="size-4.5" />
                          </span>
                          <span
                            className={cn(
                              "mt-1 font-serif text-[11px] font-bold tracking-wide",
                              isActive ? "text-[#FDFBF7]" : "text-[#FEF3C7]/80",
                            )}
                          >
                            {opt.label}
                          </span>
                        </motion.div>
                      </div>
                    );
                  })}
                </motion.div>
              </div>
            </div>

            {/* Quick Step Buttons (< >) */}
            <div className="flex items-center gap-3 mt-1">
              <button
                type="button"
                onClick={() => stepDial(-1)}
                aria-label="Previous option"
                className="grid size-9 place-items-center rounded-full border border-amber-500/30 bg-[#0F1B2D] text-[#FEF3C7] hover:bg-amber-500/20 hover:text-[#FCD34D] transition-colors"
              >
                <ChevronLeft className="size-4" />
              </button>
              <span className="text-[11px] font-semibold tracking-wider text-[#FBBF24] uppercase">
                {activeOption.label} selected
              </span>
              <button
                type="button"
                onClick={() => stepDial(1)}
                aria-label="Next option"
                className="grid size-9 place-items-center rounded-full border border-amber-500/30 bg-[#0F1B2D] text-[#FEF3C7] hover:bg-amber-500/20 hover:text-[#FCD34D] transition-colors"
              >
                <ChevronRight className="size-4" />
              </button>
            </div>

            {/* Selected Action Card & Select Button */}
            <div className="mt-4 w-full rounded-2xl border border-amber-500/30 bg-[#0F1B2D] p-4 shadow-xl backdrop-blur-xl">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span
                    className="grid size-11 shrink-0 place-items-center rounded-xl text-[#0A1628] bg-[#F59E0B] shadow-lg transition-transform"
                  >
                    <ActiveIcon className="size-5" />
                  </span>
                  <div>
                    <h4 className="font-serif text-base font-bold text-[#FDFBF7]">
                      {activeOption.label}
                    </h4>
                    <p className="text-xs text-[#FEF3C7]/80">
                      {activeOption.available
                        ? activeOption.subtitle
                        : "Not available for this unit"}
                    </p>
                  </div>
                </div>

                <span
                  className={cn(
                    "rounded-full px-2.5 py-1 text-[10px] font-semibold tracking-wide uppercase border",
                    activeOption.available
                      ? "border-amber-500/40 bg-amber-500/15 text-[#FBBF24]"
                      : "border-border bg-slate-800 text-slate-400",
                  )}
                >
                  {activeOption.available ? "Ready" : "Unavailable"}
                </span>
              </div>

              {/* Action Launch Button */}
              <button
                type="button"
                onClick={handleSelectActive}
                disabled={!activeOption.available}
                className={cn(
                  "mt-3.5 flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold shadow-lg transition-all",
                  activeOption.available
                    ? "btn-amber-primary cursor-pointer"
                    : "bg-[#1A365D]/50 text-[#FEF3C7]/30 border border-border cursor-not-allowed",
                )}
              >
                <span>
                  {activeOption.available
                    ? `Open ${activeOption.label}`
                    : `${activeOption.label} Unavailable`}
                </span>
                {activeOption.available ? <ArrowRight className="size-4 text-[#0A1628]" /> : null}
              </button>
            </div>
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  );
}
