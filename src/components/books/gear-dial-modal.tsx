"use client";

import { useEffect, useId, useRef, useState } from "react";
import {
  animate,
  AnimatePresence,
  motion,
  useMotionValue,
  useReducedMotion,
  useTransform,
} from "framer-motion";
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  FileText,
  Headphones,
  Image as ImageIcon,
  Play,
  RotateCw,
  X,
} from "lucide-react";
import { toast } from "sonner";

import type { Section } from "@/lib/types";

import { cn } from "@/lib/utils";

interface GearDialModalProps {
  section: Section | null;
  bookTitle?: string;
  onClose: () => void;
  onSelectOption: (
    option: "video" | "audio" | "images" | "pdf",
    section: Section,
  ) => void;
}

// Generate an authentic mechanical gear SVG path with involute teeth
function generateGearPath(teeth = 24, outerR = 158, innerR = 142, cx = 170, cy = 170): string {
  const points: string[] = [];
  const step = (Math.PI * 2) / teeth;
  for (let i = 0; i < teeth; i++) {
    const angle = i * step - Math.PI / 2;
    const a1 = angle;
    const a2 = angle + step * 0.22;
    const a3 = angle + step * 0.35;
    const a4 = angle + step * 0.65;
    const a5 = angle + step * 0.78;
    const a6 = angle + step;

    points.push(`${i === 0 ? "M" : "L"} ${cx + innerR * Math.cos(a1)} ${cy + innerR * Math.sin(a1)}`);
    points.push(`L ${cx + innerR * Math.cos(a2)} ${cy + innerR * Math.sin(a2)}`);
    points.push(`L ${cx + outerR * Math.cos(a3)} ${cy + outerR * Math.sin(a3)}`);
    points.push(`L ${cx + outerR * Math.cos(a4)} ${cy + outerR * Math.sin(a4)}`);
    points.push(`L ${cx + innerR * Math.cos(a5)} ${cy + innerR * Math.sin(a5)}`);
    points.push(`L ${cx + innerR * Math.cos(a6)} ${cy + innerR * Math.sin(a6)}`);
  }
  return points.join(" ") + " Z";
}

const GEAR_SVG_PATH = generateGearPath(24, 158, 142, 170, 170);

function triggerHaptic() {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    try {
      navigator.vibrate(15);
    } catch {
      // Ignore vibration errors
    }
  }
}

