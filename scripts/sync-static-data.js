// Copie-colle ce script dans la console (F12) de ton navigateur
// pendant que tu es sur http://localhost:5173/admin ET connecté en admin.
// Il va synchroniser les données statiques vers Supabase.

const SUPABASE_URL = 'https://tulhiipucrnyejheuitv.supabase.co';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR1bGhpaXB1Y3JueWVqaGV1aXR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY1MzE5MDYsImV4cCI6MjA5MjEwNzkwNn0.O6IZmZK-CHC9s7-mFow2hyNTF8nYpSUMlHAO4haQME4';

// Récupère le token de session admin depuis localStorage
const sessionStr = localStorage.getItem('sb-tulhiipucrnyejheuitv-auth-token');
if (!sessionStr) { console.error('❌ Pas de session Supabase. Connecte-toi en admin d\'abord.'); throw new Error('no session'); }
const session = JSON.parse(sessionStr);
const token = session?.access_token;
if (!token) { console.error('❌ Pas de token. Reconnecte-toi.'); throw new Error('no token'); }

const headers = {
  'apikey': ANON_KEY,
  'Authorization': `Bearer ${token}`,
  'Content-Type': 'application/json',
  'Prefer': 'return=representation',
};

const updates = [
  // WELLNESS
  { slug: 'glow-my-skin', data: { ingredients: ['Hibiscus', 'Collagène', 'Fraise', 'Citron'], benefits: ['Articulation', 'Circulation sanguine', 'Peau', 'Ongles et cheveux'], description: 'Le cocktail beauté par excellence', pitch: 'Le cocktail beauté par excellence', icon_emoji: '✨', calories: 30, badges: [] } },
  { slug: 'immuni-tea', data: { ingredients: ['Baie sauvage', 'Collagène', 'Citron'], benefits: ['Système immunitaire', 'Articulation', 'Brûle graisse'], description: 'Renforce vos défenses naturelles', pitch: 'Renforce vos défenses naturelles', icon_emoji: '🌺', calories: 35, badges: [] } },
  // ÉNERGIE
  { slug: 'spicy-mango', data: { ingredients: ['Mangue épicée', 'Açaï', 'Hibiscus', 'Orange', 'Électrolytes'], benefits: ['Énergie douce', 'Anti-crampe', 'Endurance', 'Puissance'], description: 'Le boost tropical et puissant', pitch: 'Le boost tropical et puissant', icon_emoji: '🔥', calories: 50, badges: [] } },
  { slug: 'hydra-boost-litchi', data: { ingredients: ['Orange', 'Litchi', 'Électrolytes'], benefits: ['Hydratation profonde', 'Récupération', 'Endurance'], description: 'Hydratation profonde & récupération', pitch: 'Hydratation profonde & récupération', icon_emoji: '🍊', calories: 40, badges: [] } },
  { slug: 'blue-lagoon', data: { ingredients: ['Créatine', 'Yuzu', 'Açaï', 'Citron', 'Curaçao', 'Menthe', 'Caféine de Guarana', 'Biotine', 'Taurine'], benefits: ['Énergie immédiate', 'Réduction de la fatigue', 'Puissance', 'Force'], description: "L'électrochoc frais pour se réveiller", pitch: "L'électrochoc frais pour se réveiller", icon_emoji: '💙', calories: 50, badges: [] } },
  // SHAKES
  { slug: 'choco-prot', data: { ingredients: ['Chocolat', 'Vanille'], benefits: ['Récupération', 'Classique', '25g protéines', '25 vitamines & minéraux'], description: 'Le classique efficace', pitch: 'Le classique efficace', icon_emoji: '🍫', calories: 250, protein: 25, badges: ['vegan', 'glutenfree', 'vitamins'] } },
  { slug: 'iced-caramel-latte', data: { ingredients: ['Vanille', 'Caramel', 'Café'], benefits: ['Récupération', 'Énergie', '25g protéines', '25 vitamines & minéraux'], description: 'Le coup de fouet gourmand', pitch: 'Le coup de fouet gourmand', icon_emoji: '☕', calories: 250, protein: 25, badges: ['vegan', 'glutenfree', 'vitamins'] } },
  { slug: 'pink-dragon', data: { ingredients: ['Fruit du dragon', 'Collagène', 'Fraise'], benefits: ['Récupération', 'Beauté', '25g protéines', '25 vitamines & minéraux'], description: 'Fruité & Beauté', pitch: 'Fruité & Beauté', icon_emoji: '🐉', calories: 250, protein: 25, badges: ['vegan', 'glutenfree', 'vitamins'] } },
  { slug: 'cookie-cream', data: { ingredients: ['Cookies', 'Caramel', 'Chocolat'], benefits: ['Récupération', 'Gourmand', '30g protéines', '25 vitamines & minéraux'], description: 'Gourmandise pure', pitch: 'Gourmandise pure', icon_emoji: '🍪', calories: 330, protein: 30, badges: ['vegan', 'glutenfree', 'vitamins'] } },
  { slug: 'glam-matcha', data: { ingredients: ['Matcha', 'Framboise', 'Vanille'], benefits: ['Récupération', 'Antioxydants', '21g protéines', '25 vitamines & minéraux'], description: "L'option zen & fruitée", pitch: "L'option zen & fruitée", icon_emoji: '🍵', calories: 210, protein: 21, badges: ['vegan', 'glutenfree', 'vitamins'] } },
  // COFFEE
  { slug: 'espresso', data: { ingredients: ['Café arabica'], benefits: ['Énergie', 'Concentration'], description: 'Court et intense', pitch: 'Le classique italien', icon_emoji: '☕', calories: 5, badges: [] } },
  { slug: 'cafe-long', data: { ingredients: ['Café arabica', 'Eau'], benefits: ['Énergie douce', 'Hydratation'], description: 'Allongé et doux', pitch: 'Pour prendre son temps', icon_emoji: '☕', calories: 10, badges: [] } },
  // IMMUNE PARADISE (données du menu statique actuel)
  { slug: 'immune-paradise', data: { ingredients: ['Baies sauvages', 'Passion', 'Rose', 'Aloe vera'], benefits: ['Système immunitaire', 'Antioxydant', 'Douceur', 'Vitalité'], description: 'Contribue au fonctionnement du système immunitaire', pitch: 'Contribue au fonctionnement du système immunitaire', icon_emoji: '🌸', calories: 35, badges: [] } },
];

async function runSync() {
  let done = 0;
  for (const { slug, data } of updates) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/products?slug=eq.${encodeURIComponent(slug)}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify(data),
    });
    if (res.ok) {
      console.log(`✅ ${slug} — mis à jour`);
      done++;
    } else {
      const err = await res.text();
      console.warn(`⚠️ ${slug} — ${res.status} ${err}`);
    }
  }
  console.log(`\n🎉 ${done}/${updates.length} produits synchronisés !`);
}

runSync();
