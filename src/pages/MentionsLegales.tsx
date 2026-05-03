import { useEffect } from 'react';
import { Link } from 'react-router-dom';

const MentionsLegales = () => {
  useEffect(() => { document.title = 'Mentions légales — PessÓra'; }, []);
  return (
    <div className="min-h-screen pt-[7.25rem]">
      {/* Hero */}
      <section className="py-12 bg-noir text-white">
        <div className="container-custom text-center">
          <h1 className="text-4xl md:text-5xl font-bold">Mentions Légales</h1>
        </div>
      </section>

      {/* Contenu */}
      <section className="section-padding bg-white">
        <div className="container-custom max-w-4xl">
          <div className="prose prose-lg max-w-none">
            <h2 className="text-3xl font-bold mb-6 text-primary">1. Informations Légales</h2>

            <div className="mb-8">
              <h3 className="text-2xl font-bold mb-4 text-primary">Éditeur du Site</h3>
              <p className="text-gray-700">
                <strong>Raison sociale :</strong> PessÓra<br />
                <strong>Forme juridique :</strong> [À compléter]<br />
                <strong>Adresse :</strong> C.C. La Véranda – Cluny, 97200 Fort-de-France, Martinique<br />
                <strong>Email :</strong> pessora.mq@gmail.com<br />
                <strong>Directeur de la publication :</strong> [À compléter]
              </p>
            </div>

            <h2 className="text-3xl font-bold mb-6 text-primary">2. Hébergement</h2>
            <div className="mb-8">
              <p className="text-gray-700">
                <strong>Hébergeur :</strong> [À compléter]<br />
                <strong>Adresse :</strong> [À compléter]
              </p>
            </div>

            <h2 className="text-3xl font-bold mb-6 text-primary">3. Propriété Intellectuelle</h2>
            <div className="mb-8">
              <p className="text-gray-700 leading-relaxed">
                L'ensemble du contenu de ce site (textes, images, vidéos, logos, design) est la propriété
                exclusive de PessÓra, sauf mention contraire. Toute reproduction, distribution, modification,
                adaptation, retransmission ou publication de ces différents éléments est strictement interdite
                sans l'accord écrit de PessÓra.
              </p>
            </div>

            <h2 className="text-3xl font-bold mb-6 text-primary">4. Protection des Données Personnelles</h2>
            <div className="mb-8">
              <p className="text-gray-700 leading-relaxed">
                Conformément au Règlement Général sur la Protection des Données (RGPD) et à la loi Informatique
                et Libertés, vous disposez d'un droit d'accès, de rectification, de suppression et d'opposition
                aux données personnelles vous concernant.
              </p>
              <p className="text-gray-700 leading-relaxed mt-4">
                Le détail des traitements, des finalités, des durées de conservation et de vos droits est décrit dans
                la{' '}
                <Link to="/politique-confidentialite" className="text-primary underline underline-offset-2">
                  politique de confidentialité
                </Link>
                .
              </p>
              <p className="text-gray-700 leading-relaxed mt-4">
                Pour exercer ces droits, vous pouvez nous contacter à l'adresse suivante : pessora.mq@gmail.com
              </p>
            </div>

            <h2 className="text-3xl font-bold mb-6 text-primary">5. Cookies</h2>
            <div className="mb-8">
              <p className="text-gray-700 leading-relaxed">
                Lors de votre première visite, une bannière vous permet d’accepter ou de refuser les cookies
                non indispensables. Les préférences « fonctionnels » (ex. mémorisation du panier sur votre appareil)
                et « statistiques / mesure d’audience » sont décrites dans le bandeau et modifiables à tout moment via
                le lien « Cookies » en pied de page.
              </p>
              <p className="text-gray-700 leading-relaxed mt-4">
                Pour en savoir plus :{' '}
                <Link to="/politique-confidentialite" className="text-primary underline underline-offset-2">
                  politique de confidentialité — section Cookies
                </Link>
                . Vous pouvez aussi paramétrer votre navigateur pour limiter ou bloquer les cookies.
              </p>
            </div>

            <h2 className="text-3xl font-bold mb-6 text-primary">6. Responsabilité</h2>
            <div className="mb-8">
              <p className="text-gray-700 leading-relaxed">
                PessÓra s'efforce d'assurer l'exactitude et la mise à jour des informations diffusées sur ce site.
                Toutefois, PessÓra ne peut garantir l'exactitude, la précision ou l'exhaustivité des informations
                mises à disposition sur ce site.
              </p>
            </div>

            <h2 className="text-3xl font-bold mb-6 text-primary">7. Liens Hypertextes</h2>
            <div className="mb-8">
              <p className="text-gray-700 leading-relaxed">
                Ce site peut contenir des liens vers d'autres sites. PessÓra ne peut être tenu responsable
                du contenu de ces sites externes.
              </p>
            </div>

            <h2 className="text-3xl font-bold mb-6 text-primary">8. Droit Applicable</h2>
            <div className="mb-8">
              <p className="text-gray-700 leading-relaxed">
                Les présentes mentions légales sont régies par le droit français. En cas de litige, les tribunaux
                français seront seuls compétents.
              </p>
            </div>

            <div className="mt-12 p-6 bg-gray-100 rounded-lg">
              <p className="text-sm text-gray-600">
                <strong>Dernière mise à jour :</strong> {new Date().toLocaleDateString('fr-FR')}
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default MentionsLegales;
