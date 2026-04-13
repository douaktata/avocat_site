import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FolderOpen, Folder, Search, X, Hash, Calendar,
  Flag, Eye, LayoutGrid, List, AlertCircle, ArrowRight,
  Sparkles, Scale, Briefcase, Home, HardHat,
  Heart, ScrollText, Users, Gavel, CheckCircle2, Clock,
} from 'lucide-react';
import { getCases } from '../api';
import './DossiersSecretaire.css';

/* ── Meta ── */
const STATUS_CFG = {
  OPEN:    { label: 'En cours',   cls: 'doss-b-blue',  bar: '#2563eb' },
  PENDING: { label: 'En attente', cls: 'doss-b-amber', bar: '#f59e0b' },
  CLOSED:  { label: 'Clôturé',  cls: 'doss-b-green', bar: '#16a34a' },
};

const PRIO_CFG = {
  urgente: { label: 'Urgente', dot: '#ef4444', cls: 'doss-prio-red'   },
  haute:   { label: 'Haute',   dot: '#f59e0b', cls: 'doss-prio-amber' },
  normale: { label: 'Normale', dot: '#94a3b8', cls: 'doss-prio-gray'  },
};

const TYPE_META = {
  Civil:      { Icon: Scale,      color: '#0ea5e9', bg: '#e0f2fe' },
  Commercial: { Icon: Briefcase,  color: '#3b82f6', bg: '#dbeafe' },
  Pénal:      { Icon: Gavel,      color: '#ef4444', bg: '#fee2e2' },
  Famille:    { Icon: Users,      color: '#06b6d4', bg: '#cffafe' },
  Immobilier: { Icon: Home,       color: '#10b981', bg: '#d1fae5' },
  Travail:    { Icon: HardHat,    color: '#f59e0b', bg: '#fef3c7' },
  Divorce:    { Icon: Heart,      color: '#ec4899', bg: '#fce7f3' },
  Succession: { Icon: ScrollText, color: '#8b5cf6', bg: '#ede9fe' },
};
const defaultType = { Icon: Folder, color: '#64748b', bg: '#f1f5f9' };

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
  const [dossiers,     setDossiers]     = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [search,       setSearch]       = useState('');
  const [filterStatut, setFilterStatut] = useState('');
  const [filterType,   setFilterType]   = useState('');
  const [view,         setView]         = useState('grid');

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

  return (
    <div className="doss">

      {/* ── HEADER BANNER ── */}
      <div className="doss-header">
        <div className="doss-header-blob" />

        <div className="doss-header-top">
          <div className="doss-header-left">
            <div className="doss-eyebrow"><Sparkles size={11} /> Gestion des dossiers</div>
            <h1 className="doss-title">Dossiers <em>juridiques</em></h1>
            <p className="doss-subtitle">Consultez et suivez tous les dossiers du Cabinet Hajaij</p>
          </div>
        </div>

        <div className="doss-header-divider" />

        <div className="doss-header-stats">
          <div className="doss-hstat">
            <span className="doss-hstat-number">{stats.total}</span>
            <span className="doss-hstat-label">Total dossiers</span>
          </div>
          <div className="doss-hstat-sep" />
          <div className="doss-hstat">
            <span className="doss-hstat-number doss-hstat-blue">{stats.open}</span>
            <span className="doss-hstat-label">En cours</span>
          </div>
          <div className="doss-hstat-sep" />
          <div className="doss-hstat">
            <span className="doss-hstat-number doss-hstat-amber">{stats.pending}</span>
            <span className="doss-hstat-label">En attente</span>
          </div>
          <div className="doss-hstat-sep" />
          <div className="doss-hstat">
            <span className="doss-hstat-number doss-hstat-green">{stats.closed}</span>
            <span className="doss-hstat-label">Clôturés</span>
          </div>
          <div className="doss-hstat-sep" />
          <div className="doss-hstat">
            <span className="doss-hstat-number">{filtered.length}</span>
            <span className="doss-hstat-label">Résultats</span>
          </div>
        </div>
      </div>

      {/* ── TOOLBAR ── */}
      <div className="doss-toolbar">
        <div className="doss-search">
          <Search size={15} className="doss-search-ic" />
          <input
            type="text"
            placeholder="Rechercher par numéro, client, type…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && (
            <button className="doss-clear" onClick={() => setSearch('')}><X size={14} /></button>
          )}
        </div>

        <select className="doss-sel" value={filterStatut} onChange={e => setFilterStatut(e.target.value)}>
          <option value="">Tous les statuts</option>
          <option value="OPEN">En cours</option>
          <option value="PENDING">En attente</option>
          <option value="CLOSED">Clôturé</option>
        </select>

        <select className="doss-sel" value={filterType} onChange={e => setFilterType(e.target.value)}>
          <option value="">Tous les types</option>
          {types.map(t => <option key={t} value={t}>{t}</option>)}
        </select>

        <div className="doss-view-group">
          <button className={`doss-vbtn${view === 'grid' ? ' active' : ''}`} onClick={() => setView('grid')} title="Vue grille">
            <LayoutGrid size={15} />
          </button>
          <button className={`doss-vbtn${view === 'list' ? ' active' : ''}`} onClick={() => setView('list')} title="Vue liste">
            <List size={15} />
          </button>
        </div>

        <span className="doss-count">{filtered.length} dossier{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      {/* ── STATES ── */}
      {loading ? (
        <div className="doss-loading">
          <div className="doss-spinner" />
          <span>Chargement des dossiers…</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="doss-empty">
          <div className="doss-empty-icon"><FolderOpen size={30} /></div>
          <p className="doss-empty-title">Aucun dossier trouvé</p>
          <p className="doss-empty-sub">Essayez de modifier vos filtres de recherche</p>
        </div>
      ) : view === 'grid' ? (

        /* ── GRID VIEW ── */
        <div className="doss-grid">
          {filtered.map(d => {
            const sc = STATUS_CFG[d.status] || { label: d.status, cls: 'doss-b-gray', bar: '#94a3b8' };
            const pc = PRIO_CFG[(d.priority || '').toLowerCase()] || PRIO_CFG.normale;
            const tm = TYPE_META[d.case_type] || defaultType;
            const { Icon: TypeIcon } = tm;
            return (
              <div key={d.idc} className="doss-card" onClick={() => navigate(`/secretaire/dossiers/${d.idc}`)}>
                <div className="doss-card-bar" style={{ background: sc.bar }} />
                <div className="doss-card-body">

                  <div className="doss-card-head">
                    <span className="doss-num"><Hash size={11} />{d.case_number || '—'}</span>
                    <span className={`doss-badge ${sc.cls}`}>{sc.label}</span>
                  </div>

                  <div className="doss-client-row">
                    <div className="doss-type-icon" style={{ background: tm.bg, color: tm.color }}>
                      <TypeIcon size={18} />
                    </div>
                    <div className="doss-client-info">
                      <strong>{d.client_full_name || '—'}</strong>
                      <span className="doss-type-chip" style={{ color: tm.color, background: tm.bg }}>
                        {d.case_type || '—'}
                      </span>
                    </div>
                  </div>

                  <div className="doss-card-meta">
                    <div className="doss-meta-row">
                      <Calendar size={12} />
                      <span>Ouvert le {fmtDate(d.created_at)}</span>
                    </div>
                    <div className="doss-meta-row">
                      <span className={`doss-prio ${pc.cls}`}>
                        <span className="doss-prio-dot" style={{ background: pc.dot }} />
                        {pc.label}
                      </span>
                    </div>
                  </div>

                  <div className="doss-card-footer">
                    <button
                      className="doss-btn-ghost"
                      onClick={e => { e.stopPropagation(); navigate(`/secretaire/dossiers/${d.idc}`); }}
                    >
                      <Eye size={13} /> Aperçu
                    </button>
                    <button
                      className="doss-btn-primary"
                      onClick={e => { e.stopPropagation(); navigate(`/secretaire/dossiers/${d.idc}`); }}
                    >
                      Détails <ArrowRight size={13} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

      ) : (

        /* ── LIST VIEW ── */
        <div className="doss-table-wrap">
          <table className="doss-table">
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
                const sc = STATUS_CFG[d.status] || { label: d.status, cls: 'doss-b-gray' };
                const pc = PRIO_CFG[(d.priority || '').toLowerCase()] || PRIO_CFG.normale;
                const tm = TYPE_META[d.case_type] || defaultType;
                const { Icon: TypeIcon } = tm;
                return (
                  <tr key={d.idc} className="doss-row" onClick={() => navigate(`/secretaire/dossiers/${d.idc}`)}>
                    <td>
                      <span className="doss-num"><Hash size={10} />{d.case_number || '—'}</span>
                    </td>
                    <td>
                      <div className="doss-list-client">
                        <div className="doss-avatar" style={{ background: tm.bg, color: tm.color }}>
                          {initials(d.client_full_name)}
                        </div>
                        <span className="doss-list-name">{d.client_full_name || '—'}</span>
                      </div>
                    </td>
                    <td>
                      <span className="doss-type-chip" style={{ color: tm.color, background: tm.bg }}>
                        <TypeIcon size={11} /> {d.case_type || '—'}
                      </span>
                    </td>
                    <td><span className={`doss-badge ${sc.cls}`}>{sc.label}</span></td>
                    <td>
                      <span className={`doss-prio ${pc.cls}`}>
                        <span className="doss-prio-dot" style={{ background: pc.dot }} />
                        {pc.label}
                      </span>
                    </td>
                    <td className="doss-date-cell">{fmtDate(d.created_at)}</td>
                    <td>
                      <button
                        className="doss-btn-ghost doss-btn-sm"
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
