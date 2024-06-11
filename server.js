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
    email TEXT
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
    note TEXT
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
  const calendar = await getCalendar();
  response.render("student", { countFromPastSevenDays, recentPractice, calendar });
});

app.get("/:year/:month", async function (request, response) {
  const countFromPastSevenDays = await getCountFromPastSevenDays();
  const recentPractice = await getRecent();
  const calendar = await getCalendar(request.params.year, request.params.month);
  response.render("student", { countFromPastSevenDays, recentPractice, calendar });
});

app.get("/:year/:month/:day", async function (request, response) {
  const countFromPastSevenDays = await getCountFromPastSevenDays();
  const recentPractice = await getRecent();
  const calendar = await getCalendar(request.params.year, request.params.month);
  const todaysRecord = await getDay(request.params.year, request.params.month, request.params.day) || { logged: false };
  response.render("student", { countFromPastSevenDays, recentPractice, calendar, todaysRecord });
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
    let practiced = request.body.practiced || false;
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

    response.redirect(formatDateStringAsUrl(dateString));
  });
});

/**
 * Build a calendar with all practice records from
 * a given month.
 * @param {integer=} year Defaults to current year
 * @param {integer=} month Defaults to current month
 * @returns {Object} .monthTitle, .days, .lastMonthUrl, .nextMonthUrl
 */
async function getCalendar(year, month) {
  // [1] Construct the date information we'll need.

  // Today, set to midnight (so we can check past or future)
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // The month we need to display
  year = year || today.getFullYear();
  month = month || today.getMonth() + 1;
  const monthToDisplay = new Date(year, month - 1, 1);
  const monthTitle = monthToDisplay.toLocaleString('default', { month: 'long', year: 'numeric' });

  // URLs for last month and next month
  const lastMonth = new Date(monthToDisplay);
  lastMonth.setMonth(monthToDisplay.getMonth() - 1);
  const lastMonthParts = formatDate(lastMonth).split("-");
  const lastMonthUrl = formatDateStringAsUrl(`${lastMonthParts[0]}-${lastMonthParts[1]}`);

  const nextMonth = new Date(monthToDisplay);
  nextMonth.setMonth(monthToDisplay.getMonth() + 1);
  const nextMonthParts = formatDate(nextMonth).split("-");
  const nextMonthUrl = formatDateStringAsUrl(`${nextMonthParts[0]}-${nextMonthParts[1]}`);

  // The first day we'll need to include in the calendar
  const nextDay = new Date(monthToDisplay);
  nextDay.setDate(monthToDisplay.getDate() - monthToDisplay.getDay());

  // [2] Get records from database and cue up the first record.
  const records = await getMonth(year, month);
  let nextRecordIndex = 0;
  let nextRecord = records[nextRecordIndex];

  // [3] Find how many total days the calendar will include,
  // including trailing and leading days of last and next month.
  
  // Get the length of this month by asking for the 0th
  // date of _next_ month. 
  let calendarLength = new Date(year, month, 0).getDate();

  // Add the trailing days of the previous month by 
  // adding the day index of the first day of the month.
  calendarLength = monthToDisplay.getDay() + calendarLength;

  // Then round up to the next multiple of seven to add
  // the leading days of the following month.
  calendarLength = Math.ceil(calendarLength / 7) * 7;

  // [4] Build a calendar array
  const days = [];

  for (let i = 0; i < calendarLength; i++) {
    // Get next day in ISO format
    const nextDayString = formatDate(nextDay);

    // Initialize an object with this day's information.
    const calendarDay = {
      fullDate: nextDayString,
      day: nextDay.getDate(),
      url: formatDateStringAsUrl(nextDayString)
    };

    // If we're in the month we want to display, mark it.
    if (nextDay.getMonth() === monthToDisplay.getMonth()) {
      calendarDay.thisMonth = true;
    }

    // If this day is in the past, mark it as editable.
    if (nextDay < today) {
      calendarDay.editable = true;
    }

    // If the student logged that day, use the logged info.
    // TODO: is there a better way of handling the situation where
    // the next record is undefined?
    if (nextRecord && nextRecord.date === nextDayString) {
      calendarDay.logged = true;
      calendarDay.practiced = nextRecord.practiced;
      calendarDay.note = nextRecord.note;

      // And move to the next database record
      nextRecordIndex++;
      nextRecord = records[nextRecordIndex];

    // Otherwise, assume the student did not practice.
    } else {
      calendarDay.logged = false;
      calendarDay.practiced = false;
    }

    // Add the day to the calendar and increment the day
    days.push(calendarDay);
    nextDay.setDate(nextDay.getDate() + 1);
  }

  // [5] Return the calendar.
  return { monthTitle, days, lastMonthUrl, nextMonthUrl };
}

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
  const sqlParameters = [1, year, month];

  const records = await pool.query(sql, sqlParameters);

  // We want to return an array even if there are no records,
  // but containing nothing.
  return records.length === 0 ? [null] : records.rows;
}

/**
 * Query the database for records for a specific day.
 * @param {integer} year 
 * @param {integer} month 
 * @param {integer} day 
 * @returns {Object}
 */
async function getDay(year, month, day) {
  // Format the date
  const date = new Date(year, month - 1, day);
  const dateString = formatDate(date);
  const longDate = date.toLocaleString('default', { month: 'long', day: 'numeric', year: 'numeric' });

  // Query the database
  const sql = `
    SELECT 
      TO_CHAR(practice_date, 'YYYY-MM-DD') AS date,
      has_practiced AS practiced,
      note
    FROM practice_records
    WHERE
      student = ($1) AND
      practice_date = ($2)
    ORDER BY practice_date
    `;
  const sqlParameters = [1,dateString];
  const records = await pool.query(sql, sqlParameters);


  // Construct the object
  const todaysRecord = { date, longDate };

  if (records.rows.length === 0) {
    todaysRecord.logged = false;
  } else {
    todaysRecord.logged = true;
    todaysRecord.practiced = records.rows[0].practiced;
    todaysRecord.note = note = records.rows[0].note;
  }

  return todaysRecord;
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
    logged: false,
  };
  const yesterday = { 
    url: formatDateStringAsUrl(yesterdaysDate),
    logged: false,
  };

  // But then check to see if they have.
  for (let i = 0; i < records.rows.length; i++) {
    // For whatever date we find, update the information.
    if (records.rows[i].date === todaysDate) {
      today.logged = true;
    } else if (records.rows[i].date === yesterdaysDate) {
      yesterday.logged = true;
    }
  }

  return { today, yesterday };
}

/**
 * Format a date object in ISO style
 * @param {Object} date The date to be formatted in JS date format
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