# Math Quiz Full-Stack App

A simple full-stack web application with a Next.js frontend and Flask backend.

## Features

- **Frontend**: Next.js with TypeScript, App Router, and Tailwind CSS
- **Backend**: Flask with CORS support
- **Question**: "What is 1 + 1?" with input validation
- **Dynamic Response**: Shows "Hello World" for correct answer (2), "Wrong answer" for incorrect

## Project Structure

```
tarazoo/
├── frontend/          # Next.js application
│   ├── src/
│   │   └── app/
│   │       ├── page.tsx    # Main quiz component
│   │       ├── layout.tsx  # App layout
│   │       └── globals.css # Global styles
│   ├── package.json
│   └── ...
├── backend/           # Flask application
│   ├── app.py         # Main Flask app
│   ├── requirements.txt
│   └── venv/          # Virtual environment
└── README.md
```

## Setup and Running

### Backend (Flask)

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Activate the virtual environment:
   ```bash
   source venv/bin/activate
   ```

3. Install dependencies (if not already installed):
   ```bash
   pip install -r requirements.txt
   ```

4. Run the Flask server:
   ```bash
   python app.py
   ```

   The backend will be available at `http://localhost:5001`

### Frontend (Next.js)

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies (if not already installed):
   ```bash
   npm install
   ```

3. Run the development server:
   ```bash
   npm run dev
   ```

   The frontend will be available at `http://localhost:3000`

## API Endpoints

### POST /check

Checks if the submitted answer is correct.

**Request:**
```json
{
  "answer": 2
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Hello World"
}
```

**Response (Failure):**
```json
{
  "success": false,
  "message": "Wrong answer"
}
```

### GET /health

Health check endpoint.

**Response:**
```json
{
  "status": "healthy"
}
```

## Usage

1. Start both the backend and frontend servers
2. Open `http://localhost:3000` in your browser
3. Enter "2" as the answer to "What is 1 + 1?"
4. Click "Submit Answer"
5. You should see "Hello World" displayed
6. Try entering a different number to see the "Wrong answer" message

## Technologies Used

- **Frontend**: Next.js 15, React 18, TypeScript, Tailwind CSS
- **Backend**: Flask, Flask-CORS
- **Development**: ESLint, PostCSS
