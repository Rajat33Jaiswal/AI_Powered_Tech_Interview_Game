# 🎮 AI-Powered Tech Interview Game (Interview.AI)

Interview.AI is a real-time multiplayer and solo technical interview game. Developers compete in timed rounds answering AI-generated technical questions across Topics like DSA, Operating Systems, Database Management Systems (DBMS), Java OOP, and general Web Development. Answers are evaluated instantly, scores are aggregated on a live leaderboard, and players receive personalized performance report card feedback at the end of the round.

---

## 🚀 Quick Start (Local Run)

The project includes an **Offline Mock AI Mode** enabled by default, allowing you to run, test, and verify the entire application immediately without needing any active API keys.

### 1. Database Setup
You will need a MySQL instance running locally or hosted online (e.g. Railway or PlanetScale).
1. Create a database named `interview_game`:
   ```sql
   CREATE DATABASE interview_game;
   ```
2. (Optional) If you don't have MySQL installed yet, you can run a local instance or configure connection credentials in the server `.env` file once ready.

### 2. Run Backend Server
1. Navigate to the server folder:
   ```bash
   cd server
   ```
2. Create your `.env` file (one has already been initialized for you):
   ```bash
   cp src/.env.example .env
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Start the server:
   ```bash
   npm run dev
   ```
   *The server automatically connects, synchronizes the database tables via Sequelize, and starts listening on port `5000`.*

### 3. Run React Frontend
1. Navigate to the client folder in a new terminal:
   ```bash
   cd client
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Vite dev server:
   ```bash
   npm run dev
   ```
   *Open the printed local address (usually `http://localhost:5173`) in your browser.*

---

## ⚙️ Environment Variables (`server/.env`)

Configure these values in the server folder:

| Variable | Description | Default |
|---|---|---|
| `PORT` | Backend port | `5000` |
| `DB_HOST` | MySQL database host address | `localhost` |
| `DB_PORT` | MySQL database port | `3306` |
| `DB_USER` | MySQL username | `root` |
| `DB_PASSWORD` | MySQL password | (empty) |
| `DB_NAME` | MySQL database name | `interview_game` |
| `DB_SSL` | Enable SSL (required for PlanetScale/Railway MySQL) | `false` |
| `JWT_SECRET` | Secret key for signing login JWTs | `super_secret_interview_token_123` |
| `CLAUDE_API_KEY` | Anthropic Claude API Key | (empty) |
| `USE_MOCK_AI` | Fallback to hardcoded mock questions & grading | `true` |

---

## 🧠 AI Engine Integration (Claude API)

To enable real dynamic questions and intelligent answer grading:
1. Obtain an API key from the [Anthropic Console](https://console.anthropic.com/).
2. In `server/.env`, paste your key: `CLAUDE_API_KEY=your-anthropic-api-key`.
3. Disable Mock mode: `USE_MOCK_AI=false`.
4. Restart the server. Now, interview questions, grades (0-10), and feedback reports will be generated dynamically by Claude.

---

## ☁️ Deployment Instructions

### Frontend (Vercel / Netlify)
Deploy the `client/` folder as a static React application.
1. Set the build command to `npm run build` and output directory to `dist`.
2. Configure the environment variable:
   - `VITE_API_URL`: Point this to your deployed backend URL (e.g. `https://your-backend.onrender.com`).

### Backend (Render.com / Railway)
Deploy the `server/` folder as a Node.js web service.
1. Specify Node.js version and start command: `npm start`.
2. Configure all database and auth environment variables in the host service settings.
3. **Important (Socket.io sticky sessions)**: Render's load balancers require sticky sessions for polling. However, since we configure our Socket.io client to connect via WebSockets directly first (`transports: ['websocket']`), standard WebSockets connections will run seamlessly.
4. > [!NOTE]
   > **Render Free Tier Sleep Mode**
   > If you deploy the backend on Render's free tier, the server container automatically spins down after 15 minutes of inactivity. When a user first opens the app after it sleeps, the initial request will take roughly 50-90 seconds to wake the server up. A friendly notice should be added to your live landing page header to inform visitors.

---

## 💡 Design Architecture Notes & Trade-offs

### In-Memory Multiplayer Match Tracker
Multiplayer lobby lists and timed question game states (`activeRooms`) are stored in-memory in the Node.js backend. This provides latency-free broadcasts.
- **Trade-off**: If the hosting server restarts (e.g., Render free tier containers recycling due to inactivity), active games will expire and players in-game will lose their sessions.
- **Production Solution**: For heavy scale, backing this state with a high-performance Redis cache instance prevents room loss during server updates. Solo Mode is unaffected by server restarts since it is REST-based and questions are loaded on-demand.
