# Journal

## Juny 6, 2024

## 9pm

I've been fiddling with lots of little things today. The app is slightly further along, but I hate the way I've been handling this process. Things feel wildly disorganized, and the code is too unwieldy for me even to be able to tell whether it's very efficient. I really need to learn how to better atomize and organize as I go.

That said, v2 is complete. The student can see any record; they can update today's or yesterday's record; they can modify notes from any day in the past. The database access functions are decent, and at least they work. 

What's next for v3? It's either work on the UI or work on dynamic page updates. Somewhat against my better judgment, I think I'll update the UI. I'm running into a little difficulty coding this up because I haven't totally settled how I want this to look to or work for the student. Once the UI is more nearly locked in, I think it'll be easier to decide what I need to do.

## June 5, 2024

## 11pm

Finished a total rewrite of the calendaring code using one loop instead of three. Definitely an improvement, though I'm still a little worried about the number of nested if-clauses in there.

### 8am

The most complicated logic in this app so far is writing the calendar. Here is a high-level outline to clarify the steps I'm taking.

In server.js:
  Get a month of practice records from the database
  Pass those records to the `home` EJS template
In home.ejs:
  Get date objects for today and the month to display
  Initialize a blank calendar array
  Add trailing days of _last_ month to array:
    Calculate the days that need to be displayed
    Create a date string for them (YYYY-MM-)
    Push each day to the array
  Add days of selected month
    Get number of days in current month
    Create a date string for them (YYYY-MM-)
    Initialize variables to track next database record
    For each day in selected month:
      Initialize date information
      If day matches next database record:
        Add practice information
      Else if day is in the past:
        Add that student did _not_ practice
      Push day to calendar array
  Add starting days of following month
    Calculate total days needed to make a multiple of 7
    Create a date string for these dates
    Push each date to array
  Create URLs for last month and next month
  Print name of month to display
  For each day in calendar array:
    Construct CSS classes based on data
    Add note marker if necessary
    Print the list item

It does seem to me that I should probably be able to simplifying this down to one big loop, rather than repeating so many ideas for last month, this month, and next month. What if instead:

Get date objects for today and month to display
Calculate starting date and total size of calendar:
  Find starting day of this month
  Find number of days in last month
  Calculate calendar's start date (in a date object)
    Call it nextDayToCreate
  Calculate total days that will need to be displayed:
    Next multiple of seven beyond trailing days + days in this month
Initialize a blank calendar array
Set up variables to hold next database record
For totalDaysToDisplay times:
  Convert nextDayToCreate to ISO format
  Create day object:
    Set date property in ISO format
    If we're in the selected month, set thisMonth to true
    Set day to day of nextDayToCreate
    If database record exists for this date:
      Add practice information
    Else if date is in the past:
      Set practiced to false
  Push date to calendar array
  Incremente nextDayToCreate
Write calendar:
  Get printable name of current month
  Get URLS for last month and next month
  For each day:
    Define styles
    Add note
    Print a list item

## June 4, 2024

## 6:15am

Version 1 is technically complete! As of this morning, the page displays a form if today's practice has not been logged and successfully logs it. I say "technically" because it doesn't really work as I'd like it to yet. I'd like to be updating the database and the page dynamically rather than posting a form. In terms of the UI, I'd also like to make marking whether or not you've practiced and adding a note to that session to be separate steps. But those can all be part of later versions. The main thing is: I now have an app that allows students to log a practice session and add a note to that session, and that successfully pulls practice records from the database and displays them. That's pretty great.

I'm not quite sure where to go next. I could:

* Add more options for user interaction: look at past records, edit notes, log yesterday or the previous day.
* Figure out dynamic updating
* Add the teacher view
* Refigure the UI, which I've changed my mind about

I think the first option is probably best. 

## June 3, 2024

## 8:30am

I've made some good progress this morning. The calendar is displaying as it should now: it includes a full date string (YYYY-MM-DD) in the dataset for every day, it marks days in the selected month differently than the others, it checks the database records for each day in the current month to see whether there's a record, and it doesn't mark past the current date.

The code to build the calendar is starting to feel a little unwieldy and disorganized, so it would be worth trying to summarize and outline it at a high level and double checking my logic. 

It's clear now that writing any serious code in an EJS template is a bad idea. Error reporting doesn't work correctly, and I can't use the debugger. (Not to mention that syntax highlighting doesn't work, which makes it harder to see typos.) I'm still unsure where to put it. 

## June 2, 2024

### 10pm 

I set up a home template that (1) displays the student's streak based on database information, and (2) builds a calendar based on the current date. The calendar does not yet contain any database information, though. That will be for tomorrow.

### 5pm

I was going to try to put everything inside the EJS template, but that quickly started feeling silly. Instead, I went ahead and transformed my data getters into asynchronous functions and got them working with the server. I should stop messing around with the format and placement of those bits of code and just get something more fully functional.

Next steps: figure out how to create the current month's calendar dynamically, including the info passed into the template as `thisMonthsRecords`.

### 8am

Got it working, at least in principle, with nested callback functions! Still working on parsing the data for the second query---getting the month's worth of records to print out in an ordered list. 

I realize now too that there's the possibility of sticking with the nested callback functions inside the server.js file, but then handling all the data manipulation within the view template. I'll think about that later.

### 6am

I've been having trouble getting my database calls to work because they're asynchronous, and I haven't learned yet how to work with that. After doing a little bit more digging, it looks like I have three options:

1. Asynchronous callbacks. This is how things worked in the Blog project. `pool.query` allows me to pass a function, and that function will only be called once the query has been successfully completed. That callback function takes two arguments, `error` and `result`. The database information lives inside `result` argument. But there are two reasons I've been resistant to writing everything inside a callback function on the query: (1) I need at least _two_ queries for my main page---one to get a streak and one to get current month information---and it seems silly to nest them, and (2) I'll need the exact same information for the backend, and it seems silly not to reuse the code. So that makes it seem intuitive to turn these into separate functions.

2. Explicit promises. I could write a function that explicitly creates and returns a promise object, which resolves when the query has been completed.

3. `async`/`await`. This amounts to the same thing, but with simplified syntax.

It honestly might be instructive to write this functionality in all three ways, just for the sake of getting some experience with these various ways of dealing with asynchronous work. My impression is that most contemporary JS is going to be using async/await, and [even the documentation defaults to that expectation](https://node-postgres.com/apis/pool#poolquery). But since I've never worked explicitly with promises before, I don't want to lean so heavily on async/await that I never really learn what promises do.

I'm going to start by trying to write up my functionality with no external function call and no promises---all in callbacks, nested if need be. I can move it over to a function afterwards. That way I'll first have written what I need with the minimum possible new syntax.**