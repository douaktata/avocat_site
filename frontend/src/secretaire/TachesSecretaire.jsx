import { useState, useEffect, useMemo } from 'react';
import {
  CheckSquare, Plus, Search, X, LayoutGrid, List,
  ArrowUp, ArrowDown, Minus, Clock, Calendar, User,
  Play, RotateCcw, Check, AlertTriangle, Inbox,
} from 'lucide-react';
import { getTasks, createTask, updateTask, getUsersByRole } from '../api';
import { useAuth } from '../AuthContext';
import './TachesSecretaire.css';

const API_BASE = 'http://localhost:8081';

/* ── Config ── */
const PRIORITY = {
  HIGH:   { label: 'Haute',   color: '#dc2626', bg: '#fef2f2', border: '#fecaca', Icon: ArrowUp,   bar: '#dc2626' },
  MEDIUM: { label: 'Moyenne', color: '#d97706', bg: '#fffbeb', border: '#fde68a', Icon: Minus,     bar: '#d97706' },
  LOW:    { label: 'Basse',   color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0', Icon: ArrowDown, bar: '#16a34a' },
};

const COLUMNS = [
  { key: 'PENDING',     label: 'À faire',  color: '#64748b', hBg: '#f8fafc', aBg: '#f1f5f9' },
  { key: 'IN_PROGRESS', label: 'En cours', color: '#2563eb', hBg: '#eff6ff', aBg: '#dbeafe' },
  { key: 'COMPLETED',   label: 'Terminé',  color: '#16a34a', hBg: '#f0fdf4', aBg: '#dcfce7' },
];

const fmtDate = d =>
  d ? new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }) : null;
const isOverdue  = d => d && new Date(d) < Date.now();
const isDueSoon  = d => { if (!d) return false; const diff = new Date(d) - Date.now(); return diff > 0 && diff < 2 * 86400000; };

/* ── Avatar ── */
function Avatar({ photoUrl, name, size = 26 }) {
  const parts = (name || '?').split(' ');
  const ini   = `${parts[0]?.[0] || ''}${parts[1]?.[0] || ''}`.toUpperCase();
  return (
    <div className="tc-avatar" style={{ width: size, height: size, fontSize: size * 0.38 }}>
      {photoUrl
        ? <img src={`${API_BASE}${photoUrl}`} alt={name} />
        : ini
      }
    </div>
  );
}

