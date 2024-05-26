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
    let nextIndex = studentRecords.length - 1;
    let practiceCount = 0;
    
    // For each of the last seven days, check the student's practice record.
    for (let i = 0; i < 7; i++) {
      // (I'm assuming here that the records are in descending date order, but
      // that won't always be true. This will behave differently once I'm
      // pulling from a database anyway.)

      // If we're out of records to check, quit.
      if (nextIndex < 0) {
        console.log("This is as far back as your record goes.");
        break;
      }

      // Update our date.
      nextDay.setDate(today.getDate() - i);

      // Counting from the end, if the next record is for today:
      if (studentRecords[nextIndex].date.getTime() === nextDay.getTime()) {
        // Log its value, increment the practice count, and update our index.
        console.log(nextDay.toDateString() + ": " + studentRecords[nextIndex].practiced);
        if (studentRecords[nextIndex].practiced === true) practiceCount++;
        nextIndex--;
      } else {
        // If there is no record for today, assume the student didn't practice.
        console.log(nextDay.toDateString() + ": false");
        
        // Don't update nextIndex, so we can check this one again next round.
      }
    }

    console.log(`You have practiced ${practiceCount} out of the last 7 days.`);
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
records.push(new Record(users[0], new Date(2024, 4, 20), true));
records.push(new Record(users[0], new Date(2024, 4, 21), true));
records.push(new Record(users[0], new Date(2024, 4, 23), false));
records.push(new Record(users[0], new Date(2024, 4, 24), true));
records.push(new Record(users[0], new Date(2024, 4, 25), true));

// Tests
const thisStudent = getStudentRecords(0);
thisStudent.pastWeek();
console.log("Your overall practice rate is " + thisStudent.practiceRate());

/***
 * What's better, generally: two 
 */