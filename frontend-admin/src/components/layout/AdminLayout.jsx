import { useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { LuUsers, LuChartBar, LuLogOut, LuMenu, LuShieldCheck, LuLayoutGrid, LuCalendarDays, LuTriangleAlert, LuMapPin, LuWaypoints, LuCircleHelp, LuOctagonAlert, LuLightbulb } from "react-icons/lu";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import ThemeToggle from "../ui/ThemeToggle";
import "./AdminLayout.css";

const NAV = [
    { to: "/", label: "Utilisateurs", icon: LuUsers, end: true },
    { to: "/reports", label: "Signalements", icon: LuTriangleAlert },
    { to: "/planning", label: "Planning", icon: LuCalendarDays },
    { to: "/cases", label: "Page d'accueil", icon: LuLayoutGrid },
    { to: "/faq", label: "FAQ", icon: LuCircleHelp },
    { to: "/pois", label: "Points d'intérêt", icon: LuMapPin },
    { to: "/accidents", label: "Accidents", icon: LuOctagonAlert },
    { to: "/lighting", label: "Éclairage", icon: LuLightbulb },
    { to: "/graph", label: "Graphe", icon: LuWaypoints },
    { to: "/stats", label: "Statistiques", icon: LuChartBar, disabled: true },
];

export default function AdminLayout() {
    const { user, logout } = useAuth();
    const { mode, setMode } = useTheme();
    const [mobileOpen, setMobileOpen] = useState(false);

    const initials = (user?.first_name || user?.email || "?").charAt(0).toUpperCase();

    return (
        <div className="admin-shell">
            <aside className={`admin-sidebar ${mobileOpen ? "open" : ""}`}>
                <div className="admin-brand">
                    <LuShieldCheck size={22} />
                    <span>Sécu'Cycle <strong>Admin</strong></span>
                </div>
                <nav className="admin-nav">
                    {NAV.map(({ to, label, icon: Icon, disabled, end }) =>
                        disabled ? (
                            <span key={to} className="admin-nav-item disabled" title="Bientôt disponible">
                                <Icon size={18} />
                                <span>{label}</span>
                                <span className="admin-nav-soon">bientôt</span>
                            </span>
                        ) : (
                            <NavLink
                                key={to}
                                to={to}
                                end={end}
                                className={({ isActive }) => `admin-nav-item ${isActive ? "active" : ""}`}
                                onClick={() => setMobileOpen(false)}
                            >
                                <Icon size={18} />
                                <span>{label}</span>
                            </NavLink>
                        )
                    )}
                </nav>
            </aside>

            <div className="admin-main">
                <header className="admin-topbar">
                    <button
                        className="admin-burger"
                        onClick={() => setMobileOpen((v) => !v)}
                        aria-label="Menu"
                    >
                        <LuMenu size={22} />
                    </button>
                    <div className="admin-topbar-spacer" />
                    <ThemeToggle compact value={mode} onChange={setMode} />
                    <div className="admin-user">
                        <span className="admin-user-avatar">{initials}</span>
                        <span className="admin-user-name">
                            {[user?.first_name, user?.last_name].filter(Boolean).join(" ") || user?.email}
                        </span>
                    </div>
                    <button className="admin-logout" onClick={logout} title="Se déconnecter">
                        <LuLogOut size={18} />
                        <span>Déconnexion</span>
                    </button>
                </header>

                <main className="admin-content">
                    <Outlet />
                </main>
            </div>

            {mobileOpen && <div className="admin-backdrop" onClick={() => setMobileOpen(false)} />}
        </div>
    );
}
