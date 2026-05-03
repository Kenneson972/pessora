import { useEffect, useRef, useState, useCallback } from 'react';

const pad = (n: number) => String(n).padStart(4, '0');

interface ScrollFrameHeroProps {
  wrapperRef: React.RefObject<HTMLDivElement | null>;
  onProgress?: (progress: number) => void;
  children?: React.ReactNode;
  /** Une seule frame + pas de scrub au scroll (OS « Réduire les animations »). */
  reducedMotion?: boolean;
}

export default function ScrollFrameHero({
  wrapperRef,
  onProgress,
  children,
  reducedMotion = false,
}: ScrollFrameHeroProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadProgress, setLoadProgress] = useState(0);

  const framesRef = useRef<HTMLImageElement[]>([]);
  const totalFramesRef = useRef(0);
  const currentFrameIndexRef = useRef(-1);
  const lastProgressRef = useRef(0);

  useEffect(() => {
    if (reducedMotion) {
      let cancelled = false;
      const img = new Image();
      img.onload = () => {
        if (cancelled) return;
        framesRef.current = [img];
        totalFramesRef.current = 1;
        setLoadProgress(100);
        setLoading(false);
        setReady(true);
      };
      img.onerror = () => {
        if (cancelled) return;
        setLoading(false);
        setReady(false);
      };
      img.src = `/frames/frame_${pad(1)}.jpg`;
      return () => {
        cancelled = true;
      };
    }

    const loadImage = (i: number) =>
      new Promise<boolean>((resolve) => {
        const img = new Image();
        img.onload = () => {
          framesRef.current[i - 1] = img;
          resolve(true);
        };
        img.onerror = () => resolve(false);
        img.src = `/frames/frame_${pad(i)}.jpg`;
      });

    let cancelled = false;
    (async () => {
      const maxAttempts = 600;
      let count = 0;
      for (let i = 1; i <= maxAttempts && !cancelled; i++) {
        const ok = await loadImage(i);
        if (!ok) break;
        count = i;
        setLoadProgress(Math.round((i / maxAttempts) * 100));
      }
      if (cancelled) return;
      totalFramesRef.current = count;
      setLoading(false);
      setReady(count > 0);
    })();
    return () => {
      cancelled = true;
    };
  }, [reducedMotion]);

  const drawFrame = useCallback((progress01: number) => {
    const canvas = canvasRef.current;
    const total = totalFramesRef.current;
    const frames = framesRef.current;
    if (!canvas || total === 0 || !frames[0]) return;

    const index = Math.min(total - 1, Math.max(0, Math.floor(progress01 * total)));
    if (index === currentFrameIndexRef.current && index > 0) return;
    currentFrameIndexRef.current = index;
    const img = frames[index];
    if (!img || !img.complete) return;

    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    const imgRatio = img.width / img.height;
    const viewRatio = w / h;

    let sx: number, sy: number, sW: number, sH: number;
    if (imgRatio > viewRatio) {
      sH = img.height;
      sW = img.height * viewRatio;
      sx = (img.width - sW) / 2;
      sy = 0;
    } else {
      sW = img.width;
      sH = img.width / viewRatio;
      sx = 0;
      sy = (img.height - sH) / 2;
    }

    ctx.drawImage(img, sx, sy, sW, sH, 0, 0, w, h);
  }, []);

  useEffect(() => {
    if (!ready || !wrapperRef) return;

    if (reducedMotion) {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = Math.floor(window.innerWidth * dpr);
      const h = Math.floor(window.innerHeight * dpr);
      canvas.width = w;
      canvas.height = h;
      canvas.style.width = '100%';
      canvas.style.height = '100%';
      currentFrameIndexRef.current = -1;
      lastProgressRef.current = 1;
      drawFrame(1);
      onProgress?.(1);
      const onResize = () => {
        const c = canvasRef.current;
        if (!c) return;
        const d = Math.min(window.devicePixelRatio || 1, 2);
        c.width = Math.floor(window.innerWidth * d);
        c.height = Math.floor(window.innerHeight * d);
        c.style.width = '100%';
        c.style.height = '100%';
        currentFrameIndexRef.current = -1;
        drawFrame(1);
      };
      window.addEventListener('resize', onResize);
      return () => window.removeEventListener('resize', onResize);
    }

    const wrapper = wrapperRef.current;
    if (!wrapper) return;

    const onScroll = () => {
      const rect = wrapper.getBoundingClientRect();
      const wrapperTop = rect.top + window.scrollY;
      const wrapperHeight = wrapper.offsetHeight - window.innerHeight;
      if (wrapperHeight <= 0) return;

      const scrolled = window.scrollY - wrapperTop;
      const progress = Math.max(0, Math.min(1, scrolled / wrapperHeight));
      lastProgressRef.current = progress;
      drawFrame(progress);
      onProgress?.(progress);
    };

    const onResize = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = Math.floor(window.innerWidth * dpr);
      const h = Math.floor(window.innerHeight * dpr);
      canvas.width = w;
      canvas.height = h;
      canvas.style.width = '100%';
      canvas.style.height = '100%';
      currentFrameIndexRef.current = -1;
      drawFrame(lastProgressRef.current);
    };

    onResize();
    requestAnimationFrame(onScroll);

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
    };
  }, [ready, reducedMotion, drawFrame, onProgress, wrapperRef]);

  useEffect(() => {
    if (ready) {
      currentFrameIndexRef.current = -1;
      drawFrame(reducedMotion ? 1 : 0);
    }
  }, [ready, reducedMotion, drawFrame]);

  if (loading) {
    return (
      <div className="absolute inset-0 z-0 flex flex-col items-center justify-center bg-noir text-white">
        <span className="text-sm font-light text-white/80">Chargement…</span>
        <div className="mt-4 h-1 w-48 overflow-hidden rounded-full bg-white/20">
          <div
            className="h-full rounded-full bg-white transition-all duration-200 motion-reduce:transition-none"
            style={{ width: `${loadProgress}%` }}
          />
        </div>
      </div>
    );
  }

  if (!ready) {
    return (
      <div className="absolute inset-0 z-0 flex items-center justify-center bg-noir">
        <span className="text-sm font-light text-white/50">Vidéo non disponible</span>
      </div>
    );
  }

  return (
    <>
      <canvas
        ref={canvasRef}
        className="absolute inset-0 block h-full w-full object-cover"
        style={{ objectFit: 'cover' }}
      />
      {children}
    </>
  );
}
