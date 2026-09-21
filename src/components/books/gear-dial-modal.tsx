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
  RotateCw,
  X,
} from "lucide-react";

import type { Section } from "@/lib/types";

import { cn } from "@/lib/utils";

// Mechanical 24-Teeth Main Gear Outline SVG Path (340x340 viewBox, center 170,170)
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

    if (i === 0) d += `M ${x1.toFixed(2)} ${y1.toFixed(2)} `;
    else d += `L ${x1.toFixed(2)} ${y1.toFixed(2)} `;
    d += `L ${x2.toFixed(2)} ${y2.toFixed(2)} `;
    d += `L ${x3.toFixed(2)} ${y3.toFixed(2)} `;
    d += `L ${x4.toFixed(2)} ${y4.toFixed(2)} `;
  }
  d += "Z";
  return d;
})();

// Mechanical 12-Teeth Mini Gear Outline SVG Path (60x60 viewBox, center 30,30)
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

    if (i === 0) d += `M ${x1.toFixed(2)} ${y1.toFixed(2)} `;
    else d += `L ${x1.toFixed(2)} ${y1.toFixed(2)} `;
    d += `L ${x2.toFixed(2)} ${y2.toFixed(2)} `;
    d += `L ${x3.toFixed(2)} ${y3.toFixed(2)} `;
    d += `L ${x4.toFixed(2)} ${y4.toFixed(2)} `;
  }
  d += "Z";
  return d;
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
  isBurst?: boolean;
}

interface Spark {
  id: number;
  x: number;
  y: number;
  radius: number;
  opacity: number;
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
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const rawImages = section?.images_url || section?.image_url;
  const hasImages = Boolean(rawImages && rawImages.trim().length > 0);
  const hasVideo = Boolean(section?.video_url && section.video_url.trim().length > 0);
  const hasAudio = Boolean(section?.audio_url && section.audio_url.trim().length > 0);
  const hasHandout = Boolean(section?.handout_url && section.handout_url.trim().length > 0);

  // FIX 2 & 3 & 7 & 8: Distinct colors per option
  const options = [
    {
      id: "video" as const,
      label: "Video",
      subtitle: "Watch lesson video",
      icon: Play,
      baseAngle: 0,
      badgeBg: "#EF4444",
      badgeGlow: "0 0 30px rgba(239, 68, 68, 0.7)",
      haloColor: "rgba(239, 68, 68, 0.5)",
      labelColor: "#EF4444",
      buttonGradient: "linear-gradient(135deg, #EF4444, #DC2626)",
      available: hasVideo,
    },
    {
      id: "audio" as const,
      label: "Audio",
      subtitle: "Listen to audio lesson",
      icon: Headphones,
      baseAngle: 90,
      badgeBg: "#8B5CF6",
      badgeGlow: "0 0 30px rgba(139, 92, 246, 0.7)",
      haloColor: "rgba(139, 92, 246, 0.5)",
      labelColor: "#8B5CF6",
      buttonGradient: "linear-gradient(135deg, #8B5CF6, #7C3AED)",
      available: hasAudio,
    },
    {
      id: "images" as const,
      label: "Images",
      subtitle: "Open image gallery",
      icon: ImageIcon,
      baseAngle: 180,
      badgeBg: "#10B981",
      badgeGlow: "0 0 30px rgba(16, 185, 129, 0.7)",
      haloColor: "rgba(16, 185, 129, 0.5)",
      labelColor: "#10B981",
      buttonGradient: "linear-gradient(135deg, #10B981, #059669)",
      available: hasImages,
    },
    {
      id: "pdf" as const,
      label: "PDF",
      subtitle: "Read lesson handout",
      icon: FileText,
      baseAngle: 270,
      badgeBg: "#3B82F6",
      badgeGlow: "0 0 30px rgba(59, 130, 246, 0.7)",
      haloColor: "rgba(59, 130, 246, 0.5)",
      labelColor: "#3B82F6",
      buttonGradient: "linear-gradient(135deg, #3B82F6, #2563EB)",
      available: hasHandout,
    },
  ];

  const rawRotation = useMotionValue(0);
  const rotation = useSpring(rawRotation, {
    stiffness: 280,
    damping: 26,
    mass: 0.9,
  });

