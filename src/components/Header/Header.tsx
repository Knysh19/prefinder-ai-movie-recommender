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

  function handleLogout() {
    logout();
    navigate("/");
    window.location.reload(); // просте оновлення стану
  }

  return (
    <header className="site-header" role="banner">
      <div className="site-header__inner">
        <div className="site-header__brand">
          <Link to="/" className="logo-wrap">
            <img src={logoImage} alt="logo" className="logo-image" />
          </Link>
        </div>

        <nav className="site-header__nav" role="navigation" aria-label="Main">
          <Link to="/explore" className="nav__btn nav__btn--ghost">
            Explore
          </Link>
          <Link to="/favorites" className="nav__btn nav__btn--ghost">
            ❤️ Favorites
          </Link>

          {isAuthenticated() ? (
            <div className="nav__user">
              <span className="nav__email">{user.email}</span>
              <button
                className="nav__btn nav__btn--primary"
                onClick={handleLogout}
              >
                Logout
              </button>
            </div>
          ) : (
            <button
              className="nav__btn nav__btn--primary"
              onClick={() => navigate("/login")}
            >
              Sign in
            </button>
          )}
        </nav>
      </div>
    </header>
  );
}
