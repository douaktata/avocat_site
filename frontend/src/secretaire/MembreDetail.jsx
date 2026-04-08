import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getUser, getLawyerByUser, updateUser, updateLawyer } from '../api';
import './Membredetail.css';

const MembreDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [membre, setMembre] = useState(null);
  const [lawyerId, setLawyerId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showEdit, setShowEdit] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [editSaving, setEditSaving] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const userRes = await getUser(id);
        const u = userRes.data;
        // Try to get lawyer-specific info (optional)
        let specialite = '—';
        let barreau = '—';
        let bar_registration_num = '—';
        try {
          const lawyerRes = await getLawyerByUser(id);
          const l = lawyerRes.data;
          specialite = l.specialite || '—';
          barreau = l.bureau || '—';
          bar_registration_num = l.bar_registration_num || '—';
          setLawyerId(l.idl);
        } catch (_) { /* no lawyer record for this user */ }

        setMembre({
          id: u.idu,
          nom: u.nom || '',
          prenom: u.prenom || '',
          titre: `Maître ${u.prenom || ''} ${u.nom || ''}`.trim(),
          specialite,
          barreau,
          anneeInscription: bar_registration_num,
          email: u.email || '',
          tel: u.tel || '—',
          adresse: u.adresse || '—',
          statut: u.statut || 'Actif',
          affairesEnCours: [],
          audiences: [],
          formations: [],
        });
        setLoading(false);
      } catch (_) {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  if (loading) {
    return (
      <div className="membre-detail-page">
        <p style={{ padding: '2rem' }}>Chargement...</p>
      </div>
    );
  }

  if (!membre) {
    return (
      <div className="membre-detail-page">
        <div className="not-found">
          <i className="fas fa-user-slash"></i>
          <h2>Membre non trouvé</h2>
          <button className="btn-back" onClick={() => navigate('/secretaire/barreau')}>
            <i className="fas fa-arrow-left"></i> Retour
          </button>
        </div>
      </div>
    );
  }

  const getStatusClass = (status) => status === 'Actif' ? 'status-actif' : 'status-inactif';

  const openEdit = () => {
    setEditForm({
      nom: membre.nom, prenom: membre.prenom, email: membre.email,
      tel: membre.tel === '—' ? '' : membre.tel,
      adresse: membre.adresse === '—' ? '' : membre.adresse,
      specialite: membre.specialite === '—' ? '' : membre.specialite,
      barreau: membre.barreau === '—' ? '' : membre.barreau,
      bar_registration_num: membre.anneeInscription === '—' ? '' : membre.anneeInscription,
    });
    setShowEdit(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setEditSaving(true);
    try {
      const userRes = await updateUser(id, { nom: editForm.nom, prenom: editForm.prenom, email: editForm.email, tel: editForm.tel, adresse: editForm.adresse });
      const u = userRes.data;
      if (lawyerId) {
        await updateLawyer(lawyerId, { specialite: editForm.specialite, bureau: editForm.barreau, bar_registration_num: editForm.bar_registration_num });
      }
      setMembre(prev => ({
        ...prev,
        nom: u.nom || prev.nom, prenom: u.prenom || prev.prenom,
        titre: `Maître ${u.prenom || ''} ${u.nom || ''}`.trim(),
        email: u.email || prev.email, tel: u.tel || prev.tel, adresse: u.adresse || prev.adresse,
        specialite: editForm.specialite || prev.specialite,
        barreau: editForm.barreau || prev.barreau,
        anneeInscription: editForm.bar_registration_num || prev.anneeInscription,
      }));
      setShowEdit(false);
    } catch (err) {
      alert(err.response?.data?.message || 'Erreur lors de la modification');
    } finally {
      setEditSaving(false);
    }
  };

  return (
    <div className="membre-detail-page">

      {/* HEADER */}
      <div className="detail-header">
        <button className="btn-back" onClick={() => navigate('/secretaire/barreau')}>
          <i className="fas fa-arrow-left"></i> Retour
        </button>

        <div className="detail-title-section">
          <div className="detail-avatar-large">
            {membre.prenom.charAt(0)}{membre.nom.charAt(0)}
          </div>
          <div>
            <h1 className="detail-title">{membre.titre}</h1>
            <p style={{ fontSize: '1.125rem', margin: '0.5rem 0', color: '#64748b' }}>
              {membre.specialite}
            </p>
            <span className={`detail-status ${getStatusClass(membre.statut)}`}>
              {membre.statut}
            </span>
          </div>
        </div>

        <div className="detail-actions">
          <a href={`mailto:${membre.email}`} className="btn-action btn-email">
            <i className="fas fa-envelope"></i> Envoyer un email
          </a>
          <button className="btn-action btn-edit" onClick={openEdit}>
            <i className="fas fa-edit"></i> Modifier
          </button>
        </div>
      </div>

      {/* INFORMATIONS PROFESSIONNELLES */}
      <div className="detail-section">
        <h2 className="section-title">
          <i className="fas fa-info-circle"></i> Informations professionnelles
        </h2>
        <div className="info-grid">
          <div className="info-card">
            <i className="fas fa-balance-scale"></i>
            <div><label>Spécialité</label><p>{membre.specialite}</p></div>
          </div>
          <div className="info-card">
            <i className="fas fa-landmark"></i>
            <div><label>Barreau</label><p>{membre.barreau}</p></div>
          </div>
          <div className="info-card">
            <i className="fas fa-id-card"></i>
            <div><label>N° Barreau</label><p>{membre.anneeInscription}</p></div>
          </div>
          <div className="info-card">
            <i className="fas fa-phone"></i>
            <div><label>Téléphone</label><p>{membre.tel}</p></div>
          </div>
          <div className="info-card">
            <i className="fas fa-envelope"></i>
            <div><label>Email</label><p>{membre.email}</p></div>
          </div>
          <div className="info-card info-full">
            <i className="fas fa-map-marker-alt"></i>
            <div><label>Adresse</label><p>{membre.adresse}</p></div>
          </div>
        </div>
      </div>

      {/* STATS */}
      <div className="stats-row">
        <div className="stat-card stat-dossiers">
          <div className="stat-icon"><i className="fas fa-folder-open"></i></div>
          <div className="stat-content">
            <span className="stat-number">{membre.affairesEnCours.length}</span>
            <span className="stat-label">Affaires en cours</span>
          </div>
        </div>
        <div className="stat-card stat-rdv">
          <div className="stat-icon"><i className="fas fa-calendar-alt"></i></div>
          <div className="stat-content">
            <span className="stat-number">{membre.audiences.length}</span>
            <span className="stat-label">Audiences</span>
          </div>
        </div>
        <div className="stat-card stat-paiements">
          <div className="stat-icon"><i className="fas fa-graduation-cap"></i></div>
          <div className="stat-content">
            <span className="stat-number">{membre.formations.length}</span>
            <span className="stat-label">Formations</span>
          </div>
        </div>
      </div>

      {/* AFFAIRES */}
      <div className="detail-section">
        <h2 className="section-title"><i className="fas fa-folder-open"></i> Affaires en cours</h2>
        <div className="empty-state">
          <i className="fas fa-folder"></i>
          <p>Aucune affaire en cours</p>
        </div>
      </div>

      {/* AUDIENCES */}
      <div className="detail-section">
        <h2 className="section-title"><i className="fas fa-calendar-alt"></i> Audiences à venir</h2>
        <div className="empty-state">
          <i className="fas fa-calendar"></i>
          <p>Aucune audience programmée</p>
        </div>
      </div>

      {/* ── Modal Modifier ── */}
      {showEdit && (
        <div className="modal-overlay" onClick={() => setShowEdit(false)}>
          <div className="modal-panel" style={{ maxWidth: '560px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-hero" style={{ background: 'linear-gradient(135deg, #1e3a5f, #2d5a9e)' }}>
              <div className="modal-identity">
                <h2><i className="fas fa-edit" style={{ marginRight: '0.5rem' }}></i>Modifier — {membre.titre}</h2>
              </div>
              <button className="modal-close-btn" onClick={() => setShowEdit(false)}><i className="fas fa-times"></i></button>
            </div>
            <form onSubmit={handleEditSubmit}>
              <div className="modal-body-scroll" style={{ padding: '1.5rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                {[['nom','Nom'],['prenom','Prénom'],['email','Email'],['tel','Téléphone'],['adresse','Adresse']].map(([field, label]) => (
                  <div key={field} style={{ display:'flex', flexDirection:'column', gap:'0.3rem', gridColumn: (field==='email'||field==='adresse') ? '1/-1' : undefined }}>
                    <label style={{ fontSize:'0.8rem', fontWeight:600, color:'#64748b' }}>{label}</label>
                    <input className="form-input" type={field==='email'?'email':'text'} value={editForm[field]||''} onChange={e => setEditForm(p=>({...p,[field]:e.target.value}))} />
                  </div>
                ))}
                <div style={{ gridColumn: '1/-1', borderTop: '1px solid #e2e8f0', paddingTop: '1rem', marginTop: '0.5rem' }}>
                  <p style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748b', marginBottom: '0.75rem' }}>Informations avocat</p>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    {[['specialite','Spécialité'],['barreau','Barreau'],['bar_registration_num','N° Barreau']].map(([field, label]) => (
                      <div key={field} style={{ display:'flex', flexDirection:'column', gap:'0.3rem' }}>
                        <label style={{ fontSize:'0.8rem', fontWeight:600, color:'#64748b' }}>{label}</label>
                        <input className="form-input" type="text" value={editForm[field]||''} onChange={e => setEditForm(p=>({...p,[field]:e.target.value}))} />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="mfooter-btn mfooter-close" onClick={() => setShowEdit(false)}>
                  <i className="fas fa-times"></i> Annuler
                </button>
                <button type="submit" className="mfooter-btn mfooter-email" disabled={editSaving}>
                  <i className="fas fa-save"></i> {editSaving ? 'Enregistrement...' : 'Enregistrer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default MembreDetail;
