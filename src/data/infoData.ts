export const barInfo = {
  name: 'PessÓra',
  tagline: 'Le 1er Bar Protéiné & Bien-Être de Martinique',
  description:
    'Bar protéiné à Fort-de-France : shakes, gammes wellness & énergie, coffee bar et accompagnement bien-être.',

  address: {
    street: 'C.C. La Véranda - Cluny',
    city: 'Fort-de-France',
    postalCode: '97200',
    country: 'Martinique',
    fullAddress: 'C.C. La Véranda – Cluny, 97200 Fort-de-France',
    mapsUrl: 'https://maps.app.goo.gl/VAz5h1cpjWFBq8R59'
  },

  hours: {
    weekdays: {
      days: 'Lundi - Vendredi',
      hours: '9h30 - 18h'
    },
    saturday: {
      days: 'Samedi',
      hours: '10h30 - 14h'
    },
    sunday: {
      days: 'Dimanche',
      hours: 'Fermé'
    }
  },

  contact: {
    phone: '+596 696 XX XX XX', // À remplacer
    email: 'pessora.mq@gmail.com',
    instagram: '@pessora.mq',
    instagramUrl: 'https://www.instagram.com/pessora.mq/'
  },

  values: [
    {
      title: 'Équilibre',
      description: 'Des boissons pensées pour votre équilibre nutritionnel',
      icon: '⚖️'
    },
    {
      title: 'Plaisir',
      description: 'Se faire plaisir sans culpabilité, c\'est possible',
      icon: '😊'
    },
    {
      title: 'Motivation',
      description: 'Transformer vos résolutions en actions concrètes',
      icon: '💪'
    },
    {
      title: 'Bien-être',
      description: 'Prendre soin de soi, dedans comme dehors',
      icon: '✨'
    }
  ]
};

export const partnerships = [
  {
    id: 'gigafit',
    name: 'GigaFit Le Lamentin',
    description: 'Stand PessÓra lors des événements et journées portes ouvertes',
    type: 'Salle de sport',
    icon: '🏋️‍♂️',
    status: 'active'
  },
  {
    id: 'enbonstermes',
    name: 'EN BONS THERMES',
    description: 'Collaboration bien-être : massages, skincare et boissons protéinées au même lieu',
    type: 'Bien-être & Spa',
    icon: '💆‍♀️',
    status: 'active'
  }
];

export const events = [
  {
    id: 'gigafit-opening',
    title: 'Portes Ouvertes GigaFit',
    date: 'À venir',
    location: 'GigaFit Le Lamentin',
    description: 'Venez découvrir nos boissons lors des journées portes ouvertes de GigaFit',
    type: 'popup'
  }
];

export const socialLinks = [
  {
    platform: 'Instagram',
    url: 'https://www.instagram.com/pessora.mq/',
    icon: 'instagram',
    handle: '@pessora.mq'
  },
  {
    platform: 'Facebook',
    url: '#', // À remplacer
    icon: 'facebook',
    handle: 'PessÓra'
  }
];
