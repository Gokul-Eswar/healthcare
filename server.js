require('dotenv').config();
const express = require('express');
const session = require('express-session');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const db = require('./database.js');
const { getTriageLevel, generateWeeklySchedule, getDoctorForPatient } = require('./ai.js');

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

app.get('/api/patients/:status', ensureAuthenticated, (req, res) => {
    db.all("SELECT * FROM patients WHERE status = ?", [req.params.status], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

app.get('/api/staff', ensureAuthenticated, (req, res) => {
    db.all("SELECT * FROM staff", [], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

app.post('/api/patients', ensureAuthenticated, async (req, res) => {
    const newPatient = req.body;
    const patientId = `P${Math.floor(Math.random() * 900) + 100}-XYZ1`;
    const complaintForAI = `${newPatient.complaint} (Vitals: ${newPatient.vitals || 'N/A'})`;
    const triageLevel = await getTriageLevel(complaintForAI);

    const sql = `INSERT INTO patients (id, name, age, gender, complaint, vitals, triageLevel, status) VALUES (?, ?, ?, ?, ?, ?, ?, 'awaiting-triage')`;
    db.run(sql, [patientId, newPatient.name, newPatient.age, newPatient.gender, newPatient.complaint, newPatient.vitals, triageLevel], function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.status(201).json({ id: patientId, ...newPatient, triageLevel });
    });
});

app.post('/api/staff', ensureAuthenticated, (req, res) => {
    const newStaff = req.body;
    const sql = `INSERT INTO staff (name, role, specialization, status, queue) VALUES (?, ?, ?, 'Available', 0)`;
    db.run(sql, [newStaff.name, newStaff.role, newStaff.specialization], function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.status(201).json({ id: this.lastID, ...newStaff });
    });
});

app.post('/api/staff/generate-schedule', ensureAuthenticated, async (req, res) => {
    db.all("SELECT * FROM staff WHERE role = 'Doctor'", [], async (err, doctors) => {
        if (err) { return res.status(500).json({ error: err.message }); }
        db.all("SELECT * FROM staff WHERE role = 'Nurse'", [], async (err, nurses) => {
            if (err) { return res.status(500).json({ error: err.message }); }
            const schedule = await generateWeeklySchedule(doctors, nurses);
            res.json(schedule);
        });
    });
});

app.post('/api/patients/:id/assign-doctor', ensureAuthenticated, async (req, res) => {
    const patientId = req.params.id;
    db.get("SELECT * FROM patients WHERE id = ?", [patientId], (err, patient) => {
        if (err) { return res.status(500).json({ error: err.message }); }
        if (!patient) { return res.status(404).json({ error: 'Patient not found' }); }

        db.all("SELECT * FROM staff WHERE role = 'Doctor' AND status = 'Available'", [], async (err, availableDoctors) => {
            if (err) { return res.status(500).json({ error: err.message }); }
            if (availableDoctors.length === 0) { return res.status(400).json({ error: 'No available doctors' }); }

            const recommendedDoctorName = await getDoctorForPatient(patient, availableDoctors);
            const doctor = availableDoctors.find(d => d.name === recommendedDoctorName);

            if (doctor) {
                db.serialize(() => {
                    db.run("UPDATE patients SET status = 'awaiting-bed', doctor = ? WHERE id = ?", ['Assigned to ' + doctor.name, patientId]);
                    db.run("UPDATE staff SET queue = queue + 1 WHERE id = ?", [doctor.id]);
                });
                res.json({ success: true, patient, doctor });
            } else {
                res.status(500).json({ error: 'Could not assign a doctor.' });
            }
        });
    });
});

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});