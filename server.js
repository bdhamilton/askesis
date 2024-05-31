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
pool.query(`CREATE TABLE IF NOT EXISTS students (
  ID SERIAL PRIMARY KEY,
  firstname TEXT,
  lastname TEXT,
  email TEXT,
  registered DATE DEFAULT CURRENT_DATE
);`);

pool.query(`CREATE TABLE IF NOT EXISTS practice_records (
  ID SERIAL PRIMARY KEY,
  student INT REFERENCES students (id),
  date DATE,
  practiced BOOLEAN,
  note TEXT
);`);

pool.query(`CREATE TABLE IF NOT EXISTS teacher_notes (
  ID SERIAL PRIMARY KEY,
  student INT REFERENCES students (id),
  date DATE DEFAULT CURRENT_DATE,
  note TEXT,
  private BOOLEAN
);`);

// Serve main page
app.get("/", function(request, response) {
  const HTML = "<h1>Askesis</h1>";
  response.send(HTML);
});