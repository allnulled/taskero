const Taskero = require(__dirname + "/../src/taskero.js").Taskero;
const taskero = new Taskero();

taskero.register({
	name: "file:hello",
	onDone: function(done) {
		console.log("Hello!!");
		done();
	}
});

taskero.register({
	name: "file:bye",
	onDone: function(done) {
		console.log("Bye!!");
		done();
	}
});

taskero.register({
	name: "createFile",
	onDone: function(done) {
		require("fs").writeFileSync(__dirname + "/samples/file-created.txt", "okay", "utf8");
		done();
	}
})

module.exports = taskero;