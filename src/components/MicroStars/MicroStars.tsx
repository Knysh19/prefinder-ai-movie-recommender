// src/components/MicroStars/MicroStars.tsx
import React, { useEffect, useRef } from "react";

type Props = {
  count?: number;
  topMargin?: number;
  bottomMargin?: number;
  placeAboveVideo?: boolean;
};

type Star = {
  x: number;
  y: number;
  r: number;
  alpha: number;
};

export function MicroStars({
  count = 90,
  topMargin = 8,
  bottomMargin = 12,
  placeAboveVideo = false,
}: Props): JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const heroEl = canvas.closest(".hero") as HTMLElement | null;
    if (!heroEl) return;

    const headerEl = document.querySelector(
      ".site-header"
    ) as HTMLElement | null;
    const videoEl = heroEl.querySelector(
      ".hero__blackhole"
    ) as HTMLElement | null;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    /* ---------------- base canvas styles ---------------- */
    canvas.style.position = "absolute";
    canvas.style.left = "0";
    canvas.style.pointerEvents = "none";
    canvas.style.zIndex = placeAboveVideo ? "20" : "1";
    canvas.style.opacity = "0.55";

    const DPR = Math.min(window.devicePixelRatio || 1, 1.5);

    /* ---------------- layout bounds ---------------- */
    function computeBounds() {
      const heroRect = heroEl.getBoundingClientRect();
      const headerBottom = headerEl
        ? headerEl.getBoundingClientRect().bottom
        : heroRect.top;

      const startY = Math.max(0, headerBottom - heroRect.top + topMargin);

      const endY = Math.max(startY + 4, heroRect.height - bottomMargin);

      return {
        width: Math.floor(heroRect.width),
        height: Math.floor(endY - startY),
        top: Math.floor(startY),
      };
    }

    /* ---------------- star generation ---------------- */
    function createStars(w: number, h: number): Star[] {
      return Array.from({ length: count }).map(() => ({
        x: Math.random() * w,
        y: Math.random() * h,
        r: Math.random() * 1.6 + 0.4, // EXACT same size range
        alpha: 0.4 + Math.random() * 0.7,
      }));
    }

    /* ---------------- draw stars ---------------- */
    function drawStars(stars: Star[]) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (const s of stars) {
        // glow
        const glowR = s.r * 2.6;
        const g = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, glowR);
        g.addColorStop(0, `rgba(255,255,255,${s.alpha * 0.12})`);
        g.addColorStop(0.45, `rgba(255,255,255,${s.alpha * 0.05})`);
        g.addColorStop(1, "rgba(255,255,255,0)");
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(s.x, s.y, glowR, 0, Math.PI * 2);
        ctx.fill();

        // core
        ctx.fillStyle = `rgba(255,255,255,${s.alpha * 0.95})`;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r * 0.9, 0, Math.PI * 2);
        ctx.fill();

        // cross flares
        ctx.strokeStyle = `rgba(255,255,255,${s.alpha * 0.28})`;
        ctx.lineWidth = Math.max(0.25, s.r * 0.12);

        ctx.beginPath();
        ctx.moveTo(s.x - s.r * 3.2, s.y);
        ctx.lineTo(s.x + s.r * 3.2, s.y);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(s.x, s.y - s.r * 3.2);
        ctx.lineTo(s.x, s.y + s.r * 3.2);
        ctx.stroke();
      }
    }

    /* ---------------- resize & render ---------------- */
    function render() {
      const { width, height, top } = computeBounds();

      canvas.style.top = `${top}px`;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      canvas.width = Math.max(1, Math.floor(width * DPR));
      canvas.height = Math.max(1, Math.floor(height * DPR));
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);

      const stars = createStars(width, height);
      drawStars(stars);
    }

    render();

    const onResize = () => {
      clearTimeout((onResize as any)._t);
      (onResize as any)._t = setTimeout(render, 120);
    };

    window.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener("resize", onResize);
    };
  }, [count, topMargin, bottomMargin, placeAboveVideo]);

  return <canvas ref={canvasRef} aria-hidden="true" />;
}
