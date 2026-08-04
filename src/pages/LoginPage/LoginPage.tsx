import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import "./LoginPage.scss";

type AuthMode = "sign-in" | "sign-up";
type LoginLocationState = {
  from?: { pathname?: string; search?: string };
};

function getReturnPath(state: unknown) {
  const from = (state as LoginLocationState | null)?.from;
  return from?.pathname ? `${from.pathname}${from.search ?? ""}` : "/";
}

export function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<AuthMode>("sign-in");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{
    type: "error" | "success";
    text: string;
  } | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isLoading, configurationError, signIn, signUp } = useAuth();
  const returnPath = getReturnPath(location.state);

  useEffect(() => {
    if (!isLoading && user) navigate(returnPath, { replace: true });
  }, [isLoading, navigate, returnPath, user]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);

    if (password.length < 8) {
      setMessage({
        type: "error",
        text: "Password must contain at least 8 characters.",
      });
      return;
    }

    setIsSubmitting(true);
    const result =
      mode === "sign-in"
        ? await signIn(email, password)
        : await signUp(email, password);
    setIsSubmitting(false);

    if (result.error) {
      setMessage({ type: "error", text: result.error });
      return;
    }

    if (result.requiresEmailConfirmation) {
      setMessage({
        type: "success",
        text: "Account created. Check your email to confirm it, then sign in.",
      });
      setMode("sign-in");
      setPassword("");
    }
  }

  function switchMode() {
    setMode((current) => (current === "sign-in" ? "sign-up" : "sign-in"));
    setMessage(null);
    setPassword("");
  }

  const isSignIn = mode === "sign-in";

  return (
    <section className="login-hero">
      <div className="login-card">
        <h1 className="login-title">
          {isSignIn ? "Welcome back" : "Create account"}
        </h1>
        <p className="login-subtitle">
          {isSignIn
            ? "Sign in to access your personal favorites"
            : "Create an account to keep your movie collection private"}
        </p>

        <form className="login-form" onSubmit={handleSubmit}>
          <div className="input-group">
            <input
              id="auth-email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <label htmlFor="auth-email">Email</label>
          </div>

          <div className="input-group">
            <input
              id="auth-password"
              type="password"
              minLength={8}
              autoComplete={isSignIn ? "current-password" : "new-password"}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <label htmlFor="auth-password">Password</label>
          </div>

          {(configurationError || message) && (
            <p
              className={`login-message ${
                message?.type === "success" ? "is-success" : "is-error"
              }`}
              role={message?.type === "success" ? "status" : "alert"}
            >
              {configurationError ?? message?.text}
            </p>
          )}

          <button
            type="submit"
            className="login-btn"
            disabled={isSubmitting || isLoading || Boolean(configurationError)}
          >
            {isSubmitting
              ? "Please wait…"
              : isSignIn
                ? "Sign in"
                : "Create account"}
          </button>
        </form>

        <button
          type="button"
          className="login-switch"
          onClick={switchMode}
          disabled={isSubmitting}
        >
          {isSignIn
            ? "New to PreFinder? Create an account"
            : "Already have an account? Sign in"}
        </button>

        <div className="login-footer">Secure authentication by Supabase.</div>
      </div>
    </section>
  );
}
