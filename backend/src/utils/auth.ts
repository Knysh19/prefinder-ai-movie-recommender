const AUTH_KEY = "prefinder_auth";

export function login(email: string) {
  localStorage.setItem(
    AUTH_KEY,
    JSON.stringify({
      email,
      loggedInAt: Date.now(),
    })
  );
}

export function logout() {
  localStorage.removeItem(AUTH_KEY);
}

export function getAuthUser() {
  const raw = localStorage.getItem(AUTH_KEY);
  return raw ? JSON.parse(raw) : null;
}

export function isAuthenticated() {
  return !!getAuthUser();
}
