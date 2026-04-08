import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCases, getDocumentsByCase, getTrialsByCase, getAudiencesByCase, createCase, getUsersByRole } from '../api';
import './AffaireJudiciaire.css';

const API_BASE = 'http://localhost:8081';

const STATUS_MAP = { OPEN: 'en_cours', PENDING: 'en_attente', CLOSED: 'cloture' };

const mapCase = c => ({
  id: c.idc,
  clientId: c.client_id,
  numero: c.case_number || '-',
  client: c.client_full_name || '-',
  type: c.case_type || 'Autre',
  statut: STATUS_MAP[c.status] || 'en_cours',
  dateOuverture: c.created_at ? c.created_at.split('T')[0] : '-',
  dateDerniereModif: c.updated_at ? c.updated_at.split('T')[0] : (c.created_at ? c.created_at.split('T')[0] : '-'),
  avocate: '-',
  priorite: c.priority || 'normale',
});

const TYPE_META = {
  Divorce:    { icon:'fa-heart-broken',  color:'#ec4899' },
  Commercial: { icon:'fa-briefcase',     color:'#3b82f6' },
  Succession: { icon:'fa-scroll',        color:'#8b5cf6' },
  Immobilier: { icon:'fa-home',          color:'#10b981' },
  Pénal:      { icon:'fa-gavel',         color:'#ef4444' },
  Travail:    { icon:'fa-hard-hat',      color:'#f59e0b' },
  Famille:    { icon:'fa-users',         color:'#06b6d4' },
  Civil:      { icon:'fa-balance-scale',  color:'#0ea5e9' },
  Autre:      { icon:'fa-folder',        color:'#6b7280' },
};
const DEFAULT_TYPE = { icon:'fa-folder', color:'#6b7280' };

const STATUT_META = {
  en_cours:   { label:'En cours',   cls:'s-progress', icon:'fa-spinner' },
  en_attente: { label:'En attente', cls:'s-waiting',  icon:'fa-clock'   },
  cloture:    { label:'Clôturé',    cls:'s-closed',   icon:'fa-check-circle' },
};

const PRIO_META = {
  urgente: { label:'Urgente', cls:'p-urgent', dot:'#ef4444' },
  haute:   { label:'Haute',   cls:'p-haute',  dot:'#f59e0b' },
  normale: { label:'Normale', cls:'p-normal', dot:'#9ca3af' },
};

const PRIO_COLORS = {
  urgente: '#ef4444',
  haute:   '#f59e0b',
  normale: '#9ca3af',
};

const fmt = d => new Date(d).toLocaleDateString('fr-FR', { day:'2-digit', month:'short', year:'numeric' });
const initiales = name => name.split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase();

/* ─── composant ───────────────────────────────────────── */

