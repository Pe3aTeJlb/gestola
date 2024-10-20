import {readFile, writeFile} from 'fs';
const path = require('path');
console.log(__dirname);
readFile(path.resolve(__dirname, '../packages/node-red-integration/dist/node-red-integration.js'), 'utf-8', function (err, contents) {
  if (err) {
    console.log(err);
    return;
  }

  // 👇️ match string case-insensitively 👇️
  var replaced = contents.replace(
  /version = __webpack_require__\("\.\.\/node_modules\/@node-red\/runtime\/lib sync recursive"\)\(path\.join\(__dirname,"\.\.","package\.json"\)\)\.version;/gi, 
  'version = "4.0.5";'
  );

  replaced = replaced.replace(
    /var r = __webpack_require__\("\.\.\/node_modules\/@node-red\/registry\/lib sync recursive"\)\(node.file\);/g,
    'var r = require(node.file);'
  );

  writeFile(path.resolve(__dirname, '../packages/node-red-integration/dist/node-red-integration.js'), replaced, 'utf-8', function (err) {
    console.log('replaces')
    console.log(err);
  });
});