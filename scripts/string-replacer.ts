import {readFile, writeFile} from 'fs';
const path = require('path');


readFile(path.resolve(__dirname, '../packages/node-red-integration/dist/node-red-integration.js'), 'utf-8', function (err, contents) {
  if (err) {
    console.log(err);
    return;
  }

  const mode = process.argv[2];

  // 👇️ match string case-insensitively 👇️
  var replaced = contents.replace(
  /version = __webpack_require__\("\.\.\/node_modules\/@node-red\/runtime\/lib sync recursive"\)\(path\.join\(__dirname,"\.\.","package\.json"\)\)\.version;/gi, 
  'version = "4.0.5";'
  );

  replaced = replaced.replace(
    /var r = __webpack_require__\("\.\.\/node_modules\/@node-red\/registry\/lib sync recursive"\)\(node.file\);/g,
    'var r = require(node.file);'
  );

  if(mode === "prod"){
console.log('keks');
    replaced = replaced.replace(
      /fs\.readdirSync\(__dirname \+ '\/grant'\)\.forEach\(function\(filename\) {/g,
      'fs.readdirSync(path.resolve(__dirname, "../node_modules/oauth2orize/lib/grant")).forEach(function(filename) {'
    );

    replaced = replaced.replace(
      /fs\.readdirSync\(__dirname \+ '\/exchange'\)\.forEach\(function\(filename\) {/g,
      'fs.readdirSync(path.resolve(__dirname, "../node_modules/oauth2orize/lib/exchange")).forEach(function(filename) {'
    );

    replaced = replaced.replace(
      /var editorClientDir = path\.dirname\(\/\*require\.resolve\*\/\(\/\*! @node-red\/editor-client \*\/ "\.\.\/node_modules\/@node-red\/editor-client\/index\.js"\)\);/g,
      'var editorClientDir = path.dirname(/*require.resolve*/(/*! @node-red/editor-client */ path.resolve(__dirname,"../node_modules/@node-red/editor-client/index.js")));'
    );

    replaced = replaced.replace(
      /userSettings\.coreNodesDir = path\.dirname\(\/\*require\.resolve\*\/\(\/\*! @node-red\/nodes \*\/ "\.\.\/node_modules\/@node-red\/nodes\/index\.js"\)\)/g,
      'userSettings.coreNodesDir = path.dirname(/*require.resolve*/(/*! @node-red/nodes */ path.resolve(__dirname, "../node_modules/@node-red/nodes/index.js")))'
    );

  }

  writeFile(path.resolve(__dirname, '../packages/node-red-integration/dist/node-red-integration.js'), replaced, 'utf-8', function (err) {
    console.log('replaces')
    console.log(err);
  });
  
});