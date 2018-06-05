 


----

### require("taskero").Taskero


**Type:** `{Class}`


**Description:** Returns the main class of the `Taskero`'s API.




 


----

### Taskero.generate()

This is transformed into: `new Taskero()`.

### new Taskero()


**Type:** `{Object}`


**Description:** Generates a `new Taskero` instance.




 


----

### Taskero#tasks


**Type:** `{Object}`. Map of registered tasks.


**Description:** The registered tasks for the current `{Taskero}` instance.






 


----

### `Taskero#register(Object:taskInfo)`

This is transformed into: `Taskero#register(taskInfo, {})`.

### `Taskero#register(Object:taskInfo, Object:taskArgsDefault)`


**Type:** `{void}`


**Throws:** `{Taskero.TaskDuplicatedError}`. This error is thrown when there is already a task with the same name defined in `Taskero#taskMap` map.


**Parameter:** `{Object:taskInfo}`. Object that has the main info about the task to be registered. This implies:

```js
{
 name: String,
 onEach: Function,
 onDone: Function,
}
```

· `name`: `{String}`. Name of the task. It has to be unique in the whole `Taskero` instance.

· `onEach`: `{Array<Function>}`. Callbacks to be called against each of the files (taken from `taskArgsDefault.files` parameter, if any). The callbacks look like this:

```js
function(done, args, file) {
 // Code of the iteration. Must call the done() function.
};
```

In this callback, the arguments correspond to:

 · `done`: `{Function}`. Callback to finish the current iteration (to enable asynchronous operations).

If it is called with 0 arguments, like `done()`, this will leave the file unchanged, and the next `onEach` callback will be started.

If it is called with 1 argument, like `done("some content")`, this will produce the modification of the content of the file, and in the next onEach callback.

If it is called with 2 arguments, like `done(null, {name: "SomeError", message: "..."})`, an error with the 2nd parameter will be thrown.

If it is called with 3 arguments, like `done(null, {name: "SomeError", message: "..."}, true)`, and the 3rd argument is `true`, the execution of the current `Taskero#run(...)` will be stopped at this point.

 · `args`: `{Object}`. Arguments for the current task. This is defined by the `taskArgsDefault` (from `Taskero#register`) and by `taskArgs` (from `Taskero#run`). The second one extends the first one through `Object.assign({}, ~, ~)`.

 · `file`: `{Object}`. The file of the current iteration. This is an object, which has:

 `File#path`: `{String}`. Absolute path of the file.

 `File#contents`: `{String}`. Content of the file. This is modified.

Take into account that passing

· `onDone`: `{Function}`. Callback to be called against all the files only once after the `onEach` iteration is completed. This callback looks like this:

```js
function(done, args, files) {
 // Code of the . Must call the done() function.
};
```


**Description:** Adds a new task into the `Taskero#taskMap` of this `Taskero` instance. It also provides the default parameters of the task, through `taskArgsDefault` argument.




 


----

### `Taskero#run(String:taskName)`

This is transformed into: `Taskero#run([{name:taskName}])`.

### `Taskero#run(Object:taskParameters)`

This is transformed into: `Taskero#run([taskParameters])`.

### `Taskero#run(String:taskName, Object:taskParamaters)`

This is transformed into: `Taskero#run([Object.assign({name:taskName}, taskParameters)])`.

### `Taskero#run(Array<Object:taskParameters>:tasks)`


**Type:** `{void}`


**Description:** 






# Read this file
