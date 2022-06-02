var tasks = {};

$(".card .list-group").sortable({
    // makes it so they can move between lists
    connectWith: $(".card .list-group"),
    // page won't scroll if you drag the item to an edge
    scroll: false,
    // this is how the page detects if this item is overlapping another
    tolerance: "pointer",
    // according to the documentation, this means a clone of the selected element will be created and dragged... apparently this helps prevent accidental event triggers?
    helper: "clone",
    // this function runs on every list every time a drag is started
    activate: null,
    // this function runs on every list every time a drag is ended
    deactivate: null,
    // this function runs when an element is dragged over a list it can be sorted into
    over: null,
    // this function runs when it's moved away
    out: null,
    // when an item is moved and set into place, this event is triggered for both involved lists
    // this function will run separately for both!
    update: function() {
        var tempArr = [];

        // get an array of all the children of this list and run a callback func on each
        $(this).children().each(function() {
            // save the data from them
            var text = $(this).find("p").text().trim();
            var date = $(this).find("span").text().trim();

            // push it into tempArr
            var obj = {
                text: text,
                date: date
            };
            tempArr.push(obj);
        });
        
        // get the id attribute of this list and pull out just the unique part
        var arrName = $(this).attr("id").replace("list-", "");
        // get the array in tasks that corresponds to the key name arrName (that is, corresponds to this list)
        // fill it with the contents of tempArr
        tasks[arrName] = tempArr;
        saveTasks();
    }
});

$("#trash").droppable({
    // determines what items can interact with this one
    accept: ".card .list-group-item",
    // determines how much of the draggable needs to be touching it when dropped
    tolerance: "touch",
    over: null,
    out: null,
    // determines what to do when the draggable is actually dropped
    drop: function(event, ui) {
        ui.draggable.remove();
        // ui.draggable refers to the draggable item actually being moved
        // the remove() method by default tells the sortable objects to update, which includes re-calling saveTasks()
        // i don't understand why event is necessary, because it's not being used anywhere, but it is
    }
})

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

// listen for clicks on dates
$(".list-group").on("click", "span", function() {
    var date = $(this).text().trim();
    var dateInput = $("<input>").attr("type", "text").addClass("form-control").val(date);
    $(this).replaceWith(dateInput);
    dateInput.trigger("focus");
});

// record change of due date
$(".list-group").on("blur", "input[type='text']", function() {
    var date = $(this).val().trim();

    // get status and position of task
    var status = $(this).closest(".list-group").attr("id").replace("list-", "");
    var index = $(this).closest(".list-group-item").index();

    // update task in tasks array and save
    tasks[status][index].date = date;
    saveTasks();

    // put span back
    var taskSpan = $("<span>").addClass("badge badge-primary badge-pill").text(date);
    $(this).replaceWith(taskSpan);
})

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
