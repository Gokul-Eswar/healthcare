require('dotenv').config();
const express = require('express');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const bcrypt = require('bcrypt');
const connectDB = require('./config/db');
const Patient = require('./models/Patient');
const Staff = require('./models/Staff');
const User = require('./models/User');
const { getTriageLevel, generateWeeklySchedule, getDoctorForPatient } = require('./ai.js');

// Connect to MongoDB
connectDB();

const app = express();
const port = 3000;

// --- Environment Variable Checks ---
if (!process.env.MONGO_URI || !process.env.GEMINI_API_KEY || !process.env.SESSION_SECRET) {
    console.error("FATAL ERROR: One or more environment variables (MONGO_URI, GEMINI_API_KEY, SESSION_SECRET) are not set.");
    process.exit(1);
}

// --- Middleware ---
app.use(express.json());
app.use(express.static('public'));
app.use(cookieParser());
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { httpOnly: true, secure: false, maxAge: 24 * 60 * 60 * 1000 } // 24 hours
}));

// --- Authentication API Endpoints ---

// Login
app.post('/api/auth/login', async (req, res) => {
    try {
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
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Logout
app.post('/api/auth/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            return res.status(500).json({ message: 'Could not log out.' });
        }
        res.clearCookie('connect.sid');
        res.json({ message: 'Logged out successfully' });
    });
});

// Get current session
app.get('/api/auth/session', (req, res) => {
    if (req.session.user) {
        res.json(req.session.user);
    } else {
        res.status(401).json({ message: 'Not authenticated' });
    }
});

// --- RBAC Middleware ---
const isAuthenticated = (req, res, next) => {
    if (!req.session.user) {
        return res.status(401).json({ message: 'Unauthorized: You must be logged in.' });
    }
    next();
};

const hasRole = (roles) => (req, res, next) => {
    if (!req.session.user || !roles.includes(req.session.user.role)) {
        return res.status(403).json({ message: 'Forbidden: You do not have the required role.' });
    }
    next();
};


// --- Main API Endpoints (Now Protected) ---
app.get('/api/patients/:status', isAuthenticated, async (req, res) => {
    try {
        const patients = await Patient.find({ status: req.params.status });
        res.json(patients);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/metrics/patient-arrivals', isAuthenticated, async (req, res) => {
    try {
        const arrivals = await Patient.aggregate([
            {
                $group: {
                    _id: { $hour: "$createdAt" },
                    count: { $sum: 1 }
                }
            },
            {
                $sort: { _id: 1 }
            }
        ]);
        res.json(arrivals);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/staff', isAuthenticated, async (req, res) => {
    try {
        const staff = await Staff.find();
        res.json(staff);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/patients', isAuthenticated, hasRole(['Admin', 'Nurse']), async (req, res) => {
    try {
        const newPatientData = req.body;
        const patientId = `P${Math.floor(Math.random() * 900) + 100}-XYZ1`;
        const complaintForAI = `${newPatientData.complaint} (Vitals: ${newPatientData.vitals || 'N/A'})`;
        const triageLevel = await getTriageLevel(complaintForAI);

        const patient = new Patient({
            id: patientId,
            ...newPatientData,
            triageLevel
        });
        await patient.save();
        res.status(201).json(patient);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/staff', isAuthenticated, hasRole(['Admin']), async (req, res) => {
    try {
        const newStaff = new Staff(req.body);
        await newStaff.save();
        res.status(201).json(newStaff);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/staff/generate-schedule', isAuthenticated, hasRole(['Admin']), async (req, res) => {
    try {
        const doctors = await Staff.find({ role: 'Doctor' });
        const nurses = await Staff.find({ role: 'Nurse' });
        const schedule = await generateWeeklySchedule(doctors, nurses);
        res.json(schedule);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/patients/:id/assign-doctor', isAuthenticated, hasRole(['Admin', 'Doctor']), async (req, res) => {
    try {
        const patient = await Patient.findOne({ id: req.params.id });
        if (!patient) {
            return res.status(404).json({ error: 'Patient not found' });
        }

        const availableDoctors = await Staff.find({ role: 'Doctor', status: 'Available' });
        if (availableDoctors.length === 0) {
            return res.status(400).json({ error: 'No available doctors' });
        }

        const recommendedDoctorName = await getDoctorForPatient(patient, availableDoctors);
        const doctor = await Staff.findOne({ name: recommendedDoctorName });

        if (doctor) {
            patient.status = 'awaiting-bed';
            patient.doctor = doctor.name;
            await patient.save();

            doctor.queue += 1;
            await doctor.save();

            res.json({ success: true, patient, doctor });
        } else {
            res.status(500).json({ error: 'Could not assign a doctor.' });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});