# ECDAT Deployment Guide

This guide details how to deploy the Enterprise Cryptographic Discovery & Analysis Tool (ECDAT) to production environments without Docker.

---

## 🏗️ Architecture Overview

ECDAT supports **two production deployment models**:

```
Model 1: Unified Server (VPS / EC2 / Render Monolith)
┌─────────────────────────────────────────────────────────────┐
│  Single Server Instance (Node.js 20 + Python 3.10+)         │
│  - Frontend (Next.js): npm run start                       │
│  - Backend Engine: Invoked via local python child_process   │
└─────────────────────────────────────────────────────────────┘

Model 2: Decoupled Cloud Microservice (Vercel + Render / AWS)
┌───────────────────────────┐         HTTP REST API         ┌───────────────────────────┐
│ Next.js Frontend (Vercel) │ ────────────────────────────> │ FastAPI Backend (Render)  │
│ BACKEND_URL=https://...   │                               │ PORT=8000 python server.py│
└───────────────────────────┘                               └───────────────────────────┘
```

---

## 🚀 Deployment Option 1: Decoupled Cloud Services (Recommended for Vercel + Render / Railway)

### Step 1: Deploy Python Backend to Render / Railway / AWS EC2
1. Create a new **Web Service** on Render, Railway, or AWS EC2 pointing to the `/backend` directory.
2. Set Build Command:
   ```bash
   pip install -r requirements.txt
   ```
3. Set Start Command:
   ```bash
   python3 server.py
   # or
   gunicorn server:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:$PORT
   ```
4. Set Environment Variables:
   - `PORT`: `8000` (or dynamic port assigned by host)
   - `ALLOWED_ORIGINS`: `https://your-frontend-domain.vercel.app`

   *(Your backend will now be live at `https://ecdat-backend.onrender.com`)*

### Step 2: Deploy Next.js Frontend to Vercel / Netlify
1. Connect your repository to **Vercel** or **Netlify**.
2. Set Root Directory: `frontend`
3. Set Environment Variables in Vercel settings:
   - `BACKEND_URL`: `https://ecdat-backend.onrender.com`
4. Deploy! Next.js will automatically route all scan APIs to your live FastAPI backend over HTTP.

---

## 🚀 Deployment Option 2: Unified Single Server (AWS EC2 / DigitalOcean Droplet / VPS)

If you are hosting on a Linux server (Ubuntu/Debian EC2 or Droplet):

### Step 1: Server Prerequisites
```bash
sudo apt update && sudo apt install -y nodejs npm python3 python3-pip git
```

### Step 2: Install Dependencies
```bash
# Backend dependencies
cd /var/www/ECDAT--FRONTEND-AND-BACKEND/backend
pip3 install -r requirements.txt

# Frontend dependencies & build
cd /var/www/ECDAT--FRONTEND-AND-BACKEND/frontend
npm install
npm run build
```

### Step 3: Start Application with PM2 Process Manager
```bash
npm install -g pm2
cd /var/www/ECDAT--FRONTEND-AND-BACKEND/frontend
pm2 start npm --name "ecdat-frontend" -- start
pm2 save
```

Your app will be live at `http://YOUR_SERVER_IP:3000` with zero backend API configuration required!

---

## 🛡️ Security & Environment Variables

| Variable | Target | Description | Example |
|---|---|---|---|
| `BACKEND_URL` | Frontend | URL of external FastAPI backend (Leave blank for local python execution) | `https://api.ecdat.com` |
| `PORT` | Backend | Port for FastAPI / Uvicorn server | `8000` |
| `ALLOWED_ORIGINS` | Backend | Allowed CORS origin domains | `https://ecdat.com,https://app.ecdat.com` |