export function GearDialModal({
  section,
  bookTitle,
  onClose,
  onSelectOption,
}: GearDialModalProps) {
  const id = useId();
  const prefersReduced = useReducedMotion();
  const dialRef = useRef<HTMLDivElement | null>(null);

  // Rotation motion value (in continuous degrees)
  const rotation = useMotionValue(0);
  const [activeIndex, setActiveIndex] = useState(0);
  const activeIndexRef = useRef(0);
  const [isDragging, setIsDragging] = useState(false);

  // Drag state
  const centerRef = useRef({ x: 0, y: 0 });
  const startPointerAngleRef = useRef(0);
  const startGearAngleRef = useRef(0);
  const lastPointerAngleRef = useRef(0);
  const lastTimeRef = useRef(0);
  const velocityRef = useRef(0);
  const isDraggingRef = useRef(false);

  // Parse availability
  const hasVideo = Boolean(section?.video_url);
  const hasAudio = Boolean(section?.audio_url);
  const hasHandout = Boolean(section?.handout_url);
  const rawImages = section?.images_url || section?.image_url;
  const hasImages = Boolean(rawImages && rawImages.trim().length > 0);

  // 4 Options (spaced at 90° intervals around dial)
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
      color: "#EF4444",
      bgBadge: "bg-red-500",
      glowColor: "rgba(239, 68, 68, 0.4)",
      available: hasVideo,
    },
    {
      id: "audio" as const,
      label: "Audio",
      subtitle: "Listen to audio lesson",
      icon: Headphones,
      baseAngle: 90,
      color: "#A855F7",
      bgBadge: "bg-purple-500",
      glowColor: "rgba(168, 85, 247, 0.4)",
      available: hasAudio,
    },
    {
      id: "images" as const,
      label: "Images",
      subtitle: "Open image gallery",
      icon: ImageIcon,
      baseAngle: 180,
      color: "#10B981",
      bgBadge: "bg-emerald-500",
      glowColor: "rgba(16, 185, 129, 0.4)",
      available: hasImages,
    },
    {
      id: "pdf" as const,
      label: "PDF",
      subtitle: "Read lesson handout",
      icon: FileText,
      baseAngle: 270,
      color: "#3B82F6",
      bgBadge: "bg-blue-500",
      glowColor: "rgba(59, 130, 246, 0.4)",
      available: hasHandout,
    },
  ];

  // Update active index whenever rotation changes
  useEffect(() => {
    const unsubscribe = rotation.on("change", (latest) => {
      // Normalized angle pointing to 12 o'clock
      const normalized = ((-latest % 360) + 360) % 360;
      const idx = (Math.round(normalized / 90) % 4 + 4) % 4;
      if (idx !== activeIndexRef.current) {
        activeIndexRef.current = idx;
        setActiveIndex(idx);
        triggerHaptic();
      }
    });
    return () => unsubscribe();
  }, [rotation]);

  // Pointer drag events for rotational dial
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    const rect = dialRef.current?.getBoundingClientRect();
    if (!rect) return;
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    centerRef.current = { x: cx, y: cy };

    const currentAngle = Math.atan2(e.clientY - cy, e.clientX - cx) * (180 / Math.PI);
    startPointerAngleRef.current = currentAngle;
    startGearAngleRef.current = rotation.get();
    lastPointerAngleRef.current = currentAngle;
    lastTimeRef.current = performance.now();
    velocityRef.current = 0;
    isDraggingRef.current = true;
    setIsDragging(true);

    try {
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    } catch {
      // Ignore
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current) return;
    const cx = centerRef.current.x;
    const cy = centerRef.current.y;
    const currentAngle = Math.atan2(e.clientY - cy, e.clientX - cx) * (180 / Math.PI);

    let diff = currentAngle - lastPointerAngleRef.current;
    while (diff > 180) diff -= 360;
    while (diff < -180) diff += 360;

    const now = performance.now();
    const dt = now - lastTimeRef.current;
    if (dt > 0) {
      velocityRef.current = diff / dt; // deg/ms
    }
    lastTimeRef.current = now;
    lastPointerAngleRef.current = currentAngle;

    const newRot = rotation.get() + diff;
    rotation.set(newRot);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    setIsDragging(false);

    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      // Ignore
    }

    // Inertia & Snapping to nearest 90°
    const v = velocityRef.current;
    const currentRot = rotation.get();
    const inertiaDelta = prefersReduced ? 0 : Math.max(Math.min(v * 160, 270), -270);
    const projectedRot = currentRot + inertiaDelta;
    const snappedRot = Math.round(projectedRot / 90) * 90;

    animate(rotation, snappedRot, {
      type: "spring",
      stiffness: 220,
      damping: prefersReduced ? 30 : 22,
      onComplete: () => {
        const finalNorm = ((-snappedRot % 360) + 360) % 360;
        const finalIdx = (Math.round(finalNorm / 90) % 4 + 4) % 4;
        setActiveIndex(finalIdx);
        activeIndexRef.current = finalIdx;
      },
    });
  };

  // Step dial clockwise / counter-clockwise
  const stepDial = (direction: 1 | -1) => {
    const currentRot = rotation.get();
    const currentSnapped = Math.round(currentRot / 90) * 90;
    const targetRot = currentSnapped - direction * 90;
    animate(rotation, targetRot, {
      type: "spring",
      stiffness: 240,
      damping: 24,
    });
  };

  // Rotate directly to a chosen option
  const rotateToOption = (targetIndex: number) => {
    const targetAngle = -targetIndex * 90;
    const currentRot = rotation.get();
    const diff = ((((targetAngle - currentRot) % 360) + 540) % 360) - 180;
    const targetRot = currentRot + diff;

    animate(rotation, targetRot, {
      type: "spring",
      stiffness: 240,
      damping: 24,
    });
  };

  // Confirm selection
  const handleSelectActive = () => {
    if (!section) return;
    const current = options[activeIndex];
    if (!current.available) {
      toast.error(`${current.label} is not available for this unit.`);
      return;
    }
    onClose();
    onSelectOption(current.id, section);
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
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
  }, [onClose, activeIndex, section]);

  const activeOption = options[activeIndex];
  const ActiveIcon = activeOption.icon;

  // Counter-rotation transform to keep badges upright
  const counterRotation = useTransform(rotation, (val) => -val);

  return (
    <AnimatePresence>
      {section ? (
        <div
          className="overlay-center fixed inset-0 z-50 flex flex-col items-center justify-center p-3 sm:p-4 select-none touch-none overflow-y-auto"
          role="dialog"
          aria-modal="true"
          aria-label={`Select media for ${section.title}`}
        >
          {/* Dark Glassmorphism Backdrop with 12px blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-[12px]"
          />

          {/* Close button at top-4 right-4 */}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close selector dial"
            className="absolute top-4 right-4 z-50 grid size-10 place-items-center rounded-full border border-white/20 bg-white/10 text-white shadow-lg backdrop-blur-md transition-all hover:bg-white/20 hover:text-white active:scale-95 sm:size-11"
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
              <span className="eyebrow text-[9px] tracking-[0.2em] text-indigo dark:text-indigo sm:text-[10px]">
                {bookTitle ? `${bookTitle} • Unit Selector` : "Unit Media Dial"}
              </span>
              <h2 className="mt-0.5 font-serif text-base font-bold tracking-tight text-white sm:text-xl">
                {section.title}
              </h2>
              <p className="mt-0.5 text-[11px] text-slate-300 sm:text-xs">
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
                    borderTopColor: activeOption.color,
                    filter: `drop-shadow(0 0 10px ${activeOption.glowColor})`,
                  }}
                />
                <div
                  className="h-2.5 w-0.5 rounded-full transition-colors"
                  style={{ backgroundColor: activeOption.color }}
                />
              </div>

              {/* Interactive Rotating Wheel */}
              <div
                ref={dialRef}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerUp}
                className={cn(
                  "relative size-full cursor-grab active:cursor-grabbing",
                  isDragging && "cursor-grabbing",
                )}
                style={{ touchAction: "none" }}
              >
                {/* Rotating Gear Body */}
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
                      {/* Metallic Rim Gradient */}
                      <linearGradient id={`gear-teeth-grad-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#475569" />
                        <stop offset="25%" stopColor="#64748B" />
                        <stop offset="50%" stopColor="#1E293B" />
                        <stop offset="75%" stopColor="#475569" />
                        <stop offset="100%" stopColor="#0F172A" />
                      </linearGradient>

                      {/* Concentric Disc Radial Gradient */}
                      <radialGradient id={`gear-face-grad-${id}`} cx="50%" cy="50%" r="50%">
                        <stop offset="0%" stopColor="#1E293B" />
                        <stop offset="60%" stopColor="#0F172A" />
                        <stop offset="90%" stopColor="#020617" />
                        <stop offset="100%" stopColor="#1E293B" />
                      </radialGradient>

                      {/* Center Hub Metallic Ring */}
                      <linearGradient id={`hub-grad-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#94A3B8" />
                        <stop offset="50%" stopColor="#334155" />
                        <stop offset="100%" stopColor="#0F172A" />
                      </linearGradient>
                    </defs>

                    {/* Outer Gear Teeth Path */}
                    <path
                      d={GEAR_SVG_PATH}
                      fill={`url(#gear-teeth-grad-${id})`}
                      stroke="#94A3B8"
                      strokeWidth="1.5"
                      strokeOpacity="0.3"
                    />

                    {/* Outer Bevel Ring */}
                    <circle
                      cx="170"
                      cy="170"
                      r="138"
                      fill="none"
                      stroke="#64748B"
                      strokeWidth="2"
                      strokeOpacity="0.4"
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
                          stroke="#94A3B8"
                          strokeWidth={i % 9 === 0 ? "2" : "1"}
                          strokeOpacity={i % 9 === 0 ? "0.6" : "0.25"}
                        />
                      );
                    })}

                    {/* Inner Groove Track */}
                    <circle
                      cx="170"
                      cy="170"
                      r="70"
                      fill="none"
                      stroke="#334155"
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
                      stroke="#64748B"
                      strokeWidth="2"
                    />
                    <circle
                      cx="170"
                      cy="170"
                      r="36"
                      fill="#0F172A"
                      stroke="#475569"
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
                          fill="#CBD5E1"
                          stroke="#1E293B"
                          strokeWidth="0.8"
                        />
                      );
                    })}
                  </svg>

                  {/* Center Jewel / Dial Core */}
                  <div className="pointer-events-none absolute inset-0 grid place-items-center">
                    <div
                      className="grid size-12 place-items-center rounded-full border border-white/20 bg-gradient-to-br from-indigo to-slate-900 shadow-inner transition-colors"
                      style={{
                        boxShadow: `0 0 20px ${activeOption.glowColor}`,
                      }}
                    >
                      <RotateCw className="size-4 animate-spin text-white/70 [animation-duration:12s]" />
                    </div>
                  </div>

                  {/* The 4 Option Badges Around the Dial (Radius: 104px) */}
                  {options.map((opt, idx) => {
                    // Position at radius 104px from center (170, 170)
                    // baseAngle: 0 -> Top, 90 -> Right, 180 -> Bottom, 270 -> Left
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
                        {/* Counter-rotate badge content so icons and labels stay perfectly upright */}
                        <motion.div
                          animate={{
                            scale: isActive ? 1.18 : 0.9,
                          }}
                          transition={{ type: "spring", stiffness: 350, damping: 25 }}
                          className={cn(
                            "flex flex-col items-center justify-center rounded-2xl p-2 transition-all",
                            isActive
                              ? "bg-slate-900/90 shadow-2xl ring-2 backdrop-blur-md"
                              : "bg-slate-950/60 opacity-60 hover:opacity-90",
                            !opt.available && "opacity-35",
                          )}
                          style={{
                            rotate: counterRotation,
                            boxShadow: isActive
                              ? `0 0 24px ${opt.glowColor}, 0 4px 12px rgba(0,0,0,0.5)`
                              : undefined,
                            borderColor: isActive ? opt.color : "transparent",
                          }}
                        >
                          <span
                            className="grid size-9 place-items-center rounded-xl text-white shadow-md transition-transform"
                            style={{ backgroundColor: opt.color }}
                          >
                            <OptIcon className="size-4.5" />
                          </span>
                          <span className="mt-1 font-serif text-[11px] font-bold text-white tracking-wide">
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
                className="grid size-9 place-items-center rounded-full border border-white/10 bg-white/5 text-white/70 hover:bg-white/15 hover:text-white transition-colors"
              >
                <ChevronLeft className="size-4" />
              </button>
              <span className="text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
                {activeOption.label} selected
              </span>
              <button
                type="button"
                onClick={() => stepDial(1)}
                aria-label="Next option"
                className="grid size-9 place-items-center rounded-full border border-white/10 bg-white/5 text-white/70 hover:bg-white/15 hover:text-white transition-colors"
              >
                <ChevronRight className="size-4" />
              </button>
            </div>

            {/* Selected Action Card & Select Button */}
            <div className="mt-4 w-full rounded-2xl border border-white/15 bg-slate-900/80 p-4 shadow-xl backdrop-blur-xl">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span
                    className="grid size-11 shrink-0 place-items-center rounded-xl text-white shadow-lg transition-transform"
                    style={{ backgroundColor: activeOption.color }}
                  >
                    <ActiveIcon className="size-5" />
                  </span>
                  <div>
                    <h4 className="font-serif text-base font-bold text-white">
                      {activeOption.label}
                    </h4>
                    <p className="text-xs text-slate-300">
                      {activeOption.available
                        ? activeOption.subtitle
                        : "Not available for this unit"}
                    </p>
                  </div>
                </div>

                <span
                  className={cn(
                    "rounded-full px-2.5 py-1 text-[10px] font-semibold tracking-wide uppercase",
                    activeOption.available
                      ? "bg-emerald-500/15 text-emerald-400"
                      : "bg-slate-800 text-slate-400",
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
                  "mt-3.5 flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold text-white shadow-lg transition-all",
                  activeOption.available
                    ? "hover:opacity-95 active:scale-[0.98] cursor-pointer"
                    : "opacity-40 cursor-not-allowed",
                )}
                style={{
                  backgroundColor: activeOption.available ? activeOption.color : "#334155",
                  boxShadow: activeOption.available
                    ? `0 6px 20px ${activeOption.glowColor}`
                    : undefined,
                }}
              >
                <span>
                  {activeOption.available
                    ? `Open ${activeOption.label}`
                    : `${activeOption.label} Unavailable`}
                </span>
                {activeOption.available ? <ArrowRight className="size-4" /> : null}
              </button>
            </div>
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  );
}
