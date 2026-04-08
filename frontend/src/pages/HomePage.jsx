import { useNavigate } from 'react-router-dom';
import Logo from '../components/Logo';
import BackgroundCircles from '../components/BackgroundCircles';

const stats = [
  { value: '+1 200', label: 'Dossiers traités' },
  { value: '15 ans', label: "d'expérience" },
  { value: '8', label: 'Avocats experts' },
  { value: '98%', label: 'Clients satisfaits' },
];

const services = [
  { icon: '⚖️', title: 'Droit Civil', desc: 'Contrats, successions, responsabilité civile et litiges entre particuliers traités avec rigueur.' },
  { icon: '🏛️', title: 'Droit Pénal', desc: 'Défense pénale, assistance aux victimes et accompagnement tout au long de la procédure judiciaire.' },
  { icon: '💼', title: 'Droit des Affaires', desc: "Création d'entreprise, contrats commerciaux, fusions-acquisitions et contentieux." },
  { icon: '🏠', title: 'Droit Immobilier', desc: 'Transactions immobilières, baux commerciaux, copropriété et litiges fonciers.' },
  { icon: '👨‍👩‍👧', title: 'Droit de la Famille', desc: 'Divorce, garde des enfants, adoption et protection des personnes vulnérables.' },
  { icon: '🌍', title: 'Droit International', desc: 'Litiges transfrontaliers, arbitrage international et conseil aux entreprises étrangères.' },
];

const steps = [
  { num: '01', title: 'Consultation initiale', desc: 'Un premier rendez-vous pour analyser votre situation et définir la meilleure stratégie juridique.' },
  { num: '02', title: 'Analyse du dossier', desc: 'Nos avocats étudient en profondeur votre dossier et rassemblent tous les éléments nécessaires.' },
  { num: '03', title: 'Stratégie juridique', desc: 'Élaboration d\'une stratégie sur mesure adaptée à vos objectifs et aux spécificités de l\'affaire.' },
  { num: '04', title: 'Suivi & résolution', desc: 'Accompagnement complet jusqu\'à la résolution définitive avec rapports réguliers.' },
];

const equipe = [
  { prenom: 'Youssef', nom: 'Ben Salah', titre: 'Associé fondateur', specialite: 'Droit Pénal & Civil', exp: '20 ans' },
  { prenom: 'Sonia', nom: 'Hamdi', titre: 'Associée', specialite: 'Droit des Affaires', exp: '15 ans' },
  { prenom: 'Tarek', nom: 'Mzoughi', titre: 'Avocat senior', specialite: 'Droit Immobilier', exp: '12 ans' },
  { prenom: 'Rania', nom: 'Chaabane', titre: 'Avocate', specialite: 'Droit de la Famille', exp: '8 ans' },
];

const temoignages = [
  { nom: 'Ahmed Belhassen', role: 'Chef d\'entreprise', text: 'Cabinet exceptionnel. Leur expertise en droit des affaires nous a permis de conclure notre acquisition dans les meilleures conditions.' },
  { nom: 'Leila Mansouri', role: 'Particulier', text: 'Professionnalisme remarquable. Mon dossier de succession a été traité avec une efficacité et une humanité rares.' },
  { nom: 'Karim Trabelsi', role: 'Directeur général', text: 'Je recommande vivement JurisHub. Réactivité, expertise et résultats — tout ce qu\'on attend d\'un cabinet d\'excellence.' },
];

