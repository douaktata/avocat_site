import { useState } from 'react';
import { createTimesheet, deleteTimesheet } from '../api';

const CATEGORY_LABEL = {
  CONSULTATION:        'Consultation',
  REDACTION:           'Rédaction',
  AUDIENCE:            'Audience tribunal',
  RECHERCHE:           'Recherche juridique',
  PREPARATION_AUDIENCE:'Préparation audience',
  CORRESPONDANCE:      'Correspondance',
  REVISION:            'Révision',
  AUTRE:               'Autre',
};

const CATEGORY_RATE = { AUDIENCE: 200, PREPARATION_AUDIENCE: 200 };
const getRate = cat => CATEGORY_RATE[cat] || 150;

const fmt = n => Number(n || 0).toLocaleString('fr-FR', { minimumFractionDigits: 3 }) + ' TND';
const fmtDate = d => d ? new Date(d).toLocaleDateString('fr-FR') : '—';

function calcDuration(start, end) {
  if (!start || !end) return 0;
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  return Math.max(0, ((eh * 60 + em) - (sh * 60 + sm)) / 60);
}

export default function TimesheetLogger({ caseId, avocatId, timesheets, onRefresh, onClose }) {
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    workDate: new Date().toISOString().split('T')[0],
    startTime: '09:00',
    endTime: '11:00',
    workCategory: 'CONSULTATION',
    description: '',
    isBillable: true,
  });

  const totalHours = timesheets.reduce((s, t) => s + Number(t.durationHours || 0), 0);
  const totalAmount = timesheets
    .filter(t => t.isBillable)
    .reduce((s, t) => s + Number(t.durationHours || 0) * getRate(t.workCategory), 0);

  const preview = calcDuration(form.startTime, form.endTime);

  const handleCreate = e => {
    e.preventDefault();
    if (preview <= 0) return alert('L\'heure de fin doit être après le début');
    setSaving(true);
    createTimesheet({
      caseId: parseInt(caseId),
      avocatId: parseInt(avocatId),
      workDate: form.workDate,
      startTime: form.startTime + ':00',
      endTime: form.endTime + ':00',
      workCategory: form.workCategory,
      description: form.description,
      isBillable: form.isBillable,
    })
      .then(() => { onRefresh(); setShowForm(false); setForm({ workDate: new Date().toISOString().split('T')[0], startTime: '09:00', endTime: '11:00', workCategory: 'CONSULTATION', description: '', isBillable: true }); })
      .catch(err => alert(err.response?.data?.message || 'Erreur'))
      .finally(() => setSaving(false));
  };

  const handleDelete = id => {
    if (!window.confirm('Supprimer cette entrée ?')) return;
    deleteTimesheet(id).then(onRefresh).catch(() => alert('Erreur'));
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100 }}
      onClick={onClose}>
      <div style={{ background: '#fff', borderRadius: 16, padding: '2rem', width: 680, maxWidth: '95vw', maxHeight: '85vh', overflowY: 'auto' }}
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#1a1f2e' }}>
              <i className="fas fa-clock" style={{ marginRight: '0.5rem', color: '#1a56db' }}></i>
              Suivi du temps de travail
            </h2>
            <p style={{ margin: '0.2rem 0 0', fontSize: '0.8rem', color: '#6b7689' }}>
              Total : <strong>{totalHours.toFixed(2)}h</strong> &nbsp;·&nbsp; Facturable : <strong style={{ color: '#10b981' }}>{fmt(totalAmount)}</strong>
            </p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '1.3rem', cursor: 'pointer', color: '#9aa3b4' }}>×</button>
        </div>

        {/* Tableau timesheets */}
        {timesheets.length > 0 && (
          <div style={{ background: '#fff', border: '1px solid #e8ecf0', borderRadius: 10, overflow: 'hidden', marginBottom: '1rem' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.825rem' }}>
              <thead>
                <tr style={{ background: '#f8f9fc' }}>
                  {['Date', 'Catégorie', 'Durée', 'Taux', 'Montant', 'Description', ''].map(h => (
                    <th key={h} style={{ padding: '0.6rem 0.75rem', textAlign: 'left', fontWeight: 600, color: '#4a5568' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {timesheets.map(t => (
                  <tr key={t.id} style={{ borderTop: '1px solid #f1f3f7' }}>
                    <td style={{ padding: '0.6rem 0.75rem' }}>{fmtDate(t.workDate)}</td>
                    <td style={{ padding: '0.6rem 0.75rem' }}>
                      <span style={{ background: '#dbeafe', color: '#1a56db', borderRadius: 12, padding: '0.15rem 0.5rem', fontSize: '0.75rem', fontWeight: 600 }}>
                        {CATEGORY_LABEL[t.workCategory] || t.workCategory}
                      </span>
                    </td>
                    <td style={{ padding: '0.6rem 0.75rem', fontWeight: 600 }}>{Number(t.durationHours || 0).toFixed(2)}h</td>
                    <td style={{ padding: '0.6rem 0.75rem', color: '#6b7689' }}>{getRate(t.workCategory)} TND/h</td>
                    <td style={{ padding: '0.6rem 0.75rem', fontWeight: 600, color: t.isBillable ? '#10b981' : '#9aa3b4' }}>
                      {t.isBillable ? fmt(Number(t.durationHours || 0) * getRate(t.workCategory)) : 'Non fact.'}
                    </td>
                    <td style={{ padding: '0.6rem 0.75rem', color: '#6b7689', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.description || '—'}</td>
                    <td style={{ padding: '0.6rem 0.75rem' }}>
                      <button onClick={() => handleDelete(t.id)}
                        style={{ background: '#fee2e2', color: '#ef4444', border: 'none', borderRadius: 5, padding: '0.2rem 0.5rem', cursor: 'pointer' }}>
                        <i className="fas fa-trash"></i>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Formulaire */}
        {showForm ? (
          <form onSubmit={handleCreate} style={{ background: '#f8f9fc', borderRadius: 10, padding: '1rem', border: '1px solid #e8ecf0' }}>
            <h3 style={{ margin: '0 0 1rem', fontSize: '0.9rem', fontWeight: 700 }}>Enregistrer une prestation</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#6b7689', marginBottom: '0.3rem' }}>Date *</label>
                <input type="date" required value={form.workDate} onChange={e => setForm({ ...form, workDate: e.target.value })}
                  style={{ width: '100%', padding: '0.4rem 0.6rem', border: '1px solid #e8ecf0', borderRadius: 6, fontSize: '0.875rem', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#6b7689', marginBottom: '0.3rem' }}>Heure début</label>
                <input type="time" value={form.startTime} onChange={e => setForm({ ...form, startTime: e.target.value })}
                  style={{ width: '100%', padding: '0.4rem 0.6rem', border: '1px solid #e8ecf0', borderRadius: 6, fontSize: '0.875rem', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#6b7689', marginBottom: '0.3rem' }}>Heure fin</label>
                <input type="time" value={form.endTime} onChange={e => setForm({ ...form, endTime: e.target.value })}
                  style={{ width: '100%', padding: '0.4rem 0.6rem', border: '1px solid #e8ecf0', borderRadius: 6, fontSize: '0.875rem', boxSizing: 'border-box' }} />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#6b7689', marginBottom: '0.3rem' }}>Catégorie</label>
                <select value={form.workCategory} onChange={e => setForm({ ...form, workCategory: e.target.value })}
                  style={{ width: '100%', padding: '0.4rem', border: '1px solid #e8ecf0', borderRadius: 6, fontSize: '0.875rem' }}>
                  {Object.entries(CATEGORY_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', paddingBottom: '0.1rem' }}>
                <div style={{ background: preview > 0 ? '#d1fae5' : '#f1f3f7', borderRadius: 8, padding: '0.5rem 0.75rem', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.7rem', color: '#6b7689' }}>Durée calculée</div>
                  <div style={{ fontWeight: 700, color: preview > 0 ? '#10b981' : '#9aa3b4' }}>{preview.toFixed(2)}h</div>
                  <div style={{ fontSize: '0.7rem', color: '#6b7689' }}>{fmt(preview * getRate(form.workCategory))}</div>
                </div>
              </div>
            </div>
            <div style={{ marginBottom: '0.75rem' }}>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#6b7689', marginBottom: '0.3rem' }}>Description</label>
              <input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                placeholder="Ex : Consultation initiale avec Mehdi - évaluation divorce"
                style={{ width: '100%', padding: '0.4rem 0.6rem', border: '1px solid #e8ecf0', borderRadius: 6, fontSize: '0.875rem', boxSizing: 'border-box' }} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
              <input type="checkbox" id="billable" checked={form.isBillable} onChange={e => setForm({ ...form, isBillable: e.target.checked })} />
              <label htmlFor="billable" style={{ fontSize: '0.875rem', color: '#4a5568', cursor: 'pointer' }}>Facturable au client</label>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
              <button type="button" onClick={() => setShowForm(false)}
                style={{ padding: '0.5rem 1rem', border: '1px solid #e8ecf0', borderRadius: 8, cursor: 'pointer', background: '#fff', fontWeight: 600, fontSize: '0.875rem' }}>Annuler</button>
              <button type="submit" disabled={saving}
                style={{ padding: '0.5rem 1.25rem', background: '#1a56db', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: '0.875rem' }}>
                {saving ? 'Enregistrement...' : 'Enregistrer'}
              </button>
            </div>
          </form>
        ) : (
          <button onClick={() => setShowForm(true)}
            style={{ width: '100%', padding: '0.75rem', background: '#1a56db', color: '#fff', border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: 600, fontSize: '0.875rem' }}>
            <i className="fas fa-plus"></i> Enregistrer une prestation
          </button>
        )}
      </div>
    </div>
  );
}
