import { useState, useRef, useEffect } from 'react';
import { Scale, Users, FileText, Calendar, Phone, Mail, MapPin, Send,
         ChevronRight, Menu, X, MessageCircle, Bot, Shield, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import img1 from './img1.png';
import './index.css';

export default function JuriSHubLanding() {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [contactForm, setContactForm] = useState({ nom: '', email: '', telephone: '', message: '' });
  const [submitted, setSubmitted] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState([
    { sender: 'bot', text: "Bonjour ! Je suis l'assistant juridique virtuel de Maître Hajaij. Comment puis-je vous aider aujourd'hui ?" }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef(null);

  const specialites = [
    { icon: Scale,    num: '01', titre: 'Droit de la Famille',  desc: "Divorce, garde d'enfants, pension alimentaire et successions familiales." },
    { icon: FileText, num: '02', titre: 'Droit Commercial',     desc: "Contrats, litiges commerciaux et accompagnement à la création d'entreprise." },
    { icon: Users,    num: '03', titre: 'Droit du Travail',     desc: "Contentieux prud'homal, licenciement abusif et harcèlement professionnel." },
    { icon: Shield,   num: '04', titre: 'Droit Pénal',          desc: "Défense pénale, procédures judiciaires et assistance à toutes les étapes." }
  ];

  const botResponses = {
    greeting:    "Bonjour ! Je suis l'assistant du Cabinet Maître Hajaij. Je peux vous renseigner sur nos services, nos horaires ou vous aider à préparer votre rendez-vous. Que puis-je faire pour vous ?",
    farewell:    "Au revoir et à bientôt ! N'hésitez pas à revenir si vous avez d'autres questions. Bonne journée !",
    thanks:      "Avec plaisir ! Y a-t-il autre chose que je puisse faire pour vous ? Je suis disponible pour répondre à toutes vos questions.",
    cabinet:     "Le Cabinet de Maître Ghofrane Hajaij est un cabinet d'avocats moderne basé à Hammamet Nord. Fondé en 2004, il accompagne entreprises et particuliers dans leurs démarches juridiques avec professionnalisme et confidentialité.",
    location:    "Notre cabinet est situé au : 8050 Avenue Koweit, Tour Bleu, 2ème étage — Hammamet Nord, Nabeul. Vous pouvez consulter la carte en bas de page pour nous trouver facilement.",
    horaires:    "Nos horaires d'ouverture :\n• Lundi – Vendredi : 9h00 – 18h00\n• Samedi : sur rendez-vous uniquement\n• Dimanche : fermé\nPour toute urgence, appelez le +216 72 282 755.",
    rdv:         "Pour prendre rendez-vous :\n📞 Appeler : +216 72 282 755\n✉️ Email : cabinet.maitre.hajaij@gmail.com\n📝 Formulaire de contact en bas de cette page\n\nNos horaires : lun–ven 9h–18h, sam sur RDV.",
    tarif:       "Les honoraires sont fixés selon la nature et la complexité de votre dossier. Nous proposons une première consultation pour évaluer votre situation et établir un devis personnalisé. N'hésitez pas à nous contacter.",
    divorce:     "Pour un divorce en Tunisie, plusieurs voies existent :\n• Divorce par consentement mutuel (khol'â)\n• Divorce pour préjudice\n• Divorce pour discorde (chiqaq)\n\nChaque procédure a ses spécificités. Maître Hajaij vous guidera selon votre situation. Souhaitez-vous prendre rendez-vous ?",
    garde:       "Pour les questions de garde d'enfants, nous traitons :\n• La garde physique et juridique\n• Le droit de visite et d'hébergement\n• La pension alimentaire\n• La révision des jugements existants\n\nL'intérêt supérieur de l'enfant est toujours notre priorité.",
    pension:     "La pension alimentaire peut être fixée ou révisée par le tribunal selon les revenus des parents et les besoins de l'enfant. En cas de non-paiement, des voies d'exécution forcée sont disponibles. Contactez-nous pour plus d'informations.",
    succession:  "En matière de succession, nous vous accompagnons pour :\n• L'ouverture et le règlement de successions\n• Le partage des biens entre héritiers\n• Les testaments et donations\n• Les successions internationales\n\nChaque situation est unique — un accompagnement juridique est conseillé.",
    travail:     "En droit du travail, nous intervenons pour :\n• Licenciements abusifs ou injustifiés\n• Litiges sur les salaires et heures supplémentaires\n• Accidents du travail et maladies professionnelles\n• Harcèlement moral ou sexuel au travail\n• Rupture de contrat et indemnités\n\nQuelle est votre situation ?",
    harcelement: "Le harcèlement (moral, sexuel ou professionnel) est une situation grave. Il est important d'agir rapidement pour constituer un dossier solide. Nous vous accompagnons dans toutes les démarches judiciaires et administratives. Appelez-nous au +216 72 282 755.",
    contrat:     "Nous intervenons sur tous types de contrats :\n• Rédaction et révision de contrats commerciaux\n• Contrats de bail (résidentiel ou commercial)\n• Contrats de travail\n• Accords de partenariat et statuts d'entreprise\n• Litiges contractuels et résiliation\n\nDe quel type de contrat avez-vous besoin ?",
    immobilier:  "En droit immobilier, notre cabinet traite :\n• Les litiges locatifs (loyers impayés, expulsions)\n• Les vices cachés et malfaçons\n• Les transactions immobilières\n• Les copropriétés et servitudes\n• Les saisies immobilières\n\nSouhaitez-vous être rappelé ?",
    penal:       "En droit pénal, le cabinet assure :\n• La défense lors des gardes à vue\n• La représentation devant toutes les juridictions pénales\n• L'assistance aux victimes et la constitution de partie civile\n• Les recours en appel et en cassation\n\nIl est crucial d'agir rapidement. Contactez-nous au +216 72 282 755.",
    urgence:     "Pour toute urgence juridique (garde à vue, expulsion imminente, violence…), contactez directement le cabinet : 📞 +216 72 282 755. Maître Hajaij intervient en urgence pour protéger vos droits.",
    domaines:    "Le cabinet couvre 4 domaines principaux :\n⚖️ Droit de la Famille (divorce, garde, pension)\n📋 Droit Commercial (contrats, entreprises)\n👷 Droit du Travail (licenciement, harcèlement)\n🛡️ Droit Pénal (défense, victimes)\n\nSur quel domaine souhaitez-vous des informations ?",
    contact:     "Pour nous contacter :\n📞 +216 72 282 755\n✉️ cabinet.maitre.hajaij@gmail.com\n📍 Tour Bleu, 2ème étage — Hammamet Nord\n\nHoraires : lun–ven 9h–18h, sam sur RDV.",
    default:     "Je ne suis pas sûr de comprendre votre question. Voici ce sur quoi je peux vous renseigner :\n• 📅 Prendre rendez-vous\n• 💰 Honoraires\n• 📍 Adresse & horaires\n• ⚖️ Droit de la famille\n• 👷 Droit du travail\n• 📋 Droit commercial\n• 🛡️ Droit pénal\n• 🆘 Urgence\n\nPosez votre question ou appelez le +216 72 282 755."
  };

  const quickReplies = [
    { label: "Prendre RDV", key: "rdv" },
    { label: "Nos domaines", key: "domaines" },
    { label: "Honoraires", key: "tarif" },
    { label: "Adresse & horaires", key: "horaires" },
    { label: "Urgence", key: "urgence" },
  ];

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [chatMessages]);

  const getBotResponse = (userMessage) => {
    const msg = userMessage.toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, ''); // strip accents for matching

    if (msg.match(/bonjour|salut|bonsoir|hello|hi|coucou/))                                              return botResponses.greeting;
    if (msg.match(/au revoir|bye|bonne journee|bonne soiree|a bientot/))                                 return botResponses.farewell;
    if (msg.match(/merci|thank|parfait|super|nickel/))                                                   return botResponses.thanks;
    if (msg.match(/urgence|urgent|garde a vue|expulsion|violence|imminent/))                             return botResponses.urgence;
    if (msg.match(/rendez.vous|rdv|consultat|rencontrer|appointment/))                                   return botResponses.rdv;
    if (msg.match(/domaine|specialite|service|expertise|pratique/))                                      return botResponses.domaines;
    if (msg.match(/divorce|separation|rupture|mariage|epoux|epouse/))                                    return botResponses.divorce;
    if (msg.match(/garde|enfant|enfants|mineur|custodie/))                                               return botResponses.garde;
    if (msg.match(/pension|alimentaire|aliment|subsistance/))                                            return botResponses.pension;
    if (msg.match(/succession|heritage|heriter|testament|donation|heritier/))                            return botResponses.succession;
    if (msg.match(/famille|familial|conjugal/))                                                          return botResponses.divorce;
    if (msg.match(/harcelement|harcel|intimidation|agression/))                                          return botResponses.harcelement;
    if (msg.match(/licenci|travail|emploi|salaire|contrat de travail|chomage|prud/))                     return botResponses.travail;
    if (msg.match(/contrat|bail|clause|accord|convention|partenariat|statut/))                           return botResponses.contrat;
    if (msg.match(/immobilier|loyer|locataire|proprietaire|expuls|copropri|logement/))                   return botResponses.immobilier;
    if (msg.match(/commercial|entreprise|societe|creation|litige commercial/))                           return botResponses.contrat;
    if (msg.match(/penal|crime|delit|plainte|victime|prison|tribunal|justice|accusation|infraction/))    return botResponses.penal;
    if (msg.match(/tarif|prix|cout|honoraire|frais|combien|devis/))                                      return botResponses.tarif;
    if (msg.match(/cabinet|maitre|avocat|qui etes|qui est|presentation/))                                return botResponses.cabinet;
    if (msg.match(/adresse|localisation|ou etes|ou est|trouver|situe|plan|maps/))                        return botResponses.location;
    if (msg.match(/heure|horaire|ouvert|ouverture|ferme|disponible|quand/))                              return botResponses.horaires;
    if (msg.match(/contact|telephone|email|appeler|joindre|numero/))                                     return botResponses.contact;
    return botResponses.default;
  };

  const handleQuickReply = (key) => {
    const label = quickReplies.find(q => q.key === key)?.label || key;
    setChatMessages(prev => [...prev, { sender: 'user', text: label }]);
    setIsTyping(true);
    setTimeout(() => {
      setChatMessages(prev => [...prev, { sender: 'bot', text: botResponses[key] }]);
      setIsTyping(false);
    }, 800);
  };

  const handleChatSubmit = () => {
    if (!chatInput.trim()) return;
    setChatMessages(prev => [...prev, { sender: 'user', text: chatInput }]);
    setChatInput('');
    setIsTyping(true);
    setTimeout(() => {
      setChatMessages(prev => [...prev, { sender: 'bot', text: getBotResponse(chatInput) }]);
      setIsTyping(false);
    }, 1000);
  };

  const handleChatKeyPress = (e) => { if (e.key === 'Enter') handleChatSubmit(); };

  const handleContactSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setContactForm({ nom: '', email: '', telephone: '', message: '' });
    }, 3500);
  };

  const handleInputChange = (e) => setContactForm({ ...contactForm, [e.target.name]: e.target.value });

  return (
    <div className="app">

      {/* ══════════ HEADER ══════════ */}
      <header>
        <nav>
          <div className="logo">
            <Scale size={18} />
            <span>JurisHub</span>
          </div>

          <div className="nav-links">
            <a href="#accueil">Accueil</a>
            <a href="#cabinet">Le cabinet</a>
            <a href="#specialites">Spécialités</a>
            <a href="#contact">Contact</a>
          </div>

          <div className="nav-buttons">
            <button onClick={() => navigate('/choix')} className="btn">Connexion</button>
          </div>

          <button className="mobile-menu-btn" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </nav>

        {isMenuOpen && (
          <div className="mobile-menu">
            <a href="#accueil"     onClick={() => setIsMenuOpen(false)}>Accueil</a>
            <a href="#cabinet"     onClick={() => setIsMenuOpen(false)}>Le cabinet</a>
            <a href="#specialites" onClick={() => setIsMenuOpen(false)}>Spécialités</a>
            <a href="#contact"     onClick={() => setIsMenuOpen(false)}>Contact</a>
            <button onClick={() => navigate('/choix')} className="btn">Espace Client</button>
          </div>
        )}
      </header>

      {/* ══════════ HERO ══════════ */}
      <section id="accueil" className="hero">
        <div className="hero-inner">

          <div className="hero-badge">
            <span>Cabinet d'Avocats</span>
            <span className="sep">·</span>
            <span>Hammamet, Tunisie</span>
            <span className="sep">·</span>
            <span>Fondé en 2004</span>
          </div>

          <h1>
            Précision et rigueur
            <em>au service de la justice</em>
          </h1>

          <p className="hero-sub">
            Plus de deux décennies d'excellence au service des entreprises
            et des particuliers — un accompagnement juridique raffiné, sur‑mesure,
            et profondément humain.
          </p>

          <div className="hero-actions">
            <a href="#contact" className="cta-primary">
              <Calendar size={15} />
              Prendre rendez-vous
            </a>
            <a href="#cabinet" className="cta-ghost">Découvrir le cabinet <ChevronRight size={14} /></a>
          </div>

          <div className="hero-stats">
            <div className="stat">
              <span className="stat-n">500+</span>
              <span className="stat-l">Dossiers traités</span>
            </div>
            <div className="stat-sep" />
            <div className="stat">
              <span className="stat-n">98%</span>
              <span className="stat-l">Satisfaction clients</span>
            </div>
            <div className="stat-sep" />
            <div className="stat">
              <span className="stat-n">20+</span>
              <span className="stat-l">Années d'excellence</span>
            </div>
          </div>

        </div>
      </section>

      {/* ══════════ LE CABINET ══════════ */}
      <section id="cabinet" className="sec sec-lt">
        <div className="container">
          <div className="cabinet-wrap">

            <div className="portrait-frame">
              <div className="portrait-outer">
                <img src={img1} alt="Maître Ghofrane Hajaij" className="portrait-img" />
              </div>
            </div>

            <div className="cabinet-text">
              <div className="sh">
                <div className="rule">
                  <div className="rule-line" />
                  <span className="rule-label">Le cabinet</span>
                </div>
                <h2 className="sh-title">
                  Maître Ghofrane Hajaij<br />
                  <em>Excellence &amp; Engagement</em>
                </h2>
              </div>

              <p>
                Le Cabinet de Maître Ghofrane Hajaij est un cabinet d'avocats <strong>moderne et dynamique</strong>,
                spécialisé dans plusieurs domaines du droit tunisien et international. Fort d'une expérience
                solide et d'une approche centrée sur le client, notre cabinet s'engage à fournir des services
                juridiques de haute qualité.
              </p>
              <p>
                Notre équipe met un point d'honneur à accompagner chaque client avec <strong>professionnalisme,
                transparence et confidentialité</strong>, en offrant des solutions juridiques adaptées à chaque
                situation particulière. Chaque dossier est traité avec la même rigueur et le même engagement.
              </p>
              <p>
                Installé au cœur de Hammamet Nord, le cabinet accueille entreprises et particuliers dans
                un cadre confidentiel et professionnel, avec une disponibilité réelle et une écoute attentive.
              </p>


            </div>

          </div>
        </div>
      </section>

      {/* ══════════ SPÉCIALITÉS ══════════ */}
      <section id="specialites" className="sec">
        <div className="container">
          <div className="sh center">
            <div className="rule">
              <div className="rule-line" />
              <span className="rule-label">Domaines d'expertise</span>
              <div className="rule-line" />
            </div>
            <h2 className="sh-title">Nos Spécialités Juridiques</h2>
            <p className="sh-sub">Une expertise pluridisciplinaire pour répondre à l'ensemble de vos besoins juridiques avec précision.</p>
          </div>

          <div className="spec-grid">
            {specialites.map((spec, i) => (
              <div key={i} className="spec-tile">
                <div className="spec-tile-top">
                  <div className="spec-icon-wrap">
                    <spec.icon size={20} />
                  </div>
                  <span className="spec-num">{spec.num}</span>
                </div>
                <h3>{spec.titre}</h3>
                <p>{spec.desc}</p>
                <div className="spec-arrow"><ChevronRight size={14} /></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════ CONTACT ══════════ */}
      <section id="contact" className="sec sec-lt">
        <div className="container">
          <div className="sh center">
            <div className="rule">
              <div className="rule-line" />
              <span className="rule-label">Contact</span>
              <div className="rule-line" />
            </div>
            <h2 className="sh-title">Prenez Rendez-vous</h2>
            <p className="sh-sub">N'hésitez pas à nous contacter pour toute question juridique ou demande de consultation.</p>
          </div>

          <div className="contact-wrap">

            {/* Info side */}
            <div className="ci-col">
              <div className="ci-item">
                <div className="ci-ic"><MapPin size={17} /></div>
                <div>
                  <p className="ci-eyebrow">Adresse</p>
                  <p className="ci-val">8050 Avenue Koweit, Hammamet Nord<br />Tour Bleu, 2ème étage · Nabeul</p>
                </div>
              </div>
              <div className="ci-item">
                <div className="ci-ic"><Phone size={17} /></div>
                <div>
                  <p className="ci-eyebrow">Téléphone</p>
                  <p className="ci-val">+216 72 282 755</p>
                </div>
              </div>
              <div className="ci-item">
                <div className="ci-ic"><Mail size={17} /></div>
                <div>
                  <p className="ci-eyebrow">Email</p>
                  <p className="ci-val">cabinet.maitre.hajaij@gmail.com</p>
                </div>
              </div>

              <div className="hours-panel">
                <div className="hours-hd">
                  <Clock size={14} />
                  <p className="hours-title">Horaires d'ouverture</p>
                </div>
                <div className="hours-row"><span>Lundi – Vendredi</span><span className="hours-open">9h00 – 18h00</span></div>
                <div className="hours-row"><span>Samedi</span><span className="hours-open">Sur rendez-vous</span></div>
                <div className="hours-row"><span>Dimanche</span><span className="hours-closed">Fermé</span></div>
              </div>
            </div>

            {/* Form side */}
            <div className="form-shell">
              {submitted ? (
                <div className="form-success">
                  <div className="form-success-icon">✓</div>
                  <h4>Message envoyé</h4>
                  <p>Nous vous répondrons dans les plus brefs délais.</p>
                </div>
              ) : (
                <form onSubmit={handleContactSubmit}>
                  <div className="form-row">
                    <div className="fg">
                      <label>Nom complet</label>
                      <input type="text" name="nom" value={contactForm.nom} onChange={handleInputChange} placeholder="Votre nom" required />
                    </div>
                    <div className="fg">
                      <label>Email</label>
                      <input type="email" name="email" value={contactForm.email} onChange={handleInputChange} placeholder="votre@email.com" required />
                    </div>
                  </div>
                  <div className="fg">
                    <label>Téléphone</label>
                    <input type="tel" name="telephone" value={contactForm.telephone} onChange={handleInputChange} placeholder="+216 XX XXX XXX" />
                  </div>
                  <div className="fg">
                    <label>Objet</label>
                    <input type="text" name="objet" placeholder="Droit de la famille, commercial..." />
                  </div>
                  <div className="fg">
                    <label>Message</label>
                    <textarea name="message" value={contactForm.message} onChange={handleInputChange} rows="5" placeholder="Décrivez brièvement votre situation juridique..." required />
                  </div>
                  <button type="submit" className="form-cta">
                    <Send size={14} />
                    Envoyer le message
                  </button>
                </form>
              )}
            </div>

          </div>
        </div>
      </section>

      {/* ══════════ FOOTER ══════════ */}
      <footer>
        <div className="footer-top">
          <div className="f-brand">
            <div className="f-logo"><Scale size={18} /><span>JurisHub</span></div>
            <p>Cabinet d'Avocat indépendant<br />Maître Ghofrane Hajaij<br />Hammamet Nord · Nabeul · Tunisie</p>
          </div>
          <div className="f-col">
            <h5>Navigation</h5>
            <ul>
              <li><a href="#accueil">Accueil</a></li>
              <li><a href="#cabinet">Le Cabinet</a></li>
              <li><a href="#specialites">Spécialités</a></li>
              <li><a href="#contact">Contact</a></li>
            </ul>
          </div>
          <div className="f-col">
            <h5>Espace Client</h5>
            <ul>
              <li><a href="/choix">Connexion</a></li>
              <li>
                <button type="button" className="f-link-btn"
                  onClick={() => document.getElementById('contact').scrollIntoView({ behavior: 'smooth' })}>
                  Prendre RDV
                </button>
              </li>
            </ul>
          </div>
          <div className="f-col f-map">
            <h5>Nous Trouver</h5>
            <div className="f-map">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d460.2681890653133!2d10.610153800584312!3d36.40707392736866!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x12fd611038b1e4f9%3A0xf2d50d6e19c30cca!2sTours%20bleus!5e0!3m2!1sfr!2stn!4v1771931594453!5m2!1sfr!2stn"
                width="100%" height="150"
                style={{ border: 0, display: 'block', borderRadius: '2px' }}
                allowFullScreen="" loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Carte du cabinet footer"
              />
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <span>&copy; 2026 Cabinet Maître Ghofrane Hajaij — Tous droits réservés</span>
          <span>Hammamet Nord · Nabeul · Tunisie</span>
        </div>
      </footer>

      {/* ══════════ CHATBOT ══════════ */}
      <button
        onClick={() => setIsChatOpen(!isChatOpen)}
        className="chatbot-trigger"
        aria-label="Assistant juridique"
      >
        {isChatOpen ? <X size={20} /> : <MessageCircle size={20} />}
      </button>

      {isChatOpen && (
        <div className="chatbot-panel">
          <div className="chat-hd">
            <div className="chat-hd-av"><Bot size={16} /></div>
            <div>
              <h3>Assistant Juridique</h3>
              <p>Cabinet Hajaij · En ligne</p>
            </div>
            <div className="chat-online" />
          </div>

          <div className="chat-body">
            {chatMessages.map((msg, i) => (
              <div key={i} className={`cm ${msg.sender}`}>
                <div className={`bubble ${msg.sender}`}>
                  {msg.sender === 'bot' && (
                    <div className="bot-tag"><Bot size={9} /><span>Assistant</span></div>
                  )}
                  {msg.text.split('\n').map((line, j) => (
                    line ? <p key={j} style={{ margin: '0 0 0.15rem' }}>{line}</p>
                         : <br key={j} />
                  ))}
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="cm bot">
                <div className="bubble bot">
                  <div className="bot-tag"><Bot size={9} /><span>Assistant</span></div>
                  <div className="t-row">
                    <div className="t-dot" /><div className="t-dot" /><div className="t-dot" />
                  </div>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          <div className="chat-suggestions">
            {quickReplies.map(q => (
              <button key={q.key} className="chat-chip" onClick={() => handleQuickReply(q.key)}>
                {q.label}
              </button>
            ))}
          </div>

          <div className="chat-ft">
            <div className="chat-input-row">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyPress={handleChatKeyPress}
                placeholder="Posez votre question..."
              />
              <button onClick={handleChatSubmit} className={`chat-send${chatInput.trim() ? ' active' : ''}`} aria-label="Envoyer">
                <Send size={14} />
              </button>
            </div>
            <p className="chat-note">Assistant automatique — Consultez un avocat pour un avis personnalisé</p>
          </div>
        </div>
      )}

    </div>
  );
}