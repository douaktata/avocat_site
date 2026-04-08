import React, { useState, useEffect } from 'react';
import { getTribunals, createTribunal, updateTribunal, deleteTribunal } from '../api';

const EMPTY_FORM = { name: '', ville: '', adresse: '', telephone: '', email: '' };

const Tribunaux = () => {
  const [tribunals, setTribunals] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState('');
  const [modal, setModal]         = useState(null); // null | 'add' | 'edit' | 'delete'
  const [selected, setSelected]   = useState(null);
  const [form, setForm]           = useState(EMPTY_FORM);
  const [saving, setSaving]       = useState(false);

  const load = () =>
    getTribunals()
      .then(r => setTribunals(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));

  useEffect(() => { load(); }, []);

  const filtered = tribunals.filter(t =>
    `${t.name} ${t.ville || ''} ${t.adresse || ''}`.toLowerCase().includes(search.toLowerCase())
  );

  const openAdd = () => { setForm(EMPTY_FORM); setSelected(null); setModal('add'); };
  const openEdit = t => { setForm({ name: t.name || '', ville: t.ville || '', adresse: t.adresse || '', telephone: t.telephone || '', email: t.email || '' }); setSelected(t); setModal('edit'); };
  const openDelete = t => { setSelected(t); setModal('delete'); };
  const closeModal = () => { setModal(null); setSelected(null); };

  const handleSave = e => {
    e.preventDefault();
    setSaving(true);
    const action = modal === 'add'
      ? createTribunal(form)
      : updateTribunal(selected.id, form);
    action
      .then(() => { load(); closeModal(); })
      .catch(() => alert('Erreur lors de la sauvegarde'))
      .finally(() => setSaving(false));
  };

  const handleDelete = () => {
    setSaving(true);
    deleteTribunal(selected.id)
      .then(() => { load(); closeModal(); })
      .catch(() => alert('Erreur lors de la suppression'))
      .finally(() => setSaving(false));
  };

  return (
    <div style={{ padding: '2rem', maxWidth: 900, margin: '0 auto' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 700, color: '#1e293b' }}>
            <i className="fas fa-landmark" style={{ marginRight: '0.6rem', color: '#1a56db' }}></i>
            Tribunaux
          </h1>
          <p style={{ margin: '0.25rem 0 0', color: '#64748b', fontSize: '0.9rem' }}>
            {tribunals.length} tribunal{tribunals.length !== 1 ? 'x' : ''} enregistré{tribunals.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button onClick={openAdd}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.55rem 1.2rem', background: '#1a56db', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem' }}>
          <i className="fas fa-plus"></i> Ajouter
        </button>
      </div>

      {/* Search */}
      <div style={{ position: 'relative', marginBottom: '1.25rem' }}>
        <i className="fas fa-search" style={{ position: 'absolute', left: '0.8rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontSize: '0.85rem' }}></i>
        <input
          placeholder="Rechercher par nom, ville..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ width: '100%', padding: '0.55rem 0.75rem 0.55rem 2.2rem', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: '0.9rem', boxSizing: 'border-box', background: '#fff' }}
        />
      </div>

      {/* Table */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>Chargement...</div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
          <i className="fas fa-landmark" style={{ fontSize: '2.5rem', marginBottom: '0.75rem', display: 'block', opacity: 0.3 }}></i>
          Aucun tribunal trouvé
        </div>
      ) : (
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                {['Nom', 'Ville', 'Adresse', 'Téléphone', 'Email', 'Statut', ''].map(h => (
                  <th key={h} style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.78rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((t, i) => (
                <tr key={t.id} style={{ borderBottom: i < filtered.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                  <td style={{ padding: '0.9rem 1rem', fontWeight: 600, color: '#1e293b', fontSize: '0.9rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      <span style={{ width: 32, height: 32, borderRadius: 8, background: '#dbeafe', color: '#1a56db', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem', flexShrink: 0 }}>
                        <i className="fas fa-landmark"></i>
                      </span>
                      {t.name}
                    </div>
                  </td>
                  <td style={{ padding: '0.9rem 1rem', color: '#475569', fontSize: '0.875rem' }}>{t.ville || '—'}</td>
                  <td style={{ padding: '0.9rem 1rem', color: '#475569', fontSize: '0.875rem' }}>{t.adresse || '—'}</td>
                  <td style={{ padding: '0.9rem 1rem', color: '#475569', fontSize: '0.875rem' }}>{t.telephone || '—'}</td>
                  <td style={{ padding: '0.9rem 1rem', color: '#475569', fontSize: '0.875rem' }}>{t.email || '—'}</td>
                  <td style={{ padding: '0.9rem 1rem' }}>
                    <span style={{ padding: '0.2rem 0.65rem', borderRadius: 20, fontSize: '0.75rem', fontWeight: 600, background: t.isActive ? '#d1fae5' : '#fee2e2', color: t.isActive ? '#065f46' : '#991b1b' }}>
                      {t.isActive ? 'Actif' : 'Inactif'}
                    </span>
                  </td>
                  <td style={{ padding: '0.9rem 1rem' }}>
                    <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-end' }}>
                      <button onClick={() => openEdit(t)}
                        title="Modifier"
                        style={{ background: '#eff6ff', color: '#1a56db', border: 'none', borderRadius: 6, padding: '0.35rem 0.6rem', cursor: 'pointer', fontSize: '0.8rem' }}>
                        <i className="fas fa-pen"></i>
                      </button>
                      <button onClick={() => openDelete(t)}
                        title="Supprimer"
                        style={{ background: '#fee2e2', color: '#ef4444', border: 'none', borderRadius: 6, padding: '0.35rem 0.6rem', cursor: 'pointer', fontSize: '0.8rem' }}>
                        <i className="fas fa-trash"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add / Edit Modal */}
      {(modal === 'add' || modal === 'edit') && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
          onClick={e => e.target === e.currentTarget && closeModal()}>
          <div style={{ background: '#fff', borderRadius: 14, padding: '2rem', width: '100%', maxWidth: 480, boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: '#1e293b' }}>
                {modal === 'add' ? 'Ajouter un tribunal' : 'Modifier le tribunal'}
              </h2>
              <button onClick={closeModal} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: '1.1rem' }}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <form onSubmit={handleSave}>
              {[
                { key: 'name',      label: 'Nom *',       placeholder: 'Ex : Tribunal de Première Instance', required: true },
                { key: 'ville',     label: 'Ville',        placeholder: 'Ex : Tunis' },
                { key: 'adresse',   label: 'Adresse',      placeholder: 'Ex : Avenue Habib Bourguiba' },
                { key: 'telephone', label: 'Téléphone',    placeholder: 'Ex : +216 71 000 000' },
                { key: 'email',     label: 'Email',        placeholder: 'Ex : contact@tribunal.tn', type: 'email' },
              ].map(f => (
                <div key={f.key} style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: '0.3rem' }}>{f.label}</label>
                  <input
                    type={f.type || 'text'}
                    required={f.required}
                    placeholder={f.placeholder}
                    value={form[f.key]}
                    onChange={e => setForm({ ...form, [f.key]: e.target.value })}
                    style={{ width: '100%', padding: '0.5rem 0.75rem', border: '1px solid #e2e8f0', borderRadius: 7, fontSize: '0.875rem', boxSizing: 'border-box' }}
                  />
                </div>
              ))}
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                <button type="button" onClick={closeModal}
                  style={{ padding: '0.5rem 1.2rem', background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: 7, cursor: 'pointer', fontWeight: 600 }}>
                  Annuler
                </button>
                <button type="submit" disabled={saving}
                  style={{ padding: '0.5rem 1.4rem', background: '#1a56db', color: '#fff', border: 'none', borderRadius: 7, cursor: 'pointer', fontWeight: 600 }}>
                  {saving ? '...' : modal === 'add' ? 'Ajouter' : 'Enregistrer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {modal === 'delete' && selected && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
          onClick={e => e.target === e.currentTarget && closeModal()}>
          <div style={{ background: '#fff', borderRadius: 14, padding: '2rem', width: '100%', maxWidth: 420, boxShadow: '0 20px 60px rgba(0,0,0,0.2)', textAlign: 'center' }}>
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#fee2e2', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem', margin: '0 auto 1rem' }}>
              <i className="fas fa-trash"></i>
            </div>
            <h2 style={{ margin: '0 0 0.5rem', fontSize: '1.1rem', fontWeight: 700, color: '#1e293b' }}>Supprimer ce tribunal ?</h2>
            <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
              <strong>{selected.name}</strong> sera désactivé et n'apparaîtra plus dans les sélecteurs.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
              <button onClick={closeModal}
                style={{ padding: '0.5rem 1.4rem', background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: 7, cursor: 'pointer', fontWeight: 600 }}>
                Annuler
              </button>
              <button onClick={handleDelete} disabled={saving}
                style={{ padding: '0.5rem 1.4rem', background: '#ef4444', color: '#fff', border: 'none', borderRadius: 7, cursor: 'pointer', fontWeight: 600 }}>
                {saving ? '...' : 'Supprimer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Tribunaux;
