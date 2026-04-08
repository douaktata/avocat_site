import React, { useState, useRef, useEffect } from 'react';
import { Scale, Users, FileText, Calendar, Phone, Mail, MapPin, Send, ChevronRight, Menu, X, MessageCircle, Bot, Shield } from 'lucide-react';
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
    { sender: 'bot', text: "Bonjour ! Je suis l'assistant juridique virtuel de JuriSHub. Comment puis-je vous aider aujourd'hui ?" }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef(null);

  const specialites = [
    { icon: Scale,    titre: "Droit de la Famille",  desc: "Divorce, garde d'enfants, pension alimentaire et successions." },
    { icon: FileText, titre: "Droit Commercial",     desc: "Contrats, litiges commerciaux et création d'entreprise." },
    { icon: Users,    titre: "Droit du Travail",     desc: "Contentieux prud'homal, licenciement et harcèlement." },
    { icon: Shield,   titre: "Droit Pénal",          desc: "Défense pénale, procédures judiciaires et assistance." }
  ];

  const actualites = [
    { jour: '15', mois: 'Jan', titre: "Nouvelle réforme du Code de la Famille",  extrait: "Les principales modifications entrées en vigueur affectent les procédures de divorce et de tutelle." },
    { jour: '10', mois: 'Jan', titre: "Jurisprudence : Droit du travail",         extrait: "Arrêt important concernant les contrats à durée déterminée et le renouvellement des postes." },
    { jour: '05', mois: 'Jan', titre: "Permanence juridique gratuite",            extrait: "Tous les mercredis de 14h à 17h, consultations gratuites pour toute demande d'information juridique." }
  ];

  const botResponses = {
    divorce: "Pour une procédure de divorce en Tunisie, vous avez plusieurs options : divorce par consentement mutuel, divorce pour préjudice, ou divorce pour discorde. Notre cabinet peut vous accompagner dans toutes ces démarches. Souhaitez-vous prendre rendez-vous ?",
    travail: "En matière de droit du travail, nous traitons les licenciements abusifs, les litiges sur les salaires, les accidents du travail et les harcèlements. Quelle est votre problématique spécifique ?",
    contrat: "Pour les questions contractuelles, nous pouvons vous aider avec la rédaction, la révision ou les litiges liés aux contrats commerciaux, de bail, de travail, etc. De quel type de contrat s'agit-il ?",
    penal:   "En droit pénal, notre cabinet assure la défense dans toutes les procédures pénales. Il est important d'agir rapidement. Je vous recommande de prendre rendez-vous pour discuter de votre situation.",
    rdv:     "Pour prendre rendez-vous avec Maître Ghofrane Hajaij : 1) Appeler au +216 72 282 755, 2) Envoyer un email à cabinet.maitre.hajaij@gmail.com, ou 3) Utiliser le formulaire de contact. Horaires : lun–ven 9h–18h.",
    tarif:   "Les honoraires varient selon la nature et la complexité du dossier. Lors d'une première consultation, nous établissons un devis personnalisé. Souhaitez-vous prendre rendez-vous ?",
    default: "Je comprends votre question. Pour une réponse précise et personnalisée, je vous recommande de prendre rendez-vous avec Maître Hajaij. Vous pouvez aussi me poser des questions sur : droit de la famille, droit commercial, droit du travail ou droit pénal."
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const getBotResponse = (userMessage) => {
    const msg = userMessage.toLowerCase();
    if (msg.includes('divorce') || msg.includes('séparation') || msg.includes('famille'))   return botResponses.divorce;
    if (msg.includes('travail') || msg.includes('licenciement') || msg.includes('salarié')) return botResponses.travail;
    if (msg.includes('contrat') || msg.includes('commercial'))                              return botResponses.contrat;
    if (msg.includes('pénal')   || msg.includes('plainte')     || msg.includes('accusation')) return botResponses.penal;
    if (msg.includes('rendez-vous') || msg.includes('rdv') || msg.includes('rencontrer'))   return botResponses.rdv;
    if (msg.includes('tarif') || msg.includes('prix') || msg.includes('honoraire'))         return botResponses.tarif;
    if (msg.includes('bonjour') || msg.includes('salut') || msg.includes('hello'))
      return "Bonjour ! Comment puis-je vous aider aujourd'hui ?";
    return botResponses.default;
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

  const handleInputChange = (e) => {
    setContactForm({ ...contactForm, [e.target.name]: e.target.value });
  };

  return (
    <div className="app">

      {/* ── HEADER ── */}
      <header>
        <nav className="container">
          {/* Logo : icône + texte sur la même ligne */}
          <div className="logo"><Scale /><span>JuriSHub</span></div>

          <div className="nav-links">
            <a href="#accueil">Accueil</a>
            <a href="#cabinet">Le Cabinet</a>
            <a href="#specialites">Spécialités</a>
            <a href="#actualites">Actualités</a>
            <a href="#contact">Contact</a>
          </div>

          <div className="nav-buttons">
            <button onClick={() => navigate('/choix')} className="btn btn-secondary">
              Connexion
            </button>
          </div>

          <button className="mobile-menu-btn" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </nav>

        {isMenuOpen && (
          <div className="mobile-menu container">
            <a href="#accueil"    onClick={() => setIsMenuOpen(false)}>Accueil</a>
            <a href="#cabinet"    onClick={() => setIsMenuOpen(false)}>Le Cabinet</a>
            <a href="#specialites" onClick={() => setIsMenuOpen(false)}>Spécialités</a>
            <a href="#actualites" onClick={() => setIsMenuOpen(false)}>Actualités</a>
            <a href="#contact"    onClick={() => setIsMenuOpen(false)}>Contact</a>
            <button onClick={() => navigate('/choix')} className="btn btn-secondary">Connexion</button>
          </div>
        )}
      </header>

      {/* ── HERO ── */}
      <section id="accueil" className="hero">
        <div className="container">
          <div className="hero-content">
            <div className="hero-badge">Cabinet d'Avocat · Tunisie</div>
            <h1>Cabinet d'Avocat<br />Maître Ghofrane Hajaij</h1>
            <p>
              Votre conseiller juridique de confiance. Expertise, écoute et accompagnement
              personnalisé pour défendre vos droits.
            </p>
            <div className="hero-buttons">
              <a href="#contact" className="btn btn-white">
                Prendre Rendez-vous
                <Calendar />
              </a>
              <a href="#specialites" className="btn btn-outline">
                Nos Spécialités
                <ChevronRight />
              </a>
            </div>
            <div className="hero-stats">
              <div className="hero-stat">
                <strong>15+</strong>
                <span>Années d'expérience</span>
              </div>
              <div className="hero-stat">
                <strong>500+</strong>
                <span>Dossiers traités</span>
              </div>
              <div className="hero-stat">
                <strong>4</strong>
                <span>Domaines d'expertise</span>
              </div>
            </div>
          </div>

          <div className="hero-image">
            <img src={img1} alt="Maître Ghofrane Hajaij" />
          </div>
        </div>
      </section>

      {/* ── LE CABINET ── */}
      <section id="cabinet" className="bg-white">
        <div className="container">
          <h2 className="section-title">Le Cabinet</h2>
          <div className="section-divider"></div>
          <p className="section-subtitle">Un engagement fort envers l'excellence juridique et la satisfaction de nos clients.</p>
          <div className="cabinet-grid">
            <div className="cabinet-text">
              <p>
                Le Cabinet de Maître Ghofrane Hajaij est un cabinet d'avocats moderne et dynamique,
                spécialisé dans plusieurs domaines du droit. Fort d'une expérience solide et d'une
                approche centrée sur le client, notre cabinet s'engage à fournir des services
                juridiques de haute qualité.
              </p>
              <p>
                Notre équipe met un point d'honneur à accompagner chaque client avec
                professionnalisme, transparence et confidentialité, en offrant des solutions
                juridiques adaptées à chaque situation.
              </p>
            </div>
            <div className="values-box">
              <h3>Nos Valeurs</h3>
              <ul className="values-list">
                <li><ChevronRight /><span>Excellence et rigueur juridique</span></li>
                <li><ChevronRight /><span>Écoute et proximité avec nos clients</span></li>
                <li><ChevronRight /><span>Confidentialité absolue</span></li>
                <li><ChevronRight /><span>Modernité et innovation</span></li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── SPÉCIALITÉS ── */}
      <section id="specialites" className="bg-gray">
        <div className="container">
          <h2 className="section-title">Nos Spécialités Juridiques</h2>
          <div className="section-divider"></div>
          <p className="section-subtitle">Des domaines d'expertise variés pour répondre à tous vos besoins juridiques.</p>
          <div className="specialties-grid">
            {specialites.map((spec, index) => (
              <div key={index} className="specialty-card">
                <spec.icon />
                <h3>{spec.titre}</h3>
                <p>{spec.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── ACTUALITÉS ── */}
      <section id="actualites" className="bg-white">
        <div className="container">
          <h2 className="section-title">Actualités &amp; Annonces</h2>
          <div className="section-divider"></div>
          <p className="section-subtitle">Restez informé des dernières évolutions juridiques et des nouvelles du cabinet.</p>
          <div className="news-list">
            {actualites.map((actu, index) => (
              <div key={index} className="news-item">
                <div className="news-date-block">
                  <span className="news-date-day">{actu.jour}</span>
                  <span className="news-date-month">{actu.mois}</span>
                </div>
                <div>
                  <h3 className="news-title">{actu.titre}</h3>
                  <p className="news-excerpt">{actu.extrait}</p>
                  <button type="button" className="news-link">
                    Lire la suite <ChevronRight />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CONTACT ── */}
      <section id="contact" className="bg-gray">
        <div className="container">
          <h2 className="section-title">Contactez-nous</h2>
          <div className="section-divider"></div>
          <p className="section-subtitle">N'hésitez pas à nous contacter pour toute question ou demande de consultation.</p>
          <div className="contact-grid">

            {/* Infos */}
            <div className="contact-info">
              <h3>Informations</h3>

              <div className="contact-item">
                <div className="contact-icon-box"><MapPin /></div>
                <div>
                  <h4>Adresse</h4>
                  <p>8050, avenue Koweit<br />Hammamet Nord, Nabeul<br />Tour Bleu, 2ème étage</p>
                </div>
              </div>

              <div className="contact-item">
                <div className="contact-icon-box"><Phone /></div>
                <div>
                  <h4>Téléphone</h4>
                  <p>+216 72 282 755</p>
                </div>
              </div>

              <div className="contact-item">
                <div className="contact-icon-box"><Mail /></div>
                <div>
                  <h4>Email</h4>
                  <p>cabinet.maitre.hajaij@gmail.com</p>
                </div>
              </div>

              <div className="hours-box">
                <h4>Horaires d'ouverture</h4>
                <p>Lundi – Vendredi : 9h00 – 18h00</p>
                <p>Samedi : Sur rendez-vous</p>
              </div>
            </div>

            {/* Formulaire */}
            <div className="contact-form">
              <h3>Envoyez-nous un message</h3>
              {submitted ? (
                <div className="success-message">
                  ✓ Message envoyé avec succès ! Nous vous répondrons dans les plus brefs délais.
                </div>
              ) : (
                <form onSubmit={handleContactSubmit}>
                  <div className="form-group">
                    <label>Nom complet</label>
                    <input type="text" name="nom" value={contactForm.nom} onChange={handleInputChange} placeholder="Votre nom" required />
                  </div>
                  <div className="form-group">
                    <label>Email</label>
                    <input type="email" name="email" value={contactForm.email} onChange={handleInputChange} placeholder="votre.email@example.com" required />
                  </div>
                  <div className="form-group">
                    <label>Téléphone</label>
                    <input type="tel" name="telephone" value={contactForm.telephone} onChange={handleInputChange} placeholder="+216 XX XXX XXX" />
                  </div>
                  <div className="form-group">
                    <label>Message</label>
                    <textarea name="message" value={contactForm.message} onChange={handleInputChange} rows="4" placeholder="Décrivez brièvement votre demande..." required></textarea>
                  </div>
                  <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '0.8rem' }}>
                    Envoyer le message
                    <Send />
                  </button>
                </form>
              )}
            </div>

          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer>
        <div className="container">
          <div className="footer-grid">
            <div>
              <div className="footer-logo">
                <Scale />
                <span>JuriSHub</span>
              </div>
              <p>Cabinet d'Avocat<br />Maître Ghofrane Hajaij<br />Hammamet Nord, Nabeul</p>
            </div>

            <div>
              <h4>Liens Rapides</h4>
              <ul>
                <li><a href="#accueil">Accueil</a></li>
                <li><a href="#cabinet">Le Cabinet</a></li>
                <li><a href="#specialites">Spécialités</a></li>
                <li><a href="#contact">Contact</a></li>
              </ul>
            </div>

            <div>
              <h4>Espace Client</h4>
              <ul>
                <li><a href="/choix">Connexion</a></li>
                <li>
                  <button
                    type="button"
                    className="news-link"
                    onClick={() => document.getElementById('contact').scrollIntoView({ behavior: 'smooth' })}
                  >
                    Prendre RDV
                  </button>
                </li>
              </ul>
            </div>

            <div className="footer-map-col">
              <h4>Nous Trouver</h4>
              <div className="footer-map-wrapper">
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d460.2681890653133!2d10.610153800584312!3d36.40707392736866!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x12fd611038b1e4f9%3A0xf2d50d6e19c30cca!2sTours%20bleus!5e0!3m2!1sfr!2stn!4v1771931594453!5m2!1sfr!2stn"
                  width="100%"
                  height="200"
                  style={{ border: 0, borderRadius: '10px' }}
                  allowFullScreen=""
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Localisation du cabinet"
                />
              </div>
            </div>
          </div>

          <div className="footer-bottom">
            <p>&copy; 2026 JuriSHub — Tous droits réservés</p>
          </div>
        </div>
      </footer>

      {/* ── CHATBOT BUTTON ── */}
      <button onClick={() => setIsChatOpen(!isChatOpen)} className="chatbot-button" aria-label="Assistant juridique">
        {isChatOpen ? <X /> : <MessageCircle />}
      </button>

      {/* ── CHATBOT WINDOW ── */}
      {isChatOpen && (
        <div className="chatbot-window">
          <div className="chat-header">
            <div className="chat-header-icon"><Bot /></div>
            <div>
              <h3>Assistant Juridique</h3>
              <p>En ligne</p>
            </div>
          </div>

          <div className="chat-messages">
            {chatMessages.map((msg, index) => (
              <div key={index} className={`chat-message ${msg.sender}`}>
                <div className={`message-bubble ${msg.sender}`}>
                  {msg.sender === 'bot' && (
                    <div className="bot-label"><Bot /><span>Assistant</span></div>
                  )}
                  <p>{msg.text}</p>
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="chat-message bot">
                <div className="message-bubble bot">
                  <div className="typing-indicator">
                    <div className="typing-dot"></div>
                    <div className="typing-dot"></div>
                    <div className="typing-dot"></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          <div className="chat-input-container">
            <div className="chat-input-wrapper">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyPress={handleChatKeyPress}
                placeholder="Posez votre question juridique..."
              />
              <button onClick={handleChatSubmit} className="chat-send-btn" aria-label="Envoyer">
                <Send />
              </button>
            </div>
            <p className="chat-disclaimer">Assistant automatique — Pour un conseil personnalisé, prenez rendez-vous</p>
          </div>
        </div>
      )}

    </div>
  );
}