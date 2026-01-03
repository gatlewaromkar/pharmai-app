# 🏥 PharmAI - Intelligent Pharmacy Management System

## 🔐 Login Credentials (Demo)

### **Patient Login**
- **Email:** `patient@pharmai.com`
- **Phone:** `9876543211`
- **Password:** `demo123`
- **Role:** Patient

### **Doctor Login**
- **Email:** `doctor@pharmai.com`
- **Phone:** `9876543210`
- **Password:** `demo123`
- **Role:** Doctor

### **Supplier Login**
- **Email:** `supplier@pharmai.com`
- **Phone:** `9876543212`
- **Password:** `demo123`
- **Role:** Supplier

---

## 🚀 How to Use

### **1. Start the Server**
```bash
node server.js
```

### **2. Access the Application**
- **Login Page:** http://localhost:3001/login.html
- **Main Dashboard:** http://localhost:3001/index.html

### **3. Login Steps**
1. Open http://localhost:3001/login.html
2. Select your role (Patient/Doctor/Supplier)
3. Enter credentials from above
4. Click "Login"
5. You'll be redirected to the dashboard

---

## ✨ Features Implemented

### **Authentication System ✅**
- JWT-based secure authentication
- Role-based access control
- Password encryption (bcrypt)
- Login/Signup functionality

### **Dashboard Features ✅**
- Real-time inventory management
- AI-powered drug interaction checker
- Billing system with localStorage backup
- Patient records management
- 15+ AI agents for different tasks

### **Performance Optimizations ✅**
- Mobile-responsive design
- Reduced particles on mobile (30 vs 70)
- Animation pause when tab hidden
- LocalStorage backup for bills

### **UI/UX Enhancements ✅**
- Sky blue medical theme
- Futuristic animated background
- Glassmorphism effects
- Smooth transitions

---

## 📊 Tech Stack

- **Frontend:** HTML, CSS, JavaScript, Tailwind CSS
- **Backend:** Node.js, Express.js
- **Authentication:** JWT, bcrypt
- **AI:** Google Gemini 1.5 Flash
- **Charts:** Chart.js
- **Icons:** Font Awesome

---

## 🔧 Installation

```bash
# Install dependencies
npm install

# Start server
node server.js
```

---

## 📝 Notes

- All demo accounts use password: `demo123`
- Data is stored in memory (resets on server restart)
- Bills are backed up in localStorage
- API quota management needed for production

---

## 🎯 Next Steps (Optional)

1. Payment Gateway Integration (Razorpay)
2. WhatsApp Notifications
3. Prescription OCR
4. MongoDB Database
5. PWA Support
6. Multi-language Support

---

**Developed with ❤️ by PharmAI Team**
