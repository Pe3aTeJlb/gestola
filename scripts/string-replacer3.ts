import {readFile, writeFile} from 'fs';
const path = require('path');


readFile(path.resolve(__dirname, '../electron-app/lib/backend/main.js'), 'utf-8', function (err, contents) {
  if (err) {
    console.log(err);
    return;
  }

  // 👇️ match string case-insensitively 👇️
  var replaced = contents.replace(
    /const container = new Container\(\);/g,
    'const container = new Container(); exports.container = container; exports.__webpack_require__ = __webpack_require__'
  );

  replaced = replaced.replace(
    /module.exports = async \(port, host, argv\) => {/g,
    "module.exports.serverModule = async (port, host, argv) => {"
  );

  var replaced = replaced.replace(
    /const serverModule = __webpack_require__\(\/\*! \.\/server \*\/ "\.\/src-gen\/backend\/server\.js"\);/g,
    'const { serverModule } = __webpack_require__(/*! ./server */ "./src-gen/backend/server.js");'
  );

  writeFile(path.resolve(__dirname, '../electron-app/lib/backend/main.js'), replaced, 'utf-8', function (err) {
    console.log('replaces from', __filename);
    console.log(err);
  });
  
});