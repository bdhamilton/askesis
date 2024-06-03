# Journal

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