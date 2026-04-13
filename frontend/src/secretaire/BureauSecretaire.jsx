import { useState, useMemo } from 'react';
import {
  Sparkles, CalendarCheck, PhoneCall, DoorOpen,
  Search, X, Plus, Eye, Check, XCircle, Undo2,
  ArrowUp, Trash2, Phone, Mail, Calendar, Clock,
  AlignLeft, User, ArrowDownLeft, ArrowUpRight,
  UserCheck, StickyNote, Settings, AlertTriangle,
  CheckCircle2, Hourglass, MessageSquare,
} from 'lucide-react';
import './BureauSecretaire.css';

/* ── Meta ── */
const STATUT_META = {
  en_attente: { label: 'En attente',    cls: 'bur-b-amber',  Icon: Clock         },
  confirme:   { label: 'Confirmé',      cls: 'bur-b-green',  Icon: CheckCircle2  },
  rejete:     { label: 'Rejeté',        cls: 'bur-b-red',    Icon: XCircle       },
  waitlist:   { label: "Liste d'attente", cls: 'bur-b-slate', Icon: Hourglass     },
};
const TYPE_META = {
  consultation: { label: 'Consultation', cls: 'bur-t-blue',   Icon: MessageSquare },
  signature:    { label: 'Signature',    cls: 'bur-t-violet', Icon: AlignLeft     },
  suivi:        { label: 'Suivi',        cls: 'bur-t-cyan',   Icon: Eye           },
};

const fmtDate = d => d ? new Date(d).toLocaleDateString('fr-FR', { weekday: 'short', day: '2-digit', month: 'long', year: 'numeric' }) : '—';
const fmtDT   = d => d ? new Date(d).toLocaleString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';
const initials = n => n ? n.trim().split(' ').filter(Boolean).slice(0,2).map(w => w[0]).join('').toUpperCase() : '?';

/* ════════════════════════════════════════════════════
   COMPONENT
   ════════════════════════════════════════════════════ */
