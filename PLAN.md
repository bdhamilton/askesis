# App planning

This app should be able to:

* Register and authenticate users
  * There should be a moderation step so only my current students can join.
* Display a student's practice record
  * In calendar form
  * In data form (streak count, record for last week, record for last month, percentage for class period)
    * Already drafted
* Allow students to update their practice record
  * Mark that they've practiced
  * Add notes to a particular practice session
* Display _all_ students' practice records to the teacher
* Allow teacher to add private notes to a student's account
  * Also _public_ notes?

Here's a mockup of the [student view](./mockup.html) and the [teacher view](./mockup-backend.html).

## Notes

* The code to display a student's record should be reusable for both the student and the teacher. What changes is (1) a student can only see their own record, while the teacher can see everybody's; and (2) a student can edit their record, while the teacher needs only to read.
* The core of the entire program is a module that reads and updates a student's practice record. I should be able to write that now, given what I already know, except that I'll want to store the information in a database.

## Database design

### users

* user_id (pk)
* user_firstname (text)
* user_lastname (text)
* user_email (text)
* user_greekname (text)
<!-- * teacher (boolean) -->

### practice_records

* record_id (pk)
* user_id (fk) [many to one]
* date (datetime) 
* practiced (boolean)
* note (longtext)

### teacher_notes

* note_id (pk)
<!-- * teacher_id (fk) [many to one] -->
* user_id (fk) [many to one]
* date (datetime)
* note_title (text) [need it?]
* note (longtext)
* private (boolean)