import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Auth from "./pages/auth";
import Feed from "./pages/feed";
import CreatePost from "./pages/createPost";
import Profile from "./pages/profile";

// Redirects to Login (/) if no token is found
function ProtectedRoute({ children }) {
  const token = localStorage.getItem("token");
  return token ? children : <Navigate to="/" replace />;
}

export default function App() {
  const token = localStorage.getItem("token");

  return (
    <BrowserRouter>
      <Routes>
        {/* First page is Login; if already logged in, go straight to /feed */}
        <Route
          path="/"
          element={token ? <Navigate to="/feed" replace /> : <Auth />}
        />

        {/* Protected pages */}
        <Route
          path="/feed"
          element={
            <ProtectedRoute>
              <Feed />
            </ProtectedRoute>
          }
        />
        <Route
          path="/create"
          element={
            <ProtectedRoute>
              <CreatePost />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile/:id"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
