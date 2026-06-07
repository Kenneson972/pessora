import { cn } from '@heroui/react';
import { useVideoAutoplay } from '../../hooks/useVideoAutoplay';

type BackgroundVideoProps = {
  /** MP4 — obligatoire pour Safari iOS */
  mp4Src?: string | null;
  webmSrc?: string | null;
  poster?: string | null;
  className?: string;
  enabled?: boolean;
  onError?: () => void;
};

export function BackgroundVideo({
  mp4Src,
  webmSrc,
  poster,
  className,
  enabled = true,
  onError,
}: BackgroundVideoProps) {
  const ref = useVideoAutoplay(enabled);
  const primarySrc = mp4Src ?? webmSrc ?? undefined;
  const hasSource = Boolean(primarySrc);

  if (!enabled || !hasSource) {
    if (!poster) return null;
    return (
      <img
        src={poster}
        alt=""
        className={cn('h-full w-full object-cover', className)}
        loading="eager"
        decoding="async"
        aria-hidden
      />
    );
  }

  return (
    <video
      ref={ref}
      className={cn('h-full w-full object-cover', className)}
      src={primarySrc}
      muted
      loop
      playsInline
      autoPlay
      preload="auto"
      poster={poster ?? undefined}
      aria-hidden
      onError={onError}
    />
  );
}
