const express = require('express');
const app = express();
const port = 3000;

if (!process.env.GEMINI_API_KEY) {
    console.error("FATAL ERROR: GEMINI_API_KEY environment variable is not set.");
    process.exit(1);
}

app.use(express.json());
app.use(express.static('public'));

// In-memory data stores
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


// --- API Endpoints ---

// Patients
app.get('/api/patients/awaiting-triage', (req, res) => {
    res.json(awaitingTriage);
});

const { getTriageLevel, generateWeeklySchedule } = require('./ai.js');

app.post('/api/patients/awaiting-triage', async (req, res) => {
    const newPatient = req.body;
    newPatient.id = `P${Math.floor(Math.random() * 900) + 100}-XYZ1`;
    newPatient.queueNumber = awaitingTriage.length + 1;

    // Get triage level from Gemini API
    const complaintForAI = `${newPatient.complaint} (Vitals: ${newPatient.vitals || 'N/A'})`;
    newPatient.triageLevel = await getTriageLevel(complaintForAI);

    awaitingTriage.push(newPatient);
    res.status(201).json(newPatient);
});

app.get('/api/patients/awaiting-bed', (req, res) => {
    res.json(awaitingBed);
});

app.get('/api/patients/admitted', (req, res) => {
    res.json(admitted);
});


// Staff
app.get('/api/staff', (req, res) => {
    res.json(staffSchedule);
});

app.post('/api/staff', (req, res) => {
    const newStaff = req.body;
    newStaff.status = 'Available';
    newStaff.queue = 0;
    staffSchedule.push(newStaff);
    res.status(201).json(newStaff);
});

app.post('/api/staff/generate-schedule', async (req, res) => {
    const doctors = staffSchedule.filter(s => s.role === 'Doctor').length;
    const nurses = staffSchedule.filter(s => s.role === 'Nurse').length;
    const schedule = await generateWeeklySchedule(doctors, nurses);
    res.json(schedule);
});


app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});