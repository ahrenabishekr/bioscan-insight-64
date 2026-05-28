import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

export const Route = createFileRoute("/forgot-password")({
  component: ForgotPassword,
});

function ForgotPassword() {
  const [studentId, setStudentId] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setError("");

    try {
      const response = await fetch("https://chemosense-backend-production.up.railway.app/api/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ student_id: studentId.toUpperCase() }),
      });

      const data = await response.json();

      if (data.success) {
        setMessage("✅ Password reset link sent! Check your email.");
        setStudentId("");
      } else {
        setError(data.error || "Student ID not found");
      }
    } catch (err) {
      setError("❌ Network error. Make sure backend is running.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <h2 className="text-2xl font-bold mb-2">🔐 Forgot Password?</h2>
        <p className="text-gray-600 text-sm mb-6">
          Enter your Student ID and we'll send you a reset link
        </p>

        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Student ID (e.g., BIO2026001)"
            value={studentId}
            onChange={(e) => setStudentId(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 transition"
          >
            {loading ? "Sending..." : "Send Reset Link"}
          </button>
        </form>

        {message && (
          <div className="mt-4 p-3 bg-green-50 text-green-700 rounded-lg text-sm">
            {message}
          </div>
        )}

        {error && (
          <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}

        <a
          href="/"
          className="block text-center text-blue-600 text-sm mt-4 hover:underline"
        >
          ← Back to Login
        </a>
      </div>
    </div>
  );
}
