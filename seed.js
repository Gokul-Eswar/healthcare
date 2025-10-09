const db = require('./database.js');

const initialPatients = [
    { id: 'P789-AXB4', name: 'John Smith', age: 45, gender: 'Male', complaint: 'Chest pain, shortness of breath', vitals: 'HR: 95, BP: 145/90, Temp: 37.2C', triageLevel: 2, queueNumber: 1, status: 'awaiting-triage' },
    { id: 'P790-QWE3', name: 'Emily Davis', age: 34, gender: 'Female', complaint: 'High fever, flu symptoms', vitals: 'HR: 92, BP: 115/75, Temp: 39.5C', triageLevel: 3, queueNumber: 2, status: 'awaiting-triage' },
    { id: 'P123-ABC1', name: 'Michael Johnson', age: 62, gender: 'Male', complaint: 'Severe abdominal pain', vitals: 'HR: 110, BP: 90/60, Temp: 38.1C', triageLevel: 1, status: 'awaiting-bed' },
    { id: 'P123-EFG8', name: 'Robert Chen', age: 67, gender: 'Male', complaint: 'Fall, possible fracture', vitals: 'HR: 72, BP: 130/85, Temp: 36.8C', triageLevel: 4, status: 'admitted' },
];

const initialStaff = [
    { name: 'Dr. Sarah Johnson', role: 'Doctor', specialization: 'Cardiologist', status: 'Available', queue: 0 },
    { name: 'Dr. Michael Chen', role: 'Doctor', specialization: 'Neurologist', status: 'With Patient', queue: 2 },
    { name: 'Dr. Emily Davis', role: 'Doctor', specialization: 'General Medicine', status: 'Available', queue: 1 },
    { name: 'Nurse Jennifer Wilson', role: 'Nurse', status: 'On Break', queue: 0 },
    { name: 'Nurse David Garcia', role: 'Nurse', status: 'Available', queue: 0 },
];

db.serialize(() => {
    const patientStmt = db.prepare("INSERT OR REPLACE INTO patients (id, name, age, gender, complaint, vitals, triageLevel, queueNumber, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");
    initialPatients.forEach(p => {
        patientStmt.run(p.id, p.name, p.age, p.gender, p.complaint, p.vitals, p.triageLevel, p.queueNumber, p.status);
    });
    patientStmt.finalize();

    const staffStmt = db.prepare("INSERT OR REPLACE INTO staff (name, role, specialization, status, queue) VALUES (?, ?, ?, ?, ?)");
    initialStaff.forEach(s => {
        staffStmt.run(s.name, s.role, s.specialization, s.status, s.queue);
    });
    staffStmt.finalize();

    console.log('Database seeded successfully.');
});

db.close();