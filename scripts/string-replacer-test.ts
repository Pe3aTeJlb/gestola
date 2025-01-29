import {readFile, writeFile} from 'fs';
const path = require('path');


//readFile(path.resolve(__dirname, '../packages/node-red-integration/dist/node-red-integration.js'), 'utf-8', function (err, contents) {
readFile(path.resolve(__dirname, '../electron-app/lib/backend/vendors-node_modules_node-red_runtime_lib_storage_localfilesystem_projects_git_node-red-ask-p-a48654.js'), 'utf-8', function (err, contents) {
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
/*
  replaced = replaced.replace(
    /var catalogPath = path\.resolve\(path\.join\(path\.dirname\(\/\*require\.resolve\*\/\(\/\*\! @node-red\/editor-client \*\/ "..\/node_modules\/@node-red\/editor-client\/index.js"\)\),"locales"\)\);/g,
    'var catalogPath = path.resolve(path.join(path.dirname(path.resolve(__dirname, "../../../node_modules/@node-red/editor-client/index.js")),"locales")); console.log("kek lol", catalogPath);'
  );

*/

replaced = replaced.replace(
  /return i18n\.registerMessageCatalog\("runtime",path\.resolve\(path.join\(__dirname,"\.\.","locales"\)\),"runtime\.json"\)/g,
  'return i18n.registerMessageCatalog("runtime", path.resolve(path.join(path.dirname(path.resolve(__dirname, "../../../node_modules/@node-red/runtime/index.js")),"locales")),"runtime.json")'
);

replaced = replaced.replace(
  /const \{log,i18n,events,exec,util,hooks\} = __webpack_require__\(\/\*\! @node-red\/util \*\/ "..\/node_modules\/@node-red\/util\/index.js"\);/g,
  'const {log,i18n,events,exec,util,hooks} = __webpack_require__(/*! @node-red/util */ "../node_modules/@node-red/util/index.js");'
);

  replaced = replaced.replace(
    /fs\.readdirSync\(__dirname \+ '\/grant'\)\.forEach\(function\(filename\) {/g,
    "fs.readdirSync(path.resolve(__dirname, '../../../node_modules/oauth2orize/lib/grant')).forEach(function(filename) {"
  );

  replaced = replaced.replace(
    /fs\.readdirSync\(__dirname \+ '\/exchange'\)\.forEach\(function\(filename\) {/g,
    "fs.readdirSync(path.resolve(__dirname, '../../../node_modules/oauth2orize/lib/exchange')).forEach(function(filename) {"
  );

  replaced = replaced.replace(
    /log\.warn\("\["\+nodeErrors\[i\]\.id\+"\] "\+nodeErrors\[i\]\.err\);/g,
    'log.warn("["+nodeErrors[i].id+"] "+nodeErrors[i].err+" " + JSON.stringify(nodeErrors[i]));'
  );

  writeFile(path.resolve(__dirname, '../electron-app/lib/backend/vendors-node_modules_node-red_runtime_lib_storage_localfilesystem_projects_git_node-red-ask-p-a48654.js'), replaced, 'utf-8', function (err) {
    console.log('replaces')
    console.log(err);
  });
  
});