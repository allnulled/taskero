const Taskero = require(__dirname + "/../src/taskero.js").Taskero;
const taskero = new Taskero();

taskero.register({
	name: "file:2:hello",
	onDone: function(done) {
		console.log("Hello!");
		done();
	},
	metadata: {
		description: `Simply prints 'Hello!' by console.
This is only for demonstration purposes.
This is a quite useless task.`
	}
});

taskero.register({
	name: "file:2:bye",
	onDone: function(done) {
		console.log("Bye!");
		done();
	},
	metadata: {
		description: `Simply prints 'Bye!' by console.
This is only for demonstration purposes.
This is a quite useless task.`
	}
});

taskero.register({
	name: "file:2:dump",
	onDone: function(done, files, args) {
		require("fs").writeFileSync(args.dumpFile, args.dumpContents, "utf8");
		done();
	},
	metadata: {
		description: `Dumps some specified text to a specified file.
This is only for demonstration purposes.
This is a quite useless task.`
	}
});

module.exports = taskero;
