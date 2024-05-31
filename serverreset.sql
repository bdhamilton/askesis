drop table if exists teacher_notes, practice_records, students;

INSERT INTO students
  (first_name, last_name, email)
VALUES
  ('Brian', 'Hamilton', 'bdhamilton@gmail.com');

INSERT INTO practice_records 
  (student, practice_date, has_practiced, note) 
VALUES
  (1, '2024-05-30', true, ''),
  (1, '2024-05-29', true, 'Read Athenaze 3a'),
  (1, '2024-05-28', true, 'Pretty foggy today'),
  (1, '2024-05-27', false, ''),
  (1, '2024-05-26', true, null),
  -- Skip a day
  (1, '2024-05-24', true, ''),
  (1, '2024-05-23', false, 'Talked with Mariem'),
  (1, '2024-05-22', false, ''),
  (1, '2024-05-21', true, ''),
  -- Do some from a previous month
  (1, '2024-04-15', true, ''),
  (1, '2024-04-14', false, 'Another note'),
  (1, '2024-04-13', true, '');