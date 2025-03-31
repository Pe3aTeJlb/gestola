import {readFile, writeFile} from 'fs';
const path = require('path');


readFile(path.resolve(__dirname, '../electron-app/src-gen/backend/server.js'), 'utf-8', function (err, contents) {
  if (err) {
    console.log(err);
    return;
  }

  // 👇️ match string case-insensitively 👇️
  var replaced = contents.replace(
    /const container = new Container\(\);/g,
    'const container = new Container(); exports.container = container;'
  );

  replaced = replaced.replace(
    /module.exports = async \(port, host, argv\) => {/g,
    "module.exports.serverModule = async (port, host, argv) => {"
  );

  writeFile(path.resolve(__dirname, '../electron-app/src-gen/backend/server.js'), replaced, 'utf-8', function (err) {
    console.log('replaces')
    console.log(err);
  });
  
});

readFile(path.resolve(__dirname, '../electron-app/src-gen/backend/main.js'), 'utf-8', function (err, contents) {
  if (err) {
    console.log(err);
    return;
  }

  // 👇️ match string case-insensitively 👇️
  var replaced = contents.replace(
    /const serverModule = require\('.\/server'\);/g,
    'const { serverModule } = require("./server");'
  );

  writeFile(path.resolve(__dirname, '../electron-app/src-gen/backend/main.js'), replaced, 'utf-8', function (err) {
    console.log('replaces from', __filename);
    console.log(err);
  });
  
});