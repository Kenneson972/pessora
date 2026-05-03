-- PESSORA — Seed gamme_products (données réelles cartes 2026-04-20)
INSERT INTO public.gamme_products (gamme, subcategory, name, description, price, price_alt, sort_order) VALUES

-- ── GAMME SPORT — Sport ────────────────────────────────────────────────────
('sport', 'sport', 'Formula 1 950g',         'Repas nutritionnel complet en shake',   65,   NULL, 1),
('sport', 'sport', 'Créatine',               'Améliore la force et la puissance',     45,   NULL, 2),
('sport', 'sport', 'Rebuild Whey',           'Shake de récupération post-effort',     90,   NULL, 3),
('sport', 'sport', 'Gel Prolong',            'Énergie soutenue pour efforts longs',   35,   NULL, 4),
('sport', 'sport', 'Electrolytes CR7 Boîte', 'Boisson hypotonique endurance — boîte', 40,   NULL, 5),
('sport', 'sport', 'Electrolytes Sachet x10','Sachet pratique hydratation',           30,   NULL, 6),
('sport', 'sport', 'Omega 3',                'Acides gras essentiels santé cardiaque',40,   NULL, 7),
('sport', 'sport', 'Hydrate',                'Électrolytes pour l''hydratation',      50,   NULL, 8),
('sport', 'sport', 'Protein Drink PDM',      'Boisson protéinée prête à boire',       75,   NULL, 9),
('sport', 'sport', 'LiftOff Pamplemousse',   'Tablette effervescente énergie — pamplemousse', 40, NULL, 10),
('sport', 'sport', 'LiftOff Citron',         'Tablette effervescente énergie — citron', 40,  NULL, 11),

-- ── GAMME SPORT — Encas ───────────────────────────────────────────────────
('sport', 'encas', 'Chips BBQ Onions x10',   'Encas savoureux riche en protéines',    30,   NULL, 1),
('sport', 'encas', 'Barre Sport x6',         'Barre protéinée récupération',          35,   NULL, 2),
('sport', 'encas', 'Barre Céréales x7',      'Barre céréales croustillante et saine', 35,   NULL, 3),
('sport', 'encas', 'Barres Collations x14',  'Pack encas variés',                     40,   NULL, 4),

-- ── GAMME SKIN — Nettoyage ────────────────────────────────────────────────
('skin', 'nettoyage', 'Gel Nettoyant Resurface', 'Nettoyage en profondeur sans dessécher',  29, 39, 1),
('skin', 'nettoyage', 'Gommage',                 'Exfoliant doux pour peau lumineuse',       29, NULL, 2),
('skin', 'nettoyage', 'Lotion Tonique Revitalisant', 'Tonifie et revitalise le teint',       22, NULL, 3),
('skin', 'nettoyage', 'Masque d''Argile',         'Masque purifiant pour pores dilatés',     25, NULL, 4),
('skin', 'nettoyage', 'Exfoliant',                'Gommage corps pour peau douce',            24, NULL, 5),

-- ── GAMME SKIN — Korean Products ─────────────────────────────────────────
('skin', 'korean', 'Crème Hydratante FPS 30',  'Protection solaire + hydratation intense',  55, NULL, 1),
('skin', 'korean', 'Crème Hydrant Éclat',      'Hydratation quotidienne + effet éclat',     55, NULL, 2),
('skin', 'korean', 'Lotion Nourrissante',       'Soin corps pour peau douce',                29, NULL, 3),

-- ── GAMME SKIN — Contour des Yeux ────────────────────────────────────────
('skin', 'contour', 'Gel Contour Yeux',       'Réduit poches et cernes',                    45, NULL, 1),
('skin', 'contour', 'Crème Hydrant Yeux',     'Hydratation intense contour yeux',            45, NULL, 2),
('skin', 'contour', 'Crème Contour Yeux',     'Anti-rides et raffermir',                     49, NULL, 3),

-- ── GAMME SKIN — Sérum / Anti-Âge ────────────────────────────────────────
('skin', 'serum', 'Sérum Rides',              'Concentré anti-rides haute efficacité',      75, NULL, 1),
('skin', 'serum', 'Sérum Niacinamide 10%',    'Réduit pores et unifie le teint',            55, NULL, 2),
('skin', 'serum', 'Crème Tension Ultime',     'Raffermissement et densité cutanée',         89, NULL, 3),
('skin', 'serum', 'Crème de Nuit',            'Régénération cellulaire nocturne',           88, NULL, 4),

-- ── GAMME WELLNESS ────────────────────────────────────────────────────────
('wellness', NULL, 'Aloe Vera',          'Concentré d''aloé vera pure pour l''hydratation', 60, NULL, 1),
('wellness', NULL, 'Collagène',          'Collagène marin pour peau, ongles et articulations', 85, NULL, 2),
('wellness', NULL, 'Thé Detox',          'Mélange détoxifiant pour drainer et purifier',   45, NULL, 3),
('wellness', NULL, 'Fibres',             'Mélange riche en fibres pour confort digestif',  45, NULL, 4),
('wellness', NULL, 'Complex Vitamine',   'Complexe multivitaminé quotidien',               35, NULL, 5),
('wellness', NULL, 'Minéral Complex',    'Minéraux essentiels pour l''équilibre',          45, NULL, 6);
