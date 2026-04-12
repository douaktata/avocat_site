import { useState, useEffect, useRef, useCallback } from 'react';
import {
  MessageSquare, Edit, Search, X, Send, ArrowLeft,
  MessageCircleOff, UserX,
} from 'lucide-react';
import { useAuth } from '../AuthContext';
import { getUsersByRole, sendMessage, getConversation, getMessageContacts } from '../api';
import './MessagerieSecretaire.css';

const API_BASE = 'http://localhost:8081';

const ROLE_LABEL = { CLIENT: 'Client', AVOCAT: 'Avocat', SECRETAIRE: 'Secrétaire', STAGIAIRE: 'Stagiaire' };
const ROLE_CLS   = { CLIENT: 'msg-role-client', AVOCAT: 'msg-role-avocat', SECRETAIRE: 'msg-role-sec', STAGIAIRE: 'msg-role-stag' };

const getRole      = c => { const r = c.roles || []; return (Array.isArray(r) ? r : [r])[0] || ''; };
const getInitials  = (p, n) => ((p?.charAt(0) || '') + (n?.charAt(0) || '')).toUpperCase();
const getPhoto     = c => c?.photo_url ? `${API_BASE}${c.photo_url}` : null;

function fmtDate(str) {
  if (!str) return '';
  const d = new Date(str), today = new Date();
  if (d.toDateString() === today.toDateString())
    return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
}

function fmtDivider(str) {
  return new Date(str).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
}

/* ── Avatar ── */
function Avatar({ contact, size = 38, cls = '' }) {
  const photo = getPhoto(contact);
  return (
    <div className={`msg-avatar ${cls}`} style={{ width: size, height: size, fontSize: size * 0.38 }}>
      {photo ? <img src={photo} alt="" /> : getInitials(contact?.prenom, contact?.nom)}
    </div>
  );
}

/* ════════════════════════════════════════════════════
   COMPONENT
   ════════════════════════════════════════════════════ */
