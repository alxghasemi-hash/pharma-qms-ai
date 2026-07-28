# Pharma QMS AI

## Overview

Pharma QMS AI is an AI-powered Quality Management System developed as part of a technical assessment. The application assists users with pharmaceutical quality management by providing an AI chatbot interface powered by the Groq API.

## Features

- AI-powered chatbot for pharmaceutical queries
- FastAPI backend
- React frontend
- Groq API integration
- Modern responsive UI

## Tech Stack

### Frontend
- React
- Vite
- Tailwind CSS

### Backend
- FastAPI
- Python
- Groq API
- Uvicorn

## Project Structure

```
pharma-qms-ai/
│
├── backend/
│   ├── app/
│   ├── db/
│   ├── main.py
│   └── requirements.txt
│
├── frontend/
│   ├── src/
│   ├── public/
│   └── package.json
│
└── README.md
```

## Installation

### Clone the repository

```bash
git clone https://github.com/adithyan-v-k/pharma-qms-ai.git
```

### Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

## Environment Variables

Create a file named `.env` inside the `backend` folder.

Example:

```
GROQ_API_KEY=your_api_key_here
```

> Do not commit your `.env` file.

## Author

Adithyan V K