export default function BureauSecretaire() {
  const [activeTab,    setActiveTab]    = useState('demandes');
  const [searchTerm,   setSearchTerm]   = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [showModal,    setShowModal]    = useState(false);
  const [modalType,    setModalType]    = useState('');
  const [selectedDemande, setSelectedDemande] = useState(null);

  const [demandes, setDemandes] = useState([
    { id:1, nom:'Dubois',   prenom:'Jean',    email:'jean.dubois@email.com',     telephone:'+216 20 123 456', dateProposee:'2026-02-24', heureProposee:'10:00', motif:'Consultation en droit civil - Litige avec un voisin',  type:'consultation', urgent:true,  statut:'en_attente', dateCreation:'2026-02-18' },
    { id:2, nom:'Martin',   prenom:'Sophie',  email:'sophie.martin@email.com',   telephone:'+216 22 345 678', dateProposee:'2026-02-24', heureProposee:'10:00', motif:'Signature de contrat de vente immobilière',            type:'signature',    urgent:false, statut:'en_attente', dateCreation:'2026-02-17' },
    { id:3, nom:'Bernard',  prenom:'Pierre',  email:'pierre.bernard@email.com',  telephone:'+216 25 456 789', dateProposee:'2026-02-25', heureProposee:'14:00', motif:'Demande de conseil juridique - Droit du travail',      type:'consultation', urgent:false, statut:'confirme',   dateCreation:'2026-02-15' },
    { id:4, nom:'Lefebvre', prenom:'Marie',   email:'marie.lefebvre@email.com',  telephone:'+216 28 567 890', dateProposee:'2026-02-26', heureProposee:'09:00', motif:'Suivi dossier divorce - Audiences prochaines',         type:'suivi',        urgent:true,  statut:'en_attente', dateCreation:'2026-02-19' },
    { id:5, nom:'Rousseau', prenom:'Claire',  email:'claire.rousseau@email.com', telephone:'+216 30 678 901', dateProposee:'2026-02-27', heureProposee:'11:00', motif:'Première consultation - Succession',                   type:'consultation', urgent:false, statut:'waitlist',   dateCreation:'2026-02-16' },
    { id:6, nom:'Moreau',   prenom:'Luc',     email:'luc.moreau@email.com',      telephone:'+216 32 789 012', dateProposee:'2026-02-28', heureProposee:'14:30', motif:'Révision contrat de travail',                          type:'consultation', urgent:false, statut:'rejete',     dateCreation:'2026-02-14' },
  ]);

  const [appels, setAppels] = useState([
    { id:1, nom:'Pierre Bernard',  telephone:'+216 25 456 789', dateHeure:'2026-02-20T09:30', motif:"Demande d'information sur une procédure de divorce",  direction:'entrant', clientExistant:false, notes:"À rappeler demain après consultation de l'agenda", traite:false },
    { id:2, nom:'Claire Rousseau', telephone:'+216 30 678 901', dateHeure:'2026-02-20T11:15', motif:'Suivi dossier succession - Demande de nouvelles',       direction:'entrant', clientExistant:true,  notes:'Client existant - Dossier 2026-045',               traite:true  },
    { id:3, nom:'Jean Dubois',     telephone:'+216 20 123 456', dateHeure:'2026-02-19T15:00', motif:'Confirmation de rendez-vous du 24/02',                  direction:'sortant', clientExistant:true,  notes:'Confirmé pour 10h00',                              traite:true  },
    { id:4, nom:'Thomas Petit',    telephone:'+216 34 890 123', dateHeure:'2026-02-19T10:20', motif:'Demande de report de rendez-vous',                      direction:'entrant', clientExistant:true,  notes:'Reporter au 03/03 - Attente confirmation avocate', traite:false },
  ]);

  const [presences, setPresences] = useState([
    { id:1, nom:'Isabelle Durand', dateHeure:'2026-02-20T10:00', motif:"Récupération d'un document administratif", demande:'Copie du jugement de divorce',            traitePar:'En attente validation avocate', notes:'Document à récupérer avant 17h' },
    { id:2, nom:'Marc Leroy',      dateHeure:'2026-02-19T15:30', motif:'Signature de documents',                   demande:'Signature convention amiable',            traitePar:'Signé et remis',                notes:'' },
    { id:3, nom:'Fatima Benali',   dateHeure:'2026-02-19T09:15', motif:'Dépôt de pièces justificatives',           demande:'Pièces pour dossier accident de travail', traitePar:'Reçu - Transmis à avocate',    notes:'Dossier complet' },
  ]);

  const [newAppel, setNewAppel] = useState({ nom:'', telephone:'', dateHeure:'', motif:'', direction:'entrant', clientExistant:false, notes:'', traite:false });
  const [newPresence, setNewPresence] = useState({ nom:'', dateHeure:'', motif:'', demande:'', traitePar:'En attente', notes:'' });

  /* ── Stats ── */
  const stats = {
    enAttente:   demandes.filter(d => d.statut === 'en_attente').length,
    confirme:    demandes.filter(d => d.statut === 'confirme').length,
    nonTraites:  appels.filter(a => !a.traite).length,
    visites:     presences.length,
  };

  /* ── Filter demandes ── */
  const demandesFiltrees = useMemo(() => [...demandes]
    .filter(d => {
      const q = searchTerm.toLowerCase();
      const match = !searchTerm ||
        `${d.prenom} ${d.nom}`.toLowerCase().includes(q) ||
        d.email.toLowerCase().includes(q) ||
        d.motif.toLowerCase().includes(q);
      return match && (!filterStatus || d.statut === filterStatus);
    })
    .sort((a, b) => (b.urgent ? 1 : 0) - (a.urgent ? 1 : 0) || new Date(a.dateProposee) - new Date(b.dateProposee)),
  [demandes, searchTerm, filterStatus]);

  /* ── Handlers ── */
  const handleStatusChange = (id, newStatus) => {
    if (newStatus === 'confirme') {
      const d = demandes.find(x => x.id === id);
      setDemandes(demandes.map(x =>
        x.id === id ? { ...x, statut: 'confirme' }
        : (x.dateProposee === d?.dateProposee && x.heureProposee === d?.heureProposee && x.statut === 'en_attente')
          ? { ...x, statut: 'waitlist' } : x
      ));
    } else {
      setDemandes(demandes.map(x => x.id === id ? { ...x, statut: newStatus } : x));
    }
  };

  const handleAddAppel = e => {
    e.preventDefault();
    setAppels([{ id: Date.now(), ...newAppel }, ...appels]);
    setNewAppel({ nom:'', telephone:'', dateHeure:'', motif:'', direction:'entrant', clientExistant:false, notes:'', traite:false });
    setShowModal(false);
  };
  const handleAddPresence = e => {
    e.preventDefault();
    setPresences([{ id: Date.now(), ...newPresence }, ...presences]);
    setNewPresence({ nom:'', dateHeure:'', motif:'', demande:'', traitePar:'En attente', notes:'' });
    setShowModal(false);
  };

  const openModal = (type, data = null) => { setModalType(type); setSelectedDemande(data); setShowModal(true); };

  const tabs = [
    { key: 'demandes', label: 'Demandes de RDV',    Icon: CalendarCheck, count: stats.enAttente,  warn: false },
    { key: 'appels',   label: "Journal d'appels",   Icon: PhoneCall,     count: stats.nonTraites, warn: true  },
    { key: 'presence', label: 'Journal de présence', Icon: DoorOpen,      count: stats.visites,    warn: false },
  ];

  return (
    <div className="bur">

      {/* ── HEADER BANNER ── */}
      <div className="bur-header">
        <div className="bur-header-blob" />
        <div className="bur-header-top">
          <div className="bur-eyebrow"><Sparkles size={11} /> Gestion du bureau</div>
          <h1 className="bur-title">Bureau <em>du cabinet</em></h1>
          <p className="bur-subtitle">Gérez les demandes de rendez-vous, appels et visites du Cabinet Hajaij</p>
        </div>
        <div className="bur-header-divider" />
        <div className="bur-header-stats">
          <div className="bur-hstat">
            <span className="bur-hstat-number">{demandes.length}</span>
            <span className="bur-hstat-label">Demandes total</span>
          </div>
          <div className="bur-hstat-sep" />
          <div className="bur-hstat">
            <span className="bur-hstat-number bur-hn-amber">{stats.enAttente}</span>
            <span className="bur-hstat-label">En attente</span>
          </div>
          <div className="bur-hstat-sep" />
          <div className="bur-hstat">
            <span className="bur-hstat-number bur-hn-green">{stats.confirme}</span>
            <span className="bur-hstat-label">Confirmées</span>
          </div>
          <div className="bur-hstat-sep" />
          <div className="bur-hstat">
            <span className="bur-hstat-number bur-hn-red">{stats.nonTraites}</span>
            <span className="bur-hstat-label">Appels non traités</span>
          </div>
          <div className="bur-hstat-sep" />
          <div className="bur-hstat">
            <span className="bur-hstat-number">{stats.visites}</span>
            <span className="bur-hstat-label">Visites</span>
          </div>
        </div>
      </div>

      {/* ── TABS ── */}
      <div className="bur-tabs">
        {tabs.map(({ key, label, Icon, count, warn }) => (
          <button key={key} className={`bur-tab ${activeTab === key ? 'bur-tab-active' : ''}`} onClick={() => setActiveTab(key)}>
            <Icon size={14} />
            {label}
            {count > 0 && (
              <span className={`bur-tab-count${warn ? ' warn' : ''}`}>{count}</span>
            )}
          </button>
        ))}
      </div>

      {/* ══════════════════════════════════════
          TAB — DEMANDES DE RDV
      ══════════════════════════════════════ */}
      {activeTab === 'demandes' && (
        <div className="bur-section">

          {/* Toolbar */}
          <div className="bur-toolbar">
            <div className="bur-search">
              <Search size={15} className="bur-search-ic" />
              <input
                type="text" placeholder="Rechercher par nom, email ou motif…"
                value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
              />
              {searchTerm && <button className="bur-clear" onClick={() => setSearchTerm('')}><X size={14} /></button>}
            </div>
            <select className="bur-sel" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
              <option value="">Tous les statuts</option>
              <option value="en_attente">En attente</option>
              <option value="confirme">Confirmé</option>
              <option value="waitlist">Liste d'attente</option>
              <option value="rejete">Rejeté</option>
            </select>
            <span className="bur-count">{demandesFiltrees.length} demande{demandesFiltrees.length !== 1 ? 's' : ''}</span>
          </div>

          {/* Cards */}
          {demandesFiltrees.length === 0 ? (
            <div className="bur-empty">
              <div className="bur-empty-icon"><CalendarCheck size={28} /></div>
              <p className="bur-empty-title">Aucune demande trouvée</p>
              <p className="bur-empty-sub">Modifiez vos critères de recherche</p>
            </div>
          ) : (
            <div className="bur-list">
              {demandesFiltrees.map(d => {
                const sm = STATUT_META[d.statut] || STATUT_META.en_attente;
                const tm = TYPE_META[d.type]     || TYPE_META.consultation;
                const { Icon: SI } = sm;
                const { Icon: TI } = tm;
                return (
                  <div key={d.id} className={`bur-card${d.urgent ? ' urgent' : ''}`}>
                    {d.urgent && (
                      <div className="bur-urgent-ribbon"><AlertTriangle size={11} /> URGENT</div>
                    )}
                    <div className="bur-card-top">
                      <div className="bur-card-client">
                        <div className="bur-avatar">{initials(`${d.prenom} ${d.nom}`)}</div>
                        <div>
                          <p className="bur-client-name">{d.prenom} {d.nom}</p>
                          <div className="bur-contact">
                            <span><Phone size={11} />{d.telephone}</span>
                            <span><Mail size={11} />{d.email}</span>
                          </div>
                        </div>
                      </div>
                      <div className="bur-card-badges">
                        <span className={`bur-badge ${tm.cls}`}><TI size={11} />{tm.label}</span>
                        <span className={`bur-badge ${sm.cls}`}><SI size={11} />{sm.label}</span>
                      </div>
                    </div>

                    <div className="bur-card-body">
                      <div className="bur-schedule">
                        <span><Calendar size={12} />{fmtDate(d.dateProposee)}</span>
                        <span><Clock size={12} />{d.heureProposee}</span>
                        <span className="bur-muted"><Calendar size={12} />Créé le {fmtDate(d.dateCreation)}</span>
                      </div>
                      <div className="bur-motif">
                        <AlignLeft size={13} />
                        <p>{d.motif}</p>
                      </div>
                    </div>

                    <div className="bur-card-actions">
                      <button className="bur-btn-ghost" onClick={() => openModal('detail', d)}>
                        <Eye size={13} /> Détails
                      </button>
                      {d.statut === 'en_attente' && <>
                        <button className="bur-btn-green" onClick={() => handleStatusChange(d.id, 'confirme')}>
                          <Check size={13} /> Confirmer
                        </button>
                        <button className="bur-btn-red" onClick={() => handleStatusChange(d.id, 'rejete')}>
                          <XCircle size={13} /> Rejeter
                        </button>
                      </>}
                      {d.statut === 'confirme' && (
                        <button className="bur-btn-slate" onClick={() => handleStatusChange(d.id, 'en_attente')}>
                          <Undo2 size={13} /> Annuler
                        </button>
                      )}
                      {(d.statut === 'rejete' || d.statut === 'waitlist') && (
                        <button className="bur-btn-slate" onClick={() => handleStatusChange(d.id, 'en_attente')}>
                          <ArrowUp size={13} /> Remettre en attente
                        </button>
                      )}
                      <button className="bur-btn-icon bur-btn-danger" onClick={() => { if(window.confirm('Supprimer cette demande ?')) setDemandes(demandes.filter(x => x.id !== d.id)); }}>
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════
          TAB — JOURNAL D'APPELS
      ══════════════════════════════════════ */}
      {activeTab === 'appels' && (
        <div className="bur-section">
          <div className="bur-section-head">
            <div className="bur-section-info">
              <span className="bur-info-chip"><PhoneCall size={12} /> {appels.length} appels</span>
              {stats.nonTraites > 0 && <span className="bur-info-chip warn"><AlertTriangle size={12} /> {stats.nonTraites} non traités</span>}
            </div>
            <button className="bur-btn-primary" onClick={() => openModal('appel')}>
              <Plus size={13} /> Enregistrer un appel
            </button>
          </div>

          <div className="bur-list">
            {appels.map(a => (
              <div key={a.id} className={`bur-journal-card${a.traite ? '' : ' untreated'}`}>
                <div className={`bur-dir-icon ${a.direction}`}>
                  {a.direction === 'entrant' ? <ArrowDownLeft size={16} /> : <ArrowUpRight size={16} />}
                </div>
                <div className="bur-journal-info">
                  <p className="bur-journal-name">{a.nom}</p>
                  <span className="bur-journal-phone"><Phone size={11} />{a.telephone}</span>
                  <p className="bur-journal-motif">{a.motif}</p>
                  {a.notes && <p className="bur-journal-notes"><StickyNote size={11} />{a.notes}</p>}
                </div>
                <div className="bur-journal-right">
                  <span className="bur-journal-dt"><Clock size={11} />{fmtDT(a.dateHeure)}</span>
                  <div className="bur-journal-badges">
                    <span className={`bur-badge ${a.direction === 'entrant' ? 'bur-b-blue' : 'bur-b-violet'}`}>
                      {a.direction === 'entrant' ? <ArrowDownLeft size={10} /> : <ArrowUpRight size={10} />}
                      {a.direction === 'entrant' ? 'Entrant' : 'Sortant'}
                    </span>
                    {a.clientExistant && <span className="bur-badge bur-b-green"><UserCheck size={10} /> Client</span>}
                  </div>
                  <div className="bur-journal-actions">
                    <button
                      className={`bur-btn-toggle${a.traite ? ' done' : ''}`}
                      onClick={() => setAppels(appels.map(x => x.id === a.id ? { ...x, traite: !x.traite } : x))}
                    >
                      <CheckCircle2 size={13} /> {a.traite ? 'Traité' : 'Non traité'}
                    </button>
                    <button className="bur-btn-icon bur-btn-danger" onClick={() => { if(window.confirm('Supprimer cet appel ?')) setAppels(appels.filter(x => x.id !== a.id)); }}>
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════
          TAB — JOURNAL DE PRÉSENCE
      ══════════════════════════════════════ */}
      {activeTab === 'presence' && (
        <div className="bur-section">
          <div className="bur-section-head">
            <div className="bur-section-info">
              <span className="bur-info-chip"><DoorOpen size={12} /> {presences.length} visites enregistrées</span>
            </div>
            <button className="bur-btn-primary" onClick={() => openModal('presence')}>
              <Plus size={13} /> Enregistrer une visite
            </button>
          </div>

          <div className="bur-list">
            {presences.map(p => (
              <div key={p.id} className="bur-journal-card">
                <div className="bur-dir-icon presence">
                  <User size={16} />
                </div>
                <div className="bur-journal-info">
                  <p className="bur-journal-name">{p.nom}</p>
                  <p className="bur-journal-motif">{p.motif}</p>
                  <div className="bur-presence-demande">
                    <span className="bur-muted">Demande :</span> {p.demande}
                  </div>
                  {p.notes && <p className="bur-journal-notes"><StickyNote size={11} />{p.notes}</p>}
                </div>
                <div className="bur-journal-right">
                  <span className="bur-journal-dt"><Clock size={11} />{fmtDT(p.dateHeure)}</span>
                  <span className="bur-badge bur-b-slate"><Settings size={10} />{p.traitePar}</span>
                  <div className="bur-journal-actions">
                    <button className="bur-btn-icon bur-btn-danger" onClick={() => { if(window.confirm('Supprimer cette visite ?')) setPresences(presences.filter(x => x.id !== p.id)); }}>
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════
          MODALS
      ══════════════════════════════════════ */}
      {showModal && (
        <>
          <div className="bur-scrim" onClick={() => setShowModal(false)} />
          <div className="bur-modal">

            {/* ── Détail demande ── */}
            {modalType === 'detail' && selectedDemande && (() => {
              const sm = STATUT_META[selectedDemande.statut] || STATUT_META.en_attente;
              const tm = TYPE_META[selectedDemande.type]     || TYPE_META.consultation;
              const { Icon: SI } = sm; const { Icon: TI } = tm;
              return (
                <>
                  <div className="bur-modal-head">
                    <div className="bur-modal-avatar">{initials(`${selectedDemande.prenom} ${selectedDemande.nom}`)}</div>
                    <div className="bur-modal-id">
                      <h2 className="bur-modal-name">{selectedDemande.prenom} {selectedDemande.nom}</h2>
                      <p className="bur-modal-sub">Demande de rendez-vous</p>
                    </div>
                    <button className="bur-modal-close" onClick={() => setShowModal(false)}><X size={16} /></button>
                  </div>
                  <div className="bur-modal-body">
                    <div className="bur-modal-grid">
                      {[
                        { Icon: Phone,    label: 'Téléphone', value: selectedDemande.telephone },
                        { Icon: Mail,     label: 'Email',     value: selectedDemande.email     },
                        { Icon: Calendar, label: 'Date',      value: fmtDate(selectedDemande.dateProposee) },
                        { Icon: Clock,    label: 'Heure',     value: selectedDemande.heureProposee },
                      ].map(({ Icon: Ic, label, value }) => (
                        <div key={label} className="bur-minfo">
                          <div className="bur-minfo-ic"><Ic size={14} /></div>
                          <div><label>{label}</label><p>{value}</p></div>
                        </div>
                      ))}
                      <div className="bur-minfo">
                        <div className="bur-minfo-ic"><TI size={14} /></div>
                        <div><label>Type</label><p><span className={`bur-badge ${tm.cls}`}><TI size={10} />{tm.label}</span></p></div>
                      </div>
                      <div className="bur-minfo">
                        <div className="bur-minfo-ic"><SI size={14} /></div>
                        <div><label>Statut</label><p><span className={`bur-badge ${sm.cls}`}><SI size={10} />{sm.label}</span></p></div>
                      </div>
                      <div className="bur-minfo bur-minfo-full">
                        <div className="bur-minfo-ic"><AlignLeft size={14} /></div>
                        <div><label>Motif</label><p>{selectedDemande.motif}</p></div>
                      </div>
                    </div>
                  </div>
                  <div className="bur-modal-ft">
                    {selectedDemande.statut === 'en_attente' && <>
                      <button className="bur-btn-green" onClick={() => { handleStatusChange(selectedDemande.id, 'confirme'); setShowModal(false); }}>
                        <Check size={13} /> Confirmer
                      </button>
                      <button className="bur-btn-red" onClick={() => { handleStatusChange(selectedDemande.id, 'rejete'); setShowModal(false); }}>
                        <XCircle size={13} /> Rejeter
                      </button>
                    </>}
                    <button className="bur-btn-cancel" onClick={() => setShowModal(false)}>Fermer</button>
                  </div>
                </>
              );
            })()}

            {/* ── Nouvel appel ── */}
            {modalType === 'appel' && (
              <>
                <div className="bur-modal-head">
                  <div className="bur-modal-avatar" style={{ background: 'linear-gradient(135deg,#2563eb,#7c3aed)' }}><PhoneCall size={22} /></div>
                  <div className="bur-modal-id">
                    <h2 className="bur-modal-name">Enregistrer un appel</h2>
                    <p className="bur-modal-sub">Journal des appels du cabinet</p>
                  </div>
                  <button className="bur-modal-close" onClick={() => setShowModal(false)}><X size={16} /></button>
                </div>
                <form onSubmit={handleAddAppel}>
                  <div className="bur-modal-body">
                    <div className="bur-form-row">
                      <div className="bur-form-group">
                        <label>Nom complet *</label>
                        <input type="text" required value={newAppel.nom} onChange={e => setNewAppel({...newAppel, nom: e.target.value})} placeholder="Nom du correspondant" />
                      </div>
                      <div className="bur-form-group">
                        <label>Téléphone</label>
                        <input type="text" value={newAppel.telephone} onChange={e => setNewAppel({...newAppel, telephone: e.target.value})} placeholder="+216 xx xxx xxx" />
                      </div>
                    </div>
                    <div className="bur-form-row">
                      <div className="bur-form-group">
                        <label>Date et heure *</label>
                        <input type="datetime-local" required value={newAppel.dateHeure} onChange={e => setNewAppel({...newAppel, dateHeure: e.target.value})} />
                      </div>
                      <div className="bur-form-group">
                        <label>Direction *</label>
                        <select value={newAppel.direction} onChange={e => setNewAppel({...newAppel, direction: e.target.value})}>
                          <option value="entrant">Entrant</option>
                          <option value="sortant">Sortant</option>
                        </select>
                      </div>
                    </div>
                    <div className="bur-form-group">
                      <label>Motif *</label>
                      <textarea required rows={2} value={newAppel.motif} onChange={e => setNewAppel({...newAppel, motif: e.target.value})} placeholder="Objet de l'appel…" />
                    </div>
                    <div className="bur-form-group">
                      <label>Notes</label>
                      <textarea rows={2} value={newAppel.notes} onChange={e => setNewAppel({...newAppel, notes: e.target.value})} placeholder="Remarques éventuelles…" />
                    </div>
                    <label className="bur-checkbox">
                      <input type="checkbox" checked={newAppel.clientExistant} onChange={e => setNewAppel({...newAppel, clientExistant: e.target.checked})} />
                      <span>Client existant</span>
                    </label>
                  </div>
                  <div className="bur-modal-ft">
                    <button type="button" className="bur-btn-cancel" onClick={() => setShowModal(false)}>Annuler</button>
                    <button type="submit" className="bur-btn-primary"><Check size={13} /> Enregistrer</button>
                  </div>
                </form>
              </>
            )}

            {/* ── Nouvelle présence ── */}
            {modalType === 'presence' && (
              <>
                <div className="bur-modal-head">
                  <div className="bur-modal-avatar" style={{ background: 'linear-gradient(135deg,#0891b2,#06b6d4)' }}><DoorOpen size={22} /></div>
                  <div className="bur-modal-id">
                    <h2 className="bur-modal-name">Enregistrer une visite</h2>
                    <p className="bur-modal-sub">Journal de présence du cabinet</p>
                  </div>
                  <button className="bur-modal-close" onClick={() => setShowModal(false)}><X size={16} /></button>
                </div>
                <form onSubmit={handleAddPresence}>
                  <div className="bur-modal-body">
                    <div className="bur-form-row">
                      <div className="bur-form-group">
                        <label>Nom du visiteur *</label>
                        <input type="text" required value={newPresence.nom} onChange={e => setNewPresence({...newPresence, nom: e.target.value})} placeholder="Prénom Nom" />
                      </div>
                      <div className="bur-form-group">
                        <label>Date et heure *</label>
                        <input type="datetime-local" required value={newPresence.dateHeure} onChange={e => setNewPresence({...newPresence, dateHeure: e.target.value})} />
                      </div>
                    </div>
                    <div className="bur-form-group">
                      <label>Motif de la visite *</label>
                      <textarea required rows={2} value={newPresence.motif} onChange={e => setNewPresence({...newPresence, motif: e.target.value})} placeholder="Raison de la visite…" />
                    </div>
                    <div className="bur-form-group">
                      <label>Demande spécifique *</label>
                      <textarea required rows={2} value={newPresence.demande} onChange={e => setNewPresence({...newPresence, demande: e.target.value})} placeholder="Ce que le visiteur souhaite obtenir…" />
                    </div>
                    <div className="bur-form-group">
                      <label>Traité par</label>
                      <input type="text" value={newPresence.traitePar} onChange={e => setNewPresence({...newPresence, traitePar: e.target.value})} />
                    </div>
                    <div className="bur-form-group">
                      <label>Notes</label>
                      <textarea rows={2} value={newPresence.notes} onChange={e => setNewPresence({...newPresence, notes: e.target.value})} placeholder="Remarques…" />
                    </div>
                  </div>
                  <div className="bur-modal-ft">
                    <button type="button" className="bur-btn-cancel" onClick={() => setShowModal(false)}>Annuler</button>
                    <button type="submit" className="bur-btn-primary"><Check size={13} /> Enregistrer</button>
                  </div>
                </form>
              </>
            )}

          </div>
        </>
      )}
    </div>
  );
}
