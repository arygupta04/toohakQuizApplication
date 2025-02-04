# 🎯 **Toohak Quiz Application (Backend)**  

## 📌 **Overview**  
Toohak is a **quiz game platform** that allows admins to create and manage quizzes while enabling players to join instantly—**no sign-up required!**  

This repository contains the **backend server**, built using **TypeScript**, which powers the application's core logic, including:  
✅ Quiz creation and management  
✅ Player authentication (without signup)  
✅ Game sessions and real-time updates  
✅ Score tracking and leaderboards  

**University-Provided Frontend:**  
As part of our course, we were given the **frontend code** by our university. Our task was to develop the **backend** from scratch to support the application's functionality.  

---

## 🛠 **Backend Technology Stack**  
We built the backend using modern **TypeScript** best practices, ensuring **type safety**, **scalability**, and **maintainability**. The key technologies include:  

🔹 **TypeScript** – Strongly typed JavaScript for better reliability  
🔹 **Node.js** – Runtime for executing JavaScript code on the server  
🔹 **Express.js** – Lightweight framework for handling API requests  
🔹 **REST API** – Structured endpoints for frontend-backend communication  
🔹 **Jest** – Testing framework for automated unit and integration tests  

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
git clone https://github.com/arygupta04/toohakQuizApplication.git
cd toohakQuizApplication
```

### **2️⃣ Install Dependencies**  
```sh
npm install
```
### **3️⃣ Start the Backend Server**  
```sh
npm start
```
By default, the server runs on **`http://localhost:3000`**.  

---

## 🔗 **Connecting Backend with the Frontend**  
1. Use the **university-provided frontend code**.  
2. Ensure the frontend’s API calls are directed to **`http://localhost:3000`**.  
3. Start the frontend:  
   ```sh
   cd toohak-frontend
   npm install
   npm start
   ```
4. Open **`http://localhost:3000`** in your browser to access Toohak.  

---

## 🧪 **Testing with Jest**  

To ensure the reliability and correctness of our backend, we implemented **unit and integration testing** using **Jest**, a popular JavaScript testing framework.  

### **Why Jest?**  
✅ Simple and fast testing framework  
✅ Supports mocking and spying on functions  
✅ Works well with TypeScript and Express.js  

### **How We Used Jest in Toohak**  
We wrote **unit tests** to verify individual functions, such as quiz creation, player management, and score calculations. We also implemented **integration tests** to ensure that our API endpoints work correctly when interacting with the database.  

### **Running Tests**  
To execute the tests, run:  
```sh
npm test
```

### **Example Test (Quiz Creation Endpoint)**  
```typescript
import request from 'supertest';
import app from '../src/app'; // Importing the Express app

describe('Quiz API', () => {
  it('should create a new quiz', async () => {
    const response = await request(app)
      .post('/api/quiz')
      .send({ title: 'Sample Quiz', questions: [] });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('id');
  });
});
```

### **Code Coverage**  
To check test coverage, run:  
```sh
npm run test:coverage
```
This generates a report showing which parts of the backend code are covered by tests.  

---

## 📜 **License**  
This project is licensed under the **MIT License**.  
