# 🚀 Quick Reference Guide

## 🏃‍♂️ Quick Start Commands

### Backend (Flask)
```bash
cd backend
source venv/bin/activate
python app.py
# Server runs on http://localhost:5001
```

### Frontend (Next.js)
```bash
cd frontend
npm run dev
# Server runs on http://localhost:3000
```

## 🧪 Testing the API

### Test Correct Answer
```bash
curl -X POST http://localhost:5001/check \
  -H "Content-Type: application/json" \
  -d '{"answer": 2}'
```

### Test Wrong Answer
```bash
curl -X POST http://localhost:5001/check \
  -H "Content-Type: application/json" \
  -d '{"answer": 3}'
```

### Health Check
```bash
curl http://localhost:5001/health
```

## 📁 Project Structure Overview

```
tarazoo/
├── frontend/              # Next.js app
│   ├── src/app/page.tsx  # Main component (with scaling comments)
│   └── package.json
├── backend/               # Flask app
│   ├── app.py            # Main app (with scaling comments)
│   ├── requirements.txt
│   └── venv/
├── README.md             # Basic setup instructions
├── DEVELOPER_GUIDE.md    # Comprehensive scaling guide
└── QUICK_REFERENCE.md    # This file
```

## 🔧 Common Development Tasks

### Adding New Questions
1. Modify the backend logic in `app.py`
2. Update the frontend to handle dynamic questions
3. Consider moving to database-driven questions

### Adding User Authentication
1. Install Flask-JWT-Extended in backend
2. Create user models and routes
3. Add authentication context in frontend
4. Implement protected routes

### Adding Database
1. Choose database (PostgreSQL recommended)
2. Install SQLAlchemy and Flask-Migrate
3. Create models in `backend/models/`
4. Set up migrations
5. Update API endpoints to use database

### Adding Tests
1. Frontend: Install Jest and React Testing Library
2. Backend: Install pytest and Flask-Testing
3. Create test files in respective `__tests__/` directories
4. Set up CI/CD pipeline

## 🚨 Troubleshooting

### Port 5000 Already in Use
- The app now uses port 5001 for Flask
- If 5001 is also in use, change the port in `backend/app.py`

### CORS Issues
- CORS is enabled in the Flask app
- If you add new endpoints, ensure CORS is configured

### Frontend Not Connecting to Backend
- Check that both servers are running
- Verify the API URL in `frontend/src/app/page.tsx`
- Check browser console for errors

## 📈 Next Steps for Scaling

1. **Week 1**: Extract components and add proper error handling
2. **Week 2**: Add database integration and user authentication
3. **Week 3**: Implement proper testing and CI/CD
4. **Week 4**: Add advanced features and monitoring

See `DEVELOPER_GUIDE.md` for detailed scaling recommendations.
