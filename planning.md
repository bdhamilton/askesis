# App planning

This app should be able to:

* Register and authenticate users
  * There should be a moderation step so only my current students can join.
* Display a student's practice record
  * In calendar form
  * In data form (streak count, record for last week, record for last month, percentage for class period)
* Allow students to update their practice record
  * Mark that they've practiced
  * Add notes to a particular practice session
* Display _all_ students' practice records to the teacher
* Allow teacher to add private notes to a student's account
  * Also _public_ notes?

## Observations

* The code to display a student's record should be reusable for both the student and the teacher. What changes is (1) a student can only see their own record, while the teacher can see everybody's; and (2) a student can edit their record, while the teacher can only read their record.