import React, { useState, useEffect } from 'react';
import { getAppointments, patchAppointmentStatus, getCases } from '../api';
import {
  Clock, CheckCircle, XCircle, ClipboardList, Inbox, FolderOpen,
  CalendarDays, Pin, Scale, Zap, Check, X, ChevronRight,
  User, Briefcase, MessageSquare, Calendar,
} from 'lucide-react';

const parseReason = (reason) => {
  if (!reason) return { type: 'Consultation', motif: '-', message: '' };
  const sepIdx = reason.indexOf(' — ');
  if (sepIdx < 0) return { type: 'Consultation', motif: reason, message: '' };
  const type = reason.substring(0, sepIdx);
  const rest = reason.substring(sepIdx + 3);
  const colonIdx = rest.indexOf(' : ');
  const motif = colonIdx >= 0 ? rest.substring(0, colonIdx) : rest;
  const message = colonIdx >= 0 ? rest.substring(colonIdx + 3) : '';
  return { type: type || 'Consultation', motif: motif || '-', message };
};

const BACKEND = 'http://localhost:8081';

const mapAppt = (a) => {
  const nom = a.user?.nom || '';
  const prenom = a.user?.prenom || '';
  const fullName = `${nom} ${prenom}`.trim() || 'Client';
  const initials = `${nom.charAt(0)}${prenom.charAt(0)}`.toUpperCase() || '?';
  const rawPhoto = a.user?.photo_url || null;
  const photoUrl = rawPhoto ? (rawPhoto.startsWith('http') ? rawPhoto : `${BACKEND}${rawPhoto}`) : null;
  const dt = a.appointmentDate || a.appointment_date || '';
  const parsed = parseReason(a.reason);
  return {
    id: a.ida,
    clientId: a.user?.idu,
    client: fullName,
    avatar: initials,
    photoUrl,
    type: parsed.type,
    motif: parsed.motif,
    message: parsed.message || '',
    dossiers: [],
    statut: a.status,
    dateSouhaitee: dt.split('T')[0] || '',
    heureSouhaitee: dt.split('T')[1]?.substring(0, 5) || '',
    datedemande: (a.createdAt || a.created_at || dt).split('T')[0] || '',
  };
};

const Avatar = ({ photoUrl, initials, size = 42, bgColor = '#1e3a8a' }) => {
  const style = { width: size, height: size, borderRadius: '50%', flexShrink: 0, objectFit: 'cover' };
  if (photoUrl) {
    return <img src={photoUrl} alt={initials} style={style} onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }} />;
  }
  return (
    <div style={{ ...style, background: bgColor, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: size * 0.38 }}>
      {initials}
    </div>
  );
};

