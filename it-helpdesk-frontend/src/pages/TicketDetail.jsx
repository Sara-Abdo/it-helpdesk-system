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
  const [workLogs, setWorkLogs] = useState([]);
  const [comment, setComment] = useState("");
  const [agents, setAgents] = useState([]);
  const [assignedTo, setAssignedTo] = useState("");
  const [statusID, setStatusID] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [workLog, setWorkLog] = useState({ startTime: "", endTime: "", notes: "" });

  useEffect(() => {
    fetchTicket();
    fetchHistory();
    fetchWorkLogs();
    if (user.role === "Admin" || user.role === "Manager") {
      fetchAgents();
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

  const fetchWorkLogs = () => {
    axios.get(`http://localhost:5000/api/worklogs/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    }).then((res) => setWorkLogs(res.data));
  };

  const fetchAgents = () => {
    axios.get("http://localhost:5000/api/users/workload", {
      headers: { Authorization: `Bearer ${token}` },
    }).then((res) => setAgents(res.data));
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

  const handleLogWork = async () => {
    if (!workLog.startTime || !workLog.endTime) {
      setError("Start and end time are required");
      return;
    }
    try {
      const res = await axios.post(`http://localhost:5000/api/worklogs/${id}`,
        workLog,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSuccess(`Work logged: ${res.data.duration} minutes`);
      setWorkLog({ startTime: "", endTime: "", notes: "" });
      fetchWorkLogs();
      fetchHistory();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to log work");
    }
  };

  if (!ticket) return <div className="p-6">Loading...</div>;

  const isClosed = ticket.StatusID === 5;
  const isAssignedAgent = user.role === "IT Support Agent" && ticket.AssignedToID === user.id;

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
          <div><span className="font-medium">Created:</span> {new Date(ticket.CreatedAt).toLocaleString()}</div>
          <div><span className="font-medium">Last updated:</span> {new Date(ticket.UpdatedAt).toLocaleString()}</div>
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

      {isAssignedAgent && !isClosed && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h3 className="font-bold mb-4">Log Work Time</h3>
          <div className="grid grid-cols-2 gap-4 mb-3">
            <div>
              <label className="block text-sm font-medium mb-1">Start Time</label>
              <input
                type="datetime-local"
                className="w-full border border-gray-300 rounded px-3 py-2"
                value={workLog.startTime}
                onChange={(e) => setWorkLog({ ...workLog, startTime: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">End Time</label>
              <input
                type="datetime-local"
                className="w-full border border-gray-300 rounded px-3 py-2"
                value={workLog.endTime}
                onChange={(e) => setWorkLog({ ...workLog, endTime: e.target.value })}
              />
            </div>
          </div>
          <div className="mb-3">
            <label className="block text-sm font-medium mb-1">Notes (optional)</label>
            <input
              type="text"
              className="w-full border border-gray-300 rounded px-3 py-2"
              placeholder="What did you work on?"
              value={workLog.notes}
              onChange={(e) => setWorkLog({ ...workLog, notes: e.target.value })}
            />
          </div>
          <button onClick={handleLogWork} className="bg-black text-white px-4 py-2 rounded hover:bg-gray-800">
            Log Work
          </button>
        </div>
      )}

      {workLogs.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h3 className="font-bold mb-4">Work Log</h3>
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
              <tr>
                <th className="px-3 py-2 text-left">Agent</th>
                <th className="px-3 py-2 text-left">Start</th>
                <th className="px-3 py-2 text-left">End</th>
                <th className="px-3 py-2 text-left">Duration</th>
                <th className="px-3 py-2 text-left">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {workLogs.map((w, i) => (
                <tr key={i}>
                  <td className="px-3 py-2">{w.UserName}</td>
                  <td className="px-3 py-2">{new Date(w.StartTime).toLocaleString()}</td>
                  <td className="px-3 py-2">{new Date(w.EndTime).toLocaleString()}</td>
                  <td className="px-3 py-2">{w.Duration} min</td>
                  <td className="px-3 py-2">{w.Notes || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
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
                  <p className="text-xs mt-1 opacity-60">{new Date(c.CreatedAt).toLocaleString()}</p>
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
        <div className="relative">
          <div className="absolute left-2 top-0 bottom-0 w-0.5 bg-gray-200"></div>
          <div className="space-y-4">
            {history.length === 0 ? (
              <p className="text-gray-400 text-sm">No history yet.</p>
            ) : (
              history.map((h, i) => (
                <div key={i} className="flex items-start gap-4 pl-6 relative">
                  <div className="absolute left-0 w-4 h-4 rounded-full bg-black border-2 border-white"></div>
                  <div>
                    <p className="text-sm font-medium">{h.Action}</p>
                    <p className="text-xs text-gray-400">by {h.UserName} — {new Date(h.Timestamp).toLocaleString()}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {success && <p className="text-green-500 text-sm mt-4">{success}</p>}
      {error && <p className="text-red-500 text-sm mt-4">{error}</p>}
    </div>
  );
}