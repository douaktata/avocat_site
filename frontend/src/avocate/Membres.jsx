import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUsersByRole, registerStaff, updateUser, deleteUser } from '../api';
import './Membres.css';

const Membres = () => {

  const navigate = useNavigate();

  const [membres, setMembres] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    Promise.all([getUsersByRole('SECRETAIRE'), getUsersByRole('STAGIAIRE')])
      .then(([secRes, stagRes]) => {
        const mapUser = (role) => (u) => ({
          id: u.idu,
          nom: u.nom || '',
          prenom: u.prenom || '',
          titre: `${u.prenom || ''} ${u.nom || ''}`.trim(),
          role,
          email: u.email || '',
          tel: u.tel || '-',
          adresse: u.adresse || '-',
          statut: u.statut || 'Actif',
          affairesEnCours: [],
          audiences: [],
          formations: [],
        });
        setMembres([
          ...secRes.data.map(mapUser('Secrétaire')),
          ...stagRes.data.map(mapUser('Stagiaire')),
        ]);
        setLoading(false);
      })
      .catch(() => {
        setError('Impossible de charger les membres');
        setLoading(false);
      });
  }, []);

  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [tempPassword, setTempPassword] = useState(null);
  const [newMembre, setNewMembre] = useState({ nom: '', prenom: '', email: '', tel: '', adresse: '', CIN: '', date_naissance: '', role: 'SECRETAIRE' });

  const generateTempPassword = (nom, prenom) => {
    const base = `${prenom.charAt(0).toUpperCase()}${nom.charAt(0).toUpperCase()}`;
    const rand = Math.random().toString(36).slice(2, 7).toUpperCase();
    return `${base}@${rand}2026`;
  };

  const handleAddMembre = (e) => {
    e.preventDefault();
    const password = generateTempPassword(newMembre.nom || 'X', newMembre.prenom || 'X');
    setSaving(true);
    registerStaff({ ...newMembre, password })
      .then(res => {
        const u = res.data;
        const roleLabel = newMembre.role === 'SECRETAIRE' ? 'Secrétaire' : 'Stagiaire';
        setMembres(prev => [...prev, {
          id: u.idu,
          nom: newMembre.nom,
          prenom: newMembre.prenom,
          titre: `${newMembre.prenom} ${newMembre.nom}`.trim(),
          role: roleLabel,
          email: newMembre.email,
          tel: newMembre.tel || '-',
          adresse: newMembre.adresse || '-',
          statut: u.statut || 'Actif',
          affairesEnCours: [], audiences: [], formations: [],
        }]);
        setTempPassword(password);
        setNewMembre({ nom: '', prenom: '', email: '', tel: '', adresse: '', CIN: '', date_naissance: '', role: 'SECRETAIRE' });
        setShowAddModal(false);
      })
      .catch(err => {
        const msg = err.response?.data?.message || err.response?.data?.error || `Erreur ${err.response?.status || ''}: ${err.message}`;
        alert(msg);
      })
      .finally(() => setSaving(false));
  };
  const [selectedMembre, setSelectedMembre] = useState(null);
  const [openSections, setOpenSections] = useState({});

  const filteredMembres = membres.filter(membre => {
    const fullName = `${membre.prenom} ${membre.nom}`.toLowerCase();
    const matchesSearch =
      fullName.includes(searchTerm.toLowerCase()) ||
      membre.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      membre.tel.includes(searchTerm);
    const matchesRole = roleFilter === '' || membre.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const handleOpenModal = (membre) => {
    setSelectedMembre(membre);
    setOpenSections({});
  };

  const handleCloseModal = () => {
    setSelectedMembre(null);
    setOpenSections({});
  };

  const handleViewDetail = (membreId) => {
    navigate(`/avocat/membre/${membreId}`);
  };

  const handleToggleStatut = (membre) => {
    const newStatut = membre.statut === 'Actif' ? 'Inactif' : 'Actif';
    updateUser(membre.id, { statut: newStatut })
      .then(() => setMembres(prev => prev.map(m => m.id === membre.id ? { ...m, statut: newStatut } : m)))
      .catch(() => alert('Erreur lors du changement de statut'));
  };

  const handleDelete = (membre) => {
    if (!window.confirm(`Supprimer ${membre.prenom} ${membre.nom} ? Cette action est irréversible.`)) return;
    deleteUser(membre.id)
      .then(() => setMembres(prev => prev.filter(m => m.id !== membre.id)))
      .catch(() => alert('Erreur lors de la suppression'));
  };

  const toggleSection = (section) => {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const getStatusClass = (status) => {
    const classes = { Actif: 'status-actif', Inactif: 'status-inactif' };
    return classes[status] || '';
  };

  const stats = {
    total: membres.length,
    secretaires: membres.filter(m => m.role === 'Secrétaire').length,
    stagiaires: membres.filter(m => m.role === 'Stagiaire').length,
    actifs: membres.filter(m => m.statut === 'Actif').length,
  };

  const lbl = { display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#374151', marginBottom: '0.3rem' };
  const inp = { width: '100%', padding: '0.6rem 0.8rem', border: '1.5px solid #e2e8f0', borderRadius: '8px', fontSize: '0.9rem', fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none' };

  if (loading) return <div className="barreau-page"><p style={{padding:'2rem'}}>Chargement...</p></div>;
  if (error) return <div className="barreau-page"><p style={{padding:'2rem',color:'red'}}>{error}</p></div>;

  return (
    <div className="barreau-page">

      {/* ── Header ── */}
      <div className="barreau-header">
        <div>
          <h1 className="page-title">Membres du Cabinet</h1>
          <p className="page-description">Secrétaires et stagiaires du cabinet</p>
        </div>
        <button className="btn-add-client" onClick={() => setShowAddModal(true)}>
          <i className="fas fa-user-plus"></i> Ajouter un membre
        </button>
      </div>

      {/* ── KPI Row ── */}
      <div className="barreau-kpi">
        <div className="kpi-item kpi-total">
          <i className="fas fa-users"></i>
          <div><span>{stats.total}</span><p>Total</p></div>
        </div>
        <div className="kpi-item kpi-actif">
          <i className="fas fa-user-tie"></i>
          <div><span>{stats.secretaires}</span><p>Secrétaires</p></div>
        </div>
        <div className="kpi-item kpi-affaires">
          <i className="fas fa-user-graduate"></i>
          <div><span>{stats.stagiaires}</span><p>Stagiaires</p></div>
        </div>
        <div className="kpi-item kpi-audiences">
          <i className="fas fa-user-check"></i>
          <div><span>{stats.actifs}</span><p>Actifs</p></div>
        </div>
      </div>

      {/* ── Search & Filter ── */}
      <div className="barreau-toolbar">
        <div className="search-wrap">
          <i className="fas fa-search"></i>
          <input
            type="text"
            placeholder="Rechercher par nom, spécialité..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button className="clear-btn" onClick={() => setSearchTerm('')}>
              <i className="fas fa-times"></i>
            </button>
          )}
        </div>
        <div className="filter-wrap">
          <i className="fas fa-filter"></i>
          <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
            <option value="">Tous les rôles</option>
            <option value="Secrétaire">Secrétaire</option>
            <option value="Stagiaire">Stagiaire</option>
          </select>
        </div>
        <span className="results-count">{filteredMembres.length} membre{filteredMembres.length !== 1 ? 's' : ''}</span>
      </div>

      {/* ── Membres Grid ── */}
      {filteredMembres.length > 0 ? (
        <div className="barreau-grid">
          {filteredMembres.map(membre => (
            <div key={membre.id} className="membre-card">
              {/* Card Top */}
              <div className="mcard-top">
                <div className="mcard-avatar">
                  {membre.prenom.charAt(0)}{membre.nom.charAt(0)}
                </div>
                <div className="mcard-identity">
                  <h3>{membre.titre}</h3>
                  <span className={`mcard-status ${getStatusClass(membre.statut)}`}>
                    {membre.statut}
                  </span>
                </div>
              </div>

              {/* Card Role */}
              <div className="minfo-row" style={{ padding: '0.75rem 1.5rem', borderBottom: '1px solid #f3f4f6' }}>
                <i className={`fas fa-${membre.role === 'Secrétaire' ? 'user-tie' : 'user-graduate'}`}></i>
                <span>{membre.role}</span>
              </div>

              {/* Card Info */}
              <div className="mcard-info">
                <div className="minfo-row">
                  <i className="fas fa-envelope"></i>
                  <span>{membre.email}</span>
                </div>
                <div className="minfo-row">
                  <i className="fas fa-phone"></i>
                  <span>{membre.tel}</span>
                </div>
                <div className="minfo-row">
                  <i className="fas fa-map-marker-alt"></i>
                  <span>{membre.adresse}</span>
                </div>
              </div>

              {/* Card Actions */}
              <div className="mcard-actions">
                <button className="mcard-btn mcard-btn-primary" onClick={() => handleViewDetail(membre.id)}>
                  <i className="fas fa-eye"></i> Détails
                </button>
                <button className="mcard-btn mcard-btn-secondary" onClick={() => handleOpenModal(membre)}>
                  <i className="fas fa-info-circle"></i> Aperçu
                </button>
              </div>
              <div className="mcard-actions" style={{ borderTop: '1px solid #f3f4f6', paddingTop: '0.5rem' }}>
                <button
                  className="mcard-btn"
                  style={{ background: membre.statut === 'Actif' ? '#fef3c7' : '#d1fae5', color: membre.statut === 'Actif' ? '#92400e' : '#065f46', border: 'none', cursor: 'pointer' }}
                  onClick={() => handleToggleStatut(membre)}
                >
                  <i className={`fas fa-${membre.statut === 'Actif' ? 'lock' : 'lock-open'}`}></i>
                  {membre.statut === 'Actif' ? ' Bloquer' : ' Débloquer'}
                </button>
                <button
                  className="mcard-btn"
                  style={{ background: '#fee2e2', color: '#991b1b', border: 'none', cursor: 'pointer' }}
                  onClick={() => handleDelete(membre)}
                >
                  <i className="fas fa-trash"></i> Supprimer
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="no-results">
          <i className="fas fa-search"></i>
          <p>Aucun membre trouvé</p>
          <small>Essayez de modifier vos filtres de recherche</small>
        </div>
      )}

      {/* ══ POPUP MOT DE PASSE TEMPORAIRE ══ */}
      {tempPassword && (
        <div className="modal-overlay" onClick={() => setTempPassword(null)}>
          <div className="modal-panel" style={{ maxWidth: '420px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-body-scroll" style={{ textAlign: 'center', padding: '2rem' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>✅</div>
              <h3 style={{ color: '#15803d', marginBottom: '0.5rem' }}>Membre créé avec succès</h3>
              <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                Communiquez ce mot de passe temporaire au membre. Il pourra le modifier après connexion.
              </p>
              <div style={{ background: '#f1f5f9', border: '1.5px dashed #94a3b8', borderRadius: '10px', padding: '1rem', fontSize: '1.3rem', fontWeight: 700, letterSpacing: '2px', color: '#1e3a8a', fontFamily: 'monospace' }}>
                {tempPassword}
              </div>
            </div>
            <div className="modal-footer">
              <button className="mfooter-btn mfooter-email" onClick={() => setTempPassword(null)}>
                <i className="fas fa-check"></i> Compris
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══ MODAL AJOUTER MEMBRE ══ */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-panel" onClick={e => e.stopPropagation()}>
            <div className="modal-hero">
              <div className="modal-avatar" style={{ background: '#1e3a8a' }}>
                <i className="fas fa-user-plus" style={{ fontSize: '1.2rem', color: '#fff' }}></i>
              </div>
              <div className="modal-identity">
                <h2>Nouveau membre</h2>
                <span style={{ fontSize: '0.85rem', color: '#64748b' }}>Secrétaire ou stagiaire du cabinet</span>
              </div>
              <button className="modal-close-btn" onClick={() => setShowAddModal(false)}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <form onSubmit={handleAddMembre}>
              <div className="modal-body-scroll" style={{ padding: '1.5rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={lbl}>Rôle *</label>
                    <select style={inp} required value={newMembre.role} onChange={e => setNewMembre({ ...newMembre, role: e.target.value })}>
                      <option value="SECRETAIRE">Secrétaire</option>
                      <option value="STAGIAIRE">Stagiaire</option>
                    </select>
                  </div>
                  <div>
                    <label style={lbl}>Prénom *</label>
                    <input style={inp} required placeholder="Prénom" value={newMembre.prenom} onChange={e => setNewMembre({ ...newMembre, prenom: e.target.value })} />
                  </div>
                  <div>
                    <label style={lbl}>Nom *</label>
                    <input style={inp} required placeholder="Nom" value={newMembre.nom} onChange={e => setNewMembre({ ...newMembre, nom: e.target.value })} />
                  </div>
                  <div>
                    <label style={lbl}>Email *</label>
                    <input style={inp} type="email" required placeholder="email@exemple.com" value={newMembre.email} onChange={e => setNewMembre({ ...newMembre, email: e.target.value })} />
                  </div>
                  <div>
                    <label style={lbl}>Téléphone</label>
                    <input style={inp} placeholder="25 356 180" value={newMembre.tel} onChange={e => setNewMembre({ ...newMembre, tel: e.target.value })} />
                  </div>
                  <div>
                    <label style={lbl}>CIN</label>
                    <input style={inp} placeholder="12345678" maxLength={8} pattern="\d{8}" title="CIN : 8 chiffres" value={newMembre.CIN} onChange={e => setNewMembre({ ...newMembre, CIN: e.target.value.replace(/\D/g, '').slice(0, 8) })} />
                  </div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={lbl}>Adresse</label>
                    <input style={inp} placeholder="Adresse" value={newMembre.adresse} onChange={e => setNewMembre({ ...newMembre, adresse: e.target.value })} />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="mfooter-btn mfooter-close" onClick={() => setShowAddModal(false)}>
                  <i className="fas fa-times"></i> Annuler
                </button>
                <button type="submit" className="mfooter-btn mfooter-email" disabled={saving}>
                  <i className="fas fa-user-plus"></i> {saving ? 'Création...' : 'Créer le membre'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══════════════════════════════
          MODAL DÉTAILS MEMBRE (aperçu rapide)
      ══════════════════════════════ */}
      {selectedMembre && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-panel" onClick={e => e.stopPropagation()}>

            {/* Modal Header */}
            <div className="modal-hero">
              <div className="modal-avatar">
                {selectedMembre.prenom.charAt(0)}{selectedMembre.nom.charAt(0)}
              </div>
              <div className="modal-identity">
                <h2>{selectedMembre.titre}</h2>
                <span className={`mcard-status ${getStatusClass(selectedMembre.statut)}`}>
                  {selectedMembre.statut}
                </span>
              </div>
              <button className="modal-close-btn" onClick={handleCloseModal}>
                <i className="fas fa-times"></i>
              </button>
            </div>

            <div className="modal-body-scroll">

              {/* ── Informations professionnelles ── */}
              <div className="modal-info-grid">
                <div className="minfo-item">
                  <i className="fas fa-user-tag"></i>
                  <div>
                    <label>Rôle</label>
                    <p>{selectedMembre.role}</p>
                  </div>
                </div>
                <div className="minfo-item">
                  <i className="fas fa-phone"></i>
                  <div>
                    <label>Téléphone</label>
                    <p>{selectedMembre.tel}</p>
                  </div>
                </div>
                <div className="minfo-item">
                  <i className="fas fa-envelope"></i>
                  <div>
                    <label>Email</label>
                    <p>{selectedMembre.email}</p>
                  </div>
                </div>
                <div className="minfo-item minfo-full">
                  <i className="fas fa-map-marker-alt"></i>
                  <div>
                    <label>Adresse</label>
                    <p>{selectedMembre.adresse}</p>
                  </div>
                </div>
              </div>

              {/* ── Affaires en cours ── */}
              <div className="history-section">
                <button
                  className={`history-header ${openSections.affaires ? 'is-open' : ''}`}
                  onClick={() => toggleSection('affaires')}
                >
                  <div className="history-icon" style={{ background: 'linear-gradient(135deg, #dbeafe, #93c5fd)', color: '#1e3a8a' }}>
                    <i className="fas fa-folder-open"></i>
                  </div>
                  <h3>Affaires en cours</h3>
                  <span className="history-badge">{selectedMembre.affairesEnCours.length}</span>
                  <i className={`fas fa-chevron-${openSections.affaires ? 'up' : 'down'} chevron-icon`}></i>
                </button>

                {openSections.affaires && (
                  <div className="history-content">
                    {selectedMembre.affairesEnCours.length === 0 ? (
                      <div className="history-empty">
                        <i className="fas fa-folder"></i>
                        <p>Aucune affaire en cours</p>
                      </div>
                    ) : (
                      <table className="history-table">
                        <thead>
                          <tr>
                            <th>N° Affaire</th>
                            <th>Nom</th>
                            <th>Client</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedMembre.affairesEnCours.map((affaire, i) => (
                            <tr key={i}>
                              <td><span className="num-badge">{affaire.numero}</span></td>
                              <td>{affaire.nom}</td>
                              <td>{affaire.client}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                )}
              </div>

              {/* ── Audiences à venir ── */}
              <div className="history-section">
                <button
                  className={`history-header ${openSections.audiences ? 'is-open' : ''}`}
                  onClick={() => toggleSection('audiences')}
                >
                  <div className="history-icon" style={{ background: 'linear-gradient(135deg, #d1fae5, #a7f3d0)', color: '#059669' }}>
                    <i className="fas fa-calendar-alt"></i>
                  </div>
                  <h3>Audiences à venir</h3>
                  <span className="history-badge">{selectedMembre.audiences.length}</span>
                  <i className={`fas fa-chevron-${openSections.audiences ? 'up' : 'down'} chevron-icon`}></i>
                </button>

                {openSections.audiences && (
                  <div className="history-content">
                    {selectedMembre.audiences.length === 0 ? (
                      <div className="history-empty">
                        <i className="fas fa-calendar"></i>
                        <p>Aucune audience programmée</p>
                      </div>
                    ) : (
                      <table className="history-table">
                        <thead>
                          <tr>
                            <th>Date</th>
                            <th>Heure</th>
                            <th>Affaire</th>
                            <th>Tribunal</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedMembre.audiences.map((audience, i) => (
                            <tr key={i} className="highlight-row">
                              <td>{audience.date}</td>
                              <td>{audience.heure}</td>
                              <td>{audience.affaire}</td>
                              <td>{audience.tribunal}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                )}
              </div>

              {/* ── Formations ── */}
              <div className="history-section">
                <button
                  className={`history-header ${openSections.formations ? 'is-open' : ''}`}
                  onClick={() => toggleSection('formations')}
                >
                  <div className="history-icon" style={{ background: 'linear-gradient(135deg, #fef3c7, #fde68a)', color: '#92400e' }}>
                    <i className="fas fa-graduation-cap"></i>
                  </div>
                  <h3>Formations</h3>
                  <span className="history-badge">{selectedMembre.formations.length}</span>
                  <i className={`fas fa-chevron-${openSections.formations ? 'up' : 'down'} chevron-icon`}></i>
                </button>

                {openSections.formations && (
                  <div className="history-content">
                    <table className="history-table">
                      <thead>
                        <tr>
                          <th>Formation</th>
                          <th>Organisme</th>
                          <th>Année</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedMembre.formations.map((formation, i) => (
                          <tr key={i}>
                            <td>{formation.titre}</td>
                            <td>{formation.organisme}</td>
                            <td>{formation.date}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

            </div>

            {/* Modal Footer */}
            <div className="modal-footer">
              <button className="mfooter-btn mfooter-close" onClick={handleCloseModal}>
                <i className="fas fa-times"></i> Fermer
              </button>
              <button
                className="mfooter-btn mfooter-email"
                onClick={() => { handleCloseModal(); handleViewDetail(selectedMembre.id); }}
              >
                <i className="fas fa-arrow-right"></i> Page complète
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Membres;
