# askesis

An app for recording Greek practice.

Students can mark whether they practiced and add practice notes. Teacher can see practice records for all students.

Next features to implement:


* [ ] Students should be able to log practice via SMS
* [ ] Students should be able to reset their passwords
* [ ] Users not signed in should see a landing page with demo (mostly for potential employers)

## Versions

### 1.2: students should be able to log practice via SMS

* [X] It should be able to send texts to students
* [X] Database should include phone numbers
* [X] Every day at 5pm, it should text opted-in students who haven't logged a practice yet
* [X] It should accept a response from students to log their practice
  * [X] It should accept text messages
  * [X] It should respond to yes and no messages differently
  * [X] It should check if the incoming number is recognized
  * [X] If recognized and not yet logged, log the practice
  * [X] If recognized and already logged, confirm update and then log the practice
* [ ] It should follow up by asking them what they did
* [ ] It should allow students to add or delete a phone number

### 1.1: some teacher upgrades

* [X] The teacher should get an email every morning with a log of who practiced and who didn't
* [X] The teacher should be taken directly to teacher page when logged in

### 1.0: First public-facing version (tagged)

I finished the first public-ready version of this on June 14, 2024, and started sending it to students. I'll keep developing as necessary once I've got some user feedback.

### 0.8: Once more on the UI

- [X] Grey out future dates
- [X] Change the way notes are marked

### 0.7: Add detailed teacher view

- [X] There should be routers for detailed teacher views
  - [X] Current
  - [X] Month
  - [X] Day
- [X] There should be a `teacher-detail` template that displays relevant data

### 0.6: Add basic teacher view

- [X] There should be a special router for a teacher view.
- [X] The teacher view should only be visible to me.
- [X] It should list all students.
- [X] It should display each student's record for the past week.
- [X] It should indicate whether that record is trending up or down.
- [X] Style the student list

### 0.5: Add user registration and authentication

- [X] Student should have to log in to see records
- [X] Student should be greeted by name
- [X] Student should see their own records
- [X] Student should be able to log out
- [X] New students should be able to register

### 0.4: Reorganize and reconsider code

- [X] Serious work should happen outside of the template
  - [X] The recent practices should be calculated in server.js
  - [X] The calendar should be prepared in server.js
- [X] The practice form should be DRY
- [X] Recent practices should be properly calculated
- [X] Helper functions should clarify high level operation
- [X] All functions should be checked for correctness
- [X] All functions should be properly commented
- [X] Rewrite calendar to go to distinct day pages?

### 0.3: Re-figure the UI

- [X] The student should be prompted to log today's practice
- [X] The student should be prompted to log yesterday's practice
- [X] The calendar should be smaller and more concise
- [X] The calendar should clearly mark practice sessions
- [~] The calendar should clearly mark notes
- [X] There should be an easy way to read notes
- [X] There should be an easy way to edit notes

### 0.2: More sophisticated controls

- [X] The student should be able to view past records
- [X] The student should be able to edit past notes
- [X] The student should be able to update yesterday's record
- [X] The student should only be able to update dates in the past.

### 0.1: A single user app

- [X] It should have an Express backend
- [X] It should have a postgres database to store user data
- [Χ] It should display a list of student practice sessions for the given month
- [X] It should allow the student to mark whether they've practiced
- [X] It should allow the student to add a note to their practice session

[Some planning notes](./planning/PLAN.md).