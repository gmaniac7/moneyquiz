const spawn = require('child_process').spawn;

const child = spawn(process.argv[0], ['build/server/main.js'], {
  detached: true,
  stdio: 'ignore'
});
console.log(child);
child.unref();
