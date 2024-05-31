/**
 * Get the student's current practice streak.
 * @param {number} studentId 
 * @returns {number} Days in current streak
 */
function getStreak(studentId) {
  return streak;
}

/**
 * Get number of days practiced in the past week,
 * along with a note about whether that's more or
 * less than the previous week.
 * @param {number} studentId 
 * @returns {Object} 
 */
function getPastWeek(studentId) {
  const sql = `SELECT COUNT(*) FROM practice_records WHERE student = ($1) AND date BETWEEN CURRENT_DATE - INTERVAL '7 days' AND CURRENT_DATE;`;
  const sqlParams = [studentId];

  return { daysPracticed, trend };
}

/**
 * Get records for every day of the month, coded as
 * an object that includes, for each day, a `practiced`
 * boolean and an optional `note`.
 * @param {number} studentId 
 * @param {string} month E.g., "2024-05"
 * @returns {Object} 
 */
function getMonth(studentId, year, month) {
  const today = new Date();
  const queryYear = year || today.getFullYear();
  const queryMonth = month || today.getMonth() + 1;

  const sql = `SELECT * FROM practice_records WHERE student = ($1) AND EXTRACT(YEAR FROM date) = ($2) AND EXTRACT(MONTH FROM date) = ($3);`;
  const sqlParams = [studentId, queryYear, queryMonth];

  return practicesThisMonth;
}

/**
 * Get student's practice rate since they began.
 * @param {number} studentId 
 * @returns {number} 0-100, expressing a percentage
 */
function getPracticeRate(studentId) {
  return roundedPracticeRate;
}