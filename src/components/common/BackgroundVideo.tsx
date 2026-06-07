import { cn } from '@heroui/react';
import { useVideoAutoplay } from '../../hooks/useVideoAutoplay';

type BackgroundVideoProps = {
  /** MP4 — obligatoire pour Safari iOS (src direct, pas de <source>) */
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
  /** Safari iOS : src direct obligatoire pour autoplay — <source> ne démarre pas seul */
  const src = mp4Src ?? webmSrc ?? undefined;
  const hasSource = Boolean(src);

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
      src={src}
      className={cn('background-video h-full w-full object-cover', className)}
      muted
      loop
      playsInline
      autoPlay
      preload="auto"
      poster={poster ?? undefined}
      disablePictureInPicture
      controlsList="nodownload nofullscreen noremoteplayback"
      aria-hidden
      tabIndex={-1}
      onError={onError}
    />
  );
}
