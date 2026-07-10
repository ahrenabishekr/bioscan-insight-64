import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { useState } from "react";

export const Route = createFileRoute("/reset-password")({
  component: ResetPassword,
  validateSearch: (s: Record<string, unknown>) => ({ token: (s.token as string) || "" }),
});

function ResetPassword() {
  const navigate = useNavigate();
  const { token } = useSearch({ from: "/reset-password" });
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (newPassword.length < 4) {
      setError("Password must be at least 4 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (!token) {
      setError("Missing or invalid reset link.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("https://chemosense-backend.onrender.com/api/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, new_password: newPassword }),
      });
      const data = await response.json();

      if (data.success) {
        setMessage("✅ Password reset successfully! Redirecting to login...");
        setTimeout(() => navigate({ to: "/login" }), 1500);
      } else {
        setError(data.error || "Reset failed. The link may have expired.");
      }
    } catch (err) {
      setError("❌ Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <h2 className="text-2xl font-bold mb-2">🔑 Reset Password</h2>
        <p className="text-gray-600 text-sm mb-6">Enter your new password below</p>

        {!token && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
            No reset token found. Please use the link from your email.
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <input
            type="password"
            placeholder="New password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
          <input
            type="password"
            placeholder="Confirm new password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 transition"
          >
            {loading ? "Resetting..." : "Reset Password"}
          </button>
        </form>

        {message && (
          <div className="mt-4 p-3 bg-green-50 text-green-700 rounded-lg text-sm">{message}</div>
        )}
        {error && (
          <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>
        )}

        <a href="/login" className="block text-center text-blue-600 text-sm mt-4 hover:underline">
          ← Back to Login
        </a>
      </div>
    </div>
  );
}