  const [activeIndex, setActiveIndex] = useState(0);
  const lastDetentAngle = useRef(0);

  const counterRotation = useTransform(rotation, (val) => -val);

  // FEATURE 1: 3D PARALLAX TILT
  const tiltYValue = useMotionValue(-5);
  const smoothTiltY = useSpring(tiltYValue, { stiffness: 220, damping: 20 });

  // FEATURE 2: MINI GEAR ROTATION (1.5x counter + idle 1 turn per 30s)
  const idleRotation = useMotionValue(0);
  useEffect(() => {
    if (prefersReduced) return;
    let lastTime = performance.now();
    let animId: number;
    const animateIdle = (now: number) => {
      const dt = (now - lastTime) / 1000;
      lastTime = now;
      idleRotation.set(idleRotation.get() + dt * 12);
      animId = requestAnimationFrame(animateIdle);
    };
    animId = requestAnimationFrame(animateIdle);
    return () => cancelAnimationFrame(animId);
  }, [idleRotation, prefersReduced]);

  const miniGearRotation = useTransform(
    [rotation, idleRotation],
    ([mainRot, idleRot]: number[]) => {
      return -mainRot * 1.5 + (prefersReduced ? 0 : idleRot);
    },
  );

  const [dragging, setDragging] = useState(false);
  const isDraggingRef = useRef(false);
  const startAngle = useRef(0);
  const startRotation = useRef(0);
  const lastPointerAngle = useRef(0);
  const angularVelocity = useRef(0);

  // FEATURE 3: PARTICLES
  const particlesRef = useRef<Particle[]>([]);
  const sparksRef = useRef<Spark[]>([]);
  const nextParticleId = useRef(0);
  const lastSpawnTime = useRef(0);

  useEffect(() => {
    const unsubscribe = rotation.on("change", (latest) => {
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
    return () => unsubscribe();
  }, [rotation]);

  const getAngle = useCallback((clientX: number, clientY: number) => {
    if (!dialRef.current) return 0;
    const rect = dialRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const dx = clientX - centerX;
    const dy = clientY - centerY;
    return (Math.atan2(dy, dx) * 180) / Math.PI;
  }, []);

  const spawnParticle = useCallback(
    (isBurst = false) => {
      if (prefersReduced || !dialRef.current) return;
      const maxParticles = isMobile ? 15 : 30;
      if (particlesRef.current.length >= maxParticles && !isBurst) return;

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
        isBurst,
      });
    },
    [isMobile, prefersReduced],
  );

  useEffect(() => {
    if (prefersReduced) return;
    let animId: number;
    let lastTime = performance.now();

    const render = (now: number) => {
      const dt = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);

          const spawnInterval = isDraggingRef.current ? 220 : 1000;
          if (now - lastSpawnTime.current >= spawnInterval) {
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
      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [spawnParticle, prefersReduced]);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    isDraggingRef.current = true;
    setDragging(true);
    startAngle.current = getAngle(e.clientX, e.clientY);
    startRotation.current = rawRotation.get();
    lastPointerAngle.current = startAngle.current;
    angularVelocity.current = 0;
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDraggingRef.current) return;
    const currentAngle = getAngle(e.clientX, e.clientY);
    let delta = currentAngle - startAngle.current;
    if (delta > 180) delta -= 360;
    if (delta < -180) delta += 360;

    let frameDelta = currentAngle - lastPointerAngle.current;
    if (frameDelta > 180) frameDelta -= 360;
    if (frameDelta < -180) frameDelta += 360;
    angularVelocity.current = frameDelta;
    lastPointerAngle.current = currentAngle;

    rawRotation.set(startRotation.current + delta);

    const tiltDirection = Math.max(-8, Math.min(8, frameDelta * 2));
    tiltYValue.set(-5 + tiltDirection);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    setDragging(false);
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {}
    tiltYValue.set(-5);
    const currentRot = rawRotation.get();
    const targetWithMomentum = currentRot + angularVelocity.current * 4;
    const snapped = Math.round(targetWithMomentum / 90) * 90;
    rawRotation.set(snapped);
    for (let i = 0; i < (isMobile ? 6 : 12); i++) spawnParticle(true);
  };

