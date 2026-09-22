"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from "framer-motion";
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  FileText,
  Headphones,
  ImageIcon,
  Play,
  X,
} from "lucide-react";

import type { Section } from "@/lib/types";
import { cn } from "@/lib/utils";

const MAIN_GEAR_PATH = (() => {
  const cx = 170;
  const cy = 170;
  const teeth = 24;
  const rOuter = 162;
  const rInner = 144;
  const toothWidth = 0.45;
  const step = (2 * Math.PI) / teeth;
  let d = "";
  for (let i = 0; i < teeth; i++) {
    const a1 = i * step;
    const a2 = i * step + step * (1 - toothWidth) * 0.5;
    const a3 = i * step + step * (1 + toothWidth) * 0.5;
    const a4 = (i + 1) * step;
    const x1 = cx + rInner * Math.cos(a1);
    const y1 = cy + rInner * Math.sin(a1);
    const x2 = cx + rOuter * Math.cos(a2);
    const y2 = cy + rOuter * Math.sin(a2);
    const x3 = cx + rOuter * Math.cos(a3);
    const y3 = cy + rOuter * Math.sin(a3);
    const x4 = cx + rInner * Math.cos(a4);
    const y4 = cy + rInner * Math.sin(a4);
    if (i === 0) d += `M ${x1.toFixed(2)} ${y1.toFixed(2)} `;
    else d += `L ${x1.toFixed(2)} ${y1.toFixed(2)} `;
    d += `L ${x2.toFixed(2)} ${y2.toFixed(2)} L ${x3.toFixed(2)} ${y3.toFixed(2)} L ${x4.toFixed(2)} ${y4.toFixed(2)} `;
  }
  return d + "Z";
})();

const MINI_GEAR_PATH = (() => {
  const cx = 30;
  const cy = 30;
  const teeth = 12;
  const rOuter = 28;
  const rInner = 22;
  const toothWidth = 0.42;
  const step = (2 * Math.PI) / teeth;
  let d = "";
  for (let i = 0; i < teeth; i++) {
    const a1 = i * step;
    const a2 = i * step + step * (1 - toothWidth) * 0.5;
    const a3 = i * step + step * (1 + toothWidth) * 0.5;
    const a4 = (i + 1) * step;
    const x1 = cx + rInner * Math.cos(a1);
    const y1 = cy + rInner * Math.sin(a1);
    const x2 = cx + rOuter * Math.cos(a2);
    const y2 = cy + rOuter * Math.sin(a2);
    const x3 = cx + rOuter * Math.cos(a3);
    const y3 = cy + rOuter * Math.sin(a3);
    const x4 = cx + rInner * Math.cos(a4);
    const y4 = cy + rInner * Math.sin(a4);
    if (i === 0) d += `M ${x1.toFixed(2)} ${y1.toFixed(2)} `;
    else d += `L ${x1.toFixed(2)} ${y1.toFixed(2)} `;
    d += `L ${x2.toFixed(2)} ${y2.toFixed(2)} L ${x3.toFixed(2)} ${y3.toFixed(2)} L ${x4.toFixed(2)} ${y4.toFixed(2)} `;
  }
  return d + "Z";
})();

function playMechanicalTick(isMajor = false) {
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(isMajor ? 1200 : 800, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(120, ctx.currentTime + 0.025);
    gain.gain.setValueAtTime(isMajor ? 0.22 : 0.1, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.025);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.026);
    setTimeout(() => ctx.close().catch(() => {}), 100);
  } catch {}
}
function playMechanicalWhir() {
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(150, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(60, ctx.currentTime + 0.04);
    gain.gain.setValueAtTime(0.05, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.045);
    setTimeout(() => ctx.close().catch(() => {}), 150);
  } catch {}
}

interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  opacity: number;
  targetX: number;
  targetY: number;
}
interface Spark {
  id: number;
  x: number;
  y: number;
  radius: number;
  opacity: number;
}
interface GearDialModalProps {
  section: (Section & { files?: import("@/lib/types").SectionFile[] }) | null;
  bookTitle?: string;
  onClose: () => void;
  onSelectOption: (optionId: "video" | "audio" | "images" | "pdf", section: Section) => void;
}

