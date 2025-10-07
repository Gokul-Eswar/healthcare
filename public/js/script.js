document.addEventListener('DOMContentLoaded', function() {
    // --- DOM Elements ---
    const links = document.querySelectorAll('.nav-link');
    const pages = document.querySelectorAll('.page-content');
    const pageTitle = document.getElementById('page-title');
    const patientPortalContainer = document.getElementById('patient-portal-page');
    const notificationButton = document.getElementById('notification-button');
    const notificationDropdown = document.getElementById('notification-dropdown');
    const userButton = document.getElementById('user-button');
    const userDropdown = document.getElementById('user-dropdown');
    const userAvatar = document.getElementById('user-avatar');
    const userNameDisplay = document.getElementById('user-name-display');
    const userEmailDisplay = document.getElementById('user-email-display');
    const addPatientButton = document.getElementById('add-patient-button');
    const addPatientModal = document.getElementById('add-patient-modal');
    const closeModalButton = document.getElementById('close-modal-button');
    const cancelModalButton = document.getElementById('cancel-modal-button');
    const addPatientForm = document.getElementById('add-patient-form');
    const awaitingTriageColumn = document.getElementById('awaiting-triage-column');
    const awaitingTriageCount = document.getElementById('awaiting-triage-count');
    const myProfileLink = document.getElementById('my-profile-link');
    const editProfileModal = document.getElementById('edit-profile-modal');
    const closeProfileModalButton = document.getElementById('close-profile-modal-button');
    const cancelProfileModalButton = document.getElementById('cancel-profile-modal-button');
    const editProfileForm = document.getElementById('edit-profile-form');
    const addScheduleButton = document.getElementById('add-schedule-button');
    const addScheduleModal = document.getElementById('add-schedule-modal');
    const closeScheduleModalButton = document.getElementById('close-schedule-modal-button');
    const cancelScheduleModalButton = document.getElementById('cancel-schedule-modal-button');
    const addScheduleForm = document.getElementById('add-schedule-form');
    const scheduleGrid = document.getElementById('schedule-grid');
    const scheduleDate = document.getElementById('schedule-date');

    // --- Page Templates ---
    const patientPortalTemplates = {
        home: `
            <div class="max-w-2xl mx-auto text-center">
                <h2 class="text-3xl font-bold mb-2">MyCare Companion</h2>
                <p class="text-gray-600 mb-8">Your trusted companion for emergency care and family support during medical situations</p>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div class="bg-white p-6 rounded-lg shadow-sm text-center border cursor-pointer hover:bg-gray-50" data-portal-action="showAmbulanceHome">
                        <div class="flex justify-center mb-4"><div class="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center"><svg class="h-6 w-6 text-red-600" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.518.759a11.03 11.03 0 004.28 4.28l.759-1.518a1 1 0 011.06-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" /></svg></div></div>
                        <h3 class="font-bold text-lg mb-2">Emergency Ambulance</h3>
                        <p class="text-sm text-gray-500">Request immediate help with real-time tracking</p>
                    </div>
                    <div class="bg-white p-6 rounded-lg shadow-sm text-center border cursor-pointer hover:bg-gray-50" data-portal-action="showTracker">
                        <div class="flex justify-center mb-4"><div class="h-12 w-12 rounded-full bg-indigo-100 flex items-center justify-center"><svg class="h-6 w-6 text-indigo-600" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd" /></svg></div></div>
                        <h3 class="font-bold text-lg mb-2">Track Patient in ER</h3>
                        <p class="text-sm text-gray-500">Get updates on a loved one with a secure access code</p>
                    </div>
                </div>
            </div>`,
        ambulanceHome: `
             <div class="max-w-lg mx-auto text-center">
                <button class="text-sm text-indigo-600 font-semibold mb-8" data-portal-action="showHome">&larr; Back to Home</button>
                <h2 class="text-2xl font-bold mb-2">Emergency Medical Assistance</h2>
                <p class="text-gray-600 mb-8">Tap to request immediate medical assistance. Help will be dispatched immediately.</p>
                <button class="bg-red-500 hover:bg-red-600 text-white rounded-full w-48 h-48 flex flex-col items-center justify-center mx-auto transition-transform transform hover:scale-105" data-portal-action="showAmbulanceForm">
                    <svg class="h-12 w-12" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.518.759a11.03 11.03 0 004.28 4.28l.759-1.518a1 1 0 011.06-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" /></svg>
                    <span class="text-xl font-bold mt-2">CALL AMBULANCE</span>
                </button>
            </div>`,
        ambulanceForm: `
            <div class="max-w-lg mx-auto">
                <button class="text-sm text-indigo-600 font-semibold mb-6" data-portal-action="showAmbulanceHome">&larr; Back</button>
                <div class="bg-white p-8 rounded-lg shadow-md border">
                    <div class="text-center mb-6"><div class="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100"><svg class="h-6 w-6 text-red-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" /></svg></div><h3 class="text-xl font-bold mt-4">Emergency Details</h3><p class="text-sm text-gray-500">Please provide the following information</p></div>
                    <form class="space-y-4">
                        <div><label class="text-sm font-medium">Patient Name</label><input type="text" class="w-full mt-1 p-2 border rounded-md"></div>
                        <div><label class="text-sm font-medium">Your Phone Number</label><input type="text" class="w-full mt-1 p-2 border rounded-md"></div>
                        <div><label class="text-sm font-medium">Current Address/Location</label><input type="text" class="w-full mt-1 p-2 border rounded-md"></div>
                        <div><label class="text-sm font-medium">Describe the emergency (chest pain, accident, etc.)</label><textarea class="w-full mt-1 p-2 border rounded-md h-24"></textarea></div>
                        <div class="flex space-x-4 pt-4"><button type="button" class="w-full py-2 rounded-md border" data-portal-action="showAmbulanceHome">Cancel</button><button type="submit" class="w-full py-2 rounded-md bg-red-500 text-white font-semibold">Request Ambulance</button></div>
                    </form>
                </div>
            </div>`,
        journeyTracker: `
             <div class="max-w-3xl mx-auto">
                <button class="text-sm text-indigo-600 font-semibold mb-8" data-portal-action="showHome">&larr; Back to Home</button>
                <div class="bg-indigo-50 border border-indigo-200 text-center p-4 rounded-lg mb-6"><p class="font-bold">Patient #SDUXF</p><p class="text-sm text-indigo-700">Being Evaluated</p></div>
                <div class="bg-white p-6 rounded-lg shadow-sm border mb-6">
                    <h3 class="font-bold mb-4">Current Status</h3>
                    <div class="flex justify-between items-center"><p>Location</p><p class="font-semibold">Bed 12, Wing A</p></div>
                    <div class="flex justify-between items-center mt-2"><p>Estimated Wait</p><span class="bg-orange-100 text-orange-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">15-20 minutes</span></div>
                </div>
                 <div class="bg-white p-6 rounded-lg shadow-sm border"><h3 class="font-bold mb-4">Journey Progress</h3><!-- ... Journey steps here ... --></div>
                 <div class="bg-white p-6 rounded-lg shadow-sm border mt-6"><h3 class="font-bold mb-4">Hospital Information</h3><!-- ... Hospital info here ... --></div>
             </div>`
    };

    // --- Functions ---
    function switchPage(pageId) {
        pages.forEach(page => page.style.display = 'none');
        const pageToShow = document.getElementById(pageId + '-page');
        if (pageToShow) {
            pageToShow.style.display = 'block';
        }

        links.forEach(link => {
            const isActive = link.dataset.page === pageId;
            link.classList.toggle('active', isActive);
            if (isActive) {
                pageTitle.textContent = link.querySelector('span').textContent;
            }
        });
    }

    function renderPatientPortal(view) {
        patientPortalContainer.innerHTML = patientPortalTemplates[view];
    }

    function renderTriagePatient(patient) {
        const triageLevelColors = {
            1: 'bg-red-100 text-red-800',
            2: 'bg-orange-100 text-orange-800',
            3: 'bg-yellow-100 text-yellow-800',
            4: 'bg-green-100 text-green-800',
            5: 'bg-blue-100 text-blue-800',
        };
        const color = triageLevelColors[patient.triageLevel] || 'bg-gray-100 text-gray-800';

        return `
            <div class="border p-4 rounded-lg bg-gray-50">
                <p class="font-bold text-gray-800">${patient.name} (${patient.age}, ${patient.gender})</p>
                <p class="text-sm text-gray-600 mt-1">${patient.complaint}</p>
                <p class="text-xs text-gray-500 mt-2">Vitals: ${patient.vitals || 'N/A'}</p>
                <div class="flex items-center space-x-2 mt-3">
                    <span class="${color} text-xs font-semibold px-2.5 py-0.5 rounded-full">Level ${patient.triageLevel}</span>
                    <span class="text-xs text-gray-500 font-mono">${patient.id}</span>
                    <span class="bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">Queue: #${patient.queueNumber}</span>
                </div>
                <button class="w-full bg-red-500 hover:bg-red-600 text-white mt-4 py-2 rounded-lg font-semibold">Triage Patient</button>
            </div>`;
    }

    async function fetchAndRenderTriage() {
        const response = await fetch('/api/patients/awaiting-triage');
        const patients = await response.json();
        awaitingTriageColumn.innerHTML = '';
        patients.forEach(patient => {
            awaitingTriageColumn.innerHTML += renderTriagePatient(patient);
        });
        awaitingTriageCount.textContent = patients.length;
    }

    async function renderSchedule() {
        const response = await fetch('/api/staff');
        const staffSchedule = await response.json();
        scheduleGrid.innerHTML = '';
        staffSchedule.forEach(staff => {
            const statusClass = {
                'Available': 'bg-green-100 text-green-800',
                'With Patient': 'bg-blue-100 text-blue-800',
                'On Break': 'bg-yellow-100 text-yellow-800'
            };
            const staffCard = `
                <div class="border rounded-lg p-4 bg-gray-50">
                    <div>
                        <p class="font-bold">${staff.name}</p>
                        <p class="text-sm text-gray-500">${staff.role}</p>
                    </div>
                    <div class="flex justify-between items-center mt-4">
                        <span class="text-xs font-semibold px-2.5 py-0.5 rounded-full ${statusClass[staff.status] || 'bg-gray-100 text-gray-800'}">${staff.status}</span>
                        <span class="text-xs font-semibold text-gray-600">${staff.queue} Patients Waiting</span>
                    </div>
                </div>`;
            scheduleGrid.insertAdjacentHTML('beforeend', staffCard);
        });
    }


    // --- Event Listeners ---
    links.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            switchPage(this.dataset.page);
        });
    });

    patientPortalContainer.addEventListener('click', function(e) {
        const action = e.target.closest('[data-portal-action]')?.dataset.portalAction;
        if (action) {
            e.preventDefault();
            switch(action) {
                case 'showHome': renderPatientPortal('home'); break;
                case 'showAmbulanceHome': renderPatientPortal('ambulanceHome'); break;
                case 'showAmbulanceForm': renderPatientPortal('ambulanceForm'); break;
                case 'showTracker': renderPatientPortal('journeyTracker'); break;
            }
        }
    });

    // --- Interactive Header Dropdowns ---
    notificationButton.addEventListener('click', (e) => {
        e.stopPropagation();
        notificationDropdown.classList.toggle('hidden');
        userDropdown.classList.add('hidden'); // Hide other dropdown
    });

    userButton.addEventListener('click', (e) => {
        e.stopPropagation();
        userDropdown.classList.toggle('hidden');
        notificationDropdown.classList.add('hidden'); // Hide other dropdown
    });

    document.addEventListener('click', () => {
        notificationDropdown.classList.add('hidden');
        userDropdown.classList.add('hidden');
    });

    // --- Add Patient Modal Logic ---
    addPatientButton.addEventListener('click', () => { addPatientModal.classList.remove('hidden'); });
    const closeAddPatientModal = () => addPatientModal.classList.add('hidden');
    closeModalButton.addEventListener('click', closeAddPatientModal);
    cancelModalButton.addEventListener('click', closeAddPatientModal);

    addPatientForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const patient = Object.fromEntries(formData.entries());

        await fetch('/api/patients/awaiting-triage', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(patient)
        });

        e.target.reset();
        closeAddPatientModal();
        fetchAndRenderTriage();
    });

    // --- Edit Profile Modal Logic ---
    myProfileLink.addEventListener('click', (e) => {
        e.preventDefault();
        editProfileForm.elements.name.value = userNameDisplay.textContent;
        editProfileForm.elements.email.value = userEmailDisplay.textContent;
        editProfileModal.classList.remove('hidden');
        userDropdown.classList.add('hidden');
    });

    const closeProfileModal = () => editProfileModal.classList.add('hidden');
    closeProfileModalButton.addEventListener('click', closeProfileModal);
    cancelProfileModalButton.addEventListener('click', closeProfileModal);

    editProfileForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const newName = editProfileForm.elements.name.value;
        const newEmail = editProfileForm.elements.email.value;
        userNameDisplay.textContent = newName;
        userEmailDisplay.textContent = newEmail;
        const initials = newName.split(' ').map(n => n[0]).join('').toUpperCase();
        userAvatar.src = `https://placehold.co/100x100/E0E7FF/4338CA?text=${initials}`;
        userAvatar.alt = `${newName} Avatar`;
        closeProfileModal();
    });

    // --- Add Schedule Modal Logic ---
    addScheduleButton.addEventListener('click', () => { addScheduleModal.classList.remove('hidden'); });
    const closeScheduleModal = () => addScheduleModal.classList.add('hidden');
    closeScheduleModalButton.addEventListener('click', closeScheduleModal);
    cancelScheduleModalButton.addEventListener('click', closeScheduleModal);

    addScheduleForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const newStaff = Object.fromEntries(formData.entries());

        await fetch('/api/staff', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newStaff)
        });

        e.target.reset();
        closeScheduleModal();
        renderSchedule();
    });


    // --- Initial Page Load ---
    switchPage('dashboard');
    renderPatientPortal('home');
    fetchAndRenderTriage();
    scheduleDate.textContent = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    renderSchedule();


    // --- Chart Initializations ---
    const commonChartOptions = { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } };

    new Chart(document.getElementById('patientArrivalsChart').getContext('2d'), { type: 'line', data: { labels: ['00:00', '03:00', '06:00', '09:00', '12:00', '15:00', '18:00', '21:00'], datasets: [{ data: [4, 3, 6, 8, 12, 16, 11, 7], borderColor: '#4338ca', tension: 0.4, fill: false, borderWidth: 2 }] }, options: commonChartOptions });
    new Chart(document.getElementById('emergencyImpactChart').getContext('2d'), { type: 'bar', data: { labels: ['08:00', '10:00', '12:00', '14:00', '16:00', '18:00'], datasets: [{ label: 'Standard', data: [12, 18, 18, 16, 18, 14], backgroundColor: '#3b82f6' }, { label: 'Emergency', data: [2, 3, 6, 8, 3, 2], backgroundColor: '#ef4444' }] }, options: { ...commonChartOptions, scales: { x: { stacked: true }, y: { stacked: true } } } });
    new Chart(document.getElementById('admissionForecastChart').getContext('2d'), { type: 'line', data: { labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'], datasets: [{ data: [140, 145, 155, 150, 160, 162, 158], borderColor: '#22c55e', tension: 0.4, fill: false, borderWidth: 2, borderDash: [5, 5] }, { data: [142, 148, 158], borderColor: '#16a34a', tension: 0.4, fill: false, borderWidth: 3 }] }, options: commonChartOptions });
});