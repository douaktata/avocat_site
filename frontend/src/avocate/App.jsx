import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Calendrier from './pages/Calendrier';
import Statistiques from './pages/Statistiques';
import TodoList from './pages/TodoList';
import Messagerie from './pages/Messagerie';
import Recherche from './pages/Recherche';
import GestionBureau from './pages/GestionBureau';
import Clients from './pages/Clients';
import AffaireJudiciaire from './pages/AffaireJudiciaire';
import Paiements from './pages/Paiements';
import Membres from './pages/Membres';
import Staff from './pages/Staff';
import './App.css';
function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/indexav" replace />} />
          <Route path="indexav" element={<Dashboard />} />
          <Route path="calendrier" element={<Calendrier />} />
          <Route path="stat" element={<Statistiques />} />
          <Route path="tdl" element={<TodoList />} />
          <Route path="msg" element={<Messagerie />} />
          <Route path="recherche" element={<Recherche />} />
          <Route path="gestion" element={<GestionBureau />} />
          <Route path="clients" element={<Clients />} />
          <Route path="affjud" element={<AffaireJudiciaire />} />
          <Route path="paiements" element={<Paiements />} />
          <Route path="membre" element={<Membres />} />
          <Route path="staff" element={<Staff />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
