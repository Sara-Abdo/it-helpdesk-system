import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

export default function Dashboard({ children }) {
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({ open: 0, inProgress: 0, resolved: 0, total: 0 });
  const navigate = useNavigate();

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (!stored) {
      navigate("/");
    } else {
      const parsedUser = JSON.parse(stored);
      setUser(parsedUser);
      fetchStats(parsedUser);
    }
  }, []);

  const fetchStats = (parsedUser) => {
    const token = localStorage.getItem("token");
    axios.get("http://localhost:5000/api/users/dashboard-stats", {
      headers: { Authorization: `Bearer ${token}` },
    }).then((res) => setStats(res.data)).catch(() => {});
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-black text-white px-6 py-3 flex justify-between items-center">
        <span className="font-bold text-lg cursor-pointer" onClick={() => navigate("/dashboard")}>
          IT Help Desk
        </span>
        <div className="flex items-center gap-4">
          <span className="text-sm">{user.name}</span>
          <span className="text-xs bg-gray-700 px-2 py-1 rounded">{user.role}</span>
          <button onClick={handleLogout} className="text-sm bg-gray-700 px-3 py-1 rounded hover:bg-gray-600">
            Logout
          </button>
        </div>
      </div>

      <div className="flex">
        <div className="w-52 bg-white min-h-screen shadow p-4">
          <nav className="flex flex-col gap-2">
            <a href="/dashboard" className="px-3 py-2 hover:bg-gray-100 rounded">Dashboard</a>
            <a href="/tickets" className="px-3 py-2 hover:bg-gray-100 rounded">My Tickets</a>
            {(user.role === "Admin" || user.role === "Manager" || user.role === "Employee") && (
              <a href="/tickets/new" className="px-3 py-2 hover:bg-gray-100 rounded">New Ticket</a>
            )}
            <hr className="my-2" />
            <a href="#" className="px-3 py-2 hover:bg-gray-100 rounded">Notifications</a>
            {(user.role === "Admin" || user.role === "Manager") && (
              <>
                <hr className="my-2" />
                <span className="text-xs text-gray-400 px-3">— Admin only —</span>
                <a href="/users" className="px-3 py-2 hover:bg-gray-100 rounded">Manage Users</a>
                <a href="#" className="px-3 py-2 hover:bg-gray-100 rounded">Reports</a>
                <a href="#" className="px-3 py-2 hover:bg-gray-100 rounded">Settings</a>
              </>
            )}
          </nav>
        </div>

        <div className="flex-1">
          {children ? children : (
            <div className="p-6">
              <h2 className="text-xl font-bold mb-4">Overview</h2>
              <div className="grid grid-cols-4 gap-4 mb-6">
                {[
                  { label: "Open", value: stats.open },
                  { label: "In Progress", value: stats.inProgress },
                  { label: "Resolved", value: stats.resolved },
                  { label: "Total", value: stats.total },
                ].map((stat) => (
                  <div key={stat.label} className="bg-white rounded-lg shadow p-4 text-center">
                    <p className="text-3xl font-bold">{stat.value}</p>
                    <p className="text-gray-500 text-sm mt-1">{stat.label}</p>
                  </div>
                ))}
              </div>
              <h2 className="text-xl font-bold mb-4">Recent Tickets</h2>
              <div className="bg-white rounded-lg shadow p-4">
                <p className="text-gray-400 text-sm">Click "My Tickets" to view your tickets.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}