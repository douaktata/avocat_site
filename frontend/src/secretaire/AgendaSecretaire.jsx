import React, { useState, useMemo, useEffect } from 'react';
import { getSlots, createSlot, updateSlot, deleteSlot } from '../api';
import '../avocate/Agendaav.css';

const generateTimeSlots = (debut, fin, duree) => {
  const slots = [];
  let current = debut;
  while (current < fin) {
    const [h, m] = current.split(':').map(Number);
    const nextH = Math.floor((h * 60 + m + duree) / 60);
    const nextM = (h * 60 + m + duree) % 60;
    const next = `${String(nextH).padStart(2, '0')}:${String(nextM).padStart(2, '0')}`;
    if (next <= fin) slots.push(`${current}-${next}`);
    current = next;
  }
  return slots;
};

const withSlots = (s) => ({
  ...s,
  creneauxGeneres: (s.heureDebut && s.heureFin && s.dureeConsultation)
    ? generateTimeSlots(s.heureDebut, s.heureFin, s.dureeConsultation)
    : [],
});

const AgendaSecretaire = () => {
  const [showSlotModal, setShowSlotModal] = useState(false);
  const [creneaux, setCreneaux] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getSlots()
      .then(res => {
        setCreneaux(res.data.map(withSlots));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const [newSlot, setNewSlot] = useState({
    date: '',
    heureDebut: '',
    heureFin: '',
    dureeConsultation: 60,
    actif: true,
  });

  const durees = [15, 30, 45, 60, 90, 120];

  const formatDateLabel = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr + 'T12:00:00');
    const label = d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    return label.charAt(0).toUpperCase() + label.slice(1);
  };

  const isToday = (dateStr) => {
    const today = new Date().toISOString().split('T')[0];
    return dateStr === today;
  };

  const datesAvecCreneaux = useMemo(() => {
    const byDate = {};
    creneaux.forEach(c => {
      const key = c.date || '';
      if (!key) return;
      if (!byDate[key]) {
        byDate[key] = {
          dateStr: key,
          dateLabel: formatDateLabel(key),
          isToday: isToday(key),
          creneaux: [],
        };
      }
      byDate[key].creneaux.push(c);
    });
    return Object.values(byDate).sort((a, b) => a.dateStr.localeCompare(b.dateStr));
  }, [creneaux]);

  const handleToggleSlot = (id) => {
    const creneau = creneaux.find(c => c.id === id);
    if (!creneau) return;
    const updated = { ...creneau, actif: !creneau.actif };
    updateSlot(id, { date: updated.date, heureDebut: updated.heureDebut, heureFin: updated.heureFin, dureeConsultation: updated.dureeConsultation, actif: updated.actif })
      .then(() => setCreneaux(creneaux.map(c => c.id === id ? updated : c)))
      .catch(() => alert('Erreur lors de la mise à jour'));
  };

  const handleDeleteSlot = (id) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce créneau ?')) {
      deleteSlot(id)
        .then(() => setCreneaux(creneaux.filter(c => c.id !== id)))
        .catch(() => alert('Erreur lors de la suppression'));
    }
  };

  const handleAddSlot = (e) => {
    e.preventDefault();
    const payload = {
      date: newSlot.date,
      heureDebut: newSlot.heureDebut,
      heureFin: newSlot.heureFin,
      dureeConsultation: newSlot.dureeConsultation,
      actif: newSlot.actif,
    };
    createSlot(payload)
      .then(res => {
        setCreneaux([...creneaux, withSlots(res.data)]);
        setNewSlot({ date: '', heureDebut: '', heureFin: '', dureeConsultation: 60, actif: true });
        setShowSlotModal(false);
      })
      .catch(() => alert('Erreur lors de la création du créneau'));
  };

  const stats = {
    creneauxActifs:      creneaux.filter(c => c.actif).length,
    creneauxTotal:       creneaux.length,
    creneauxDisponibles: creneaux.filter(c => c.actif).reduce((acc, c) => acc + c.creneauxGeneres.length, 0),
    joursCouverts:       datesAvecCreneaux.length,
  };

  if (loading) return <div className="page-header"><p style={{ padding: '2rem' }}>Chargement...</p></div>;

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <i className="fas fa-calendar-alt"></i> Gestion de l'Agenda
          </h1>
          <p className="page-description">
            Consultez et gérez les créneaux horaires disponibles pour les consultations
          </p>
        </div>
        <div className="header-actions">
          <button className="btn-primary" onClick={() => setShowSlotModal(true)}>
            <i className="fas fa-plus"></i> Nouveau créneau
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="agenda-stats">
        <div className="stat-box">
          <div className="stat-icon primary"><i className="fas fa-clock"></i></div>
          <div className="stat-info"><h3>{stats.creneauxTotal}</h3><p>Créneaux configurés</p></div>
        </div>
        <div className="stat-box">
          <div className="stat-icon success"><i className="fas fa-check-circle"></i></div>
          <div className="stat-info"><h3>{stats.creneauxActifs}</h3><p>Créneaux actifs</p></div>
        </div>
        <div className="stat-box">
          <div className="stat-icon warning"><i className="fas fa-calendar-check"></i></div>
          <div className="stat-info"><h3>{stats.creneauxDisponibles}</h3><p>Plages réservables</p></div>
        </div>
        <div className="stat-box">
          <div className="stat-icon info"><i className="fas fa-calendar-week"></i></div>
          <div className="stat-info"><h3>{stats.joursCouverts}</h3><p>Jours à venir</p></div>
        </div>
      </div>

      {/* Timeline des créneaux par date */}
      <div className="agenda-timeline">
        {datesAvecCreneaux.length === 0 ? (
          <div className="empty-agenda">
            <i className="fas fa-calendar-times"></i>
            <h3>Aucun créneau configuré</h3>
            <p>Ajoutez des créneaux horaires pour les voir apparaître ici.</p>
          </div>
        ) : (
          datesAvecCreneaux.map((dateInfo, index) => (
            <div key={index} className={`date-group ${dateInfo.isToday ? 'today' : ''}`}>
              <div className="date-header">
                <div className="date-indicator">
                  {dateInfo.isToday && <span className="today-badge">Aujourd'hui</span>}
                  <h2 className="date-title">{dateInfo.dateLabel}</h2>
                </div>
                <span className="date-slots-count">
                  {dateInfo.creneaux.reduce((acc, c) => acc + c.creneauxGeneres.length, 0)} créneaux
                </span>
              </div>

              <div className="date-creneaux">
                {dateInfo.creneaux.map(creneau => (
                  <div key={creneau.id} className="creneau-row">
                    <div className="creneau-time-block">
                      <div className="creneau-time-range">
                        <i className="fas fa-clock"></i>
                        <span>{creneau.heureDebut} - {creneau.heureFin}</span>
                      </div>
                      <span className="creneau-duree">{creneau.dureeConsultation} min / consultation</span>
                    </div>

                    <div className="creneau-slots-list">
                      {creneau.creneauxGeneres.map((slot, idx) => (
                        <span key={idx} className="slot-chip">{slot}</span>
                      ))}
                    </div>

                    <div className="creneau-actions">
                      <button
                        className={`toggle-btn ${creneau.actif ? 'active' : ''}`}
                        onClick={() => handleToggleSlot(creneau.id)}
                        title={creneau.actif ? 'Désactiver' : 'Activer'}
                      >
                        <i className={`fas fa-${creneau.actif ? 'toggle-on' : 'toggle-off'}`}></i>
                      </button>
                      <button
                        className="delete-btn"
                        onClick={() => handleDeleteSlot(creneau.id)}
                        title="Supprimer"
                      >
                        <i className="fas fa-trash-alt"></i>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal Ajout Créneau */}
      {showSlotModal && (
        <div className="modal-overlay" onClick={() => setShowSlotModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2><i className="fas fa-plus-circle"></i> Nouveau créneau horaire</h2>
              <button className="btn-close" onClick={() => setShowSlotModal(false)}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <form onSubmit={handleAddSlot}>
              <div className="modal-body">
                <div className="form-group">
                  <label><i className="fas fa-calendar-day"></i> Date *</label>
                  <input
                    type="date"
                    value={newSlot.date}
                    min={new Date().toISOString().split('T')[0]}
                    onChange={(e) => setNewSlot({ ...newSlot, date: e.target.value })}
                    required
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label><i className="fas fa-clock"></i> Heure de début *</label>
                    <input
                      type="time"
                      value={newSlot.heureDebut}
                      onChange={(e) => setNewSlot({ ...newSlot, heureDebut: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label><i className="fas fa-clock"></i> Heure de fin *</label>
                    <input
                      type="time"
                      value={newSlot.heureFin}
                      onChange={(e) => setNewSlot({ ...newSlot, heureFin: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label><i className="fas fa-hourglass-half"></i> Durée d'une consultation *</label>
                  <select
                    value={newSlot.dureeConsultation}
                    onChange={(e) => setNewSlot({ ...newSlot, dureeConsultation: Number(e.target.value) })}
                    required
                  >
                    {durees.map(duree => (
                      <option key={duree} value={duree}>{duree} minutes</option>
                    ))}
                  </select>
                  <small>Les créneaux seront automatiquement divisés selon cette durée</small>
                </div>

                <div className="form-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={newSlot.actif}
                      onChange={(e) => setNewSlot({ ...newSlot, actif: e.target.checked })}
                    />
                    <span>Activer immédiatement ce créneau</span>
                  </label>
                </div>

                {newSlot.heureDebut && newSlot.heureFin && newSlot.dureeConsultation && (
                  <div className="preview-box">
                    <h4><i className="fas fa-eye"></i> Aperçu des créneaux générés :</h4>
                    <div className="preview-slots">
                      {generateTimeSlots(newSlot.heureDebut, newSlot.heureFin, newSlot.dureeConsultation).map((slot, index) => (
                        <span key={index} className="preview-tag">{slot}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowSlotModal(false)}>
                  <i className="fas fa-times"></i> Annuler
                </button>
                <button type="submit" className="btn btn-primary">
                  <i className="fas fa-check"></i> Créer le créneau
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default AgendaSecretaire;
