import { Routes, Route } from "react-router-dom";
import { useEffect } from "react";
import Sidebar from "./components/layout/Sidebar";
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
import TestReport from "./components/test/TestReport";

import DescolagemPage from "./components/descolagem/DescolagemPage";
import DescolagemReport from "./components/descolagem/DescolagemReport";

export default function App() {
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
  }, []);

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="app-content">
        <Routes>
          <Route path="/" element={<Home />} />

          {/* Employee */}
          <Route path="/employee" element={<EmployeeList />} />
          <Route path="/employee/register" element={<EmployeeForm />} />
          <Route path="/employee/edit/:registration" element={<EmployeeEdit />} />

          {/* Mark */}
          <Route path="/mark" element={<MarkList />} />
          <Route path="/mark/register" element={<MarkRegister />} />
          <Route path="/mark/edit/:mark" element={<MarkEdit />} />

          {/* Product */}
          <Route path="/product" element={<ProductList />} />
          <Route path="/product/register" element={<ProductRegister />} />
          <Route path="/product/edit/:uuid" element={<ProductEdit />} />

          {/* Sector */}
          <Route path="/sector" element={<SectorList />} />
          <Route path="/sector/register" element={<SectorRegister />} />
          <Route path="/sector/edit/:nome" element={<SectorEdit />} />
          <Route path="/sector/view/:nome" element={<SectorInfo />} />

          {/* Model */}
          <Route path="/model" element={<ModelList />} />
          <Route path="/model/register" element={<ModelRegister />} />
          <Route path="/model/edit/:uuid" element={<ModelEdit />} />
          <Route path="/model/view/:nome" element={<ModelInfo />} />

          {/* Test */}
          <Route path="/test" element={<TestList />} />
          <Route path="/test/register" element={<TestRegister />} />
          <Route path="/test/report" element={<TestReport />} />

          {/* Descolagem */}
          <Route path="/descolagem" element={<DescolagemPage />} />
          <Route path="/descolagem/report" element={<DescolagemReport />} />
        </Routes>
      </main>
    </div>
  );
}
