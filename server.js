const express = require('express');
const session = require('express-session');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const connectDB = require('./config/db');
require('dotenv').config();
const Patient = require('./models/Patient');
const Staff = require('./models/Staff');
const { getTriageLevel, generateWeeklySchedule, getDoctorForPatient } = require('./ai.js');

// Connect to MongoDB
connectDB();

const app = express();
const port = 3000;

// --- Environment Variable Checks ---
if (!process.env.MONGO_URI) {
    console.error("FATAL ERROR: MONGO_URI environment variable is not set.");
    process.exit(1);
}
if (!process.env.GEMINI_API_KEY) {
    console.error("FATAL ERROR: GEMINI_API_KEY environment variable is not set.");
    process.exit(1);
}
if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    console.error("FATAL ERROR: GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET environment variables are not set.");
    process.exit(1);
}

// --- Middleware ---
app.use(express.json());
app.use(express.static('public'));
app.use(session({
    secret: process.env.SESSION_SECRET || 'mycare-health-secret-session-key',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } // In production, set to true if using HTTPS
}));

// --- Passport.js Configuration ---
app.use(passport.initialize());
app.use(passport.session());

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/callback"
  },
  function(accessToken, refreshToken, profile, cb) {
    return cb(null, profile);
  }
));

passport.serializeUser(function(user, cb) {
  cb(null, user);
});

passport.deserializeUser(function(obj, cb) {
  cb(null, obj);
});

// --- Authentication Middleware ---
function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    res.status(401).json({ error: 'User not authenticated' });
}

// --- Auth Routes ---
app.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
app.get('/auth/google/callback', passport.authenticate('google', { failureRedirect: '/' }), (req, res) => {
    res.redirect('/');
});
app.post('/auth/logout', (req, res, next) => {
    req.logout(function(err) {
        if (err) { return next(err); }
        res.redirect('/');
    });
});

// --- API Endpoints ---
app.get('/api/auth/status', (req, res) => {
    if (req.isAuthenticated()) {
        res.json({ loggedIn: true, user: { name: req.user.displayName, email: req.user.emails[0].value, avatar: req.user.photos[0].value } });
    } else {
        res.json({ loggedIn: false });
    }
});

app.get('/api/patients/:status', ensureAuthenticated, async (req, res) => {
    try {
        const patients = await Patient.find({ status: req.params.status });
        res.json(patients);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/staff', ensureAuthenticated, async (req, res) => {
    try {
        const staff = await Staff.find();
        res.json(staff);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/patients', ensureAuthenticated, async (req, res) => {
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

app.post('/api/staff', ensureAuthenticated, async (req, res) => {
    try {
        const newStaff = new Staff(req.body);
        await newStaff.save();
        res.status(201).json(newStaff);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/staff/generate-schedule', ensureAuthenticated, async (req, res) => {
    try {
        const doctors = await Staff.find({ role: 'Doctor' });
        const nurses = await Staff.find({ role: 'Nurse' });
        const schedule = await generateWeeklySchedule(doctors, nurses);
        res.json(schedule);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/patients/:id/assign-doctor', ensureAuthenticated, async (req, res) => {
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