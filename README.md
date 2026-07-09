IT Help Desk & Ticketing Management System
Full Stack Web Development Internship Project — Integrated Digital Systems

Deployment Note
Deployment was attempted (Railway) but not completed due to tooling limitations 
with multi-statement SQL imports. The application is fully functional and 
demonstrated locally, with instructions provided below under "How to Run."

Week 1 Deliverables

* ERD Diagram
* Workflow Diagram
* UI Wireframes (Login, Dashboard, Create Ticket)
* Database Schema (SQL)

Week 2 Deliverables

* React.js + Tailwind CSS frontend
* Node.js + Express backend
* MySQL database with all 11 tables
* JWT Authentication
* Login page connected to backend
* Role-based Dashboard

Week 3 Deliverables

* Full ticket management system (Create, Read, Update, Delete)
* Ticket categories and priority with color coding
* Ticket detail page with status and assignment management
* Comment system (chat style)
* Ticket history and audit log
* Manage Users page (Admin only)
* Create new users with role assignment
* Role-based access control across all pages

Week 4 Deliverables

* Ticket assignment system with agent workload visibility
* Ticket workflow logic (status transitions, reassignment tracking)
* Work log system (IT agents log time spent per ticket)
* Enhanced ticket history with timeline view
* User deactivation (admin only)
* User deletion with data integrity check
* Role-based dashboard stats (each role sees their own data)

Week 5 Deliverables

* Role-based access control on tickets, history, comments, and work logs, including refined permission boundaries between Manager and Admin
* Activity log redesigned to manual-style entries instead of auto-generated noise
* API responses trimmed to explicit columns instead of SELECT *
* File attachments (upload, view, remove per ticket) with type and size validation
* IT Support Agent status update capability for smoother ticket workflow
* Dashboard analytics with charts (status and priority breakdown) and recent tickets
* Notification system with unread badge and dedicated notifications page
* Ticket deletion logic with full data integrity across related records
* Clear error handling for edge cases such as reassigned or inaccessible tickets

Tech Stack

* Frontend: React.js, Tailwind CSS, Recharts
* Backend: Node.js, Express, Multer
* Database: MySQL
* Authentication: JWT

Project Structure
it-helpdesk/
├── it-helpdesk-frontend/ (React app)
└── it-helpdesk-backend/ (Node.js API)

Requirements

* Node.js installed
* MySQL installed and running locally
* Database: ithelpdesk (import schema.sql to set up)

How to Run

Step 1 — Start the backend
cd it-helpdesk-backend
npm start
Backend runs on http://localhost:5000

Step 2 — Start the frontend
cd it-helpdesk-frontend
npm run dev
Frontend runs on http://localhost:5173

User Roles

* Admin — full system access, manages users and all tickets
* Manager — oversees all tickets, can reassign to agents
* IT Support Agent — manages and resolves assigned tickets
* Employee — creates and tracks their own tickets

GitHub
https://github.com/Sara-Abdo/it-helpdesk-system
