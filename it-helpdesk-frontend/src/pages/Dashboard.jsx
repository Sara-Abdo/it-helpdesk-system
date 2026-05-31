import { useEffect, useState } from "react";

export default function Dashboard() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (!stored) {
      window.location.href = "/";
    } else {
      setUser(JSON.parse(stored));
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/";
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Top navbar */}
      <div className="bg-black text-white px-6 py-3 flex justify-between items-center">
        <span className="font-bold text-lg">IT Help Desk</span>
        <div className="flex items-center gap-4">
          <span className="text-sm">{user.name}</span>
          <button
            onClick={handleLogout}
            className="text-sm bg-gray-700 px-3 py-1 rounded hover:bg-gray-600"
          >
            Logout
          </button>
        </div>
      </div>

      <div className="flex">
        {/* Sidebar */}
        <div className="w-52 bg-white min-h-screen shadow p-4">
          <nav className="flex flex-col gap-2">
            <a href="/dashboard" className="font-semibold bg-gray-100 px-3 py-2 rounded">Dashboard</a>
            <a href="#" className="px-3 py-2 hover:bg-gray-100 rounded">My Tickets</a>
            <a href="#" className="px-3 py-2 hover:bg-gray-100 rounded">New Ticket</a>
            <hr className="my-2" />
            <a href="#" className="px-3 py-2 hover:bg-gray-100 rounded">Notifications</a>
            {user.role === "Admin" && (
              <>
                <hr className="my-2" />
                <span className="text-xs text-gray-400 px-3">— Admin only —</span>
                <a href="#" className="px-3 py-2 hover:bg-gray-100 rounded">Manage Users</a>
                <a href="#" className="px-3 py-2 hover:bg-gray-100 rounded">Reports</a>
                <a href="#" className="px-3 py-2 hover:bg-gray-100 rounded">Settings</a>
              </>
            )}
          </nav>
        </div>

        {/* Main content */}
        <div className="flex-1 p-6">
          <h2 className="text-xl font-bold mb-4">Overview</h2>
          <div className="grid grid-cols-4 gap-4 mb-6">
            {[
              { label: "Open", value: 0 },
              { label: "In Progress", value: 0 },
              { label: "Resolved", value: 0 },
              { label: "Total", value: 0 },
            ].map((stat) => (
              <div key={stat.label} className="bg-white rounded-lg shadow p-4 text-center">
                <p className="text-3xl font-bold">{stat.value}</p>
                <p className="text-gray-500 text-sm mt-1">{stat.label}</p>
              </div>
            ))}
          </div>

          <h2 className="text-xl font-bold mb-4">Recent tickets</h2>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-gray-400 text-sm">No tickets yet.</p>
          </div>
        </div>
      </div>
    </div>
  );
}