const Taskero = require("../src/taskero.js").Taskero;
const taskero = new Taskero({ debug: false });
const compileJSXFunction = function(i) {
  return i;
};
const fs = require("fs");

taskero.register({
  name: "jsx:compile",
  onEach: [
    function(done, file, args) {
      done(compileJSXFunction(file.contents));
    },
    function(done, file, args) {
      fs.writeFileSync(file.path + args.filesAppendix, file.contents, "utf8");
      done();
    }
  ],
  onDone: [
    function(done, files, args) {
      console.log(
        "[taskero:jsx:compile] Compilation finished for: " +
          JSON.stringify(files, null, 3)
      );
      done();
    }
  ],
  files: "**/**.jsx"
});

taskero.register({
  name: "say:ok",
  onDone: function() {
    console.log("OK!");
  }
});

taskero
  .run([
    {
      name: "jsx:compile",
      filesAppendix: ".compiled.js"
    },
    {
      name: "say:ok"
    }
  ])
  .then(function() {
    console.log("Task finished.");
  })
  .catch(function() {
    //
  });
