# 🎓 Campus Lost & Found (MERN Stack)

A modern, full-stack **MERN** (MongoDB, Express.js, React, Node.js) Campus Lost & Found application featuring role-based authentication, real-time status management, dynamic filtering, and a responsive interface.

---

## 🚀 Key Features

- **⚡ React Frontend**: Modern Single Page Application (SPA) built with React 19 and Vite.
- **🍃 MongoDB & Mongoose Backend**: Scalable document storage with schemas, validation, and auto-seeding.
- **✋ In-App Ownership Claiming**: Students can file claims on found items with proof of ownership (scratches, lockscreen wallpapers, serial numbers).
- **📋 Claim Verification & Handover Drawer**: Repositories & Admins review submitted claims and approve/reject them with custom notes.
- **🔍 Smart Auto-Match Algorithm**: Intelligent similarity scoring matching Lost reports against active Found reports by category, keywords, and location.
- **📍 Physical Custody Tracking**: Designates where found items are held (Campus Security Desk, Library Front Desk, With Finder).
- **🔐 Role-Based Access Control (RBAC)**:
  - **Student**: Submit reports, browse items, mark/reopen own reports, and file ownership claims.
  - **Admin**: Full authority to manage reports, approve claims, mark returned, or delete any report.
- **📊 Real-time Dashboard**: Live counters for total reports, lost items, found items, and returned items.
- **🛡️ Secure Authentication**: JWT session handling, HttpOnly cookies, and password hashing via `bcryptjs`.
- **🌱 Automated Database Seeding**: Auto-populates demo accounts and sample items when MongoDB connects.
- **🌐 MongoDB Live Status Indicator**: Live pill in the header showing whether MongoDB is connected or awaiting configuration.

---

## 👥 Demo Accounts

| Role | Username | Password | Permissions |
|---|---|---|---|
| **Student** | `student1` | `student123` | Submit reports, update own reports |
| **Admin** | `admin` | `admin123` | Manage and update all campus reports |

*(You can also register a new student or administrator account directly from the UI).*

---

## 🗄️ Setting Up MongoDB

You can connect your MongoDB in **either** of two ways:

### Option A: MongoDB Atlas (Free Cloud Database - Recommended)
1. Go to [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas) and sign in.
2. Create a free M0 cluster.
3. In **Database Access**, create a user with a password.
4. In **Network Access**, add `0.0.0.0/0` (allow access from anywhere).
5. Click **Connect** → **Drivers** and copy the connection string.
6. Open `.env` in `campus-lost-found/` and paste:
   ```env
   MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/campus_lost_found?retryWrites=true&w=majority
   ```

### Option B: Local MongoDB (Community Server)
1. Install and start [MongoDB Community Server](https://www.mongodb.com/try/download/community).
2. The default `.env` is already configured for local MongoDB:
   ```env
   MONGODB_URI=mongodb://127.0.0.1:27017/campus_lost_found
   ```

---

## 💻 How to Run

### 1. Install Dependencies
Open terminal in the `campus-lost-found` directory:
```bash
npm install
npm install --prefix client
```

### 2. Development Mode (Hot Reloading)
Runs both the Express API (`http://localhost:5000`) and the Vite React server (`http://localhost:5173`) concurrently:
```bash
npm run dev
```
Open **`http://localhost:5173`** in your browser.

### 3. Production Mode (Single Command)
Builds the React frontend and serves both API and React SPA from Express:
```bash
npm run build
npm start
```
Open **`http://localhost:5000`** in your browser.

---

## 📁 Project Structure

```text
campus-lost-found/
├── .env                      # Environment configuration (PORT, MONGODB_URI, JWT_SECRET)
├── .env.example              # Template for environment variables
├── server.js                 # Express server & API mount
├── config/
│   └── db.js                 # Mongoose connection & status checker
├── models/
│   ├── User.js               # Mongoose User schema & password hashing
│   └── Item.js               # Mongoose Item schema with validation
├── routes/
│   ├── authRoutes.js         # /api/auth (login, register, logout, me)
│   └── itemRoutes.js         # /api/items (CRUD & status updates)
├── middleware/
│   └── auth.js               # JWT authentication & role authorization
├── seed.js                   # Automated seeder for demo accounts & sample items
├── client/                   # React Frontend (Vite)
│   ├── index.html
│   ├── vite.config.js        # Vite config with /api proxy to port 5000
│   └── src/
│       ├── App.jsx           # Main application view & state
│       ├── main.jsx          # React DOM entry with AuthProvider
│       ├── index.css         # Modern campus design system
│       ├── context/
│       │   └── AuthContext.jsx # Global user auth state
│       ├── services/
│       │   └── api.js        # Centralized fetch API client
│       └── components/
│           ├── Navbar.jsx
│           ├── Hero.jsx
│           ├── StatsGrid.jsx
│           ├── Filters.jsx
│           ├── ItemsGrid.jsx
│           ├── ItemCard.jsx
│           ├── ReportForm.jsx
│           ├── UserAccessBanner.jsx
│           ├── DbStatusBadge.jsx
│           └── AuthModal.jsx
```

---

## 📡 REST API Reference

| Method | Endpoint | Description | Access |
|---|---|---|---|
| `POST` | `/api/auth/register` | Register new account | Public |
| `POST` | `/api/auth/login` | Login (issues JWT & cookie) | Public |
| `POST` | `/api/auth/logout` | Clear session cookie | Logged in |
| `GET` | `/api/auth/me` | Fetch logged-in user profile | Logged in |
| `GET` | `/api/items` | Fetch all reports with ownership flag | Public / Logged in |
| `POST` | `/api/items` | Submit a new lost/found report | Logged in |
| `PUT` | `/api/items/:id/status`| Update status (`active` / `returned`) | Owner or Admin |
| `DELETE` | `/api/items/:id` | Delete report from MongoDB | Owner or Admin |
| `GET` | `/api/status` | MongoDB connection & health check | Public |
