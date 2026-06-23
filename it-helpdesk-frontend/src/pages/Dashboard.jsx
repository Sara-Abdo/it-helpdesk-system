import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

const STATUS_COLORS = {
  Open: "#22c55e",
  "In Progress": "#eab308",
  Pending: "#a855f7",
  Resolved: "#3b82f6",
  Closed: "#9ca3af",
};

const PRIORITY_COLORS = {
  Low: "#9ca3af",
  Medium: "#3b82f6",
  High: "#f97316",
  Critical: "#ef4444",
};

const statusBadgeColors = {
  Open: "bg-green-100 text-green-600",
  "In Progress": "bg-yellow-100 text-yellow-600",
  Pending: "bg-purple-100 text-purple-600",
  Resolved: "bg-blue-100 text-blue-600",
  Closed: "bg-gray-100 text-gray-500",
};

export default function Dashboard({ children }) {
  const [user, setUser] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [stats, setStats] = useState({
    open: 0,
    inProgress: 0,
    resolved: 0,
    total: 0,
    byStatus: [],
    byPriority: [],
    recentTickets: [],
  });
  const navigate = useNavigate();

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (!stored) {
      navigate("/");
    } else {
      const parsedUser = JSON.parse(stored);
      setUser(parsedUser);
      fetchStats();
      fetchUnreadCount();
    }
  }, []);

  const fetchStats = () => {
    const token = localStorage.getItem("token");
    axios.get("http://localhost:5000/api/users/dashboard-stats", {
      headers: { Authorization: `Bearer ${token}` },
    }).then((res) => setStats(res.data)).catch((err) => console.error("dashboard-stats failed:", err));
  };

  const fetchUnreadCount = () => {
    const token = localStorage.getItem("token");
    axios.get("http://localhost:5000/api/notifications/unread-count", {
      headers: { Authorization: `Bearer ${token}` },
    }).then((res) => setUnreadCount(res.data.count)).catch(() => {});
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  if (!user) return null;

  const byStatus = (stats.byStatus || []).filter((s) => s.count > 0);
  const byPriority = stats.byPriority || [];
  const recentTickets = stats.recentTickets || [];

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
            <a href="/notifications" className="px-3 py-2 hover:bg-gray-100 rounded flex justify-between items-center">
              <span>Notifications</span>
              {unreadCount > 0 && (
                <span className="bg-red-500 text-white text-xs rounded-full px-2 py-0.5">{unreadCount}</span>
              )}
            </a>
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

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-white rounded-lg shadow p-4">
                  <h3 className="font-bold mb-2">Tickets by Status</h3>
                  {byStatus.length === 0 ? (
                    <p className="text-gray-400 text-sm py-12 text-center">No ticket data yet.</p>
                  ) : (
                    <ResponsiveContainer width="100%" height={250}>
                      <PieChart>
                        <Pie data={byStatus} dataKey="count" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={(entry) => entry.name + ": " + entry.count}>
                          {byStatus.map((entry, index) => (
                            <Cell key={index} fill={STATUS_COLORS[entry.name] || "#cbd5e1"} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </div>

                <div className="bg-white rounded-lg shadow p-4">
                  <h3 className="font-bold mb-2">Tickets by Priority</h3>
                  {byPriority.length === 0 || byPriority.every((p) => p.count === 0) ? (
                    <p className="text-gray-400 text-sm py-12 text-center">No ticket data yet.</p>
                  ) : (
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={byPriority}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis allowDecimals={false} />
                        <Tooltip />
                        <Bar dataKey="count">
                          {byPriority.map((entry, index) => (
                            <Cell key={index} fill={PRIORITY_COLORS[entry.name] || "#cbd5e1"} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>

              <h2 className="text-xl font-bold mb-4">Recent Tickets</h2>
              <div className="bg-white rounded-lg shadow p-4">
                {recentTickets.length === 0 ? (
                  <p className="text-gray-400 text-sm">No tickets yet.</p>
                ) : (
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
                      <tr>
                        <th className="px-3 py-2 text-left">Reference</th>
                        <th className="px-3 py-2 text-left">Title</th>
                        <th className="px-3 py-2 text-left">Priority</th>
                        <th className="px-3 py-2 text-left">Status</th>
                        <th className="px-3 py-2 text-left">Created</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {recentTickets.map((t) => (
                        <tr key={t.ID} className="cursor-pointer hover:bg-gray-50" onClick={() => navigate("/tickets/" + t.ID)}>
                          <td className="px-3 py-2 font-mono text-xs">{t.ReferenceNumber}</td>
                          <td className="px-3 py-2">{t.Title}</td>
                          <td className="px-3 py-2">{t.PriorityName}</td>
                          <td className="px-3 py-2">
                            <span className={"px-2 py-1 rounded-full text-xs font-medium " + (statusBadgeColors[t.StatusName] || "")}>
                              {t.StatusName}
                            </span>
                          </td>
                          <td className="px-3 py-2">{new Date(t.CreatedAt).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}