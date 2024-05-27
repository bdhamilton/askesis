# Database design

I think this should be doable with two simple databases

## users

* user_id (pk)
* user_name (text)
* user_greekname (text)
* teacher (boolean)

## practice_records

* record_id (pk)
* user_id (fk) [many to one]
* date (number) 
  * Do I need to split this into year, month, day for ease of access?
* practiced (boolean)
* note (longtext)

## teacher_notes

* note_id (pk)
* user_id (fk) [many to one]
* date (number)
* note_title (text)
* note (longtext)
* private (boolean)