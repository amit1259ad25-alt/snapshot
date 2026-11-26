import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    const endpoint = isLogin ? "/login" : "/register";
    const body = isLogin ? { email, password } : { name, username, email, password };

    try {
      const res = await fetch(`${API_URL}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();

      if (!res.ok) return setError(data.message || "Authentication failed");

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      navigate("/feed");
    } catch (err) {
      setError("Server error. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center p-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm bg-zinc-900 border border-zinc-800 p-6 rounded-xl space-y-4"
      >
        <h2 className="text-xl font-bold text-center">
          {isLogin ? "Login" : "Create Account"}
        </h2>
        {error && <p className="text-red-400 text-xs text-center">{error}</p>}

        {!isLogin && (
          <>
            <input
              type="text"
              placeholder="Full Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm"
            />
            <input
              type="text"
              placeholder="Username (e.g. amit_shah)"
              value={username}
              onChange={(e) =>
                setUsername(e.target.value.toLowerCase().replace(/\s+/g, "_"))
              }
              required
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm"
            />
          </>
        )}

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm"
        />

        <button className="w-full bg-emerald-500 text-black font-semibold py-2 rounded-lg text-sm">
          {isLogin ? "Sign In" : "Sign Up"}
        </button>

        <p
          onClick={() => setIsLogin(!isLogin)}
          className="text-xs text-center text-zinc-400 cursor-pointer hover:text-white"
        >
          {isLogin
            ? "Don't have an account? Register"
            : "Already have an account? Login"}
        </p>
      </form>
    </div>
  );
}
