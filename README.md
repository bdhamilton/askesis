# askesis

An app for recording Greek practice. 

Students can mark whether they practiced and add practice notes. Teacher can see practice records for all students and keep notes (private or public) on individual students.

[Some planning notes](./planning/PLAN.md).

## Versions

### v3: Re-figure the UI

- [ ] The student should be prompted to log today's practice
- [ ] The student should be prompted to log yesterday's practice
- [ ] The calendar should be smaller and more concise
- [ ] The calendar should clearly mark practice sessions
- [ ] The calendar should clearly mark notes
- [ ] There should be an easy way to read notes
- [ ] There should be an easy way to edit notes

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