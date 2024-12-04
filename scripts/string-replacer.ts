import {readFile, writeFile} from 'fs';
const path = require('path');


readFile(path.resolve(__dirname, '../electron-app/lib/backend/vendors-node_modules_node-red_runtime_lib_storage_localfilesystem_projects_git_node-red-ask-p-310281.js'), 'utf-8', function (err, contents) {
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

  replaced = replaced.replace(
    /fs.readdirSync\(__dirname \+ '\/grant'\).forEach\(function\(filename\) {/g,
    'fs.readdirSync("../node_modules/oauth2orize/lib" + "/grant").forEach(function(filename) {'
  );

  replaced = replaced.replace(
    /fs.readdirSync\(__dirname \+ '\/exchange'\).forEach\(function\(filename\) {/g,
    'fs.readdirSync("../node_modules/oauth2orize/lib" + "/exchange").forEach(function(filename) {'
  );

  writeFile(path.resolve(__dirname, '../electron-app/lib/backend/vendors-node_modules_node-red_runtime_lib_storage_localfilesystem_projects_git_node-red-ask-p-310281.js'), replaced, 'utf-8', function (err) {
    console.log('replaces')
    console.log(err);
  });
  
});