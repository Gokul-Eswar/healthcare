require('dotenv').config();
const express = require('express');
const session = require('express-session');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;

const app = express();
const port = 3000;

// --- Environment Variable Checks ---
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
    secret: 'mycare-health-secret-session-key', // In production, use a more secure, random key
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
    // In a real application, you would find or create a user in your database here
    // For this example, we'll just pass the profile information along
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
app.get('/auth/google',
  passport.authenticate('google', { scope: ['profile', 'email'] }));

app.get('/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/' }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect('/');
  });

app.get('/api/auth/status', (req, res) => {
    if (req.isAuthenticated()) {
        res.json({
            loggedIn: true,
            user: {
                name: req.user.displayName,
                email: req.user.emails[0].value,
                avatar: req.user.photos[0].value
            }
        });
    } else {
        res.json({ loggedIn: false });
    }
});

app.post('/auth/logout', (req, res, next) => {
    req.logout(function(err) {
        if (err) { return next(err); }
        res.redirect('/');
    });
});


// --- In-memory data stores ---
let awaitingTriage = [
    { id: 'P789-AXB4', name: 'John Smith', age: 45, gender: 'Male', complaint: 'Chest pain, shortness of breath', vitals: 'HR: 95, BP: 145/90, Temp: 37.2C', triageLevel: 2, queueNumber: 1 },
    { id: 'P790-QWE3', name: 'Emily Davis', age: 34, gender: 'Female', complaint: 'High fever, flu symptoms', vitals: 'HR: 92, BP: 115/75, Temp: 39.5C', triageLevel: 3, queueNumber: 2 }
];
let awaitingBed = [
    { id: 'P123-ABC1', name: 'Michael Johnson', age: 62, gender: 'Male', complaint: 'Severe abdominal pain', vitals: 'HR: 110, BP: 90/60, Temp: 38.1C', triageLevel: 1 },
];
let admitted = [
    { id: 'P123-EFG8', name: 'Robert Chen', age: 67, gender: 'Male', complaint: 'Fall, possible fracture', vitals: 'HR: 72, BP: 130/85, Temp: 36.8C', triageLevel: 4 },
];
let staffSchedule = [
    { name: 'Dr. Sarah Johnson', role: 'Doctor', status: 'Available', queue: 0 },
    { name: 'Dr. Michael Chen', role: 'Doctor', status: 'With Patient', queue: 2 },
    { name: 'Nurse Jennifer Wilson', role: 'Nurse', status: 'On Break', queue: 0 },
];

const { getTriageLevel, generateWeeklySchedule } = require('./ai.js');


// --- API Endpoints ---
app.get('/api/patients/awaiting-triage', ensureAuthenticated, (req, res) => res.json(awaitingTriage));
app.get('/api/patients/awaiting-bed', ensureAuthenticated, (req, res) => res.json(awaitingBed));
app.get('/api/patients/admitted', ensureAuthenticated, (req, res) => res.json(admitted));
app.get('/api/staff', ensureAuthenticated, (req, res) => res.json(staffSchedule));

app.post('/api/patients/awaiting-triage', ensureAuthenticated, async (req, res) => {
    const newPatient = req.body;
    newPatient.id = `P${Math.floor(Math.random() * 900) + 100}-XYZ1`;
    newPatient.queueNumber = awaitingTriage.length + 1;
    const complaintForAI = `${newPatient.complaint} (Vitals: ${newPatient.vitals || 'N/A'})`;
    newPatient.triageLevel = await getTriageLevel(complaintForAI);
    awaitingTriage.push(newPatient);
    res.status(201).json(newPatient);
});

app.post('/api/staff', ensureAuthenticated, (req, res) => {
    const newStaff = req.body;
    newStaff.status = 'Available';
    newStaff.queue = 0;
    staffSchedule.push(newStaff);
    res.status(201).json(newStaff);
});

app.post('/api/staff/generate-schedule', ensureAuthenticated, async (req, res) => {
    const doctors = staffSchedule.filter(s => s.role === 'Doctor').length;
    const nurses = staffSchedule.filter(s => s.role === 'Nurse').length;
    const schedule = await generateWeeklySchedule(doctors, nurses);
    res.json(schedule);
});


app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});