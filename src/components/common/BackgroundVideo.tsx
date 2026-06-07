import { cn } from '@heroui/react';
import { useVideoAutoplay } from '../../hooks/useVideoAutoplay';

type BackgroundVideoProps = {
  /** MP4 en premier — obligatoire pour Safari iOS */
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
  const hasSource = Boolean(mp4Src || webmSrc);

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
      muted
      loop
      playsInline
      autoPlay
      preload="auto"
      poster={poster ?? undefined}
      aria-hidden
      onError={onError}
    >
      {mp4Src ? <source src={mp4Src} type="video/mp4" /> : null}
      {webmSrc ? <source src={webmSrc} type="video/webm" /> : null}
    </video>
  );
}