export default function AfaireJudiciaire() {
  const navigate = useNavigate();
  const [dossiers,     setDossiers]     = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [search,       setSearch]       = useState('');
  const [fStatut,      setFStatut]      = useState('');
  const [fType,        setFType]        = useState('');
  const [fPriorite,    setFPriorite]    = useState('');
  const [view,         setView]         = useState('grid');
  const [selected,       setSelected]       = useState(null);
  const [selectedCounts, setSelectedCounts] = useState({ docs: 0, audiences: 0 });
  const [showAddModal,   setShowAddModal]   = useState(false);
  const [clients,        setClients]        = useState([]);
  const [saving,         setSaving]         = useState(false);
  const [newDossier,     setNewDossier]     = useState({ case_number: '', case_type: 'Civil', priority: 'normale', client_id: '' });
  const [sortField,    setSortField]    = useState('dateOuverture');
  const [sortDir,      setSortDir]      = useState('desc');

  useEffect(() => {
    getCases()
      .then(res => setDossiers(res.data.map(mapCase)))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    getUsersByRole('CLIENT').then(r => setClients(r.data)).catch(() => {});
  }, []);

  const handleAddDossier = (e) => {
    e.preventDefault();
    if (!newDossier.client_id) return alert('Sélectionnez un client');
    setSaving(true);
    const payload = {
      case_number: newDossier.case_number,
      case_type: newDossier.case_type,
      status: 'OPEN',
      priority: newDossier.priority,
      user: { idu: parseInt(newDossier.client_id) },
    };
    createCase(payload)
      .then(res => {
        setDossiers(prev => [...prev, mapCase(res.data)]);
        setShowAddModal(false);
        setNewDossier({ case_number: '', case_type: 'Civil', priority: 'normale', client_id: '' });
      })
      .catch(err => alert(err.response?.data?.message || 'Erreur lors de la création'))
      .finally(() => setSaving(false));
  };

  useEffect(() => {
    if (!selected) return;
    setSelectedCounts({ docs: 0, audiences: 0 });
    Promise.all([getDocumentsByCase(selected.id), getAudiencesByCase(selected.id)])
      .then(([docsRes, audRes]) =>
        setSelectedCounts({ docs: docsRes.data.length, audiences: audRes.data.length })
      )
      .catch(() => {});
  }, [selected]);

  const handleViewDetails = (dossierId) => {
    navigate(`/avocat/affjud/${dossierId}`);
  };

/* KPIs */
  const kpis = useMemo(() => ({
    total:     dossiers.length,
    enCours:   dossiers.filter(d => d.statut === 'en_cours').length,
    enAttente: dossiers.filter(d => d.statut === 'en_attente').length,
    clotures:  dossiers.filter(d => d.statut === 'cloture').length,
  }), [dossiers]);

  /* Filtres + tri */
  const list = useMemo(() => {
    const q = search.toLowerCase();
    return dossiers
      .filter(d =>
        (!q || d.numero.toLowerCase().includes(q) || d.client.toLowerCase().includes(q) || d.type.toLowerCase().includes(q)) &&
        (!fStatut   || d.statut   === fStatut) &&
        (!fType     || d.type     === fType)   &&
        (!fPriorite || d.priorite === fPriorite)
      )
      .sort((a, b) => {
        const va = a[sortField] ?? '';
        const vb = b[sortField] ?? '';
        return sortDir === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va);
      });
  }, [dossiers, search, fStatut, fType, fPriorite, sortField, sortDir]);

  // Build id → photo_url map from already-loaded clients
  const clientPhotoMap = useMemo(() => {
    const m = {};
    clients.forEach(c => { if (c.photo_url) m[c.idu] = c.photo_url; });
    return m;
  }, [clients]);

  const getClientPhoto = (clientId) =>
    clientId && clientPhotoMap[clientId] ? `${API_BASE}${clientPhotoMap[clientId]}` : null;

  if (loading) return <div style={{padding:'2rem'}}>Chargement...</div>;

  const toggleSort = field => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('asc'); }
  };

  const reset = () => {
    setSearch(''); setFStatut(''); setFType(''); setFPriorite('');
    setSortField('dateOuverture'); setSortDir('desc');
  };

  return (
    <div className="dossec-page">

      {/* ══════ HEADER ══════ */}
      <div className="dossec-header">
        <div className="dossec-header-left">
          <div className="dossec-title-icon">
            <i className="fas fa-folder-open"></i>
          </div>
          <div>
            <h1 className="dossec-title">Dossiers</h1>
            <p className="dossec-subtitle">Gestion et suivi des dossiers juridiques</p>
          </div>
        </div>
        <button className="dossec-add-btn" onClick={() => {
          const next = String(dossiers.length + 1).padStart(3, '0');
          const year = new Date().getFullYear();
          setNewDossier({ case_number: `DOS-${year}-${next}`, case_type: 'Civil', priority: 'normale', client_id: '' });
          setShowAddModal(true);
        }}>
          <i className="fas fa-plus"></i> Nouveau dossier
        </button>
      </div>

      {/* ══════ KPIs ══════ */}
      <div className="dossec-kpis">
        <div className="dossec-kpi kpi-total">
          <div className="kpi-icon-wrap"><i className="fas fa-folder-open"></i></div>
          <div className="kpi-text">
            <strong>{kpis.total}</strong>
            <span>Total</span>
          </div>
          <div className="kpi-bar" style={{ '--p': '100%', '--c': 'var(--primary)' }}></div>
        </div>
        <div className="dossec-kpi kpi-progress">
          <div className="kpi-icon-wrap"><i className="fas fa-spinner"></i></div>
          <div className="kpi-text">
            <strong>{kpis.enCours}</strong>
            <span>En cours</span>
          </div>
          <div className="kpi-bar" style={{ '--p': `${(kpis.total ? kpis.enCours/kpis.total*100 : 0).toFixed(0)}%`, '--c': 'var(--blue)' }}></div>
        </div>
        <div className="dossec-kpi kpi-waiting">
          <div className="kpi-icon-wrap"><i className="fas fa-clock"></i></div>
          <div className="kpi-text">
            <strong>{kpis.enAttente}</strong>
            <span>En attente</span>
          </div>
          <div className="kpi-bar" style={{ '--p': `${(kpis.total ? kpis.enAttente/kpis.total*100 : 0).toFixed(0)}%`, '--c': 'var(--pink)' }}></div>
        </div>
        <div className="dossec-kpi kpi-closed">
          <div className="kpi-icon-wrap"><i className="fas fa-check-circle"></i></div>
          <div className="kpi-text">
            <strong>{kpis.clotures}</strong>
            <span>Clôturés</span>
          </div>
          <div className="kpi-bar" style={{ '--p': `${(kpis.total ? kpis.clotures/kpis.total*100 : 0).toFixed(0)}%`, '--c': 'var(--success)' }}></div>
        </div>
      </div>

      {/* ══════ TOOLBAR ══════ */}
      <div className="dossec-toolbar">
        <div className="dossec-search">
          <i className="fas fa-search"></i>
          <input
            type="text"
            placeholder="Rechercher un dossier, client, type..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && (
            <button className="dossec-clear" onClick={() => setSearch('')}>
              <i className="fas fa-times"></i>
            </button>
          )}
        </div>

        <div className="dossec-selects">
          <select className="dossec-sel" value={fStatut} onChange={e => setFStatut(e.target.value)}>
            <option value="">Tous les statuts</option>
            <option value="en_cours">En cours</option>
            <option value="en_attente">En attente</option>
            <option value="cloture">Clôturé</option>
          </select>
          <select className="dossec-sel" value={fType} onChange={e => setFType(e.target.value)}>
            <option value="">Tous les types</option>
            {Object.keys(TYPE_META).map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <select className="dossec-sel" value={fPriorite} onChange={e => setFPriorite(e.target.value)}>
            <option value="">Toutes priorités</option>
            <option value="urgente">Urgente</option>
            <option value="haute">Haute</option>
            <option value="normale">Normale</option>
          </select>
        </div>

        <div className="dossec-view-group">
          <button className={`dossec-vbtn${view==='grid'?' active':''}`} onClick={() => setView('grid')}>
            <i className="fas fa-th"></i>
          </button>
          <button className={`dossec-vbtn${view==='list'?' active':''}`} onClick={() => setView('list')}>
            <i className="fas fa-list"></i>
          </button>
        </div>

        <span className="dossec-count">{list.length} dossier{list.length>1?'s':''}</span>
      </div>

      {/* ══════ GRID VIEW ══════ */}
      {view === 'grid' && list.length > 0 && (
        <div className="dossec-grid">
          {list.map(d => {
            const tm = TYPE_META[d.type];
            const sm = STATUT_META[d.statut];
            const pm = PRIO_META[d.priorite];
            return (
              <div key={d.id} className="dc-card" onClick={() => setSelected(d)}>
                {/* Priority bar */}
                <div className="dc-prio-bar" style={{ background: PRIO_COLORS[d.priorite] }}></div>

                <div className="dc-card-inner">
                  {/* Head row */}
                  <div className="dc-head">
                    <span className="dc-numero">
                      <i className="fas fa-file-alt"></i>{d.numero}
                    </span>
                    <span className={`dc-prio ${pm.cls}`}>
                      <span className="dc-prio-dot" style={{ background: pm.dot }}></span>
                      {pm.label}
                    </span>
                  </div>

                  {/* Client */}
                  <div className="dc-client-row">
                    <div
                      className="dc-avatar"
                      style={{ background: `${tm.color}22`, color: tm.color, overflow: 'hidden', padding: 0 }}
                    >
                      {getClientPhoto(d.clientId)
                        ? <img src={getClientPhoto(d.clientId)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%', display: 'block' }} />
                        : initiales(d.client)}
                    </div>
                    <div className="dc-client-info">
                      <strong>{d.client}</strong>
                      <span
                        className="dc-type-chip"
                        style={{ background: `${tm.color}15`, color: tm.color, borderColor: `${tm.color}30` }}
                      >
                        <i className={`fas ${tm.icon}`}></i>{d.type}
                      </span>
                    </div>
                  </div>

                  {/* Meta */}
                  <div className="dc-meta">
                    <div className="dc-meta-row">
                      <i className="fas fa-user-tie"></i>
                      <span>{d.avocate}</span>
                    </div>
                    <div className="dc-meta-row">
                      <i className="fas fa-calendar-plus"></i>
                      <span>Ouvert le {fmt(d.dateOuverture)}</span>
                    </div>
                    <div className="dc-meta-row">
                      <i className="fas fa-pen"></i>
                      <span>Modif. {fmt(d.dateDerniereModif)}</span>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="dc-foot">
                    <span className={`dc-statut ${sm.cls}`}>
                      <i className={`fas ${sm.icon}`}></i>{sm.label}
                    </span>
                    <div style={{ display: 'flex', gap: '0.4rem' }}>
                      <button
                        className="dc-btn-voir"
                        onClick={e => { e.stopPropagation(); setSelected(d); }}
                      >
                        <i className="fas fa-eye"></i> Aperçu
                      </button>
                      <button
                        className="dc-btn-voir"
                        style={{ background: '#1a56db', color: '#fff' }}
                        onClick={e => { e.stopPropagation(); handleViewDetails(d.id); }}
                      >
                        <i className="fas fa-arrow-right"></i> Détail
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ══════ LIST VIEW ══════ */}
      {view === 'list' && list.length > 0 && (
        <div className="dossec-table-wrap">
          <table className="dossec-table">
            <thead>
              <tr>
                <th className="sortable" onClick={() => toggleSort('numero')}>
                  Numéro <span className="sort-icon">{sortField==='numero' ? <i className={`fas fa-sort-${sortDir==='asc'?'up':'down'}`}></i> : <i className="fas fa-sort"></i>}</span>
                </th>
                <th className="sortable" onClick={() => toggleSort('client')}>
                  Client <span className="sort-icon">{sortField==='client' ? <i className={`fas fa-sort-${sortDir==='asc'?'up':'down'}`}></i> : <i className="fas fa-sort"></i>}</span>
                </th>
                <th>Type</th>
                <th>Statut</th>
                <th>Priorité</th>
                <th className="sortable" onClick={() => toggleSort('dateOuverture')}>
                  Ouverture <span className="sort-icon">{sortField==='dateOuverture' ? <i className={`fas fa-sort-${sortDir==='asc'?'up':'down'}`}></i> : <i className="fas fa-sort"></i>}</span>
                </th>
                <th className="sortable" onClick={() => toggleSort('dateDerniereModif')}>
                  Modif. <span className="sort-icon">{sortField==='dateDerniereModif' ? <i className={`fas fa-sort-${sortDir==='asc'?'up':'down'}`}></i> : <i className="fas fa-sort"></i>}</span>
                </th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {list.map(d => {
                const tm = TYPE_META[d.type] || DEFAULT_TYPE;
                const sm = STATUT_META[d.statut] || STATUT_META.en_cours;
                const pm = PRIO_META[d.priorite] || PRIO_META.normale;
                return (
                  <tr key={d.id} className="dossec-row" onClick={() => setSelected(d)}>
                    <td><span className="dt-num-pill"><i className="fas fa-file-alt"></i>{d.numero}</span></td>
                    <td>
                      <div className="dt-client-cell">
                        <div className="dt-mini-avatar" style={{ background: `${tm.color}22`, color: tm.color, overflow: 'hidden', padding: 0 }}>
                          {getClientPhoto(d.clientId)
                            ? <img src={getClientPhoto(d.clientId)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%', display: 'block' }} />
                            : initiales(d.client)}
                        </div>
                        <span>{d.client}</span>
                      </div>
                    </td>
                    <td>
                      <span className="dt-type" style={{ color: tm.color }}>
                        <i className={`fas ${tm.icon}`}></i>{d.type}
                      </span>
                    </td>
                    <td><span className={`dc-statut ${sm.cls}`}><i className={`fas ${sm.icon}`}></i>{sm.label}</span></td>
                    <td><span className={`dc-prio ${pm.cls}`}><span className="dc-prio-dot" style={{ background: pm.dot }}></span>{pm.label}</span></td>
                    <td className="dt-date">{fmt(d.dateOuverture)}</td>
                    <td className="dt-date">{fmt(d.dateDerniereModif)}</td>
                    <td onClick={e => e.stopPropagation()} style={{ display: 'flex', gap: '0.4rem' }}>
                      <button className="dc-btn-voir sm" onClick={() => setSelected(d)}>
                        <i className="fas fa-eye"></i> Aperçu
                      </button>
                      <button className="dc-btn-voir sm" style={{ background: '#1a56db', color: '#fff' }} onClick={() => handleViewDetails(d.id)}>
                        <i className="fas fa-arrow-right"></i> Détail
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ══════ EMPTY STATE ══════ */}
      {list.length === 0 && (
        <div className="dossec-empty">
          <div className="dossec-empty-icon"><i className="fas fa-search"></i></div>
          <h3>Aucun dossier trouvé</h3>
          <p>Aucun résultat ne correspond à vos critères de recherche.</p>
          <button className="dossec-reset-btn" onClick={reset}>
            <i className="fas fa-undo"></i> Réinitialiser les filtres
          </button>
        </div>
      )}

      {/* ══════ MODAL APERÇU SIMPLE ══════ */}
      {selected && (
        <div className="dossec-overlay" onClick={() => setSelected(null)}>
          <div className="dossec-modal modal-simple" onClick={e => e.stopPropagation()}>

            {/* Hero */}
            <div className="dm-hero">
              <div className="dm-hero-avatar" style={{ overflow: 'hidden', padding: 0 }}>
                {getClientPhoto(selected.clientId)
                  ? <img src={getClientPhoto(selected.clientId)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%', display: 'block' }} />
                  : initiales(selected.client)}
              </div>
              <div className="dm-hero-info">
                <span className="dm-hero-num">{selected.numero}</span>
                <h2 className="dm-hero-name">{selected.client}</h2>
                <div className="dm-hero-badges">
                  <span className={`dc-statut ${STATUT_META[selected.statut].cls}`}>
                    <i className={`fas ${STATUT_META[selected.statut].icon}`}></i>
                    {STATUT_META[selected.statut].label}
                  </span>
                  <span className={`dc-prio ${PRIO_META[selected.priorite].cls}`}>
                    <span className="dc-prio-dot" style={{ background: PRIO_META[selected.priorite].dot }}></span>
                    {PRIO_META[selected.priorite].label}
                  </span>
                </div>
              </div>
              <button className="dm-close" onClick={() => setSelected(null)}>
                <i className="fas fa-times"></i>
              </button>
            </div>

            {/* Corps */}
            <div className="dm-body-simple">
              <h3 className="section-title-simple">
                <i className="fas fa-info-circle"></i> Informations générales
              </h3>

              <div className="dm-info-grid">
                <div className="dm-info-cell">
                  <label>Numéro</label>
                  <p className="mono">{selected.numero}</p>
                </div>
                <div className="dm-info-cell">
                  <label>Type d'affaire</label>
                  <p style={{ color: TYPE_META[selected.type]?.color }}>
                    <i className={`fas ${TYPE_META[selected.type]?.icon}`} style={{ marginRight:'0.4rem' }}></i>
                    {selected.type}
                  </p>
                </div>
                <div className="dm-info-cell">
                  <label>Avocate responsable</label>
                  <p><i className="fas fa-user-tie" style={{ marginRight:'0.4rem', color:'#2563eb' }}></i>{selected.avocate}</p>
                </div>
                <div className="dm-info-cell">
                  <label>Client</label>
                  <p>{selected.client}</p>
                </div>
                <div className="dm-info-cell">
                  <label>Date d'ouverture</label>
                  <p><i className="fas fa-calendar" style={{ marginRight:'0.4rem' }}></i>{fmt(selected.dateOuverture)}</p>
                </div>
                <div className="dm-info-cell">
                  <label>Dernière modification</label>
                  <p><i className="fas fa-pen" style={{ marginRight:'0.4rem' }}></i>{fmt(selected.dateDerniereModif)}</p>
                </div>
              </div>

              {/* Stats rapides */}
              <div className="quick-stats-dos">
                <div className="quick-stat-dos">
                  <i className="fas fa-file-alt"></i>
                  <div>
                    <span className="stat-number">{selectedCounts.docs}</span>
                    <span className="stat-label">Documents</span>
                  </div>
                </div>
                <div className="quick-stat-dos">
                  <i className="fas fa-gavel"></i>
                  <div>
                    <span className="stat-number">{selectedCounts.audiences}</span>
                    <span className="stat-label">Audiences</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Pied de modal */}
            <div className="dm-foot">
              <button className="dm-btn-close" onClick={() => setSelected(null)}>
                <i className="fas fa-times"></i> Fermer
              </button>
<button className="dm-btn-print" onClick={() => handleViewDetails(selected.id)}>
                <i className="fas fa-arrow-right"></i> Plus de détails
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ══════ MODAL NOUVEAU DOSSIER ══════ */}
      {showAddModal && (
        <div className="dossec-overlay" onClick={() => setShowAddModal(false)}>
          <div className="dossec-modal" style={{ maxWidth: 480 }} onClick={e => e.stopPropagation()}>

            <div className="dm-hero" style={{ background: 'linear-gradient(135deg, #1e3a8a, #2563eb)' }}>
              <div className="dm-hero-avatar" style={{ background: 'rgba(255,255,255,0.15)' }}>
                <i className="fas fa-folder-plus" style={{ fontSize: '1.3rem', color: '#fff' }}></i>
              </div>
              <div className="dm-hero-info">
                <h2 style={{ color: '#fff', margin: 0 }}>Nouveau dossier</h2>
                <p style={{ color: 'rgba(255,255,255,0.7)', margin: 0, fontSize: '0.85rem' }}>Créer un dossier pour un client</p>
              </div>
              <button className="dm-close" style={{ color: '#fff' }} onClick={() => setShowAddModal(false)}>
                <i className="fas fa-times"></i>
              </button>
            </div>

            <form onSubmit={handleAddDossier}>
              <div style={{ padding: '1.5rem', display: 'grid', gap: '1rem' }}>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#374151', marginBottom: '0.3rem' }}>Client *</label>
                  <select required style={{ width: '100%', padding: '0.6rem 0.8rem', border: '1.5px solid #e2e8f0', borderRadius: 8, fontSize: '0.9rem', fontFamily: 'inherit', boxSizing: 'border-box' }}
                    value={newDossier.client_id} onChange={e => setNewDossier({ ...newDossier, client_id: e.target.value })}>
                    <option value="">-- Sélectionner un client --</option>
                    {clients.map(c => (
                      <option key={c.idu} value={c.idu}>{c.prenom} {c.nom} — {c.email}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#374151', marginBottom: '0.3rem' }}>Numéro de dossier *</label>
                  <input required style={{ width: '100%', padding: '0.6rem 0.8rem', border: '1.5px solid #e2e8f0', borderRadius: 8, fontSize: '0.9rem', fontFamily: 'inherit', boxSizing: 'border-box' }}
                    placeholder="ex: DOS-2026-001" value={newDossier.case_number}
                    onChange={e => setNewDossier({ ...newDossier, case_number: e.target.value })} />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#374151', marginBottom: '0.3rem' }}>Type *</label>
                    <select required style={{ width: '100%', padding: '0.6rem 0.8rem', border: '1.5px solid #e2e8f0', borderRadius: 8, fontSize: '0.9rem', fontFamily: 'inherit', boxSizing: 'border-box' }}
                      value={newDossier.case_type} onChange={e => setNewDossier({ ...newDossier, case_type: e.target.value })}>
                      {['Civil', 'Commercial', 'Pénal', 'Famille', 'Divorce', 'Travail', 'Immobilier', 'Succession'].map(t => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#374151', marginBottom: '0.3rem' }}>Priorité</label>
                    <select style={{ width: '100%', padding: '0.6rem 0.8rem', border: '1.5px solid #e2e8f0', borderRadius: 8, fontSize: '0.9rem', fontFamily: 'inherit', boxSizing: 'border-box' }}
                      value={newDossier.priority} onChange={e => setNewDossier({ ...newDossier, priority: e.target.value })}>
                      <option value="normale">Normale</option>
                      <option value="haute">Haute</option>
                      <option value="urgente">Urgente</option>
                    </select>
                  </div>
                </div>

              </div>

              <div className="dm-foot">
                <button type="button" className="dm-btn-close" onClick={() => setShowAddModal(false)}>
                  <i className="fas fa-times"></i> Annuler
                </button>
                <button type="submit" className="dm-btn-print" disabled={saving}>
                  <i className="fas fa-folder-plus"></i> {saving ? 'Création...' : 'Créer le dossier'}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
}