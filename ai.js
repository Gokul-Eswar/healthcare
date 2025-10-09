const { GoogleGenerativeAI } = require("@google/generative-ai");

// IMPORTANT: In a real-world application, use environment variables for the API key.
// Do not hardcode it directly in the source code.
const API_KEY = process.env.GEMINI_API_KEY;

if (!API_KEY) {
    throw new Error("GEMINI_API_KEY environment variable not set.");
}

const genAI = new GoogleGenerativeAI(API_KEY);

const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

/**
 * Gets a triage level from the Gemini API based on a patient's complaint.
 * @param {string} complaint - The patient's chief complaint and vitals.
 * @returns {Promise<number>} - A promise that resolves to the triage level (1-5).
 */
async function getTriageLevel(complaint) {
  try {
    const prompt = `
      Based on the following patient complaint, assign a triage level from 1 to 5.
      - Level 1: Critical (Immediate, life-threatening)
      - Level 2: Emergent (Requires care within minutes)
      - Level 3: Urgent (Requires care within the hour)
      - Level 4: Less Urgent (Can wait a few hours)
      - Level 5: Non-Urgent (Can wait for an appointment)

      Patient Complaint: "${complaint}"

      Return only the integer triage level (1, 2, 3, 4, or 5).
    `;
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text().trim();

    // Ensure the response is a valid number between 1 and 5
    const level = parseInt(text, 10);
    if (isNaN(level) || level < 1 || level > 5) {
      console.error("Gemini API returned an invalid triage level:", text);
      return 3; // Default to Urgent if the response is invalid
    }

    return level;
  } catch (error) {
    console.error("Error getting triage level from Gemini API:", error);
    // In case of an API error, default to a safe triage level
    return 3; // Default to Urgent
  }
}

async function generateWeeklySchedule(doctors, nurses) {
  try {
    const prompt = `
      Create a 7-day staff schedule for a hospital emergency room with ${doctors} doctors and ${nurses} nurses.

      **Schedule Requirements:**
      1.  **Shifts:** There are three 8-hour shifts per day: Morning (7am-3pm), Afternoon (3pm-11pm), and Night (11pm-7am).
      2.  **Staffing:** Each shift must have exactly one doctor and one nurse.
      3.  **Balance:** Distribute the shifts as evenly as possible among all staff members.
      4.  **Rest:** Every staff member must have at least one full day off during the week.
      5.  **Fairness:** Avoid scheduling the same person for the night shift too many times in a row.

      **Output Format:**
      Return the schedule as a valid JSON object only, with the following structure:
      {
        "Monday": {
          "Morning": { "doctor": "Doctor Name", "nurse": "Nurse Name" },
          "Afternoon": { "doctor": "Doctor Name", "nurse": "Nurse Name" },
          "Night": { "doctor": "Doctor Name", "nurse": "Nurse Name" }
        },
        "Tuesday": { ... },
        "Wednesday": { ... },
        "Thursday": { ... },
        "Friday": { ... },
        "Saturday": { ... },
        "Sunday": { ... }
      }
    `;
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text().trim().replace(/```json/g, '').replace(/```/g, '');

    return JSON.parse(text);
  } catch (error) {
    console.error("Error generating schedule from Gemini API:", error);
    return { error: "Failed to generate schedule." };
  }
}

/**
 * Recommends a doctor for a patient based on their complaint and doctor availability.
 * @param {object} patient - The patient object.
 * @param {Array<object>} availableDoctors - A list of available doctors with their patient load.
 * @returns {Promise<string>} - A promise that resolves to the name of the recommended doctor.
 */
async function getDoctorForPatient(patient, availableDoctors) {
  try {
    const prompt = `
      A new patient needs to be assigned to a doctor. Here are the details:
      - Patient Complaint: "${patient.complaint}"
      - Triage Level: ${patient.triageLevel} (1=Critical, 5=Non-Urgent)

      Here is the list of available doctors and their current number of assigned patients:
      ${availableDoctors.map(d => `- ${d.name} (Patients: ${d.queue})`).join('\n')}

      Based on the patient's needs and the doctors' current workload, which doctor is the most suitable?
      Please return only the name of the recommended doctor.
    `;
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const doctorName = response.text().trim();

    // Validate that the returned name is one of the available doctors
    if (availableDoctors.some(d => d.name === doctorName)) {
      return doctorName;
    } else {
      console.error("Gemini API returned an invalid doctor name:", doctorName);
      // As a fallback, return the doctor with the fewest patients
      return availableDoctors.sort((a, b) => a.queue - b.queue)[0].name;
    }
  } catch (error) {
    console.error("Error getting doctor recommendation from Gemini API:", error);
    // As a fallback, return the doctor with the fewest patients
    return availableDoctors.sort((a, b) => a.queue - b.queue)[0].name;
  }
}

module.exports = { getTriageLevel, generateWeeklySchedule, getDoctorForPatient };