/* ── Task card ── */
function TaskCard({ task, onStatus, listView }) {
  const p        = PRIORITY[task.priority] || PRIORITY.MEDIUM;
  const PIcon    = p.Icon;
  const col      = COLUMNS.find(c => c.key === task.status);
  const done     = task.status === 'COMPLETED';
  const overdue  = !done && isOverdue(task.deadline);
  const soon     = !done && !overdue && isDueSoon(task.deadline);

  return (
    <div
      className={`tc-card${done ? ' tc-card-done' : ''}${listView ? ' tc-card-list' : ''}`}
      style={{ borderLeft: `3px solid ${p.bar}` }}
    >
      {/* Top row */}
      <div className="tc-card-top">
        <span className="tc-prio" style={{ color: p.color, background: p.bg, borderColor: p.border }}>
          <PIcon size={11} /> {p.label}
        </span>
        {listView && col && (
          <span className="tc-status-pill" style={{ color: col.color, background: col.aBg }}>
            {col.label}
          </span>
        )}
        {overdue && (
          <span className="tc-overdue-pill">
            <AlertTriangle size={11} /> En retard
          </span>
        )}
      </div>

      {/* Title */}
      <h3 className={`tc-card-title${done ? ' tc-done-text' : ''}`}>{task.title}</h3>

      {/* Description */}
      {task.description && (
        <p className={`tc-card-desc${done ? ' tc-done-text' : ''}`}>{task.description}</p>
      )}

      {/* Footer */}
      <div className="tc-card-footer">
        {task.assignedToName ? (
          <div className="tc-assignee">
            <Avatar photoUrl={task.assignedToPhotoUrl} name={task.assignedToName} size={22} />
            <span>{task.assignedToName}</span>
          </div>
        ) : (
          <div className="tc-assignee tc-no-assignee">
            <User size={12} /> Non assigné
          </div>
        )}
        {task.deadline && (
          <div className={`tc-deadline${overdue ? ' tc-deadline-overdue' : soon ? ' tc-deadline-soon' : ''}`}>
            {overdue || soon ? <AlertTriangle size={11} /> : <Calendar size={11} />}
            {fmtDate(task.deadline)}
          </div>
        )}
      </div>

      {task.createdByName && (
        <div className="tc-created-by">Par {task.createdByName}</div>
      )}

      {/* Actions */}
      {!done ? (
        <div className="tc-card-actions">
          {task.status === 'PENDING' && (
            <button className="tc-btn tc-btn-start" onClick={() => onStatus(task.id, 'IN_PROGRESS')}>
              <Play size={12} /> Commencer
            </button>
          )}
          {task.status === 'IN_PROGRESS' && (
            <button className="tc-btn tc-btn-back" onClick={() => onStatus(task.id, 'PENDING')}>
              <RotateCcw size={12} />
            </button>
          )}
          <button className="tc-btn tc-btn-done" onClick={() => onStatus(task.id, 'COMPLETED')}>
            <Check size={12} /> Terminer
          </button>
        </div>
      ) : (
        <div className="tc-done-banner">
          <Check size={12} /> Tâche terminée
        </div>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════════
   COMPONENT
   ════════════════════════════════════════════════════ */
export default function TachesSecretaire() {
  const { user } = useAuth();
  const [tasks,      setTasks]      = useState([]);
  const [users,      setUsers]      = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [view,       setView]       = useState('kanban');
  const [search,     setSearch]     = useState('');
  const [filterPrio, setFilterPrio] = useState('');
  const [showModal,  setShowModal]  = useState(false);
  const [saving,     setSaving]     = useState(false);
  const [form, setForm] = useState({
    title: '', description: '', priority: 'MEDIUM', deadline: '', assignedToId: '',
  });

  useEffect(() => {
    Promise.all([
      getTasks().catch(() => ({ data: [] })),
      getUsersByRole('AVOCAT').catch(() => ({ data: [] })),
      getUsersByRole('SECRETAIRE').catch(() => ({ data: [] })),
      getUsersByRole('STAGIAIRE').catch(() => ({ data: [] })),
    ]).then(([tasksRes, av, sec, stag]) => {
      setTasks(tasksRes.data || []);
      setUsers([
        ...(av.data   || []).map(u => ({ ...u, roleLabel: 'Avocat' })),
        ...(sec.data  || []).map(u => ({ ...u, roleLabel: 'Secrétaire' })),
        ...(stag.data || []).map(u => ({ ...u, roleLabel: 'Stagiaire' })),
      ]);
    }).finally(() => setLoading(false));
  }, []);

  const handleStatus = (taskId, newStatus) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    updateTask(taskId, { ...task, status: newStatus })
      .then(res => setTasks(prev => prev.map(t => t.id === taskId ? res.data : t)))
      .catch(console.error);
  };

  const handleCreate = async () => {
    if (!form.title.trim()) return;
    setSaving(true);
    try {
      const res = await createTask({
        title:       form.title.trim(),
        description: form.description.trim() || null,
        priority:    form.priority,
        status:      'PENDING',
        deadline:    form.deadline ? new Date(form.deadline).toISOString() : null,
        assignedTo:  form.assignedToId ? { idu: Number(form.assignedToId) } : null,
        createdBy:   user?.idu ? { idu: user.idu } : null,
      });
      setTasks(prev => [res.data, ...prev]);
      setShowModal(false);
      setForm({ title: '', description: '', priority: 'MEDIUM', deadline: '', assignedToId: '' });
    } catch (e) {
      alert(e.response?.data?.message || 'Erreur lors de la création');
    } finally {
      setSaving(false);
    }
  };

  const filtered = useMemo(() => tasks.filter(t => {
    const matchSearch = (t.title || '').toLowerCase().includes(search.toLowerCase()) ||
                        (t.description || '').toLowerCase().includes(search.toLowerCase());
    const matchPrio   = !filterPrio || t.priority === filterPrio;
    return matchSearch && matchPrio;
  }), [tasks, search, filterPrio]);

  const stats = useMemo(() => ({
    total:      tasks.length,
    pending:    tasks.filter(t => t.status === 'PENDING').length,
    inProgress: tasks.filter(t => t.status === 'IN_PROGRESS').length,
    completed:  tasks.filter(t => t.status === 'COMPLETED').length,
    urgent:     tasks.filter(t => t.priority === 'HIGH' && t.status !== 'COMPLETED').length,
    overdue:    tasks.filter(t => t.status !== 'COMPLETED' && isOverdue(t.deadline)).length,
  }), [tasks]);

  /* ── render ── */
  return (
    <div className="tc">

      {/* Header */}
      <div className="tc-header">
        <div>
          <h1 className="tc-title">Tâches</h1>
          <p className="tc-sub">Suivez et gérez les tâches du cabinet</p>
        </div>
        <button className="tc-btn-new" onClick={() => setShowModal(true)}>
          <Plus size={15} /> Nouvelle tâche
        </button>
      </div>

      {/* KPIs */}
      <div className="tc-kpis">
        <div className="tc-kpi tc-kpi-blue">
          <div className="tc-kpi-ic"><CheckSquare size={18} /></div>
          <div><div className="tc-kpi-n">{stats.total}</div><div className="tc-kpi-l">Total</div></div>
        </div>
        <div className="tc-kpi tc-kpi-gray">
          <div className="tc-kpi-ic"><Clock size={18} /></div>
          <div><div className="tc-kpi-n">{stats.pending}</div><div className="tc-kpi-l">À faire</div></div>
        </div>
        <div className="tc-kpi tc-kpi-indigo">
          <div className="tc-kpi-ic"><Play size={18} /></div>
          <div><div className="tc-kpi-n">{stats.inProgress}</div><div className="tc-kpi-l">En cours</div></div>
        </div>
        <div className="tc-kpi tc-kpi-green">
          <div className="tc-kpi-ic"><Check size={18} /></div>
          <div><div className="tc-kpi-n">{stats.completed}</div><div className="tc-kpi-l">Terminées</div></div>
        </div>
        <div className="tc-kpi tc-kpi-red">
          <div className="tc-kpi-ic"><ArrowUp size={18} /></div>
          <div><div className="tc-kpi-n">{stats.urgent}</div><div className="tc-kpi-l">Urgentes</div></div>
        </div>
        {stats.overdue > 0 && (
          <div className="tc-kpi tc-kpi-orange">
            <div className="tc-kpi-ic"><AlertTriangle size={18} /></div>
            <div><div className="tc-kpi-n">{stats.overdue}</div><div className="tc-kpi-l">En retard</div></div>
          </div>
        )}
      </div>

      {/* Toolbar */}
      <div className="tc-toolbar">
        <div className="tc-search">
          <Search size={15} className="tc-search-ic" />
          <input
            type="text"
            placeholder="Rechercher une tâche…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && <button className="tc-clear" onClick={() => setSearch('')}><X size={14} /></button>}
        </div>

        <select className="tc-sel" value={filterPrio} onChange={e => setFilterPrio(e.target.value)}>
          <option value="">Toutes les priorités</option>
          <option value="HIGH">Haute</option>
          <option value="MEDIUM">Moyenne</option>
          <option value="LOW">Basse</option>
        </select>

        <div className="tc-view-group">
          <button className={`tc-vbtn${view === 'kanban' ? ' active' : ''}`} onClick={() => setView('kanban')} title="Vue Kanban">
            <LayoutGrid size={15} />
          </button>
          <button className={`tc-vbtn${view === 'list' ? ' active' : ''}`} onClick={() => setView('list')} title="Vue liste">
            <List size={15} />
          </button>
        </div>

        <span className="tc-count">{filtered.length} tâche{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Loading */}
      {loading && <div className="tc-loading">Chargement…</div>}

      {/* Kanban */}
      {!loading && view === 'kanban' && (
        <div className="tc-kanban">
          {COLUMNS.map(col => {
            const colTasks = filtered.filter(t => t.status === col.key);
            return (
              <div key={col.key} className="tc-col">
                <div className="tc-col-head" style={{ background: col.hBg }}>
                  <span className="tc-col-label" style={{ color: col.color }}>{col.label}</span>
                  <span className="tc-col-badge" style={{ background: col.aBg, color: col.color }}>
                    {colTasks.length}
                  </span>
                </div>
                <div className="tc-col-body">
                  {colTasks.length === 0 ? (
                    <div className="tc-col-empty">
                      <Inbox size={22} className="tc-col-empty-ic" />
                      <p>Aucune tâche</p>
                    </div>
                  ) : (
                    colTasks.map(task => (
                      <TaskCard key={task.id} task={task} onStatus={handleStatus} listView={false} />
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* List */}
      {!loading && view === 'list' && (
        <div className="tc-list">
          {filtered.length === 0 ? (
            <div className="tc-empty">
              <Inbox size={36} className="tc-empty-ic" />
              <h3>Aucune tâche trouvée</h3>
              <p>Modifiez vos filtres ou créez une nouvelle tâche</p>
            </div>
          ) : (
            filtered.map(task => (
              <TaskCard key={task.id} task={task} onStatus={handleStatus} listView={true} />
            ))
          )}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <>
          <div className="tc-scrim" onClick={() => setShowModal(false)} />
          <div className="tc-modal">
            <div className="tc-modal-head">
              <div>
                <h2>Nouvelle tâche</h2>
                <p>Créez et assignez une tâche au cabinet</p>
              </div>
              <button className="tc-modal-close" onClick={() => setShowModal(false)}><X size={16} /></button>
            </div>
            <div className="tc-modal-body">
              <div className="tc-field">
                <label>Titre <span className="tc-req">*</span></label>
                <input
                  type="text"
                  placeholder="Intitulé de la tâche…"
                  value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  autoFocus
                />
              </div>
              <div className="tc-field">
                <label>Description</label>
                <textarea
                  placeholder="Détails de la tâche (optionnel)…"
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  rows={3}
                />
              </div>
              <div className="tc-row2">
                <div className="tc-field">
                  <label>Priorité</label>
                  <select value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}>
                    <option value="HIGH">Haute</option>
                    <option value="MEDIUM">Moyenne</option>
                    <option value="LOW">Basse</option>
                  </select>
                </div>
                <div className="tc-field">
                  <label>Échéance</label>
                  <input
                    type="date"
                    value={form.deadline}
                    onChange={e => setForm(f => ({ ...f, deadline: e.target.value }))}
                  />
                </div>
              </div>
              <div className="tc-field">
                <label>Assigner à</label>
                <select value={form.assignedToId} onChange={e => setForm(f => ({ ...f, assignedToId: e.target.value }))}>
                  <option value="">— Non assigné —</option>
                  {users.map(u => (
                    <option key={u.idu} value={u.idu}>
                      {u.prenom} {u.nom} ({u.roleLabel})
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="tc-modal-ft">
              <button className="tc-btn-cancel" onClick={() => setShowModal(false)}>Annuler</button>
              <button
                className="tc-btn-save"
                onClick={handleCreate}
                disabled={saving || !form.title.trim()}
              >
                {saving ? 'Création…' : <><Check size={14} /> Créer la tâche</>}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
