"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Captions, CaptionsOff, ExternalLink, Gauge, RotateCcw } from "lucide-react";

import { cn } from "@/lib/utils";
import { aparatEmbedUrl, parseVideo, youtubeEmbedUrl } from "@/lib/video";

/** Rates the YouTube player documents as supported. */
const RATES = [0.5, 0.75, 1, 1.25, 1.5, 2];

const YOUTUBE_ORIGIN = "https://www.youtube-nocookie.com";

/**
 * An embedded lesson player.
 *
 * Speed is driven through the YouTube iframe postMessage API
 * (`setPlaybackRate`, rates 0.5–2 per the IFrame Player reference) — no extra
 * third-party script is loaded. Captions are requested with `cc_load_policy`,
 * which YouTube only honours when the iframe is created, so toggling them
 * remounts the player and resumes from the last position we saw.
 *
 * Every unit also keeps a plain "open in a new tab" link, so nothing depends on
 * the embed working.
 */
export function VideoPlayer({
  url,
  unitTitle,
}: {
  url: string;
  unitTitle: string;
}) {
  const target = parseVideo(url);
  const frameRef = useRef<HTMLIFrameElement>(null);
  const [rate, setRate] = useState(1);
  const [captions, setCaptions] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  /** Bumped to force a clean remount (captions toggle / restart). */
  const [mountId, setMountId] = useState(0);
  const [startAt, setStartAt] = useState(0);

  const send = useCallback((func: string, args: unknown[] = []) => {
    frameRef.current?.contentWindow?.postMessage(
      JSON.stringify({ event: "command", func, args }),
      YOUTUBE_ORIGIN,
    );
  }, []);

  // Ask the player for position updates so a remount can resume where we were.
  useEffect(() => {
    // Listen for pause-video events from the audio player
    const handlePauseVideo = () => {
      send("pauseVideo");
    };
    window.addEventListener("basirshelf:pause-video", handlePauseVideo);

    if (target?.kind !== "youtube") {
      return () => {
        window.removeEventListener("basirshelf:pause-video", handlePauseVideo);
      };
    }

    const onMessage = (event: MessageEvent) => {
      if (typeof event.origin !== "string" || !event.origin.includes("youtube")) {
        return;
      }
      let payload: unknown;
      try {
        payload = JSON.parse(typeof event.data === "string" ? event.data : "");
      } catch {
        return;
      }
      const data = payload as {
        event?: string;
        infoDelivery?: { currentTime?: number; playerState?: number };
      };
      if (data.event === "infoDelivery") {
        const time = data.infoDelivery?.currentTime;
        if (typeof time === "number" && time > 0) setCurrentTime(time);
        // Player state 1 is PLAYING in YouTube iframe API
        if (data.infoDelivery?.playerState === 1) {
          window.dispatchEvent(new CustomEvent("basirshelf:pause-audio"));
        }
      }
    };

    window.addEventListener("message", onMessage);
    const frame = frameRef.current;
    const handshake = () =>
      frame?.contentWindow?.postMessage(
        JSON.stringify({ event: "listening", id: 1, channel: "widget" }),
        YOUTUBE_ORIGIN,
      );
    handshake();
    const interval = window.setInterval(handshake, 1000);

    return () => {
      window.removeEventListener("basirshelf:pause-video", handlePauseVideo);
      window.removeEventListener("message", onMessage);
      window.clearInterval(interval);
    };
  }, [target?.kind, mountId, send]);

  // Re-apply the chosen rate after (re)mounting.
  useEffect(() => {
    if (target?.kind !== "youtube") return;
    const timeout = window.setTimeout(() => {
      send("setPlaybackRate", [rate]);
    }, 900);
    return () => window.clearTimeout(timeout);
  }, [target?.kind, mountId, rate, send]);

  if (!target) return null;

  const embeddable = target.kind === "youtube" || target.kind === "aparat";

  if (!embeddable || !target.id) {
    return (
      <p className="rounded-xl border border-border bg-background px-4 py-3 text-xs leading-6 text-muted-foreground">
        This lesson is hosted on {target.provider} and cannot be embedded here.{" "}
        <a
          href={target.url}
          target="_blank"
          rel="noopener noreferrer"
          className="font-semibold text-indigo-text underline underline-offset-4 hover:text-indigo dark:text-indigo"
        >
          Open the video on {target.provider}
          <ExternalLink className="ms-1 inline size-3" aria-hidden="true" />
        </a>
      </p>
    );
  }

  const src =
    target.kind === "youtube"
      ? youtubeEmbedUrl(target.id, { captions, start: startAt })
      : aparatEmbedUrl(target.id);

  return (
    <div className="space-y-3">
      <div className="aspect-video w-full overflow-hidden rounded-xl border border-border bg-navy shadow-soft">
        <iframe
          key={mountId}
          ref={frameRef}
          src={src}
          title={`Video lesson: ${unitTitle}`}
          loading="lazy"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          className="size-full"
        />
      </div>

      {target.kind === "youtube" ? (
        <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
              <Gauge className="size-3.5 text-indigo-text dark:text-indigo" aria-hidden="true" />
              Speed
            </span>
            <div
              role="group"
              aria-label="Playback speed"
              className="flex items-center gap-0.5 rounded-full border border-border bg-card p-0.5"
            >
              {RATES.map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => {
                    setRate(value);
                    send("setPlaybackRate", [value]);
                  }}
                  aria-pressed={rate === value}
                  className={cn(
                    "num-latin rounded-full px-2 py-1 text-[11px] font-semibold transition-all duration-300",
                    "focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
                    rate === value
                      ? "bg-navy text-navy-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground",
                  )}
                >
                  {value}×
                </button>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              // cc_load_policy is only read when the iframe is created, so the
              // player is remounted and resumes from where the student was.
              setStartAt(currentTime);
              setCaptions((v) => !v);
              setMountId((n) => n + 1);
            }}
            aria-pressed={captions}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-semibold transition-all duration-300",
              "focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
              captions
                ? "border-indigo/50 bg-accent text-indigo-text dark:text-indigo"
                : "border-border bg-card text-muted-foreground hover:bg-accent hover:text-foreground",
            )}
          >
            {captions ? (
              <Captions className="size-3.5" aria-hidden="true" />
            ) : (
              <CaptionsOff className="size-3.5" aria-hidden="true" />
            )}
            Captions {captions ? "on" : "off"}
          </button>

          <button
            type="button"
            onClick={() => {
              setStartAt(0);
              setCurrentTime(0);
              setMountId((n) => n + 1);
            }}
            className="inline-flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground underline-offset-4 transition-colors duration-300 hover:text-foreground hover:underline"
          >
            <RotateCcw className="size-3.5" aria-hidden="true" />
            Restart lesson
          </button>

          <a
            href={target.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-indigo-text underline-offset-4 transition-colors duration-300 hover:underline dark:text-indigo"
          >
            Open on YouTube
            <ExternalLink className="size-3.5" aria-hidden="true" />
          </a>
        </div>
      ) : (
        <a
          href={target.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-indigo-text underline-offset-4 transition-colors duration-300 hover:underline dark:text-indigo"
        >
          Open on Aparat for full playback controls
          <ExternalLink className="size-3.5" aria-hidden="true" />
        </a>
      )}
    </div>
  );
}
