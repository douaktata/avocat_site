import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCases } from '../api';
import './DossiersSecretaire.css';

const TYPE_META = {
  Civil:      { icon: 'fa-balance-scale', color: '#0ea5e9', bg: '#e0f2fe' },
  Commercial: { icon: 'fa-briefcase',     color: '#3b82f6', bg: '#dbeafe' },
  Pénal:      { icon: 'fa-gavel',         color: '#ef4444', bg: '#fee2e2' },
  Famille:    { icon: 'fa-users',         color: '#06b6d4', bg: '#cffafe' },
  Immobilier: { icon: 'fa-home',          color: '#10b981', bg: '#d1fae5' },
  Travail:    { icon: 'fa-hard-hat',      color: '#f59e0b', bg: '#fef3c7' },
  Divorce:    { icon: 'fa-heart-broken',  color: '#ec4899', bg: '#fce7f3' },
  Succession: { icon: 'fa-scroll',        color: '#8b5cf6', bg: '#ede9fe' },
};
const defaultMeta = { icon: 'fa-folder', color: '#64748b', bg: '#f3f4f6' };

const STATUS_CFG = {
  OPEN:    { label: 'En cours',   cls: 's-progress', icon: 'fa-circle-notch', prioBar: '#2563eb' },
  PENDING: { label: 'En attente', cls: 's-waiting',  icon: 'fa-clock',        prioBar: '#ec4899' },
  CLOSED:  { label: 'Clôturé',   cls: 's-closed',   icon: 'fa-check-circle', prioBar: '#10b981' },
};

const PRIO_CFG = {
  urgente: { label: 'Urgente', dot: '#ef4444', bg: '#fee2e2', color: '#991b1b', cls: 'p-urgent' },
  haute:   { label: 'Haute',   dot: '#f59e0b', bg: '#fef3c7', color: '#92400e', cls: 'p-haute' },
  normale: { label: 'Normale', dot: '#9ca3af', bg: '#f3f4f6', color: '#4b5563', cls: 'p-normal' },
};

const fmtDate = d => d ? new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

const initials = name => {
  if (!name) return '?';
  const parts = name.trim().split(' ').filter(Boolean);
  return parts.length >= 2
    ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    : name.slice(0, 2).toUpperCase();
};

