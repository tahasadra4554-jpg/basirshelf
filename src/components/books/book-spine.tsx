"use client";

import { motion } from "framer-motion";

interface BookSpineProps {
  title: string;
  author?: string;
  color: string;
  width?: number | string;
  height?: number | string;
  onClick?: () => void;
  isSelected?: boolean;
}

/**
 * Premium realistic 3D book spine
 * Mimics the API of `react-book-spine` (which does not exist on npm)
 * Provides: rounded curve, gradient light→dark, horizontal bands, rotated title, soft shadow
 */
export function BookSpine({
  title,
  author = "Basir Institute",
  color,
  width = 60,
  height = 320,
  onClick,
  isSelected = false,
}: BookSpineProps) {
  const w = typeof width === "number" ? `${width}px` : width;
  const h = typeof height === "number" ? `${height}px` : height;

  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={{ y: -6 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className="group relative flex shrink-0 flex-col items-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F59E0B] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0A1628]"
      style={{ WebkitTapHighlightColor: "transparent" }}
      aria-label={`Open ${title}`}
      data-spine
    >
      {/* Spine body */}
      <div
        className="relative flex select-none items-center justify-center overflow-hidden"
        style={{
          backgroundColor: color,
          width: w,
          height: h,
          borderRadius: "4px",
          // Subtle rounded curve + 3D lighting
          boxShadow: `
            inset 4px 0 8px rgba(255,255,255,0.15),
            inset -4px 0 8px rgba(0,0,0,0.35),
            inset 0 1px 0 rgba(255,255,255,0.18),
            inset 0 -1px 0 rgba(0,0,0,0.45),
            0 8px 16px rgba(0,0,0,0.4),
            0 3px 6px rgba(0,0,0,0.3)
          `,
          // Gradient lighter left → darker right + slight bulge
          backgroundImage: `linear-gradient(90deg,
            rgba(255,255,255,0.18) 0%,
            rgba(255,255,255,0.08) 12%,
            rgba(255,255,255,0.03) 22%,
            transparent 32%,
            transparent 68%,
            rgba(0,0,0,0.06) 78%,
            rgba(0,0,0,0.16) 88%,
            rgba(0,0,0,0.28) 100%
          )`,
        }}
      >
        {/* Top / bottom darker edge lines */}
        <div className="absolute left-0 right-0 top-0 h-[1px] bg-black/45" />
        <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-black/60" />

        {/* Horizontal bands – top and bottom (real book decorative bands) */}
        <div
          className="absolute left-[6%] right-[6%] h-[3px] rounded-full"
          style={{
            top: "10%",
            background: `linear-gradient(90deg, transparent, rgba(0,0,0,0.35), transparent)`,
            boxShadow: "0 1px 0 rgba(255,255,255,0.1)",
          }}
        />
        <div
          className="absolute left-[6%] right-[6%] h-[2px] rounded-full"
          style={{
            top: "13.5%",
            background: "rgba(0,0,0,0.22)",
          }}
        />
        <div
          className="absolute left-[6%] right-[6%] h-[3px] rounded-full"
          style={{
            bottom: "10%",
            background: `linear-gradient(90deg, transparent, rgba(0,0,0,0.35), transparent)`,
            boxShadow: "0 1px 0 rgba(255,255,255,0.08)",
          }}
        />
        <div
          className="absolute left-[6%] right-[6%] h-[2px] rounded-full"
          style={{
            bottom: "13.5%",
            background: "rgba(0,0,0,0.22)",
          }}
        />

        {/* Middle subtle band */}
        <div
          className="absolute left-[10%] right-[10%] h-[1px] rounded-full opacity-60"
          style={{
            top: "50%",
            background: "rgba(0,0,0,0.18)",
          }}
        />

        {/* Amber/gold publisher label areas */}
        <div
          className="absolute left-1/2 top-[26px] h-[8px] w-[24px] -translate-x-1/2 rounded-[2px]"
          style={{
            background: "linear-gradient(180deg, #FCD34D 0%, #F59E0B 100%)",
            boxShadow: "0 1px 4px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.5)",
          }}
        />
        <div
          className="absolute bottom-[26px] left-1/2 h-[7px] w-[22px] -translate-x-1/2 rounded-[2px]"
          style={{
            background: "linear-gradient(180deg, #FCD34D 0%, #D97706 100%)",
            boxShadow: "0 1px 3px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.4)",
          }}
        />

        {/* Title + Author vertical */}
        <div
          className="relative z-10 flex flex-col items-center"
          style={{
            writingMode: "vertical-rl",
            textOrientation: "mixed",
            transform: "rotate(180deg)",
            gap: "8px",
            marginTop: "8px",
          }}
        >
          <span
            className="font-serif font-bold leading-none tracking-wide"
            style={{
              color: "#FDFBF7",
              fontSize: "16px",
              letterSpacing: "0.5px",
              textShadow: "0 1px 3px rgba(0,0,0,0.65), 0 0 1px rgba(0,0,0,0.8)",
              fontFamily: "Playfair Display, Lora, Georgia, serif",
              maxHeight: "44%",
              overflow: "hidden",
              whiteSpace: "nowrap",
              textOverflow: "ellipsis",
            }}
          >
            {title}
          </span>
          <span
            className="font-sans text-[10px] font-medium tracking-wider"
            style={{
              color: "rgba(253,251,247,0.7)",
              letterSpacing: "0.8px",
              textShadow: "0 1px 2px rgba(0,0,0,0.6)",
            }}
          >
            {author}
          </span>
        </div>

        {/* Hover amber glow */}
        <div className="pointer-events-none absolute inset-0 rounded-[4px] border border-transparent transition-all duration-300 group-hover:border-amber-400/50 group-hover:shadow-[0_0_24px_rgba(245,158,11,0.45),inset_0_0_12px_rgba(245,158,11,0.12)]" />

        {/* Texture overlay – subtle fabric texture */}
        <div
          className="pointer-events-none absolute inset-0 rounded-[4px] opacity-[0.04] mix-blend-overlay"
          style={{
            backgroundImage: `repeating-linear-gradient(0deg, transparent 0px, transparent 1px, rgba(0,0,0,0.8) 1px, transparent 2px)`,
          }}
        />
      </div>

      {/* Shadow on shelf – below each spine */}
      <div
        className="pointer-events-none mt-[5px] h-[12px] w-[48px] rounded-full bg-black/45 blur-[5px] transition-all duration-300 group-hover:h-[14px] group-hover:w-[54px] group-hover:bg-black/60 group-hover:blur-[6px]"
        aria-hidden="true"
      />
    </motion.button>
  );
}
