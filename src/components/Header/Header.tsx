import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./Header.scss";
import logoImage from "../../../public/images/ilustr.png";

import {
  isAuthenticated,
  getAuthUser,
  logout,
} from "../../utils/auth";

export function Header() {
  const navigate = useNavigate();
  const user = getAuthUser();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (!menuOpen) return;

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };

    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [menuOpen]);

  function handleLogout() {
    setMenuOpen(false);
    logout();
    navigate("/");
    window.location.reload(); // просте оновлення стану
  }

  return (
    <header className="site-header" role="banner">
      <div className="site-header__inner">
        <div className="site-header__brand">
          <Link to="/" className="logo-wrap" onClick={() => setMenuOpen(false)}>
            <img src={logoImage} alt="PreFinder" className="logo-image" />
          </Link>
        </div>

        <button
          type="button"
          className={`nav-toggle ${menuOpen ? "is-open" : ""}`}
          aria-expanded={menuOpen}
          aria-controls="main-navigation"
          aria-label={menuOpen ? "Close navigation" : "Open navigation"}
          onClick={() => setMenuOpen((open) => !open)}
        >
          <span />
          <span />
          <span />
        </button>

        <nav
          id="main-navigation"
          className={`site-header__nav ${menuOpen ? "is-open" : ""}`}
          role="navigation"
          aria-label="Main"
        >
          <Link
            to="/explore"
            className="nav__btn nav__btn--ghost"
            onClick={() => setMenuOpen(false)}
          >
            Explore
          </Link>
          <Link
            to="/favorites"
            className="nav__btn nav__btn--ghost"
            onClick={() => setMenuOpen(false)}
          >
            ❤️ Favorites
          </Link>

          {isAuthenticated() ? (
            <div className="nav__user">
              <span className="nav__email">{user.email}</span>
              <button
                type="button"
                className="nav__btn nav__btn--primary"
                onClick={handleLogout}
              >
                Logout
              </button>
            </div>
          ) : (
            <button
              type="button"
              className="nav__btn nav__btn--primary"
              onClick={() => {
                setMenuOpen(false);
                navigate("/login");
              }}
            >
              Sign in
            </button>
          )}
        </nav>
      </div>
    </header>
  );
}
