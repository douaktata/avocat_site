import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../AuthContext';
import { getAppointmentsByUser, getClientInvoices } from '../api';
import './ClientPages.css';

const notifIcons = {
  rdv:      { icon: 'fa-calendar-check',      bg: '#dbeafe', color: '#1e40af' },
  facture:  { icon: 'fa-file-invoice-dollar', bg: '#ecfdf5', color: '#059669' },
  info:     { icon: 'fa-info-circle',          bg: '#ede9fe', color: '#6d28d9' },
};

const buildNotifications = (appointments, invoices) => {
  const notifs = [];

  appointments.forEach(apt => {
    if (apt.status === 'CONFIRMED') {
      const date = apt.appointmentDate ? new Date(apt.appointmentDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : '-';
      const heure = apt.appointmentDate ? new Date(apt.appointmentDate).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : '';
      notifs.push({
        id: `rdv-${apt.ida}`,
        type: 'rdv',
        titre: 'Rendez-vous confirmé',
        message: `Votre rendez-vous du ${date}${heure ? ' à ' + heure : ''} a été confirmé par le cabinet.`,
        date: apt.appointmentDate || apt.createdAt,
        lu: false,
      });
    } else if (apt.status === 'PENDING') {
      notifs.push({
        id: `rdv-pending-${apt.ida}`,
        type: 'rdv',
        titre: 'Demande de rendez-vous en attente',
        message: `Votre demande de rendez-vous est en cours de traitement par le cabinet.${apt.reason ? ' Motif : ' + apt.reason : ''}`,
        date: apt.createdAt || apt.appointmentDate,
        lu: true,
      });
    }
  });

  invoices.forEach(inv => {
    if (inv.status === 'ISSUED' || inv.status === 'PARTIAL') {
      notifs.push({
        id: `inv-${inv.id}`,
        type: 'facture',
        titre: 'Nouvelle facture disponible',
        message: `La facture ${inv.invoiceNumber || '#' + inv.id} d'un montant de ${Number(inv.amountTTC || 0).toFixed(2)} TND est disponible.`,
        date: inv.issuedDate || inv.invoiceDate || inv.createdAt,
        lu: false,
      });
    } else if (inv.status === 'PAID') {
      notifs.push({
        id: `inv-paid-${inv.id}`,
        type: 'facture',
        titre: 'Facture réglée',
        message: `La facture ${inv.invoiceNumber || '#' + inv.id} de ${Number(inv.amountTTC || 0).toFixed(2)} TND a été entièrement réglée. Merci.`,
        date: inv.issuedDate || inv.invoiceDate || inv.createdAt,
        lu: true,
      });
    }
  });

  // Sort by date desc
  notifs.sort((a, b) => {
    const da = a.date ? new Date(a.date) : 0;
    const db = b.date ? new Date(b.date) : 0;
    return db - da;
  });

  return notifs;
};

const NotificationsClient = () => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [readIds, setReadIds] = useState(new Set());
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    if (!user?.idu) return;
    Promise.all([
      getAppointmentsByUser(user.idu),
      getClientInvoices(user.idu),
    ])
      .then(([aptsRes, invRes]) => {
        setAppointments(aptsRes.data || []);
        setInvoices(invRes.data || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user]);

  const baseNotifs = useMemo(() => buildNotifications(appointments, invoices), [appointments, invoices]);

  const notifications = useMemo(
    () => baseNotifs.map(n => ({ ...n, lu: n.lu || readIds.has(n.id) })),
    [baseNotifs, readIds]
  );

  const nonLues = notifications.filter(n => !n.lu).length;

  const markRead = (id) => setReadIds(prev => new Set([...prev, id]));
  const markAllRead = () => setReadIds(new Set(notifications.map(n => n.id)));

  const getDisplayed = () => {
    if (filter === 'unread') return notifications.filter(n => !n.lu);
    if (filter === 'read') return notifications.filter(n => n.lu);
    return notifications;
  };
  const displayed = getDisplayed();

  if (loading) {
    return <div className="notifications-client"><p style={{ padding: '2rem' }}>Chargement...</p></div>;
  }

  return (
    <div className="notifications-client">
      <div className="page-header">
        <div>
          <h1 className="page-title">Notifications</h1>
          <p className="page-subtitle">
            {nonLues > 0
              ? `${nonLues} notification${nonLues > 1 ? 's' : ''} non lue(s)`
              : 'Tout est à jour'}
          </p>
        </div>
        {nonLues > 0 && (
          <button className="btn btn-outline" onClick={markAllRead}>
            <i className="fas fa-check-double"></i> Tout marquer comme lu
          </button>
        )}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.75rem' }}>
        {[
          { id: 'all',    label: `Toutes (${notifications.length})` },
          { id: 'unread', label: `Non lues (${nonLues})` },
          { id: 'read',   label: 'Lues' },
        ].map(f => (
          <button
            key={f.id}
            className={`btn btn-sm ${filter === f.id ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setFilter(f.id)}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="card">
        {displayed.length === 0 ? (
          <div className="empty-state">
            <i className="fas fa-bell-slash"></i>
            <p>Aucune notification dans cette catégorie</p>
          </div>
        ) : (
          displayed.map(notif => {
            const style = notifIcons[notif.type] || notifIcons.info;
            return (
              <button
                key={notif.id}
                type="button"
                className={`notif-item ${notif.lu ? '' : 'unread'}`}
                onClick={() => markRead(notif.id)}
                style={{ width: '100%', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer' }}
              >
                <div className="notif-icon" style={{ background: style.bg, color: style.color }}>
                  <i className={`fas ${style.icon}`}></i>
                </div>
                <div className="notif-body">
                  <p className="notif-title">{notif.titre}</p>
                  <p className="notif-message">{notif.message}</p>
                  {notif.date && (
                    <span className="notif-time">
                      <i className="fas fa-clock"></i>{' '}
                      {new Date(notif.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </span>
                  )}
                </div>
                {notif.lu ? null : <div className="notif-dot"></div>}
              </button>
            );
          })
        )}
      </div>
    </div>
  );
};

export default NotificationsClient;
