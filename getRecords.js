// Set up Postgres
const pg = require("pg");
const pool = new pg.Pool();

// Create database tables
// Q: Do I need to put these in a unique database?
pool.query(`
CREATE TABLE IF NOT EXISTS
  students (
    student_id SERIAL PRIMARY KEY,
    first_name TEXT,
    last_name TEXT,
    email TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
`);

pool.query(`
CREATE TABLE IF NOT EXISTS
  practice_records (
    record_id SERIAL PRIMARY KEY,
    student INT 
      REFERENCES students (student_id),
    practice_date DATE,
    has_practiced BOOLEAN,
    note TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
`);

pool.query(`
CREATE TABLE IF NOT EXISTS
  teacher_notes (
    note_id SERIAL PRIMARY KEY,
    student INT
      REFERENCES students (student_id),
    note TEXT,
    is_private BOOLEAN,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
`);

/**
 * Get the student's current practice streak.
 * @param {number} studentId 
 * @returns {number} Days in current streak
 */
function getStreak(studentId) {
  // Grab the practice records for the current student
  const sqlParameters = [studentId];
  const sql = `
  SELECT 
    practice_date as date, 
    has_practiced as practiced 
  FROM practice_records
  WHERE student = ($1)
  ORDER BY practice_date DESC;
  `;

  const result = await pool.query(sql, sqlParameters, function (error, result) {
    if (error) {
      return "Could not get streak.";
    } else {
      // Initialize a count of their streak and a reference to today's date.
      let streakCount = 0;
      const today = new Date();

      // If the student has logged today, count the streak from today (daysBack = 0).
      // If not, count the streak from yesterday (daysBack = 1).
      let daysBack = new Date(result.rows[0].date) === today ? 0 : 1;

      // For each practice record:
      for (let record of result.rows) {
        // Get our dates to compare into a common format.
        const recordDate = new Date(record.date).toDateString();
        let dateToCheck = new Date(today);
        dateToCheck.setDate(today.getDate() - daysBack);
        dateToCheck = dateToCheck.toDateString();

        // Check that the student practiced on the previous day.
        if (recordDate === dateToCheck && record.practiced === true) {
          // If so, increment the count and set up to look at the previous day.
          streakCount++;
          daysBack++;
        } else {
          // If there's a gap in the record or a recorded miss, return the count.
          return streakCount;
        }
      }

      // If the student has practiced every single day, return the final count.
      return streakCount;
    }
  });
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

module.exports = { getStreak };