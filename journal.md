# Journal

## June 2, 2024

I've been having trouble getting my database calls to work because they're asynchronous, and I haven't learned yet how to work with that. After doing a little bit more digging, it looks like I have three options:

1. Asynchronous callbacks. This is how things worked in the Blog project. `pool.query` allows me to pass a function, and that function will only be called once the query has been successfully completed. That callback function takes two arguments, `error` and `result`. The database information lives inside `result` argument. But there are two reasons I've been resistant to writing everything inside a callback function on the query: (1) I need at least _two_ queries for my main page---one to get a streak and one to get current month information---and it seems silly to nest them, and (2) I'll need the exact same information for the backend, and it seems silly not to reuse the code. So that makes it seem intuitive to turn these into separate functions.

2. Explicit promises. I could write a function that explicitly creates and returns a promise object, which resolves when the query has been completed.

3. `async`/`await`. This amounts to the same thing, but with simplified syntax.

It honestly might be instructive to write this functionality in all three ways, just for the sake of getting some experience with these various ways of dealing with asynchronous work. My impression is that most contemporary JS is going to be using async/await, and [even the documentation defaults to that expectation](https://node-postgres.com/apis/pool#poolquery). But since I've never worked explicitly with promises before, I don't want to lean so heavily on async/await that I never really learn what promises do.

I'm going to start by trying to write up my functionality with no external function call and no promises---all in callbacks, nested if need be. I can move it over to a function afterwards. That way I'll first have written what I need with the minimum possible new syntax.**