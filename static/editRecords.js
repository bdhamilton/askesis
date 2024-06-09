function writeUpdateForm(event) {
  // Grab the date and find the current note
  const dateString = event.currentTarget.dataset.date;
  const currentNote = event.currentTarget.title;
    
  // Create the form
  const form = document.createElement("form");
  const dateElements = dateString.split("-");
  form.setAttribute("method", "post");
  form.setAttribute("action", `/${dateElements[0]}/${dateElements[1]}/${dateElements[2]}`);
  form.classList.add("editNote-form");

  // Create the header/label
  const header = document.createElement("h3");
  const label = document.createElement("label");
  label.setAttribute("for", "note");
  label.innerText = formatDateString(dateString).toLowerCase();
  header.appendChild(label);

  // Create the textarea
  const textarea = document.createElement("textarea");
  textarea.setAttribute("name", "note");
  textarea.setAttribute("id", "note");
  textarea.setAttribute("placeholder", "[Add practice note.]");
  textarea.setAttribute("required", "true");
  textarea.classList.add("practiceNote-textarea");
  textarea.innerText = currentNote || '';
  
  // Note whether there's a database entry for this date
  const loggedInput = document.createElement("input");
  loggedInput.setAttribute("type", "hidden");
  loggedInput.setAttribute("name", "alreadyLogged");
  loggedInput.setAttribute("value", event.currentTarget.dataset.logged || false)

  // Create the submit button
  const submitButton = document.createElement("button");
  submitButton.setAttribute("type", "submit");
  submitButton.innerText = 'μεταγράφειν';

  // Build the form
  form.appendChild(loggedInput);
  form.appendChild(header);
  form.appendChild(textarea);
  form.appendChild(submitButton);

  // Clear the canvas and paint the form
  const editNoteDiv = document.querySelector(".practiceNote");
  editNoteDiv.innerHTML = '';
  editNoteDiv.appendChild(form);
}

// Add event listeners to all editable cells in the current month.
const calendarCells = document.querySelectorAll(".calendar li[data-editable='true']");
for (let i = 0; i < calendarCells.length; i++) {
  calendarCells[i].addEventListener("click", writeUpdateForm);
}

function formatDateString(dateString) {
  const dateElements = dateString.split("-");
  const dateObject = new Date(dateElements[0], dateElements[1] - 1, dateElements[2]);
  return dateObject.toLocaleDateString('default', { month: 'long', day: 'numeric' });
}

/*
function displayNote(event) {
  // If the selected date has a note, grab it.
  const currentNote = event.currentTarget.title ? event.currentTarget.title : null;
  const noteParagraph = document.createElement("p");
  noteParagraph.innerText = currentNote;
  
  // Create an edit or add button
  const editButton = document.createElement("button");
  const dateString = event.currentTarget.dataset.date;
  if (currentNote === null) {
    editButton.innerText = "Add a note";
  } else {
    editButton.innerText = "μεταγράφειν";
  }
  editButton.dataset.date = dateString;
  editButton.classList.add("updateNote-button");

  // Give the note a heading
  const header = document.createElement("h3");
  header.innerText = formatDateString(dateString).toLowerCase();

  // Add the note and button to the page.
  const editNoteDiv = document.querySelector(".practiceNote");
  editNoteDiv.innerHTML = '';
  editNoteDiv.appendChild(header);
  editNoteDiv.appendChild(noteParagraph);
  editNoteDiv.appendChild(editButton);

  // And add an event listener to the button.
  editButton.addEventListener("click", writeUpdateForm);
} 
*/

