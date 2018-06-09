const { expect, assert } = require("chai");
const Taskero = require(__dirname + "/../src/taskero.js").Taskero;
const deepEqual = require("deep-equal");
const rimraf = require("rimraf");
const { FunctionWrapper, ConsoleManager } = require("function-wrapper");
const fs = require("fs-extra");

describe("Taskero command-line tool", function() {
	before(function() {
		rimraf.sync(`${__dirname}/samples/dump.txt`);
	});
	after(function() {
		//
	});
	//
	//
	//
	it("can transform the default command", function(done) {
		var args = Taskero.transformCommands(`taskero run`);
		expect(
			deepEqual(args, {
				type: "run",
				instance: {},
				run: [
					{
						name: "default"
					}
				]
			})
		).to.equal(true);
		done();
	});
	//
	//
	//
	it("can add debugging and multiple files while transforming commands", function(done) {
		var args = Taskero.transformCommands(
			`taskero run --debug --taskero ./taskero.file.js ./taskero.file-2.js`
		);
		expect(
			deepEqual(args, {
				type: "run",
				instance: {
					debug: true,
					files: ["./taskero.file.js", "./taskero.file-2.js"]
				},
				run: [
					{
						name: "default"
					}
				]
			})
		).to.equal(true);
		done();
	});
	//
	//
	//
	it("can execute as expected command as command-line tool too", function(done) {
		ConsoleManager.clearMessages();
		ConsoleManager.saveLog(true);
		Taskero.execute(
			`taskero run --debug --taskero "${__dirname}/taskero.file.js" "${__dirname}/taskero.file-2.js" --name file:hello`
		)
			.then(function() {
				ConsoleManager.recoverLog();
				expect(ConsoleManager.messages.length).to.not.equal(0);
				ConsoleManager.clearMessages();
				done();
			})
			.catch(function() {
				expect(true).to.equal(false);
			});
	});
	//
	//
	//
	it("can add new parameters to execution as command-line", function(done) {
		ConsoleManager.clearMessages();
		ConsoleManager.saveLog(true);
		expect(fs.existsSync(`${__dirname}/samples/dump.txt`)).to.equal(false);
		Taskero.execute(
			Taskero.transformCommands(
				`taskero run --debug --taskero "${__dirname}/taskero.file.js" "${__dirname}/taskero.file-2.js" --name file:2:dump --dumpFile ${__dirname}/samples/dump.txt --dumpContents "Hello world!"`
			)
		)
			.then(function() {
				expect(fs.existsSync(`${__dirname}/samples/dump.txt`)).to.equal(true);
				expect(
					fs.readFileSync(`${__dirname}/samples/dump.txt`).toString()
				).to.equal("Hello world!");
				rimraf.sync(`${__dirname}/samples/dump.txt`);
				ConsoleManager.recoverLog();
				expect(ConsoleManager.messages.length).to.not.equal(0);
				ConsoleManager.clearMessages();
				done();
			})
			.catch(function(error) {
				expect(true).to.equal(false);
			});
	});
	//
	//
	//
	it("can take an array of strings to transform commands", function(done) {
		const data = Taskero.transformCommands([
			"taskero",
			"run",
			"--name",
			"some:task",
			"--arg1",
			"something",
			"--arg2",
			"something else"
		]);
		expect(
			deepEqual(data, {
				type: "run",
				instance: {},
				run: [
					{
						name: "some:task",
						arg1: ["something"],
						arg2: ["something else"]
					}
				]
			})
		).to.equal(true);
		done();
	});
	//
	//
	//
	it("throws error when invalid parameters are passed to transformCommands", function(done) {
		try {
			Taskero.transformCommands(0);
		} catch (exc) {
			expect(exc.name).to.equal("Taskero:InvalidCommandsProvided");
			done();
		}
	});
	//
	//
	//
	it("can list the tasks and their descriptions", function(done) {
		ConsoleManager.clearMessages();
		ConsoleManager.saveLog(true);
		Taskero.execute(
			`taskero list "${__dirname}/taskero.file.js" "${__dirname}/taskero.file-2.js"`
		)
			.then(function() {
				//
				ConsoleManager.recoverLog();
				expect(ConsoleManager.messages.length).to.not.equal(0);
				expect(
					ConsoleManager.messages
						.join("")
						.indexOf("Simply prints 'Bye!' by console.")
				).not.to.equal(-1);
				ConsoleManager.clearMessages();
				done();
			})
			.catch(function(error) {
				console.log(error);
			});
	});
	//
	//
	//
	it("can show the help of the taskero command", function(done) {
		ConsoleManager.clearMessages();
		ConsoleManager.saveLog(true);
		Taskero.execute(`taskero help`)
			.then(function() {
				ConsoleManager.recoverLog();
				expect(ConsoleManager.messages.length).to.not.equal(0);
				ConsoleManager.clearMessages();
				done();
			})
			.catch(function(error) {
				console.log(error);
			});
	});
	//
	//
	//
	it("shows the help of the taskero command by default", function(done) {
		//
		expect(ConsoleManager.messages.length).to.equal(0);
		ConsoleManager.saveLog(true);
		console.log("Message 1");
		console.log("Message 2");
		console.log("Message 3");
		expect(ConsoleManager.messages.length).to.equal(3);
		ConsoleManager.recoverLog();
		ConsoleManager.clearMessages();
		expect(ConsoleManager.messages.length).to.equal(0);
		done();
	});
	////////////////////////////////////////////////////////////////
});
