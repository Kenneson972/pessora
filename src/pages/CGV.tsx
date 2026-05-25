import { useEffect } from 'react';

const CGV = () => {
  useEffect(() => { document.title = 'CGV — PessÓra'; }, []);
  return (
    <div className="min-h-screen pt-[7.25rem]">
      {/* Hero */}
      <section className="py-12 bg-noir text-white">
        <div className="container-custom text-center">
          <h1 className="text-4xl md:text-5xl font-bold">Conditions Générales de Vente</h1>
        </div>
      </section>

      {/* Contenu */}
      <section className="section-padding bg-white">
        <div className="container-custom max-w-4xl">
          <div className="prose prose-lg max-w-none">
            <p className="text-lg text-gray-700 mb-8">
              Les présentes Conditions Générales de Vente (CGV) régissent les relations entre PessÓra
              et ses clients dans le cadre de la vente de boissons et produits.
            </p>

            <h2 className="text-3xl font-bold mb-6 text-primary">1. Objet</h2>
            <div className="mb-8">
              <p className="text-gray-700 leading-relaxed">
                Les présentes CGV définissent les droits et obligations des parties dans le cadre de
                la vente de produits (boissons, shakes, etc.) proposés par PessÓra.
              </p>
            </div>

            <h2 className="text-3xl font-bold mb-6 text-primary">2. Produits</h2>
            <div className="mb-8">
              <p className="text-gray-700 leading-relaxed">
                PessÓra propose à la vente différentes catégories de boissons :
              </p>
              <ul className="list-disc pl-6 mt-4 text-gray-700 space-y-2">
                <li>Gamme Wellness (boissons bien-être)</li>
                <li>Gamme Énergie (pré-workout & boost)</li>
                <li>Shakes protéinés</li>
                <li>Coffee bar (espresso, café long)</li>
                <li>Personnalisation : laits végétaux (cafés), boosters et options sur demande</li>
              </ul>
              <p className="text-gray-700 leading-relaxed mt-4">
                Les produits sont préparés sur place et peuvent être personnalisés selon les préférences
                et besoins nutritionnels des clients.
              </p>
            </div>

            <h2 className="text-3xl font-bold mb-6 text-primary">3. Prix</h2>
            <div className="mb-8">
              <p className="text-gray-700 leading-relaxed">
                Les prix des produits sont indiqués en euros, TTC (toutes taxes comprises). PessÓra se réserve
                le droit de modifier ses prix à tout moment, les produits étant facturés sur la base des tarifs
                en vigueur au moment de la commande.
              </p>
            </div>

            <h2 className="text-3xl font-bold mb-6 text-primary">4. Commandes</h2>
            <div className="mb-8">
              <h3 className="text-xl font-bold mb-3 text-primary">4.1 Sur Place</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                Les clients peuvent commander directement au bar aux horaires d'ouverture :
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>Lundi - Vendredi : 9h30 - 18h</li>
                <li>Samedi : 10h30 - 14h</li>
                <li>Dimanche : Fermé</li>
              </ul>

              <h3 className="text-xl font-bold mb-3 text-primary mt-6">4.2 Événements</h3>
              <p className="text-gray-700 leading-relaxed">
                PessÓra est également présent lors d'événements partenaires (GigaFit, etc.). Les modalités
                de commande peuvent varier selon l'événement.
              </p>
            </div>

            <h2 className="text-3xl font-bold mb-6 text-primary">5. Paiement</h2>
            <div className="mb-8">
              <p className="text-gray-700 leading-relaxed">
                Le paiement s'effectue au moment de la commande. Moyens de paiement acceptés :
              </p>
              <ul className="list-disc pl-6 mt-4 text-gray-700 space-y-2">
                <li>Espèces</li>
                <li>Carte bancaire</li>
                <li>Paiement mobile (selon disponibilité)</li>
              </ul>
            </div>

            <h2 className="text-3xl font-bold mb-6 text-primary">6. Livraison / Retrait</h2>
            <div className="mb-8">
              <p className="text-gray-700 leading-relaxed">
                Les produits sont préparés immédiatement après la commande et remis au client sur place.
                Le délai de préparation varie selon la complexité de la commande (généralement 3 à 10 minutes).
              </p>
            </div>

            <h2 className="text-3xl font-bold mb-6 text-primary">7. Droit de Rétractation</h2>
            <div className="mb-8">
              <p className="text-gray-700 leading-relaxed">
                Conformément à l'article L221-28 du Code de la consommation, le droit de rétractation ne peut
                être exercé pour les denrées alimentaires périssables. Les produits vendus par PessÓra étant
                des boissons fraîches préparées à la demande, aucun droit de rétractation n'est applicable.
              </p>
            </div>

            <h2 className="text-3xl font-bold mb-6 text-primary">8. Allergènes et Informations Nutritionnelles</h2>
            <div className="mb-8">
              <p className="text-gray-700 leading-relaxed">
                Les informations relatives aux allergènes sont disponibles sur demande auprès de notre équipe.
                Nous mettons tout en œuvre pour éviter les contaminations croisées, mais ne pouvons garantir
                l'absence totale d'allergènes.
              </p>
              <p className="text-gray-700 leading-relaxed mt-4">
                Il est de la responsabilité du client de nous informer de toute allergie ou intolérance
                alimentaire avant de passer commande.
              </p>
            </div>

            <h2 className="text-3xl font-bold mb-6 text-primary">9. Réclamations</h2>
            <div className="mb-8">
              <p className="text-gray-700 leading-relaxed">
                Toute réclamation doit être adressée à : pessora.mq@gmail.com ou directement en bar.
                Nous nous engageons à traiter toute réclamation dans les meilleurs délais.
              </p>
            </div>

            <h2 className="text-3xl font-bold mb-6 text-primary">10. Responsabilité</h2>
            <div className="mb-8">
              <p className="text-gray-700 leading-relaxed">
                PessÓra s'engage à préparer ses produits dans le respect des normes d'hygiène et de sécurité
                alimentaire en vigueur. Notre responsabilité ne saurait être engagée en cas de mauvaise
                utilisation du produit par le client.
              </p>
            </div>

            <h2 className="text-3xl font-bold mb-6 text-primary">11. Données Personnelles</h2>
            <div className="mb-8">
              <p className="text-gray-700 leading-relaxed">
                Les données personnelles collectées sont utilisées uniquement dans le cadre de la relation
                commerciale et ne sont pas transmises à des tiers. Conformément au RGPD, vous disposez d'un
                droit d'accès, de rectification et de suppression de vos données.
              </p>
            </div>

            <h2 className="text-3xl font-bold mb-6 text-primary">12. Droit Applicable et Litiges</h2>
            <div className="mb-8">
              <p className="text-gray-700 leading-relaxed">
                Les présentes CGV sont soumises au droit français. En cas de litige, une solution amiable
                sera recherchée avant toute action judiciaire. À défaut, les tribunaux français seront
                seuls compétents.
              </p>
            </div>

            <h2 className="text-3xl font-bold mb-6 text-primary">13. Acceptation des CGV</h2>
            <div className="mb-8">
              <p className="text-gray-700 leading-relaxed">
                Toute commande implique l'acceptation pleine et entière des présentes Conditions Générales
                de Vente.
              </p>
            </div>

            <div className="mt-12 p-6 bg-gray-100 rounded-lg">
              <p className="text-sm text-gray-600">
                <strong>Dernière mise à jour :</strong> {new Date().toLocaleDateString('fr-FR')}
              </p>
              <p className="text-sm text-gray-600 mt-2">
                Pour toute question concernant ces CGV, contactez-nous à : pessora.mq@gmail.com
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default CGV;
