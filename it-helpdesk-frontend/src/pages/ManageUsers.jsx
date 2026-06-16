import { useEffect, useState } from "react";
import axios from "axios";

export default function ManageUsers() {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [form, setForm] = useState({ name: "", email: "", password: "", roleID: "" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user"));

  useEffect(() => {
    if (user.role !== "Admin" && user.role !== "Manager") {
      window.location.href = "/dashboard";
    }
    fetchUsers();
    fetchRoles();
  }, []);

  const fetchUsers = () => {
    axios.get("http://localhost:5000/api/users", {
      headers: { Authorization: `Bearer ${token}` },
    }).then((res) => setUsers(res.data));
  };

  const fetchRoles = () => {
    axios.get("http://localhost:5000/api/users/roles", {
      headers: { Authorization: `Bearer ${token}` },
    }).then((res) => setRoles(res.data));
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    try {
      await axios.post("http://localhost:5000/api/users", form, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSuccess("User created successfully");
      setForm({ name: "", email: "", password: "", roleID: "" });
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create user");
    }
  };

  const handleDeactivate = async (id) => {
    if (!window.confirm("Deactivate this user?")) return;
    try {
      await axios.put(`http://localhost:5000/api/users/${id}/deactivate`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchUsers();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to deactivate user");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this user? This cannot be undone.")) return;
    try {
      await axios.delete(`http://localhost:5000/api/users/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchUsers();
    } catch (err) {
      alert(err.response?.data?.message || "Cannot delete this user. Deactivate instead.");
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold mb-6">Manage Users</h2>

      {user.role === "Admin" && (
        <div className="bg-white rounded-lg shadow p-6 mb-6 max-w-xl">
          <h3 className="font-bold mb-4">Create New User</h3>
          <form onSubmit={handleCreateUser}>
            <div className="mb-3">
              <label className="block text-sm font-medium mb-1">Full Name</label>
              <input
                type="text"
                className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-black"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>
            <div className="mb-3">
              <label className="block text-sm font-medium mb-1">Email</label>
              <input
                type="email"
                className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-black"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
            </div>
            <div className="mb-3">
              <label className="block text-sm font-medium mb-1">Password</label>
              <input
                type="password"
                className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-black"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Role</label>
              <select
                className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-black"
                value={form.roleID}
                onChange={(e) => setForm({ ...form, roleID: e.target.value })}
                required
              >
                <option value="">Select role</option>
                {roles.map((r) => (
                  <option key={r.ID} value={r.ID}>{r.Name}</option>
                ))}
              </select>
            </div>
            {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
            {success && <p className="text-green-500 text-sm mb-3">{success}</p>}
            <button type="submit" className="bg-black text-white px-6 py-2 rounded hover:bg-gray-800">
              Create User
            </button>
          </form>
        </div>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
            <tr>
              <th className="px-4 py-3 text-left">Name</th>
              <th className="px-4 py-3 text-left">Email</th>
              <th className="px-4 py-3 text-left">Role</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-left">Created</th>
              {user.role === "Admin" && <th className="px-4 py-3 text-left">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {users.map((u) => (
              <tr key={u.ID} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">{u.Name}</td>
                <td className="px-4 py-3">{u.Email}</td>
                <td className="px-4 py-3">{u.RoleName}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${u.IsActive ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"}`}>
                    {u.IsActive ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-400">{new Date(u.CreatedAt).toLocaleDateString()}</td>
                {user.role === "Admin" && (
                  <td className="px-4 py-3 flex gap-2">
                    {u.IsActive ? (
                      <button onClick={() => handleDeactivate(u.ID)} className="text-yellow-600 hover:underline text-xs">
                        Deactivate
                      </button>
                    ) : null}
                    <button onClick={() => handleDelete(u.ID)} className="text-red-500 hover:underline text-xs">
                      Delete
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}