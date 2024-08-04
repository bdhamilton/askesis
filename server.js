// Grab config files
require('dotenv').config()

// Set up Express
const express = require("express");
const app = express();
const port = process.env.PORT;

app.listen(port, function () {
  console.log("App listening on port: " + port);
});

// Set up the EJS template engine
app.set('view engine', 'ejs');
app.set('views', './views/');
app.use(express.static(__dirname + '/static'));

// Set up to parse form input
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Set up Postgres
const pg = require("pg");
const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});

// Set up nodemailer
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "bdhamilton@gmail.com",
    pass: process.env.GMAIL,
  },
});

// Create database tables
pool.query(`
CREATE TABLE IF NOT EXISTS
  students (
    student_id SERIAL PRIMARY KEY,
    first_name TEXT,
    last_name TEXT,
    email TEXT UNIQUE,
    phone TEXT UNIQUE,
    hashed_password BYTEA,
    salt BYTEA
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

// Get authentication packages
const session = require('express-session');
const passport = require('passport');
const LocalStrategy = require('passport-local');
const crypto = require('crypto');

// Set up a session
app.use(session({
  secret: process.env.SESSION_SECRET, // random string used to authenticate a session
  resave: false, // don't save session if unchanged
  saveUninitialized: false // don't create session until something stored
}));

// Run passport.authenticate('session') on every request
app.use(passport.authenticate('session'));

// Set up a local authentication strategy
passport.use(new LocalStrategy(function verify(email, password, callback) {
  const sql = 'SELECT * FROM students WHERE email = ($1);';
  const sqlParameters = [email];

  // Run SQL query and provide function to call once it's done
  pool.query(sql, sqlParameters, function(error, studentResult) {
    // If there was an error, send it to the callback.
    if (error) { 
      return callback(error);
    }

    // If student doesn't exist, send it to the callback.
    if (!studentResult || studentResult.rows.length === 0) { 
      return callback(null, false, {message: 'Incorrect email address or password.'}); 
    }

    const student = studentResult.rows[0]; 

    // Hash the supplied password then check it against database.
    crypto.pbkdf2(password, student.salt, 310000, 32, 'sha256', function(error, hashedPassword) {
      if (error) { 
        return callback(error); 
      }

      // If passwords don't match, send error to callback.
      if (!crypto.timingSafeEqual(student.hashed_password, hashedPassword)) {
        return callback(null, false, { message: 'Incorrect email address or password.' });
      }

      // If passwords do match, send student to callback.
      return callback(null, student);
    });
  });
}));

// Maintain login sessions
passport.serializeUser(function(student, callback) {
  // Save an object with the student's id and username
  callback(null, { id: student.student_id, firstName: student.first_name, email: student.email });
});

passport.deserializeUser(function(student, callback) {
  // No changes needed, we just want the user object that we defined in serializeUser's function
  callback(null, student);
});

// Serve main teacher page
app.get("/teacher", async function(request, response) {
  // Only allow access if _I_ am logged in.
  if (!request.isAuthenticated() || request.user.email !== 'bdhamilton@gmail.com') {
    return response.redirect('/login');
  }

  // Get a list of all students
  const students = await getStudentList();

  // For each student:
  for (let i = 0; i < students.length; i++) {

    students[i].week = await getWeek(students[i].id);
  }

  response.render("teacher", { students });
});

// Get current information about a particular student
app.get("/teacher/:student_id", async function(request, response) {
  // Only allow access if _I_ am logged in.
  if (!request.isAuthenticated() || request.user.email !== 'bdhamilton@gmail.com') {
    return response.redirect('/login');
  }

  const calendar = await getCalendar(request.params.student_id);
  const week = await getWeek(request.params.student_id);
  const student = await getStudent(request.params.student_id);
  response.render("teacher-detail", { calendar, week, student });
});

app.get("/teacher/:student_id/:year/:month", async function(request, response) {
  // Only allow access if _I_ am logged in.
  if (!request.isAuthenticated() || request.user.email !== 'bdhamilton@gmail.com') {
    return response.redirect('/login');
  }

  const calendar = await getCalendar(request.params.student_id, request.params.year, request.params.month);
  const week = await getWeek(request.params.student_id);
  const student = await getStudent(request.params.student_id);
  response.render("teacher-detail", { calendar, week, student });
});

app.get("/teacher/:student_id/:year/:month/:day", async function(request, response) {
  // Only allow access if _I_ am logged in.
  if (!request.isAuthenticated() || request.user.email !== 'bdhamilton@gmail.com') {
    return response.redirect('/login');
  }

  const student = await getStudent(request.params.student_id);
  const calendar = await getCalendar(request.params.student_id, request.params.year, request.params.month, request.params.day);
  const week = await getWeek(request.params.student_id);
  const todaysRecord = await getDay(request.params.student_id, request.params.year, request.params.month, request.params.day);
  response.render("teacher-detail", { calendar, week, student, todaysRecord });
});

// Serve main student page
app.get("/", async function(request, response) {
  // If user is not logged in, redirect to login page.
  if (!request.isAuthenticated()) {
    return response.redirect('/login');
  }

  const student = request.user;
  const week = await getWeek(student.id);
  const recentPractice = await getRecent(student.id);
  const calendar = await getCalendar(student.id);
  response.render("student", { week, recentPractice, calendar, student });
});

// Serve calendar from a specific month
app.get("/:year/:month", async function (request, response) {
  // If user is not logged in, redirect to login page.
  if (!request.isAuthenticated()) {
    return response.redirect('/login');
  }
  
  const student = request.user;
  const week = await getWeek(student.id);
  const recentPractice = await getRecent(student.id);
  const calendar = await getCalendar(student.id, request.params.year, request.params.month);
  response.render("student", { week, recentPractice, calendar, student });
});

// Serve calendar and note from a specific day
app.get("/:year/:month/:day", async function (request, response) {
  // If user is not logged in, redirect to login page.
  if (!request.isAuthenticated()) {
    return response.redirect('/login');
  }
  
  const student = request.user;
  const week = await getWeek(student.id);
  const recentPractice = await getRecent(student.id);
  const calendar = await getCalendar(student.id, request.params.year, request.params.month, request.params.day);
  const todaysRecord = await getDay(student.id, request.params.year, request.params.month, request.params.day);
  response.render("student", { week, recentPractice, calendar, todaysRecord, student });
});

// Add or update a record for a specific day
app.post("/:year/:month/:day", async function (request, response) {
  // Build a date string from the URL
  const dateString = `${request.params.year}-${request.params.month}-${request.params.day}`;

  // If the date is in the future, ignore the request.
  /**
   * TODO: is there a better way to do this error handling?
   */
  const today = new Date();
  const todayString = formatDate(today);
  if (todayString < dateString) {
    response.redirect(formatDateStringAsUrl(dateString));
    return;
  }

  const student = request.user;
  let sql;
  let sqlParameters;

  // If the record has already been logged, we're updating the note.
  if (request.body.logged === "true") {
    sqlParameters = [student.id, dateString, request.body.note];
    sql = `
    UPDATE practice_records
    SET
      note = ($3)
    WHERE
      student = ($1) AND
      practice_date = ($2);
    `;

  // If the record hasn't been logged, we're making a new entry
  } else {
    // If the student is adding a note to an earlier practice session
    // that they didn't log, mark that they didn't practice.
    let practiced = request.body.practiced || false;
    sqlParameters = [student.id, dateString, request.body.note, practiced];

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

    // Send the student to the date they just updated.
    response.redirect(formatDateStringAsUrl(dateString));
  });
});

// Serve a login form.
app.get('/login', function(request, response, next) {
  // If user is already logged in, redirect them to the home page
  if (request.isAuthenticated()) {
    return response.redirect('/');
  }

  // Render login.ejs
  response.render("login");
});

// Handle logins
// If teacher is logging in, send to teacher page; otherwise send to root
app.post('/login/password', 
  passport.authenticate('local', { failureRedirect: '/login', failureMessage: true }), 
  function(request, response) {
    if (request.user.email === "bdhamilton@gmail.com") {
      response.redirect("/teacher/");
    } else {
      response.redirect("/");
    }
  }
);

// Handle logouts
app.post('/logout', function(request, response) {
  // Call the logout function stored on the request object
  // This will remove request.user and clear login session
  request.logout(function(error) {
    if (error) { 
      response.send("<h1>Logout Error</h1>");
    } else {
      response.redirect("/login");
    }
  });
});

// Serve registration form
app.get('/register', function(request, response, next) {
  response.render("register");
});

// Handle registrations
app.post('/register', function(request, response, next) {
  // Use crypto to generate new salt
  const salt = crypto.randomBytes(16);

  // Call pbkdf2 (a hash function) to hash entered password
  crypto.pbkdf2(request.body.password, salt, 310000, 32, 'sha256', function(error, hashedPassword) {
    if (error) { 
      return next(error);
    }

    // Define SQL query to save new user in Users table
    const sql = `
    INSERT INTO students 
      (first_name, last_name, email, hashed_password, salt)
    VALUES 
      (($1), ($2), ($3), ($4), ($5))
    RETURNING student_id;
    `;
    const sqlParams = [request.body.firstName, request.body.lastName, request.body.email, hashedPassword, salt];

    // Run sql query
    pool.query(sql, sqlParams, function(error, result) {
      if (error) {
        return next(error); 
      }

      // Create student object with necessary information
      // (Use keys that match database columns, so we don't have to deal
      // with naming conflicts during login.)
      const student = { student_id: result.rows[0].student_id, first_name: request.body.firstName, email: request.body.email };

      // Send myself a message letting me know that someone registered
      const message = {
        from: "Askesis <bdhamilton@gmail.com>",
        to: "bdhamilton@gmail.com",
        subject: "Someone registered!",
        text: `${student.first_name} ${request.body.lastName} (${student.email}) registered for Askesis!`,
      };
    
      transporter.sendMail(message, (error, info) => {
        if (error) {
          return console.log(error);
        }
      });

      // Call login function (also from passport) to create new login session
      request.login(student, function(error) {
        if (error) {
          return next(error); 
        }

        // Once login is done, go to home page
        response.redirect('/');
      });
    });
  });
});


/**
 * Build a calendar with all practice records from
 * a given month.
 * @param {integer=} year Defaults to current year
 * @param {integer=} month Defaults to current month
 * @param {integer} day Optional
 * @returns {Object} .monthTitle, .days, .lastMonthUrl, .nextMonthUrl
 */
async function getCalendar(studentId, year, month, day) {
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

  // If a day has been specified, get that one too.
  const selectedDate = day ? new Date(year, month - 1, day, 0, 0, 0, 0) : undefined;

  // The first day we'll need to include in the calendar
  const nextDay = new Date(monthToDisplay);
  nextDay.setDate(monthToDisplay.getDate() - monthToDisplay.getDay());

  // [2] Get records from database and cue up the first record.
  const records = await getMonth(studentId, year, month);
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
    if (nextDay <= today) {
      calendarDay.editable = true;
    }

    // If this day is today, mark it.
    if (nextDay.toString() === today.toString()) {
      calendarDay.today = true;
    }

    if (selectedDate && nextDay.toString() === selectedDate.toString()) {
      calendarDay.selected = true;
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
 * Query the database for the number of days in a row
 * the student has practiced.
 * [NB: Not currently used.]
 * @returns {number} Length of streak
 */
async function getStreak(studentId) {
  const streakSql = `
  SELECT 
    practice_date as date, 
    has_practiced as practiced  
  FROM practice_records
  WHERE
    student = ($1)
  ORDER BY practice_date DESC;
  `;
  const streakParameters = [studentId];
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
async function getMonth(studentId, year, month) {
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
  const sqlParameters = [studentId, year, month];

  const records = await pool.query(sql, sqlParameters);

  // We want to return an array even if there are no records,
  // but containing nothing.
  /**
   * TODO: Is returning as an array important here?
   */
  return records.length === 0 ? [null] : records.rows;
}

/**
 * Check a student's record over the past week
 * @param {integer} studentId 
 * @returns {Object} week.count and week.trend
 */
async function getWeek(studentId) {
  // Get record count for past two weeks.
  /**
   * TODO: is there a good way to do this in SQL, without two queries?
   * I think I should be able to do a union, but that's slightly above
   * my pay grade at the moment. I'll return to that.
   */
  const sqlParams = [studentId];
  const sqlPastWeek = `
  SELECT 
    COUNT(*)
  FROM practice_records
  WHERE
    student = ($1) AND
    has_practiced = true AND
    practice_date BETWEEN (CURRENT_TIMESTAMP - Interval '7 days') AND CURRENT_TIMESTAMP
  ;`;
  const sqlPriorWeek = `
    SELECT 
    COUNT(*)
  FROM practice_records
  WHERE
    student = ($1) AND
    has_practiced = true AND
    practice_date 
      BETWEEN (CURRENT_TIMESTAMP - Interval '14 days') 
      AND (CURRENT_TIMESTAMP - Interval '7 days')
  ;`;

  const pastWeek = await pool.query(sqlPastWeek, sqlParams);
  const priorWeek = await pool.query(sqlPriorWeek, sqlParams);

  // Grab the past week's count and initialize a week object.
  const week = {
    count: pastWeek.rows[0].count,
  }

  // Specify the trend
  if (pastWeek.rows[0].count > priorWeek.rows[0].count) {
    week.trend = "up";
  } else if (pastWeek.rows[0].count < priorWeek.rows[0].count) {
    week.trend = "down";
  } else {
    week.trend = "even";
  }

  // Return the number of the count
  return week;
}

/**
 * Query the database for records for a specific day.
 * @param {integer} year 
 * @param {integer} month 
 * @param {integer} day 
 * @returns {Object}
 */
async function getDay(studentId, year, month, day) {
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
  const sqlParameters = [studentId, dateString];
  const records = await pool.query(sql, sqlParameters);


  // Construct the object
  const todaysRecord = { date, longDate };

  if (records.rows.length === 0) {
    todaysRecord.logged = false;
  } else {
    todaysRecord.logged = true;
    todaysRecord.practiced = records.rows[0].practiced;
    todaysRecord.note = records.rows[0].note;
  }

  // Check if the requested date is in the future
  const today = new Date();
  if (date > today) {
    todaysRecord.future = true;
  }

  return todaysRecord;
}

/**
 * Query the database for practice records from yesterday and today
 * @returns {Object} Object containing `today` and `yesterday` objects
 */
async function getRecent(studentId) {
  // Get practice records from yesterday and today
  const sql = `
  SELECT 
    to_char(practice_date, 'YYYY-MM-DD') as date,
    has_practiced, 
    note
  FROM practice_records
  WHERE
    student = ($1) AND
    practice_date BETWEEN 
      CURRENT_DATE - INTERVAL '1 day' AND
      CURRENT_DATE
  ORDER BY practice_date;
  `;
  const sqlParameters = [studentId];
  const records = await pool.query(sql, sqlParameters);

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
 * Get a list of all current students
 * @returns {array}
 */
async function getStudentList() {
  // Get all the students from the database
  const sql = `
  SELECT 
    student_id,
    email,
    CONCAT_WS(' ', first_name, last_name) AS full_name,
    phone
  FROM 
    students
  ORDER BY last_name;
  `;
  const records = await pool.query(sql);

  // Build an array of all students
  const students = [];
  for (let i = 0; i < records.rowCount; i++) {
    const student = {
      id: records.rows[i].student_id,
      fullName: records.rows[i].full_name,
      email: records.rows[i].email,
      phone: records.rows[i].phone
    }

    students.push(student);
  }

  // Return the array
  return students;
}

async function getStudent(studentId) {
  const sql = `
  SELECT
    student_id,
    email,
    CONCAT_WS(' ', first_name, last_name) AS full_name,
    phone
  FROM 
    students
  WHERE 
    student_id = ($1);
  `;
  const sqlParams = [studentId];

  const record = await pool.query(sql, sqlParams);

  return {
    id: record.rows[0].student_id,
    email: record.rows[0].email,
    fullName: record.rows[0].full_name,
    phone: record.rows[0].phone
  };
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

/**
 * TEACHER EMAIL NOTIFICATIONS
 */

// Set up cron job to email teacher daily
const cron = require('cron');

async function sendWeeklySummary() {
  // Get a list of all students
  const students = await getStudentList();

  // For each student:
  for (let i = 0; i < students.length; i++) {
    students[i].week = await getWeek(students[i].id);
  }

  let summary = '';
  for (let student of students) {
    summary += `<p>${student.fullName}: ${student.week.count} of last 7 days (trending ${student.week.trend})</p>\n`;
  }
  summary += `<p><a href="https://askesis.hmltn.dev/teacher/">View all</a></p>`;

  const message = {
    from: "Askesis <bdhamilton@gmail.com>",
    to: "bdhamilton@gmail.com",
    subject: "Student practice summary",
    html: summary,
  };

  transporter.sendMail(message, (error, info) => {
    if (error) {
      return console.log(error);
    }
  });
}

const job = new cron.CronJob(
	'0 0 9 * * 2,4',      // cronTime
	function() {          // onTick
    sendWeeklySummary();
  }, 
	null,                 // onComplete
	true,                 // start
	'America/New_York',    // timeZone
  null,
  true
);

/**
 * SEND SMS TO STUDENTS
 */
const twilio = require("twilio");

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const sms = twilio(accountSid, authToken);

const reminderJob = new cron.CronJob(
	'0 0 17 * * *',      // cronTime
	function() {          // onTick
    remindStudents();
  }, 
	null,                 // onComplete
	true,                 // start
	'America/New_York',    // timeZone
  null,
  true
);

async function remindStudents() {
  // Get phone numbers for students who haven't logged yet today.
  const sql = `
    SELECT 
      s.first_name as name,
      s.phone
    FROM students s
    WHERE 
      s.phone IS NOT NULL
      AND NOT EXISTS (
        SELECT 1
        FROM practice_records pr
        WHERE pr.student = s.student_id
        AND pr.practice_date = CURRENT_DATE
      )
    ;
  `;
  const records = await pool.query(sql);

  // Text each one asking if they've practiced.
  records.rows.forEach(student => {
    sms.messages.create({
      body: `χαῖρε, ${student.name}! ἄσκηκας σήμερον;`,
      from: "+18776981396",
      to: student.phone,
    });
  });
}