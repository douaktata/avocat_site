import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FolderOpen, Folder, Search, X, Hash, Calendar,
  Flag, Eye, LayoutGrid, List, AlertCircle,
} from 'lucide-react';
import { getCases } from '../api';
import './DossiersSecretaire.css';

/* ── Config ── */
const STATUS_CFG = {
  OPEN:    { label: 'En cours',   cls: 'ds-badge-blue',   bar: '#2563eb' },
  PENDING: { label: 'En attente', cls: 'ds-badge-amber',  bar: '#f59e0b' },
  CLOSED:  { label: 'Clôturé',   cls: 'ds-badge-green',  bar: '#16a34a' },
};

const PRIO_CFG = {
  urgente: { label: 'Urgente', dot: '#ef4444', cls: 'ds-prio-red'   },
  haute:   { label: 'Haute',   dot: '#f59e0b', cls: 'ds-prio-amber' },
  normale: { label: 'Normale', dot: '#94a3b8', cls: 'ds-prio-gray'  },
};

const TYPE_COLOR = {
  Civil:      '#0ea5e9', Commercial: '#3b82f6', Pénal:      '#ef4444',
  Famille:    '#06b6d4', Immobilier: '#10b981', Travail:    '#f59e0b',
  Divorce:    '#ec4899', Succession: '#8b5cf6',
};

const fmtDate = d =>
  d ? new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

const initials = name => {
  if (!name) return '?';
  const parts = name.trim().split(' ').filter(Boolean);
  return parts.length >= 2
    ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    : name.slice(0, 2).toUpperCase();
};

/* ════════════════════════════════════════════════════
   COMPONENT
   ════════════════════════════════════════════════════ */
