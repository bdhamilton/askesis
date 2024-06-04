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
  label.innerText = "Τὶ ἐποίησας;";

  const textarea = document.createElement("textarea");
  textarea.setAttribute("name", "note");
  textarea.setAttribute("id", "note");
  textarea.innerText = currentNote || '';

  const submitButton = document.createElement("button");
  submitButton.setAttribute("type", "submit");
  submitButton.innerText = 'Submit';

  form.appendChild(label);
  form.appendChild(textarea);
  form.appendChild(submitButton);

  const editNoteDiv = document.querySelector(".editNote-div");
  editNoteDiv.innerHTML = '';
  editNoteDiv.appendChild(form);
}

const calendarCells = document.querySelectorAll(".calendar li ");
for (let i = 0; i < calendarCells.length; i++) {
  calendarCells[i].addEventListener("click", writeUpdateForm);
}