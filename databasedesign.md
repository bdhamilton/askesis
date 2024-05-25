# Database design

I think this should be doable with two simple databases

## users

* user_id (pk)
* user_name (text)
* user_greekname (text)

## practice_records

* record_id (pk)
* user_id (fk)
* date (number)
* practiced (boolean)
* note (longtext)