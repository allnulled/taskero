const { expect, assert } = require("chai");
const fs = require("fs-extra");
const rimraf = require("rimraf");
const { ConsoleManager } = require("function-wrapper");

describe("Taskero class", function() {
	var utils = {
		dump: function(file, content) {
			fs.outputFileSync(file, content, "utf8");
		},
		remove: function(file) {
			rimraf.sync(file);
		}
	};
	var TaskeroAPI, Taskero, taskero;

	before(function() {
		rimraf.sync(`${__dirname}/samples/*`);
		ConsoleManager.saveLog(true);
		utils.dump(__dirname + "/samples/sample1.txt", "sample1.txt", "utf8");
		utils.dump(__dirname + "/samples/sample2.txt", "sample2.txt", "utf8");
		utils.dump(__dirname + "/samples/sample3.txt", "sample3.txt", "utf8");
		utils.dump(__dirname + "/samples/sample4.txt", "sample4.txt", "utf8");
		utils.dump(__dirname + "/samples/sample5.txt", "sample5.txt", "utf8");
		utils.dump(__dirname + "/samples/sample6.txt", "sample6.txt", "utf8");
		utils.dump(__dirname + "/samples/sample7.txt", "sample7.txt", "utf8");
		utils.remove(__dirname + "/samples/output.txt");
		utils.remove(__dirname + "/samples/output-from-watch.txt");
	});

	after(function() {
		//rimraf.sync(`${__dirname}/samples/*`);
	});

	it("is retrievable", function(done) {
		this.timeout(10000);
		ConsoleManager.saveLog(true);
		TaskeroAPI = require("../src/taskero.js");
		expect(typeof TaskeroAPI).to.equal("object");
		Taskero = TaskeroAPI.Taskero;
		expect(typeof Taskero).to.equal("function");
		ConsoleManager.recoverLog();
		done();
	});

	it("is instantiable", function() {
		ConsoleManager.saveLog(true);
		taskero = new Taskero({
			debug: false
		});
		expect(typeof taskero).to.equal("object");
		ConsoleManager.recoverLog();
	});

	it("can register tasks successfully", function() {
		ConsoleManager.saveLog(true);
		taskero.register({
			name: "tarea:1",
			onEach: undefined,
			onDone: undefined
		});
		taskero.register({
			name: "tarea:2",
			onEach: undefined,
			onDone: undefined
		});
		expect(taskero.tasksMap).to.have.keys(["tarea:1", "tarea:2"]);
		ConsoleManager.recoverLog();
	});

	it("can run tasks successfully by only their name", function(done) {
		ConsoleManager.saveLog(true);
		var data1 = "Something";
		taskero.register({
			name: "tarea:3",
			// onEach: undefined,
			onDone: function(done) {
				data1 = "Something else";
				done();
			}
		});
		taskero
			.run("tarea:3", { files: __dirname + "/samples/**/*.txt" })
			.then(function() {
				// expect(data1).to.equal("Something else");
				ConsoleManager.recoverLog();
				done();
			})
			.catch(function(error) {
				console.log("Error on tarea:3", error);
			});
	});

	it("can run tasks with onEach and onDone callbacks correctly", function(done) {
		ConsoleManager.saveLog(true);
		taskero.register({
			name: "tarea:4",
			onEach: function(done, file, args) {
				return done(file.path + "\n\n" + file.contents);
			},
			onDone: function(done, files, args) {
				done();
			}
		});
		taskero
			.run("tarea:4", {
				files: [
					__dirname + "/samples/**/*.txt",
					"!**/sample3.txt",
					"!**/sample4.txt",
					"!**/sample5.txt",
					"!**/sample6.txt",
					"!**/sample7.txt"
				]
			})
			.then(function() {
				ConsoleManager.recoverLog();
				done();
			})
			.catch(function(error) {
				console.log("Error on tarea:4", error);
			});
	});

	it("can run multiple tasks at once", function(done) {
		this.timeout(5000);
		ConsoleManager.saveLog(true);
		taskero.register({
			name: "tarea:5",
			onEach: [
				function(done, file, args) {
					done();
				},
				function(done, file, args) {
					done();
				},
				function(done, file, args) {
					done();
				},
				function(done, file, args) {
					done();
				}
			],
			onDone: []
		});
		taskero
			.run([
				{
					name: "tarea:3",
					files: [
						__dirname + "/samples/**/*.txt",
						"!**/sample3.txt",
						"!**/sample4.txt",
						"!**/sample5.txt",
						"!**/sample6.txt",
						"!**/sample7.txt"
					],
					onEach: [
						function(done, file, args) {
							// expect(true).to.equal(false);
							expect(typeof file).to.equal("object");
							expect(typeof args).to.equal("object");
							expect(file).to.have.keys(["path", "contents", "isModified"]);
							expect(typeof file.path).to.equal("string");
							expect(typeof file.contents).to.equal("string");
							expect(typeof file.isModified).to.equal("boolean");
							// @TODO: check that the contents are changed across the callbacks.
							done("this is a request");
						},
						function(done, file, args) {
							expect(typeof file).to.equal("object");
							expect(typeof args).to.equal("object");
							expect(file).to.have.keys(["path", "contents", "isModified"]);
							expect(typeof file.path).to.equal("string");
							expect(typeof file.contents).to.equal("string");
							expect(typeof file.isModified).to.equal("boolean");
							expect(file.contents).to.equal("this is a request");
							// @TODO: check that the contents are changed across the callbacks.
							done("REQUEST 2");
						},
						function(done, file, args) {
							expect(typeof file).to.equal("object");
							expect(typeof args).to.equal("object");
							expect(file).to.have.keys(["path", "contents", "isModified"]);
							expect(typeof file.path).to.equal("string");
							expect(typeof file.contents).to.equal("string");
							expect(typeof file.isModified).to.equal("boolean");
							expect(file.contents).to.equal("REQUEST 2");
							// @TODO: check that the contents are changed across the callbacks.
							done("REQUEST 3");
						},
						function(done, file, args) {
							expect(typeof file).to.equal("object");
							expect(typeof args).to.equal("object");
							expect(file).to.have.keys(["path", "contents", "isModified"]);
							expect(typeof file.path).to.equal("string");
							expect(typeof file.contents).to.equal("string");
							expect(typeof file.isModified).to.equal("boolean");
							expect(file.contents).to.equal("REQUEST 3");
							// @TODO: check that the contents are changed across the callbacks.
							done("REQUEST 4");
						},
						function(done, file, args) {
							expect(typeof file).to.equal("object");
							expect(typeof args).to.equal("object");
							expect(file).to.have.keys(["path", "contents", "isModified"]);
							expect(typeof file.path).to.equal("string");
							expect(typeof file.contents).to.equal("string");
							expect(typeof file.isModified).to.equal("boolean");
							expect(file.contents).to.equal("REQUEST 4");
							// @TODO: check that the contents are changed across the callbacks.
							done("REQUEST 5");
						},
						function(done, file, args) {
							expect(typeof file).to.equal("object");
							expect(typeof args).to.equal("object");
							expect(file).to.have.keys(["path", "contents", "isModified"]);
							expect(typeof file.path).to.equal("string");
							expect(typeof file.contents).to.equal("string");
							expect(typeof file.isModified).to.equal("boolean");
							// @TODO: check that the contents are changed across the callbacks.
							expect(file.contents).to.equal("REQUEST 5");
							done("REQUEST 6");
						},
						function(done, file, args) {
							expect(typeof file).to.equal("object");
							expect(typeof args).to.equal("object");
							expect(file).to.have.keys(["path", "contents", "isModified"]);
							expect(typeof file.path).to.equal("string");
							expect(typeof file.contents).to.equal("string");
							expect(typeof file.isModified).to.equal("boolean");
							// @TODO: check that the contents are changed across the callbacks.
							expect(file.contents).to.equal("REQUEST 6");
							done("REQUEST 7");
						},
						function(done, file, args) {
							expect(typeof file).to.equal("object");
							expect(typeof args).to.equal("object");
							expect(file).to.have.keys(["path", "contents", "isModified"]);
							expect(typeof file.path).to.equal("string");
							expect(typeof file.contents).to.equal("string");
							expect(typeof file.isModified).to.equal("boolean");
							// @TODO: check that the contents are changed across the callbacks.
							expect(file.contents).to.equal("REQUEST 7");
							done("REQUEST 8");
						}
					]
				},
				"tarea:4",
				"tarea:5"
			])
			.then(function() {
				expect(
					fs.readFileSync(__dirname + "/samples/sample1.txt").toString()
				).to.equal("REQUEST 8");
				expect(
					fs.readFileSync(__dirname + "/samples/sample2.txt").toString()
				).to.equal("REQUEST 8");
				ConsoleManager.recoverLog();
				done();
			})
			.catch(function(error) {
				console.log("Error on tarea:3 or tarea:4 or tarea:5", error);
			});
	});

	it("stops the execution for onEach errors and avoids dumping data to files", function(done) {
		//
		this.timeout(5000);
		ConsoleManager.saveLog(true);
		var counter = 0;
		taskero.register({
			name: "tarea:6",
			onEach: [
				function(done, file, args) {
					counter++;
					return done();
				},
				function(done, file, args) {
					counter++;
					return done();
				},
				function(done, file, args) {
					counter++;
					return done("This is a modification for the first file only.");
				},
				function(done, file, args) {
					expect(counter).to.equal(9);
					setTimeout(function() {
						done(null, {
							name: "SomeSortOfError",
							message: "Message of some sort of error."
						});
					}, 1000);
				},
				function(done, file, args) {
					counter = "Hello!";
					done();
				}
			]
		});
		taskero
			.run({
				name: "tarea:6",
				files: [
					__dirname + "/samples/sample3.txt",
					__dirname + "/samples/sample4.txt",
					__dirname + "/samples/sample5.txt"
				]
			})
			.then(function() {
				expect(true).to.equal(false);
			})
			.catch(function(error) {
				expect(typeof error).to.equal("object");
				//expect(error).to.have.keys(["name", "message"]);
				expect(error.name).to.equal("SomeSortOfError");
				expect(error.message).to.equal("Message of some sort of error.");
				expect(
					fs.readFileSync(__dirname + "/samples/sample3.txt").toString()
				).to.equal("sample3.txt");
				expect(
					fs.readFileSync(__dirname + "/samples/sample4.txt").toString()
				).to.equal("sample4.txt");
				expect(
					fs.readFileSync(__dirname + "/samples/sample5.txt").toString()
				).to.equal("sample5.txt");
				ConsoleManager.recoverLog();
				done();
			});
	});

	it("dumps data when {task.onDone} returns a string and {task.onDoneFile} is a string", function(done) {
		this.timeout(15000);
		ConsoleManager.saveLog(true);
		expect(fs.existsSync(__dirname + "/samples/output.txt")).to.equal(false);
		taskero.register({
			name: "tarea:7",
			onDone: function(done, files, args) {
				done("Hello from onDone callback!");
			},
			files: "this.is.an.impossiblefile.txt.i.hope",
			onDoneFile: __dirname + "/samples/output.txt"
		});
		taskero
			.run("tarea:7")
			.then(function() {
				expect(fs.existsSync(__dirname + "/samples/output.txt")).to.equal(true);
				expect(
					fs.readFileSync(__dirname + "/samples/output.txt").toString()
				).to.equal("Hello from onDone callback!");
				ConsoleManager.recoverLog();
				done();
			})
			.catch(function(error) {
				expect(true).to.equal(false);
			});
	});

	it("gives a notification when {task.onDone} returns a string and {task.onDoneFile} is a not string", function(done) {
		this.timeout(15000);
		ConsoleManager.saveLog(true);
		taskero.register({
			name: "tarea:8",
			onDone: function(done, file, args) {
				done(
					"Parameter {task.onDoneFile} is required to dump data from onDone!"
				);
			}
		});
		taskero
			.run("tarea:8")
			.then(function() {
				ConsoleManager.recoverLog();
				done();
			})
			.catch(function() {
				ConsoleManager.recoverLog();
				expect(true).to.equal(false);
			});
	});

	it("directly watches {task.files} for any task when {task.watch} is set to true", function(done) {
		//
		this.timeout(8000);
		ConsoleManager.saveLog(true);
		expect(
			fs.existsSync(__dirname + "/samples/output-from-watch.txt")
		).to.equal(false);
		taskero.register({
			name: "tarea:9",
			watch: true,
			onDone: function(done, files, args) {
				done("This is Sparta");
			},
			onDoneFile: __dirname + "/samples/output-from-watch.txt",
			files: [
				__dirname + "/samples/sample5.txt",
				__dirname + "/samples/sample6.txt",
				__dirname + "/samples/sample7.txt"
			],
			onWatchError: function(error) {
				ConsoleManager.recoverLog();
				console.log("[taskero:tarea:9] Error on watch event:", error);
			}
		});
		taskero.register({
			name: "tarea:9.5",
			watch: true,
			onDone: function(done, files, args) {
				fs.outputFileSync(
					__dirname + "/samples/output-from-watch-2.txt",
					"This is Sparta 2",
					"utf8"
				);
				done(null, { name: "RandomError" });
			},
			onDoneFile: __dirname + "/samples/output-from-watch-2.txt",
			files: [
				__dirname + "/samples/sample5.txt",
				__dirname + "/samples/sample6.txt",
				__dirname + "/samples/sample7.txt"
			]
		});
		taskero
			.run(["tarea:9", "tarea:9.5"])
			.then(function() {
				ConsoleManager.recoverLog();
				// @TODO: change contents from __dirname + "/samples/sample5.txt" and, with a (dirty) timeout, check if the task was correctly done.
				expect(
					fs.existsSync(__dirname + "/samples/output-from-watch.txt")
				).to.equal(false);
				fs.outputFileSync(
					__dirname + "/samples/sample5.txt",
					"Changed!",
					"utf8"
				);
				setTimeout(function() {
					ConsoleManager.recoverLog();
					taskero.closeWatchers();
					expect(
						fs.existsSync(__dirname + "/samples/output-from-watch.txt")
					).to.equal(true);
					expect(
						fs.readFileSync(__dirname + "/samples/output-from-watch.txt")
							.toString()
					).to.equal("This is Sparta");
					expect(
						fs.existsSync(__dirname + "/samples/output-from-watch-2.txt")
					).to.equal(true);
					expect(
						fs
							.readFileSync(__dirname + "/samples/output-from-watch-2.txt")
							.toString()
					).to.equal("This is Sparta 2");
					done();
				}, 3000);
			})
			.catch(function(error) {
				ConsoleManager.recoverLog();
				console.log("ERROR ON WATCHERS", error);
				expect(true).to.equal(false);
			});
	});

	it("does not print messages when debug is not enabled", function(done) {
		const taskero2 = new Taskero();
		taskero2.register({
			name: "tarea:10",
			onDone: function(done) {
				done();
			}
		});
		var consoleMessages = [];
		const consolelog = console.log;
		console.log = function() {
			consoleMessages = consoleMessages.concat(
				Array.prototype.slice.call(arguments)
			);
		};
		taskero2
			.run("tarea:10")
			.then(function() {
				expect(consoleMessages.length).to.equal(0);
				console.log = consolelog;
				done();
			})
			.catch(function() {
				expect(true).to.equal(false);
			});
	});

	it("throws when a task to be registered is duplicated", function(done) {
		this.timeout(5000);
		ConsoleManager.saveLog(true);
		expect(function() {
			taskero.register({
				name: "task:11",
				onDone: undefined,
				onEach: undefined
			});
			taskero.register({
				name: "task:11",
				onDone: undefined,
				onEach: undefined
			});
		}).to.throw();
		setTimeout(function() {
			ConsoleManager.recoverLog();
			done();
		}, 1000);
	});

	it("throws when it receives invalid parameters for method Taskero#run(~)", function(done) {
		this.timeout(5000);
		ConsoleManager.saveLog(true);
		try {
			taskero.run(undefined);
		} catch (error) {
			expect(typeof error).to.equal("object");
			expect(error.name).to.equal("Taskero:InvalidRunParametersError");
			ConsoleManager.recoverLog();
			done();
		}
	});

	it("throws when {task.onEach} is invalid", function(done) {
		this.timeout(5000);
		ConsoleManager.saveLog(true);
		taskero.register({
			name: "task:12",
			onEach: "This is not a valid value for onEach"
		});
		taskero
			.run("task:12")
			.then(function() {
				expect(true).to.equal(false);
			})
			.catch(function(error) {
				expect(typeof error).to.equal("object");
				expect(error.name).to.equal("Taskero:ParameterOnEachNotValidError");
				ConsoleManager.recoverLog();
				done();
			});
	});

	it("throws when {task.onDone} is invalid", function(done) {
		this.timeout(5000);
		ConsoleManager.saveLog(true);
		taskero.register({
			name: "task:13",
			onDone: "This is not a valid value for onDone"
		});
		taskero
			.run("task:13")
			.then(function() {
				expect(true).to.equal(false);
			})
			.catch(function(error) {
				expect(typeof error).to.equal("object");
				expect(error.name).to.equal("Taskero:ParameterOnDoneNotValidError");
				ConsoleManager.recoverLog();
				done();
			});
	});

	it("throws when {task.name} is not registered", function(done) {
		this.timeout(5000);
		ConsoleManager.saveLog(true);
		taskero
			.run("task:14")
			.then(function() {
				expect(true).to.equal(false);
			})
			.catch(function(error) {
				expect(typeof error).to.equal("object");
				expect(error.name).to.equal("Taskero:TaskToRunNotFoundError");
				ConsoleManager.recoverLog();
				done();
			});
	});

	it("throws when {task.onDone} sends errors asynchronously (through 2nd parameter)", function(done) {
		this.timeout(5000);
		ConsoleManager.saveLog(true);
		taskero.register({
			name: "task:14",
			onDone: function(done) {
				done(null, {
					name: "CustomError",
					message: "This is a custom error"
				});
			}
		});
		taskero
			.run("task:14")
			.then(function() {
				expect(true).to.equal(false);
			})
			.catch(function(error) {
				expect(typeof error).to.equal("object");
				expect(error.name).to.equal("CustomError");
				expect(error.message).to.equal("This is a custom error");
				ConsoleManager.recoverLog();
				done();
			});
	});

	it("accepts {task.files} as a simple string too", function(done) {
		this.timeout(5000);
		ConsoleManager.saveLog(true);
		const messages = [];
		taskero.register({
			name: "task:15",
			onEach: function(done, file, args) {
				messages.push(file.path);
				done();
			}
		});
		taskero
			.run({
				name: "task:15",
				files: __dirname + "/samples/sample1.txt"
			})
			.then(function() {
				expect(messages.length).to.equal(1);
				expect(messages[0]).to.equal(__dirname + "/samples/sample1.txt");
				ConsoleManager.recoverLog();
				done();
			})
			.catch(function(error) {
				console.log("Error:", error);
				expect(true).to.equal(false);
			});
	});

	it("can load taskero files from Taskero constructor", function(done) {
		ConsoleManager.saveLog(true);
		const taskero3 = new Taskero({
			debug: false,
			error: true,
			files: __dirname + "/taskero.file.js"
		});
		taskero3.error(
			"[tastero-test] Just for coverage purposes. Ignore this message."
		);
		expect("file:hello" in taskero3.tasksMap).to.equal(true);
		expect("file:bye" in taskero3.tasksMap).to.equal(true);
		const taskero4 = new Taskero({
			files: [__dirname + "/taskero.file.js", __dirname + "/taskero.file-2.js"],
			debug: false,
			error: false
		});
		taskero4.error("[taskero-test] This message should not be ever seen.");
		expect("file:hello" in taskero4.tasksMap).to.equal(true);
		expect("file:bye" in taskero4.tasksMap).to.equal(true);
		expect("file:2:hello" in taskero4.tasksMap).to.equal(true);
		expect("file:2:bye" in taskero4.tasksMap).to.equal(true);
		ConsoleManager.recoverLog();
		done();
	});

	it("throws error when the taskero file demanded is not importable", function(done) {
		var taskero5;
		ConsoleManager.saveLog(true);
		try {
			taskero5 = new Taskero({
				files: __dirname + "/taskero.file-not-exists.js"
			});
		} catch (exc) {
			expect(exc.name).to.equal("Taskero:InvalidFileRequiredError");
			ConsoleManager.recoverLog();
			done();
		}
	});
});
