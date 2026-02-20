import { useState } from "react";
import "./App.scss";
import { Routes, Route } from "react-router-dom";

import { ResultsPage } from "./pages/ResultsPage/ResultsPage";
import { Header } from "./components/Header/Header";
import { HeroSection } from "./components/HeroSection/HeroSection";
import { MovieDetailsPage } from "./pages/MovieDetailsPage/MovieDetailsPage";
import { LoginPage } from "./pages/LoginPage/LoginPage";
import { ExplorePage } from "./pages/ExplorePage/ExplorePage";
import { FavoritesPage } from "./pages/FavoritesPage/FavoritesPage";

export const App: React.FC = () => {
  return (
    <div className="app">
      <Header />

      <Routes>
        <Route path="/favorites" element={<FavoritesPage />} />
        <Route path="/explore" element={<ExplorePage />} />
        <Route path="/" element={<HeroSection />} />
        <Route path="/results" element={<ResultsPage />} />
        <Route path="/movie/:id" element={<MovieDetailsPage />} />
        <Route path="/login" element={<LoginPage />} />
      </Routes>
    </div>
  );
};

{
  /* <Route
  path="/results"
  element={
    <ProtectedRoute>
      <ResultsPage />
    </ProtectedRoute>
  }
/> */
}
