var tasks = {};

var createTask = function (taskText, taskDate, taskList) {
	// create elements that make up a task item
	var taskLi = $("<li>").addClass("list-group-item");
	var taskSpan = $("<span>")
		.addClass("badge badge-primary badge-pill")
		.text(taskDate);
	var taskP = $("<p>").addClass("m-1").text(taskText);

	// append span and p element to parent li
	taskLi.append(taskSpan, taskP);

	// append to ul list on the page
	$("#list-" + taskList).append(taskLi);
};

var loadTasks = function () {
	tasks = JSON.parse(localStorage.getItem("tasks"));

	// if nothing in localStorage, create a new object to track all task status arrays
	if (!tasks) {
		tasks = {
			toDo: [],
			inProgress: [],
			inReview: [],
			done: [],
		};
	}

	// loop over object properties
	$.each(tasks, function (list, arr) {
		// then loop over sub-array
		arr.forEach(function (task) {
			createTask(task.text, task.date, list);
		});
	});
};

var saveTasks = function () {
	localStorage.setItem("tasks", JSON.stringify(tasks));
};

// apply event listener to .list-group that listens for events on descendant paragraphs
$(".list-group").on("click", "p", function() {
    // get the inner text content of the current element
    var text = $(this).text();
    // this syntax - $("<tag name>") - makes a new element
    var textInput = $("<textarea>")
        .addClass("form-control")
        .val(text);
    // replace it
    $(this).replaceWith(textInput);
    // set the textarea to be in focus, so the user can immediately start typing
    textInput.trigger("focus");
});

// blur event fires when the element is no longer in focus
$(".list-group").on("blur", "textarea", function() {
    var text = $(this).val().trim();
    // go upwards through the DOM tree and select the first .list-group, get its id, and remove the "list-" part of the id
    var status = $(this).closest(".list-group").attr("id").replace("list-", "");
    // so, for clarity, the paragraph tags are nested inside li tags with the class .list-group-item
    // closest() selects the .list-group-item of the paragraph
    // index() gets its index in the set of all siblings
    var index = $(this).closest(".list-group-item").index();

    // go into tasks, select the array with the key matching status, select the object with the index matching index, then get its text value and update it
    tasks[status][index].text = text;
    saveTasks();

    // put the paragraph back
    // note the difference between replace (replaces part of a string) and replaceWith (jquery method that replaces an element)
    var taskP = $("<p>").addClass("m-1").text(text);
    $(this).replaceWith(taskP);
});

// modal was triggered
$("#task-form-modal").on("show.bs.modal", function () {
	// clear values
	$("#modalTaskDescription, #modalDueDate").val("");
});

// modal is fully visible
$("#task-form-modal").on("shown.bs.modal", function () {
	// highlight textarea
	$("#modalTaskDescription").trigger("focus");
});

// save button in modal was clicked
// select element with .btn-primary in #task-form-modal and add a click event listener
$("#task-form-modal .btn-primary").click(function () {
	// get form values
	var taskText = $("#modalTaskDescription").val();
	var taskDate = $("#modalDueDate").val();

	if (taskText && taskDate) {
		createTask(taskText, taskDate, "toDo");

		// close modal
		$("#task-form-modal").modal("hide");

		// save in tasks array
		tasks.toDo.push({
			text: taskText,
			date: taskDate,
		});

		saveTasks();
	}
});

// remove all tasks
$("#remove-tasks").on("click", function () {
	for (var key in tasks) {
		tasks[key].length = 0;
		$("#list-" + key).empty();
	}
	saveTasks();
});

// load tasks for the first time
loadTasks();
