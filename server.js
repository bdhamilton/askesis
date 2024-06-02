// Set up Express
const express = require("express");
const app = express();
const port = 8000;

app.listen(port, function () {
  console.log("App listening on port: " + port);
});

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

// Serve main page
app.get("/", function(request, response) {
  // First, display the student's current streak.
  /**
   * TODO: student ID should be set dynamically.
   */
  const streakSql = `
  SELECT 
    practice_date as date, 
    has_practiced as practiced  
  FROM practice_records
  WHERE
    student = ($1)
  ORDER BY practice_date DESC;
  `;
  const streakParameters = [1];

  pool.query(streakSql, streakParameters, function (error, streakResult) {
    // Initialize a count of their streak and a reference to today's date.
    let streakCount = 0;
    const today = new Date();
    
    // If the student has logged today, count the streak from today (daysBack = 0).
    // If not, count the streak from yesterday (daysBack = 1).
    let daysBack = new Date(streakResult.rows[0].date) === today ? 0 : 1;

    // For each practice record:
    for (let record of streakResult.rows) {
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
        // If there's a gap in the record or a recorded miss, stop counting.
        /**
         * TODO: once I spin this off into its own 
         * function, that function should return here.
         * For now, just break.
         */
        break;
      }
    }

    const HTML = `<h1>Askesis</h1><p>Current Streak: ${streakCount}<p>`;
    response.send(HTML);
  });
  

});