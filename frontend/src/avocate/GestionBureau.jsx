import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { getPhoneCalls, createPhoneCall, deletePhoneCall, getPresenceJournals, createPresenceJournal, deletePresenceJournal, getUsersByRole } from '../api';
import './GestionBureau.css';

const fmtDT = d => d ? new Date(d).toLocaleString('fr-FR', { day:'2-digit', month:'long', year:'numeric', hour:'2-digit', minute:'2-digit' }) : '—';

const getCurrentUserId = () => {
  try { return JSON.parse(localStorage.getItem('user'))?.idu || null; } catch { return null; }
};

const normalize = s => (s || '').toLowerCase().replace(/\s+/g, ' ').trim();

export default function GestionBureau() {
  const [activeTab, setActiveTab] = useState('appels');
  const [appels,    setAppels]    = useState([]);
  const [presences, setPresences] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('');
  const [saving,    setSaving]    = useState(false);

  const [newAppel, setNewAppel] = useState({
    callerName: '', callerLastname: '', phoneNumber: '', callReason: '', callDate: '',
  });
  const [newPresence, setNewPresence] = useState({
    visitorName: '', visitorLastname: '', visitorCin: '', reason: '', arrivalTime: '',
  });

  const [clients, setClients] = useState([]);
  const [clientSuggestions, setClientSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [selectedPresenceClient, setSelectedPresenceClient] = useState(null);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0, width: 0 });
  const inputRef = useRef(null);
  const presenceInputRef = useRef(null);

  const load = () => {
    setLoading(true);
    Promise.all([
      getPhoneCalls().catch(() => ({ data: [] })),
      getPresenceJournals().catch(() => ({ data: [] })),
    ]).then(([aRes, pRes]) => {
      setAppels(aRes.data || []);
      setPresences(pRes.data || []);
    }).finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    getUsersByRole('CLIENT').then(r => setClients(r.data || [])).catch(() => {});
  }, []);

  const handleCallerSearch = (value) => {
    setNewAppel(prev => ({ ...prev, callerName: value }));
    setSelectedClient(null);
    if (value.trim().length < 2) { setClientSuggestions([]); setShowSuggestions(false); return; }
    const q = value.toLowerCase();
    const matches = clients.filter(c =>
      (c.prenom || '').toLowerCase().includes(q) ||
      (c.nom || '').toLowerCase().includes(q) ||
      (`${c.prenom} ${c.nom}`).toLowerCase().includes(q) ||
      (c.tel || '').includes(q)
    );
    if (matches.length > 0 && inputRef.current) {
      const rect = inputRef.current.getBoundingClientRect();
      setDropdownPos({ top: rect.bottom + window.scrollY + 4, left: rect.left + window.scrollX, width: rect.width });
    }
    setClientSuggestions(matches.slice(0, 6));
    setShowSuggestions(matches.length > 0);
  };

  const selectClient = (client) => {
    setNewAppel(prev => ({
      ...prev,
      callerName:     client.prenom || '',
      callerLastname: client.nom    || '',
      phoneNumber:    client.tel    || '',
    }));
    setSelectedClient(client);
    setClientSuggestions([]);
    setShowSuggestions(false);
  };

  const handleAddAppel = async e => {
    e.preventDefault();
    setSaving(true);
    try {
      const userId = getCurrentUserId();
      await createPhoneCall({
        callerName:     newAppel.callerName,
        callerLastname: newAppel.callerLastname,
        phoneNumber:    newAppel.phoneNumber || null,
        callReason:     newAppel.callReason,
        callDate:       newAppel.callDate || null,
        recordedBy:     userId ? { idu: userId } : null,
      });
      setNewAppel({ callerName: '', callerLastname: '', phoneNumber: '', callReason: '', callDate: '' });
      setSelectedClient(null);
      setShowModal(false);
      load();
    } catch { alert('Erreur lors de l\'enregistrement'); }
    finally { setSaving(false); }
  };

  const handleAddPresence = async e => {
    e.preventDefault();
    setSaving(true);
    try {
      const userId = getCurrentUserId();
      await createPresenceJournal({
        visitorName:     newPresence.visitorName,
        visitorLastname: newPresence.visitorLastname,
        visitorCin:      newPresence.visitorCin || null,
        reason:          newPresence.reason,
        arrivalTime:     newPresence.arrivalTime || null,
        recordedById:    userId,
      });
      setNewPresence({ visitorName: '', visitorLastname: '', visitorCin: '', reason: '', arrivalTime: '' });
      setSelectedPresenceClient(null);
      setShowModal(false);
      load();
    } catch { alert('Erreur lors de l\'enregistrement'); }
    finally { setSaving(false); }
  };

  const handleVisitorSearch = (value) => {
    setNewPresence(prev => ({ ...prev, visitorName: value }));
    setSelectedPresenceClient(null);
    if (value.trim().length < 2) { setClientSuggestions([]); setShowSuggestions(false); return; }
    const q = value.toLowerCase();
    const matches = clients.filter(c =>
      (c.prenom || '').toLowerCase().includes(q) ||
      (c.nom || '').toLowerCase().includes(q) ||
      (`${c.prenom} ${c.nom}`).toLowerCase().includes(q) ||
      (c.tel || '').includes(q) ||
      (c.CIN || c.cin || '').toLowerCase().includes(q)
    );
    if (matches.length > 0 && presenceInputRef.current) {
      const rect = presenceInputRef.current.getBoundingClientRect();
      setDropdownPos({ top: rect.bottom + window.scrollY + 4, left: rect.left + window.scrollX, width: rect.width });
    }
    setClientSuggestions(matches.slice(0, 6));
    setShowSuggestions(matches.length > 0);
  };

  const selectPresenceClient = (client) => {
    setNewPresence(prev => ({
      ...prev,
      visitorName:     client.prenom || '',
      visitorLastname: client.nom    || '',
      visitorCin:      client.CIN || client.cin || '',
    }));
    setSelectedPresenceClient(client);
    setClientSuggestions([]);
    setShowSuggestions(false);
  };

  const findMatchingClient = (appel) => {
    if (!appel || clients.length === 0) return null;
    // 1. Match par téléphone (le plus fiable)
    if (appel.phone_number) {
      const phone = (appel.phone_number || '').replace(/\s/g, '');
      const byPhone = clients.find(c => c.tel && c.tel.replace(/\s/g, '') === phone);
      if (byPhone) return byPhone;
    }
    // 2. Match par nom complet
    const fullName = normalize(appel.caller_full_name);
    return clients.find(c => {
      const n1 = normalize(`${c.prenom} ${c.nom}`);
      const n2 = normalize(`${c.nom} ${c.prenom}`);
      return fullName === n1 || fullName === n2;
    }) || null;
  };

  const findMatchingClientForPresence = (p) => {
    if (!p || clients.length === 0) return null;
    // 1. Match par CIN
    if (p.visitorCin) {
      const byCin = clients.find(c => (c.CIN || c.cin) === p.visitorCin);
      if (byCin) return byCin;
    }
    // 2. Match par nom complet
    const fullName = normalize(`${p.visitorLastname} ${p.visitorName}`);
    return clients.find(c => {
      const n1 = normalize(`${c.nom} ${c.prenom}`);
      const n2 = normalize(`${c.prenom} ${c.nom}`);
      return fullName === n1 || fullName === n2;
    }) || null;
  };

  const handleDeleteAppel = async id => {
    if (!window.confirm('Supprimer cet appel ?')) return;
    await deletePhoneCall(id).catch(() => alert('Erreur'));
    setAppels(prev => prev.filter(a => a.id !== id));
  };

  const handleDeletePresence = async id => {
    if (!window.confirm('Supprimer cette présence ?')) return;
    await deletePresenceJournal(id).catch(() => alert('Erreur'));
    setPresences(prev => prev.filter(p => p.id !== id));
  };

  return (
    <>
      <div className="page-header">
        <h1 className="page-title"><i className="fas fa-building"></i> Gestion du Bureau</h1>
        <p className="page-description">Gérez les journaux administratifs du cabinet</p>
      </div>

      {/* Tabs */}
      <div className="tabs-navigation">
        <button className={`tab-btn ${activeTab === 'appels' ? 'active' : ''}`} onClick={() => setActiveTab('appels')}>
          <i className="fas fa-phone"></i>
          <span>Journal d'Appels</span>
          <span className="tab-badge">{appels.length}</span>
        </button>
        <button className={`tab-btn ${activeTab === 'presence' ? 'active' : ''}`} onClick={() => setActiveTab('presence')}>
          <i className="fas fa-door-open"></i>
          <span>Journal de Présence</span>
          <span className="tab-badge">{presences.length}</span>
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#9aa3b4' }}><i className="fas fa-spinner fa-spin"></i></div>
      ) : (
        <>
          {/* APPELS */}
          {activeTab === 'appels' && (
            <>
              <div className="section-header">
                <h2><i className="fas fa-phone"></i> Journal d'Appels</h2>
                <button className="btn-add" onClick={() => { setModalType('appel'); setShowModal(true); }}>
                  <i className="fas fa-plus"></i> Enregistrer un appel
                </button>
              </div>
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Nom</th>
                      <th>Téléphone</th>
                      <th>Date &amp; Heure</th>
                      <th>Motif</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {appels.length === 0 ? (
                      <tr><td colSpan={5} style={{ textAlign: 'center', padding: '2rem', color: '#9aa3b4' }}>Aucun appel enregistré</td></tr>
                    ) : appels.map(a => {
                      const matchedClient = findMatchingClient(a);
                      return (
                      <tr key={a.id}>
                        <td>
                          <strong>{a.caller_full_name || '—'}</strong>
                          {matchedClient && (
                            <span style={{
                              marginLeft: 8, fontSize: '0.72rem', background: '#dbeafe', color: '#1d4ed8',
                              borderRadius: 10, padding: '2px 8px', fontWeight: 600, whiteSpace: 'nowrap',
                            }}>
                              <i className="fas fa-user-check" style={{ marginRight: 4 }}></i>Client
                            </span>
                          )}
                        </td>
                        <td>{a.phone_number || '—'}</td>
                        <td>{fmtDT(a.call_date)}</td>
                        <td>{a.call_reason || '—'}</td>
                        <td>
                          <button onClick={() => handleDeleteAppel(a.id)}
                            style={{ background: '#fee2e2', color: '#ef4444', border: 'none', borderRadius: 6, padding: '0.25rem 0.5rem', cursor: 'pointer' }}>
                            <i className="fas fa-trash"></i>
                          </button>
                        </td>
                      </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* PRÉSENCE */}
          {activeTab === 'presence' && (
            <>
              <div className="section-header">
                <h2><i className="fas fa-door-open"></i> Journal de Présence</h2>
                <button className="btn-add" onClick={() => { setModalType('presence'); setShowModal(true); }}>
                  <i className="fas fa-plus"></i> Enregistrer une présence
                </button>
              </div>
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Nom</th>
                      <th>CIN</th>
                      <th>Date &amp; Heure</th>
                      <th>Motif</th>
                      <th>Enregistré par</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {presences.length === 0 ? (
                      <tr><td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: '#9aa3b4' }}>Aucune présence enregistrée</td></tr>
                    ) : presences.map(p => {
                      const matchedPresenceClient = findMatchingClientForPresence(p);
                      return (
                      <tr key={p.id}>
                        <td>
                          <strong>{[p.visitorLastname, p.visitorName].filter(Boolean).join(' ') || '—'}</strong>
                          {matchedPresenceClient && (
                            <span style={{
                              marginLeft: 8, fontSize: '0.72rem', background: '#dbeafe', color: '#1d4ed8',
                              borderRadius: 10, padding: '2px 8px', fontWeight: 600, whiteSpace: 'nowrap',
                            }}>
                              <i className="fas fa-user-check" style={{ marginRight: 4 }}></i>Client
                            </span>
                          )}
                        </td>
                        <td>{p.visitorCin || '—'}</td>
                        <td>{fmtDT(p.arrivalTime)}</td>
                        <td>{p.reason || '—'}</td>
                        <td>{p.recordedByName || '—'}</td>
                        <td>
                          <button onClick={() => handleDeletePresence(p.id)}
                            style={{ background: '#fee2e2', color: '#ef4444', border: 'none', borderRadius: 6, padding: '0.25rem 0.5rem', cursor: 'pointer' }}>
                            <i className="fas fa-trash"></i>
                          </button>
                        </td>
                      </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </>
      )}

      {/* MODALS */}
      {showSuggestions && clientSuggestions.length > 0 && createPortal(
        <div style={{
          position: 'absolute', top: dropdownPos.top, left: dropdownPos.left, width: dropdownPos.width,
          zIndex: 9999, background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8,
          boxShadow: '0 8px 24px rgba(0,0,0,0.15)', maxHeight: 220, overflowY: 'auto',
        }}>
          {clientSuggestions.map(c => (
            <div key={c.idu} onMouseDown={() => modalType === 'presence' ? selectPresenceClient(c) : selectClient(c)}
              style={{ padding: '0.65rem 1rem', cursor: 'pointer', borderBottom: '1px solid #f1f5f9',
                display: 'flex', alignItems: 'center', gap: 10 }}
              onMouseEnter={e => e.currentTarget.style.background = '#f0f7ff'}
              onMouseLeave={e => e.currentTarget.style.background = '#fff'}
            >
              <i className="fas fa-user" style={{ color: '#3b82f6', fontSize: '0.85rem' }}></i>
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.88rem', color: '#1e293b' }}>{c.prenom} {c.nom}</div>
                <div style={{ fontSize: '0.76rem', color: '#64748b', display: 'flex', gap: 8 }}>
                  {c.tel && <span><i className="fas fa-phone" style={{ marginRight: 3 }}></i>{c.tel}</span>}
                  {(c.CIN || c.cin) && <span><i className="fas fa-id-card" style={{ marginRight: 3 }}></i>{c.CIN || c.cin}</span>}
                </div>
              </div>
            </div>
          ))}
        </div>,
        document.body
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => { setShowModal(false); setSelectedClient(null); setSelectedPresenceClient(null); setShowSuggestions(false); }}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>

            {modalType === 'appel' && (
              <>
                <div className="modal-header">
                  <h2><i className="fas fa-phone"></i> Enregistrer un appel</h2>
                  <button className="btn-close" onClick={() => setShowModal(false)}><i className="fas fa-times"></i></button>
                </div>
                <form onSubmit={handleAddAppel}>
                  <div className="modal-body">
                    <div className="form-group">
                      <label>Prénom *
                        {selectedClient && (
                          <span style={{ marginLeft: 8, fontSize: '0.75rem', background: '#dbeafe', color: '#1d4ed8', borderRadius: 4, padding: '2px 7px' }}>
                            <i className="fas fa-user-check" style={{ marginRight: 4 }}></i>Client existant
                          </span>
                        )}
                      </label>
                      <input ref={inputRef} type="text" required value={newAppel.callerName}
                        onChange={e => handleCallerSearch(e.target.value)}
                        onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                        placeholder="Rechercher un client ou saisir..."
                        autoComplete="off" />
                    </div>
                    <div className="form-group">
                      <label>Nom *</label>
                      <input type="text" required value={newAppel.callerLastname}
                        onChange={e => setNewAppel({ ...newAppel, callerLastname: e.target.value })} />
                    </div>
                    <div className="form-group">
                      <label>Téléphone</label>
                      <input type="text" value={newAppel.phoneNumber}
                        onChange={e => setNewAppel({ ...newAppel, phoneNumber: e.target.value })} />
                    </div>
                    <div className="form-group">
                      <label>Date et heure</label>
                      <input type="datetime-local" value={newAppel.callDate}
                        onChange={e => setNewAppel({ ...newAppel, callDate: e.target.value })} />
                    </div>
                    <div className="form-group">
                      <label>Motif *</label>
                      <textarea required rows="3" value={newAppel.callReason}
                        onChange={e => setNewAppel({ ...newAppel, callReason: e.target.value })}></textarea>
                    </div>
                  </div>
                  <div className="modal-footer">
                    <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Annuler</button>
                    <button type="submit" className="btn btn-primary" disabled={saving}>
                      {saving ? 'Enregistrement...' : 'Enregistrer'}
                    </button>
                  </div>
                </form>
              </>
            )}

            {modalType === 'presence' && (
              <>
                <div className="modal-header">
                  <h2><i className="fas fa-door-open"></i> Enregistrer une présence</h2>
                  <button className="btn-close" onClick={() => setShowModal(false)}><i className="fas fa-times"></i></button>
                </div>
                <form onSubmit={handleAddPresence}>
                  <div className="modal-body">
                    <div className="form-group">
                      <label>Prénom *
                        {selectedPresenceClient && (
                          <span style={{ marginLeft: 8, fontSize: '0.75rem', background: '#dbeafe', color: '#1d4ed8', borderRadius: 4, padding: '2px 7px' }}>
                            <i className="fas fa-user-check" style={{ marginRight: 4 }}></i>Client existant
                          </span>
                        )}
                      </label>
                      <input ref={presenceInputRef} type="text" required value={newPresence.visitorName}
                        onChange={e => handleVisitorSearch(e.target.value)}
                        onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                        placeholder="Rechercher un client ou saisir..."
                        autoComplete="off" />
                    </div>
                    <div className="form-group">
                      <label>Nom *</label>
                      <input type="text" required value={newPresence.visitorLastname}
                        onChange={e => setNewPresence({ ...newPresence, visitorLastname: e.target.value })} />
                    </div>
                    <div className="form-group">
                      <label>CIN</label>
                      <input type="text" value={newPresence.visitorCin}
                        onChange={e => setNewPresence({ ...newPresence, visitorCin: e.target.value })} />
                    </div>
                    <div className="form-group">
                      <label>Date et heure</label>
                      <input type="datetime-local" value={newPresence.arrivalTime}
                        onChange={e => setNewPresence({ ...newPresence, arrivalTime: e.target.value })} />
                    </div>
                    <div className="form-group">
                      <label>Motif de la visite *</label>
                      <textarea required rows="3" value={newPresence.reason}
                        onChange={e => setNewPresence({ ...newPresence, reason: e.target.value })}></textarea>
                    </div>
                  </div>
                  <div className="modal-footer">
                    <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Annuler</button>
                    <button type="submit" className="btn btn-primary" disabled={saving}>
                      {saving ? 'Enregistrement...' : 'Enregistrer'}
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
