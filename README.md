# 🎯 **Toohak Quiz Application (Backend)**  

## 📌 **Overview**  
Toohak is a **quiz game platform** that allows admins to create and manage quizzes while enabling players to join instantly—**no sign-up required!**  

This repository contains the **backend server**, built using **TypeScript**, which powers the application's core logic, including:  
✅ Quiz creation and management  
✅ Player authentication (without signup)  
✅ Game sessions and real-time updates  
✅ Score tracking and leaderboards  

**🎓 University-Provided Frontend:**  
As part of our course, we were given the **frontend code** by our university. Our task was to develop the **backend** from scratch to support the application's functionality.

---

## 🛠 **Backend Technology Stack**  
We built the backend using modern **TypeScript** best practices, ensuring **type safety**, **scalability**, and **maintainability**. The key technologies include:  

🔹 **TypeScript** – Strongly typed JavaScript for better reliability  
🔹 **Node.js** – Runtime for executing JavaScript code on the server  
🔹 **Express.js** – Lightweight framework for handling API requests  
🔹 **REST API** – Structured endpoints for frontend-backend communication  
---

## 🚀 **How the Backend Server Works**  
The **backend server** is responsible for handling client requests, processing data, and sending responses. Here's how it works:  

1. **Receives HTTP Requests** from the frontend (React-based).  
2. **Processes the Requests** using Express.js, including:  
   - Validating quiz data  
   - Managing game sessions  
   - Storing and retrieving scores  
3. **Interacts with the Database** to fetch/store quiz questions and results.  
4. **Sends Responses** back to the frontend via REST API or WebSockets for real-time updates.  

---

## 🏗 **Setting Up & Running the Backend**  

### **1️⃣ Clone the Repository**  
```sh
git clone https://github.com/your-username/toohakQuizApplication.git
cd toohakQuizApplication
```

### **2️⃣ Install Dependencies**  
```sh
npm install
```

### **3️⃣ Compile TypeScript Code**  
```sh
npm run build
```
This converts TypeScript (`.ts` files) into JavaScript (`.js` files).  

### **4️⃣ Start the Backend Server**  
```sh
npm start
```
By default, the server runs on **`http://localhost:5000`**.

---

## 🔗 **Connecting Backend with the Frontend**  
1. Use the **university-provided frontend code**.  
2. Ensure the frontend’s API calls are directed to **`http://localhost:5000`**.  
3. Start the frontend:  
   ```sh
   cd toohak-frontend
   npm install
   npm start
   ```
4. Open **`http://localhost:3000`** in your browser to access Toohak.

---
