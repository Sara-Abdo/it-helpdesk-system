import { useState, useEffect } from "react";
import axios from "axios";
import API_URL from "../config.js";
import { useNavigate } from "react-router-dom";

export default function CreateTicket() {
  const [form, setForm] = useState({ title: "", description: "", categoryID: "", priorityID: "" });
  const [categories, setCategories] = useState([]);
  const [priorities, setPriorities] = useState([]);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  useEffect(() => {
    axios.get("${API_URL}/api/tickets/meta", {
      headers: { Authorization: `Bearer ${token}` },
    }).then((res) => {
      setCategories(res.data.categories);
      setPriorities(res.data.priorities);
    });
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await axios.post("${API_URL}/api/tickets", form, {
        headers: { Authorization: `Bearer ${token}` },
      });
      navigate("/tickets");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create ticket");
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h2 className="text-xl font-bold mb-6">Submit a New Ticket</h2>
      <div className="bg-white rounded-lg shadow p-6">
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Ticket Title *</label>
            <input
              type="text"
              placeholder="Short description of the issue"
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-black"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-1">Category *</label>
              <select
                className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-black"
                value={form.categoryID}
                onChange={(e) => setForm({ ...form, categoryID: e.target.value })}
                required
              >
                <option value="">Select category</option>
                {categories.map((c) => (
                  <option key={c.ID} value={c.ID}>{c.Name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Priority *</label>
              <select
                className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-black"
                value={form.priorityID}
                onChange={(e) => setForm({ ...form, priorityID: e.target.value })}
                required
              >
                <option value="">Select priority</option>
                {priorities.map((p) => (
                  <option key={p.ID} value={p.ID}>{p.Name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Description *</label>
            <textarea
              rows={5}
              placeholder="Describe the issue in detail — what happened, when, and what you have already tried..."
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-black"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              required
            />
          </div>

          {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

          <div className="flex gap-3">
            <button type="submit" className="bg-black text-white px-6 py-2 rounded hover:bg-gray-800">
              Submit Ticket
            </button>
            <button type="button" onClick={() => navigate("/tickets")} className="border border-gray-300 px-6 py-2 rounded hover:bg-gray-50">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}