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
      Create a 7-day staff schedule for a hospital emergency room.
      We have ${doctors} doctors and ${nurses} nurses available.
      Assign one doctor and one nurse for each of the three 8-hour shifts per day (Morning, Afternoon, Night).
      Ensure the schedule is balanced and each staff member gets at least one day off.

      Return the schedule as a JSON object with the following structure:
      {
        "Monday": { "Morning": { "doctor": "Doctor Name", "nurse": "Nurse Name" }, ... },
        "Tuesday": { ... },
        ...
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

module.exports = { getTriageLevel, generateWeeklySchedule };