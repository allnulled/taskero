 


# Taskero


![](https://img.shields.io/badge/taskero-v1.0.0-green.svg) ![](https://img.shields.io/badge/test-passing-green.svg) ![](https://img.shields.io/badge/coverage-100%25-green.svg) ![](https://img.shields.io/badge/stable-90%25-orange.svg)


Task automation tool with special focus on: asynchronicity, parameterization and automatic watches functionality.

## 1. Installation

~$ `npm install --save taskero`

## 2. Usage

### 2.1. Example

This is a simple example. It simulates the compilation of JSX files to JS,
and then it writes the concatenation of them into a file.

We can specify both, the termination of the files that will contain the compilation,
and the file that will contain the concatenation of the compiled files.

The cool thing is that we can reuse the same function, because we parametrize some
of the variables of the task, and when we run them, we redefine them.


```js
const Taskero = require("taskero").Taskero;
const taskero = new Taskero({debug:false});
const compileJSX = function(i) {
 // Here, you can modify the contents of the file
 return i
};
const fs = require("fs");

taskero.register({
 name: "jsx:compile",
 onEach: [
   function(done, file, args) {
     done(compileJSX(file.contents));
   },
   function(done, file, args) {
     fs.writeFileSync(file.path + args.filesAppendix, file.contents, "utf8")
     done();
   }
 ],
 onDone: [
   function(done, files, args) {
     console.log("[taskero:jsx:compile] Compilation finished for: " + JSON.stringify(files, null, 3));
     done(files.reduce(function(prev, curr) {
       return prev + "\n" + curr;
     }, ""));
   }
 ],
 files: "**/**.jsx"
});

taskero.register({
 name: "say:ok",
 onDone: function() {console.log("OK!");}
});

taskero.run([
 {
   name: "jsx:compile",
   filesAppendix: ".compiled.js",
   onDoneFile: "dist/compilation.js"
 },{
   name: "say:ok"
}]).then(function() {
 console.log("Task finished.");
}).catch(function() {
 console.log("There were errors", error);
});
```

### 2.2. Step-by-step explanation

The following is a step-by-step explanation of the previous example.

#### 1. Import Taskero class and create an instance:

```js
const Taskero = require("taskero").Taskero;
const taskero = new Taskero({debug:false});
```

The object passed into the constructor sets the options for the instance created.
The only option, for now, is `debug`. If set to `true`, it will log by console all
the actions that taskero is carrying on under the hood. By default, this option is
set to `false`, so this option is redundant, and the object itself is optional too.

#### 2. Register the tasks we want.

```js
taskero.register({
 name: "name of the task", // Must be unique per {Taskero} instance
 onEach: [],
 onDone: [],
 onDoneFile: "",
 files: [],
 filesEncoding: "utf8",
 watch: false,
 watchOptions: {persist:true}
});
```

The object passed to the `Taskero#register(~)` method here defines the default
options known by the API. Moreover, you can provide your own properties.
When you provide your own properties here, they will be set as default for the
current task. They, though, will be extendable by the `Taskero#run(~)` method.

#### 3. Run the tasks we want, overriding or adding the parameters we want.

```js
taskero.run([{
 name: "task:1",
}, {
 name: "task:2",
}, {
 name: "task:3",
}, {
 name: "name of the already registered task",
 files: [/*Glob patterns*/],
 watch: true, // this will run the task as watcher
 onDoneFile: "dist/build.js",
 customArgument1: [],
 customArgument2: [],
 customArgument3: [],
 customArgument4: [],
 customArgument5: [],
 customArgument6: []
}]);
```

The `Taskero#run(~)` method accepts different types of arguments. The shown below
is the most flexible, as it accepts multiple tasks (that will be run one after
the other) and, at the same time, their parametrization. This way, we can reuse
the same task against different files.

Remember that the `watch` option will let you run the task as a watcher, instead
of as a simple execution, just providing a `true` flag, which can result very
handy in order to reuse a task in watcher mode.

*Note*: the `watcher mode` means that the `files` matched will be listened for
changes, and so, you can forget about running the task: it will be run
automatically for you everytime a file is changed, or created, or removed.











## 3. API Reference









 


----

### `require("taskero").Taskero`


**Type:** `{Class}`.


**Description:** Returns the main class of the `Taskero`'s API.




 


----

### `new Taskero(Object:options)`


**Type:** `{Class}`.


**Property:** `{Array<Object>} tasksMap`.


**Property:** `{Array<Object>} watchers`.


**Property:** `{Object} options`. By default: `{debug:false}`.


**Parameter:** `{Object} options`. *Optional*. Configurations of the new
instance. By default:

```js
{debug: false}
```


**Return:** `{Object}`.


**Description:** Creates and returns a new `Taskero` instance.




 


----

### `Taskero#tasksMap`


**Type:** `{Object}`.


**Description:** Information of all the tasks (identified by their `name`)
that have been registered by this `Taskero` instance.




 


----

### `Taskero#options`


**Type:** `{Object}`


**Description:** Options passed to this `Taskero` instance. This is built
by the default options, and the object provided as first argument to
the `Taskero` constructor.
Default options:

```js
{
 debug: true
}
```




 


----

### `Taskero#watchers`


**Type:** `{Array<Object>}`


**Description:** File watchers added by this `Taskero` instance.




 


----

### `Taskero#register(Object:taskInfo)`


**Type:** `{Function}`


**Description:** Registers a new task for this instance.


**Parameter:** `{Object} taskInfo`. **`Required`**.

The `Taskero#register(~)` method accepts an object as parameter.
This object can have any of the following properties:

- `name`: `{String}`. **Required**. The name of the task. It can not be duplicated.
Otherwise, an error will be thrown.

- `onEach`: `{Array<Function> | Function}`. *Optional*. Functions that compose
this task, that will be applied to each file (matched by the `files` argument).
This implies that each of the functions provided by this argument will be applied
once per each matched file. By default: `[]`.

These functions (or function) will receive 3 parameters:

 · **`argument 1:`** `done`: `{Function}`. This must be called to finish the callback,
 and to start the next call. When called with 1 parameter, the `{String}` passed
 to it will change the content of the file (but not written). When called with 2
 parameters, the second parameter will throw an error, catched by the
 `Taskero#run(...).then(...).catch(~)` callback.

 · **`argument 2:`** `file`: `{Object}`. This object has a `.path` and a `.contents`
 property. This object will be passed through all the `onEach` callbacks. The
 `.contents` property can be modified directly, or by the `done(~)` call. Take
 into account that any matched file will appear here.

 · **`argument 3:`** `args`: `{Object}`. This object has all the parameters received
 by this task. So: `name`, `onEach`, `onDone`, `onDoneFile`, `files`... and any
 other parameter added by the method `Taskero#register(~)` or the method
 `Taskero#run(~)` will also appear here.

- `onDone`: `{Array<Function> | Function}`. *Optional*. Functions that compose
this task, that will be applied after all the `onEach` callbacks are solved. The
arguments that it receives are the same as the `onEach` callbacks, but as this
set of callbacks are going to be called only once (and not once per file, as the
`onEach` callbacks), the second arguments is not `file`, but `files`. If their
contents were modified by `onEach` callbacks, they will remain modified here too.
This callback is useful to concatenate the contents of all the files somewhere,
or for tasks that are executed once, independently from the `files`. Also, note
that when the `done` call is provided with 1 parameter, it will dump the
passed `{String}` into the file specified at the parameter `onDoneFile`, if any.
When it is called with 2, it will throw an error, catched by the
`Taskero#run(...).then(...).catch(~)` callback. By default: `[]`.

- `onDoneFile`: `{String}`. *Optional*. File that will be written with the
`{String}` passed to the `done` (the first argument) of the `onDone` parameter.
The file and folders, if not already created, will be created. If the said `done`
call is not provided with 1 parameter, it will not dump anything to any file.
By default: `undefined`.

- `files`: `{Array<String> | String}`. *Optional*.
[Glob pattern(s)](https://github.com/sindresorhus/globby) that will be matched
before proceeding to the `onEach` and `onDone` callbacks execution. It can be
empty, in which case, no `onEach` callback will be called (but the `onDone`
will be called anyway). By default: `[]`.

- `filesEncoding`: `{String}`. *Optional*. By default: `"utf8"`.

- `watch`: `{Boolean}`. *Optional*. When set to `true`, the task will be
understood as a watcher, not as an executor. This means that the glob patterns
will be used to be watched (by
[chokidar library](https://github.com/paulmillr/chokidar)), instead of matched
(by [globby library](https://github.com/sindresorhus/globby).
When set to `true`, the watchers generated will be added into `Taskero#watchers`,
which starts as an empty array. And they can be all closed and removed by calling
to `Taskero#closeWatchers()`, directly. By default: `false`.

- `watchOptions`: `{Object}`. *Optional*. This object is passed to the
[chokidar library](https://github.com/paulmillr/chokidar) as the `watch` options.
By default: `{persist: true}`.




 


----

### `Taskero#run(String:taskName)`

### `Taskero#run(Object:taskParameters)`

### `Taskero#run(Array<Object:taskParameters>:tasks)`


**Type:** `{void}`


**Parameter:** `{Array<Object>} tasks`. Set of tasks to be run. They will be
executed one after the other. The object will override the one passed to
the task registration.


**Returns:** `{Promise}`. To chain the `then(~)` and `catch(~)` calls.


**Description:** Runs the provided tasks, in series (one after the other, in
a synchronous way).





 


----

### `Taskero#closeWatchers()`


**Type:** `{Function}`.


**Parameters:** `{none}`.


**Returns:** `{void}`.


**Description:** Removes all the `Taskero#watchers` added to the instance.




 


----

### `Taskero#debug(Any:message,...)`


**Type:** `{Function}`.


**Parameters:** `{none}`.


**Returns:** `{void}`.


**Description:** Logs the provided messages, only if the `Taskero#options.debug` is set to `true`.




 


## 4. Tests, coverage and documentation

The `package.json` file is provided with 3 commands:

- `npm run docs`: it generates the documentation from the Javadoc
comments of the `src/taskero.js` file, which contains the whole
library.

- `npm run test`: it runs the tests and generates the coverage
reports into `coverage/` folder.

- `npm run test-nocov`: it runs the tests, but it does not
generate coverage reports. Use this command if you want to run
tests fastly.


## 5. Why?

I felt that Grunt is cool, and Gulp is cool, and Webpack is cool.

Yes, they are cool.

But:

- Webpack, which was the coolest, complicated things too much.

- Grunt, which was my favourite, lacks of parametrization.

- Gulp, which was very promising, has a strange API.



## 6. Problems

I am not an engineer. I just make tools that fit my needs. But I
do not have a deep understanding, or know the best algorythms for
doing what I want to do. I can imagine better ways to do them.
But I still do not care too much about this point. It may result
dangerous, when I do not have the deep knowledge I should have.

In other words: this tool seems to work great for some tasks. But
I do not know what can happen if I put a hundred tasks to run,
a thousand files to watch, etc.

But... I supose I can split my tasks into different files, and run
them selectively, depending on which part of the project I am
working on. I do not know. I want to think that I am not losing my
time working on tools like this one. In the end, I am already using
my own tools for my developments.


## 7. Conclusions

In conclusion, `Taskero` is a project that aims to ease the tasks
automation, which is a very fundamental part of any software
development project, and which takes a lot of time in development.

Also, I wanted to give more open source projects, I can not compite
against companies, or engineers, but... maybe I can provide something
interesting to them, despite not having a job yet. I do not know.





