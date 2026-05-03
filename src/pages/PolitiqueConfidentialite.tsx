import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { PageShell } from '../components/layout/PageShell';

const PolitiqueConfidentialite = () => {
  useEffect(() => { document.title = 'Politique de confidentialité — PessÓra'; }, []);
  return (
    <div className="min-h-screen bg-white pb-20 pt-8 md:pt-12">
      <PageShell>
        <div className="mx-auto max-w-3xl">
          <p className="mb-2 text-[10px] font-light uppercase tracking-[0.24em] text-black/40">Données personnelles</p>
          <h1
            className="mb-6 font-display font-normal tracking-[-0.02em] text-black"
            style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(28px, 3.5vw, 40px)' }}
          >
            Politique de confidentialité
          </h1>
          <p className="mb-12 text-[13px] font-light leading-relaxed text-black/50">
            Dernière mise à jour : avril 2026. Cette politique décrit comment PessÓra collecte et traite les données
            personnelles dans le cadre du site, de l’espace membre et des services associés (événements, newsletter).
          </p>

          <section className="mb-10">
            <h2 className="mb-3 font-display text-lg font-normal text-black">1. Responsable du traitement</h2>
            <p className="text-[13px] font-light leading-relaxed text-black/60">
              <strong className="font-normal text-black/75">PessÓra</strong> — C.C. La Véranda – Cluny, 97200 Fort-de-France,
              Martinique. Contact :{' '}
              <a href="mailto:pessora.mq@gmail.com" className="text-editorial-link-underline">
                pessora.mq@gmail.com
              </a>
              .
            </p>
          </section>

          <section className="mb-10">
            <h2 className="mb-3 font-display text-lg font-normal text-black">2. Données collectées et finalités</h2>
            <ul className="list-inside list-disc space-y-2 text-[13px] font-light leading-relaxed text-black/60">
              <li>
                <strong className="font-normal text-black/75">Compte membre (inscription / connexion)</strong> : nom,
                prénom, e-mail, mot de passe (haché côté prestataire d’authentification), données de profil et
                d’abonnement le cas échéant — gestion du compte, accès à l’espace membre, relation contractuelle.
              </li>
              <li>
                <strong className="font-normal text-black/75">Inscription à un événement</strong> : nom, prénom,
                téléphone, nombre de personnes, préférences d’information — organisation de l’événement et
                communication associée.
              </li>
              <li>
                <strong className="font-normal text-black/75">Newsletter</strong> : adresse e-mail et preuve de
                consentement — envoi d’informations commerciales ou d’actualités si vous avez coché la case dédiée.
              </li>
              <li>
                <strong className="font-normal text-black/75">Panier</strong> (si vous acceptez les cookies de
                préférences) : contenu du panier stocké localement sur votre appareil — confort d’achat ; aucune
                revente à des tiers.
              </li>
              <li>
                <strong className="font-normal text-black/75">Données de navigation techniques</strong> : logs
                serveurs classiques, sécurité ; cookies strictement nécessaires au fonctionnement du bandeau de
                consentement et de la session.
              </li>
            </ul>
          </section>

          <section className="mb-10">
            <h2 className="mb-3 font-display text-lg font-normal text-black">3. Bases légales</h2>
            <p className="text-[13px] font-light leading-relaxed text-black/60">
              Exécution du contrat ou mesures précontractuelles (commande, compte, événements),{' '}
              <strong className="font-normal text-black/75">consentement</strong> (newsletter, cookies non
              nécessaires, choix d’information événements),{' '}
              <strong className="font-normal text-black/75">intérêt légitime</strong> (sécurité, amélioration du
              service, mesures d’audience anonymisées si vous les acceptez).
            </p>
          </section>

          <section className="mb-10">
            <h2 className="mb-3 font-display text-lg font-normal text-black">4. Destinataires et sous-traitants</h2>
            <p className="text-[13px] font-light leading-relaxed text-black/60">
              Les données peuvent être traitées par nos prestataires techniques (hébergement, base de données,
              authentification — ex. Supabase) strictement pour le compte de PessÓra et dans le respect du RGPD. Pas
              de vente de données à des annonceurs.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="mb-3 font-display text-lg font-normal text-black">5. Durées de conservation</h2>
            <p className="text-[13px] font-light leading-relaxed text-black/60">
              Compte actif : durée de vie du compte plus obligations légales. Newsletter : jusqu’à retrait de votre
              consentement (lien de désinscription à prévoir dans les e-mails) ou suppression sur demande. Données
              d’inscription événement : durée nécessaire à l’organisation puis archivage raisonnable. Cookies
              non nécessaires : selon vos choix dans le bandeau « Cookies » (lien en bas de page).
            </p>
          </section>

          <section className="mb-10">
            <h2 className="mb-3 font-display text-lg font-normal text-black">6. Vos droits</h2>
            <p className="text-[13px] font-light leading-relaxed text-black/60">
              Vous disposez d’un droit d’accès, de rectification, d’effacement, de limitation, d’opposition et de
              portabilité (lorsque applicable), et du retrait du consentement à tout moment pour les traitements qui
              s’y fondent. Contact :{' '}
              <a href="mailto:pessora.mq@gmail.com" className="text-editorial-link-underline">
                pessora.mq@gmail.com
              </a>
              . Vous pouvez introduire une réclamation auprès de la CNIL (
              <a href="https://www.cnil.fr" className="text-editorial-link-underline" target="_blank" rel="noopener noreferrer">
                cnil.fr
              </a>
              ).
            </p>
          </section>

          <section className="mb-10">
            <h2 className="mb-3 font-display text-lg font-normal text-black">7. Cookies & stockage local</h2>
            <p className="text-[13px] font-light leading-relaxed text-black/60">
              Un bandeau vous permet d’accepter ou de refuser les cookies / stockages optionnels (préférences & panier,
              statistiques). Les cookies strictement nécessaires au service ne peuvent pas être désactivés via ce
              bandeau. Vous pouvez modifier votre choix à tout moment via le lien « Cookies » dans le pied de page.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="mb-3 font-display text-lg font-normal text-black">8. Transferts hors UE</h2>
            <p className="text-[13px] font-light leading-relaxed text-black/60">
              Si des outils sont hébergés hors de l’Espace économique européen, PessÓra veille à des garanties
              appropriées (clauses types, pays adéquats) conformément au RGPD.
            </p>
          </section>

          <p className="text-[12px] font-light text-black/40">
            Voir aussi les{' '}
            <Link to="/mentions-legales" className="text-editorial-link-underline">
              mentions légales
            </Link>{' '}
            et les{' '}
            <Link to="/cgv" className="text-editorial-link-underline">
              CGV
            </Link>
            .
          </p>
        </div>
      </PageShell>
    </div>
  );
};

export default PolitiqueConfidentialite;
