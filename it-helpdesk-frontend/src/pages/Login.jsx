import { useState } from "react";
import axios from "axios";
import API_URL from "../config.js";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const res = await axios.post("${API_URL}/api/auth/login", {
        email,
        password,
      });
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));
      window.location.href = "/dashboard";
    } catch (err) {
      setError("Invalid email or password");
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold text-center mb-2">IT Help Desk</h1>
        <p className="text-center text-gray-500 mb-6">
          Internal support portal — sign in to continue
        </p>
        <form onSubmit={handleLogin}>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">
              Email address
            </label>
            <input
              type="email"
              placeholder="user@company.com"
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-black"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="mb-2">
            <label className="block text-sm font-medium mb-1">Password</label>
            <input
              type="password"
              placeholder="••••••••"
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-black"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <div className="text-right mb-4">
            <a href="#" className="text-sm text-gray-500 hover:underline">
              Forgot password?
            </a>
          </div>
          {error && (
            <p className="text-red-500 text-sm mb-4 text-center">{error}</p>
          )}
          <button
            type="submit"
            className="w-full bg-black text-white py-2 rounded hover:bg-gray-800 transition"
          >
            Sign in
          </button>
        </form>
        <p className="text-center text-xs text-gray-400 mt-4">
          Admin-managed accounts only. Contact IT to request access.
        </p>
      </div>
    </div>
  );
}