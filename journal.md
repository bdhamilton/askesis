# Journal

## June 12, 2024

### 8am

I squashed the last little authentication bug, so that's done. It turns out that user information is assigned to the session with `passport.serializeUser`, and my trouble stemmed from a difference in the way that the registration form and the standard authentication process was naming the variables being passed in.

There are two more major pieces of functionality I have in mind: a teacher view and teacher notes. I'm on the fence about whether I care enough to add the teacher notes, but I definitely need the teacher view. So that's version 6.

## June 11, 2024

### 4pm 

Authentication almost done! One bug: when a new user registers, their name isn't passed to initial session---only their email is. If they log out and log back in, then they've got everything. I can't find where that first session is defined. I've tried (1) passing it to the `redirect` function in the post-to-register router, and (2) modifying the place in line 93 where the passport strategy is defined. I might have tried something else, too. But the passport strategy function is not getting called when a new user registered (tried to set a breakpoint and it never got triggered), so that can't be it. It could still be the `redirect` function, but I'm not sure how to properly pass an argument along. That's worth more exploration.

### 8:30am

Okay, I've finished a thorough pass through all of the code to clean it, simplify it, and comment it up. There are a few things I'm not in love with (e.g., the repetition of the same data functions in all of the get routes, the variables names for that data), but I think it's reasonably good. I also did take care of the no-updating-future-dates problem by adding some logic in the template itself. It only writes a form if the date is in the past.

What's next? I could either add a teacher view, or I could add authentication. There's nothing very tricky in the teacher view---it'll just mean writing a new template and a new data-getter---but I've never done the authentication before. I should try to implement that before I meet with Gordon and Lily tomorrow, in case I run into something I have questions about.

## June 10, 2024

### 4:30pm

I slightly refactored the calendar building code and moved it to server.js. I also changed the way that the update note form was working: instead of generating them on the fly when a student clicked a date on the calendar, I actually gave its each own page. It feels good to get this working without any client-side Javascript at all, even if later I add some as a progressive enhancement.

I also did some cleanup in the main folder.

One note: right now, students can still update notes on future dates, which will break everything. I need to keep that from happening---probably by refusing to offer the form in the first place, but maybe also by blocking it on the post router.

### 9am

I've been working but not journaling (as is my wont). I'm working on cleaning up the code before I add any more functionality. (My next step will either be to add authentication or to add a teacher view.) The next step in the cleanup is to get the calendar creation code out of my template and back into server.js.

Right now, the `getMonth` function just returns the `year`, `month`, and query results from a query that grabs all the practice records for a given student for a given month. Those records are handed diretly to the template, and the template does all the handling. I'd like instead to be able to hand the template a fully-processed calendar object. Only formatting should be handled in the template.

## June 6, 2024

### 9pm

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