import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import API_URL from "../config.js";

export default function Notifications() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = () => {
    axios.get(`${API_URL}/api/notifications`, {
      headers: { Authorization: `Bearer ${token}` },
    }).then((res) => setNotifications(res.data)).catch(() => {});
  };

  const handleClick = async (n) => {
    if (!n.IsRead) {
      try {
        await axios.put(`${API_URL}/api/notifications/` + n.ID + "/read", {}, {
          headers: { Authorization: `Bearer ${token}` },
        });
      } catch (err) {}
    }
    if (n.TicketID) {
      navigate("/tickets/" + n.TicketID);
    } else {
      fetchNotifications();
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await axios.put(`${API_URL}/api/notifications/read-all`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchNotifications();
    } catch (err) {}
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Notifications</h2>
        <button onClick={handleMarkAllRead} className="text-sm text-gray-500 hover:underline">
          Mark all as read
        </button>
      </div>

      <div className="bg-white rounded-lg shadow">
        {notifications.length === 0 ? (
          <p className="text-gray-400 text-sm p-6">No notifications yet.</p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {notifications.map((n) => (
              <li
                key={n.ID}
                onClick={() => handleClick(n)}
                className={"px-4 py-3 cursor-pointer hover:bg-gray-50 flex justify-between items-start " + (n.IsRead ? "" : "bg-blue-50")}
              >
                <div>
                  <p className={n.IsRead ? "text-sm text-gray-600" : "text-sm font-medium text-gray-900"}>
                    {n.Message}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(n.CreatedAt).toLocaleString()}
                  </p>
                </div>
                {!n.IsRead && <span className="w-2 h-2 rounded-full bg-blue-500 mt-1"></span>}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}