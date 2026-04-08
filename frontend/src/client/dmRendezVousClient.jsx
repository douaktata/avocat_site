import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { createAppointment, getSlots, getCasesByClient } from '../api';


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

const DmRendezVousClient = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [step, setStep] = useState(2);
  const [form, setForm] = useState({ type: 'suivi', motif: '', date: '', heure: '', mode: '', message: '' });
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [slots, setSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(true);
  const [slotsError, setSlotsError] = useState(false);

  useEffect(() => {
    getSlots()
      .then(res => setSlots(res.data.filter(s => s.actif)))
      .catch(() => setSlotsError(true))
      .finally(() => setLoadingSlots(false));
    if (user?.idu) {
      getCasesByClient(user.idu)
        .then(res => {
          const hasCases = res.data && res.data.length > 0;
          setForm(prev => ({ ...prev, type: hasCases ? 'suivi' : 'premiere' }));
        })
        .catch(() => {});
    }
  }, [user?.idu]);

  const typesConsultation = [
    { id: 'premiere', icon: '🤝', label: 'Première consultation', desc: 'Première rencontre avec votre avocate' },
    { id: 'suivi', icon: '📋', label: 'Suivi de dossier', desc: 'Faire le point sur votre affaire en cours' },
    { id: 'urgence', icon: '⚡', label: 'Urgence juridique', desc: 'Situation nécessitant une réponse rapide' },
    { id: 'signature', icon: '✍️', label: 'Signature de documents', desc: "Finalisation et signature d'actes" },
  ];

  const motifs = ['Droit de la famille', 'Droit pénal', 'Droit du travail', 'Droit immobilier', 'Droit des affaires', 'Droit civil', 'Autre'];

  const modes = [
    { id: 'presentiel', icon: '🏛️', label: 'En cabinet', desc: 'Rendez-vous en personne au cabinet' },
    { id: 'visio', icon: '💻', label: 'Visioconférence', desc: 'Réunion en ligne sécurisée' },
    { id: 'telephone', icon: '📞', label: 'Téléphone', desc: 'Consultation par appel téléphonique' },
  ];

  // Group active slots by their specific date
  const daysWithSlots = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const byDate = {};
    slots.filter(s => s.date && s.date >= today).forEach(s => {
      if (!byDate[s.date]) {
        const d = new Date(s.date + 'T12:00:00');
        byDate[s.date] = {
          full: s.date,
          label: d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }),
          times: new Set(),
        };
      }
      generateTimeSlots(s.heureDebut, s.heureFin, s.dureeConsultation).forEach(t => byDate[s.date].times.add(t));
    });
    return Object.values(byDate)
      .map(d => ({ ...d, times: Array.from(d.times).sort() }))
      .sort((a, b) => a.full.localeCompare(b.full));
  }, [slots]);

  const canProceed = () => {
    if (step === 2) return form.motif !== '' && form.mode !== '';
    if (step === 3) return form.date !== '' && form.heure !== '';
    return true;
  };

  if (submitted) {
    return (
      <div style={s.page}>
        <div style={s.successCard}>
          <div style={s.successIcon}>✅</div>
          <h2 style={s.successTitle}>Demande envoyée !</h2>
          <p style={s.successText}>Votre demande a été transmise à Maître Hajaij.<br />Vous recevrez une confirmation dans les plus brefs délais.</p>
          <div style={s.successSummary}>
            {[
              { label: 'Type', value: typesConsultation.find(t => t.id === form.type)?.label || '-' },
              { label: 'Motif', value: form.motif || '-' },
              { label: 'Date', value: form.date ? `${new Date(form.date + 'T12:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })} — ${form.heure}` : '-' },
              { label: 'Mode', value: modes.find(m => m.id === form.mode)?.label || '-' },
            ].map((r, i) => (
              <div key={i} style={s.summaryRow}>
                <span style={s.summaryLabel}>{r.label}</span>
                <span style={s.summaryValue}>{r.value}</span>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <button style={s.btnSecondary} onClick={() => navigate('/client/rendez-vous')}>← Retour</button>
            <button style={s.btnPrimary} onClick={() => { setSubmitted(false); setStep(2); setForm(prev => ({ type: prev.type, motif:'', date:'', heure:'', mode:'', message:'' })); }}>Nouvelle demande</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={s.page}>
      {/* Header */}
      <div style={s.header}>
        <button style={s.backBtn} onClick={() => navigate('/client/rendez-vous')}>
          ← Retour
        </button>
        <div>
          <h1 style={s.title}>Demande de rendez-vous</h1>
          <p style={s.subtitle}>Planifiez une consultation avec Maître Hajaij</p>
        </div>
      </div>

      {/* Stepper — 3 étapes (Type auto-détecté, pas affiché) */}
      <div style={s.stepper}>
        {[{ n:2, label:'Détails' }, { n:3, label:'Créneau' }, { n:4, label:'Confirmation' }].map(({ n, label }, idx) => (
          <React.Fragment key={n}>
            <div style={s.stepItem}>
              <div style={{ ...s.stepCircle, ...(step === n ? s.stepActive : {}), ...(step > n ? s.stepDone : {}) }}>
                {step > n ? '✓' : idx + 1}
              </div>
              <span style={{ ...s.stepLabel, ...(step === n ? s.stepLabelActive : {}) }}>{label}</span>
            </div>
            {idx < 2 && <div style={{ ...s.stepLine, ...(step > n ? s.stepLineDone : {}) }} />}
          </React.Fragment>
        ))}
      </div>

      {/* Card */}
      <div style={s.card}>

        {/* STEP 1 */}
        {step === 1 && (
          <div>
            <h2 style={s.stepTitle}>Quel type de consultation souhaitez-vous ?</h2>
            <div style={s.grid2}>
              {typesConsultation.map(t => (
                <button key={t.id} style={{ ...s.optionCard, ...(form.type === t.id ? s.optionCardActive : {}) }} onClick={() => setForm(prev => ({ ...prev, type: t.id }))}>
                  <span style={s.optionIcon}>{t.icon}</span>
                  <span style={s.optionLabel}>{t.label}</span>
                  <span style={s.optionDesc}>{t.desc}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* STEP 2 */}
        {step === 2 && (
          <div>
            <h2 style={s.stepTitle}>Précisez votre demande</h2>
            <div style={s.fieldGroup}>
              <label style={s.label}>Domaine juridique concerné *</label>
              <div style={s.tagsGrid}>
                {motifs.map(m => (
                  <button key={m} style={{ ...s.tag, ...(form.motif === m ? s.tagActive : {}) }} onClick={() => setForm(prev => ({ ...prev, motif: m }))}>{m}</button>
                ))}
              </div>
            </div>
            <div style={s.fieldGroup}>
              <label style={s.label}>Mode de consultation *</label>
              <div style={s.grid3}>
                {modes.map(m => (
                  <button key={m.id} style={{ ...s.modeCard, ...(form.mode === m.id ? s.modeCardActive : {}) }} onClick={() => setForm(prev => ({ ...prev, mode: m.id }))}>
                    <span style={s.modeIcon}>{m.icon}</span>
                    <span style={s.modeLabel}>{m.label}</span>
                    <span style={s.modeDesc}>{m.desc}</span>
                  </button>
                ))}
              </div>
            </div>
            <div style={s.fieldGroup}>
              <label style={s.label}>Message complémentaire (optionnel)</label>
              <textarea style={s.textarea} placeholder="Décrivez brièvement votre situation..." value={form.message} onChange={e => { const v = e.target.value; setForm(prev => ({ ...prev, message: v })); }} rows={4} />
            </div>
          </div>
        )}

        {/* STEP 3 */}
        {step === 3 && (
          <div>
            <h2 style={s.stepTitle}>Choisissez un créneau</h2>
            {loadingSlots ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                <i className="fas fa-spinner fa-spin" style={{ marginRight: '0.5rem' }}></i>Chargement des créneaux...
              </div>
            ) : slotsError ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: '#ef4444', background: '#fef2f2', borderRadius: '10px', border: '1px dashed #fecaca' }}>
                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>⚠️</div>
                <p style={{ margin: 0 }}>Impossible de charger les créneaux.<br />Veuillez rafraîchir la page ou contacter le cabinet.</p>
              </div>
            ) : daysWithSlots.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b', background: '#f8fafc', borderRadius: '10px', border: '1px dashed #e2e8f0' }}>
                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📅</div>
                <p style={{ margin: 0 }}>Aucun créneau disponible pour le moment.<br />Veuillez contacter le cabinet directement.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {daysWithSlots.map(day => (
                  <div key={day.jour} style={{ border: '1.5px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden' }}>
                    <div style={{ background: '#f1f5f9', padding: '0.65rem 1rem', fontWeight: 700, fontSize: '0.9rem', color: '#1e293b', textTransform: 'capitalize' }}>
                      📅 {day.label}
                    </div>
                    <div style={{ padding: '0.75rem 1rem', display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                      {day.times.map(t => {
                        const active = form.date === day.full && form.heure === t;
                        return (
                          <button key={t} style={{ ...s.heureBtn, ...(active ? s.heureBtnActive : {}) }}
                            onClick={() => setForm(prev => ({ ...prev, date: day.full, heure: t }))}>
                            {t}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* STEP 4 */}
        {step === 4 && (
          <div>
            <h2 style={s.stepTitle}>Récapitulatif de votre demande</h2>
            <div style={s.recapCard}>
              {[
                { icon: '🤝', label: 'Type de consultation', value: typesConsultation.find(t => t.id === form.type)?.label || '-' },
                { icon: '⚖️', label: 'Domaine juridique', value: form.motif || '-' },
                { icon: modes.find(m => m.id === form.mode)?.icon || '📋', label: 'Mode', value: modes.find(m => m.id === form.mode)?.label || '-' },
                { icon: '📅', label: 'Date souhaitée', value: form.date ? new Date(form.date + 'T12:00:00').toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : '-' },
                { icon: '🕐', label: 'Heure souhaitée', value: form.heure || '-' },
                ...(form.message ? [{ icon: '💬', label: 'Message', value: form.message }] : []),
              ].map((r, i) => (
                <div key={i} style={s.recapRow}>
                  <span style={s.recapIcon}>{r.icon}</span>
                  <div>
                    <div style={s.recapLabel}>{r.label}</div>
                    <div style={s.recapValue}>{r.value}</div>
                  </div>
                </div>
              ))}
            </div>
            <div style={s.notice}>
              <span style={s.noticeIcon}>ℹ️</span>
              <span>Votre demande sera examinée par Maître Hajaij. La confirmation vous sera envoyée par messagerie.</span>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div style={s.navBtns}>
          {step > 2 && <button style={s.btnSecondary} onClick={() => setStep(step - 1)}>← Retour</button>}
          <div style={{ flex: 1 }} />
          {step < 4
            ? <button style={{ ...s.btnPrimary, ...(canProceed() ? {} : s.btnDisabled) }} onClick={() => canProceed() && setStep(step + 1)} disabled={!canProceed()}>Continuer →</button>
            : <button
                style={{ ...s.btnPrimary, ...(submitting ? s.btnDisabled : {}) }}
                disabled={submitting}
                onClick={() => {
                  setSubmitting(true);
                  const typeLabel = typesConsultation.find(t => t.id === form.type)?.label || form.type;
                  const reason = `${typeLabel} — ${form.motif}${form.message ? ' : ' + form.message : ''}`;
                  createAppointment({
                    appointment_date: `${form.date}T${form.heure.split('-')[0]}:00`,
                    reason,
                    status: 'PENDING',
                    user: { idu: user?.idu },
                  })
                    .then(() => setSubmitted(true))
                    .catch(() => alert('Erreur lors de l\'envoi de la demande. Veuillez réessayer.'))
                    .finally(() => setSubmitting(false));
                }}
              >
                {submitting ? 'Envoi...' : 'Envoyer la demande ✓'}
              </button>
          }
        </div>
      </div>
    </div>
  );
};

const s = {
  page: { padding: '0', maxWidth: '860px', margin: '0 auto', fontFamily: "'Segoe UI', system-ui, sans-serif" },
  header: { marginBottom: '1.75rem', display: 'flex', alignItems: 'flex-start', gap: '1rem' },
  backBtn: { marginTop: '0.4rem', padding: '0.5rem 1rem', background: '#f1f5f9', border: 'none', borderRadius: '8px', cursor: 'pointer', color: '#475569', fontWeight: 600, fontSize: '0.875rem', fontFamily: 'inherit', whiteSpace: 'nowrap' },
  title: { fontSize: '1.6rem', fontWeight: 700, color: '#1e3a8a', margin: 0 },
  subtitle: { color: '#64748b', marginTop: '0.3rem', fontSize: '0.95rem' },
  stepper: { display: 'flex', alignItems: 'center', marginBottom: '2rem', background: '#fff', borderRadius: '12px', padding: '1.25rem 2rem', border: '1px solid #e2e8f0' },
  stepItem: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem' },
  stepCircle: { width: '36px', height: '36px', borderRadius: '50%', background: '#e2e8f0', color: '#94a3b8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.9rem' },
  stepActive: { background: '#1e3a8a', color: '#fff', boxShadow: '0 0 0 4px rgba(30,58,138,0.15)' },
  stepDone: { background: '#22c55e', color: '#fff' },
  stepLabel: { fontSize: '0.75rem', color: '#94a3b8', fontWeight: 500 },
  stepLabelActive: { color: '#1e3a8a', fontWeight: 700 },
  stepLine: { flex: 1, height: '2px', background: '#e2e8f0', margin: '0 0.5rem', marginBottom: '1.2rem' },
  stepLineDone: { background: '#22c55e' },
  card: { background: '#fff', borderRadius: '16px', padding: '2rem', border: '1px solid #e2e8f0', marginBottom: '1.5rem' },
  stepTitle: { fontSize: '1.1rem', fontWeight: 700, color: '#1e293b', marginBottom: '1.5rem', marginTop: 0 },
  grid2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' },
  optionCard: { display: 'flex', flexDirection: 'column', alignItems: 'flex-start', padding: '1.25rem', border: '2px solid #e2e8f0', borderRadius: '12px', background: '#f8fafc', cursor: 'pointer', gap: '0.4rem', fontFamily: 'inherit', textAlign: 'left' },
  optionCardActive: { border: '2px solid #1e3a8a', background: '#eff6ff', boxShadow: '0 0 0 4px rgba(30,58,138,0.08)' },
  optionIcon: { fontSize: '1.75rem' },
  optionLabel: { fontWeight: 700, fontSize: '0.95rem', color: '#1e293b' },
  optionDesc: { fontSize: '0.8rem', color: '#64748b' },
  fieldGroup: { marginBottom: '1.5rem' },
  label: { display: 'block', fontWeight: 600, fontSize: '0.875rem', color: '#374151', marginBottom: '0.65rem' },
  tagsGrid: { display: 'flex', flexWrap: 'wrap', gap: '0.5rem' },
  tag: { padding: '0.5rem 1rem', border: '1.5px solid #e2e8f0', borderRadius: '20px', background: '#f8fafc', color: '#475569', fontSize: '0.85rem', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 500 },
  tagActive: { border: '1.5px solid #1e3a8a', background: '#eff6ff', color: '#1e3a8a', fontWeight: 700 },
  grid3: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' },
  modeCard: { display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '1rem', border: '2px solid #e2e8f0', borderRadius: '12px', background: '#f8fafc', cursor: 'pointer', gap: '0.35rem', fontFamily: 'inherit' },
  modeCardActive: { border: '2px solid #1e3a8a', background: '#eff6ff' },
  modeIcon: { fontSize: '1.5rem' },
  modeLabel: { fontWeight: 700, fontSize: '0.85rem', color: '#1e293b' },
  modeDesc: { fontSize: '0.75rem', color: '#64748b', textAlign: 'center' },
  textarea: { width: '100%', border: '1.5px solid #e2e8f0', borderRadius: '10px', padding: '0.75rem 1rem', fontSize: '0.9rem', fontFamily: 'inherit', color: '#374151', resize: 'vertical', outline: 'none', background: '#f8fafc', boxSizing: 'border-box' },
  datesRow: { display: 'flex', gap: '0.5rem', flexWrap: 'wrap' },
  dateBtn: { display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '0.65rem 0.85rem', border: '1.5px solid #e2e8f0', borderRadius: '10px', background: '#f8fafc', cursor: 'pointer', gap: '0.1rem', fontFamily: 'inherit', minWidth: '60px' },
  dateBtnActive: { border: '1.5px solid #1e3a8a', background: '#1e3a8a' },
  dateDayName: { fontSize: '0.7rem', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase' },
  dateDayNum: { fontSize: '1.2rem', fontWeight: 800, color: '#1e293b', lineHeight: 1 },
  dateMonth: { fontSize: '0.7rem', color: '#64748b' },
  heuresGrid: { display: 'flex', flexWrap: 'wrap', gap: '0.5rem' },
  heureBtn: { padding: '0.5rem 0.9rem', border: '1.5px solid #e2e8f0', borderRadius: '8px', background: '#f8fafc', color: '#374151', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' },
  heureBtnActive: { border: '1.5px solid #1e3a8a', background: '#1e3a8a', color: '#fff' },
  recapCard: { border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden', marginBottom: '1.25rem' },
  recapRow: { display: 'flex', alignItems: 'flex-start', gap: '1rem', padding: '0.9rem 1.25rem', borderBottom: '1px solid #f1f5f9' },
  recapIcon: { fontSize: '1.25rem', marginTop: '0.1rem' },
  recapLabel: { fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.2rem' },
  recapValue: { fontSize: '0.95rem', color: '#1e293b', fontWeight: 500 },
  notice: { display: 'flex', alignItems: 'flex-start', gap: '0.75rem', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '10px', padding: '1rem', fontSize: '0.875rem', color: '#1e40af' },
  noticeIcon: { fontSize: '1.1rem', flexShrink: 0 },
  navBtns: { display: 'flex', alignItems: 'center', marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid #f1f5f9' },
  btnPrimary: { padding: '0.75rem 1.75rem', background: '#1e3a8a', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 700, fontSize: '0.95rem', cursor: 'pointer', fontFamily: 'inherit' },
  btnSecondary: { padding: '0.75rem 1.5rem', background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '10px', fontWeight: 600, fontSize: '0.95rem', cursor: 'pointer', fontFamily: 'inherit' },
  btnDisabled: { background: '#cbd5e1', cursor: 'not-allowed' },
  successCard: { background: '#fff', borderRadius: '16px', padding: '3rem 2rem', border: '1px solid #e2e8f0', textAlign: 'center', maxWidth: '520px', margin: '2rem auto' },
  successIcon: { fontSize: '3rem', marginBottom: '1rem' },
  successTitle: { fontSize: '1.5rem', fontWeight: 800, color: '#1e293b', margin: '0 0 0.5rem' },
  successText: { color: '#64748b', marginBottom: '1.5rem', lineHeight: 1.6 },
  successSummary: { background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '1.5rem', overflow: 'hidden' },
  summaryRow: { display: 'flex', justifyContent: 'space-between', padding: '0.75rem 1.25rem', borderBottom: '1px solid #f1f5f9', fontSize: '0.875rem' },
  summaryLabel: { color: '#94a3b8', fontWeight: 600 },
  summaryValue: { color: '#1e293b', fontWeight: 600 },
};

export default DmRendezVousClient;
