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
    // "activate" event triggers on every list when a drag is started
    activate: function () {
        $(this).addClass("dropover");
        $(".bottom-trash").addClass("bottom-trash-drag");
    },
    // "deactivate" event triggers on every list when a drag is ended
    deactivate: function () {
        $(this).removeClass("dropover");
        $(".bottom-trash").removeClass("bottom-trash-drag");
    },
    // "over" event triggers on a list when an item is dragged over it
    over: function (event) {
        $(event.target).addClass("dropover-active");
    },
    // "out" event triggers when the item is moved away
    out: function (event) {
        $(event.target).removeClass("dropover-active");
    },
    // when an item is moved and set into place, this event is triggered for both involved lists
    // this function will run separately for both!
    update: function() {
        var tempArr = [];
        // get the id attribute of this list and pull out just the unique part
        var arrName = $(this).attr("id").replace("list-", "");

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

            checkIfComplete($(this), arrName);
        });
        
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
    over: function () {
        $(".bottom-trash").addClass("bottom-trash-drag");
    },
    out: function () {
        $(".bottom-trash").removeClass("bottom-trash-drag");
    },
    // determines what to do when the draggable is actually dropped
    drop: function(event, ui) {
        ui.draggable.remove();
        // ui.draggable refers to the draggable item actually being moved
        // the remove() method by default tells the sortable objects to update, which includes re-calling saveTasks()
        // i don't understand why event is necessary, because it's not being used anywhere, but removing it breaks the function
    }
})

$("#modalDueDate").datepicker({
    minDate: 0
});

var createTask = function (taskText, taskDate, taskList) {
	// create elements that make up a task item
	var taskLi = $("<li>").addClass("list-group-item");
	var taskSpan = $("<span>")
		.addClass("badge badge-primary badge-pill")
		.text(taskDate);
	var taskP = $("<p>").addClass("m-1").text(taskText);

	// append span and p element to parent li
	taskLi.append(taskSpan, taskP);

    // send task into auditTask to get contextual formatting
    auditTask(taskLi);
    checkIfComplete(taskLi, taskList);

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

var auditTask = function (taskEl) {
    var date = $(taskEl).find("span").text().trim();
    var time = moment(date, "L").set("hour", 17);
    // moment(date, "L") means "make a moment object using the variable date, and interpreting it as following the local date format"
    // "L" is what means "local format", for clarity

    // strip style classes if present
    $(taskEl).removeClass("list-group-item-warning list-group-item-danger");

    // moment() here is referring to the time when this function is called, not a saved value
    if (moment().isAfter(time)) {
        $(taskEl).addClass("list-group-item-danger");
    }
    // the variable time is storing the due date for the list item, at 5:00 PM
    // .diff (time, "days") returns the difference between the due date, time, and now, in specifided units
    // typically, .diff will return a negative number when comparing to a date in the future, so we use Math.abs() to make it positive
    else if (Math.abs(moment().diff(time, "days")) <= 2) {
        $(taskEl).addClass("list-group-item-warning");
    };
};

var checkIfComplete = function (taskEl, listName) {
    if (listName === "done") {
        $(taskEl).removeClass("list-group-item-warning list-group-item-danger");
        $(taskEl).addClass("list-group-item-success");        
    } else {
        auditTask(taskEl);
    };
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

    dateInput.datepicker({
        minDate: 0,
        onClose: function() {
            // force "change" event on the input when calendar is closed
            // if no date has been picked, this will put back the original value
            // this works because the data for the task hasn't been changed
            $(this).trigger("change")
        }
    });

    dateInput.trigger("focus");
});

// record change of due date
$(".list-group").on("change", "input[type='text']", function() {
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

    // check new due date
    auditTask($(taskSpan).closest(".list-group-item"));
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
$("#task-form-modal .btn-save").click(function () {
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

setInterval(function () {
    $(".card .list-group-item").each(function (index, el) {
        auditTask(el);
    });
}, 1000 * 60 * 30);
// get each list
// run auditTask on each list item inside