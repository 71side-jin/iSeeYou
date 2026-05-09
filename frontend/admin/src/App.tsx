import { useEffect, useState } from "react";

import "./App.css";

import AnalysisList from "./pages/AnalysisList";
import LoginPage from "./pages/LoginPage";

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("admin_access_token");

    setIsAuthenticated(!!token);
  }, []);

  function handleLoginSuccess() {
    setIsAuthenticated(true);
  }

  if (!isAuthenticated) {
    return (
      <LoginPage
        onLoginSuccess={handleLoginSuccess}
      />
    );
  }

  return <AnalysisList />;
}