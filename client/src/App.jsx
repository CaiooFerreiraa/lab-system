import { Routes, Route } from "react-router-dom";
import { useEffect } from "react";
import { useAuth } from "./contexts/AuthContext";

import Sidebar from "./components/layout/Sidebar";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import LoginPage from "./components/auth/LoginPage";
import Home from "./components/Home";

import EmployeeList from "./components/employee/EmployeeList";
import EmployeeForm from "./components/employee/EmployeeForm";
import EmployeeEdit from "./components/employee/EmployeeEdit";

import MarkList from "./components/mark/MarkList";
import MarkRegister from "./components/mark/MarkRegister";
import MarkEdit from "./components/mark/MarkEdit";

import ProductList from "./components/product/ProductList";
import ProductRegister from "./components/product/ProductRegister";
import ProductEdit from "./components/product/ProductEdit";

import SectorList from "./components/sector/SectorList";
import SectorRegister from "./components/sector/SectorRegister";
import SectorEdit from "./components/sector/SectorEdit";
import SectorInfo from "./components/sector/SectorInfo";

import ModelList from "./components/model/ModelList";
import ModelRegister from "./components/model/ModelRegister";
import ModelEdit from "./components/model/ModelEdit";
import ModelInfo from "./components/model/ModelInfo";

import TestList from "./components/test/TestList";
import TestRegister from "./components/test/TestRegister";
import TestEdit from "./components/test/TestEdit";
import LaudoDetails from "./components/test/LaudoDetails";
import TestReport from "./components/test/TestReport";

import DescolagemPage from "./components/descolagem/DescolagemPage";
import DescolagemReport from "./components/descolagem/DescolagemReport";
import MSCList from "./components/msc/MSCList";
import MSCRegister from "./components/msc/MSCRegister";

import BalancaList from "./components/balanca/BalancaList";
import BalancaRegister from "./components/balanca/BalancaRegister";
import UserManagement from "./components/auth/UserManagement";
import ProductionOptions from "./components/production/ProductionOptions";
import SettingsPage from "./components/config/SettingsPage";

export default function App() {
  const { isAuthenticated, loading } = useAuth();

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
  }, []);

  // Enquanto carrega a autenticação, mostra loading
  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner" />
      </div>
    );
  }

  // Rota de login (sem sidebar)
  if (!isAuthenticated) {
    return (
      <Routes>
        <Route path="*" element={<LoginPage />} />
      </Routes>
    );
  }

  // Layout autenticado (com sidebar)
  return (
    <div className="app-layout">
      <Sidebar />
      <main className="app-content">
        <Routes>
          <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />

          {/* Employee */}
          <Route path="/employee" element={<ProtectedRoute><EmployeeList /></ProtectedRoute>} />
          <Route path="/employee/register" element={<ProtectedRoute><EmployeeForm /></ProtectedRoute>} />
          <Route path="/employee/edit/:registration" element={<ProtectedRoute><EmployeeEdit /></ProtectedRoute>} />

          {/* Mark */}
          <Route path="/mark" element={<ProtectedRoute><MarkList /></ProtectedRoute>} />
          <Route path="/mark/register" element={<ProtectedRoute><MarkRegister /></ProtectedRoute>} />
          <Route path="/mark/edit/:mark" element={<ProtectedRoute><MarkEdit /></ProtectedRoute>} />

          {/* Product */}
          <Route path="/product" element={<ProtectedRoute><ProductList /></ProtectedRoute>} />
          <Route path="/product/register" element={<ProtectedRoute><ProductRegister /></ProtectedRoute>} />
          <Route path="/product/edit/:uuid" element={<ProtectedRoute><ProductEdit /></ProtectedRoute>} />

          {/* Sector */}
          <Route path="/sector" element={<ProtectedRoute><SectorList /></ProtectedRoute>} />
          <Route path="/sector/register" element={<ProtectedRoute><SectorRegister /></ProtectedRoute>} />
          <Route path="/sector/edit/:nome" element={<ProtectedRoute><SectorEdit /></ProtectedRoute>} />
          <Route path="/sector/view/:nome" element={<ProtectedRoute><SectorInfo /></ProtectedRoute>} />

          {/* Model */}
          <Route path="/model" element={<ProtectedRoute><ModelList /></ProtectedRoute>} />
          <Route path="/model/register" element={<ProtectedRoute><ModelRegister /></ProtectedRoute>} />
          <Route path="/model/edit/:uuid" element={<ProtectedRoute><ModelEdit /></ProtectedRoute>} />
          <Route path="/model/view/:nome" element={<ProtectedRoute><ModelInfo /></ProtectedRoute>} />

          {/* Test & Laudo */}
          <Route path="/test" element={<ProtectedRoute><TestList /></ProtectedRoute>} />
          <Route path="/test/register" element={<ProtectedRoute><TestRegister /></ProtectedRoute>} />
          <Route path="/test/edit/:id" element={<ProtectedRoute><TestEdit /></ProtectedRoute>} />
          <Route path="/laudo/:id" element={<ProtectedRoute><LaudoDetails /></ProtectedRoute>} />
          <Route path="/test/report" element={<ProtectedRoute><TestReport /></ProtectedRoute>} />

          {/* Descolagem */}
          <Route path="/descolagem" element={<ProtectedRoute><DescolagemPage /></ProtectedRoute>} />
          <Route path="/descolagem/report" element={<ProtectedRoute><DescolagemReport /></ProtectedRoute>} />

          {/* MSC */}
          <Route path="/msc" element={<ProtectedRoute><MSCList /></ProtectedRoute>} />
          <Route path="/msc/register" element={<ProtectedRoute><MSCRegister /></ProtectedRoute>} />
          <Route path="/msc/edit/:id" element={<ProtectedRoute><MSCRegister /></ProtectedRoute>} />

          {/* Balancas */}
          <Route path="/balancas" element={<ProtectedRoute><BalancaList /></ProtectedRoute>} />
          <Route path="/balanca/register" element={<ProtectedRoute><BalancaRegister /></ProtectedRoute>} />
          <Route path="/balanca/edit/:id" element={<ProtectedRoute><BalancaRegister /></ProtectedRoute>} />

          {/* Admin: Gerenciamento de Usuários e Produção */}
          <Route path="/users" element={<ProtectedRoute><UserManagement /></ProtectedRoute>} />
          <Route path="/production/settings" element={<ProtectedRoute><ProductionOptions /></ProtectedRoute>} />
          <Route path="/advanced/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />

          {/* Fallback login */}
          <Route path="/login" element={<LoginPage />} />
        </Routes>
      </main>
    </div>
  );
}
