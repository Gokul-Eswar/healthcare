require('dotenv').config();
const express = require('express');
const connectDB = require('./config/db');
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

// --- Middleware ---
app.use(express.json());
app.use(express.static('public'));

// --- API Endpoints ---
app.get('/api/patients/:status', async (req, res) => {
    try {
        const patients = await Patient.find({ status: req.params.status });
        res.json(patients);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/staff', async (req, res) => {
    try {
        const staff = await Staff.find();
        res.json(staff);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/patients', async (req, res) => {
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

app.post('/api/staff', async (req, res) => {
    try {
        const newStaff = new Staff(req.body);
        await newStaff.save();
        res.status(201).json(newStaff);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/staff/generate-schedule', async (req, res) => {
    try {
        const doctors = await Staff.find({ role: 'Doctor' });
        const nurses = await Staff.find({ role: 'Nurse' });
        const schedule = await generateWeeklySchedule(doctors, nurses);
        res.json(schedule);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/patients/:id/assign-doctor', async (req, res) => {
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