  useEffect(() => {
    if (!section) return;
    const handleKeyDown = (e: KeyboardEvent) => {
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
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [section, activeIndex]);

  const stepDial = (direction: 1 | -1) => {
    const current = Math.round(rawRotation.get() / 90) * 90;
    const next = current + direction * -90;
    rawRotation.set(next);
    for (let i = 0; i < (isMobile ? 5 : 8); i++) spawnParticle(true);
  };

  const rotateToOption = (targetIndex: number) => {
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
    if (active.available) {
      onSelectOption(active.id, section);
      onClose();
    }
  };

  if (!section) return null;

  const activeOption = options[activeIndex];
  const ActiveIcon = activeOption.icon;
  const miniGearAngles = [0, 120, 240];

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

            {/* FIX 4: Perspective container 1200px */}
            <div
              className="gear-dial relative my-1 sm:my-2 size-[260px] sm:size-[320px] md:size-[340px] max-w-[85vw] max-h-[60vh] aspect-square shrink-0 m-auto"
              style={{ perspective: "1200px" }}
            >
              {/* FIX 3: COLOR-CHANGING HALO BEHIND GEAR */}
              <motion.div
                key={`halo-${activeOption.id}`}
                initial={{ opacity: 0.4 }}
                animate={{
                  opacity: dragging ? 0.72 : [0.4, 0.6, 0.4],
                  scale: dragging ? 1.08 : [1, 1.05, 1],
                }}
                transition={{
                  opacity: dragging
                    ? { duration: 0.2 }
                    : { duration: 2, repeat: Infinity, ease: "easeInOut" },
                  scale: dragging
                    ? { duration: 0.2 }
                    : { duration: 2, repeat: Infinity, ease: "easeInOut" },
                }}
                className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
                style={{
                  width: "120%",
                  height: "120%",
                  background: `radial-gradient(circle at center, ${activeOption.haloColor}, transparent 70%)`,
                  filter: isMobile ? "blur(20px)" : "blur(60px)",
                  transform: "translate(-50%, -50%) translateZ(-40px)",
                  transition: "background 300ms ease",
                  willChange: "transform, opacity",
                }}
              />

              {/* FIX 4: Glow from underneath - amber floating */}
              <div
                className="pointer-events-none absolute left-1/2 top-1/2 size-[115%] -translate-x-1/2 -translate-y-1/2 rounded-full"
                style={{
                  background: "radial-gradient(circle at center, rgba(245, 158, 11, 0.2), transparent 70%)",
                  transform: "translate(-50%, -50%) translateZ(-20px)",
                }}
              />

              {/* Fixed 12 o'clock Pointer */}
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

              {/* FIX 6: THREE MINI GEARS - navy body, amber teeth */}
              {miniGearAngles.map((angleDeg, idx) => {
                const rad = (angleDeg * Math.PI) / 180;
                const distancePct = isMobile ? 50.5 : 49.5;
                const leftPos = 50 + Math.cos(rad) * distancePct;
                const topPos = 50 + Math.sin(rad) * distancePct;
                const gearSize = isMobile ? 40 : 60;

                return (
                  <motion.div
                    key={`mini-gear-${angleDeg}`}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{
                      delay: 0.1 * idx,
                      type: "spring",
                      stiffness: 260,
                      damping: 20,
                    }}
                    style={{
                      position: "absolute",
                      top: `${topPos}%`,
                      left: `${leftPos}%`,
                      width: gearSize,
                      height: gearSize,
                      transform: "translate(-50%, -50%) translateZ(4px)",
                      rotate: miniGearRotation,
                      willChange: "transform",
                    }}
                    className="pointer-events-none z-20 drop-shadow-[0_4px_12px_rgba(0,0,0,0.5)]"
                  >
                    <svg viewBox="0 0 60 60" className="size-full">
                      {/* Teeth: amber #F59E0B */}
                      <path d={MINI_GEAR_PATH} fill="#F59E0B" stroke="#B45309" strokeWidth="1" />
                      {/* Body: navy #0F1B2D */}
                      <circle cx="30" cy="30" r="19" fill="#0F1B2D" stroke="#1A365D" strokeWidth="1" />
                      {/* Center hub: navy #1A365D */}
                      <circle cx="30" cy="30" r="8" fill="#1A365D" stroke="#F59E0B" strokeWidth="0.8" />
                      {/* Amber dot center */}
                      <circle cx="30" cy="30" r="3.2" fill="#F59E0B" />
                    </svg>
                  </motion.div>
                );
              })}

              {/* FIX 1 & 4: 3D GEAR CONTAINER with tilt */}
              <motion.div
                style={{
                  rotateX: 15,
                  rotateY: smoothTiltY,
                  transformStyle: "preserve-3d",
                }}
                className="relative size-full select-none"
              >
                {/* FIX 1 & 4: BACK LAYER - darker navy #0A1628 offset 4px down/right */}
                <div
                  className="pointer-events-none absolute inset-0 size-full"
                  style={{ transform: "translate3d(4px, 4px, -10px) scale(1.015)" }}
                >
                  <svg viewBox="0 0 340 340" className="size-full opacity-90 drop-shadow-[0_20px_40px_rgba(0,0,0,0.8)]">
                    <path d={MAIN_GEAR_PATH} fill="#0A1628" stroke="#050C16" strokeWidth="2.5" />
                    <circle cx="170" cy="170" r="142" fill="#0A1628" />
                  </svg>
                </div>

                {/* FIX 1: MIDDLE LAYER - Main Gear Body with 3D depth */}
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
                  className="relative size-full cursor-grab active:cursor-grabbing outline-none focus-visible:ring-4 focus-visible:ring-[#F59E0B]/50 rounded-full"
                  style={{
                    transformStyle: "preserve-3d",
                    transform: "translateZ(0px)",
                    willChange: "transform",
                    // FIX 4: Light and shadow - metallic 3D feel
                    boxShadow:
                      "inset 2px 2px 4px rgba(255, 255, 255, 0.1), inset -2px -2px 6px rgba(0, 0, 0, 0.5)",
                  }}
                >
                  <motion.div
                    style={{
                      rotate: rotation,
                      transformStyle: "preserve-3d",
                      willChange: "transform",
                    }}
                    className="relative size-full select-none"
                  >
                    {/* FIX 1: Gear SVG - navy body #0F1B2D with amber teeth #F59E0B */}
                    <svg viewBox="0 0 340 340" className="size-full drop-shadow-[0_16px_36px_rgba(0,0,0,0.65)]">
                      <defs>
                        <radialGradient id={`gear-face-grad-${id}`} cx="50%" cy="50%" r="50%">
                          <stop offset="0%" stopColor="#1A365D" />
                          <stop offset="60%" stopColor="#0F1B2D" />
                          <stop offset="85%" stopColor="#0A1628" />
                          <stop offset="100%" stopColor="#0F1B2D" />
                        </radialGradient>
                      </defs>

                      {/* Teeth: amber #F59E0B ONLY teeth, not body */}
                      <path d={MAIN_GEAR_PATH} fill="#F59E0B" stroke="#B45309" strokeWidth="1.2" />

                      {/* Body: dark navy #0F1B2D circular plate */}
                      <circle cx="170" cy="170" r="142" fill="#0F1B2D" stroke="#0F1B2D" strokeWidth="1" />

                      {/* FIX 1: Inner ring darker navy #0A1628 around icons */}
                      <circle cx="170" cy="170" r="115" fill="none" stroke="#0A1628" strokeWidth="14" strokeOpacity="0.9" />
                      <circle cx="170" cy="170" r="115" fill="none" stroke="#1A365D" strokeWidth="1" strokeOpacity="0.5" />

                      {/* Milled Tick Marks */}
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

                      {/* Inner Groove Track */}
                      <circle
                        cx="170"
                        cy="170"
                        r="70"
                        fill="none"
                        stroke="#F59E0B"
                        strokeWidth="1"
                        strokeDasharray="4 4"
                        strokeOpacity="0.25"
                      />

                      {/* FIX 1: Center hub - navy #1A365D with amber ring */}
                      <circle cx="170" cy="170" r="48" fill="#F59E0B" stroke="#B45309" strokeWidth="1.5" />
                      <circle cx="170" cy="170" r="38" fill="#1A365D" stroke="#0F1B2D" strokeWidth="1.5" />
                      <circle cx="170" cy="170" r="36" fill={`url(#gear-face-grad-${id})`} />

                      {/* Hub Rivets */}
                      {Array.from({ length: 6 }).map((_, i) => {
                        const boltAngle = (i * 60 * Math.PI) / 180;
                        const bx = 170 + 41 * Math.cos(boltAngle);
                        const by = 170 + 41 * Math.sin(boltAngle);
                        return <circle key={i} cx={bx} cy={by} r="2.5" fill="#FCD34D" stroke="#78350F" strokeWidth="0.8" />;
                      })}
                    </svg>

                    {/* Center Jewel */}
                    <div
                      className="pointer-events-none absolute inset-0 grid place-items-center"
                      style={{ transform: "translateZ(14px)" }}
                    >
                      <div
                        className="grid size-12 place-items-center rounded-full border border-amber-500/40 bg-gradient-to-br from-[#F59E0B] to-[#B45309] shadow-inner"
                        style={{ boxShadow: "0 0 22px rgba(245, 158, 11, 0.55)" }}
                      >
                        <RotateCw className="size-4 animate-spin text-[#0A1628] [animation-duration:12s]" />
                      </div>
                    </div>

                    {/* FIX 2: Option Badges with own colors */}
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
                          onPointerDown={(e) => e.stopPropagation()}
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
                            {/* Badge circle 56px with own color, white icon */}
                            <span
                              className={cn(
                                "grid size-14 place-items-center rounded-full shadow-lg transition-all duration-300 border-2",
                                !opt.available && "opacity-40 grayscale",
                              )}
                              style={{
                                background: opt.badgeBg,
                                borderColor: isActive ? "#FFFFFF" : "rgba(255,255,255,0.15)",
                                boxShadow: isActive ? opt.badgeGlow : "0 4px 12px rgba(0,0,0,0.4)",
                              }}
                            >
                              <OptIcon className="size-6 text-white" />
                            </span>
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

              {/* FIX 5: LIGHT PARTICLES CANVAS */}
              <canvas
                ref={canvasRef}
                width={isMobile ? 260 : 340}
                height={isMobile ? 260 : 340}
                className="pointer-events-none absolute inset-0 size-full z-30"
                style={{ transform: "translateZ(25px)" }}
              />
            </div>

            {/* FIX 7: Selected Label with color */}
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

            {/* FIX 8: Action Card & Button with selected color */}
            <div className="mt-3.5 w-full rounded-2xl border bg-[#0F1B2D] p-4 shadow-xl backdrop-blur-xl shrink-0 transition-colors duration-300"
                 style={{ borderColor: `${activeOption.labelColor}30` }}>
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
                      {activeOption.available ? activeOption.subtitle : "Not available for this unit"}
                    </p>
                  </div>
                </div>
                <span
                  className="rounded-full px-2.5 py-1 text-[10px] font-semibold tracking-wide uppercase border transition-colors duration-300"
                  style={{
                    borderColor: activeOption.available ? `${activeOption.labelColor}40` : "rgba(100,116,139,0.3)",
                    background: activeOption.available ? `${activeOption.labelColor}18` : "rgba(30,41,59,0.8)",
                    color: activeOption.available ? activeOption.labelColor : "#94A3B8",
                  }}
                >
                  {activeOption.available ? "Ready" : "Unavailable"}
                </span>
              </div>

              <button
                type="button"
                onClick={handleSelectActive}
                disabled={!activeOption.available}
                className={cn(
                  "mt-3.5 flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold shadow-lg transition-all",
                  activeOption.available
                    ? "cursor-pointer text-white hover:brightness-110 active:scale-[0.98]"
                    : "bg-[#1A365D]/50 text-[#FEF3C7]/30 border border-white/10 cursor-not-allowed",
                )}
                style={
                  activeOption.available
                    ? { background: activeOption.buttonGradient, color: "#FFFFFF", boxShadow: activeOption.badgeGlow }
                    : undefined
                }
              >
                <span>{activeOption.available ? `Open ${activeOption.label}` : `${activeOption.label} Unavailable`}</span>
                {activeOption.available ? <ArrowRight className="size-4 text-white" /> : null}
              </button>
            </div>
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  );
}
