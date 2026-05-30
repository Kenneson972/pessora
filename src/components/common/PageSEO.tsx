import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { getSEOForPath } from '../../data/seoConfig';

const OG_DEFAULTS = {
  title: 'PessÓra — Bar Protéiné & Bien-Être en Martinique',
  description: 'Shakes protéinés, wellness, énergie et coffee bar à Fort-de-France. Le 1er bar protéiné & bien-être de Martinique.',
  image: '/logo-pessora.png',
  type: 'website',
};

function setMetaTag(property: string, content: string) {
  let el = document.querySelector<HTMLMetaElement>(`meta[property="${property}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute('property', property);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function setMetaName(name: string, content: string) {
  let el = document.querySelector<HTMLMetaElement>(`meta[name="${name}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute('name', name);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

const PageSEO = () => {
  const location = useLocation();
  const seo = getSEOForPath(location.pathname);

  useEffect(() => {
    const ogTitle = seo?.ogTitle ?? seo?.title ?? OG_DEFAULTS.title;
    const ogDesc = seo?.ogDescription ?? seo?.description ?? OG_DEFAULTS.description;
    const ogImage = seo?.ogImage ?? OG_DEFAULTS.image;
    const ogType = seo?.ogType ?? OG_DEFAULTS.type;

    if (seo) {
      document.title = seo.title;
      const metaDesc = document.querySelector<HTMLMetaElement>('meta[name="description"]');
      if (metaDesc) metaDesc.setAttribute('content', seo.description);

      let link = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
      if (!link) {
        link = document.createElement('link');
        link.rel = 'canonical';
        document.head.appendChild(link);
      }
      link.href = window.location.origin + location.pathname;
    }

    // Open Graph
    const imageUrl = ogImage.startsWith('http') ? ogImage : window.location.origin + ogImage;
    setMetaTag('og:title', ogTitle);
    setMetaTag('og:description', ogDesc);
    setMetaTag('og:image', imageUrl);
    setMetaTag('og:type', ogType);
    setMetaTag('og:url', window.location.origin + location.pathname);
    setMetaTag('og:site_name', 'PessÓra');

    // Twitter
    setMetaName('twitter:card', 'summary_large_image');
    setMetaName('twitter:title', ogTitle);
    setMetaName('twitter:description', ogDesc);
    setMetaName('twitter:image', imageUrl);
  }, [location.pathname, seo]);

  return null;
};

export default PageSEO;
