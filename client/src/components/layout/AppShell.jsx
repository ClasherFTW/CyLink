import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../features/auth/AuthContext";

const navItems = [
  { to: "/app", label: "Questions" },
  { to: "/app?saved=1", label: "Saved" },
  { to: "/app/profile", label: "Profile" },
  { to: "/app/chat", label: "Chat" },
];

function AppShell({ title, subtitle, actions, children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const isSavedView = location.pathname === "/app" && location.search.includes("saved=1");

  async function handleLogout() {
    await logout();
    navigate("/auth", { replace: true });
  }

  return (
    <div className="so-shell">
      <aside className="so-sidebar">
        <div className="so-sidebar__brand">
          <span className="brand-link">
            citrus
            <span className="brand-link__dot" />
          </span>
        </div>

        <nav className="so-sidebar__nav">
          {navItems.map((item) => (
            <Link
              key={item.label}
              to={item.to}
              className={`so-nav-item ${
                item.label === "Questions"
                  ? location.pathname === "/app" && !isSavedView
                    ? "is-active"
                    : ""
                  : item.label === "Saved"
                    ? isSavedView
                      ? "is-active"
                      : ""
                    : location.pathname === item.to
                      ? "is-active"
                      : ""
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="so-sidebar__foot">
          <p>Logged in as</p>
          <strong>{user?.username || "developer"}</strong>
          <small>{user?.reputation ?? 0} reputation</small>
        </div>
      </aside>

      <div className="so-main">
        <header className="so-topbar">
          <div>
            <h1>{title}</h1>
            {subtitle ? <p>{subtitle}</p> : null}
          </div>

          <div className="so-topbar__actions">
            {actions}
            <button type="button" className="btn btn--ghost" onClick={() => navigate("/app/profile")}>
              My Profile
            </button>
            <button type="button" className="btn btn--ghost" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </header>

        <main className="so-content">{children}</main>
      </div>
    </div>
  );
}

export default AppShell;
