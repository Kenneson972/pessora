import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { getSEOForPath } from '../../data/seoConfig';

/**
 * Met à jour le titre du document et la meta description selon la route.
 * À placer une fois dans l’arbre (ex. dans App, sous Router).
 */
const PageSEO = () => {
  const location = useLocation();
  const seo = getSEOForPath(location.pathname);

  useEffect(() => {
    if (seo) {
      document.title = seo.title;
      const metaDesc = document.querySelector<HTMLMetaElement>('meta[name="description"]');
      if (metaDesc) metaDesc.setAttribute('content', seo.description);

      // Canonical dynamique pour la page courante (évite contenu dupliqué)
      let link = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
      if (!link) {
        link = document.createElement('link');
        link.rel = 'canonical';
        document.head.appendChild(link);
      }
      link.href = window.location.origin + location.pathname;
    }
  }, [location.pathname, seo]);

  return null;
};

export default PageSEO;
