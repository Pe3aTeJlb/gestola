import {readFile, writeFile} from 'fs';
const path = require('path');


readFile(path.resolve(__dirname, '../packages/node-red-integration/dist/node-red-integration.js'), 'utf-8', function (err, contents) {
  if (err) {
    console.log(err);
    return;
  }

  // 👇️ match string case-insensitively 👇️
  var replaced = contents.replace(
  /version = __webpack_require__\(".*"\)\(path\.join\(__dirname,"\.\.","package\.json"\)\)\.version;/gi, 
  'version = "4.0.5";'
  );

  replaced = replaced.replace(
    /var r = __webpack_require__\(".*"\)\(node.file\);/g,
    'var r = require(node.file);'
  );

  replaced = replaced.replace(
    /const pkg = __webpack_require__\(".*"\)\(packagefile\)/g,
    'const pkg = require(packagefile)'
  );

  writeFile(path.resolve(__dirname, '../packages/node-red-integration/dist/node-red-integration.js'), replaced, 'utf-8', function (err) {
    console.log('replaces')
    console.log(err);
  });
  
});