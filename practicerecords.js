/***
 * This module should:
 * - define a student class (spin off into own module later)
 * - define a record class
 * - define a function for adding a practice record
 * - define a function for updating a practice record
 */

class Student {
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