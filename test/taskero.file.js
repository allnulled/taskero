const Taskero = require(__dirname + "/../src/taskero.js").Taskero;
const taskero = new Taskero();
const fs = require("fs-extra");

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
    fs.outputFileSync(__dirname + "/samples/file-created.txt", "okay", "utf8");
    done();
  }
});

taskero.register({
  name: "dumpJson",
  onDone: function(done, files, args) {
    fs.outputFileSync(__dirname + "/samples/" + args.output, JSON.stringify(args, null, 4), "utf8");
    done();
  }
});

module.exports = taskero;