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

// Mechanical 24-Teeth Main Gear Outline SVG Path (Computed for 340x340 viewBox, center 170,170)
const MAIN_GEAR_PATH = (() => {
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

// Mechanical 12-Teeth Mini Gear Outline SVG Path (Computed for 60x60 viewBox, center 30,30)
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
  } catch {
    // Ignore audio restriction errors
  }
}

// Subtle mechanical gear whir sound (low volume 5%)
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

    gain.gain.setValueAtTime(0.05, ctx.currentTime); // 5% volume
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.045);
    setTimeout(() => ctx.close().catch(() => {}), 150);
  } catch {
    // Ignore audio restriction errors
  }
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

  // Responsive state
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    setIsMobile(window.innerWidth < 640);
    const handleResize = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Available media flags
  const rawImages = section?.images_url || section?.image_url;
  const hasImages = Boolean(rawImages && rawImages.trim().length > 0);
  const hasVideo = Boolean(section?.video_url && section.video_url.trim().length > 0);
  const hasAudio = Boolean(section?.audio_url && section.audio_url.trim().length > 0);
  const hasHandout = Boolean(section?.handout_url && section.handout_url.trim().length > 0);

  // 4 Cardinal Media Options positioned at 90° intervals:
  // Feature 4: Color mapping for halo
  // - Video: warm red rgba(239, 68, 68, 0.4)
  // - Audio: purple rgba(139, 92, 246, 0.4)
  // - PDF: blue rgba(59, 130, 246, 0.4)
  // - Images: green rgba(16, 185, 129, 0.4)
  const options = [
    {
      id: "video" as const,
      label: "Video",
      subtitle: "Watch lesson video",
      icon: Play,
      baseAngle: 0, // Top / 12 o'clock
      color: "#F59E0B",
      haloColor: "rgba(239, 68, 68, 0.4)",
      available: hasVideo,
    },
    {
      id: "audio" as const,
      label: "Audio",
      subtitle: "Listen to audio lesson",
      icon: Headphones,
      baseAngle: 90, // Right / 3 o'clock
      color: "#F59E0B",
      haloColor: "rgba(139, 92, 246, 0.4)",
      available: hasAudio,
    },
    {
      id: "images" as const,
      label: "Images",
      subtitle: "Open image gallery",
      icon: ImageIcon,
      baseAngle: 180, // Bottom / 6 o'clock
      color: "#F59E0B",
      haloColor: "rgba(16, 185, 129, 0.4)",
      available: hasImages,
    },
    {
      id: "pdf" as const,
      label: "PDF",
      subtitle: "Read lesson handout",
      icon: FileText,
      baseAngle: 270, // Left / 9 o'clock
      color: "#F59E0B",
      haloColor: "rgba(59, 130, 246, 0.4)",
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
  const counterRotation = useTransform(rotation, (val) => -val);

  // FEATURE 1: 3D PARALLAX TILT
  // At rest: rotateX(15deg) rotateY(-5deg)
  // On drag: parallax tilt rotateY extends to ±8deg based on drag direction
  const tiltYValue = useMotionValue(-5);
  const smoothTiltY = useSpring(tiltYValue, { stiffness: 220, damping: 20 });

  // FEATURE 2: MINI GEAR ROTATION
  // Mini gear speed = main gear speed * 1.5, in the OPPOSITE direction (counter-clockwise)
  // Plus slow continuous idle rotation (1 rotation per 30 seconds = 12 deg/s)
  const idleRotation = useMotionValue(0);
  useEffect(() => {
    if (prefersReduced) return;
    let lastTime = performance.now();
    let animId: number;
    const animateIdle = (now: number) => {
      const dt = (now - lastTime) / 1000;
      lastTime = now;
      // 1 full turn every 30s = 12 deg/s
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

  // Dragging state
  const [dragging, setDragging] = useState(false);
  const isDraggingRef = useRef(false);
  const startAngle = useRef(0);
  const startRotation = useRef(0);
  const lastPointerAngle = useRef(0);
  const angularVelocity = useRef(0);

  // FEATURE 3: PARTICLES & SPARKS REFS
  const particlesRef = useRef<Particle[]>([]);
  const sparksRef = useRef<Spark[]>([]);
  const nextParticleId = useRef(0);
  const lastSpawnTime = useRef(0);

  // Update active index whenever rotation changes
  useEffect(() => {
    const unsubscribe = rotation.on("change", (latest) => {
      // Normalize angle to [0, 360)
      const normalized = (((-latest % 360) + 360) % 360);
      const index = Math.round(normalized / 90) % 4;

      setActiveIndex((prev) => {
        if (prev !== index) {
          playMechanicalTick(true);
          playMechanicalWhir();
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
  }, [rotation]);

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

  // Spawn a particle from the gear perimeter flying toward the top selected icon
  const spawnParticle = useCallback((isBurst = false) => {
    if (prefersReduced || !dialRef.current) return;
    const maxParticles = isMobile ? 15 : 30;
    if (particlesRef.current.length >= maxParticles && !isBurst) return;

    const rect = dialRef.current.getBoundingClientRect();
    const cx = rect.width / 2;
    const cy = rect.height / 2;
    const rOuter = (rect.width / 2) * 0.94; // Gear perimeter

    // Target is the top 12 o'clock badge position
    const targetX = cx;
    const targetY = cy - (rect.width / 2) * 0.62;

    // Random point along outer edge (or upper perimeter for burst)
    const angle = isBurst
      ? -Math.PI / 2 + (Math.random() - 0.5) * 1.4
      : Math.random() * Math.PI * 2;

    const x = cx + Math.cos(angle) * rOuter;
    const y = cy + Math.sin(angle) * rOuter;

    const dx = targetX - x;
    const dy = targetY - y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const speed = isBurst ? 220 + Math.random() * 100 : 130 + Math.random() * 80;

    particlesRef.current.push({
      id: nextParticleId.current++,
      x,
      y,
      vx: (dx / dist) * speed,
      vy: (dy / dist) * speed,
      size: 2 + Math.random() * 2, // 2-4px diameter
      opacity: 0.8 + Math.random() * 0.2,
      targetX,
      targetY,
      isBurst,
    });
  }, [isMobile, prefersReduced]);

  // Particle canvas animation loop
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

          // Periodic spawn: 3-5/sec when dragging (every ~250ms), 1/sec idle (~1000ms)
          const spawnInterval = isDraggingRef.current ? 220 : 1000;
          if (now - lastSpawnTime.current >= spawnInterval) {
            lastSpawnTime.current = now;
            spawnParticle(false);
          }

          // Update & draw particles
          const particles = particlesRef.current;
          for (let i = particles.length - 1; i >= 0; i--) {
            const p = particles[i];
            p.x += p.vx * dt;
            p.y += p.vy * dt;

            // Distance to target
            const dx = p.targetX - p.x;
            const dy = p.targetY - p.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            // Fade out as it nears target
            if (dist < 24) {
              p.opacity -= dt * 4;
            }

            if (p.opacity <= 0 || dist < 12) {
              // Spark on arrival
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

            // Draw glowing particle
            ctx.save();
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size / 2, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(251, 191, 36, ${p.opacity.toFixed(2)})`;
            ctx.shadowColor = "rgba(245, 158, 11, 0.75)";
            ctx.shadowBlur = 6;
            ctx.fill();
            ctx.restore();
          }

          // Update & draw sparks
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
            ctx.lineWidth = 1;
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

    // Handle wrapping around 180 / -180 boundary
    if (delta > 180) delta -= 360;
    if (delta < -180) delta += 360;

    let frameDelta = currentAngle - lastPointerAngle.current;
    if (frameDelta > 180) frameDelta -= 360;
    if (frameDelta < -180) frameDelta += 360;
    angularVelocity.current = frameDelta;
    lastPointerAngle.current = currentAngle;

    rawRotation.set(startRotation.current + delta);

    // Feature 1 Parallax Tilt on Drag: tilt toward drag direction (-5deg resting, tilting to ±8deg)
    const tiltDirection = Math.max(-8, Math.min(8, frameDelta * 2));
    tiltYValue.set(-5 + tiltDirection);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    setDragging(false);
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      // Ignore
    }

    // Reset 3D tilt back to resting -5deg
    tiltYValue.set(-5);

    // Inertia & snap to nearest 90-degree detent
    const currentRot = rawRotation.get();
    const targetWithMomentum = currentRot + angularVelocity.current * 4;
    const snapped = Math.round(targetWithMomentum / 90) * 90;
    rawRotation.set(snapped);

    // Feature 3 Confirmation burst on snap
    for (let i = 0; i < (isMobile ? 6 : 12); i++) {
      spawnParticle(true);
    }
  };

  // Keyboard accessibility
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
    const next = current + direction * -90;
    rawRotation.set(next);

    // Trigger confirmation burst
    for (let i = 0; i < (isMobile ? 5 : 8); i++) {
      spawnParticle(true);
    }
  };

  const rotateToOption = (targetIndex: number) => {
    const currentRot = rawRotation.get();
    const currentNorm = (((-currentRot % 360) + 360) % 360);
    const currentIndex = Math.round(currentNorm / 90) % 4;

    let diff = targetIndex - currentIndex;
    if (diff > 2) diff -= 4;
    if (diff < -2) diff += 4;

    rawRotation.set(currentRot - diff * 90);

    for (let i = 0; i < (isMobile ? 5 : 8); i++) {
      spawnParticle(true);
    }
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

  // Orbiting Mini Gears angles: 0°, 120°, 240°
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

            {/* Gear Dial Area - 3D Perspective Container */}
            <div
              className="gear-dial relative my-1 sm:my-2 size-[260px] sm:size-[320px] md:size-[340px] max-w-[85vw] max-h-[60vh] aspect-square shrink-0 m-auto"
              style={{
                perspective: "1200px",
              }}
            >
              {/* FEATURE 4: COLOR-CHANGING HALO (pulses 0.3 -> 0.5, intensifies +20% on drag) */}
              <motion.div
                key={`halo-${activeOption.id}`}
                initial={{ opacity: 0.3 }}
                animate={{
                  opacity: dragging ? 0.7 : [0.32, 0.52, 0.32],
                  scale: dragging ? 1.06 : [1, 1.03, 1],
                }}
                transition={{
                  opacity: dragging ? { duration: 0.2 } : { duration: 2, repeat: Infinity, ease: "easeInOut" },
                  scale: dragging ? { duration: 0.2 } : { duration: 2, repeat: Infinity, ease: "easeInOut" },
                }}
                className="pointer-events-none absolute -inset-6 sm:-inset-10 rounded-full transition-colors duration-300"
                style={{
                  background: `radial-gradient(circle at center, ${activeOption.haloColor}, transparent 70%)`,
                  filter: isMobile ? "blur(20px)" : "blur(40px)",
                  transform: "translateZ(-40px)",
                }}
              />

              {/* FEATURE 1-5: GLOW FROM UNDERNEATH (radial amber glow floating under gear) */}
              <div
                className="pointer-events-none absolute -inset-4 sm:-inset-6 rounded-full"
                style={{
                  background: "radial-gradient(circle at center, rgba(245, 158, 11, 0.22), transparent 70%)",
                  transform: "translateZ(-20px)",
                }}
              />

              {/* Fixed 12 o'clock Top Pointer / Marker with Amber Glow */}
              <div
                className="pointer-events-none absolute -top-3.5 left-1/2 z-40 flex -translate-x-1/2 flex-col items-center"
                aria-hidden="true"
                style={{
                  transform: "translateX(-50%) translateZ(30px)",
                }}
              >
                <div
                  className="size-0 border-x-[11px] border-x-transparent border-t-[16px] transition-all"
                  style={{
                    borderTopColor: "#F59E0B",
                    filter: "drop-shadow(0 0 12px rgba(245, 158, 11, 0.75))",
                  }}
                />
                <div className="h-2.5 w-0.5 rounded-full bg-[#F59E0B]" />
              </div>

              {/* FEATURE 2: THREE ORBITING COUNTER-ROTATING MINI GEARS */}
              {miniGearAngles.map((angleDeg, idx) => {
                const rad = (angleDeg * Math.PI) / 180;
                // Distance from center to mesh tightly just outside the main gear teeth
                const distancePct = isMobile ? 50.5 : 49.5; // percent from center
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
                      {/* Mini gear teeth in amber */}
                      <path
                        d={MINI_GEAR_PATH}
                        fill="url(#mini-gear-teeth-grad)"
                        stroke="#F59E0B"
                        strokeWidth="1.2"
                      />
                      {/* Mini gear navy body */}
                      <circle
                        cx="30"
                        cy="30"
                        r="20"
                        fill="#0F1B2D"
                        stroke="#F59E0B"
                        strokeWidth="1.2"
                      />
                      {/* Center axle & hub rivet */}
                      <circle
                        cx="30"
                        cy="30"
                        r="8"
                        fill="#1A365D"
                        stroke="#F59E0B"
                        strokeWidth="1"
                      />
                      <circle
                        cx="30"
                        cy="30"
                        r="3"
                        fill="#FCD34D"
                        stroke="#78350F"
                        strokeWidth="0.75"
                      />
                    </svg>
                  </motion.div>
                );
              })}

              {/* FEATURE 1: 3D GEAR CONTAINER (tilt at rest: rotateX 15deg, rotateY -5deg; drag parallax) */}
              <motion.div
                style={{
                  rotateX: 15,
                  rotateY: smoothTiltY,
                  transformStyle: "preserve-3d",
                }}
                className="relative size-full select-none"
              >
                {/* FEATURE 1-2: BACK LAYER - 3D Thickness (slightly larger, dark navy #0A1628 offset by 4px down/right) */}
                <div
                  className="pointer-events-none absolute inset-0 size-full"
                  style={{
                    transform: "translate3d(4px, 4px, -10px) scale(1.015)",
                  }}
                >
                  <svg viewBox="0 0 340 340" className="size-full opacity-90 drop-shadow-[0_20px_40px_rgba(0,0,0,0.8)]">
                    <path
                      d={MAIN_GEAR_PATH}
                      fill="#0A1628"
                      stroke="#050C16"
                      strokeWidth="2.5"
                    />
                  </svg>
                </div>

                {/* FEATURE 1-2 & 1-3: MIDDLE LAYER - Main Gear Body with Light & Shadow Inset Highlighting */}
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
                    boxShadow:
                      "inset 2px 2px 4px rgba(255, 255, 255, 0.12), inset -2px -2px 6px rgba(0, 0, 0, 0.45)",
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
                    {/* Mechanical Main Gear SVG */}
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

                        {/* Mini Gear Teeth Gradient */}
                        <linearGradient id="mini-gear-teeth-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#FBBF24" />
                          <stop offset="50%" stopColor="#F59E0B" />
                          <stop offset="100%" stopColor="#B45309" />
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
                        d={MAIN_GEAR_PATH}
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

                    {/* FEATURE 1-2: FRONT LAYER - Center Jewel / Dial Core (translateZ 14px) */}
                    <div
                      className="pointer-events-none absolute inset-0 grid place-items-center"
                      style={{ transform: "translateZ(14px)" }}
                    >
                      <div
                        className="grid size-12 place-items-center rounded-full border border-amber-500/40 bg-gradient-to-br from-[#F59E0B] to-[#B45309] shadow-inner transition-colors"
                        style={{
                          boxShadow: "0 0 22px rgba(245, 158, 11, 0.55)",
                        }}
                      >
                        <RotateCw className="size-4 animate-spin text-[#0A1628] [animation-duration:12s]" />
                      </div>
                    </div>

                    {/* FEATURE 1-2: FRONT LAYER - Option Badges (translateZ 14px) */}
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
                            transform: "translate(-50%, -50%) translateZ(16px)",
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
                                ? "0 0 26px rgba(245, 158, 11, 0.5), 0 6px 16px rgba(0,0,0,0.6)"
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
              </motion.div>

              {/* FEATURE 3: LIGHT PARTICLES CANVAS OVERLAY */}
              <canvas
                ref={canvasRef}
                width={isMobile ? 260 : 340}
                height={isMobile ? 260 : 340}
                className="pointer-events-none absolute inset-0 size-full z-30"
                style={{
                  transform: "translateZ(25px)",
                }}
              />
            </div>

            {/* Quick Step Buttons (< >) */}
            <div className="flex items-center gap-3 mt-6 sm:mt-7 shrink-0 z-30">
              <button
                type="button"
                onClick={() => stepDial(-1)}
                aria-label="Previous option"
                className="grid size-9 place-items-center rounded-full border border-amber-500/30 bg-[#0F1B2D] text-[#FEF3C7] hover:bg-amber-500/20 hover:text-[#FCD34D] transition-colors cursor-pointer"
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
                className="grid size-9 place-items-center rounded-full border border-amber-500/30 bg-[#0F1B2D] text-[#FEF3C7] hover:bg-amber-500/20 hover:text-[#FCD34D] transition-colors cursor-pointer"
              >
                <ChevronRight className="size-4" />
              </button>
            </div>

            {/* Selected Action Card & Select Button */}
            <div className="mt-3.5 w-full rounded-2xl border border-amber-500/30 bg-[#0F1B2D] p-4 shadow-xl backdrop-blur-xl shrink-0">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="grid size-11 shrink-0 place-items-center rounded-xl text-[#0A1628] bg-[#F59E0B] shadow-lg transition-transform">
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
