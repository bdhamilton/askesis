# Database design

I think this should be doable with two simple databases

## users

* user_id (pk)
* user_name (text)
* user_greekname (text)

## practice_records

* record_id (pk)
* user_id (fk) [many to one]
* date (number)
* practiced (boolean)
* note (longtext)

## notes

* note_id (pk)
* user_id (fk) [many to one]
* date (number)
* note_title (text)
* note (longtext)
* private (boolean)