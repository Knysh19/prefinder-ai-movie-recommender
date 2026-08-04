import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import type { ReactNode } from "react";
import type { Movie } from "../components/MovieCard/MovieCard";
import { useAuth } from "./AuthContext";

type FavoritesContextType = {
  favorites: Movie[];
  isFavorite: (id: number) => boolean;
  toggleFavorite: (movie: Movie) => void;
};

const FavoritesContext = createContext<FavoritesContextType | null>(null);

const STORAGE_KEY = "favoriteMovies";

function readFavorites(storageKey: string): Movie[] {
  const stored =
    localStorage.getItem(storageKey) ??
    (storageKey === `${STORAGE_KEY}:guest`
      ? localStorage.getItem(STORAGE_KEY)
      : null);
  if (!stored) return [];

  try {
    const parsed: unknown = JSON.parse(stored);
    return Array.isArray(parsed) ? (parsed as Movie[]) : [];
  } catch (error) {
    console.error("Invalid favorites in localStorage", error);
    localStorage.removeItem(storageKey);
    return [];
  }
}

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const storageKey = user ? `${STORAGE_KEY}:${user.id}` : `${STORAGE_KEY}:guest`;
  const [favoritesByKey, setFavoritesByKey] = useState<
    Record<string, Movie[]>
  >(() => {
    const guestKey = `${STORAGE_KEY}:guest`;
    return { [guestKey]: readFavorites(guestKey) };
  });
  const favorites = useMemo(
    () => favoritesByKey[storageKey] ?? readFavorites(storageKey),
    [favoritesByKey, storageKey],
  );

  const isFavorite = useCallback(
    (id: number) => favorites.some((movie) => movie.id === id),
    [favorites],
  );

  const toggleFavorite = useCallback(
    (movie: Movie) => {
      const nextFavorites = favorites.some((item) => item.id === movie.id)
        ? favorites.filter((item) => item.id !== movie.id)
        : [...favorites, movie];

      localStorage.setItem(storageKey, JSON.stringify(nextFavorites));
      setFavoritesByKey((current) => ({
        ...current,
        [storageKey]: nextFavorites,
      }));
    },
    [favorites, storageKey],
  );

  const value = useMemo(
    () => ({ favorites, isFavorite, toggleFavorite }),
    [favorites, isFavorite, toggleFavorite],
  );

  return (
    <FavoritesContext.Provider value={value}>
      {children}
    </FavoritesContext.Provider>
  );
}

// The hook stays in this module to preserve the project's original public API.
// eslint-disable-next-line react-refresh/only-export-components
export function useFavorites() {
  const context = useContext(FavoritesContext);
  if (!context) {
    throw new Error("useFavorites must be used inside FavoritesProvider");
  }
  return context;
}
