export type GoogleReviewHighlight = {
  quote: string;
  author: string;
  ageLabel: string;
};

export const googleReviewsData = {
  rating: 4.9,
  reviewCountLabel: 'avis Google',
  placeReviewsUrl:
    'https://www.google.com/search?client=opera&hs=H1C&sca_esv=56156ec590014018&sxsrf=ANbL-n4M_77SXayiye1HuusR8lMFQ17FOQ:1776686580449&uds=ALYpb_ncDc7jTlmw6Mmq7NjuX5c-CO3QXtih0Z-GxTvpLw07F18AWMIsp0puggHgxLLuE0YKl2tv6Owjqg--4B5gwSY4NDykPDV67m0v7sLGMx3eySLXN26iskqV-u-Nh7yFXddCEHRr9UMaC6QOz0xuPZkI053h-yci1u-9RkUEgBZdpMIE1B6G-BbqpRhbL8fivnH3p9mR&q=PESSORA+%E2%80%93+Bar+Prot%C3%A9in%C3%A9+%26+Bien-%C3%AAtre+Avis&si=AL3DRZEsmMGCryMMFSHJ3StBhOdZ2-6yYkXd_doETEE1OR-qOSdDjYFxVTSIIF6fEO1xJQKufcphlYZUKqSLLJ1AJahQ1a9xurISvYOZeZNvcfaUJCNBa5tvZNi0vtbp6Ynln02zSAdDOUPAJsTbUxY35i7edL_VN2SasFCf628-3CIQqkLZoxY%3D&hl=fr-FR&sa=X&ved=2ahUKEwim2YSksfyTAxW6k2oFHcfvH-4Q_4MLegQIPhAO&biw=1452&bih=857&dpr=2',
  highlights: [
    {
      quote: 'Un accueil exceptionnel. Mention spéciale Pink Dragon.',
      author: 'Jimmy CACLIN',
      ageLabel: 'il y a 2 mois',
    },
    {
      quote: 'Parfait, souriants, à l\'écoute. Prenez l\'abonnement !',
      author: 'Pauline Fournaise',
      ageLabel: 'il y a 2 mois',
    },
    {
      quote: 'Spot chill et cute pour un moment entre copines.',
      author: 'Imane Rossy',
      ageLabel: 'il y a 3 mois',
    },
    {
      quote: 'Excellent, prix abordables. Je recommande.',
      author: 'Marine Davidas',
      ageLabel: 'il y a 3 mois',
    },
    {
      quote: 'Très beau cadre, boisson excellente !',
      author: 'stacey bajoc',
      ageLabel: 'il y a 1 mois',
    },
    {
      quote: 'Une pépite ! Personnel adorable et à l\'écoute.',
      author: 'ali hrs',
      ageLabel: 'il y a 3 mois',
    },
    {
      quote: 'Très bon accueil, c\'est délicieux.',
      author: 'Marc LABRANCHE',
      ageLabel: 'il y a 2 mois',
    },
  ] as GoogleReviewHighlight[],
};
