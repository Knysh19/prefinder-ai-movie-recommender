// src/components/MicroStars/MicroStars.tsx
import { useEffect, useRef } from "react";

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
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const heroEl = canvas.closest(".hero") as HTMLElement | null;
    if (!heroEl) return;

    const headerEl = document.querySelector(
      ".site-header"
    ) as HTMLElement | null;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const hero = heroEl;
    const drawingCanvas = canvas;
    const context = ctx;

    /* ---------------- base canvas styles ---------------- */
    drawingCanvas.style.position = "absolute";
    drawingCanvas.style.left = "0";
    drawingCanvas.style.pointerEvents = "none";
    drawingCanvas.style.zIndex = placeAboveVideo ? "20" : "1";
    drawingCanvas.style.opacity = "0.55";

    const DPR = Math.min(window.devicePixelRatio || 1, 1.5);

    /* ---------------- layout bounds ---------------- */
    function computeBounds() {
      const heroRect = hero.getBoundingClientRect();
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
      context.clearRect(0, 0, drawingCanvas.width, drawingCanvas.height);

      for (const s of stars) {
        // glow
        const glowR = s.r * 2.6;
        const g = context.createRadialGradient(s.x, s.y, 0, s.x, s.y, glowR);
        g.addColorStop(0, `rgba(255,255,255,${s.alpha * 0.12})`);
        g.addColorStop(0.45, `rgba(255,255,255,${s.alpha * 0.05})`);
        g.addColorStop(1, "rgba(255,255,255,0)");
        context.fillStyle = g;
        context.beginPath();
        context.arc(s.x, s.y, glowR, 0, Math.PI * 2);
        context.fill();

        // core
        context.fillStyle = `rgba(255,255,255,${s.alpha * 0.95})`;
        context.beginPath();
        context.arc(s.x, s.y, s.r * 0.9, 0, Math.PI * 2);
        context.fill();

        // cross flares
        context.strokeStyle = `rgba(255,255,255,${s.alpha * 0.28})`;
        context.lineWidth = Math.max(0.25, s.r * 0.12);

        context.beginPath();
        context.moveTo(s.x - s.r * 3.2, s.y);
        context.lineTo(s.x + s.r * 3.2, s.y);
        context.stroke();

        context.beginPath();
        context.moveTo(s.x, s.y - s.r * 3.2);
        context.lineTo(s.x, s.y + s.r * 3.2);
        context.stroke();
      }
    }

    /* ---------------- resize & render ---------------- */
    function render() {
      const { width, height, top } = computeBounds();

      drawingCanvas.style.top = `${top}px`;
      drawingCanvas.style.width = `${width}px`;
      drawingCanvas.style.height = `${height}px`;

      drawingCanvas.width = Math.max(1, Math.floor(width * DPR));
      drawingCanvas.height = Math.max(1, Math.floor(height * DPR));
      context.setTransform(DPR, 0, 0, DPR, 0, 0);

      const stars = createStars(width, height);
      drawStars(stars);
    }

    render();

    let resizeTimer: ReturnType<typeof setTimeout> | undefined;
    const onResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(render, 120);
    };

    window.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener("resize", onResize);
      clearTimeout(resizeTimer);
    };
  }, [count, topMargin, bottomMargin, placeAboveVideo]);

  return <canvas ref={canvasRef} aria-hidden="true" />;
}