const DossiersSecretaire = () => {
  const navigate = useNavigate();
  const [dossiers,     setDossiers]     = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState(null);
  const [search,       setSearch]       = useState('');
  const [filterStatut, setFilterStatut] = useState('');
  const [filterType,   setFilterType]   = useState('');
  const [view,         setView]         = useState('grid'); // 'grid' | 'list'

  useEffect(() => {
    getCases()
      .then(res => setDossiers(res.data))
      .catch(() => setError('Impossible de charger les dossiers'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => dossiers.filter(d => {
    const q = search.toLowerCase();
    const matchSearch =
      (d.case_number     || '').toLowerCase().includes(q) ||
      (d.client_full_name|| '').toLowerCase().includes(q) ||
      (d.case_type       || '').toLowerCase().includes(q);
    const matchStatut = !filterStatut || d.status    === filterStatut;
    const matchType   = !filterType   || d.case_type === filterType;
    return matchSearch && matchStatut && matchType;
  }), [dossiers, search, filterStatut, filterType]);

  const types = [...new Set(dossiers.map(d => d.case_type).filter(Boolean))];

  const stats = {
    total:   dossiers.length,
    open:    dossiers.filter(d => d.status === 'OPEN').length,
    pending: dossiers.filter(d => d.status === 'PENDING').length,
    closed:  dossiers.filter(d => d.status === 'CLOSED').length,
  };

  if (loading) return (
    <div className="dossec-page">
      <p style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
        <i className="fas fa-spinner fa-spin" style={{ marginRight: '0.5rem' }}></i>Chargement...
      </p>
    </div>
  );
  if (error) return (
    <div className="dossec-page">
      <p style={{ padding: '3rem', textAlign: 'center', color: '#ef4444' }}>{error}</p>
    </div>
  );

  return (
    <div className="dossec-page">

      {/* ── Header ── */}
      <div className="dossec-header">
        <div className="dossec-header-left">
          <div className="dossec-title-icon">
            <i className="fas fa-folder-open"></i>
          </div>
          <div>
            <h1 className="dossec-title">Dossiers Juridiques</h1>
            <p className="dossec-subtitle">Gestion de tous les dossiers du cabinet</p>
          </div>
        </div>
        <span className="dossec-readonly-badge">
          <i className="fas fa-eye"></i> Lecture seule
        </span>
      </div>

      {/* ── KPIs ── */}
      <div className="dossec-kpis">
        <div className="dossec-kpi kpi-total">
          <div className="kpi-icon-wrap"><i className="fas fa-folder-open"></i></div>
          <div className="kpi-text">
            <strong>{stats.total}</strong>
            <span>Total dossiers</span>
          </div>
          <div className="kpi-bar" style={{ '--p': '100%', '--c': '#1e3a8a' }}></div>
        </div>
        <div className="dossec-kpi kpi-progress">
          <div className="kpi-icon-wrap"><i className="fas fa-circle-notch"></i></div>
          <div className="kpi-text">
            <strong>{stats.open}</strong>
            <span>En cours</span>
          </div>
          <div className="kpi-bar" style={{ '--p': stats.total ? `${(stats.open/stats.total*100).toFixed(0)}%` : '0%', '--c': '#2563eb' }}></div>
        </div>
        <div className="dossec-kpi kpi-waiting">
          <div className="kpi-icon-wrap"><i className="fas fa-clock"></i></div>
          <div className="kpi-text">
            <strong>{stats.pending}</strong>
            <span>En attente</span>
          </div>
          <div className="kpi-bar" style={{ '--p': stats.total ? `${(stats.pending/stats.total*100).toFixed(0)}%` : '0%', '--c': '#ec4899' }}></div>
        </div>
        <div className="dossec-kpi kpi-closed">
          <div className="kpi-icon-wrap"><i className="fas fa-check-circle"></i></div>
          <div className="kpi-text">
            <strong>{stats.closed}</strong>
            <span>Clôturés</span>
          </div>
          <div className="kpi-bar" style={{ '--p': stats.total ? `${(stats.closed/stats.total*100).toFixed(0)}%` : '0%', '--c': '#10b981' }}></div>
        </div>
      </div>

      {/* ── Toolbar ── */}
      <div className="dossec-toolbar">
        <div className="dossec-search">
          <i className="fas fa-search"></i>
          <input
            type="text"
            placeholder="Rechercher par numéro, client, type..."
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
          <select className="dossec-sel" value={filterStatut} onChange={e => setFilterStatut(e.target.value)}>
            <option value="">Tous les statuts</option>
            <option value="OPEN">En cours</option>
            <option value="PENDING">En attente</option>
            <option value="CLOSED">Clôturé</option>
          </select>
          <select className="dossec-sel" value={filterType} onChange={e => setFilterType(e.target.value)}>
            <option value="">Tous les types</option>
            {types.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div className="dossec-view-group">
          <button className={`dossec-vbtn ${view === 'grid' ? 'active' : ''}`} onClick={() => setView('grid')} title="Vue grille">
            <i className="fas fa-th-large"></i>
          </button>
          <button className={`dossec-vbtn ${view === 'list' ? 'active' : ''}`} onClick={() => setView('list')} title="Vue liste">
            <i className="fas fa-list"></i>
          </button>
        </div>
        <span className="dossec-count">{filtered.length} dossier{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      {/* ── Empty State ── */}
      {filtered.length === 0 && (
        <div className="dossec-empty">
          <i className="fas fa-folder-open" style={{ fontSize: '3rem', color: '#cbd5e1' }}></i>
          <p style={{ fontWeight: 700, color: '#475569', fontSize: '1.05rem', margin: 0 }}>Aucun dossier trouvé</p>
          <small style={{ color: '#94a3b8' }}>Essayez de modifier vos filtres de recherche</small>
        </div>
      )}

      {/* ── Grid View ── */}
      {filtered.length > 0 && view === 'grid' && (
        <div className="dossec-grid">
          {filtered.map(d => {
            const meta   = TYPE_META[d.case_type] || defaultMeta;
            const sc     = STATUS_CFG[d.status]   || { label: d.status, cls: '', icon: 'fa-circle', prioBar: '#9ca3af' };
            const pc     = PRIO_CFG[d.priority]   || PRIO_CFG.normale;
            const init   = initials(d.client_full_name);
            return (
              <div key={d.idc} className="dc-card" onClick={() => navigate(`/secretaire/dossiers/${d.idc}`)}>
                <div className="dc-prio-bar" style={{ background: sc.prioBar }}></div>
                <div className="dc-card-inner">
                  <div className="dc-head">
                    <span className="dc-numero">
                      <i className="fas fa-hashtag"></i>{d.case_number || '—'}
                    </span>
                    <span className={`dc-statut ${sc.cls}`}>
                      <i className={`fas ${sc.icon}`}></i>{sc.label}
                    </span>
                  </div>

                  <div className="dc-client-row">
                    <div className="dc-avatar" style={{ background: meta.bg, color: meta.color }}>
                      {init}
                    </div>
                    <div className="dc-client-info">
                      <strong>{d.client_full_name || '—'}</strong>
                      <span className="dc-type-chip" style={{ background: meta.bg, color: meta.color, borderColor: meta.color + '44' }}>
                        <i className={`fas ${meta.icon}`}></i>{d.case_type || '—'}
                      </span>
                    </div>
                  </div>

                  <div className="dc-meta">
                    <div className="dc-meta-row">
                      <i className="fas fa-calendar-plus"></i>
                      <span>Ouvert le {fmtDate(d.created_at)}</span>
                    </div>
                    <div className="dc-meta-row">
                      <i className="fas fa-flag"></i>
                      <span className={`dc-prio ${pc.cls}`}>
                        <span className="dc-prio-dot" style={{ background: pc.dot }}></span>
                        {pc.label}
                      </span>
                    </div>
                  </div>

                  <div className="dc-foot">
                    <button className="dc-btn-voir" onClick={e => { e.stopPropagation(); navigate(`/secretaire/dossiers/${d.idc}`); }}>
                      <i className="fas fa-eye"></i> Voir le dossier
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── List View ── */}
      {filtered.length > 0 && view === 'list' && (
        <div className="dossec-table-wrap">
          <table className="dossec-table">
            <thead>
              <tr>
                <th>Numéro</th>
                <th>Client</th>
                <th>Type</th>
                <th>Statut</th>
                <th>Priorité</th>
                <th>Date ouverture</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(d => {
                const meta = TYPE_META[d.case_type] || defaultMeta;
                const sc   = STATUS_CFG[d.status]   || { label: d.status, cls: '', icon: 'fa-circle' };
                const pc   = PRIO_CFG[d.priority]   || PRIO_CFG.normale;
                const init = initials(d.client_full_name);
                return (
                  <tr key={d.idc} className="dossec-row" onClick={() => navigate(`/secretaire/dossiers/${d.idc}`)}>
                    <td>
                      <span className="dt-num-pill">
                        <i className="fas fa-hashtag"></i>{d.case_number || '—'}
                      </span>
                    </td>
                    <td>
                      <div className="dt-client-cell">
                        <div className="dt-mini-avatar" style={{ background: meta.bg, color: meta.color }}>{init}</div>
                        <span style={{ fontWeight: 600, color: '#1e3a8a' }}>{d.client_full_name || '—'}</span>
                      </div>
                    </td>
                    <td>
                      <span className="dt-type" style={{ color: meta.color }}>
                        <i className={`fas ${meta.icon}`}></i>{d.case_type || '—'}
                      </span>
                    </td>
                    <td>
                      <span className={`dc-statut ${sc.cls}`}>
                        <i className={`fas ${sc.icon}`}></i>{sc.label}
                      </span>
                    </td>
                    <td>
                      <span className={`dc-prio ${pc.cls}`}>
                        <span className="dc-prio-dot" style={{ background: pc.dot }}></span>
                        {pc.label}
                      </span>
                    </td>
                    <td className="dt-date">{fmtDate(d.created_at)}</td>
                    <td>
                      <button className="dc-btn-voir sm" onClick={e => { e.stopPropagation(); navigate(`/secretaire/dossiers/${d.idc}`); }}>
                        <i className="fas fa-eye"></i> Voir
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

    </div>
  );
};

export default DossiersSecretaire;
