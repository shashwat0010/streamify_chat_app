# Streamify - Video Call Application

A real-time video calling application with friend management and chat features.

## Features

- User authentication
- Friend management
- Real-time chat
- Video calls
- Language learning focus

## Tech Stack

- Frontend: React, Vite, TailwindCSS
- Backend: Node.js, Express
- Database: MongoDB
- Real-time: Stream Chat & Video SDK

## Prerequisites

- Node.js (v16 or higher)
- MongoDB Atlas account
- Stream Chat account

## Environment Variables

### Backend (.env)
```
PORT=10000
MONGODB_URI=your_mongodb_uri
JWT_SECRET=your_jwt_secret
STREAM_API_KEY=your_stream_api_key
STREAM_API_SECRET=your_stream_api_secret
NODE_ENV=development
```

### Frontend (.env)
```
VITE_API_URL=http://localhost:10000
VITE_STREAM_API_KEY=your_stream_api_key
```

## Local Development

1. Clone the repository:
```bash
git clone https://github.com/yourusername/streamify-video-calls.git
cd streamify-video-calls
```

2. Install dependencies:
```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

3. Start the development servers:
```bash
# Start backend (from backend directory)
npm run dev

# Start frontend (from frontend directory)
npm run dev
```

## Deployment

### Deploying to Vercel

1. Backend Deployment:
   - Create a new project in Vercel
   - Set root directory to `backend`
   - Add environment variables
   - Deploy

2. Frontend Deployment:
   - Create a new project in Vercel
   - Set root directory to `frontend`
   - Add environment variables
   - Deploy

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.
