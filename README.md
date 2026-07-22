# AIA Insurance - Zonal Zonal Management System

A web application designed for the AIA Insurance Zonal Manager in Sri Lanka. This portal facilitates managing employee hierarchies, customer policies, and task assignments via a DevOps-style Kanban board.

## Features

- **Organizational Hierarchy**: Visualize Branch Managers, Unit Leaders, and Advisors in an interactive tree map. Calculates total customer coverage dynamically.
- **Customer Directory**: Add, update, and manage customer policies. Any employee can create and edit; only the Zonal Manager can delete records.
- **DevOps Task Board**: Kanban board (To Do, In Progress, Completed columns) supporting HTML5 Drag & Drop. Zonal Manager can assign tasks; employees can update statuses of tasks assigned to them.
- **Sri Lankan NIC Validation**: Full support and validation for both old (9 digits + V/X) and new (12 digits) National Identity Card formats.
- **Access Controls & Authorization**: Fully gated routes using JSON Web Tokens (JWT). Accounts can be activated/inactivated by the Zonal Manager.

---

## Tech Stack

- **Frontend**: React.js (Vite), Vanilla CSS (glassmorphism dashboard design), Lucide React.
- **Backend**: Node.js, Express, Mongoose.
- **Database**: MongoDB (Local or MongoDB Atlas).

---

## Getting Started

### 1. Installation
Install all dependencies for root, backend, and frontend directories:
```bash
npm run install:all
```

### 2. Environment Setup
Configure your database URI in the `.env` file under the `/backend` folder:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/aia-insurance
JWT_SECRET=supersecretjwtkeyforaiainsuranceproject123!
NODE_ENV=development
```

### 3. Database Seeding
To populate the database with a default Zonal Manager, Branch Manager, Unit Leaders, Advisors, and test tasks:
```bash
npm run seed --prefix backend
```

### 4. Running the Application (Local Development)

Start the Express API server:
```bash
npm run dev:backend
```

In a separate terminal, start the Vite development server:
```bash
npm run dev:frontend
```

The React app will proxy requests to the backend API automatically. Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## Seed Accounts (For Testing)

| Role | Email | Password |
|---|---|---|
| **Zonal Manager** (Client) | `zonal.manager@aia.lk` | `adminpassword123` |
| **Branch Manager** | `saman.bm@aia.lk` | `password123` |
| **Unit Leader** | `nirmala.ul@aia.lk` | `password123` |
| **Advisor** | `amal.adv@aia.lk` | `password123` |