export default function HomePage() {
  const navigate = useNavigate();

  return (
    <div className="hp">
      <BackgroundCircles />

      {/* ── NAVBAR ── */}
      <nav className="hp-nav">
        <div className="hp-nav-brand">
          <div className="hp-nav-logo"><Logo /></div>
          <span className="hp-nav-title">JurisHub</span>
        </div>
        <div className="hp-nav-links">
          <a href="#services">Services</a>
          <a href="#approche">Notre approche</a>
          <a href="#equipe">Équipe</a>
          <a href="#contact">Contact</a>
        </div>
        <button className="hp-btn-login" onClick={() => navigate('/login')}>
          Se connecter →
        </button>
      </nav>

      {/* ── HERO ── */}
      <section className="hp-hero">
        <div className="hp-hero-inner">
          <div className="hp-hero-left">
            <div className="hp-hero-tag">Cabinet d'Avocats — Tunis, Tunisie</div>
            <h1 className="hp-hero-title">
              Votre droit,<br />
              <em>notre combat.</em>
            </h1>
            <p className="hp-hero-sub">
              Depuis 2009, JurisHub défend les intérêts de ses clients avec expertise,
              rigueur et engagement. Un cabinet moderne au service d'une justice accessible.
            </p>
            <div className="hp-hero-actions">
              <button className="hp-btn-primary" onClick={() => navigate('/login')}>
                Accéder à mon espace
              </button>
              <a href="#services" className="hp-btn-ghost">Découvrir nos services</a>
            </div>
          </div>

          <div className="hp-hero-right">
            <div className="hp-hero-card hp-hero-card-1">
              <div className="hp-hc-icon">⚖️</div>
              <div>
                <div className="hp-hc-val">+1 200</div>
                <div className="hp-hc-lbl">Dossiers résolus</div>
              </div>
            </div>
            <div className="hp-hero-card hp-hero-card-2">
              <div className="hp-hc-icon">🏆</div>
              <div>
                <div className="hp-hc-val">15 ans</div>
                <div className="hp-hc-lbl">D'expérience</div>
              </div>
            </div>
            <div className="hp-hero-card hp-hero-card-3">
              <div className="hp-hc-icon">⭐</div>
              <div>
                <div className="hp-hc-val">98%</div>
                <div className="hp-hc-lbl">Satisfaction client</div>
              </div>
            </div>
            <div className="hp-hero-deco">
              <div className="hp-deco-ring hp-deco-ring-1" />
              <div className="hp-deco-ring hp-deco-ring-2" />
              <div className="hp-deco-ring hp-deco-ring-3" />
              <div className="hp-deco-center"><Logo /></div>
            </div>
          </div>
        </div>

        {/* Stats bar */}
        <div className="hp-stats-bar">
          {stats.map((s) => (
            <div className="hp-stat" key={s.label}>
              <span className="hp-stat-val">{s.value}</span>
              <span className="hp-stat-lbl">{s.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── SERVICES ── */}
      <section className="hp-section hp-section-light" id="services">
        <div className="hp-section-inner">
          <div className="hp-section-head">
            <span className="hp-tag">Nos domaines</span>
            <h2 className="hp-section-title">Une expertise juridique complète</h2>
            <p className="hp-section-sub">
              Nos avocats couvrent l'ensemble des branches du droit pour vous offrir
              un accompagnement global et personnalisé.
            </p>
          </div>
          <div className="hp-services-grid">
            {services.map((s) => (
              <div className="hp-service-card" key={s.title}>
                <div className="hp-service-icon">{s.icon}</div>
                <h3 className="hp-service-title">{s.title}</h3>
                <p className="hp-service-desc">{s.desc}</p>
                <div className="hp-service-link">En savoir plus →</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── APPROCHE ── */}
      <section className="hp-section hp-section-blue" id="approche">
        <div className="hp-section-inner">
          <div className="hp-section-head">
            <span className="hp-tag hp-tag-white">Notre méthode</span>
            <h2 className="hp-section-title" style={{ color: '#fff' }}>Comment nous travaillons</h2>
            <p className="hp-section-sub" style={{ color: 'rgba(255,255,255,0.65)' }}>
              Une approche structurée et transparente pour garantir les meilleurs résultats.
            </p>
          </div>
          <div className="hp-steps">
            {steps.map((s) => (
              <div className="hp-step" key={s.num}>
                <div className="hp-step-num">{s.num}</div>
                <h3 className="hp-step-title">{s.title}</h3>
                <p className="hp-step-desc">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── EQUIPE ── */}
      <section className="hp-section hp-section-light" id="equipe">
        <div className="hp-section-inner">
          <div className="hp-section-head">
            <span className="hp-tag">Notre équipe</span>
            <h2 className="hp-section-title">Des avocats à votre service</h2>
            <p className="hp-section-sub">
              Une équipe pluridisciplinaire passionnée et engagée pour défendre vos droits.
            </p>
          </div>
          <div className="hp-team-grid">
            {equipe.map((a) => (
              <div className="hp-team-card" key={a.nom}>
                <div className="hp-team-avatar">{a.prenom[0]}{a.nom[0]}</div>
                <div className="hp-team-exp">{a.exp} d'exp.</div>
                <div className="hp-team-name">{a.prenom} {a.nom}</div>
                <div className="hp-team-titre">{a.titre}</div>
                <div className="hp-team-spec">{a.specialite}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TÉMOIGNAGES ── */}
      <section className="hp-section hp-section-off" id="temoignages">
        <div className="hp-section-inner">
          <div className="hp-section-head">
            <span className="hp-tag">Témoignages</span>
            <h2 className="hp-section-title">Ce que disent nos clients</h2>
          </div>
          <div className="hp-temoignages">
            {temoignages.map((t) => (
              <div className="hp-temo-card" key={t.nom}>
                <div className="hp-temo-quote">"</div>
                <p className="hp-temo-text">{t.text}</p>
                <div className="hp-temo-author">
                  <div className="hp-temo-avatar">{t.nom[0]}</div>
                  <div>
                    <div className="hp-temo-name">{t.nom}</div>
                    <div className="hp-temo-role">{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CONTACT ── */}
      <section className="hp-section hp-section-blue" id="contact">
        <div className="hp-section-inner">
          <div className="hp-contact-box">
            <div className="hp-contact-left">
              <span className="hp-tag hp-tag-white">Nous contacter</span>
              <h2 className="hp-contact-title">Prêt à défendre vos droits ?</h2>
              <p className="hp-contact-sub">
                Prenez rendez-vous dès aujourd'hui pour une consultation confidentielle
                avec l'un de nos avocats experts.
              </p>
              <button className="hp-btn-primary hp-btn-white" onClick={() => navigate('/login')}>
                Prendre rendez-vous
              </button>
            </div>
            <div className="hp-contact-right">
              {[
                { icon: '📍', label: 'Adresse', val: 'Avenue Habib Bourguiba, Tunis 1000' },
                { icon: '📞', label: 'Téléphone', val: '+216 71 000 000' },
                { icon: '✉️', label: 'Email', val: 'contact@jurishub.tn' },
                { icon: '🕐', label: 'Horaires', val: 'Lun – Ven : 8h30 – 18h00' },
              ].map((c) => (
                <div className="hp-contact-info" key={c.label}>
                  <div className="hp-ci-icon">{c.icon}</div>
                  <div>
                    <div className="hp-ci-label">{c.label}</div>
                    <div className="hp-ci-val">{c.val}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="hp-footer">
        <div className="hp-footer-inner">
          <div className="hp-footer-brand">
            <Logo />
            <span className="hp-footer-logo-text">JurisHub</span>
          </div>
          <p className="hp-footer-sub">
            Cabinet d'avocats spécialisé, offrant des services juridiques d'excellence
            depuis 2009 à Tunis et dans toute la Tunisie.
          </p>
          <div className="hp-footer-links">
            <a href="#services">Services</a>
            <a href="#approche">Approche</a>
            <a href="#equipe">Équipe</a>
            <a href="#contact">Contact</a>
            <button onClick={() => navigate('/login')}>Espace client</button>
          </div>
          <div className="hp-footer-bottom">
            <span>© 2025 JurisHub — Tous droits réservés.</span>
            <span>Cabinet d'Avocats · Tunis, Tunisie</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