export default function MessagerieSecretaire() {
  const { user: authUser } = useAuth();
  const [allContacts,    setAllContacts]    = useState([]);
  const [conversations,  setConversations]  = useState([]);
  const [selected,       setSelected]       = useState(null);
  const [messages,       setMessages]       = useState([]);
  const [input,          setInput]          = useState('');
  const [searchConv,     setSearchConv]     = useState('');
  const [showModal,      setShowModal]      = useState(false);
  const [searchNew,      setSearchNew]      = useState('');
  const [loadingConv,    setLoadingConv]    = useState(true);
  const endRef  = useRef(null);
  const pollRef = useRef(null);

  /* load contacts + conversation history */
  useEffect(() => {
    if (!authUser?.idu) return;
    setLoadingConv(true);
    const roles = ['CLIENT', 'AVOCAT', 'STAGIAIRE'];
    Promise.all([
      getMessageContacts(authUser.idu).then(r => r.data || []).catch(() => []),
      ...roles.map(role => getUsersByRole(role).then(r => r.data || []).catch(() => [])),
    ]).then(([recent, ...byRole]) => {
      const allByRole = byRole.flat();
      const recentIds = new Set(recent.map(u => u.idu));
      setAllContacts([...recent, ...allByRole.filter(u => !recentIds.has(u.idu))]);
      setConversations(recent);
    }).finally(() => setLoadingConv(false));
  }, [authUser?.idu]);

  /* scroll to bottom */
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const fetchConv = useCallback(async (contactId) => {
    if (!authUser?.idu) return;
    try {
      const { data } = await getConversation(authUser.idu, contactId);
      setMessages(data);
    } catch { /* silent */ }
  }, [authUser?.idu]);

  /* poll every 5 s */
  useEffect(() => {
    clearInterval(pollRef.current);
    if (!selected) return;
    pollRef.current = setInterval(() => fetchConv(selected.idu), 5000);
    return () => clearInterval(pollRef.current);
  }, [selected, fetchConv]);

  const selectContact = contact => {
    setSelected(contact);
    setMessages([]);
    setConversations(prev =>
      prev.find(c => c.idu === contact.idu) ? prev : [contact, ...prev]
    );
    fetchConv(contact.idu);
    setShowModal(false);
    setSearchNew('');
  };

  const handleSend = async e => {
    e.preventDefault();
    if (!input.trim() || !selected || !authUser?.idu) return;
    const content = input.trim();
    setInput('');
    try {
      await sendMessage(authUser.idu, selected.idu, content);
      await fetchConv(selected.idu);
    } catch { /* silent */ }
  };

  const filteredConv = conversations.filter(c =>
    `${c.prenom} ${c.nom}`.toLowerCase().includes(searchConv.toLowerCase())
  );

  const modalContacts = allContacts.filter(c =>
    !searchNew || `${c.prenom} ${c.nom}`.toLowerCase().includes(searchNew.toLowerCase())
  );

  const lastMsg = contactId => {
    if (selected?.idu === contactId && messages.length > 0)
      return messages[messages.length - 1].content;
    return '';
  };

  return (
    <div className="msg">

      {/* Header */}
      <div className="msg-header">
        <div>
          <h1 className="msg-title">Messagerie</h1>
          <p className="msg-sub">Communiquez avec les clients, avocats et stagiaires</p>
        </div>
        <button className="msg-btn-new" onClick={() => setShowModal(true)}>
          <Edit size={15} /> Nouveau message
        </button>
      </div>

      {/* Shell: sidebar + chat */}
      <div className="msg-shell">

        {/* Sidebar */}
        <aside className="msg-sidebar">
          <div className="msg-sb-top">
            <span className="msg-sb-label">Conversations</span>
            <span className="msg-sb-badge">{conversations.length}</span>
          </div>

          <div className="msg-sb-search">
            <Search size={14} className="msg-sb-search-ic" />
            <input
              type="text"
              placeholder="Rechercher…"
              value={searchConv}
              onChange={e => setSearchConv(e.target.value)}
            />
            {searchConv && (
              <button className="msg-sb-clear" onClick={() => setSearchConv('')}><X size={13} /></button>
            )}
          </div>

          <div className="msg-conv-list">
            {loadingConv ? (
              <div className="msg-conv-empty"><p>Chargement…</p></div>
            ) : filteredConv.length === 0 ? (
              <div className="msg-conv-empty">
                <MessageCircleOff size={28} className="msg-conv-empty-ic" />
                <p>Aucune conversation.<br />Démarrez-en une nouvelle.</p>
              </div>
            ) : (
              filteredConv.map(contact => {
                const active = selected?.idu === contact.idu;
                const role   = getRole(contact);
                return (
                  <div
                    key={contact.idu}
                    className={`msg-conv-item${active ? ' active' : ''}`}
                    onClick={() => selectContact(contact)}
                  >
                    <Avatar contact={contact} size={38} />
                    <div className="msg-conv-info">
                      <span className="msg-conv-name">{contact.prenom} {contact.nom}</span>
                      <span className="msg-conv-preview">
                        {lastMsg(contact.idu) || ROLE_LABEL[role] || role}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </aside>

        {/* Chat area */}
        <div className="msg-chat">
          {selected ? (
            <>
              {/* Chat header */}
              <div className="msg-chat-top">
                <button className="msg-back" onClick={() => setSelected(null)}>
                  <ArrowLeft size={16} />
                </button>
                <Avatar contact={selected} size={36} />
                <div className="msg-chat-id">
                  <span className="msg-chat-name">{selected.prenom} {selected.nom}</span>
                  <span className={`msg-chat-role ${ROLE_CLS[getRole(selected)] || ''}`}>
                    {ROLE_LABEL[getRole(selected)] || getRole(selected)}
                  </span>
                </div>
              </div>

              {/* Messages */}
              <div className="msg-messages">
                {messages.length === 0 ? (
                  <div className="msg-chat-empty">
                    <Send size={28} className="msg-chat-empty-ic" />
                    <p>Démarrez la conversation avec<br /><strong>{selected.prenom} {selected.nom}</strong></p>
                  </div>
                ) : (
                  <>
                    {messages.map((m, i) => {
                      const sent  = m.sender_id === authUser?.idu;
                      const prev  = i > 0 ? messages[i - 1] : null;
                      const newDay = !prev ||
                        new Date(m.created_at).toDateString() !== new Date(prev.created_at).toDateString();
                      return (
                        <div key={m.idm}>
                          {newDay && (
                            <div className="msg-date-divider">
                              <span>{fmtDivider(m.created_at)}</span>
                            </div>
                          )}
                          <div className={`msg-bubble-wrap${sent ? ' sent' : ' received'}`}>
                            {!sent && <Avatar contact={selected} size={26} cls="msg-bubble-avatar" />}
                            <div className="msg-bubble">
                              <p>{m.content}</p>
                              <span className="msg-bubble-time">{fmtDate(m.created_at)}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={endRef} />
                  </>
                )}
              </div>

              {/* Input */}
              <form className="msg-input-bar" onSubmit={handleSend}>
                <textarea
                  className="msg-input"
                  placeholder="Écrivez votre message…"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) handleSend(e); }}
                  rows={1}
                />
                <button
                  type="submit"
                  className={`msg-send${input.trim() ? ' active' : ''}`}
                  disabled={!input.trim()}
                >
                  <Send size={16} />
                </button>
              </form>
            </>
          ) : (
            <div className="msg-placeholder">
              <MessageSquare size={36} className="msg-placeholder-ic" />
              <h2>Vos messages</h2>
              <p>Sélectionnez une conversation ou démarrez-en une nouvelle</p>
              <button className="msg-btn-new" onClick={() => setShowModal(true)}>
                <Edit size={14} /> Nouveau message
              </button>
            </div>
          )}
        </div>
      </div>

      {/* New message modal */}
      {showModal && (
        <>
          <div className="msg-scrim" onClick={() => { setShowModal(false); setSearchNew(''); }} />
          <div className="msg-modal">
            <div className="msg-modal-head">
              <h2>Nouveau message</h2>
              <button className="msg-modal-close" onClick={() => { setShowModal(false); setSearchNew(''); }}>
                <X size={16} />
              </button>
            </div>
            <div className="msg-modal-search">
              <Search size={14} className="msg-sb-search-ic" />
              <input
                type="text"
                placeholder="Rechercher un contact…"
                value={searchNew}
                onChange={e => setSearchNew(e.target.value)}
                autoFocus
              />
            </div>
            <div className="msg-modal-list">
              {modalContacts.length === 0 ? (
                <div className="msg-conv-empty">
                  <UserX size={28} className="msg-conv-empty-ic" />
                  <p>Aucun contact trouvé</p>
                </div>
              ) : (
                modalContacts.map(contact => {
                  const role = getRole(contact);
                  return (
                    <div
                      key={contact.idu}
                      className="msg-modal-item"
                      onClick={() => selectContact(contact)}
                    >
                      <Avatar contact={contact} size={36} />
                      <div className="msg-conv-info">
                        <span className="msg-conv-name">{contact.prenom} {contact.nom}</span>
                        <span className={`msg-modal-role ${ROLE_CLS[role] || ''}`}>
                          {ROLE_LABEL[role] || role}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