export default function DossiersSecretaire() {
  const navigate = useNavigate();
  const [dossiers,      setDossiers]      = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [search,        setSearch]        = useState('');
  const [filterStatut,  setFilterStatut]  = useState('');
  const [filterType,    setFilterType]    = useState('');
  const [view,          setView]          = useState('grid');

  useEffect(() => {
    getCases()
      .then(res => setDossiers(res.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => dossiers.filter(d => {
    const q = search.toLowerCase();
    const matchSearch =
      (d.case_number      || '').toLowerCase().includes(q) ||
      (d.client_full_name || '').toLowerCase().includes(q) ||
      (d.case_type        || '').toLowerCase().includes(q);
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

  /* ── render ── */
  return (
    <div className="ds">

      {/* Header */}
      <div className="ds-header">
        <div>
          <h1 className="ds-title">Dossiers Juridiques</h1>
          <p className="ds-sub">Gestion de tous les dossiers du cabinet</p>
        </div>
      </div>

      {/* KPIs */}
      <div className="ds-kpis">
        <div className="ds-kpi ds-kpi-blue">
          <div className="ds-kpi-ic"><FolderOpen size={18} /></div>
          <div><div className="ds-kpi-n">{stats.total}</div><div className="ds-kpi-l">Total dossiers</div></div>
        </div>
        <div className="ds-kpi ds-kpi-indigo">
          <div className="ds-kpi-ic"><Folder size={18} /></div>
          <div><div className="ds-kpi-n">{stats.open}</div><div className="ds-kpi-l">En cours</div></div>
        </div>
        <div className="ds-kpi ds-kpi-amber">
          <div className="ds-kpi-ic"><AlertCircle size={18} /></div>
          <div><div className="ds-kpi-n">{stats.pending}</div><div className="ds-kpi-l">En attente</div></div>
        </div>
        <div className="ds-kpi ds-kpi-green">
          <div className="ds-kpi-ic"><FolderOpen size={18} /></div>
          <div><div className="ds-kpi-n">{stats.closed}</div><div className="ds-kpi-l">Clôturés</div></div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="ds-toolbar">
        <div className="ds-search">
          <Search size={15} className="ds-search-ic" />
          <input
            type="text"
            placeholder="Rechercher par numéro, client, type…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && (
            <button className="ds-clear" onClick={() => setSearch('')}><X size={14} /></button>
          )}
        </div>

        <select className="ds-sel" value={filterStatut} onChange={e => setFilterStatut(e.target.value)}>
          <option value="">Tous les statuts</option>
          <option value="OPEN">En cours</option>
          <option value="PENDING">En attente</option>
          <option value="CLOSED">Clôturé</option>
        </select>

        <select className="ds-sel" value={filterType} onChange={e => setFilterType(e.target.value)}>
          <option value="">Tous les types</option>
          {types.map(t => <option key={t} value={t}>{t}</option>)}
        </select>

        <div className="ds-view-group">
          <button
            className={`ds-vbtn${view === 'grid' ? ' active' : ''}`}
            onClick={() => setView('grid')}
            title="Vue grille"
          >
            <LayoutGrid size={15} />
          </button>
          <button
            className={`ds-vbtn${view === 'list' ? ' active' : ''}`}
            onClick={() => setView('list')}
            title="Vue liste"
          >
            <List size={15} />
          </button>
        </div>

        <span className="ds-count">
          {filtered.length} dossier{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* States */}
      {loading ? (
        <div className="ds-loading">Chargement…</div>
      ) : filtered.length === 0 ? (
        <div className="ds-empty">
          <FolderOpen size={40} className="ds-empty-ic" />
          <h3>Aucun dossier trouvé</h3>
          <p>Essayez de modifier vos filtres de recherche</p>
        </div>
      ) : view === 'grid' ? (

        /* ── Grid ── */
        <div className="ds-grid">
          {filtered.map(d => {
            const sc    = STATUS_CFG[d.status] || { label: d.status, cls: 'ds-badge-gray', bar: '#94a3b8' };
            const pc    = PRIO_CFG[(d.priority || '').toLowerCase()] || PRIO_CFG.normale;
            const color = TYPE_COLOR[d.case_type] || '#64748b';
            return (
              <div
                key={d.idc}
                className="ds-card"
                onClick={() => navigate(`/secretaire/dossiers/${d.idc}`)}
              >
                <div className="ds-card-bar" style={{ background: sc.bar }} />
                <div className="ds-card-body">
                  <div className="ds-card-head">
                    <span className="ds-num">
                      <Hash size={11} />{d.case_number || '—'}
                    </span>
                    <span className={`ds-badge ${sc.cls}`}>{sc.label}</span>
                  </div>

                  <div className="ds-client-row">
                    <div className="ds-avatar" style={{ background: color + '20', color }}>
                      {initials(d.client_full_name)}
                    </div>
                    <div className="ds-client-info">
                      <strong>{d.client_full_name || '—'}</strong>
                      <span className="ds-type-chip" style={{ color, background: color + '15', borderColor: color + '40' }}>
                        {d.case_type || '—'}
                      </span>
                    </div>
                  </div>

                  <div className="ds-card-meta">
                    <div className="ds-meta-row">
                      <Calendar size={12} />
                      <span>Ouvert le {fmtDate(d.created_at)}</span>
                    </div>
                    <div className="ds-meta-row">
                      <Flag size={12} />
                      <span className={`ds-prio ${pc.cls}`}>
                        <span className="ds-prio-dot" style={{ background: pc.dot }} />
                        {pc.label}
                      </span>
                    </div>
                  </div>

                  <button
                    className="ds-btn-view"
                    onClick={e => { e.stopPropagation(); navigate(`/secretaire/dossiers/${d.idc}`); }}
                  >
                    <Eye size={13} /> Voir le dossier
                  </button>
                </div>
              </div>
            );
          })}
        </div>

      ) : (

        /* ── List ── */
        <div className="ds-table-wrap">
          <table className="ds-table">
            <thead>
              <tr>
                <th>Numéro</th>
                <th>Client</th>
                <th>Type</th>
                <th>Statut</th>
                <th>Priorité</th>
                <th>Date ouverture</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(d => {
                const sc    = STATUS_CFG[d.status] || { label: d.status, cls: 'ds-badge-gray' };
                const pc    = PRIO_CFG[(d.priority || '').toLowerCase()] || PRIO_CFG.normale;
                const color = TYPE_COLOR[d.case_type] || '#64748b';
                return (
                  <tr
                    key={d.idc}
                    className="ds-row"
                    onClick={() => navigate(`/secretaire/dossiers/${d.idc}`)}
                  >
                    <td>
                      <span className="ds-num ds-num-sm">
                        <Hash size={10} />{d.case_number || '—'}
                      </span>
                    </td>
                    <td>
                      <div className="ds-list-client">
                        <div className="ds-avatar ds-avatar-sm" style={{ background: color + '20', color }}>
                          {initials(d.client_full_name)}
                        </div>
                        <span className="ds-list-name">{d.client_full_name || '—'}</span>
                      </div>
                    </td>
                    <td>
                      <span className="ds-type-chip" style={{ color, background: color + '15', borderColor: color + '40' }}>
                        {d.case_type || '—'}
                      </span>
                    </td>
                    <td><span className={`ds-badge ${sc.cls}`}>{sc.label}</span></td>
                    <td>
                      <span className={`ds-prio ${pc.cls}`}>
                        <span className="ds-prio-dot" style={{ background: pc.dot }} />
                        {pc.label}
                      </span>
                    </td>
                    <td className="ds-date-cell">{fmtDate(d.created_at)}</td>
                    <td>
                      <button
                        className="ds-btn-view ds-btn-sm"
                        onClick={e => { e.stopPropagation(); navigate(`/secretaire/dossiers/${d.idc}`); }}
                      >
                        <Eye size={13} /> Voir
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
}
