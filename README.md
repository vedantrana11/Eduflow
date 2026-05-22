# EduFlow AI 🎓

EduFlow AI is an intelligent, AI-powered WhatsApp CRM and Admission Automation Platform designed specifically for education consultancies and agencies. It replaces manual operations, scattered spreadsheets, and unorganized chat logs with a centralized, automated system. 

By integrating the WhatsApp Cloud API with Google Gemini and OpenAI, EduFlow AI helps education counselors manage student leads, auto-generate personalized replies, and track application pipelines seamlessly.

![EduFlow Dashboard Overview](https://via.placeholder.com/1000x500?text=EduFlow+AI+Dashboard)

## ✨ Key Features

- **🤖 AI-Powered WhatsApp CRM**: Directly integrate with the WhatsApp Cloud API. Automatically detect student intent (e.g., "ready to apply", "needs more info"), summarize long conversation histories, and auto-generate highly contextual, professional replies using Google Gemini.
- **📊 Dynamic Kanban Board**: A native drag-and-drop Kanban interface to visualize the student admission pipeline. Move leads seamlessly between stages like "Contacted", "Documents Pending", and "Applied".
- **🎯 AI Lead Scoring**: Automatically scores leads from 0-100 based on their stage progression, engagement, profile completeness, and intent signals. 
- **✅ Intelligent Task Management**: Track counselor to-dos, pending document collections, and follow-ups. Features auto-overdue detection and priority flag visualization.
- **🔐 Multi-Tenant Architecture**: Built from the ground up for agencies with secure, organization-level data segregation and role-based access control (Admin, Manager, Counselor).

## 🛠️ Tech Stack

### Frontend
- **Framework**: [Next.js 15](https://nextjs.org/) (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion
- **State Management**: React Query (`@tanstack/react-query`)
- **Icons**: Lucide React

### Backend
- **Framework**: [FastAPI](https://fastapi.tiangolo.com/) (Python 3.10+)
- **Database**: MongoDB (PyMongo / Motor)
- **Data Validation**: Pydantic
- **AI Integrations**: Google Gemini API & OpenAI API
- **External APIs**: Meta WhatsApp Cloud API

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- Python 3.10+
- MongoDB instance (Local or Atlas)
- Google AI Studio API Key (for Gemini) or OpenAI API Key
- Meta Developer Account (for WhatsApp Cloud API credentials)

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Create and activate a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Set up your `.env` file (see `.env.example` for reference).
5. Start the FastAPI server:
   ```bash
   python -m uvicorn main:app --reload --port 8000
   ```

*(Optional)* Seed the database with mock data for testing:
```bash
python seed_data.py
```

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Next.js development server:
   ```bash
   npm run dev
   ```

The frontend will be running on `http://localhost:3000` and the backend on `http://localhost:8000`.

## 🤝 Contributing

Contributions are welcome! Please open an issue or submit a pull request for any bugs, improvements, or feature additions.

## 📝 License

This project is licensed under the MIT License.
