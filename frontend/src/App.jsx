import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext.jsx";
import { Header } from "./components/layout/Header.jsx";
import { StatusBar } from "./components/layout/StatusBar.jsx";
import { HomePage } from "./pages/HomePage.jsx";
import { CompanyPage } from "./pages/CompanyPage.jsx";
import { LoginPage } from "./pages/LoginPage.jsx";
import { RegisterPage } from "./pages/RegisterPage.jsx";

export function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <div className="min-h-screen bg-terminal-bg text-slate-100 flex flex-col font-sans">
          <Header />
          <main className="flex-1">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/company/:ticker" element={<CompanyPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
            </Routes>
          </main>
          <StatusBar />
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
