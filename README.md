# Streamify - Interactive Video & Chat Platform

A production-ready full-stack application featuring real-time video calls, chat, interactive whiteboards, and AI-powered meeting summaries. Built for seamless collaboration and language learning.

## 🚀 Live Demo
**[https://streamiii.onrender.com](https://streamiii.onrender.com)**

## ✨ Key Features

*   **Authentication & Security**
    *   Secure Signup/Login with JWT.
    *   **Email Verification** with OTP (Fail-safe mechanism included).
    *   Password Encryption (Bcrypt).
*   **Real-time Communication**
    *   **Video Calling** (Powered by Stream.io + WebRTC).
    *   **Instant Chat** (Socket.io + Redis).
    *   **Friend System** (Send/Accept requests, Real-time status updates).
*   **Collaboration Tools**
    *   **Interactive Whiteboard**: Draw and collaborate in real-time during calls.
    *   **Screen Annotation**: Draw directly over shared screens.
    *   **Meeting Recording**: Auto-save and replay past meetings.
*   **Smart Features**
    *   **AI Summaries**: (Mock integration) Generate summaries for your meetings.
    *   **Profile Customization**: Edit avatars and user details.

## 🛠️ Tech Stack

*   **Frontend**: React (Vite), TailwindCSS, DaisyUI, Zustand (State Management), React Query.
*   **Backend**: Node.js, Express.js, MongoDB (Mongoose), Redis (Upstash/Local).
*   **Real-time**: Socket.io, Stream Video/Chat SDKs.
*   **Email**: Nodemailer (Gmail SMTP).

## ⚙️ Environment Variables

You need the following variables in your `.env` file (or Render Environment):

```env
# Server Configuration
PORT=5000 (Optional, Render sets this automatically)
NODE_ENV=production

# Database
MONGO_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/streamify

# Authentication
JWT_SECRET_KEY=your_super_secret_key

# Frontend Connection (Production)
CLIENT_URL=https://your-app-name.onrender.com

# Stream.io Keys (Get from getstream.io)
STREAM_API_KEY=your_key
STREAM_API_SECRET=your_secret
VITE_STREAM_API_KEY=your_key  # Same as above, for frontend

# Email (Gmail SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_16_char_app_password
# Note: Code handles port 465 (SSL) and 587 (TLS) automatically.
```

## 🚀 Deployment (The Easy Way)

This app is configured for **Unified Deployment** on **Render** (Monorepo style).

1.  **Push code** to GitHub.
2.  Create a **New Web Service** on Render.
3.  Connect your repo.
4.  **Settings**:
    *   **Root Directory**: (Leave Empty / `.`)
    *   **Build Command**: `npm run build`
        *(This magic script installs backend + frontend deps and builds the React app)*
    *   **Start Command**: `npm start`
5.  **Environment Variables**: Add all variables listed above.
6.  **Deploy!**

## 💻 Local Developement

1.  **Clone the repo**
    ```bash
    git clone https://github.com/your-username/streamify-chat-app.git
    cd streamify-chat-app
    ```

2.  **Install Dependencies** (Root script handles everything)
    ```bash
    npm run build
    ```
    *Or manually:* `cd frontend && npm install` / `cd backend && npm install`

3.  **Run Development Servers**
    *   Terminal 1 (Backend): `npm run dev:backend` (or `cd backend && npm run dev`)
    *   Terminal 2 (Frontend): `npm run dev:frontend` (or `cd frontend && npm run dev`)

## 📄 License

MIT License.
