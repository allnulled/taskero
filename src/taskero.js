/**
 *
 * # Taskero
 *
 *
 * ![](https://img.shields.io/badge/taskero-v1.0.0-green.svg) ![](https://img.shields.io/badge/test-passing-green.svg) ![](https://img.shields.io/badge/coverage-100%25-green.svg) ![](https://img.shields.io/badge/stable-90%25-orange.svg)
 *
 *
 * Task automation tool with special focus on: asynchronicity, parameterization and automatic watches functionality.
 *
 * ## 1. Installation
 *
 * ~$ `npm install --save taskero`
 *
 * ## 2. Usage
 *
 * ### 2.1. Example
 *
 * This is a simple example. It simulates the compilation of JSX files to JS,
 * and then it writes the concatenation of them into a file.
 *
 * We can specify both, the termination of the files that will contain the compilation,
 * and the file that will contain the concatenation of the compiled files.
 *
 * The cool thing is that we can reuse the same function, because we parametrize some
 * of the variables of the task, and when we run them, we redefine them.
 *
 *
 * ```js
 * const Taskero = require("taskero").Taskero;
 * const taskero = new Taskero({debug:false});
 * const compileJSX = function(i) {
 *   // Here, you can modify the contents of the file
 *   return i
 * };
 * const fs = require("fs");
 *
 * taskero.register({
 *   name: "jsx:compile",
 *   onEach: [
 *     function(done, file, args) {
 *       done(compileJSX(file.contents));
 *     },
 *     function(done, file, args) {
 *       fs.writeFileSync(file.path + args.filesAppendix, file.contents, "utf8")
 *       done();
 *     }
 *   ],
 *   onDone: [
 *     function(done, files, args) {
 *       console.log("[taskero:jsx:compile] Compilation finished for: " + JSON.stringify(files, null, 3));
 *       done(files.reduce(function(prev, curr) {
 *         return prev + "\n" + curr;
 *       }, ""));
 *     }
 *   ],
 *   files: "** /**.jsx"
 * });
 *
 * taskero.register({
 *   name: "say:ok",
 *   onDone: function() {console.log("OK!");}
 * });
 *
 * taskero.run([
 *   {
 *     name: "jsx:compile",
 *     filesAppendix: ".compiled.js",
 *     onDoneFile: "dist/compilation.js"
 *   },{
 *     name: "say:ok"
 * }]).then(function() {
 *   console.log("Task finished.");
 * }).catch(function() {
 *   console.log("There were errors", error);
 * });
 * ```
 *
 * ### 2.2. Step-by-step explanation
 *
 * The following is a step-by-step explanation of the previous example.
 *
 * #### 1. Import Taskero class and create an instance:
 *
 * ```js
 * const Taskero = require("taskero").Taskero;
 * const taskero = new Taskero({debug:false});
 * ```
 *
 * The object passed into the constructor sets the options for the instance created.
 * The only option, for now, is `debug`. If set to `true`, it will log by console all
 * the actions that taskero is carrying on under the hood. By default, this option is
 * set to `false`, so this option is redundant, and the object itself is optional too.
 *
 * #### 2. Register the tasks we want.
 *
 * ```js
 * taskero.register({
 *   name: "name of the task", // Must be unique per {Taskero} instance
 *   onEach: [],
 *   onDone: [],
 *   onDoneFile: "",
 *   files: [],
 *   filesEncoding: "utf8",
 *   watch: false,
 *   watchOptions: {persist:true}
 * });
 * ```
 *
 * The object passed to the `Taskero#register(~)` method here defines the default
 * options known by the API. Moreover, you can provide your own properties.
 * When you provide your own properties here, they will be set as default for the
 * current task. They, though, will be extendable by the `Taskero#run(~)` method.
 *
 * #### 3. Run the tasks we want, overriding or adding the parameters we want.
 *
 * ```js
 * taskero.run([{
 *   name: "task:1",
 * }, {
 *   name: "task:2",
 * }, {
 *   name: "task:3",
 * }, {
 *   name: "name of the already registered task",
 *   files: [/*Glob patterns* /],
 *   watch: true, // this will run the task as watcher
 *   onDoneFile: "dist/build.js",
 *   customArgument1: [],
 *   customArgument2: [],
 *   customArgument3: [],
 *   customArgument4: [],
 *   customArgument5: [],
 *   customArgument6: []
 * }]);
 * ```
 *
 * The `Taskero#run(~)` method accepts different types of arguments. The shown below
 * is the most flexible, as it accepts multiple tasks (that will be run one after
 * the other) and, at the same time, their parametrization. This way, we can reuse
 * the same task against different files.
 *
 * Remember that the `watch` option will let you run the task as a watcher, instead
 * of as a simple execution, just providing a `true` flag, which can result very
 * handy in order to reuse a task in watcher mode.
 *
 * *Note*: the `watcher mode` means that the `files` matched will be listened for
 * changes, and so, you can forget about running the task: it will be run
 * automatically for you everytime a file is changed, or created, or removed.
 *
 * ## 3. API Reference
 *
 */
