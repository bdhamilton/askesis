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

// Set up to parse form input
app.use(express.json());
app.use(express.urlencoded());

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
    practice_date DATE DEFAULT CURRENT_DATE,
    has_practiced BOOLEAN,
    note TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
`);

// pool.query(`
// CREATE TABLE IF NOT EXISTS
//   teacher_notes (
//     note_id SERIAL PRIMARY KEY,
//     student INT
//       REFERENCES students (student_id),
//     note TEXT,
//     is_private BOOLEAN,
//     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
//   );
// `);

// Serve main page
app.get("/", async function(request, response) {
  const countFromPastSevenDays = await getCountFromPastSevenDays();
  const recentPractice = await getRecent();
  const practices = await getMonth();
  response.render("home", { countFromPastSevenDays, recentPractice, practices });
});

app.get("/:year/:month", async function (request, response) {
  const countFromPastSevenDays = await getCountFromPastSevenDays();
  const recentPractice = await getRecent();
  const practices = await getMonth(request.params.year, request.params.month);
  response.render("home", { countFromPastSevenDays, recentPractice, practices });
});

app.post("/:year/:month/:day", async function (request, response) {
  const dateString = `${request.params.year}-${request.params.month}-${request.params.day}`;
  let sql;
  let sqlParameters;

  if (request.body.alreadyLogged === "true") {
    sqlParameters = [1, dateString, request.body.note];
    sql = `
    UPDATE practice_records
    SET
      note = ($3)
    WHERE
      student = ($1) AND
      practice_date = ($2);
    `;
  } else {
    let practiced = request.  body.practiced || false;
    sqlParameters = [1, dateString, request.body.note, practiced];

    sql = `
    INSERT INTO practice_records
      (student, practice_date, note, has_practiced)
    VALUES
      (($1), ($2), ($3), ($4));      
    `;
  }

  pool.query(sql, sqlParameters, function (error) {
    if (error) {
      console.log(error);
    }

    response.redirect("/");
  });
});

/**
 * Query the database for the number of times the student
 * has practiced in the past seven days.
 * @returns {number} Number of practice sessions out of seven.
 */
async function getCountFromPastSevenDays() {
  const sql = `
  SELECT 
    COUNT(*)
  FROM practice_records
  WHERE
    student = ($1) AND
    has_practiced = true AND
    practice_date BETWEEN (CURRENT_TIMESTAMP - Interval '7 days') AND CURRENT_TIMESTAMP
  ;`;
  const sqlParameters = [1];
  const records = await pool.query(sql, sqlParameters);

  // Return the number of the count
  return records.rows[0].count;
}

/**
 * Query the database for the number of days in a row
 * the student has practiced.
 * @returns {number} Length of streak
 */
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
  let daysBack = new Date(records.rows[0].date).toDateString() === today.toDateString() ? 0 : 1;

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

/**
 * Query the database for one month's worth of records
 * @param {number} year Year for which you want records 
 * @param {number} month Month for which you want records (Jan = 1)
 * @returns {array} Array of objects, one for each day of the month
 */
async function getMonth(year, month) {
  const today = new Date();
  const queryYear = year || today.getFullYear();
  const queryMonth = month || today.getMonth() + 1;

  const sql = `
    SELECT 
      TO_CHAR(practice_date, 'YYYY-MM-DD') AS date,
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

    return { year: queryYear, month: queryMonth, records: records.rows };
}

/**
 * Query the database for practice records from yesterday and today
 * @returns {Object} Object containing `today` and `yesterday` objects
 */
async function getRecent() {
  // Get practice records from yesterday and today
  const sql = `
  SELECT 
    to_char(practice_date, 'YYYY-MM-DD') as date,
    has_practiced, 
    note
  FROM practice_records
  WHERE
    student = 1 AND
    practice_date BETWEEN 
      CURRENT_DATE - INTERVAL '1 day' AND
      CURRENT_DATE
  ORDER BY practice_date;
  `;
  const records = await pool.query(sql);

  // Get date strings for today and yesterday
  // and get them into YYYY-MM-DD format
  const todaysDate = formatDate(new Date());
  let yesterdaysDate = new Date(todaysDate + "T12:00:00");
  yesterdaysDate.setDate(yesterdaysDate.getDate() - 1);
  yesterdaysDate = formatDate(yesterdaysDate);

  // Assume the student has _not_ logged either day.
  const today = { 
    url: formatDateStringAsUrl(todaysDate),
    isLogged: false,
  };
  const yesterday = { 
    url: formatDateStringAsUrl(yesterdaysDate),
    isLogged: false,
  };

  // But then check to see if they have.
  for (let i = 0; i < records.rows.length; i++) {
    // For whatever date we find, update the information.
    if (records.rows[i].date === todaysDate) {
      today.isLogged = true;
    } else if (records.rows[i].date === yesterdaysDate) {
      yesterday.isLogged = true;
    }
  }

  return { today, yesterday };
}

/**
 * Format a date object in ISO style
 * @param {Object} date The date to be formatted
 * @return {string} e.g., '2024-06-09'
 */
function formatDate(date) {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const day = date.getDate().toString().padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Format a date string in ISO format to a URL.
 * Can handle YYYY, YYYY-MM, or YYYY-MM-DD.
 * @param {string} date e.g., '2024-06-09'
 * @return {string} e.g., '/2024/06/09'
 */
function formatDateStringAsUrl(date) {
  const dateParts = date.split("-");
  let dateUrl = '';

  for (let i = 0; i < dateParts.length; i++) {
    dateUrl += `/${dateParts[i]}`;
  }

  return dateUrl;
}