# TaskFlow — Team Task Manager

## Live URL
*(To be added after deployment)*

## GitHub Repo
*(To be added)*

## Tech Stack
- **Frontend**: React + Vite + Vanilla CSS + Zustand + Dnd-Kit + Recharts
- **Backend**: Node.js + Express
- **AI**: Groq SDK (Llama 3.3 & 3.1)
- **Database**: PostgreSQL + Prisma ORM
- **Auth**: JWT
- **Deployment**: Railway

## Features

### 🤖 AI-Powered Intelligence
- **✨ AI Task Generator**: Transform goals into Epics and Subtasks instantly using Llama 3.
- **🤖 Project Co-Pilot**: Context-aware floating chat assistant that knows your project's overdue tasks and team status.
- **💡 Smart Priority Predictor**: Real-time AI suggestions for task type and priority while you type.
- **📊 AI Project Health Advisor**: High-level audits on the dashboard with health status and risk analysis.

### Core Functionality
- Authentication (Signup/Login with JWT)
- Role-Based Access (Admin/Member per project)
- Project Management (create, manage members)
- Task Management (create, assign, track status)
- Kanban Board with drag-and-drop
- Dashboard with stats and interactive charts (Recharts)

## Setup (Local)

### Backend
```bash
cd backend
cp .env.example .env   # Fill in DATABASE_URL and JWT_SECRET
npm install
npx prisma migrate dev
npm run dev
```

### Frontend
```bash
cd frontend
cp .env.example .env   # Set VITE_API_URL=http://localhost:3000/api
npm install
npm run dev
```

## API Documentation
See `backend/src/routes` for full REST API implementation.

## Deployment
Configured for Railway using:
- PostgreSQL plugin for the database
- `railway.json` for Nixpacks builder
- Separate env configurations for frontend (`.env.production`)