const globby = require(`globby`);
const async = require(`async`);
const path = require(`path`);
const chokidar = require("chokidar");
const fs = require(`fs-extra`);
const Clitoris = require("clitoris").Clitoris;

/**
 *
 * ----
 *
 * ### `require("taskero").Taskero`
 *
 * @type `{Class}`.
 *
 * @description Returns the main class of the `Taskero`'s API.
 *
 */
class Taskero {
	/**
	 *
	 * ----
	 *
	 * ### `new Taskero(Object:options)`
	 *
	 * @type `{Class}`.
	 *
	 * @property `{Array<Object>} tasksMap`.
	 *
	 * @property `{Array<Object>} watchers`.
	 *
	 * @property `{Object} options`. By default: `{debug:false}`.
	 *
	 * @parameter `{Object} options`. *Optional*. Configurations of the new
	 * instance. By default:
	 *
	 * ```js
	 * {debug: false}
	 * ```
	 *
	 * @return `{Object}`.
	 *
	 * @description Creates and returns a new `Taskero` instance.
	 *
	 */
	constructor(optionsParam) {
		/**
		 *
		 * ----
		 *
		 * ### `Taskero#tasksMap`
		 *
		 * @type `{Object}`.
		 *
		 * @description Information of all the tasks (identified by their `name`)
		 * that have been registered by this `Taskero` instance.
		 *
		 */
		this.tasksMap = {};
		/**
		 *
		 * ----
		 *
		 * ### `Taskero#options`
		 *
		 * @type `{Object}`
		 *
		 * @description Options passed to this `Taskero` instance. This is built
		 * by the default options, and the object provided as first argument to
		 * the `Taskero` constructor.
		 * Default options:
		 *
		 * ```js
		 * {
		 *   debug: true
		 * }
		 * ```
		 *
		 */
		this.options = Object.assign(
			{
				debug: false,
				error: true,
				files: []
			},
			optionsParam
		);
		/**
		 *
		 * ----
		 *
		 * ### `Taskero#watchers`
		 *
		 * @type `{Array<Object>}`
		 *
		 * @description File watchers added by this `Taskero` instance.
		 *
		 */
		this.watchers = [];
		// Load external taskero files:
		const thisInstance = this;
		this.options.files = [].concat(this.options.files);
		this.options.files.forEach(function(file) {
			try {
				thisInstance.tasksMap = Object.assign(
					thisInstance.tasksMap,
					require(path.resolve(file)).tasksMap
				);
			} catch (exc) {
				throw {
					name: "Taskero:InvalidFileRequiredError",
					message: `Invalid Taskero file ${path.resolve(file)} was required.`
				};
			}
		});
	}
	/**
	 *
	 * ----
	 *
	 * ### `Taskero#register(Object:taskInfo)`
	 *
	 * @type `{Function}`
	 *
	 * @description Registers a new task for this instance.
	 *
	 * @parameter `{Object} taskInfo`. **`Required`**.
	 *
	 * The `Taskero#register(~)` method accepts an object as parameter.
	 * This object can have any of the following properties:
	 *
	 * - `name`: `{String}`. **Required**. The name of the task. It can not be duplicated.
	 * Otherwise, an error will be thrown.
	 *
	 * - `onEach`: `{Array<Function> | Function}`. *Optional*. Functions that compose
	 * this task, that will be applied to each file (matched by the `files` argument).
	 * This implies that each of the functions provided by this argument will be applied
	 * once per each matched file. By default: `[]`.
	 *
	 * These functions (or function) will receive 3 parameters:
	 *
	 *   · **`argument 1:`** `done`: `{Function}`. This must be called to finish the callback,
	 *   and to start the next call. When called with 1 parameter, the `{String}` passed
	 *   to it will change the content of the file (but not written). When called with 2
	 *   parameters, the second parameter will throw an error, catched by the
	 *   `Taskero#run(...).then(...).catch(~)` callback.
	 *
	 *   · **`argument 2:`** `file`: `{Object}`. This object has a `.path` and a `.contents`
	 *   property. This object will be passed through all the `onEach` callbacks. The
	 *   `.contents` property can be modified directly, or by the `done(~)` call. Take
	 *   into account that any matched file will appear here.
	 *
	 *   · **`argument 3:`** `args`: `{Object}`. This object has all the parameters received
	 *   by this task. So: `name`, `onEach`, `onDone`, `onDoneFile`, `files`... and any
	 *   other parameter added by the method `Taskero#register(~)` or the method
	 *   `Taskero#run(~)` will also appear here.
	 *
	 * - `onDone`: `{Array<Function> | Function}`. *Optional*. Functions that compose
	 * this task, that will be applied after all the `onEach` callbacks are solved. The
	 * arguments that it receives are the same as the `onEach` callbacks, but as this
	 * set of callbacks are going to be called only once (and not once per file, as the
	 * `onEach` callbacks), the second arguments is not `file`, but `files`. If their
	 * contents were modified by `onEach` callbacks, they will remain modified here too.
	 * This callback is useful to concatenate the contents of all the files somewhere,
	 * or for tasks that are executed once, independently from the `files`. Also, note
	 * that when the `done` call is provided with 1 parameter, it will dump the
	 * passed `{String}` into the file specified at the parameter `onDoneFile`, if any.
	 * When it is called with 2, it will throw an error, catched by the
	 * `Taskero#run(...).then(...).catch(~)` callback. By default: `[]`.
	 *
	 * - `onDoneFile`: `{String}`. *Optional*. File that will be written with the
	 * `{String}` passed to the `done` (the first argument) of the `onDone` parameter.
	 * The file and folders, if not already created, will be created. If the said `done`
	 * call is not provided with 1 parameter, it will not dump anything to any file.
	 * By default: `undefined`.
	 *
	 * - `files`: `{Array<String> | String}`. *Optional*.
	 * [Glob pattern(s)](https://github.com/sindresorhus/globby) that will be matched
	 * before proceeding to the `onEach` and `onDone` callbacks execution. It can be
	 * empty, in which case, no `onEach` callback will be called (but the `onDone`
	 * will be called anyway). By default: `[]`.
	 *
	 * - `filesEncoding`: `{String}`. *Optional*. By default: `"utf8"`.
	 *
	 * - `watch`: `{Boolean}`. *Optional*. When set to `true`, the task will be
	 * understood as a watcher, not as an executor. This means that the glob patterns
	 * will be used to be watched (by
	 * [chokidar library](https://github.com/paulmillr/chokidar)), instead of matched
	 * (by [globby library](https://github.com/sindresorhus/globby).
	 * When set to `true`, the watchers generated will be added into `Taskero#watchers`,
	 * which starts as an empty array. And they can be all closed and removed by calling
	 * to `Taskero#closeWatchers()`, directly. By default: `false`.
	 *
	 * - `watchOptions`: `{Object}`. *Optional*. This object is passed to the
	 * [chokidar library](https://github.com/paulmillr/chokidar) as the `watch` options.
	 * By default: `{persist: true}`.
	 *
	 */
	register(taskInfo, taskArgsDefault = {}) {
		if (taskInfo.name in this.tasksMap) {
			this.debug("[taskero] Duplicated task to be registered");
			throw {
				name: `Taskero:TaskDuplicatedError`,
				message: `Task ${taskInfo.name} was not found among ${
					Object.keys(this.tasksMap).length
				} tasks.`
			};
		}
		this.tasksMap[taskInfo.name] = {
			info: taskInfo,
			args: Object.assign(
				{
					onEach: [],
					onDone: [],
					onDoneFile: undefined,
					watch: false
				},
				taskArgsDefault
			)
		};
	}
	/**
	 *
	 * ----
	 *
	 * ### `Taskero#run(String:taskName)`
	 *
	 * ### `Taskero#run(Object:taskParameters)`
	 *
	 * ### `Taskero#run(Array<Object:taskParameters>:tasks)`
	 *
	 * @type `{void}`
	 *
	 * @parameter `{Array<Object>} tasks`. Set of tasks to be run. They will be
	 * executed one after the other. The object will override the one passed to
	 * the registered task (that has the same name). The objects inside this
	 * array, so, are the same as the ones defined in the registration: Taskero
	 * tasks. The parameters added or overriden, are only overriden for the
	 * execution. This lets the user to refer to different files, but take some
	 * default files, for example.
	 *
	 * @returns `{Promise}`. To chain the `then(~)` and `catch(~)` calls.
	 *
	 * @description Runs the provided tasks, in series (one after the other, in
	 * a synchronous way).
	 *
	 *
	 */
	run() {
		const thisInstance = this;
		//
		//
		//
		//
		//
		//
		function simplifyArguments() {
			var tasksToRun = [];
			if (arguments.length === 1 && typeof arguments[0] === `string`) {
				// Case 1: {String:taskName}
				tasksToRun.push({
					name: arguments[0],
					onEach: undefined,
					onDone: undefined
				});
			} else if (
				arguments.length === 1 &&
				typeof arguments[0] === `object` &&
				!(arguments[0] instanceof Array)
			) {
				// Case 2: {Object:taskParameters}
				tasksToRun.push(
					Object.assign(
						{ name: undefined, onEach: undefined, onDone: undefined },
						arguments[0]
					)
				);
			} else if (
				arguments.length === 2 &&
				typeof arguments[0] === `string` &&
				typeof arguments[1] === `object`
			) {
				// Case 3: {String:taskName}, {Object:taskParameters}
				tasksToRun.push(Object.assign({ name: arguments[0] }, arguments[1]));
			} else if (
				arguments.length === 1 &&
				typeof arguments[0] === `object` &&
				arguments[0] instanceof Array
			) {
				// Case 4: {Array<any of the previous>}
				Array.prototype.slice.call(arguments[0]).forEach(function(argument) {
					tasksToRun = tasksToRun.concat(simplifyArguments(argument));
				});
			} else {
				throw {
					name: `Taskero:InvalidRunParametersError`,
					message: `The parameters provided to Taskero#run(...) method (${
						arguments.length
					} in number) is not valid.`
				};
			}
			return tasksToRun;
		}
		//
		//
		//
		//
		//
		//
		var tasksToRun = simplifyArguments.apply(
			null,
			Array.prototype.slice.call(arguments)
		);
		//
		//
		//
		//
		//
		//
		const normalizeTaskParameters = function(task) {
			if (!(`onEach` in task) || typeof task.onEach === `undefined`) {
				task.onEach = [];
			} else if (typeof task.onEach === `function`) {
				task.onEach = [].concat(task.onEach);
			} else if (task.onEach instanceof Array) {
				// ok
			} else {
				throw {
					name: `Taskero:ParameterOnEachNotValidError`,
					message: `Value at {task.onEach} is not valid`
				};
			}
			if (!(`onDone` in task) || typeof task.onDone === `undefined`) {
				task.onDone = [];
			} else if (typeof task.onDone === `function`) {
				task.onDone = [].concat(task.onDone);
			} else if (task.onDone instanceof Array) {
				// ok
			} else {
				throw {
					name: `Taskero:ParameterOnDoneNotValidError`,
					message: `Value at {task.onDone} is not valid`
				};
			}
			return task;
		};
		//
		//
		//
		//
		//
		//
		return new Promise(function(resolveRun, rejectRun) {
			//
			//
			//
			//
			//
			//
			tasksToRun = tasksToRun.map(function(taskToRun) {
				if (!(taskToRun.name in thisInstance.tasksMap)) {
					throw {
						name: `Taskero:TaskToRunNotFoundError`,
						message: `Task ${taskToRun.name} was not found`
					};
				}
				const task = thisInstance.tasksMap[taskToRun.name];
				return Object.assign({}, task.args, taskToRun, task.info);
			});
			//
			//
			//
			//
			//
			//
			async.forEach(
				tasksToRun,
				function(task, taskDone) {
					task = normalizeTaskParameters(task);
					thisInstance.debug(`[taskero] Starting task named ${task.name}.`);
					var files = globby.sync(task.files || []).map(function(file) {
						return {
							path: path.resolve(file),
							contents: fs.readFileSync(file, task.filesEncoding || `utf8`),
							isModified: false
						};
					});

					//
					//
					//
					//
					//
					//
					const startTask = (function(task) {
						return function(isWatchMode = false) {
							var counter = 0;
							//
							//
							//
							//
							//
							//
							async.forEach(
								task.onEach,
								function(onEach, onEachDone) {
									counter++;
									thisInstance.debug(
										`[taskero] OnEach function number ${counter}.`
									);
									//
									//
									//
									//
									//
									//
									async.forEach(
										files,
										function(file, onFileDone) {
											thisInstance.debug(
												`[taskero] Applying onEach to file ${file.path}.`
											);
											// @DONE: call the onEach function
											onEach(
												function(data, error) {
													if (error) {
														// @DONE: when it is called like `done(data, error)`, handle the error
														thisInstance.error(
															`[taskero] Error thrown by onEach function with file ${
																file.path
															}.`,
															error
														);
														return onFileDone(error);
													} else if (typeof data === `string`) {
														// @DONE: when it is called like `done(data)`, update the file contents
														thisInstance.debug(
															`[taskero] Contents modified by onEach function for file ${
																file.path
															}.`
														);
														file.contents = data;
														file.isModified = true;
														return onFileDone();
													} else {
														return onFileDone();
													}
												},
												file,
												task
											);
										},
										function(errorOnFile) {
											if (errorOnFile) {
												// @DONE: check the errors
												thisInstance.error(
													`[taskero] Error thrown by onEach function.`,
													errorOnFile
												);
												return onEachDone(errorOnFile);
											} else {
												return onEachDone();
											}
										}
									);
								},
								function(errorOnEach) {
									// @DONE: check the errors
									if (errorOnEach) {
										//
										thisInstance.error(
											`[taskero] Error thrown by onEach iteration.`,
											errorOnEach
										);
										return taskDone(errorOnEach);
									} else {
										files.forEach(function(file) {
											if (file.isModified) {
												thisInstance.debug(
													`[taskero] Dumping contents (${
														file.contents.length
													} characters) to file ${file.path}.`
												);
												fs.ensureFileSync(file.path);
												fs.writeFileSync(file.path, file.contents, `utf8`);
											}
										});
										thisInstance.debug("[taskero] Applying onDone now.");
										//
										//
										//
										//
										//
										//
										async.forEach(
											task.onDone,
											function(onDoneFunction, onDoneSolved) {
												onDoneFunction(
													function(data, error) {
														if (error) {
															// @DONE: when it is called like `done(data, error)`, handle the error
															thisInstance.error(
																`[taskero] Error thrown by onDone function.`,
																error
															);
															onDoneSolved(error);
														} else if (
															typeof data === `string` &&
															typeof task.onDoneFile === `string`
														) {
															// @DONE: when it is called like `done(data)`, update the file contents
															thisInstance.debug(
																`[taskero] Contents added by onDone function for file ${
																	task.onDoneFile
																}.`
															);
															fs.ensureFileSync(task.onDoneFile);
															fs.writeFileSync(task.onDoneFile, data, `utf8`);
															onDoneSolved();
														} else if (typeof data === `string`) {
															thisInstance.debug(
																`[taskero] As {task.onDoneFile} was not specified, the output of onDone function (${
																	data.length
																} characters) is not dumped.`
															);
															onDoneSolved();
														} else {
															onDoneSolved();
														}
													},
													task.files,
													task
												);
											},
											function(onDoneError) {
												if (onDoneError) {
													thisInstance.error(
														`[taskero] Error thrown by onDone iteration.`,
														onDoneError
													);
													return !isWatchMode
														? taskDone(onDoneError)
														: undefined;
												} else {
													return !isWatchMode ? taskDone() : undefined;
												}
											}
										);
									}
								}
							);
						};
					})(task);

					//
					//
					//
					//
					//
					//
					if (task.watch === true) {
						thisInstance.debug(`[taskero] Watch mode on task ${task.name}.`);
						// @DONE: add the task as watcher:
						const watcher = chokidar.watch(
							task.files,
							Object.assign({ persistent: true }, task.watchOptions || {})
						);
						watcher.on("all", function(event, fileChanged) {
							var date = new Date();
							var dateYear = date.getFullYear();
							var dateMonth = "" + (date.getMonth() + 1);
							var dateDay = "" + date.getDate();
							var dateHour = "" + date.getHours();
							var dateMinute = "" + date.getMinutes();
							var dateSeconds = "" + date.getSeconds();
							var dateMilliseconds = "" + date.getMilliseconds();
							if (dateMonth.length > 2) {
								dateMonth = "0" + dateMonth;
							}
							if (dateDay.length > 2) {
								dateDay = "0" + dateDay;
							}
							if (dateHour.length > 2) {
								dateHour = "0" + dateHour;
							}
							if (dateMinute.length > 2) {
								dateMinute = "0" + dateMinute;
							}
							if (dateSeconds.length > 2) {
								dateSeconds = "0" + dateSeconds;
							}
							console.log(
								`[taskero] ${dateYear}/${dateMonth}/${dateDay} ${dateHour}:${dateMinute}:${dateSeconds}.${dateMilliseconds}: Event "${event}" detected on file ${fileChanged}.`
							);
							startTask(true);
						});
						if (typeof task.onWatchError === "function") {
							watcher.on("error", task.onWatchError);
						}
						thisInstance.watchers.push(watcher);
						taskDone();
					} else {
						thisInstance.debug(`[taskero] Run mode on task ${task.name}.`);
						// startTask(false);
						startTask(); // Understood that is it false
					}
				},
				function(errorTask) {
					if (errorTask) {
						thisInstance.error(`[taskero] Error thrown by task.`, errorTask);
						return rejectRun.call(thisInstance, errorTask);
					} else {
						thisInstance.debug(
							`[taskero] All the tasks were done successfully!`
						);
						return resolveRun.call(thisInstance);
					}
				}
			);
		});
	}
	/**
	 *
	 * ----
	 *
	 * ### `Taskero#closeWatchers()`
	 *
	 * @type `{Function}`.
	 *
	 * @parameters `{none}`.
	 *
	 * @returns `{void}`.
	 *
	 * @description Removes all the `Taskero#watchers` added to the instance.
	 *
	 */
	closeWatchers() {
		this.watchers.forEach(function(watcher) {
			watcher.close();
		});
		this.watchers = [];
	}
	/**
	 *
	 * ----
	 *
	 * ### `Taskero#debug(Any:message,...)`
	 *
	 * @type `{Function}`.
	 *
	 * @parameters `{Any:message,...}`.
	 *
	 * @returns `{void}`.
	 *
	 * @description Logs the provided messages, only if the `Taskero#options.debug` is set to `true`.
	 *
	 */
	debug() {
		if (this.options.debug) {
			console.log.apply(console, Array.prototype.slice.call(arguments));
		}
	}
	/**
	 *
	 * ----
	 *
	 * ### `Taskero#error(Any:message,...)`
	 *
	 * @type `{Function}`.
	 *
	 * @parameters `{Any:message,...}`.
	 *
	 * @returns `{void}`.
	 *
	 * @description Logs the provided messages, only if the `Taskero#options.error` is set to `true` (which by default, it is).
	 *
	 */
	error() {
		if (this.options.debug || this.options.error) {
			console.log.apply(console, Array.prototype.slice.call(arguments));
		}
	}
	/**
	 *
	 * ----
	 *
	 * ### `Taskero.execute()`
	 *
	 * ### `Taskero.execute(Array<String>:command)`
	 *
	 * ### `Taskero.execute(String:command)`
	 *
	 * @type `{Function}`.
	 *
	 * @parameters `{Array<String>:command | String:command | void}`. Commands to execute. It can be
	 * an array of strings (like `process.argv`), a normal string (as the input of the command-line)
	 * or nothing at all (in which case, the `process.argv` is taken as parameter).
	 *
	 * @returns `{void}`.
	 *
	 * @description Executes a specific command, as a normal command-line tool would.
	 *
	 *
	 */
	static execute(commandParameter) {
		var runCommands = undefined;
		if (typeof commandParameter === "string") {
			runCommands = Taskero.transformCommands(commandParameter);
		} else if (commandParameter) {
			runCommands = commandParameter;
		} else {
			runCommands = Taskero.transformCommands(process.argv);
		}
		switch (runCommands.type) {
			case "list":
				console.log("Listing commands of taskero", runCommands);
				return new Promise(function(resolve, reject) {
					var msg = ``;
					const prettyPrintFile = function(file, taskContents, fileTasks) {
						return `
|
| { File: } ${file}
|
${taskContents}`;
					};
					const prettyPrintTask = function(task) {
						var out = "";
						out += `| { Task: } ${task.name}
| { Description: }
| | ${task.description.replace(/\n/g, "\n| | ")}
|
`;
						return out;
					};
					runCommands.files.forEach(function(file) {
						const taskeroInstance = require(file);
						var fileTasks = [];
						Object.keys(taskeroInstance.tasksMap).forEach(function(key) {
							var task = taskeroInstance.tasksMap[key].info;
							var taskDescription =
								typeof task.metadata === "object" &&
								typeof task.metadata.description === "string"
									? task.metadata.description
									: "- No description -";
							fileTasks.push({
								name: task.name,
								description: taskDescription
							});
						});
						const taskContents = fileTasks.map(prettyPrintTask).join("");
						msg += prettyPrintFile(file, taskContents, fileTasks);
					});
					console.log(msg);
					resolve();
				});
			case "help":
				return new Promise(function(resolve, reject) {
					// @TODO: print taskero's CLI help
					console.log(`
======================================
=== Taskero Command-Line Tool Help ===
======================================

Taskero CLI has 3 commands:

  1) taskero help: shows this help
  2) taskero list [taskero files]: lists the tasks declared in the specified files, including their own description.
  3) taskero run [options]: runs the specified tasks.

======================================

Syntax: (taskero run ~)

  ~$ taskero run 
    [-d | --debug]?
    [-f | --files {taskero-file taskero-file ...}]?
    [
      [-n | --name {task-name}]
      [--parameter {parameter-value parameter-value ...}]
    ]*

======================================

Explanation about the syntax:

  The 'taskero run' command needs to know 3 things:

    1) Should I be debugged?
    2) Which files should I take the tasks from?
    3) Which tasks should I run? And with which commands?
  
  The way to specify them is the following:

1)----------------------------------

  [-d | --debug]?

    : The debug flag. 
    · If specified, the actions made by Taskero will be logged.

2)----------------------------------

  [-f | --files {taskero-files}]?

    : The taskero files. 
    · If specified, one can list all the files from which the tasks will be taken. 
    · If omitted, the file 'taskero.file.js' will be automatically taken.

3)----------------------------------

  [ 
    [-n | --name {task-name}]
    [--parameter {parameter-value parameter-value ...}]
  ]*

    : The taskero tasks. 
    · This pattern can be repeated multiple times. 
    · It specifies the name of the task, and the parameters it must receive.
    · The 'parameter-values' have their own syntax.
    
    Parameter-values syntax: 

      :string:~ | :s:~          = {string} = "~"
      :boolean:true | :b:true   = {boolean} = true
      :boolean:false | :b:false = {boolean} = false
      :number:~ | :n:~          = {number} = ~
      { @~ ~ @~ ~ }             = {object} = { @~: ~, @~: ~ }
      [ ~ ~ ~ ~ ~ ]             = {array} = [ ~, ~, ~, ~, ~ ]
    
    By default, ":string:" is set.

======================================
`);
					resolve();
				});
			case "run":
			default:
				//
				// @TODO: instantiate a new Taskero instance
				//
				const taskero = new Taskero(runCommands.instance);
				//
				// @TODO: run all the commands specified as parameters
				//
				return taskero.run(runCommands.run);
		}
	}
	/**
	 *
	 * ----
	 *
	 * ### `Taskero.transformCommands()`
	 *
	 * ### `Taskero.transformCommands(Array<String>:command)`
	 *
	 * ### `Taskero.transformCommands(String:command)`
	 *
	 * @type `{Function}`.
	 *
	 * @parameters `{Array<String>:command | String:command | void}`. Commands to execute. It can be
	 * an array of strings (like `process.argv`), a normal string (as the input of the command-line)
	 * or nothing at all (in which case, the `process.argv` is taken as parameter).
	 *
	 * @returns `{void}`.
	 *
	 * @description Executes a specific command, as a normal command-line tool would.
	 *
	 *
	 *
	 */
	static transformCommands(commandParameter) {
		var transformation = {
			type: "run",
			instance: {},
			run: []
		};
		var words = null;
		if (typeof commandParameter === "undefined") {
			words = process.argv;
		} else if (typeof commandParameter === "string") {
			words = require("string-argv")(commandParameter);
		} else if (commandParameter instanceof Array) {
			words = commandParameter;
		} else {
			throw {
				name: "Taskero:InvalidCommandsProvided",
				args: commandParameter,
				message: "Invalid arguments to be transformed to runnable arguments."
			};
		}
		/*

		Valid commands:

		~$ taskero run [--debug] [--taskero ./taskero.file.js] [--name default]

		>>> {
			instance: {
				debug: true,
				files: ["./taskero.file.js"]
			},
			run: [{
				name: "default"
			}]
		}

		~$ taskero run [--debug] [--taskero ./taskero.file.js] [--name] {your:task}
		~$ taskero run [--debug] [--taskero ./taskero.file.js] [--name] {your:task} {your:task} {your:task}
		~$ taskero run [--debug] [--taskero ./taskero.file.js] {your:task} --arg1 {...taskarguments...} --name {...taskarguments...}
		~$ taskero run [--debug] 
				[
				--taskeros 
					"./taskero.js"
					"./dev/another.taskero.js"
				]
				--name # name: "jsx:compile"
					"jsx:compile"
				--arg1 # arg1: [1,2,3,"@ this parameter starts with @"]
					":number:1"
					":number:2"
					":number:3"
					"string:-- this parameter starts with --"
				--arg2 # arg2: ["default", "default1", "default2"]
					"default"
					"default1"
					"default2"
				--arg3
					":number:1"
					":number:2"
					":number:3"
					":string:@@@@ for 3 @ at the begining, and so on"
				--watch # watch: false (overrides the previous --watch)
					":boolean:false"
				--watch 
		//*/
		var index = 0;
		var execution = undefined;
		var lastCommand = undefined;
		// console.log("Command: ", words);
		WordsIteration: while (index < words.length) {
			var word = words[index];
			index++;
			if (typeof execution === "undefined") {
				if (~["run"].indexOf(word)) {
					execution = word;
				} else if (~["help"].indexOf(word)) {
					transformation.type = "help";
					return transformation;
				} else if (~["list"].indexOf(word)) {
					transformation.type = "list";
					transformation.files = [];
					words.splice(index).forEach(function(file) {
						transformation.files.push(file);
					});
					return transformation;
				}
			} else if (execution === "run") {
				//
				//
				if (typeof lastCommand === "undefined") {
					//
					//
					if (~["--debug", "-d"].indexOf(word)) {
						transformation.instance.debug = true;
						continue WordsIteration;
					}
					//
					//
					else if (
						~["--taskeros", "--taskero", "--files", "--file", "-f"].indexOf(
							word
						)
					) {
						transformation.instance.files = [];
						lastCommand = "run:--taskeros";
						continue WordsIteration;
					}
					//
					//
					else {
						transformation.run.push({
							name: word
						});
						lastCommand = "--name";
						continue WordsIteration;
					}
				}
				//
				//
				else if (lastCommand === "run:--taskeros") {
					if (~["--name", "-n"].indexOf(word)) {
						transformation.run.push({});
						lastCommand = "--name";
						continue WordsIteration;
					} else {
						transformation.instance.files.push(word);
						continue WordsIteration;
					}
				}
				//
				//
				else if (lastCommand === "--name") {
					if (~["--name", "-n"].indexOf(word)) {
						transformation.run.push({});
						lastCommand = "--name";
						continue WordsIteration;
					} else if (word.startsWith("--")) {
						lastCommand = word;
						continue WordsIteration;
					} else {
						transformation.run[transformation.run.length - 1].name = word;
						continue WordsIteration;
					}
				}
				//
				//
				else {
					if (~["--name", "-n"].indexOf(word)) {
						transformation.run.push({});
						lastCommand = "--name";
						continue WordsIteration;
					} else if (word.startsWith("--")) {
						lastCommand = word;
						continue WordsIteration;
					} else {
						const lastCommandProperty = lastCommand.replace(/^\-\-/g, "");
						if (
							typeof transformation.run[transformation.run.length - 1][
								lastCommandProperty
							] === "undefined"
						) {
							transformation.run[transformation.run.length - 1][
								lastCommandProperty
							] = [];
						}
						transformation.run[transformation.run.length - 1][
							lastCommandProperty
						].push(word);
						continue WordsIteration;
					}
				}
			}
		}
		if (transformation.type === "run") {
			if (transformation.run.length === 0) {
				transformation.run.push({
					name: "default"
				});
			}
			transformation = Taskero.tipifyValues(transformation);
		}
		return transformation;
	}

