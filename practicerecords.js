class User {
  /** 
   * @param {text} name 
   * @param {boolean} isTeacher  
   */
  constructor(name, isTeacher = false) {
    this.name = name;
    this.isTeacher = isTeacher;
  }
}

class Record {
  /**
   * @param {Object} student 
   * @param {number} date
   * @param {boolean} practiced
   */ 
  constructor(student, date, practiced) {
    this.student = student;
    this.date = date;
    this.practiced = practiced;
    this.note = ''; // adding a note will be an optional second step
  }

  toggle() {
    this.practiced = this.practiced ? false : true;
  }

  updateNote(note) {
    this.note = note;
  }
}

/**
 * Provide some methods for accessing student records.
 * @param {number} user 
 */
function getStudentRecords(user) {
  // Filter the records array for records associated with the selected student.
  const studentRecords = [];
  for (let i = 0; i < records.length; i++) {
    if (records[i].student === users[user]) {
      studentRecords.push(records[i]);
    }
  }

  /**
   * Log the student's practice record for the past week.
   */
  function pastWeek() {
    const today = new Date(2024, 4, 26);
    let nextDay = new Date(2024, 4, 26);
    let recordIndex = studentRecords.length - 1;
    let practiceCount = 0;
    
    // For each of the last seven days (or as far back as the record goes),
    // check the student's practice record.
    for (let i = 0; i < 7 && recordIndex >= 0; i++) {
      // (I'm assuming here that the records are in descending date order, but
      // that won't always be true. This will behave differently once I'm
      // pulling from a database anyway.)

      // Update our date.
      nextDay.setDate(today.getDate() - i);

      // Counting from the end, if the next record is for today:
      if (studentRecords[recordIndex].date.getTime() === nextDay.getTime()) {
        // Log its value, increment practice count if appropriate, and update our index.
        console.log(nextDay.toDateString() + ": " + studentRecords[recordIndex].practiced);
        if (studentRecords[recordIndex].practiced === true) practiceCount++;
        recordIndex--;
      } else {
        // If there is no record for today, assume the student didn't practice.
        // Don't update recordIndex, so we can check this one again next round.
        console.log(nextDay.toDateString() + ": false");
      }
    }

    // Do the same thing for the previous week to find the trend.
    let previousPracticeCount = 0;

    for (let i = 7; i < 14 && recordIndex >= 0; i++) {
      // (I'm assuming here that the records are in descending date order, but
      // that won't always be true. This will behave differently once I'm
      // pulling from a database anyway.)

      // Update our date.
      nextDay.setDate(today.getDate() - i);

      // Counting from the end, if the next record is for today:
      if (studentRecords[recordIndex].date.getTime() === nextDay.getTime()) {
        // Log its value, increment practice count if appropriate, and update our index.
        console.log(nextDay.toDateString() + ": " + studentRecords[recordIndex].practiced);
        if (studentRecords[recordIndex].practiced === true) previousPracticeCount++;
        recordIndex--;
      } else {
        // If there is no record for today, assume the student didn't practice.
        // Don't update recordIndex, so we can check this one again next round.
        console.log(nextDay.toDateString() + ": false");
      }
    }

    // Compare practice rates and set the trend.
    let trend = '';
    if (practiceCount > previousPracticeCount) trend = "up";
    else if (practiceCount === previousPracticeCount) trend = "equal";
    else trend = "down";

    return { count: practiceCount, trend };
  }

  /**
   * Get the student's overall practice rate, expressed as a percentage.
   * @returns {string}
   */
  function practiceRate() {
    // Count the total number of completed practices the student has done.
    let daysPracticed = 0;
    for (let i = 0; i < studentRecords.length; i++) {
      if (studentRecords[i].practiced === true) {
        daysPracticed++;
      }
    }

    // Compare to the total number of days elapsed since we started tracking.
    const millisecondsElapsed = new Date() - studentRecords[0].date;
    const daysElapsed = Math.floor(millisecondsElapsed / (24 * 60 * 60 * 1000));
    const practiceRate = (daysPracticed / daysElapsed) * 100;
    const roundedPracticeRate = Math.round(practiceRate * 100) / 100;

    return roundedPracticeRate + "%";
  }

  // Allow only defined access methods
  return { pastWeek, practiceRate };
}

// Initialize a list of users and a list of records
const users = [];
const records = [];

// Add a dummy user and a few dummy records
users.push(new User("Brian"));
records.push(new Record(users[0], new Date(2024, 4, 10), true));
records.push(new Record(users[0], new Date(2024, 4, 15), true));
records.push(new Record(users[0], new Date(2024, 4, 21), true));
records.push(new Record(users[0], new Date(2024, 4, 23), false));
records.push(new Record(users[0], new Date(2024, 4, 24), true));
records.push(new Record(users[0], new Date(2024, 4, 25), true));

// Tests
const thisStudent = getStudentRecords(0);
console.table(thisStudent.pastWeek());
console.log("Your overall practice rate is " + thisStudent.practiceRate());