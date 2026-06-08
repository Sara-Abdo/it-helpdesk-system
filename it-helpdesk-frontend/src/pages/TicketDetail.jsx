import { useEffect, useState } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";

const statusColors = {
  Open: "bg-green-100 text-green-600",
  "In Progress": "bg-yellow-100 text-yellow-600",
  Pending: "bg-purple-100 text-purple-600",
  Resolved: "bg-blue-100 text-blue-600",
  Closed: "bg-gray-100 text-gray-500",
};

const priorityColors = {
  Low: "bg-gray-100 text-gray-600",
  Medium: "bg-blue-100 text-blue-600",
  High: "bg-orange-100 text-orange-600",
  Critical: "bg-red-100 text-red-600",
};

export default function TicketDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user"));

  const [ticket, setTicket] = useState(null);
  const [history, setHistory] = useState([]);
  const [comment, setComment] = useState("");
  const [agents, setAgents] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [assignedTo, setAssignedTo] = useState("");
  const [statusID, setStatusID] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    fetchTicket();
    fetchHistory();
    if (user.role === "Admin" || user.role === "Manager") {
      fetchAgents();
      fetchStatuses();
    }
  }, []);

  const fetchTicket = () => {
    axios.get(`http://localhost:5000/api/tickets/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    }).then((res) => {
      setTicket(res.data);
      setAssignedTo(res.data.AssignedToID || "");
      setStatusID(res.data.StatusID || "");
    });
  };

  const fetchHistory = () => {
    axios.get(`http://localhost:5000/api/tickets/${id}/history`, {
      headers: { Authorization: `Bearer ${token}` },
    }).then((res) => setHistory(res.data));
  };

  const fetchAgents = () => {
    axios.get("http://localhost:5000/api/users/workload", {
      headers: { Authorization: `Bearer ${token}` },
    }).then((res) => setAgents(res.data));
  };

  const fetchStatuses = () => {
    axios.get("http://localhost:5000/api/tickets/meta", {
      headers: { Authorization: `Bearer ${token}` },
    }).then((res) => setStatuses(res.data.statuses || []));
  };

  const handleAddComment = async () => {
    if (!comment.trim()) return;
    try {
      await axios.post(`http://localhost:5000/api/tickets/${id}/comments`,
        { content: comment },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setComment("");
      fetchTicket();
      fetchHistory();
      setSuccess("Comment added");
      setTimeout(() => setSuccess(""), 2000);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to add comment");
    }
  };

  const handleUpdate = async () => {
    try {
      await axios.put(`http://localhost:5000/api/tickets/${id}`,
        { statusID, assignedToID: assignedTo },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchTicket();
      fetchHistory();
      setSuccess("Ticket updated");
      setTimeout(() => setSuccess(""), 2000);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update ticket");
    }
  };

  if (!ticket) return <div className="p-6">Loading...</div>;

  const isClosed = ticket.StatusID === 5;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <button onClick={() => navigate("/tickets")} className="text-sm text-gray-500 hover:underline mb-4 block">
        ← Back to tickets
      </button>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <p className="text-xs text-gray-400 font-mono mb-1">{ticket.ReferenceNumber}</p>
            <h2 className="text-xl font-bold">{ticket.Title}</h2>
          </div>
          <div className="flex gap-2">
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${priorityColors[ticket.PriorityName]}`}>
              {ticket.PriorityName}
            </span>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[ticket.StatusName]}`}>
              {ticket.StatusName}
            </span>
          </div>
        </div>

        <p className="text-gray-600 mb-4">{ticket.Description}</p>

        <div className="grid grid-cols-3 gap-4 text-sm text-gray-500">
          <div><span className="font-medium">Category:</span> {ticket.CategoryName}</div>
          <div><span className="font-medium">Created by:</span> {ticket.CreatedByName}</div>
          <div><span className="font-medium">Assigned to:</span> {ticket.AssignedToName || "Unassigned"}</div>
        </div>
      </div>

      {(user.role === "Admin" || user.role === "Manager") && !isClosed && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h3 className="font-bold mb-4">Update Ticket</h3>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-1">Assign To</label>
              <select
                className="w-full border border-gray-300 rounded px-3 py-2"
                value={assignedTo}
                onChange={(e) => setAssignedTo(e.target.value)}
              >
                <option value="">Unassigned</option>
                {agents.map((a) => (
                  <option key={a.ID} value={a.ID}>
                    {a.Name} ({a.TotalAssigned} tickets)
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Status</label>
              <select
                className="w-full border border-gray-300 rounded px-3 py-2"
                value={statusID}
                onChange={(e) => setStatusID(e.target.value)}
              >
                <option value="1">Open</option>
                <option value="2">In Progress</option>
                <option value="3">Pending</option>
                <option value="4">Resolved</option>
                <option value="5">Closed</option>
              </select>
            </div>
          </div>
          <button onClick={handleUpdate} className="bg-black text-white px-4 py-2 rounded hover:bg-gray-800">
            Save Changes
          </button>
        </div>
      )}

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h3 className="font-bold mb-4">Comments</h3>
        <div className="space-y-3 mb-4 max-h-64 overflow-y-auto">
          {ticket.comments?.length === 0 ? (
            <p className="text-gray-400 text-sm">No comments yet.</p>
          ) : (
            ticket.comments?.map((c, i) => (
              <div key={i} className={`flex ${c.UserID === user.id ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-xs px-4 py-2 rounded-lg text-sm ${c.UserID === user.id ? "bg-black text-white" : "bg-gray-100 text-gray-800"}`}>
                  <p className="font-medium text-xs mb-1">{c.UserName}</p>
                  <p>{c.Content}</p>
                </div>
              </div>
            ))
          )}
        </div>
        {!isClosed && (
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Write a comment..."
              className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-black"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddComment()}
            />
            <button onClick={handleAddComment} className="bg-black text-white px-4 py-2 rounded hover:bg-gray-800 text-sm">
              Send
            </button>
          </div>
        )}
        {isClosed && <p className="text-gray-400 text-sm mt-2">This ticket is closed. No new comments allowed.</p>}
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="font-bold mb-4">Ticket History</h3>
        <div className="space-y-2">
          {history.length === 0 ? (
            <p className="text-gray-400 text-sm">No history yet.</p>
          ) : (
            history.map((h, i) => (
              <div key={i} className="flex items-center gap-3 text-sm text-gray-600">
                <span className="w-2 h-2 rounded-full bg-black inline-block"></span>
                <span>{h.Action}</span>
                <span className="text-gray-400">by {h.UserName}</span>
                <span className="text-gray-400 ml-auto">{new Date(h.Timestamp).toLocaleString()}</span>
              </div>
            ))
          )}
        </div>
      </div>

      {success && <p className="text-green-500 text-sm mt-4">{success}</p>}
      {error && <p className="text-red-500 text-sm mt-4">{error}</p>}
    </div>
  );
}