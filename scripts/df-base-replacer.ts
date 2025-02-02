import {readFile, writeFile} from 'fs';
const path = require('path');

/* Отвечает за правку упакованного node-red */

//readFile(path.resolve(__dirname, '../packages/node-red-integration/dist/node-red-integration.js'), 'utf-8', function (err, contents) {
readFile(path.resolve(__dirname, '../packages/gestola-nodes/base-node/lib/index.js'), 'utf-8', function (err, contents) {
  if (err) {
    console.log(err);
    return;
  }

  // 👇️ match string case-insensitively 👇️
  var replaced = contents.replace(
  /const \{ container, __webpack_require__ \} = require\("\.\.\/\.\.\/\.\.\/\.\.\/electron-app\/lib\/backend\/main"\);/gi, 
  'const { container, __webpack_require__ } = require("../../../../lib/backend/main");'
  );

  writeFile(path.resolve(__dirname, '../packages/gestola-nodes/base-node/lib/index.js'), replaced, 'utf-8', function (err) {
    console.log('replaces')
    console.log(err);
  });
  
});