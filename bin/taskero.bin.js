#!/usr/bin/env node

require(__dirname + "/../src/taskero.js")
	.Taskero.execute()
	.then(function() {
		console.log("[taskero-cli] Successfully executed. Finished.");
	})
	.catch(function(error) {
		console.log("[taskero-cli] Error thrown:", error);
	});
