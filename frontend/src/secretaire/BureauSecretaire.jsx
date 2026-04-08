import React, { useState, useMemo } from 'react';
import './BureauSecretaire.css';

const BureauSecretaire = () => {
  const [activeTab, setActiveTab] = useState('demandes');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  // Demandes de rendez-vous
  const [demandes, setDemandes] = useState([
    {
      id: 1,
      nom: 'Dubois',
      prenom: 'Jean',
      email: 'jean.dubois@email.com',
      telephone: '+216 20 123 456',
      dateProposee: '2026-02-24',
      heureProposee: '10:00',
      motif: 'Consultation en droit civil - Litige avec un voisin',
      type: 'consultation',
      urgent: true,
      statut: 'en_attente',
      dateCreation: '2026-02-18'
    },
    {
      id: 2,
      nom: 'Martin',
      prenom: 'Sophie',
      email: 'sophie.martin@email.com',
      telephone: '+216 22 345 678',
      dateProposee: '2026-02-24',
      heureProposee: '10:00',
      motif: 'Signature de contrat de vente immobilière',
      type: 'signature',
      urgent: false,
      statut: 'en_attente',
      dateCreation: '2026-02-17'
    },
    {
      id: 3,
      nom: 'Bernard',
      prenom: 'Pierre',
      email: 'pierre.bernard@email.com',
      telephone: '+216 25 456 789',
      dateProposee: '2026-02-25',
      heureProposee: '14:00',
      motif: 'Demande de conseil juridique - Droit du travail',
      type: 'consultation',
      urgent: false,
      statut: 'confirme',
      dateCreation: '2026-02-15'
    },
    {
      id: 4,
      nom: 'Lefebvre',
      prenom: 'Marie',
      email: 'marie.lefebvre@email.com',
      telephone: '+216 28 567 890',
      dateProposee: '2026-02-26',
      heureProposee: '09:00',
      motif: 'Suivi dossier divorce - Audiences prochaines',
      type: 'suivi',
      urgent: true,
      statut: 'en_attente',
      dateCreation: '2026-02-19'
    },
    {
      id: 5,
      nom: 'Rousseau',
      prenom: 'Claire',
      email: 'claire.rousseau@email.com',
      telephone: '+216 30 678 901',
      dateProposee: '2026-02-27',
      heureProposee: '11:00',
      motif: 'Première consultation - Succession',
      type: 'consultation',
      urgent: false,
      statut: 'waitlist',
      dateCreation: '2026-02-16'
    },
    {
      id: 6,
      nom: 'Moreau',
      prenom: 'Luc',
      email: 'luc.moreau@email.com',
      telephone: '+216 32 789 012',
      dateProposee: '2026-02-28',
      heureProposee: '14:30',
      motif: 'Révision contrat de travail',
      type: 'consultation',
      urgent: false,
      statut: 'rejete',
      dateCreation: '2026-02-14'
    }
  ]);

  // Journal d'appels
  const [appels, setAppels] = useState([
    {
      id: 1,
      nom: 'Pierre Bernard',
      telephone: '+216 25 456 789',
      dateHeure: '2026-02-20T09:30',
      motif: "Demande d'information sur une procédure de divorce",
      direction: 'entrant',
      clientExistant: false,
      notes: "À rappeler demain après consultation de l'agenda",
      traite: false
    },
    {
      id: 2,
      nom: 'Claire Rousseau',
      telephone: '+216 30 678 901',
      dateHeure: '2026-02-20T11:15',
      motif: 'Suivi dossier succession - Demande de nouvelles',
      direction: 'entrant',
      clientExistant: true,
      notes: 'Client existant - Dossier 2026-045',
      traite: true
    },
    {
      id: 3,
      nom: 'Jean Dubois',
      telephone: '+216 20 123 456',
      dateHeure: '2026-02-19T15:00',
      motif: 'Confirmation de rendez-vous du 24/02',
      direction: 'sortant',
      clientExistant: true,
      notes: 'Confirmé pour 10h00',
      traite: true
    },
    {
      id: 4,
      nom: 'Thomas Petit',
      telephone: '+216 34 890 123',
      dateHeure: '2026-02-19T10:20',
      motif: 'Demande de report de rendez-vous',
      direction: 'entrant',
      clientExistant: true,
      notes: 'Reporter au 03/03 - Attente confirmation avocate',
      traite: false
    }
  ]);

  // Journal de présence (visiteurs)
  const [presences, setPresences] = useState([
    {
      id: 1,
      nom: 'Isabelle Durand',
      dateHeure: '2026-02-20T10:00',
      motif: "Récupération d'un document administratif",
      demande: 'Copie du jugement de divorce',
      traitePar: 'En attente validation avocate',
      notes: 'Document à récupérer avant 17h'
    },
    {
      id: 2,
      nom: 'Marc Leroy',
      dateHeure: '2026-02-19T15:30',
      motif: 'Signature de documents',
      demande: 'Signature convention amiable',
      traitePar: 'Signé et remis',
      notes: ''
    },
    {
      id: 3,
      nom: 'Fatima Benali',
      dateHeure: '2026-02-19T09:15',
      motif: 'Dépôt de pièces justificatives',
      demande: 'Pièces pour dossier accident de travail',
      traitePar: 'Reçu - Transmis à avocate',
      notes: 'Dossier complet'
    }
  ]);

  // Modals state
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('');
  const [selectedDemande, setSelectedDemande] = useState(null);

  const [newAppel, setNewAppel] = useState({
    nom: '', telephone: '', dateHeure: '', motif: '',
    direction: 'entrant', clientExistant: false, notes: '', traite: false
  });

  const [newPresence, setNewPresence] = useState({
    nom: '', dateHeure: '', motif: '', demande: '',
    traitePar: 'En attente', notes: ''
  });

  // Helpers
  const formatDateTime = (dateTimeString) => {
    return new Date(dateTimeString).toLocaleString('fr-FR', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      weekday: 'short', day: '2-digit', month: 'long', year: 'numeric'
    });
  };

  const getStatutInfo = (statut) => {
    const map = {
      en_attente: { class: 'st-pending', label: 'En attente', icon: 'fas fa-clock' },
      confirme: { class: 'st-confirmed', label: 'Confirmé', icon: 'fas fa-check-circle' },
      rejete: { class: 'st-rejected', label: 'Rejeté', icon: 'fas fa-times-circle' },
      waitlist: { class: 'st-waitlist', label: "Liste d'attente", icon: 'fas fa-hourglass-half' }
    };
    return map[statut] || map.en_attente;
  };

  const getTypeInfo = (type) => {
    const map = {
      consultation: { class: 'tp-consultation', label: 'Consultation', icon: 'fas fa-comments' },
      signature: { class: 'tp-signature', label: 'Signature', icon: 'fas fa-file-signature' },
      suivi: { class: 'tp-suivi', label: 'Suivi', icon: 'fas fa-history' }
    };
    return map[type] || map.consultation;
  };

  // Demandes filtrées et triées
  const demandesFiltrees = useMemo(() => {
    return [...demandes]
      .filter(d => {
        const fullName = `${d.prenom} ${d.nom}`.toLowerCase();
        const matchSearch = !searchTerm ||
          fullName.includes(searchTerm.toLowerCase()) ||
          d.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          d.motif.toLowerCase().includes(searchTerm.toLowerCase());
        const matchStatus = !filterStatus || d.statut === filterStatus;
        return matchSearch && matchStatus;
      })
      .sort((a, b) => {
        if (a.urgent && !b.urgent) return -1;
        if (!a.urgent && b.urgent) return 1;
        return new Date(a.dateProposee) - new Date(b.dateProposee);
      });
  }, [demandes, searchTerm, filterStatus]);

  // Stats
  const demandesStats = {
    total: demandes.length,
    enAttente: demandes.filter(d => d.statut === 'en_attente').length,
    confirme: demandes.filter(d => d.statut === 'confirme').length,
    rejete: demandes.filter(d => d.statut === 'rejete').length,
    waitlist: demandes.filter(d => d.statut === 'waitlist').length
  };

  const appelsStats = {
    total: appels.length,
    nonTraites: appels.filter(a => !a.traite).length
  };

  // Handlers - Demandes
  const handleStatusChange = (id, newStatus) => {
    if (newStatus === 'confirme') {
      const demande = demandes.find(d => d.id === id);
      if (demande) {
        setDemandes(demandes.map(d => {
          if (d.id === id) return { ...d, statut: 'confirme' };
          if (d.id !== id &&
            d.dateProposee === demande.dateProposee &&
            d.heureProposee === demande.heureProposee &&
            d.statut === 'en_attente') {
            return { ...d, statut: 'waitlist' };
          }
          return d;
        }));
      }
    } else {
      setDemandes(demandes.map(d =>
        d.id === id ? { ...d, statut: newStatus } : d
      ));
    }
  };

  const handleDeleteDemande = (id) => {
    if (window.confirm('Supprimer cette demande de rendez-vous ?')) {
      setDemandes(demandes.filter(d => d.id !== id));
    }
  };

  const handleViewDemande = (demande) => {
    setSelectedDemande(demande);
    setModalType('detail');
    setShowModal(true);
  };

  // Handlers - Appels
  const handleAddAppel = (e) => {
    e.preventDefault();
    setAppels([{ id: Date.now(), ...newAppel }, ...appels]);
    setNewAppel({ nom: '', telephone: '', dateHeure: '', motif: '', direction: 'entrant', clientExistant: false, notes: '', traite: false });
    setShowModal(false);
  };

  const handleToggleAppelTraite = (id) => {
    setAppels(appels.map(a => a.id === id ? { ...a, traite: !a.traite } : a));
  };

  const handleDeleteAppel = (id) => {
    if (window.confirm('Supprimer cet appel du journal ?')) {
      setAppels(appels.filter(a => a.id !== id));
    }
  };

  // Handlers - Présences
  const handleAddPresence = (e) => {
    e.preventDefault();
    setPresences([{ id: Date.now(), ...newPresence }, ...presences]);
    setNewPresence({ nom: '', dateHeure: '', motif: '', demande: '', traitePar: 'En attente', notes: '' });
    setShowModal(false);
  };

  const handleDeletePresence = (id) => {
    if (window.confirm('Supprimer cette entrée du journal ?')) {
      setPresences(presences.filter(p => p.id !== id));
    }
  };

  const openModal = (type) => {
    setModalType(type);
    setShowModal(true);
  };

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <i className="fas fa-building"></i> Gestion du Bureau
          </h1>
          <p className="page-description">
            Gérez les rendez-vous, appels et visites du cabinet
          </p>
        </div>
      </div>

      {/* Onglets */}
      <div className="bureau-tabs">
        <button
          className={`bureau-tab ${activeTab === 'demandes' ? 'active' : ''}`}
          onClick={() => setActiveTab('demandes')}
        >
          <i className="fas fa-calendar-check"></i>
          <span>Demandes de RDV</span>
          {demandesStats.enAttente > 0 && (
            <span className="tab-count">{demandesStats.enAttente}</span>
          )}
        </button>
        <button
          className={`bureau-tab ${activeTab === 'appels' ? 'active' : ''}`}
          onClick={() => setActiveTab('appels')}
        >
          <i className="fas fa-phone-alt"></i>
          <span>Journal d'Appels</span>
          {appelsStats.nonTraites > 0 && (
            <span className="tab-count warning">{appelsStats.nonTraites}</span>
          )}
        </button>
        <button
          className={`bureau-tab ${activeTab === 'presence' ? 'active' : ''}`}
          onClick={() => setActiveTab('presence')}
        >
          <i className="fas fa-door-open"></i>
          <span>Journal de Présence</span>
          <span className="tab-count neutral">{presences.length}</span>
        </button>
      </div>

      {/* ═══════════════════════════════════════════
          TAB: DEMANDES DE RENDEZ-VOUS
          ═══════════════════════════════════════════ */}
      {activeTab === 'demandes' && (
        <div className="tab-content">
          {/* Stats */}
          <div className="bureau-stats">
            <div className="bstat-card">
              <div className="bstat-icon total"><i className="fas fa-inbox"></i></div>
              <div className="bstat-info">
                <h3>{demandesStats.total}</h3>
                <p>Total</p>
              </div>
            </div>
            <div className="bstat-card">
              <div className="bstat-icon pending"><i className="fas fa-clock"></i></div>
              <div className="bstat-info">
                <h3>{demandesStats.enAttente}</h3>
                <p>En attente</p>
              </div>
            </div>
            <div className="bstat-card">
              <div className="bstat-icon confirmed"><i className="fas fa-check-circle"></i></div>
              <div className="bstat-info">
                <h3>{demandesStats.confirme}</h3>
                <p>Confirmées</p>
              </div>
            </div>
            <div className="bstat-card">
              <div className="bstat-icon waitlist"><i className="fas fa-hourglass-half"></i></div>
              <div className="bstat-info">
                <h3>{demandesStats.waitlist}</h3>
                <p>Liste d'attente</p>
              </div>
            </div>
          </div>

          {/* Barre de recherche et filtres */}
          <div className="bureau-toolbar">
            <div className="bureau-search">
              <i className="fas fa-search"></i>
              <input
                type="text"
                placeholder="Rechercher par nom, email ou motif..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <button className="search-clear" onClick={() => setSearchTerm('')}>
                  <i className="fas fa-times"></i>
                </button>
              )}
            </div>
            <div className="bureau-filters">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="filter-select"
              >
                <option value="">Tous les statuts</option>
                <option value="en_attente">En attente</option>
                <option value="confirme">Confirmé</option>
                <option value="waitlist">Liste d'attente</option>
                <option value="rejete">Rejeté</option>
              </select>
            </div>
          </div>

          {/* Liste des demandes */}
          <div className="demandes-list">
            {demandesFiltrees.length === 0 ? (
              <div className="empty-state">
                <i className="fas fa-calendar-times"></i>
                <h3>Aucune demande trouvée</h3>
                <p>Aucune demande ne correspond à vos critères de recherche.</p>
              </div>
            ) : (
              demandesFiltrees.map(demande => {
                const statutInfo = getStatutInfo(demande.statut);
                const typeInfo = getTypeInfo(demande.type);
                return (
                  <div
                    key={demande.id}
                    className={`demande-card ${demande.statut} ${demande.urgent ? 'urgent' : ''}`}
                  >
                    {demande.urgent && (
                      <div className="urgent-ribbon">
                        <i className="fas fa-exclamation-triangle"></i> URGENT
                      </div>
                    )}

                    <div className="demande-top">
                      <div className="demande-client">
                        <div className="client-avatar">
                          {demande.prenom.charAt(0)}{demande.nom.charAt(0)}
                        </div>
                        <div className="client-details">
                          <h4>{demande.prenom} {demande.nom}</h4>
                          <div className="client-contacts">
                            <span><i className="fas fa-phone"></i> {demande.telephone}</span>
                            <span><i className="fas fa-envelope"></i> {demande.email}</span>
                          </div>
                        </div>
                      </div>
                      <div className="demande-meta">
                        <span className={`type-badge ${typeInfo.class}`}>
                          <i className={typeInfo.icon}></i> {typeInfo.label}
                        </span>
                        <span className={`statut-badge ${statutInfo.class}`}>
                          <i className={statutInfo.icon}></i> {statutInfo.label}
                        </span>
                      </div>
                    </div>

                    <div className="demande-body">
                      <div className="demande-schedule">
                        <div className="schedule-item">
                          <i className="fas fa-calendar-alt"></i>
                          <span>{formatDate(demande.dateProposee)}</span>
                        </div>
                        <div className="schedule-item">
                          <i className="fas fa-clock"></i>
                          <span>{demande.heureProposee}</span>
                        </div>
                        <div className="schedule-item light">
                          <i className="fas fa-calendar-plus"></i>
                          <span>Créé le {formatDate(demande.dateCreation)}</span>
                        </div>
                      </div>
                      <div className="demande-motif">
                        <i className="fas fa-align-left"></i>
                        <p>{demande.motif}</p>
                      </div>
                    </div>

                    <div className="demande-actions">
                      <button
                        className="btn-action btn-detail"
                        onClick={() => handleViewDemande(demande)}
                        title="Voir les détails"
                      >
                        <i className="fas fa-eye"></i> Détails
                      </button>

                      {demande.statut === 'en_attente' && (
                        <>
                          <button
                            className="btn-action btn-confirm"
                            onClick={() => handleStatusChange(demande.id, 'confirme')}
                          >
                            <i className="fas fa-check"></i> Confirmer
                          </button>
                          <button
                            className="btn-action btn-reject"
                            onClick={() => handleStatusChange(demande.id, 'rejete')}
                          >
                            <i className="fas fa-times"></i> Rejeter
                          </button>
                        </>
                      )}

                      {demande.statut === 'confirme' && (
                        <button
                          className="btn-action btn-cancel"
                          onClick={() => handleStatusChange(demande.id, 'en_attente')}
                        >
                          <i className="fas fa-undo"></i> Annuler confirmation
                        </button>
                      )}

                      {demande.statut === 'rejete' && (
                        <button
                          className="btn-action btn-restore"
                          onClick={() => handleStatusChange(demande.id, 'en_attente')}
                        >
                          <i className="fas fa-redo"></i> Remettre en attente
                        </button>
                      )}

                      {demande.statut === 'waitlist' && (
                        <button
                          className="btn-action btn-restore"
                          onClick={() => handleStatusChange(demande.id, 'en_attente')}
                        >
                          <i className="fas fa-arrow-up"></i> Passer en attente
                        </button>
                      )}

                      <button
                        className="btn-action btn-delete"
                        onClick={() => handleDeleteDemande(demande.id)}
                        title="Supprimer"
                      >
                        <i className="fas fa-trash-alt"></i>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════
          TAB: JOURNAL D'APPELS
          ═══════════════════════════════════════════ */}
      {activeTab === 'appels' && (
        <div className="tab-content">
          <div className="section-toolbar">
            <div className="toolbar-info">
              <span className="info-badge">
                <i className="fas fa-phone-alt"></i> {appels.length} appels enregistrés
              </span>
              <span className="info-badge warning">
                <i className="fas fa-exclamation-circle"></i> {appelsStats.nonTraites} non traités
              </span>
            </div>
            <button className="btn-add" onClick={() => openModal('appel')}>
              <i className="fas fa-plus"></i> Enregistrer un appel
            </button>
          </div>

          <div className="journal-list">
            {appels.map(appel => (
              <div key={appel.id} className={`journal-card ${appel.traite ? 'treated' : 'untreated'}`}>
                <div className="journal-left">
                  <div className={`journal-icon ${appel.direction}`}>
                    <i className={`fas fa-phone-alt ${appel.direction === 'sortant' ? 'fa-rotate-90' : ''}`}></i>
                  </div>
                  <div className="journal-info">
                    <h4>{appel.nom}</h4>
                    <span className="journal-phone"><i className="fas fa-phone"></i> {appel.telephone}</span>
                    <p className="journal-motif">{appel.motif}</p>
                    {appel.notes && (
                      <p className="journal-notes"><i className="fas fa-sticky-note"></i> {appel.notes}</p>
                    )}
                  </div>
                </div>
                <div className="journal-right">
                  <span className="journal-datetime">
                    <i className="fas fa-clock"></i> {formatDateTime(appel.dateHeure)}
                  </span>
                  <div className="journal-badges">
                    <span className={`direction-badge ${appel.direction}`}>
                      <i className={`fas fa-arrow-${appel.direction === 'entrant' ? 'down' : 'up'}`}></i>
                      {appel.direction === 'entrant' ? 'Entrant' : 'Sortant'}
                    </span>
                    {appel.clientExistant && (
                      <span className="client-existing-badge">
                        <i className="fas fa-user-check"></i> Client existant
                      </span>
                    )}
                  </div>
                  <div className="journal-actions">
                    <button
                      className={`btn-action btn-toggle-treat ${appel.traite ? 'active' : ''}`}
                      onClick={() => handleToggleAppelTraite(appel.id)}
                      title={appel.traite ? 'Marquer non traité' : 'Marquer traité'}
                    >
                      <i className={`fas fa-${appel.traite ? 'check-circle' : 'circle'}`}></i>
                      {appel.traite ? 'Traité' : 'Non traité'}
                    </button>
                    <button
                      className="btn-action btn-delete"
                      onClick={() => handleDeleteAppel(appel.id)}
                      title="Supprimer"
                    >
                      <i className="fas fa-trash-alt"></i>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════
          TAB: JOURNAL DE PRÉSENCE
          ═══════════════════════════════════════════ */}
      {activeTab === 'presence' && (
        <div className="tab-content">
          <div className="section-toolbar">
            <div className="toolbar-info">
              <span className="info-badge">
                <i className="fas fa-door-open"></i> {presences.length} visites enregistrées
              </span>
            </div>
            <button className="btn-add" onClick={() => openModal('presence')}>
              <i className="fas fa-plus"></i> Enregistrer une visite
            </button>
          </div>

          <div className="journal-list">
            {presences.map(presence => (
              <div key={presence.id} className="journal-card presence-card">
                <div className="journal-left">
                  <div className="journal-icon presence">
                    <i className="fas fa-user"></i>
                  </div>
                  <div className="journal-info">
                    <h4>{presence.nom}</h4>
                    <p className="journal-motif">{presence.motif}</p>
                    <div className="presence-demande">
                      <span className="demande-label">Demande :</span>
                      <span>{presence.demande}</span>
                    </div>
                    {presence.notes && (
                      <p className="journal-notes"><i className="fas fa-sticky-note"></i> {presence.notes}</p>
                    )}
                  </div>
                </div>
                <div className="journal-right">
                  <span className="journal-datetime">
                    <i className="fas fa-clock"></i> {formatDateTime(presence.dateHeure)}
                  </span>
                  <span className="traitement-badge">
                    <i className="fas fa-user-cog"></i> {presence.traitePar}
                  </span>
                  <div className="journal-actions">
                    <button
                      className="btn-action btn-delete"
                      onClick={() => handleDeletePresence(presence.id)}
                      title="Supprimer"
                    >
                      <i className="fas fa-trash-alt"></i>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════
          MODALS
          ═══════════════════════════════════════════ */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>

            {/* Modal Détail Demande */}
            {modalType === 'detail' && selectedDemande && (() => {
              const si = getStatutInfo(selectedDemande.statut);
              const ti = getTypeInfo(selectedDemande.type);
              return (
                <>
                  <div className="modal-header">
                    <h2><i className="fas fa-calendar-check"></i> Détails de la demande</h2>
                    <button className="btn-close" onClick={() => setShowModal(false)}>
                      <i className="fas fa-times"></i>
                    </button>
                  </div>
                  <div className="modal-body">
                    <div className="detail-section">
                      <h3><i className="fas fa-user"></i> Client</h3>
                      <div className="detail-grid">
                        <div className="detail-item">
                          <label>Nom complet</label>
                          <p>{selectedDemande.prenom} {selectedDemande.nom}</p>
                        </div>
                        <div className="detail-item">
                          <label>Téléphone</label>
                          <p>{selectedDemande.telephone}</p>
                        </div>
                        <div className="detail-item">
                          <label>Email</label>
                          <p>{selectedDemande.email}</p>
                        </div>
                      </div>
                    </div>
                    <div className="detail-section">
                      <h3><i className="fas fa-calendar"></i> Rendez-vous</h3>
                      <div className="detail-grid">
                        <div className="detail-item">
                          <label>Date</label>
                          <p>{formatDate(selectedDemande.dateProposee)}</p>
                        </div>
                        <div className="detail-item">
                          <label>Heure</label>
                          <p>{selectedDemande.heureProposee}</p>
                        </div>
                        <div className="detail-item">
                          <label>Type</label>
                          <p><span className={`type-badge ${ti.class}`}><i className={ti.icon}></i> {ti.label}</span></p>
                        </div>
                        <div className="detail-item">
                          <label>Statut</label>
                          <p><span className={`statut-badge ${si.class}`}><i className={si.icon}></i> {si.label}</span></p>
                        </div>
                      </div>
                    </div>
                    <div className="detail-section">
                      <h3><i className="fas fa-align-left"></i> Motif</h3>
                      <p className="detail-motif">{selectedDemande.motif}</p>
                    </div>
                  </div>
                  <div className="modal-footer">
                    {selectedDemande.statut === 'en_attente' && (
                      <>
                        <button
                          className="btn btn-success"
                          onClick={() => { handleStatusChange(selectedDemande.id, 'confirme'); setShowModal(false); }}
                        >
                          <i className="fas fa-check"></i> Confirmer
                        </button>
                        <button
                          className="btn btn-danger"
                          onClick={() => { handleStatusChange(selectedDemande.id, 'rejete'); setShowModal(false); }}
                        >
                          <i className="fas fa-times"></i> Rejeter
                        </button>
                      </>
                    )}
                    <button className="btn btn-secondary" onClick={() => setShowModal(false)}>
                      Fermer
                    </button>
                  </div>
                </>
              );
            })()}

            {/* Modal Nouvel Appel */}
            {modalType === 'appel' && (
              <>
                <div className="modal-header">
                  <h2><i className="fas fa-phone-alt"></i> Enregistrer un appel</h2>
                  <button className="btn-close" onClick={() => setShowModal(false)}>
                    <i className="fas fa-times"></i>
                  </button>
                </div>
                <form onSubmit={handleAddAppel}>
                  <div className="modal-body">
                    <div className="form-row">
                      <div className="form-group">
                        <label><i className="fas fa-user"></i> Nom complet *</label>
                        <input type="text" required value={newAppel.nom}
                          onChange={(e) => setNewAppel({ ...newAppel, nom: e.target.value })} />
                      </div>
                      <div className="form-group">
                        <label><i className="fas fa-phone"></i> Téléphone</label>
                        <input type="text" value={newAppel.telephone}
                          onChange={(e) => setNewAppel({ ...newAppel, telephone: e.target.value })} />
                      </div>
                    </div>
                    <div className="form-row">
                      <div className="form-group">
                        <label><i className="fas fa-clock"></i> Date et heure *</label>
                        <input type="datetime-local" required value={newAppel.dateHeure}
                          onChange={(e) => setNewAppel({ ...newAppel, dateHeure: e.target.value })} />
                      </div>
                      <div className="form-group">
                        <label><i className="fas fa-exchange-alt"></i> Direction *</label>
                        <select value={newAppel.direction}
                          onChange={(e) => setNewAppel({ ...newAppel, direction: e.target.value })}>
                          <option value="entrant">Entrant</option>
                          <option value="sortant">Sortant</option>
                        </select>
                      </div>
                    </div>
                    <div className="form-group">
                      <label><i className="fas fa-comment"></i> Motif *</label>
                      <textarea required rows="2" value={newAppel.motif}
                        onChange={(e) => setNewAppel({ ...newAppel, motif: e.target.value })}></textarea>
                    </div>
                    <div className="form-group">
                      <label><i className="fas fa-sticky-note"></i> Notes</label>
                      <textarea rows="2" value={newAppel.notes}
                        onChange={(e) => setNewAppel({ ...newAppel, notes: e.target.value })}></textarea>
                    </div>
                    <div className="form-group checkbox-group">
                      <label className="checkbox-label">
                        <input type="checkbox" checked={newAppel.clientExistant}
                          onChange={(e) => setNewAppel({ ...newAppel, clientExistant: e.target.checked })} />
                        <span>Client existant</span>
                      </label>
                    </div>
                  </div>
                  <div className="modal-footer">
                    <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                      <i className="fas fa-times"></i> Annuler
                    </button>
                    <button type="submit" className="btn btn-primary">
                      <i className="fas fa-check"></i> Enregistrer
                    </button>
                  </div>
                </form>
              </>
            )}

            {/* Modal Nouvelle Présence */}
            {modalType === 'presence' && (
              <>
                <div className="modal-header">
                  <h2><i className="fas fa-door-open"></i> Enregistrer une visite</h2>
                  <button className="btn-close" onClick={() => setShowModal(false)}>
                    <i className="fas fa-times"></i>
                  </button>
                </div>
                <form onSubmit={handleAddPresence}>
                  <div className="modal-body">
                    <div className="form-row">
                      <div className="form-group">
                        <label><i className="fas fa-user"></i> Nom du visiteur *</label>
                        <input type="text" required value={newPresence.nom}
                          onChange={(e) => setNewPresence({ ...newPresence, nom: e.target.value })} />
                      </div>
                      <div className="form-group">
                        <label><i className="fas fa-clock"></i> Date et heure *</label>
                        <input type="datetime-local" required value={newPresence.dateHeure}
                          onChange={(e) => setNewPresence({ ...newPresence, dateHeure: e.target.value })} />
                      </div>
                    </div>
                    <div className="form-group">
                      <label><i className="fas fa-comment"></i> Motif de la visite *</label>
                      <textarea required rows="2" value={newPresence.motif}
                        onChange={(e) => setNewPresence({ ...newPresence, motif: e.target.value })}></textarea>
                    </div>
                    <div className="form-group">
                      <label><i className="fas fa-file-alt"></i> Demande spécifique *</label>
                      <textarea required rows="2" value={newPresence.demande}
                        onChange={(e) => setNewPresence({ ...newPresence, demande: e.target.value })}></textarea>
                    </div>
                    <div className="form-group">
                      <label><i className="fas fa-user-cog"></i> Traité par</label>
                      <input type="text" value={newPresence.traitePar}
                        onChange={(e) => setNewPresence({ ...newPresence, traitePar: e.target.value })} />
                    </div>
                    <div className="form-group">
                      <label><i className="fas fa-sticky-note"></i> Notes</label>
                      <textarea rows="2" value={newPresence.notes}
                        onChange={(e) => setNewPresence({ ...newPresence, notes: e.target.value })}></textarea>
                    </div>
                  </div>
                  <div className="modal-footer">
                    <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                      <i className="fas fa-times"></i> Annuler
                    </button>
                    <button type="submit" className="btn btn-primary">
                      <i className="fas fa-check"></i> Enregistrer
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default BureauSecretaire;
