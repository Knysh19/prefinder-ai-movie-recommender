import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { login } from "../../utils/auth";
import "./LoginPage.scss";

export function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!email || !password) return;

    login(email); // 💾 fake login
    navigate("/"); // 🚀 назад на головну
  }

  return (
    <section className="login-hero">
      <div className="login-card">
        <h1 className="login-title">Welcome back</h1>
        <p className="login-subtitle">
          Sign in to get personalized AI recommendations
        </p>

        <form className="login-form" onSubmit={handleSubmit}>
          <div className="input-group">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <label>Email</label>
          </div>

          <div className="input-group">
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <label>Password</label>
          </div>

          <button type="submit" className="login-btn">
            Sign in
          </button>
        </form>

        <div className="login-footer">
          AI-powered recommendations. Tailored for you.
        </div>
      </div>
    </section>
  );
}
