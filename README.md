# 🔍 Context-Lens: Your Universal Technical Expert

[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Gemini API](https://img.shields.io/badge/AI-Google_Gemini-4285F4?style=for-the-badge&logo=google&logoColor=white)](https://ai.google.dev/)

**Context-Lens** is a multimodal AI web application designed to bridge the gap between static technical manuals and real-world physical assembly. By combining a live camera feed with an uploaded PDF manual, the application "watches" your progress and provides proactive, hands-free guidance.

Built for engineers, mechanics, and DIY enthusiasts to ensure safe and accurate assembly.

---

## 🌟 Key Features

* **Live Multimodal Analysis**: Captures real-time video frames and cross-references them with your technical documentation.
* **Proactive Guidance**: The AI monitors your actions and provides step-by-step instructions.
* **Safety First**: Automatically identifies incorrect tools or dangerous wiring setups and triggers immediate "STOP" alerts.
* **Non-Blocking Architecture**: Engineered with state-locking patterns to ensure smooth camera streaming without API delays.

---

## 🛠️ Tech Stack

* **Frontend Engine**: React (TypeScript) + Vite
* **Styling**: Tailwind CSS
* **Icons**: Lucide-React
* **Intelligence**: Google Gemini 1.5 Flash (Multimodal API)

---

## 🚀 Run Locally

Follow these steps to run the application on your local machine.

### Prerequisites
* [Node.js](https://nodejs.org/) (v18 or higher)
* A valid Google Gemini API Key

### Installation

1. **Clone the repository and navigate to the project directory:**
   ```bash
   git clone <your-github-repo-url>
   cd context-lens

2. **Install dependencies:**
     ```bash
     npm install
3. **Configure Environment Variables:**
    Create a new file named .env in the root folder (or rename .env.example).
    Add your Gemini API key using the Vite prefix:

4. **Code snippet:**
   VITE_GEMINI_API_KEY="your_api_key_here"
   Start the Development Server:

5. **Run this**
   ```bash
     npm run dev
6. **Open the App:**
   Visit http://localhost:3000 (or the port specified in your terminal) in your web browser. 
   Ensure your browser has permission to access the webcam.
