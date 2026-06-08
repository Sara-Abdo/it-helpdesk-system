import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const priorityColors = {
  Low: "bg-gray-100 text-gray-600",
  Medium: "bg-blue-100 text-blue-600",
  High: "bg-orange-100 text-orange-600",
  Critical: "bg-red-100 text-red-600",
};

const statusColors = {
  Open: "bg-green-100 text-green-600",
  "In Progress": "bg-yellow-100 text-yellow-600",
  Pending: "bg-purple-100 text-purple-600",
  Resolved: "bg-blue-100 text-blue-600",
  Closed: "bg-gray-100 text-gray-500",
};

export default function TicketList() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  useEffect(() => {
    axios
      .get("http://localhost:5000/api/tickets", {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        setTickets(res.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this ticket?")) return;
    try {
      await axios.delete(`http://localhost:5000/api/tickets/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTickets(tickets.filter((t) => t.ID !== id));
    } catch (err) {
      alert(err.response?.data?.message || "Cannot delete this ticket");
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold">All Tickets</h2>
        <button
          onClick={() => navigate("/tickets/new")}
          className="bg-black text-white px-4 py-2 rounded hover:bg-gray-800"
        >
          + New Ticket
        </button>
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : tickets.length === 0 ? (
        <p className="text-gray-400">No tickets found.</p>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
              <tr>
                <th className="px-4 py-3 text-left">Reference</th>
                <th className="px-4 py-3 text-left">Title</th>
                <th className="px-4 py-3 text-left">Category</th>
                <th className="px-4 py-3 text-left">Priority</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Created By</th>
                <th className="px-4 py-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {tickets.map((ticket) => (
                <tr key={ticket.ID} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-xs">{ticket.ReferenceNumber}</td>
                  <td className="px-4 py-3 font-medium">{ticket.Title}</td>
                  <td className="px-4 py-3">{ticket.CategoryName}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${priorityColors[ticket.PriorityName]}`}>
                      {ticket.PriorityName}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[ticket.StatusName]}`}>
                      {ticket.StatusName}
                    </span>
                  </td>
                  <td className="px-4 py-3">{ticket.CreatedByName}</td>
                  <td className="px-4 py-3 flex gap-2">
                    <button
                      onClick={() => navigate(`/tickets/${ticket.ID}`)}
                      className="text-blue-600 hover:underline text-xs"
                    >
                      View
                    </button>
                    <button
                      onClick={() => handleDelete(ticket.ID)}
                      className="text-red-500 hover:underline text-xs"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}