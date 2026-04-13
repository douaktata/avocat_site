import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users, Search, X, Mail, Phone, CreditCard,
  Calendar, Eye, ArrowRight, UserX, MapPin,
  UserPlus, Sparkles,
} from 'lucide-react';
import { getUsersByRole } from '../api';
import './ClientsSecretaire.css';

const API_BASE = 'http://localhost:8081';

export default function ClientsSecretaire() {
  const navigate = useNavigate();
  const [clients, setClients]       = useState([]);
  const [loading, setLoading]       = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selected, setSelected]     = useState(null);

  useEffect(() => {
    getUsersByRole('CLIENT')
      .then(res => setClients(res.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = clients.filter(c => {
    const name = `${c.prenom || ''} ${c.nom || ''}`.toLowerCase();
    return (
      name.includes(searchTerm.toLowerCase()) ||
      (c.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.tel || '').includes(searchTerm)
    );
  });

  const initials = c =>
    `${(c.prenom || '?').charAt(0)}${(c.nom || '?').charAt(0)}`.toUpperCase();

  const fmtDate = d => d ? new Date(d).toLocaleDateString('fr-FR') : '—';

  return (
    <div className="cs">

      {/* ── HEADER ── */}
      <div className="cs-header">
        <div className="cs-header-blob" />

        <div className="cs-header-top">
          <div className="cs-header-left">
            <div className="cs-eyebrow"><Sparkles size={11} /> Gestion des clients</div>
            <h1 className="cs-title">Clients <em>du cabinet</em></h1>
            <p className="cs-subtitle">Gérez et consultez le portefeuille clients du Cabinet Hajaij</p>
          </div>
          <button className="cs-header-btn" onClick={() => navigate('/secretaire/clients/nouveau')}>
            <UserPlus size={15} /> Nouveau client
          </button>
        </div>

        <div className="cs-header-divider" />

        <div className="cs-header-stats">
          <div className="cs-hstat">
            <span className="cs-hstat-number">{clients.length}</span>
            <span className="cs-hstat-label">Total clients</span>
          </div>
          <div className="cs-hstat-sep" />
          <div className="cs-hstat">
            <span className="cs-hstat-number">{filtered.length}</span>
            <span className="cs-hstat-label">Résultats affichés</span>
          </div>
          <div className="cs-hstat-sep" />
          <div className="cs-hstat">
            <span className="cs-hstat-number">{clients.filter(c => c.statut !== 'Inactif').length}</span>
            <span className="cs-hstat-label">Clients actifs</span>
          </div>
          <div className="cs-hstat-sep" />
          <div className="cs-hstat">
            <span className="cs-hstat-number">{clients.filter(c => c.statut === 'Inactif').length}</span>
            <span className="cs-hstat-label">Inactifs</span>
          </div>
        </div>
      </div>

      {/* ── TOOLBAR ── */}
      <div className="cs-toolbar">
        <div className="cs-search">
          <Search size={15} className="cs-search-ic" />
          <input
            type="text"
            placeholder="Rechercher par nom, email ou téléphone…"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button className="cs-clear" onClick={() => setSearchTerm('')}>
              <X size={14} />
            </button>
          )}
        </div>
        <span className="cs-count">{filtered.length} client{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      {/* ── CONTENT ── */}
      {loading ? (
        <div className="cs-loading">
          <div className="cs-spinner" />
          <span>Chargement des clients…</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="cs-empty">
          <div className="cs-empty-icon"><UserX size={28} /></div>
          <p className="cs-empty-title">Aucun client trouvé</p>
          <p className="cs-empty-sub">Essayez de modifier vos critères de recherche</p>
        </div>
      ) : (
        <div className="cs-grid">
          {filtered.map(client => (
            <div key={client.idu} className="cs-card">
              <div className="cs-card-top">
                <div className="cs-avatar">
                  {client.photo_url
                    ? <img src={`${API_BASE}${client.photo_url}`} alt="" />
                    : initials(client)
                  }
                </div>
                <div className="cs-card-id">
                  <div className="cs-name">{client.prenom} {client.nom}</div>
                  <div className="cs-email">{client.email || '—'}</div>
                </div>
              </div>

              <div className="cs-card-info">
                <div className="cs-info-row">
                  <Phone size={13} /><span>{client.tel || '—'}</span>
                </div>
                <div className="cs-info-row">
                  <CreditCard size={13} /><span>{client.CIN || client.cin || '—'}</span>
                </div>
                <div className="cs-info-row">
                  <Calendar size={13} /><span>{fmtDate(client.date_naissance)}</span>
                </div>
              </div>

              <div className="cs-card-actions">
                <button className="cs-btn-ghost" onClick={() => setSelected(client)}>
                  <Eye size={14} /> Aperçu
                </button>
                <button className="cs-btn-primary" onClick={() => navigate(`/secretaire/clients/${client.idu}`)}>
                  Détails <ArrowRight size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── MODAL ── */}
      {selected && (
        <>
          <div className="cs-scrim" onClick={() => setSelected(null)} />
          <div className="cs-modal">
            <div className="cs-modal-head">
              <div className="cs-modal-avatar">
                {selected.photo_url
                  ? <img src={`${API_BASE}${selected.photo_url}`} alt="" />
                  : initials(selected)
                }
              </div>
              <div className="cs-modal-id">
                <h2 className="cs-modal-name">{selected.prenom} {selected.nom}</h2>
                <p className="cs-modal-sub">Client · Cabinet Hajaij</p>
              </div>
              <button className="cs-modal-close" onClick={() => setSelected(null)}>
                <X size={16} />
              </button>
            </div>

            <div className="cs-modal-body">
              <div className="cs-modal-grid">
                {[
                  { Icon: CreditCard, label: 'CIN',               value: selected.CIN || selected.cin || '—' },
                  { Icon: Phone,      label: 'Téléphone',          value: selected.tel || '—'                  },
                  { Icon: Mail,       label: 'Email',              value: selected.email || '—'                },
                  { Icon: Calendar,   label: 'Date de naissance',  value: fmtDate(selected.date_naissance)     },
                ].map(({ Icon, label, value }) => (
                  <div key={label} className="cs-minfo">
                    <div className="cs-minfo-ic"><Icon size={15} /></div>
                    <div>
                      <label>{label}</label>
                      <p>{value}</p>
                    </div>
                  </div>
                ))}
                <div className="cs-minfo cs-minfo-full">
                  <div className="cs-minfo-ic"><MapPin size={15} /></div>
                  <div>
                    <label>Adresse</label>
                    <p>{selected.adresse || '—'}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="cs-modal-ft">
              <button className="cs-btn-cancel" onClick={() => setSelected(null)}>Fermer</button>
              <button className="cs-btn-primary" onClick={() => navigate(`/secretaire/clients/${selected.idu}`)}>
                Plus de détails <ArrowRight size={14} />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
