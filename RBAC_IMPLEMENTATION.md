# Algorithm Breakdown: Role-Based Access Control (RBAC) System

This document provides a detailed, step-by-step explanation of the algorithm and code used to implement the Role-Based Access Control (RBAC) system in the MyCare Health dashboard.

---

### **Stage 1: Defining the User Schema**

**Algorithm:**
1.  Define a new schema for the `User` model.
2.  The schema must include a `username` for identification, a `password` for authentication, and a `role` for authorization.
3.  The `username` must be unique to prevent duplicate accounts.
4.  The `role` will be restricted to a specific set of values ('Admin', 'Doctor', 'Nurse') using an `enum` to ensure data integrity.

**Code Block (`models/User.js`):**
This code defines the blueprint for every user in the database. The `enum` for the `role` is a critical constraint that prevents invalid roles from being assigned.

```javascript
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    password: {
        type: String,
        required: true
    },
    role: {
        type: String,
        required: true,
        enum: ['Admin', 'Doctor', 'Nurse']
    }
});

const User = mongoose.model('User', userSchema);

module.exports = User;
```

---

### **Stage 2: Securely Seeding User Data**

**Algorithm:**
1.  Import the `User` model and the `bcrypt` library into the seeding script.
2.  Define a list of default users with plain-text passwords.
3.  Before inserting them into the database, iterate through this list.
4.  For each user, use `bcrypt.hash()` to generate a secure, salted hash of their password. A salt round of `10` is a strong, industry-standard choice.
5.  Replace the plain-text password with the newly generated hash.
6.  Insert the users with their hashed passwords into the database. This ensures we never store plain-text passwords.

**Code Block (`seed.js` snippet):**
This snippet shows the process of taking a simple password like `"password123"` and turning it into a secure hash before it ever touches the database.

```javascript
const bcrypt = require('bcrypt');
const User = require('./models/User');

// --- Seed Users with Hashed Passwords ---
const saltRounds = 10;
const usersToCreate = [
    { username: 'admin', password: 'password123', role: 'Admin' },
    { username: 'doctor', password: 'password123', role: 'Doctor' },
    { username: 'nurse', password: 'password123', role: 'Nurse' },
];

const users = await Promise.all(
    usersToCreate.map(async (user) => {
        const hashedPassword = await bcrypt.hash(user.password, saltRounds);
        return { ...user, password: hashedPassword };
    })
);

await User.insertMany(users);
```

---

### **Stage 3: Implementing Backend Authentication Routes**

**Algorithm:**
1.  **Session Setup:** Configure `express-session` middleware in `server.js`. This middleware will create and manage a unique, secure session for each user who logs in. A `SESSION_SECRET` is used to sign the session cookie, preventing tampering.
2.  **Login Endpoint (`/api/auth/login`):**
    a.  Find the user in the database by their `username`.
    b.  If the user exists, use `bcrypt.compare()` to check if the provided password matches the stored hash.
    c.  If the password is correct, store the user's ID and role in the session object (`req.session`).
    d.  Send the user's details (excluding the password) back to the frontend.
3.  **Logout Endpoint (`/api/auth/logout`):**
    a.  Use `req.session.destroy()` to clear the user's session data from the server.
    b.  Send a success message to the frontend.
4.  **Session Check Endpoint (`/api/auth/session`):**
    a.  Check if `req.session.user` exists.
    b.  If it does, the user is logged in. Return the user's data. Otherwise, indicate that there is no active session.

**Code Block (`server.js` snippet):**
This code sets up the core authentication logic. The session middleware tracks logged-in users, and the `/login` route is the secure gateway into the application.

```javascript
const session = require('express-session');
const bcrypt = require('bcrypt');
const User = require('./models/User');

// Session Middleware
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false } // Set to true if using HTTPS
}));

// Login Route
app.post('/api/auth/login', async (req, res) => {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    if (!user) {
        return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
        return res.status(401).json({ message: 'Invalid credentials' });
    }

    req.session.user = { id: user._id, username: user.username, role: user.role };
    res.json(req.session.user);
});
```

---

### **Stage 4: Creating RBAC Protection Middleware**

**Algorithm:**
1.  **Authentication Check Middleware (`isAuthenticated`):**
    a.  This middleware function checks if `req.session.user` exists.
    b.  If it doesn't, the user is not logged in. The request is rejected with a `401 Unauthorized` error.
    c.  If it does, the request is allowed to proceed to the next function.
2.  **Role Authorization Middleware (`hasRole`):**
    a.  This is a more advanced middleware that accepts a list of allowed roles as an argument (e.g., `['Admin']`).
    b.  It first checks if the user is authenticated.
    c.  It then checks if the logged-in user's role (`req.session.user.role`) is included in the list of allowed roles.
    d.  If the role is not authorized, the request is rejected with a `403 Forbidden` error.

**Code Block (`server.js` snippet):**
This is the security gatekeeper. The `hasRole` middleware is applied to specific API routes to ensure that only users with the correct permissions can access them. For example, generating a schedule is restricted to 'Admin' users.

```javascript
// Middleware to check if user is authenticated
const isAuthenticated = (req, res, next) => {
    if (!req.session.user) {
        return res.status(401).json({ message: 'Unauthorized' });
    }
    next();
};

// Middleware to check for a specific role
const hasRole = (roles) => (req, res, next) => {
    if (!roles.includes(req.session.user.role)) {
        return res.status(403).json({ message: 'Forbidden' });
    }
    next();
};

// Applying middleware to a protected route
app.post(
    '/api/staff/generate-schedule',
    isAuthenticated,
    hasRole(['Admin']), // Only Admins can access this
    async (req, res) => {
        // ... route logic here ...
    }
);
```