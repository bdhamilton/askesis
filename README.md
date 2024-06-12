# askesis

An app for recording Greek practice. 

Students can mark whether they practiced and add practice notes. Teacher can see practice records for all students and keep notes (private or public) on individual students.

[Some planning notes](./planning/PLAN.md).

## Versions

### v7: Add detailed teacher view

- [X] There should be routers for detailed teacher views
  - [X] Current
  - [X] Month
  - [X] Day
- [X] There should be a `teacher-detail` template that displays relevant data

### v6: Add basic teacher view

- [X] There should be a special router for a teacher view.
- [X] The teacher view should only be visible to me.
- [X] It should list all students.
- [X] It should display each student's record for the past week.
- [X] It should indicate whether that record is trending up or down.
- [X] Style the student list

### v5: Add user registration and authentication

- [X] Student should have to log in to see records
- [X] Student should be greeted by name
- [X] Student should see their own records
- [X] Student should be able to log out
- [X] New students should be able to register

### v4: Reorganize and reconsider code

- [X] Serious work should happen outside of the template
  - [X] The recent practices should be calculated in server.js
  - [X] The calendar should be prepared in server.js
- [X] The practice form should be DRY
- [X] Recent practices should be properly calculated
- [X] Helper functions should clarify high level operation
- [X] All functions should be checked for correctness
- [X] All functions should be properly commented
- [X] Rewrite calendar to go to distinct day pages?

### v3: Re-figure the UI

- [X] The student should be prompted to log today's practice
- [X] The student should be prompted to log yesterday's practice
- [X] The calendar should be smaller and more concise
- [X] The calendar should clearly mark practice sessions
- [~] The calendar should clearly mark notes
- [X] There should be an easy way to read notes
- [X] There should be an easy way to edit notes

### v2: More sophisticated controls

- [X] The student should be able to view past records
- [X] The student should be able to edit past notes
- [X] The student should be able to update yesterday's record
- [X] The student should only be able to update dates in the past.

### v1: A single user app

- [X] It should have an Express backend
- [X] It should have a postgres database to store user data
- [Χ] It should display a list of student practice sessions for the given month
- [X] It should allow the student to mark whether they've practiced
- [X] It should allow the student to add a note to their practice session