const DemandesRendezVous = () => {
  const [demandes, setDemandes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [onglet, setOnglet] = useState('nouvelles');
  const [histoFilter, setHistoFilter] = useState('tous');
  const [actionModal, setActionModal] = useState(null);
  const [confirmData, setConfirmData] = useState({ date: '', heure: '' });
  const [refusMotif, setRefusMotif] = useState('');
  const [detailModal, setDetailModal] = useState(null);

  const heures = ['09:00','09:30','10:00','10:30','11:00','11:30','14:00','14:30','15:00','15:30','16:00','16:30','17:00'];

  useEffect(() => {
    Promise.all([
      getAppointments(),
      getCases().catch(() => ({ data: [] })),
    ])
      .then(([apptRes, casesRes]) => {
        const casesByClient = {};
        casesRes.data.forEach(c => {
          const uid = c.client_id;
          if (!uid) return;
          if (!casesByClient[uid]) casesByClient[uid] = [];
          casesByClient[uid].push(c.case_number);
        });
        setDemandes(apptRes.data.map(a => ({
          ...mapAppt(a),
          dossiers: a.user?.idu ? (casesByClient[a.user.idu] || []) : [],
        })));
      })
      .catch(() => setError('Impossible de charger les demandes'))
      .finally(() => setLoading(false));
  }, []);

  // ─── Derived lists ───────────────────────────────────────────────
  const nouvelles = demandes
    .filter(d => d.statut === 'PENDING')
    .sort((a, b) => new Date(b.datedemande) - new Date(a.datedemande));

  const historique = demandes
    .filter(d => d.statut === 'CONFIRMED' || d.statut === 'CANCELLED')
    .filter(d => histoFilter === 'tous' || d.statut === histoFilter)
    .sort((a, b) => new Date(b.datedemande) - new Date(a.datedemande));

  const stats = [
    { label: 'En attente', value: demandes.filter(d => d.statut === 'PENDING').length, color: '#f59e0b', bg: '#fef3c7', Icon: Clock },
    { label: 'Confirmés', value: demandes.filter(d => d.statut === 'CONFIRMED').length, color: '#22c55e', bg: '#dcfce7', Icon: CheckCircle },
    { label: 'Refusés', value: demandes.filter(d => d.statut === 'CANCELLED').length, color: '#ef4444', bg: '#fee2e2', Icon: XCircle },
    { label: 'Total', value: demandes.length, color: '#1e3a8a', bg: '#eff6ff', Icon: ClipboardList },
  ];

  // ─── Actions ─────────────────────────────────────────────────────
  const handleConfirmer = (id) => {
    patchAppointmentStatus(id, 'CONFIRMED')
      .then(() => {
        setDemandes(prev => prev.map(d => d.id === id ? { ...d, statut: 'CONFIRMED' } : d));
      })
      .catch(() => alert('Erreur lors de la confirmation'));
    setActionModal(null);
    setConfirmData({ date: '', heure: '' });
  };

  const handleRefuser = (id) => {
    patchAppointmentStatus(id, 'CANCELLED')
      .then(() => {
        setDemandes(prev => prev.map(d => d.id === id ? { ...d, statut: 'CANCELLED' } : d));
      })
      .catch(() => alert('Erreur lors du refus'));
    setActionModal(null);
    setRefusMotif('');
  };

  // ─── Helpers ─────────────────────────────────────────────────────
  const formatDateFR = (dateStr) => {
    if (!dateStr) return '-';
    const d = new Date(dateStr.includes('T') ? dateStr : dateStr + 'T00:00:00');
    if (isNaN(d.getTime())) return '-';
    return d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  };

  const daysAgo = (dateStr) => {
    if (!dateStr) return '';
    const diff = Math.floor((new Date() - new Date(dateStr + 'T00:00:00')) / 86400000);
    if (diff === 0) return "Aujourd'hui";
    if (diff === 1) return 'Hier';
    return `Il y a ${diff} jours`;
  };

  const dossierLabel = (d) =>
    d.dossiers?.length > 1 ? `${d.dossiers.length} dossiers` :
    d.dossiers?.length === 1 ? `Dossier ${d.dossiers[0]}` : 'Nouveau client';

  if (loading) return <div style={s.page}><p style={{ padding: '2rem' }}>Chargement...</p></div>;
  if (error) return <div style={s.page}><p style={{ padding: '2rem', color: 'red' }}>{error}</p></div>;

  return (
    <div style={s.page}>

      {/* Header */}
      <div style={s.header}>
        <div>
          <h1 style={s.title}>Demandes de rendez-vous</h1>
          <p style={s.subtitle}>Gérez les demandes reçues de vos clients</p>
        </div>
      </div>

      {/* Stats */}
      <div style={s.statsGrid}>
        {stats.map((st, i) => (
          <div key={i} style={{ ...s.statCard, borderTop: `3px solid ${st.color}` }}>
            <div style={{ ...s.statIconBox, background: st.bg }}>
              <st.Icon size={20} color={st.color} />
            </div>
            <div>
              <div style={{ ...s.statValue, color: st.color }}>{st.value}</div>
              <div style={s.statLabel}>{st.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={s.tabs}>
        <button
          style={{ ...s.tab, ...(onglet === 'nouvelles' ? s.tabActive : {}) }}
          onClick={() => setOnglet('nouvelles')}
        >
          Nouvelles demandes
          {nouvelles.length > 0 && (
            <span style={{ ...s.tabBadge, background: onglet === 'nouvelles' ? '#fff' : '#1e3a8a', color: onglet === 'nouvelles' ? '#1e3a8a' : '#fff' }}>
              {nouvelles.length}
            </span>
          )}
        </button>
        <button
          style={{ ...s.tab, ...(onglet === 'historique' ? s.tabActive : {}) }}
          onClick={() => setOnglet('historique')}
        >
          Historique
        </button>
      </div>

      {/* ── ONGLET NOUVELLES DEMANDES ── */}
      {onglet === 'nouvelles' && (
        <div>
          {nouvelles.length === 0 ? (
            <div style={s.empty}>
              <Inbox size={40} color="#cbd5e1" />
              <p style={{ fontWeight: 600, color: '#475569' }}>Aucune nouvelle demande</p>
              <p style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Toutes les demandes ont été traitées</p>
            </div>
          ) : (
            <div style={s.cardList}>
              {nouvelles.map(d => (
                <div key={d.id} style={{ ...s.card, ...(d.type === 'Urgence juridique' ? s.cardUrgent : {}) }}>
                  {d.type === 'Urgence juridique' && (
                    <div style={s.urgenceBanner}><Zap size={13} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />URGENCE JURIDIQUE</div>
                  )}
                  <div style={s.cardBody}>
                    {/* Left: avatar + info */}
                    <div style={s.cardLeft}>
                      <Avatar photoUrl={d.photoUrl} initials={d.avatar} size={42} />
                      <div style={s.cardInfo}>
                        <div style={s.clientRow}>
                          <span style={s.clientName}>{d.client}</span>
                          <span style={s.dossierChip}>{dossierLabel(d)}</span>
                        </div>
                        <div style={s.tagsRow}>
                          <span style={{ ...s.typeTag, borderColor: d.type === 'Urgence juridique' ? '#ef4444' : '#1e3a8a', color: d.type === 'Urgence juridique' ? '#ef4444' : '#1e3a8a' }}>{d.type}</span>
                          <span style={s.motifTag}>{d.motif}</span>
                        </div>
                        <div style={s.metaRow}>
                          <span style={s.metaItem}><CalendarDays size={13} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 3 }} />{formatDateFR(d.dateSouhaitee)}</span>
                          {d.heureSouhaitee && <span style={s.metaItem}><Clock size={13} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 3 }} />{d.heureSouhaitee}</span>}
                          <span style={{ ...s.metaItem, color: '#94a3b8' }}>Reçue : {daysAgo(d.datedemande)}</span>
                        </div>
                        {d.message && (
                          <p style={s.messagePreview} onClick={() => setDetailModal(d)}>
                            "{d.message.substring(0, 100)}{d.message.length > 100 ? '...' : ''}"
                            {d.message.length > 100 && <span style={{ color: '#1e3a8a', fontStyle: 'normal', fontWeight: 600 }}> Lire plus</span>}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Right: actions */}
                    <div style={s.cardActions}>
                      <button style={s.btnDetail} onClick={() => setDetailModal(d)}><ChevronRight size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 2 }} />Détail</button>
                      <button
                        style={s.btnConfirmer}
                        onClick={() => { setActionModal({ id: d.id, type: 'confirmer' }); setConfirmData({ date: d.dateSouhaitee, heure: d.heureSouhaitee }); }}
                      >
                        <Check size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 3 }} />Confirmer
                      </button>
                      <button
                        style={s.btnRefuser}
                        onClick={() => setActionModal({ id: d.id, type: 'refuser' })}
                      >
                        <X size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 3 }} />Refuser
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── ONGLET HISTORIQUE ── */}
      {onglet === 'historique' && (
        <div>
          {/* Filtre historique */}
          <div style={s.histoFilters}>
            {[
              { key: 'tous', label: 'Tous', Icon: null },
              { key: 'CONFIRMED', label: 'Confirmés', Icon: CheckCircle },
              { key: 'CANCELLED', label: 'Refusés', Icon: XCircle },
            ].map(f => (
              <button
                key={f.key}
                style={{ ...s.filterBtn, ...(histoFilter === f.key ? s.filterBtnActive : {}), display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                onClick={() => setHistoFilter(f.key)}
              >
                {f.Icon && <f.Icon size={14} />}{f.label}
              </button>
            ))}
          </div>

          {historique.length === 0 ? (
            <div style={s.empty}>
              <FolderOpen size={40} color="#cbd5e1" />
              <p style={{ fontWeight: 600, color: '#475569' }}>Aucun historique</p>
            </div>
          ) : (
            <div style={s.tableWrap}>
              <table style={s.table}>
                <thead>
                  <tr>
                    {['Client', 'Type / Motif', 'Date souhaitée', 'Reçue le', 'Statut'].map(h => (
                      <th key={h} style={s.th}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {historique.map((d, i) => (
                    <tr
                      key={d.id}
                      style={{ ...s.tr, background: i % 2 === 0 ? '#fff' : '#f8fafc', cursor: 'pointer' }}
                      onClick={() => setDetailModal(d)}
                    >
                      <td style={s.td}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                          <Avatar photoUrl={d.photoUrl} initials={d.avatar} size={32} bgColor={d.statut === 'CONFIRMED' ? '#22c55e' : '#94a3b8'} />
                          <div>
                            <div style={{ fontWeight: 600, fontSize: '0.88rem', color: '#1e293b' }}>{d.client}</div>
                            <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{dossierLabel(d)}</div>
                          </div>
                        </div>
                      </td>
                      <td style={s.td}>
                        <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#334155' }}>{d.type}</div>
                        <div style={{ fontSize: '0.78rem', color: '#64748b' }}>{d.motif}</div>
                      </td>
                      <td style={s.td}>
                        <div style={{ fontSize: '0.85rem', color: '#334155' }}>{formatDateFR(d.dateSouhaitee)}</div>
                        {d.heureSouhaitee && <div style={{ fontSize: '0.78rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 3 }}><Clock size={11} />{d.heureSouhaitee}</div>}
                      </td>
                      <td style={{ ...s.td, fontSize: '0.82rem', color: '#64748b' }}>{d.datedemande}</td>
                      <td style={s.td}>
                        {d.statut === 'CONFIRMED'
                          ? <span style={{ ...s.badge, background: '#dcfce7', color: '#15803d', display: 'inline-flex', alignItems: 'center', gap: 4 }}><CheckCircle size={13} />Confirmé</span>
                          : <span style={{ ...s.badge, background: '#fee2e2', color: '#b91c1c', display: 'inline-flex', alignItems: 'center', gap: 4 }}><XCircle size={13} />Refusé</span>
                        }
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── MODAL DETAIL ── */}
      {detailModal && (
        <div style={s.overlay} onClick={() => setDetailModal(null)} role="presentation">
          <div style={{ ...s.modal, maxWidth: 580 }} onClick={e => e.stopPropagation()} role="dialog" aria-modal="true">

            {/* Bande colorée selon statut */}
            {(() => {
              const statusColor = detailModal.statut === 'CONFIRMED' ? '#22c55e'
                : detailModal.statut === 'CANCELLED' ? '#ef4444' : '#f59e0b';
              return <div style={{ height: 4, background: statusColor, borderRadius: '16px 16px 0 0' }} />;
            })()}

            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.1rem 1.5rem 0.9rem', borderBottom: '1px solid #f1f5f9' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <CalendarDays size={18} color="#1e3a8a" />
                <span style={{ fontWeight: 700, fontSize: '1rem', color: '#1e293b' }}>Détail de la demande</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                {detailModal.statut === 'CONFIRMED' && (
                  <span style={{ ...s.badge, background: '#dcfce7', color: '#15803d', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    <CheckCircle size={13} />Confirmé
                  </span>
                )}
                {detailModal.statut === 'CANCELLED' && (
                  <span style={{ ...s.badge, background: '#fee2e2', color: '#b91c1c', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    <XCircle size={13} />Refusé
                  </span>
                )}
                {detailModal.statut === 'PENDING' && (
                  <span style={{ ...s.badge, background: '#fef3c7', color: '#b45309', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    <Clock size={13} />En attente
                  </span>
                )}
                <button style={s.closeBtn} onClick={() => setDetailModal(null)}><X size={18} /></button>
              </div>
            </div>

            {/* Body */}
            <div style={{ padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

              {/* Profil client */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: '#f8fafc', borderRadius: '12px', padding: '1rem 1.1rem', border: '1px solid #e2e8f0' }}>
                <Avatar photoUrl={detailModal.photoUrl} initials={detailModal.avatar} size={50} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: '1rem', color: '#1e293b' }}>{detailModal.client}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.3rem', flexWrap: 'wrap' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.78rem', color: '#64748b' }}>
                      <Briefcase size={12} />{dossierLabel(detailModal)}
                    </span>
                    <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>·</span>
                    <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>Reçue {daysAgo(detailModal.datedemande)}</span>
                  </div>
                </div>
              </div>

              {/* Infos en grille */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem' }}>
                {[
                  { label: 'Type de demande', value: detailModal.type, Icon: Pin },
                  { label: 'Domaine juridique', value: detailModal.motif, Icon: Scale },
                  { label: 'Date souhaitée', value: formatDateFR(detailModal.dateSouhaitee), Icon: CalendarDays },
                  { label: 'Heure souhaitée', value: detailModal.heureSouhaitee || '—', Icon: Clock },
                ].map(item => (
                  <div key={item.label} style={{ padding: '0.8rem 1rem', background: '#fff', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.68rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.35rem' }}>
                      <item.Icon size={11} />{item.label}
                    </div>
                    <div style={{ fontSize: '0.88rem', fontWeight: 600, color: '#1e293b' }}>{item.value}</div>
                  </div>
                ))}
              </div>

              {/* Message client */}
              {detailModal.message && (
                <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '10px', overflow: 'hidden' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '0.65rem 1rem', background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                    <MessageSquare size={13} color="#64748b" />
                    <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Message du client</span>
                  </div>
                  <p style={{ fontSize: '0.875rem', color: '#475569', fontStyle: 'italic', margin: 0, padding: '0.9rem 1rem', lineHeight: 1.65 }}>
                    "{detailModal.message}"
                  </p>
                </div>
              )}
            </div>

            {/* Footer */}
            {detailModal.statut === 'PENDING' ? (
              <div style={{ ...s.modalFooter, justifyContent: 'space-between' }}>
                <button style={s.btnGhost} onClick={() => setDetailModal(null)}>Fermer</button>
                <div style={{ display: 'flex', gap: '0.6rem' }}>
                  <button style={s.btnRefuser} onClick={() => { setActionModal({ id: detailModal.id, type: 'refuser' }); setDetailModal(null); }}>
                    <X size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />Refuser
                  </button>
                  <button style={s.btnConfirmer} onClick={() => { setActionModal({ id: detailModal.id, type: 'confirmer' }); setConfirmData({ date: detailModal.dateSouhaitee, heure: detailModal.heureSouhaitee }); setDetailModal(null); }}>
                    <Check size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />Confirmer
                  </button>
                </div>
              </div>
            ) : (
              <div style={s.modalFooter}>
                <button style={s.btnGhost} onClick={() => setDetailModal(null)}>Fermer</button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── MODAL CONFIRMER ── */}
      {actionModal?.type === 'confirmer' && (
        <div style={s.overlay} onClick={() => setActionModal(null)}>
          <div style={{ ...s.modal, maxWidth: 480 }} onClick={e => e.stopPropagation()}>
            <div style={s.modalHeader}>
              <h2 style={s.modalTitle}>Confirmer le rendez-vous</h2>
              <button style={s.closeBtn} onClick={() => setActionModal(null)}>✕</button>
            </div>
            <div style={s.modalBody}>
              <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '1.25rem', lineHeight: 1.6 }}>
                Vous pouvez ajuster la date et l'heure ou conserver le créneau demandé.
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={s.formLabel}>Date confirmée *</label>
                  <input type="date" style={s.input} value={confirmData.date} min={new Date().toISOString().split('T')[0]} onChange={e => setConfirmData({ ...confirmData, date: e.target.value })} />
                </div>
                <div>
                  <label style={s.formLabel}>Heure confirmée *</label>
                  <select style={s.input} value={confirmData.heure} onChange={e => setConfirmData({ ...confirmData, heure: e.target.value })}>
                    <option value="">Choisir</option>
                    {heures.map(h => <option key={h} value={h}>{h}</option>)}
                  </select>
                </div>
              </div>
            </div>
            <div style={s.modalFooter}>
              <button style={s.btnGhost} onClick={() => setActionModal(null)}>Annuler</button>
              <button
                style={{ ...s.btnConfirmer, opacity: confirmData.date && confirmData.heure ? 1 : 0.5 }}
                disabled={!confirmData.date || !confirmData.heure}
                onClick={() => handleConfirmer(actionModal.id)}
              >
                ✓ Confirmer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL REFUSER ── */}
      {actionModal?.type === 'refuser' && (
        <div style={s.overlay} onClick={() => setActionModal(null)}>
          <div style={{ ...s.modal, maxWidth: 480 }} onClick={e => e.stopPropagation()}>
            <div style={s.modalHeader}>
              <h2 style={s.modalTitle}>Refuser la demande</h2>
              <button style={s.closeBtn} onClick={() => setActionModal(null)}>✕</button>
            </div>
            <div style={s.modalBody}>
              <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '1.25rem', lineHeight: 1.6 }}>
                Indiquez un motif de refus qui sera communiqué au client.
              </p>
              <div>
                <label style={s.formLabel}>Motif du refus *</label>
                <textarea
                  style={{ ...s.input, resize: 'vertical', minHeight: 100 }}
                  placeholder="Ex : Créneau non disponible, veuillez proposer une autre date..."
                  value={refusMotif}
                  onChange={e => setRefusMotif(e.target.value)}
                  rows={4}
                />
              </div>
            </div>
            <div style={s.modalFooter}>
              <button style={s.btnGhost} onClick={() => setActionModal(null)}>Annuler</button>
              <button
                style={{ ...s.btnRefuser, opacity: refusMotif.trim() ? 1 : 0.5 }}
                disabled={!refusMotif.trim()}
                onClick={() => handleRefuser(actionModal.id)}
              >
                ✕ Confirmer le refus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const s = {
  page: { maxWidth: '960px', margin: '0 auto', fontFamily: "'Segoe UI', system-ui, sans-serif" },
  header: { marginBottom: '1.75rem' },
  title: { fontSize: '1.6rem', fontWeight: 700, color: '#1e3a8a', margin: 0 },
  subtitle: { color: '#64748b', marginTop: '0.3rem', fontSize: '0.95rem' },

  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.75rem' },
  statCard: { background: '#fff', borderRadius: '12px', padding: '1.1rem 1.25rem', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '1rem' },
  statIconBox: { width: 44, height: 44, borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  statValue: { fontSize: '1.6rem', fontWeight: 800, lineHeight: 1 },
  statLabel: { fontSize: '0.78rem', color: '#64748b', fontWeight: 600, marginTop: '0.2rem' },

  tabs: { display: 'flex', gap: '0', marginBottom: '1.5rem', borderBottom: '2px solid #e2e8f0' },
  tab: { padding: '0.75rem 1.5rem', border: 'none', background: 'none', fontSize: '0.9rem', fontWeight: 600, color: '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', fontFamily: 'inherit', borderBottom: '2px solid transparent', marginBottom: '-2px', transition: 'color 0.15s' },
  tabActive: { color: '#1e3a8a', borderBottom: '2px solid #1e3a8a' },
  tabBadge: { padding: '0.1rem 0.5rem', borderRadius: '20px', fontSize: '0.72rem', fontWeight: 800 },

  cardList: { display: 'flex', flexDirection: 'column', gap: '1rem' },
  card: { background: '#fff', borderRadius: '14px', border: '1px solid #e2e8f0', overflow: 'hidden' },
  cardUrgent: { border: '1.5px solid #fca5a5', background: '#fffbeb' },
  urgenceBanner: { background: '#ef4444', color: '#fff', fontSize: '0.72rem', fontWeight: 800, padding: '0.3rem 1.25rem', letterSpacing: '0.05em' },
  cardBody: { display: 'flex', alignItems: 'flex-start', gap: '1rem', padding: '1.1rem 1.25rem' },
  cardLeft: { display: 'flex', gap: '0.9rem', flex: 1, minWidth: 0 },
  cardInfo: { flex: 1, minWidth: 0 },
  cardActions: { display: 'flex', flexDirection: 'column', gap: '0.5rem', flexShrink: 0, alignItems: 'stretch', minWidth: 120 },

  avatar: { width: 42, height: 42, borderRadius: '50%', background: '#1e3a8a', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.82rem', flexShrink: 0 },
  avatarSm: { width: 32, height: 32, borderRadius: '50%', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.72rem', flexShrink: 0 },

  clientRow: { display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' },
  clientName: { fontWeight: 700, fontSize: '0.95rem', color: '#1e293b' },
  dossierChip: { fontSize: '0.72rem', color: '#94a3b8', background: '#f1f5f9', padding: '0.15rem 0.5rem', borderRadius: '6px' },
  tagsRow: { display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '0.45rem' },
  typeTag: { padding: '0.2rem 0.6rem', border: '1.5px solid', borderRadius: '20px', fontSize: '0.74rem', fontWeight: 700 },
  motifTag: { padding: '0.2rem 0.6rem', background: '#f1f5f9', color: '#475569', borderRadius: '20px', fontSize: '0.74rem', fontWeight: 600 },
  metaRow: { display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '0.4rem' },
  metaItem: { fontSize: '0.82rem', color: '#475569' },
  messagePreview: { fontSize: '0.82rem', color: '#64748b', fontStyle: 'italic', margin: '0.3rem 0 0', lineHeight: 1.5, cursor: 'pointer' },

  histoFilters: { display: 'flex', gap: '0.5rem', marginBottom: '1.25rem' },
  filterBtn: { padding: '0.4rem 1rem', border: '1.5px solid #e2e8f0', borderRadius: '20px', background: '#fff', color: '#475569', fontSize: '0.83rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' },
  filterBtnActive: { border: '1.5px solid #1e3a8a', background: '#1e3a8a', color: '#fff' },

  tableWrap: { background: '#fff', borderRadius: '14px', border: '1px solid #e2e8f0', overflow: 'hidden' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { padding: '0.75rem 1rem', background: '#f8fafc', fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em', textAlign: 'left', borderBottom: '1px solid #e2e8f0' },
  tr: { transition: 'background 0.1s' },
  td: { padding: '0.85rem 1rem', verticalAlign: 'middle', borderBottom: '1px solid #f1f5f9' },

  badge: { padding: '0.25rem 0.7rem', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 700 },

  empty: { textAlign: 'center', padding: '3rem', color: '#94a3b8', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', background: '#fff', borderRadius: '14px', border: '1px solid #e2e8f0' },

  btnDetail: { padding: '0.4rem 0.8rem', background: '#f1f5f9', color: '#475569', border: '1px solid #e2e8f0', borderRadius: '7px', fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'center' },
  btnConfirmer: { padding: '0.45rem 0.8rem', background: '#1e3a8a', color: '#fff', border: 'none', borderRadius: '7px', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'center' },
  btnRefuser: { padding: '0.45rem 0.8rem', background: '#fef2f2', color: '#ef4444', border: '1.5px solid #fecaca', borderRadius: '7px', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'center' },
  btnGhost: { padding: '0.6rem 1.25rem', background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '8px', fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer', fontFamily: 'inherit' },

  overlay: { position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: '1rem' },
  modal: { background: '#fff', borderRadius: '16px', width: '100%', maxWidth: '620px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 25px 50px rgba(0,0,0,0.2)' },
  modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.25rem 1.5rem', borderBottom: '1px solid #e2e8f0' },
  modalTitle: { fontSize: '1.1rem', fontWeight: 700, color: '#1e293b', margin: 0 },
  closeBtn: { background: 'none', border: 'none', fontSize: '1.1rem', cursor: 'pointer', color: '#94a3b8', padding: '0.25rem' },
  modalBody: { padding: '1.5rem' },
  modalFooter: { padding: '1rem 1.5rem', borderTop: '1px solid #e2e8f0', display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' },

  formLabel: { display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#374151', marginBottom: '0.5rem' },
  input: { width: '100%', padding: '0.65rem 0.9rem', border: '1.5px solid #e2e8f0', borderRadius: '8px', fontSize: '0.9rem', fontFamily: 'inherit', color: '#374151', background: '#f8fafc', boxSizing: 'border-box', outline: 'none' },
};

export default DemandesRendezVous;
