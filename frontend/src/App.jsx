import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './AuthContext';
import AuthPage from './pages/AuthPage';
import AdminDashboard from './pages/Dashboard';

// Landing
import JuriSHubLanding from './aceuille/jurishublandig';

// Avocat
import Layout from './avocate/Layout';
import Dashboard from './avocate/Dashboard';
import DemandesRendezVous from './avocate/Demandesrendezvous';
import Calendrier from './avocate/Calendrier';
import Agendaav from './avocate/Agendaav';
import Statistiques from './avocate/Statistiques';
import TodoList from './avocate/TodoList';
import Messagerie from './avocate/Messagerie';
import RechercheGlob from './avocate/Rechercheglob';
import GestionBureau from './avocate/GestionBureau';
import Clients from './avocate/Clients';
import AffaireJudiciaire from './avocate/AffaireJudiciaire';
import FactureDetailAvocate from './avocate/Facturedetailavocate';
import AttributionTravail from './avocate/AttributionTravail';
import GestionAcces from './avocate/GestionAcces';
import Membres from './avocate/Membres';
import Staffav from './avocate/Staffav';
import StaffDetailav from './avocate/staffdetailav';
import DetailTravail from './avocate/DetailTravail';
import ClientDetail from './avocate/Clientdetail';
import ValidationTravaux from './avocate/ValidationTravaux';
import AffaireDetailav from './avocate/Dossierdetailav';
import MembreDetailav from './avocate/MembreDetailav';
import InvoiceList from './avocate/InvoiceList';
import Tribunaux from './avocate/Tribunaux';
import ClientInvoices from './client/ClientInvoices';
import MessagerieClient from './client/MessagerieClient';
import Profile from './Profile';

// Secretaire
import LayoutSecretaire from './secretaire/LayoutSecretaire';
import DashboardSecretaire from './secretaire/DashboardSecretaire';
import RechercheGlobale from './secretaire/Rechercheglobale';
import CalendrierSecretaire from './secretaire/Calendriersecretaire';
import AgendaSecretaire from './secretaire/AgendaSecretaire';
import AffairesJuridiques from './secretaire/Affairesjuridiques';
import Staffsec from './secretaire/Staffsec';
import ClientsSecretaire from './secretaire/ClientsSecretaire';
import DossierDetail from './secretaire/Dossierdetail';
import StaffDetail from './secretaire/StaffDetail';
import ClientDetails from './secretaire/clientdetails';
import DossiersSecretaire from './secretaire/DossiersSecretaire';
import TachesSecretaire from './secretaire/TachesSecretaire';
import MessagerieSecretaire from './secretaire/MessagerieSecretaire';
import ProfileSecretaire from './secretaire/ProfileSecretaire';
import MembresDuBarreau from './secretaire/Membresdubarreau';
import MembreDetail from './secretaire/MembreDetail';

// Stagiaire
import LayoutStagiaire from './stagiaire/LayoutStagiaire';
import DashboardStagiaire from './stagiaire/DashboardStagiaire';
import CalendrierStagiaire from './stagiaire/CalendrierStagiaire';
import DossiersAssignes from './stagiaire/DossiersAssignes';
import TachesStagiaire from './stagiaire/TachesStagiaire';
import DocumentsStagiaire from './stagiaire/DocumentsStagiaire';
import Documentsdossier from './stagiaire/Documentsdossier';
import MessagerieStagiaire from './stagiaire/MessagerieStagiaire';

// Client
import LayoutClient from './client/LayoutClient';
import DashboardClient from './client/DashboardClient';
import MesDossiersClient from './client/MesDossiersClient';
import RendezVousClient from './client/RendezVousClient';
import FactureDetail from './client/Facturedetail';
import DmRendezVousClient from './client/dmRendezVousClient';
import DossierDetailClient from './client/DossierDetailClient';
import NotificationsClient from './client/NotificationsClient';

import './App.css';

function getRolePath(user) {
  const roles = Array.isArray(user.roles) ? user.roles : [user.roles];
  if (roles.includes('ADMINISTRATEUR')) return '/admin';
  if (roles.includes('AVOCAT')) return '/avocat/dashboard';
  if (roles.includes('SECRETAIRE')) return '/secretaire/dashboard';
  if (roles.includes('STAGIAIRE')) return '/stagiaire/dashboard';
  if (roles.includes('CLIENT')) return '/client/accueil';
  return '/login';
}

function PrivateRoute({ children, allowedRoles }) {
  const { user, authLoading } = useAuth();
  if (authLoading) return null;
  if (!user) return <Navigate to="/login" />;
  if (allowedRoles) {
    const roles = Array.isArray(user.roles) ? user.roles : [user.roles];
    if (!allowedRoles.some((r) => roles.includes(r))) {
      return <Navigate to={getRolePath(user)} />;
    }
  }
  return children;
}

function PublicRoute({ children }) {
  const { user, authLoading } = useAuth();
  if (authLoading) return null;
  return user ? <Navigate to={getRolePath(user)} /> : children;
}

