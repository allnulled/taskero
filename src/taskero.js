const globby = require(`globby`);
const async = require(`async`);
const path = require(`path`);
const chokidar = require("chokidar");
const dateformat = require("dateformat");
const fs = require(`fs-extra`);

/**
 *
 * ----
 *
 * ### `require(`taskero`).Taskero`
 *
 * @type `{Class}`
 *
 * @description Returns the main class of the `Taskero`'s API.
 *
 */
class Taskero {
	/**
	 *
	 * ----
	 *
	 * ### `Taskero.generate()`
	 *
	 * This is transformed into: `new Taskero()`.
	 *
	 * ### new Taskero()
	 *
	 * @type `{Object}`
	 *
	 * @description Generates a `new Taskero` instance.
	 *
	 */
	constructor(optionsParam) {
		this.tasksMap = {};
		this.watchers = [];
		this.options = Object.assign(
			{
				debug: false
			},
			optionsParam
		);
	}
	static generate() {
		return new Taskero();
	}
	/**
	 *
	 *
	 *
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
	 * ### `Taskero#debug()`
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
	 * ### Taskero#tasks
	 *
	 * @type `{Object}`. Map of registered tasks.
	 *
	 * @description The registered tasks for the current `{Taskero}` instance.
	 *
	 *
	 *
	 */
	get tasks() {
		return this.tasksMap;
	}
	/**
	 *
	 * ----
	 *
	 * ### `Taskero#register(Object:taskInfo)`
	 *
	 * This is transformed into: `Taskero#register(taskInfo, {})`.
	 *
	 * ### `Taskero#register(Object:taskInfo, Object:taskArgsDefault)`
	 *
	 * @type `{void}`
	 *
	 * @throws `{Taskero.TaskDuplicatedError}`. This error is thrown when there is already a task with the same name defined in `Taskero#taskMap` map.
	 *
	 * @parameter `{Object:taskInfo}`. Object that has the main info about the task to be registered. This implies:
	 *
	 * ```js
	 * {
	 *   name: String,
	 *   onEach: Function,
	 *   onDone: Function,
	 * }
	 * ```
	 *
	 * · `name`: `{String}`. Name of the task. It has to be unique in the whole `Taskero` instance.
	 *
	 * · `onEach`: `{Array<Function>}`. Callbacks to be called against each of the files (taken from `taskArgsDefault.files` parameter, if any). The callbacks look like this:
	 *
	 * ```js
	 * function(done, args, file) {
	 *   // Code of the iteration. Must call the done() function.
	 * };
	 * ```
	 *
	 * In this callback, the arguments correspond to:
	 *
	 *   · `done`: `{Function}`. Callback to finish the current iteration (to enable asynchronous operations).
	 *
	 * If it is called with 0 arguments, like `done()`, this will leave the file unchanged, and the next `onEach` callback will be started.
	 *
	 * If it is called with 1 argument, like `done(`some content`)`, this will produce the modification of the content of the file, and in the next onEach callback.
	 *
	 * If it is called with 2 arguments, like `done(null, {name: `SomeError`, message: `...`})`, an error with the 2nd parameter will be thrown.
	 *
	 * If it is called with 3 arguments, like `done(null, {name: `SomeError`, message: `...`}, true)`, and the 3rd argument is `true`, the execution of the current `Taskero#run(...)` will be stopped at this point.
	 *
	 *   · `args`: `{Object}`. Arguments for the current task. This is defined by the `taskArgsDefault` (from `Taskero#register`) and by `taskArgs` (from `Taskero#run`). The second one extends the first one through `Object.assign({}, ~, ~)`.
	 *
	 *   · `file`: `{Object}`. The file of the current iteration. This is an object, which has:
	 *
	 *   `File#path`: `{String}`. Absolute path of the file.
	 *
	 *   `File#contents`: `{String}`. Content of the file. This is modified.
	 *
	 * Take into account that passing
	 *
	 * · `onDone`: `{Function}`. Callback to be called against all the files only once after the `onEach` iteration is completed. This callback looks like this:
	 *
	 * ```js
	 * function(done, args, files) {
	 *   // Code of the . Must call the done() function.
	 * };
	 * ```
	 *
	 * @description Adds a new task into the `Taskero#taskMap` of this `Taskero` instance. It also provides the default parameters of the task, through `taskArgsDefault` argument.
	 *
	 */
	register(taskInfo, taskArgsDefault = {}) {
		if (taskInfo.name in this.tasksMap) {
			throw {
				name: `Taskero:TaskDuplicatedError`,
				message: `Task ${taskInfo.name} was not found among ${
					Object.keys(this.taskMap).length
				} tasks.`
			};
		}
		this.tasksMap[taskInfo.name] = {
			info: taskInfo,
			args: taskArgsDefault
		};
	}
	/**
	 *
	 * ----
	 *
	 * ### `Taskero#run(String:taskName)`
	 *
	 * This is transformed into: `Taskero#run([{name:taskName}])`.
	 *
	 * ### `Taskero#run(Object:taskParameters)`
	 *
	 * This is transformed into: `Taskero#run([taskParameters])`.
	 *
	 * ### `Taskero#run(String:taskName, Object:taskParamaters)`
	 *
	 * This is transformed into: `Taskero#run([Object.assign({name:taskName}, taskParameters)])`.
	 *
	 * ### `Taskero#run(Array<Object:taskParameters>:tasks)`
	 *
	 * @type `{void}`
	 *
	 * @description
	 *
	 *
	 *
	 */
	run() {
		// @TODO:
		const thisInstance = this;
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
					name: `Taskero:InvalidRunParameters`,
					message: `The parameters provided to Taskero#run(...) method (${
						arguments.length
					} in number) is not valid.`
				};
			}
			return tasksToRun;
		}
		var tasksToRun = simplifyArguments.apply(
			null,
			Array.prototype.slice.call(arguments)
		);
		const normalizeTaskParameters = function(task) {
			if (!(`onEach` in task) || typeof task.onEach === `undefined`) {
				task.onEach = [];
			} else if (typeof task.onEach === `function`) {
				task.onEach = [].concat(task.onEach);
			} else if (task.onEach instanceof Array) {
				// ok
			} else {
				throw {
					name: `Taskero:ParameterOnEachNotValid`,
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
					name: `Taskero:ParameterOnDoneNotValid`,
					message: `Value at {task.onDone} is not valid`
				};
			}
			return task;
		};
		return new Promise(function(resolveRun, rejectRun) {
			tasksToRun = tasksToRun.map(function(taskToRun) {
				if (!(taskToRun.name in thisInstance.tasksMap)) {
					throw {
						name: `Taskero:TaskToRunNotFound`,
						message: `Task ${taskToRun.name} was not found`
					};
				}
				const task = thisInstance.tasksMap[taskToRun.name];
				return Object.assign({}, task.args, taskToRun, task.info);
			});

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

					const startTask = (function(task) {
						return function(isWatchMode = false) {
							//
							//
							//
							var counter = 0;
							async.forEach(
								task.onEach,
								function(onEach, onEachDone) {
									//
									//
									//
									counter++;
									thisInstance.debug(
										`[taskero] OnEach function number ${counter}.`
									);
									async.forEach(
										files,
										function(file, onFileDone) {
											thisInstance.debug(
												`[taskero] Applying onEach to file ${file.path}.`
											);
											// @TODO: call the onEach function
											onEach(
												function(data, error) {
													if (error) {
														// @TODO: when it is called like `done(data, error)`, handle the error
														thisInstance.debug(
															`[taskero] Error thrown by onEach function with file ${
																file.path
															}.`,
															error
														);
														return onFileDone(error);
													} else if (typeof data === `string`) {
														// @TODO: when it is called like `done(data)`, update the file contents
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
												// @TODO: check the errors
												thisInstance.debug(
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
									// @TODO: check the errors
									if (errorOnEach) {
										//
										thisInstance.debug(
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
										async.forEach(
											task.onDone,
											function(onDoneFunction, onDoneSolved) {
												onDoneFunction(
													function(data, error) {
														if (error) {
															// @TODO: when it is called like `done(data, error)`, handle the error
															thisInstance.debug(
																`[taskero] Error thrown by onDone function.`,
																error
															);
															onDoneSolved(error);
														} else if (
															typeof data === `string` &&
															typeof task.onDoneFile === `string`
														) {
															// @TODO: when it is called like `done(data)`, update the file contents
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
													thisInstance.debug(
														`[taskero] Error thrown by onDone iteration.`,
														onDoneError
													);
													if (isWatchMode) {
														// @Nothing...
													} else {
														return taskDone(onDoneError);
													}
												} else {
													if (isWatchMode) {
														// @Nothing...
													} else {
														return taskDone();
													}
												}
											}
										);
									}
								}
							);
						};
					})(task);

					if (task.watch === true) {
						thisInstance.debug(`[taskero] Watch mode on task ${task.name}.`);
						// @TODO: add the task as watcher:
						if (!(task.files instanceof Array)) {
							task.files = [].concat(task.files);
						}
						const watcher = chokidar.watch(
							task.files,
							Object.assign({ persistent: true }, task.watchOptions || {})
						);
						watcher.on("all", function(event, fileChanged) {
							console.log(
								`[taskero] ${dateformat(
									new Date(),
									"yyyy/mm/dd hh:MM:ss.l"
								)}: Event "${event}" detected on file ${fileChanged}.`
							);
							startTask(true);
						});
						watcher.on("error", function(error) {
							console.log(`[taskero] Error while watching files:`, error);
						});
						thisInstance.watchers.push(watcher);
						taskDone();
					} else {
						thisInstance.debug(`[taskero] Run mode on task ${task.name}.`);
						startTask(false);
					}
				},
				function(errorTask) {
					if (errorTask) {
						thisInstance.debug(`[taskero] Error thrown by task.`, errorTask);
						return rejectRun.call(thisInstance, errorTask);
					} else {
						thisInstance.debug(
							`[taskero] All the tasks were done successfully!`
						);
						// @TODO: Dump the contents to the files.
						// @TODO: use the task.onEachOutput (enabling ${basename} too)
						return resolveRun.call(thisInstance);
					}
				}
			);
		});
	}
}

module.exports = { Taskero };
