import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import TicketList from "./pages/TicketList";
import CreateTicket from "./pages/CreateTicket";
import TicketDetail from "./pages/TicketDetail";
import ManageUsers from "./pages/ManageUsers";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/tickets" element={<Dashboard><TicketList /></Dashboard>} />
        <Route path="/tickets/new" element={<Dashboard><CreateTicket /></Dashboard>} />
        <Route path="/tickets/:id" element={<Dashboard><TicketDetail /></Dashboard>} />
        <Route path="/users" element={<Dashboard><ManageUsers /></Dashboard>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;