import {readFile, writeFile} from 'fs';
const path = require('path');


readFile(path.resolve(__dirname, '../electron-app/lib/backend/main.js'), 'utf-8', function (err, contents) {
  if (err) {
    console.log(err);
    return;
  }

  // 👇️ match string case-insensitively 👇️
  var replaced = contents.replace(
    /var r = __webpack_require__\(".*"\)\(node.file\);/g,
    'var r = require(node.file);'
  );

  replaced = replaced.replace(
    /const pkg = __webpack_require__\(".*"\)\(packagefile\)/g,
    'const pkg = require(packagefile)'
  );

  writeFile(path.resolve(__dirname, '../electron-app/lib/backend/main.js'), replaced, 'utf-8', function (err) {
    console.log('replaces')
    console.log(err);
  });
  
});