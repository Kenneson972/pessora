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
      quote:
        'Un accueil exceptionnel, des boissons extraordinaires, des gaufres fantastiques ! Mention spéciale pour le Pink Dragon.',
      author: 'Jimmy CACLIN',
      ageLabel: 'il y a 2 mois',
    },
    {
      quote:
        "L'accueil est parfait, les gérants sont gentils, souriants et à l'écoute. Prenez l'abonnement : vous vous régalerez à chaque passage.",
      author: 'Pauline Fournaise',
      ageLabel: 'il y a 2 mois',
    },
    {
      quote: 'On a été très bien reçu à Pessora. Spot chill et cute pour un moment entre copines.',
      author: 'Imane Rossy',
      ageLabel: 'il y a 3 mois',
    },
    {
      quote:
        "Très bel accueil, j'ai goûté le protein shok et un matcha : c'était excellent, les prix sont abordables. Je recommande ;)",
      author: 'Marine Davidas',
      ageLabel: 'il y a 3 mois',
    },
    {
      quote: "Très beau cadre, boisson excellente !! N'hésitez pas.",
      author: 'stacey bajoc',
      ageLabel: 'il y a 1 mois',
    },
    {
      quote:
        "Honnêtement c'est pépite ! Allez-y les yeux fermés, en plus le personnel est adorable et à l'écoute.",
      author: 'ali hrs',
      ageLabel: 'il y a 3 mois',
    },
    {
      quote: "Très bon accueil, c'est délicieux.",
      author: 'Marc LABRANCHE',
      ageLabel: 'il y a 2 mois',
    },
  ] as GoogleReviewHighlight[],
};
