function writeUpdateForm(event) {
  const dateString = event.currentTarget.dataset.date;
  const currentNote = event.currentTarget.querySelector("img") ? event.currentTarget.querySelector("img").title : null;
  
  const form = document.createElement("form");
  const dateElements = dateString.split("-");
  form.setAttribute("method", "post");
  form.setAttribute("action", `/${dateElements[0]}/${dateElements[1]}/${dateElements[2]}`);
  form.classList.add("editNote-form");

  const label = document.createElement("label");
  label.setAttribute("for", "note");
  label.innerText = formatDateString(dateString);

  const textarea = document.createElement("textarea");
  textarea.setAttribute("name", "note");
  textarea.setAttribute("id", "note");
  textarea.innerText = currentNote || '';
  
  const loggedInput = document.createElement("input");
  loggedInput.setAttribute("type", "hidden");
  loggedInput.setAttribute("name", "alreadyLogged");
  loggedInput.setAttribute("value", event.currentTarget.dataset.logged || false)

  const submitButton = document.createElement("button");
  submitButton.setAttribute("type", "submit");
  submitButton.innerText = 'καταπέμπειν';

  form.appendChild(label);
  form.appendChild(textarea);
  form.appendChild(loggedInput);
  form.appendChild(submitButton);

  const editNoteDiv = document.querySelector(".calendar-viewNote");
  editNoteDiv.innerHTML = '';
  editNoteDiv.appendChild(form);
}

// Add event listeners to all cells in the current month.
const calendarCells = document.querySelectorAll(".calendar li[data-editable='true']");
for (let i = 0; i < calendarCells.length; i++) {
  calendarCells[i].addEventListener("click", writeUpdateForm);
}

function formatDateString(dateString) {
  const dateElements = dateString.split("-");
  const dateObject = new Date(dateElements[0], dateElements[1] - 1, dateElements[2]);
  return dateObject.toLocaleDateString('default', { month: 'long', day: 'numeric' });
}