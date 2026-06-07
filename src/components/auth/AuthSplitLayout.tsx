import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useReducedMotion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { BrandLogo } from '../common/BrandLogo';
import { BackgroundVideo } from '../common/BackgroundVideo';
import { AUTH_LAYOUT_MEDIA } from '../../data/authLayoutMedia';

type AuthSplitLayoutProps = {
  children: React.ReactNode;
};

export function AuthSplitLayout({ children }: AuthSplitLayoutProps) {
  const prefersReducedMotion = useReducedMotion();
  const [videoBroken, setVideoBroken] = useState(false);

  const { videoMp4, videoWebm, poster } = AUTH_LAYOUT_MEDIA;
  const hasVideoFile = Boolean(videoMp4 || videoWebm);
  const showMotionVideo = hasVideoFile && !prefersReducedMotion && !videoBroken;

  return (
    <div className="flex min-h-screen flex-col bg-white lg:grid lg:min-h-screen lg:grid-cols-2">
      {/* Colonne média : mobile = haut ; desktop = gauche, pleine hauteur */}
      <aside className="relative order-1 min-h-[220px] h-[min(40vh,400px)] w-full shrink-0 overflow-hidden bg-surface-muted lg:order-none lg:h-full lg:min-h-screen lg:max-h-none">
        <div className="absolute inset-0">
          {showMotionVideo && (
            <BackgroundVideo
              mp4Src={videoMp4}
              webmSrc={videoWebm}
              poster={poster}
              enabled={showMotionVideo}
              onError={() => setVideoBroken(true)}
            />
          )}
          {!showMotionVideo && poster ? (
            <img
              src={poster}
              alt=""
              className="h-full w-full object-cover"
              loading="eager"
              decoding="async"
            />
          ) : null}
          {!showMotionVideo && !poster ? (
            <div
              className="h-full w-full bg-gradient-to-br from-surface-muted via-white/50 to-surface-product-well"
              aria-hidden
            />
          ) : null}
        </div>
      </aside>

      <main className="order-2 flex flex-1 flex-col justify-center bg-white px-4 py-10 md:px-10 lg:min-h-screen lg:overflow-y-auto lg:px-14 lg:py-12">
        <div className="mx-auto w-full max-w-md">
          <div className="mb-8">
            <Link
              to="/"
              className="inline-flex min-h-11 items-center gap-2 text-[10px] font-normal uppercase tracking-[0.12em] text-black/45 transition-colors hover:text-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-noir/25 focus-visible:ring-offset-2"
            >
              <ArrowLeft size={14} strokeWidth={1.5} aria-hidden />
              Retour au site
            </Link>
            <Link
              to="/"
              className="mt-6 flex justify-center rounded-[2px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-noir/20 focus-visible:ring-offset-2"
            >
              <BrandLogo height={56} />
            </Link>
          </div>
          {children}
        </div>
      </main>
    </div>
  );
}
