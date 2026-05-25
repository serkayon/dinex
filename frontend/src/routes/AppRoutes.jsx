import {
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";

import Dashboard from "../pages/Dashboard";
import Production from "../pages/Production";
import OEE from "../pages/OEE";
import Settings from "../pages/Settings";

export default function AppRoutes() {
  return (
    <div className="h-screen overflow-hidden bg-[#eef1f6]">
      {/* =========================
          TOPBAR
      ========================= */}

      <Topbar />

      {/* =========================
          BODY
      ========================= */}

      <div className="flex h-[calc(100vh-88px)]">
        {/* SIDEBAR */}
        <Sidebar />

        {/* MAIN */}
        <main
          className="
            flex-1
            overflow-y-auto
            p-4
            md:p-5
          "
        >
          <Routes>
            <Route
              path="/"
              element={
                <Navigate to="/dashboard" />
              }
            />

            <Route
              path="/dashboard"
              element={<Dashboard />}
            />

            <Route
              path="/production"
              element={<Production />}
            />

            <Route
              path="/oee"
              element={<OEE />}
            />

            <Route
              path="/settings"
              element={<Settings />}
            />
          </Routes>
        </main>
      </div>
    </div>
  );
}