export function GearDialModal({ section, bookTitle, onClose, onSelectOption }: GearDialModalProps) {
  const id = useId();
  const prefersReduced = useReducedMotion();
  const dialRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const files = (section as any)?.files as import("@/lib/types").SectionFile[] | undefined;
  const hasImages = files ? files.some((f) => f.type === "image") : Boolean((section?.images_url || section?.image_url) && (section?.images_url || section?.image_url || "").trim().length > 0);
  const hasVideo = files ? files.some((f) => f.type === "video") : Boolean(section?.video_url && section.video_url.trim().length > 0);
  const hasAudio = files ? files.some((f) => f.type === "audio") : Boolean(section?.audio_url && section.audio_url.trim().length > 0);
  const hasHandout = files ? files.some((f) => f.type === "pdf") : Boolean(section?.handout_url && section.handout_url.trim().length > 0);
  const countFor = (t: string) => files ? files.filter((f) => f.type === (t === "images" ? "image" : t === "pdf" ? "pdf" : t).replace("images","image")).length : 0;

  // FIX 2: Deeper, premium palette + counts
  const vCount = files ? files.filter((f) => f.type === "video").length : (hasVideo ? 1 : 0);
  const aCount = files ? files.filter((f) => f.type === "audio").length : (hasAudio ? 1 : 0);
  const iCount = files ? files.filter((f) => f.type === "image").length : (hasImages ? 1 : 0);
  const pCount = files ? files.filter((f) => f.type === "pdf").length : (hasHandout ? 1 : 0);

  const options = [
    {
      id: "video" as const,
      label: "Video",
      subtitle: vCount > 0 ? `${vCount} video${vCount > 1 ? "s" : ""} available` : "Watch lesson video",
      icon: Play,
      baseAngle: 0,
      badgeBg: "#DC2626",
      badgeGlow: "0 0 30px rgba(220, 38, 38, 0.7)",
      haloColor: "rgba(220, 38, 38, 0.6)",
      radialGlow: "rgba(220, 38, 38, 0.15)",
      labelColor: "#DC2626",
      buttonGradient: "linear-gradient(135deg, #DC2626, #B91C1C)",
      available: hasVideo,
      count: vCount,
    },
    {
      id: "audio" as const,
      label: "Audio",
      subtitle: aCount > 0 ? `${aCount} audio${aCount > 1 ? "s" : ""} available` : "Listen to audio lesson",
      icon: Headphones,
      baseAngle: 90,
      badgeBg: "#7C3AED",
      badgeGlow: "0 0 30px rgba(124, 58, 237, 0.7)",
      haloColor: "rgba(124, 58, 237, 0.6)",
      radialGlow: "rgba(124, 58, 237, 0.15)",
      labelColor: "#7C3AED",
      buttonGradient: "linear-gradient(135deg, #7C3AED, #6D28D9)",
      available: hasAudio,
      count: aCount,
    },
    {
      id: "images" as const,
      label: "Images",
      subtitle: iCount > 0 ? `${iCount} image${iCount > 1 ? "s" : ""} available` : "Open image gallery",
      icon: ImageIcon,
      baseAngle: 180,
      badgeBg: "#059669",
      badgeGlow: "0 0 30px rgba(5, 150, 105, 0.7)",
      haloColor: "rgba(5, 150, 105, 0.6)",
      radialGlow: "rgba(5, 150, 105, 0.15)",
      labelColor: "#059669",
      buttonGradient: "linear-gradient(135deg, #059669, #047857)",
      available: hasImages,
      count: iCount,
    },
    {
      id: "pdf" as const,
      label: "PDF",
      subtitle: pCount > 0 ? `${pCount} PDF${pCount > 1 ? "s" : ""} available` : "Read lesson handout",
      icon: FileText,
      baseAngle: 270,
      badgeBg: "#2563EB",
      badgeGlow: "0 0 30px rgba(37, 99, 235, 0.7)",
      haloColor: "rgba(37, 99, 235, 0.6)",
      radialGlow: "rgba(37, 99, 235, 0.15)",
      labelColor: "#2563EB",
      buttonGradient: "linear-gradient(135deg, #2563EB, #1D4ED8)",
      available: hasHandout,
      count: pCount,
    },
  ];

  const rawRotation = useMotionValue(0);
  const rotation = useSpring(rawRotation, { stiffness: 280, damping: 26, mass: 0.9 });
  const [activeIndex, setActiveIndex] = useState(0);
  const lastDetentAngle = useRef(0);
  const counterRotation = useTransform(rotation, (v) => -v);

  const tiltYValue = useMotionValue(-5);
  const smoothTiltY = useSpring(tiltYValue, { stiffness: 220, damping: 20 });

  const idleRotation = useMotionValue(0);
  useEffect(() => {
    if (prefersReduced) return;
    let last = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const dt = (now - last) / 1000;
      last = now;
      idleRotation.set(idleRotation.get() + dt * 12);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [idleRotation, prefersReduced]);

  const miniGearRotation = useTransform([rotation, idleRotation], ([mainRot, idleRot]: number[]) => {
    return -mainRot * 1.5 + (prefersReduced ? 0 : idleRot);
  });

  const [dragging, setDragging] = useState(false);
  const isDraggingRef = useRef(false);
  const startAngle = useRef(0);
  const startRotation = useRef(0);
  const lastPointerAngle = useRef(0);
  const angularVelocity = useRef(0);

  const particlesRef = useRef<Particle[]>([]);
  const sparksRef = useRef<Spark[]>([]);
  const nextParticleId = useRef(0);
  const lastSpawnTime = useRef(0);

  useEffect(() => {
    const unsub = rotation.on("change", (latest) => {
      const normalized = ((-latest % 360) + 360) % 360;
      const index = Math.round(normalized / 90) % 4;
      setActiveIndex((prev) => {
        if (prev !== index) {
          playMechanicalTick(true);
          playMechanicalWhir();
        }
        return index;
      });
      if (Math.abs(latest - lastDetentAngle.current) >= 10) {
        lastDetentAngle.current = latest;
        playMechanicalTick(false);
      }
    });
    return () => unsub();
  }, [rotation]);

  const getAngle = useCallback((clientX: number, clientY: number) => {
    if (!dialRef.current) return 0;
    const rect = dialRef.current.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    return (Math.atan2(clientY - cy, clientX - cx) * 180) / Math.PI;
  }, []);

  const spawnParticle = useCallback(
    (isBurst = false) => {
      if (prefersReduced || !dialRef.current) return;
      const max = isMobile ? 15 : 30;
      if (particlesRef.current.length >= max && !isBurst) return;
      const rect = dialRef.current.getBoundingClientRect();
      const cx = rect.width / 2;
      const cy = rect.height / 2;
      const rOuter = (rect.width / 2) * 0.94;
      const targetX = cx;
      const targetY = cy - (rect.width / 2) * 0.62;
      const angle = isBurst ? -Math.PI / 2 + (Math.random() - 0.5) * 1.4 : Math.random() * Math.PI * 2;
      const x = cx + Math.cos(angle) * rOuter;
      const y = cy + Math.sin(angle) * rOuter;
      const dx = targetX - x;
      const dy = targetY - y;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
      const speed = isBurst ? 220 + Math.random() * 100 : 130 + Math.random() * 80;
      particlesRef.current.push({
        id: nextParticleId.current++,
        x,
        y,
        vx: (dx / dist) * speed,
        vy: (dy / dist) * speed,
        size: 2 + Math.random() * 2,
        opacity: 0.85 + Math.random() * 0.15,
        targetX,
        targetY,
      });
    },
    [isMobile, prefersReduced],
  );

  useEffect(() => {
    if (prefersReduced) return;
    let raf = 0;
    let last = performance.now();
    const render = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.1);
      last = now;
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          const interval = isDraggingRef.current ? 220 : 1000;
          if (now - lastSpawnTime.current >= interval) {
            lastSpawnTime.current = now;
            spawnParticle(false);
          }
          const particles = particlesRef.current;
          for (let i = particles.length - 1; i >= 0; i--) {
            const p = particles[i];
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            const dx = p.targetX - p.x;
            const dy = p.targetY - p.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 24) p.opacity -= dt * 4;
            if (p.opacity <= 0 || dist < 12) {
              sparksRef.current.push({
                id: nextParticleId.current++,
                x: p.targetX + (Math.random() - 0.5) * 8,
                y: p.targetY + (Math.random() - 0.5) * 8,
                radius: 2,
                opacity: 0.9,
              });
              particles.splice(i, 1);
              continue;
            }
            ctx.save();
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size / 2, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(251, 191, 36, ${p.opacity.toFixed(2)})`;
            ctx.shadowColor = "rgba(245, 158, 11, 0.85)";
            ctx.shadowBlur = 8;
            ctx.fill();
            ctx.restore();
          }
          const sparks = sparksRef.current;
          for (let i = sparks.length - 1; i >= 0; i--) {
            const s = sparks[i];
            s.radius += dt * 14;
            s.opacity -= dt * 3.5;
            if (s.opacity <= 0) {
              sparks.splice(i, 1);
              continue;
            }
            ctx.save();
            ctx.beginPath();
            ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(252, 211, 77, ${s.opacity.toFixed(2)})`;
            ctx.lineWidth = 1.2;
            ctx.stroke();
            ctx.restore();
          }
        }
      }
      raf = requestAnimationFrame(render);
    };
    raf = requestAnimationFrame(render);
    return () => cancelAnimationFrame(raf);
  }, [spawnParticle, prefersReduced]);

  const handleWindowPointerMove = useCallback(
    (e: PointerEvent) => {
      if (!isDraggingRef.current) return;
      e.preventDefault();
      const currentAngle = getAngle(e.clientX, e.clientY);
      let delta = currentAngle - startAngle.current;
      if (delta > 180) delta -= 360;
      if (delta < -180) delta += 360;
      let frameDelta = currentAngle - lastPointerAngle.current;
      if (frameDelta > 180) frameDelta -= 360;
      if (frameDelta < -180) frameDelta += 360;
      angularVelocity.current = frameDelta;
      lastPointerAngle.current = currentAngle;
      requestAnimationFrame(() => {
        rawRotation.set(startRotation.current + delta);
      });
      const tiltDir = Math.max(-8, Math.min(8, frameDelta * 2));
      tiltYValue.set(-5 + tiltDir);
    },
    [getAngle, rawRotation, tiltYValue],
  );

  const handleWindowPointerUp = useCallback(
    (e: PointerEvent) => {
      if (!isDraggingRef.current) return;
      isDraggingRef.current = false;
      setDragging(false);
      tiltYValue.set(-5);
      window.removeEventListener("pointermove", handleWindowPointerMove as any);
      window.removeEventListener("pointerup", handleWindowPointerUp as any);
      window.removeEventListener("pointercancel", handleWindowPointerUp as any);
      try {
        (e.target as HTMLElement)?.releasePointerCapture?.((e as any).pointerId);
      } catch {}
      const currentRot = rawRotation.get();
      const targetWithMomentum = currentRot + angularVelocity.current * 4;
      const snapped = Math.round(targetWithMomentum / 90) * 90;
      rawRotation.set(snapped);
      for (let i = 0; i < (isMobile ? 6 : 12); i++) spawnParticle(true);
    },
    [handleWindowPointerMove, isMobile, rawRotation, spawnParticle, tiltYValue],
  );

  const handlePointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return;
    e.preventDefault();
    const target = e.currentTarget as HTMLElement;
    try {
      target.setPointerCapture(e.pointerId);
    } catch {}
    isDraggingRef.current = true;
    setDragging(true);
    startAngle.current = getAngle(e.clientX, e.clientY);
    startRotation.current = rawRotation.get();
    lastPointerAngle.current = startAngle.current;
    angularVelocity.current = 0;
    window.addEventListener("pointermove", handleWindowPointerMove as any, { passive: false });
    window.addEventListener("pointerup", handleWindowPointerUp as any);
    window.addEventListener("pointercancel", handleWindowPointerUp as any);
  };

  useEffect(() => {
    return () => {
      window.removeEventListener("pointermove", handleWindowPointerMove as any);
      window.removeEventListener("pointerup", handleWindowPointerUp as any);
      window.removeEventListener("pointercancel", handleWindowPointerUp as any);
    };
  }, [handleWindowPointerMove, handleWindowPointerUp]);

  useEffect(() => {
    if (!section) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowRight" || e.key === "ArrowDown") {
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
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [section, activeIndex]);

  const stepDial = (direction: 1 | -1) => {
    const current = Math.round(rawRotation.get() / 90) * 90;
    const next = current + direction * -90;
    rawRotation.set(next);
    for (let i = 0; i < (isMobile ? 5 : 8); i++) spawnParticle(true);
  };

  const rotateToOption = (targetIndex: number) => {
    if (isDraggingRef.current) return;
    const currentRot = rawRotation.get();
    const currentNorm = ((-currentRot % 360) + 360) % 360;
    const currentIndex = Math.round(currentNorm / 90) % 4;
    let diff = targetIndex - currentIndex;
    if (diff > 2) diff -= 4;
    if (diff < -2) diff += 4;
    rawRotation.set(currentRot - diff * 90);
    for (let i = 0; i < (isMobile ? 5 : 8); i++) spawnParticle(true);
  };

  const handleSelectActive = () => {
    if (!section) return;
    const active = options[activeIndex];
    // ALWAYS allow selection – even if no content, panel will show empty state
    onSelectOption(active.id, section);
    onClose();
  };

  if (!section) return null;

  const activeOption = options[activeIndex];
  const ActiveIcon = activeOption.icon;

  const miniGearAngles = [0, 120, 240];
  const miniGearRadius = isMobile ? 130 : 165;

  return (
    <AnimatePresence>
      {section ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`Media selector dial for ${section.title}`}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 select-none"
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-[#0A1628]/85 backdrop-blur-[12px]"
          />

          <button
            type="button"
            onClick={onClose}
            aria-label="Close selector dial"
            className="absolute top-4 right-4 z-50 grid size-10 place-items-center rounded-full border border-amber-500/30 bg-[#0F1B2D] text-[#FEF3C7] shadow-lg backdrop-blur-md transition-all hover:bg-amber-500/20 hover:text-[#FCD34D] active:scale-95 sm:size-11"
          >
            <X className="size-5" />
          </button>

          <motion.div
            initial={prefersReduced ? { opacity: 0 } : { scale: 0.5, opacity: 0 }}
            animate={prefersReduced ? { opacity: 1 } : { scale: 1, opacity: 1 }}
            exit={prefersReduced ? { opacity: 0 } : { scale: 0.5, opacity: 0 }}
            transition={{ type: "spring", stiffness: 280, damping: 26 }}
            className="relative z-10 m-auto flex w-full max-w-sm flex-col items-center justify-center py-1 sm:max-w-md sm:py-2"
          >
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

            <div
              className="gear-dial relative my-1 sm:my-2 size-[260px] sm:size-[320px] md:size-[340px] max-w-[85vw] max-h-[60vh] aspect-square shrink-0 m-auto"
              style={{ perspective: "1200px", touchAction: "none" }}
            >
              {/* FIX 2C: Stronger halo - blur 80px, opacity 0.6, pulse 0.5->0.7->0.5 */}
              <motion.div
                key={`halo-${activeOption.id}`}
                initial={{ opacity: 0.5 }}
                animate={{
                  opacity: dragging ? 0.8 : [0.5, 0.7, 0.5],
                  scale: dragging ? 1.1 : [1, 1.06, 1],
                }}
                transition={{
                  opacity: dragging ? { duration: 0.2 } : { duration: 2, repeat: Infinity, ease: "easeInOut" },
                  scale: dragging ? { duration: 0.2 } : { duration: 2, repeat: Infinity, ease: "easeInOut" },
                }}
                className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
                style={{
                  width: "120%",
                  height: "120%",
                  background: `radial-gradient(circle at center, ${activeOption.haloColor}, transparent 70%)`,
                  filter: isMobile ? "blur(30px)" : "blur(80px)",
                  transform: "translate(-50%, -50%) translateZ(-40px)",
                  transition: "background 300ms ease",
                  willChange: "transform, opacity",
                }}
              />

              {/* FIX 2E: Radial glow tinted with selected option color */}
              <div
                className="pointer-events-none absolute left-1/2 top-1/2 size-[125%] -translate-x-1/2 -translate-y-1/2 rounded-full"
                style={{
                  background: `radial-gradient(circle at center, ${activeOption.radialGlow}, transparent 70%)`,
                  transform: "translate(-50%, -50%) translateZ(-20px)",
                  transition: "background 300ms ease",
                }}
              />

              {/* Subtle amber base glow */}
              <div
                className="pointer-events-none absolute left-1/2 top-1/2 size-[110%] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-60"
                style={{
                  background: "radial-gradient(circle at center, rgba(245, 158, 11, 0.12), transparent 70%)",
                  transform: "translate(-50%, -50%) translateZ(-25px)",
                }}
              />

              <div
                className="pointer-events-none absolute -top-3.5 left-1/2 z-40 flex -translate-x-1/2 flex-col items-center"
                aria-hidden="true"
                style={{ transform: "translateX(-50%) translateZ(30px)" }}
              >
                <div
                  className="size-0 border-x-[11px] border-x-transparent border-t-[16px] transition-all"
                  style={{
                    borderTopColor: activeOption.badgeBg,
                    filter: `drop-shadow(0 0 12px ${activeOption.badgeBg})`,
                    transition: "border-top-color 300ms ease",
                  }}
                />
                <div
                  className="h-2.5 w-0.5 rounded-full transition-colors duration-300"
                  style={{ background: activeOption.badgeBg }}
                />
              </div>

              {/* FIX 3: Mini gears subtle - 40px, opacity 0.7 */}
              {miniGearAngles.map((angleDeg, idx) => {
                const gearSize = isMobile ? 32 : 40;
                return (
                  <div
                    key={`mini-gear-${angleDeg}`}
                    className="pointer-events-none absolute z-20 drop-shadow-[0_4px_12px_rgba(0,0,0,0.5)]"
                    style={{
                      top: "50%",
                      left: "50%",
                      width: gearSize,
                      height: gearSize,
                      opacity: 0.7,
                      transform: `translate(-50%, -50%) rotate(${angleDeg}deg) translate(${miniGearRadius}px) rotate(-${angleDeg}deg)`,
                      willChange: "transform",
                    }}
                  >
                    <motion.div
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: 0.1 * idx, type: "spring", stiffness: 260, damping: 20 }}
                      style={{ rotate: miniGearRotation, width: "100%", height: "100%", willChange: "transform" }}
                    >
                      <svg viewBox="0 0 60 60" className="size-full">
                        <path d={MINI_GEAR_PATH} fill="#F59E0B" stroke="#B45309" strokeWidth="1" />
                        <circle cx="30" cy="30" r="19" fill="#0F1B2D" stroke="#1A365D" strokeWidth="1" />
                        <circle cx="30" cy="30" r="8" fill="#1A365D" stroke="#F59E0B" strokeWidth="0.8" />
                        <circle cx="30" cy="30" r="3.2" fill="#F59E0B" />
                      </svg>
                    </motion.div>
                  </div>
                );
              })}

              <motion.div
                style={{ rotateX: 15, rotateY: smoothTiltY, transformStyle: "preserve-3d" }}
                className="relative size-full select-none"
              >
                <div
                  className="pointer-events-none absolute inset-0 size-full"
                  style={{ transform: "translate3d(4px, 4px, -10px) scale(1.015)" }}
                >
                  <svg viewBox="0 0 340 340" className="size-full opacity-90 drop-shadow-[0_20px_40px_rgba(0,0,0,0.8)]">
                    <path d={MAIN_GEAR_PATH} fill="#0A1628" stroke="#050C16" strokeWidth="2.5" />
                    <circle cx="170" cy="170" r="142" fill="#0A1628" />
                  </svg>
                </div>

                <div
                  ref={dialRef}
                  onPointerDown={handlePointerDown}
                  tabIndex={0}
                  role="slider"
                  aria-label="Media Option Dial"
                  aria-valuemin={0}
                  aria-valuemax={3}
                  aria-valuenow={activeIndex}
                  aria-valuetext={activeOption.label}
                  className="relative size-full cursor-grab active:cursor-grabbing outline-none focus-visible:ring-4 focus-visible:ring-[#F59E0B]/50 rounded-full"
                  style={{
                    transformStyle: "preserve-3d",
                    transform: "translateZ(0px)",
                    willChange: "transform",
                    touchAction: "none",
                    boxShadow: "inset 2px 2px 4px rgba(255, 255, 255, 0.1), inset -2px -2px 6px rgba(0, 0, 0, 0.5)",
                  }}
                >
                  <motion.div
                    style={{ rotate: rotation, transformStyle: "preserve-3d", willChange: "transform" }}
                    className="relative size-full select-none"
                  >
                    {/* FIX 2A: Gear body navy #0F1B2D with amber teeth #F59E0B */}
                    <svg viewBox="0 0 340 340" className="size-full drop-shadow-[0_16px_36px_rgba(0,0,0,0.65)]">
                      <defs>
                        <radialGradient id={`gear-face-grad-${id}`} cx="50%" cy="50%" r="50%">
                          <stop offset="0%" stopColor="#1A365D" />
                          <stop offset="60%" stopColor="#0F1B2D" />
                          <stop offset="85%" stopColor="#0A1628" />
                          <stop offset="100%" stopColor="#0F1B2D" />
                        </radialGradient>
                      </defs>
                      {/* Teeth amber */}
                      <path d={MAIN_GEAR_PATH} fill="#F59E0B" stroke="#B45309" strokeWidth="1.2" />
                      {/* Body navy */}
                      <circle cx="170" cy="170" r="142" fill="#0F1B2D" />
                      {/* Inner ring deeper navy #0A1628 */}
                      <circle cx="170" cy="170" r="115" fill="none" stroke="#0A1628" strokeWidth="14" strokeOpacity="0.9" />
                      <circle cx="170" cy="170" r="115" fill="none" stroke="#1A365D" strokeWidth="1" strokeOpacity="0.5" />
                      {Array.from({ length: 36 }).map((_, i) => {
                        const angle = (i * 10 * Math.PI) / 180;
                        const r1 = i % 9 === 0 ? 122 : 128;
                        const r2 = 136;
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
                            strokeWidth={i % 9 === 0 ? "1.8" : "0.8"}
                            strokeOpacity={i % 9 === 0 ? "0.7" : "0.25"}
                          />
                        );
                      })}

                      {/* FIX 2D: Dashed circle colored and animated - base static track */}
                      <circle cx="170" cy="170" r="70" fill="none" stroke="#1A365D" strokeWidth="0.5" strokeOpacity="0.2" />
                    </svg>

                    {/* FIX 2D: Dashed circle colored with selected option, rotating slowly 20s */}
                    <motion.div
                      className="pointer-events-none absolute rounded-full"
                      style={{
                        top: "50%",
                        left: "50%",
                        width: "41.5%",
                        height: "41.5%",
                        border: `1.5px dashed ${activeOption.badgeBg}`,
                        opacity: 0.5,
                        x: "-50%",
                        y: "-50%",
                      }}
                      animate={{ rotate: 360 }}
                      transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    />

                    {/* FIX 2F: Breathing light from center - empty center with soft light toward selected option */}
                    <div
                      className="pointer-events-none absolute"
                      style={{
                        top: "50%",
                        left: "50%",
                        transform: "translate(-50%, -50%)",
                      }}
                    >
                      {/* Central soft glow */}
                      <motion.div
                        className="rounded-full"
                        style={{
                          width: "48px",
                          height: "48px",
                          background: `radial-gradient(circle at center, ${activeOption.badgeBg}30, transparent 70%)`,
                          filter: "blur(8px)",
                        }}
                        animate={{ scale: [1, 1.3, 1], opacity: [0.4, 0.7, 0.4] }}
                        transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                      />
                      {/* Small glowing dot at center pulsing */}
                      <motion.div
                        className="absolute rounded-full"
                        style={{
                          top: "50%",
                          left: "50%",
                          width: "8px",
                          height: "8px",
                          background: activeOption.badgeBg,
                          boxShadow: `0 0 12px ${activeOption.badgeBg}`,
                          x: "-50%",
                          y: "-50%",
                        }}
                        animate={{ scale: [1, 1.4, 1], opacity: [0.6, 1, 0.6] }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                      />
                      {/* Beam toward selected option (top) */}
                      <motion.div
                        className="absolute"
                        style={{
                          top: "50%",
                          left: "50%",
                          width: "2px",
                          height: "70px",
                          background: `linear-gradient(to top, ${activeOption.badgeBg}60, transparent)`,
                          transformOrigin: "bottom center",
                          x: "-50%",
                          y: "-100%",
                        }}
                        animate={{ opacity: [0.2, 0.5, 0.2], scaleY: [0.8, 1, 0.8] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                      />
                    </div>

                    {/* FIX 1: Center hub REMOVED - empty navy space */}

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
                          onClick={(e) => {
                            e.stopPropagation();
                            rotateToOption(idx);
                          }}
                          style={{
                            position: "absolute",
                            top: `${(topPos / 340) * 100}%`,
                            left: `${(leftPos / 340) * 100}%`,
                            transform: "translate(-50%, -50%) translateZ(16px)",
                          }}
                          className="cursor-pointer"
                        >
                          <motion.div
                            animate={{ scale: isActive ? 1.1 : 1 }}
                            transition={{ type: "spring", stiffness: 350, damping: 25 }}
                            className="flex flex-col items-center justify-center"
                            style={{ rotate: counterRotation }}
                          >
                            <div className="relative">
                              {isActive && (
                                <motion.div
                                  className="absolute rounded-full pointer-events-none"
                                  style={{
                                    top: "50%",
                                    left: "50%",
                                    width: "64px",
                                    height: "64px",
                                    border: `2px solid ${opt.badgeBg}`,
                                    boxShadow: `0 0 16px ${opt.badgeBg}`,
                                    x: "-50%",
                                    y: "-50%",
                                  }}
                                  animate={{ scale: [1, 1.1, 1], opacity: [0.4, 0.8, 0.4] }}
                                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                                />
                              )}
                              <span
                                className={cn(
                                  "relative grid size-14 place-items-center rounded-full shadow-lg transition-all duration-300 border-2",
                                )}
                                style={{
                                  background: opt.badgeBg,
                                  borderColor: isActive ? "#FFFFFF" : "rgba(255,255,255,0.15)",
                                  boxShadow: isActive ? opt.badgeGlow : "0 4px 12px rgba(0,0,0,0.4)",
                                }}
                              >
                                <OptIcon className="size-6 text-white" />
                              </span>
                            </div>
                            <span
                              className={cn(
                                "mt-1.5 font-serif text-[10px] font-bold tracking-wider uppercase transition-colors duration-300",
                                isActive ? "opacity-100" : "opacity-60",
                              )}
                              style={{ color: isActive ? opt.badgeBg : "#FEF3C7" }}
                            >
                              {opt.label}
                            </span>
                          </motion.div>
                        </div>
                      );
                    })}
                  </motion.div>
                </div>
              </motion.div>

              <canvas
                ref={canvasRef}
                width={isMobile ? 260 : 340}
                height={isMobile ? 260 : 340}
                className="pointer-events-none absolute inset-0 size-full z-30"
                style={{ transform: "translateZ(25px)" }}
              />
            </div>

            <div className="flex items-center gap-3 mt-6 sm:mt-7 shrink-0 z-30">
              <button
                type="button"
                onClick={() => stepDial(-1)}
                aria-label="Previous option"
                className="grid size-9 place-items-center rounded-full border bg-[#0F1B2D] text-[#FEF3C7] hover:bg-white/10 transition-colors cursor-pointer"
                style={{ borderColor: `${activeOption.labelColor}40` }}
              >
                <ChevronLeft className="size-4" />
              </button>
              <span
                className="flex items-center gap-2 text-[11px] font-semibold tracking-wider uppercase transition-colors duration-300"
                style={{ color: activeOption.labelColor }}
              >
                <span
                  className="size-2 rounded-full animate-pulse"
                  style={{ background: activeOption.labelColor, boxShadow: `0 0 8px ${activeOption.labelColor}` }}
                />
                {activeOption.label} selected
              </span>
              <button
                type="button"
                onClick={() => stepDial(1)}
                aria-label="Next option"
                className="grid size-9 place-items-center rounded-full border bg-[#0F1B2D] text-[#FEF3C7] hover:bg-white/10 transition-colors cursor-pointer"
                style={{ borderColor: `${activeOption.labelColor}40` }}
              >
                <ChevronRight className="size-4" />
              </button>
            </div>

            <div
              className="mt-3.5 w-full rounded-2xl border bg-[#0F1B2D] p-4 shadow-xl backdrop-blur-xl shrink-0 transition-colors duration-300"
              style={{ borderColor: `${activeOption.labelColor}30` }}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span
                    className="grid size-11 shrink-0 place-items-center rounded-xl shadow-lg transition-all duration-300"
                    style={{ background: activeOption.badgeBg, boxShadow: activeOption.badgeGlow }}
                  >
                    <ActiveIcon className="size-5 text-white" />
                  </span>
                  <div>
                    <h4 className="font-serif text-base font-bold text-[#FDFBF7]">{activeOption.label}</h4>
                    <p className="text-xs text-[#FEF3C7]/80">
                      {activeOption.subtitle}
                    </p>
                  </div>
                </div>
                <span
                  className="rounded-full px-2.5 py-1 text-[10px] font-semibold tracking-wide uppercase border transition-colors duration-300"
                  style={{
                    borderColor: `${activeOption.labelColor}40`,
                    background: `${activeOption.labelColor}18`,
                    color: activeOption.labelColor,
                  }}
                >
                  Ready
                </span>
              </div>

              <button
                type="button"
                onClick={handleSelectActive}
                className={cn(
                  "mt-3.5 flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold shadow-lg transition-all",
                  "cursor-pointer text-white hover:brightness-110 active:scale-[0.98]",
                )}
                style={{
                  background: activeOption.buttonGradient,
                  color: "#FFFFFF",
                  boxShadow: activeOption.badgeGlow,
                }}
              >
                <span>{`Open ${activeOption.label}`}</span>
                <ArrowRight className="size-4 text-white" />
              </button>
            </div>
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  );
}
