import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../AuthContext';
import { getUsersByRole, sendMessage, getConversation, getMessageContacts } from '../api';
import './Messagerie.css';

const API_BASE = 'http://localhost:8081';

const Messagerie = ({
  contactRoles = ['CLIENT', 'SECRETAIRE', 'STAGIAIRE'],
  pageTitle = 'Messagerie',
  pageSubtitle = 'Communiquez avec vos clients, secrétaires et stagiaires',
}) => {
  const { user: authUser } = useAuth();

  const [allContacts, setAllContacts] = useState([]);   // all users by role (for modal)
  const [conversations, setConversations] = useState([]); // contacts with message history
  const [selectedContact, setSelectedContact] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState('');
  const [searchConv, setSearchConv] = useState('');
  const [showNewModal, setShowNewModal] = useState(false);
  const [searchNew, setSearchNew] = useState('');
  const [loadingContacts, setLoadingContacts] = useState(true);
  const messagesEndRef = useRef(null);
  const pollRef = useRef(null);

  // Fetch contacts by role + existing conversation partners on mount
  useEffect(() => {
    if (!authUser?.idu) return;
    setLoadingContacts(true);
    const rolePromises = contactRoles.map(role =>
      getUsersByRole(role).then(r => r.data || []).catch(() => [])
    );
    const historyPromise = getMessageContacts(authUser.idu)
      .then(r => r.data || []).catch(() => []);

    Promise.all([historyPromise, ...rolePromises]).then(([recentContacts, ...roleResults]) => {
      const allByRole = roleResults.flat();
      const recentIds = new Set(recentContacts.map(u => u.idu));
      const others = allByRole.filter(u => !recentIds.has(u.idu));
      setAllContacts([...recentContacts, ...others]);
      setConversations(recentContacts);
    }).finally(() => setLoadingContacts(false));
  }, [authUser?.idu]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchConversation = useCallback(async (contactId) => {
    if (!authUser?.idu) return;
    try {
      const { data } = await getConversation(authUser.idu, contactId);
      setMessages(data);
    } catch (e) {
      console.error(e);
    }
  }, [authUser?.idu]);

  // Poll every 5 s while a conversation is open
  useEffect(() => {
    clearInterval(pollRef.current);
    if (!selectedContact) return;
    pollRef.current = setInterval(() => fetchConversation(selectedContact.idu), 5000);
    return () => clearInterval(pollRef.current);
  }, [selectedContact, fetchConversation]);

  const handleSelectContact = (contact) => {
    setSelectedContact(contact);
    setMessages([]);
    // Add to conversations sidebar if not already there
    setConversations(prev =>
      prev.find(c => c.idu === contact.idu) ? prev : [contact, ...prev]
    );
    fetchConversation(contact.idu);
    setShowNewModal(false);
    setSearchNew('');
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!messageInput.trim() || !selectedContact || !authUser?.idu) return;
    const content = messageInput.trim();
    setMessageInput('');
    try {
      await sendMessage(authUser.idu, selectedContact.idu, content);
      await fetchConversation(selectedContact.idu);
    } catch (e) {
      console.error(e);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) handleSend(e);
  };

  const getInitials = (prenom, nom) =>
    ((prenom?.charAt(0) || '') + (nom?.charAt(0) || '')).toUpperCase();

  const getPhotoSrc = (contact) =>
    contact?.photo_url ? `${API_BASE}${contact.photo_url}` : null;

  const getRole = (contact) => {
    const roles = contact.roles || [];
    const arr = Array.isArray(roles) ? roles : [roles];
    return arr[0] || '';
  };

  const getRoleLabel = (role) => {
    const map = { CLIENT: 'Client', AVOCAT: 'Avocat', SECRETAIRE: 'Secrétaire', STAGIAIRE: 'Stagiaire' };
    return map[role] || role;
  };

  const getRoleColor = (role) => {
    const map = { CLIENT: 'role-client', AVOCAT: 'role-avocat', SECRETAIRE: 'role-secretary', STAGIAIRE: 'role-intern' };
    return map[role] || 'role-client';
  };

  const getLastMessage = (contactId) => {
    if (selectedContact?.idu === contactId && messages.length > 0)
      return messages[messages.length - 1].content;
    return '';
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const d = new Date(dateString);
    const today = new Date();
    if (d.toDateString() === today.toDateString())
      return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
  };

  const filteredConversations = conversations.filter(c => {
    const name = `${c.prenom} ${c.nom}`.toLowerCase();
    return name.includes(searchConv.toLowerCase());
  });

  const modalContacts = allContacts.filter(c => {
    if (!searchNew) return true;
    return `${c.prenom} ${c.nom}`.toLowerCase().includes(searchNew.toLowerCase());
  });

  return (
    <div className="msg-page">

      {/* Page Title */}
      <div className="msg-page-header">
        <div>
          <h1 className="msg-page-title">
            <i className="fas fa-comments"></i>
            {pageTitle}
          </h1>
          <p className="msg-page-sub">{pageSubtitle}</p>
        </div>
        <button className="btn-new-msg" onClick={() => setShowNewModal(true)}>
          <i className="fas fa-edit"></i>
          Nouveau message
        </button>
      </div>

      {/* Main Chat Layout */}
      <div className="msg-shell">

        {/* Sidebar */}
        <aside className="msg-sidebar open">
          <div className="sidebar-top">
            <span className="sidebar-label">Conversations</span>
            <span className="conv-count">{conversations.length}</span>
          </div>

          <div className="sidebar-search">
            <i className="fas fa-search"></i>
            <input
              type="text"
              placeholder="Rechercher..."
              value={searchConv}
              onChange={e => setSearchConv(e.target.value)}
            />
            {searchConv && (
              <button className="clear-search" onClick={() => setSearchConv('')}>
                <i className="fas fa-times"></i>
              </button>
            )}
          </div>

          <div className="conv-list">
            {loadingContacts ? (
              <div className="conv-empty"><i className="fas fa-spinner fa-spin"></i><p>Chargement...</p></div>
            ) : filteredConversations.length === 0 ? (
              <div className="conv-empty">
                <i className="fas fa-comment-slash"></i>
                <p>Aucune conversation.<br />Démarrez-en une nouvelle.</p>
              </div>
            ) : (
              filteredConversations.map(contact => {
                const isActive = selectedContact?.idu === contact.idu;
                const role = getRole(contact);
                return (
                  <div
                    key={contact.idu}
                    className={`conv-item ${isActive ? 'active' : ''}`}
                    onClick={() => handleSelectContact(contact)}
                  >
                    <div className="conv-avatar-wrap">
                      <div className="conv-avatar">
                        {getPhotoSrc(contact)
                          ? <img src={getPhotoSrc(contact)} alt="" className="avatar-photo" />
                          : getInitials(contact.prenom, contact.nom)}
                      </div>
                    </div>
                    <div className="conv-info">
                      <div className="conv-name-row">
                        <span className="conv-name">{contact.prenom} {contact.nom}</span>
                      </div>
                      <div className="conv-preview-row">
                        <span className="conv-preview">{getLastMessage(contact.idu) || getRoleLabel(role)}</span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </aside>

        {/* Chat Area */}
        <div className="msg-chat">
          {selectedContact ? (
            <>
              {/* Chat Header */}
              <div className="chat-top">
                <button className="mobile-back" onClick={() => setSelectedContact(null)}>
                  <i className="fas fa-arrow-left"></i>
                </button>
                <div className="chat-avatar-wrap">
                  <div className="chat-avatar">
                    {getPhotoSrc(selectedContact)
                      ? <img src={getPhotoSrc(selectedContact)} alt="" className="avatar-photo" />
                      : getInitials(selectedContact.prenom, selectedContact.nom)}
                  </div>
                </div>
                <div className="chat-contact-info">
                  <span className="chat-contact-name">{selectedContact.prenom} {selectedContact.nom}</span>
                  <span className={`chat-role ${getRoleColor(getRole(selectedContact))}`}>
                    {getRoleLabel(getRole(selectedContact))}
                  </span>
                </div>
              </div>

              {/* Messages */}
              <div className="chat-messages">
                {messages.length === 0 ? (
                  <div className="chat-empty">
                    <div className="chat-empty-icon"><i className="fas fa-paper-plane"></i></div>
                    <p>Démarrez la conversation avec<br /><strong>{selectedContact.prenom} {selectedContact.nom}</strong></p>
                  </div>
                ) : (
                  <>
                    {messages.map((msg, index) => {
                      const isSent = msg.sender_id === authUser?.idu;
                      const prev = index > 0 ? messages[index - 1] : null;
                      const showDate = !prev ||
                        new Date(msg.created_at).toDateString() !== new Date(prev.created_at).toDateString();
                      return (
                        <React.Fragment key={msg.idm}>
                          {showDate && (
                            <div className="date-divider">
                              <span>{new Date(msg.created_at).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
                            </div>
                          )}
                          <div className={`bubble-wrap ${isSent ? 'sent' : 'received'}`}>
                            {!isSent && (
                              <div className="bubble-avatar">
                                {getPhotoSrc(selectedContact)
                                  ? <img src={getPhotoSrc(selectedContact)} alt="" className="avatar-photo" />
                                  : getInitials(selectedContact.prenom, selectedContact.nom)}
                              </div>
                            )}
                            <div className="bubble">
                              <p>{msg.content}</p>
                              <span className="bubble-time">
                                {formatDate(msg.created_at)}
                                {isSent && <i className="fas fa-check-double"></i>}
                              </span>
                            </div>
                          </div>
                        </React.Fragment>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </>
                )}
              </div>

              {/* Input */}
              <div className="chat-input-bar">
                <div className="input-wrap">
                  <textarea
                    className="chat-input"
                    placeholder="Écrivez votre message..."
                    value={messageInput}
                    onChange={e => setMessageInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    rows={1}
                  />
                </div>
                <button
                  className={`send-btn ${messageInput.trim() ? 'active' : ''}`}
                  onClick={handleSend}
                  disabled={!messageInput.trim()}
                >
                  <i className="fas fa-paper-plane"></i>
                </button>
              </div>
            </>
          ) : (
            <div className="chat-placeholder">
              <div className="placeholder-icon"><i className="fas fa-comments"></i></div>
              <h2>Vos messages</h2>
              <p>Sélectionnez une conversation ou démarrez-en une nouvelle</p>
              <button className="btn-start-chat" onClick={() => setShowNewModal(true)}>
                <i className="fas fa-edit"></i> Nouveau message
              </button>
            </div>
          )}
        </div>
      </div>

      {/* New Message Modal */}
      {showNewModal && (
        <div className="modal-backdrop" onClick={() => { setShowNewModal(false); setSearchNew(''); }}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-head">
              <h3><i className="fas fa-edit"></i> Nouveau message</h3>
              <button className="modal-close" onClick={() => { setShowNewModal(false); setSearchNew(''); }}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="modal-search">
              <i className="fas fa-search"></i>
              <input
                type="text"
                placeholder="Rechercher un contact..."
                value={searchNew}
                onChange={e => setSearchNew(e.target.value)}
                autoFocus
              />
            </div>
            <div className="modal-contacts">
              {modalContacts.length === 0 ? (
                <div className="modal-empty">
                  <i className="fas fa-user-slash"></i>
                  <p>Aucun contact trouvé</p>
                </div>
              ) : (
                modalContacts.map(contact => {
                  const role = getRole(contact);
                  return (
                    <div
                      key={contact.idu}
                      className="modal-contact-item"
                      onClick={() => handleSelectContact(contact)}
                    >
                      <div className="modal-avatar">
                        {getPhotoSrc(contact)
                          ? <img src={getPhotoSrc(contact)} alt="" className="avatar-photo" />
                          : getInitials(contact.prenom, contact.nom)}
                      </div>
                      <div className="modal-contact-info">
                        <span className="modal-contact-name">{contact.prenom} {contact.nom}</span>
                        <span className={`modal-role ${getRoleColor(role)}`}>{getRoleLabel(role)}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Messagerie;
