const { expect, assert } = require("chai");
const Taskero = require(__dirname + "/../src/taskero.js").Taskero;
const deepEqual = require("deep-equal");
const rimraf = require("rimraf");
const { FunctionWrapper, ConsoleManager } = require("function-wrapper");
const fs = require("fs-extra");
const exec = require("execute-command-sync");

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
				ConsoleManager.recoverLog();
				console.log(error);
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
				ConsoleManager.recoverLog();
				console.log(error);
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
				ConsoleManager.recoverLog();
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
				ConsoleManager.recoverLog();
				console.log(error);
			});
	});
	//
	//
	//
	it.only("can customize parameters", function(done) {
		ConsoleManager.clearMessages();
		ConsoleManager.saveLog(false);
		Taskero.execute(
			`taskero run

		--debug 

		--files test/taskero.file.js test/taskero.file-2.js 

		--name dumpJson
		  --output my-dumped-json-1.json
		  --arg1 [ :string:Hello :string:World ]
		  --arg2 { @word1 :string:Hello @word2 :string:World }
		  --arg3 :number:100.50
		  --arg4 :boolean:true
		  --arg5 :eval:console.log(__dirname)
		  --arg6 [ [ [ :string:one ] :string:two ] :string:three ]

		--name dumpJson
			--output my-dumped-json-2.json
		  --abbr1 [ :s:Hello :s:World ]
		  --abbr2 { @word1 :s:Hello  :s:World }
		  --abbr3 :n:-100.50
		  --abbr4 :b:false
		  --abbr5 :v:console.log(__dirname)
		  --abbr6 [ [ [ :s:one ] :s:two ] :s:three ]
		  `
		)
			.then(function() {
				ConsoleManager.recoverLog();
				expect(ConsoleManager.messages.length).to.not.equal(0);
				const dumpedJsonFile =
					__dirname + "/../test/samples/my-dumped-json-1.json";
				const dumpedJsonFile2 =
					__dirname + "/../test/samples/my-dumped-json-2.json";
				expect(fs.existsSync(dumpedJsonFile)).to.equal(true);
				expect(fs.existsSync(dumpedJsonFile2)).to.equal(true);
				const data1 = JSON.parse(fs.readFileSync(dumpedJsonFile).toString());
				//console.log(data1);
				console.log();
				const data2 = JSON.parse(fs.readFileSync(dumpedJsonFile2).toString());
				//console.log(data2);
				ConsoleManager.clearMessages();
				done();
			})
			.catch(function(error) {
				ConsoleManager.recoverLog();
				console.log("ERROR!", error);
			});
	});
	//
	//
	//
	it("", function(done) {
		//
		done();
	});
	////////////////////////////////////////////////////////////////
});