	static tipifyValues(inp) {
		var run = [];
		inp.run.forEach(function(runItem) {
			var newRunItem = {};
			Object.keys(runItem).forEach(function(runItemKey) {
				var runItemVal = runItem[runItemKey];
				if (runItemVal instanceof Array) {
					// Powered by Clitoris:
					newRunItem[runItemKey] = Clitoris.parse(runItemVal);
				} else {
					newRunItem[runItemKey] = runItemVal;
				}
			});
			run.push(newRunItem);
		});
		//console.log("OUTPUT...:", run);
		//*/
		var out = Object.assign({}, inp, { run });
		return out;
	}
}

module.exports = { Taskero };

/**
 *
 * ## 4. Tests, coverage and documentation
 *
 * The `package.json` file is provided with 3 commands:
 *
 *  - `npm run docs`: it generates the documentation from the Javadoc
 *  comments of the `src/taskero.js` file, which contains the whole
 *  library.
 *
 *  - `npm run test`: it runs the tests and generates the coverage
 *  reports into `coverage/` folder.
 *
 *  - `npm run test-nocov`: it runs the tests, but it does not
 *  generate coverage reports. Use this command if you want to run
 *  tests fastly.
 *
 *
 * ## 5. Why?
 *
 * I felt that Grunt is cool, and Gulp is cool, and Webpack is cool.
 *
 * Yes, they are cool.
 *
 * But:
 *
 * - **Webpack**, which was the coolest, complicated things too much.
 *
 *   (I only need to listen for changes, and do things, I do not
 *   want to change the way I code for a task-automation tool!
 *   The less, the better: that is programming for me in a 70%
 *   of the cases, for lots of reasons.)
 *
 * - **Grunt**, which was my favourite, lacks of parametrization.
 *
 *   (And with it, the watchers functionality... but it was the
 *   main reference I took, it was the easiest to understand, and
 *   the one with more flexibility.)
 *
 * - **Gulp**, which was very promising, has a strange API.
 *
 *   (I need flexibility, I can sacrifice a bit of beauty in
 *   coding, but I need absolute transparence and flexibility,
 *   and also parametrization was not contemplated, and so, the
 *   watchers functionality...)
 *
 * ## 6. Problems
 *
 * I am not an engineer. I just make tools that fit my needs. But I
 * do not have a deep understanding, or know the best algorythms for
 * doing what I want to do. I can imagine better ways to do them.
 * But I still do not care too much about this point. It may result
 * dangerous, when I do not have the deep knowledge I should have.
 *
 * In other words: this tool seems to work great for some tasks. But
 * I do not know what can happen if I put a hundred tasks to run,
 * a thousand files to watch, etc.
 *
 * But... I supose I can split my tasks into different files, and run
 * them selectively, depending on which part of the project I am
 * working on. I do not know. I want to think that I am not losing my
 * time working on tools like this one. In the end, I am already using
 * my own tools for my developments.
 *
 * ## 7. Conclusions
 *
 * In conclusion, **`Taskero`** is a project that aims to ease the tasks
 * automation, which is a very fundamental part of any software
 * development project, and which takes a lot of time in development.
 *
 * Also, I wanted to give more open source projects, I can not compite
 * against companies, or engineers, but... maybe I can provide something
 * interesting to them, despite not having a job yet. I do not know.
 *
 * In fact, I do not want to compite. But it is your language.
 *
 * This is how you have been programmed. Deeply sad, tbh.
 *
 */
