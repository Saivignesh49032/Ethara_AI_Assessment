# 🚀 TaskFlow AI — The Next-Gen Intelligent Project Manager

TaskFlow AI is a high-performance, AI-augmented project management platform designed to streamline team collaboration. Built with a focus on speed, beautiful aesthetics, and deep AI integration, it transforms how teams manage tasks from conception to completion.

---

## 🌐 Live Demo & Repository
- **Live URL**: [Visit TaskFlow AI](https://etharaaiassessment-production-d094.up.railway.app/)
- **GitHub**: [Saivignesh49032/Ethara_AI_Assessment](https://github.com/Saivignesh49032/Ethara_AI_Assessment)

---

## 🤖 AI-Powered Features (The "Wow" Factor)

TaskFlow isn't just a Kanban board; it's an intelligent assistant powered by **Groq & Llama 3**.

### ✨ AI Task Generator
Stop manually typing dozens of subtasks. Simply enter a project goal (e.g., "Build a React Authentication Flow"), and TaskFlow will:
- Generate a comprehensive **Epic**.
- Break it down into logical **Subtasks**.
- Automatically assign types (TASK, BUG, STORY) and predicted priorities.

### 🤖 Context-Aware Project Co-Pilot
A floating intelligent assistant that lives in your project. It doesn't just chat; it **knows** your data.
- "Which tasks are overdue?"
- "Who is overloaded this week?"
- "Summarize the current progress of the Login feature."

### 💡 Smart Priority Predictor
As you type a task title, TaskFlow's real-time inference engine predicts the **Priority** (URGENT, HIGH, MEDIUM, LOW) and **Type** (BUG, TASK, etc.), saving seconds on every entry.

### 📊 AI Project Health Advisor
Located on the dashboard, this high-reasoning auditor analyzes your project velocity and warns you of potential bottlenecks or "Red Zones" before they happen.

---

## 🛠 Tech Stack

### Frontend
- **React 19 + Vite**: Ultra-fast HMR and modern rendering.
- **Vanilla CSS**: Premium, custom-crafted design system with glassmorphism and smooth animations.
- **Zustand**: Lightweight, high-performance state management.
- **Dnd-Kit**: Sophisticated drag-and-drop for the Kanban experience.
- **Recharts**: Dynamic velocity and work distribution visualization.

### Backend
- **Node.js & Express**: Scalable RESTful API architecture.
- **Prisma ORM**: Type-safe database interactions with PostgreSQL.
- **Groq SDK**: Blazing fast AI inference using Llama 3 models.
- **JWT**: Secure, stateless authentication.

---

## 📱 Mobile-First Design
TaskFlow is fully responsive. It features a custom **Mobile Bottom Navigation** bar and touch-optimized Kanban controls, ensuring a premium experience on phones, tablets, and desktops.

---

## ⚙️ Local Setup Guide

### 1. Prerequisites
- Node.js (v18+)
- PostgreSQL or Docker

### 2. Backend Setup
```bash
cd backend
cp .env.example .env
# Update .env with your DATABASE_URL and GROQ_API_KEY
npm install
npx prisma db push
npm run dev
```

### 3. Frontend Setup
```bash
cd frontend
cp .env.example .env
# Set VITE_API_URL=http://localhost:5000/api
npm install
npm run dev
```

---

## 🛡️ Security & Reliability
- **CORS Protection**: Hardened for cross-origin production safety.
- **Database Safety**: Schema synchronization via `preDeployCommand` in Railway.
- **Fail-Safe AI**: Intelligent fallback mechanisms if AI services are temporarily unreachable.

---

*This project was developed as part of the Ethara AI Assessment.*
