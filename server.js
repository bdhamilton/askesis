// Set up Express
const express = require("express");
const app = express();
const port = 8000;

app.listen(port, function () {
  console.log("App listening on port: " + port);
});

// Set up the template engine
app.set('view engine', 'ejs');
app.set('views', './views/');
app.use(express.static(__dirname + '/static'));

// Don't know if I need these yet:
// app.use(express.json());
// app.use(express.urlencoded());

// Set up Postgres
const pg = require("pg");
const pool = new pg.Pool();

// Create database tables
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

async function getStreak() {
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
  const records = await pool.query(streakSql, streakParameters);

  // Initialize a count of their streak and a reference to today's date.
  let streakCount = 0;
  const today = new Date();
  
  // If the student has logged today, count the streak from today (daysBack = 0).
  // If not, count the streak from yesterday (daysBack = 1).
  let daysBack = new Date(records.rows[0].date) === today ? 0 : 1;

  // For each practice record:
  for (let record of records.rows) {
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
      return streakCount;
    }
  }
}

async function getMonth(year, month) {
  const today = new Date();
  const queryYear = year || today.getFullYear();
  const queryMonth = month || today.getMonth() + 1;

  const sql = `
    SELECT 
      EXTRACT(DAY FROM practice_date) AS day,
      has_practiced AS practiced,
      note
    FROM practice_records
    WHERE
      student = ($1) AND
      EXTRACT(YEAR FROM practice_date) = ($2) AND
      EXTRACT(MONTH FROM practice_date) = ($3)
    ORDER BY practice_date
    ;`;
    const sqlParameters = [1, queryYear, queryMonth];

    const records = await pool.query(sql, sqlParameters);

    return records.rows;
}

// Serve main page
app.get("/", async function(request, response) {
  const streak = await getStreak();
  const thisMonthsRecords = await getMonth();
  response.render("home", { streak, thisMonthsRecords });
});