function RoleRedirect() {
  const { user, authLoading } = useAuth();
  if (authLoading) return null;
  if (!user) return <Navigate to="/login" />;
  return <Navigate to={getRolePath(user)} />;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<JuriSHubLanding />} />
      <Route path="/login" element={<PublicRoute><AuthPage /></PublicRoute>} />

      {/* Admin */}
      <Route path="/admin" element={<PrivateRoute allowedRoles={['ADMINISTRATEUR']}><AdminDashboard /></PrivateRoute>} />

      {/* Avocat */}
      <Route path="/avocat" element={<PrivateRoute allowedRoles={['AVOCAT']}><Layout /></PrivateRoute>}>
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="calendrier" element={<Calendrier />} />
        <Route path="stat" element={<Statistiques />} />
        <Route path="validation-travaux" element={<ValidationTravaux />} />
        <Route path="travaux/:id" element={<DetailTravail />} />
        <Route path="tdl" element={<TodoList />} />
        <Route path="msg" element={<Messagerie />} />
        <Route path="recherche" element={<RechercheGlob />} />
        <Route path="gestion" element={<GestionBureau />} />
        <Route path="clients" element={<Clients />} />
        <Route path="DemandesRendezVous" element={<DemandesRendezVous />} />
        <Route path="clients/:id" element={<ClientDetail />} />
        <Route path="agendaav" element={<Agendaav />} />
        <Route path="affjud" element={<AffaireJudiciaire />} />
        <Route path="affjud/:id" element={<AffaireDetailav />} />
        <Route path="factures" element={<InvoiceList />} />
        <Route path="facture/:id" element={<FactureDetailAvocate />} />
        <Route path="attribution-travail" element={<AttributionTravail />} />
        <Route path="gestion-acces" element={<GestionAcces />} />
        <Route path="membre" element={<Membres />} />
        <Route path="membre/:id" element={<MembreDetailav />} />
        <Route path="staff" element={<Staffav />} />
        <Route path="staff/:id" element={<StaffDetailav />} />
        <Route path="tribunaux" element={<Tribunaux />} />
        <Route path="profile" element={<Profile />} />
      </Route>

      {/* Secretaire */}
      <Route path="/secretaire" element={<PrivateRoute allowedRoles={['SECRETAIRE']}><LayoutSecretaire /></PrivateRoute>}>
        <Route path="dashboard" element={<DashboardSecretaire />} />
        <Route path="agenda" element={<AgendaSecretaire />} />
        <Route path="calendrier" element={<CalendrierSecretaire />} />
        <Route path="clients" element={<ClientsSecretaire />} />
        <Route path="clients/:id" element={<ClientDetails />} />
        <Route path="dossiers" element={<DossiersSecretaire />} />
        <Route path="dossiers/:id" element={<DossierDetail />} />
        <Route path="taches" element={<TachesSecretaire />} />
        <Route path="bureau" element={<GestionBureau />} />
        <Route path="messages" element={<MessagerieSecretaire />} />
        <Route path="affaires" element={<AffairesJuridiques />} />
        <Route path="staff" element={<Staffsec />} />
        <Route path="staff/:id" element={<StaffDetail />} />
        <Route path="barreau" element={<MembresDuBarreau />} />
        <Route path="barreau/:id" element={<MembreDetail />} />
        <Route path="recherche" element={<RechercheGlobale />} />
        <Route path="profile" element={<ProfileSecretaire />} />
      </Route>

      {/* Stagiaire */}
      <Route path="/stagiaire" element={<PrivateRoute allowedRoles={['STAGIAIRE']}><LayoutStagiaire /></PrivateRoute>}>
        <Route path="dashboard" element={<DashboardStagiaire />} />
        <Route path="calendrier" element={<CalendrierStagiaire />} />
        <Route path="dossiers" element={<DossiersAssignes />} />
        <Route path="taches" element={<TachesStagiaire />} />
        <Route path="documents" element={<DocumentsStagiaire />} />
        <Route path="messages" element={<MessagerieStagiaire />} />
        <Route path="dossiers/:dossierId/documents" element={<Documentsdossier />} />
        <Route path="profile" element={<Profile />} />
      </Route>

      {/* Client */}
      <Route path="/client" element={<PrivateRoute allowedRoles={['CLIENT']}><LayoutClient /></PrivateRoute>}>
        <Route path="accueil" element={<DashboardClient />} />
        <Route path="dossiers" element={<MesDossiersClient />} />
        <Route path="dossiers/:id" element={<DossierDetailClient />} />
        <Route path="rendez-vous" element={<RendezVousClient />} />
        <Route path="rendez-vous/demande" element={<DmRendezVousClient />} />
        <Route path="factures" element={<ClientInvoices />} />
        <Route path="facture/:id" element={<FactureDetail />} />
        <Route path="messages" element={<MessagerieClient />} />
        <Route path="notifications" element={<NotificationsClient />} />
        <Route path="profile" element={<Profile />} />
      </Route>

      <Route path="/dashboard" element={<RoleRedirect />} />
      <Route path="*" element={<Navigate to="/login" />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}
