const vm = require('node:vm');
const fs = require('node:fs');
const assert = require('node:assert/strict');
const messages = [];
let timer;
class Anchor { click() { throw new Error('Native blob click was not intercepted'); } }
const sandbox = {
  window: {}, document: {addEventListener() {}}, HTMLAnchorElement: Anchor,
  URL: {createObjectURL() { return 'blob:test'; }, revokeObjectURL() {}},
  Uint8Array, Map, String, Error, Promise, JSON, setTimeout, clearTimeout,
  btoa: value => Buffer.from(value, 'binary').toString('base64'),
  alert: value => { throw new Error(value); },
  DoxaFiles: {postMessage(data) {
    const msg = JSON.parse(data); messages.push(msg);
    setImmediate(() => sandbox.DoxaFiles.onmessage({data:'ok'}));
    if (msg.action === 'end') {
      clearTimeout(timer);
      assert.equal(msg.name, 'backup.json');
      assert.equal(messages[0].size, 400000);
      const joined = Buffer.concat(messages.filter(m => m.action === 'chunk').map(m => Buffer.from(m.data, 'base64')));
      assert.equal(joined.length, 400000);
      assert.ok(joined.every(b => b === 65));
      console.log('Native file adapter: multi-chunk blob exported without byte changes.');
    }
  }}
};
sandbox.window = sandbox;
vm.runInNewContext(fs.readFileSync('app/src/main/assets/native-files.js', 'utf8'), sandbox);
const anchor = new Anchor(); anchor.href = sandbox.URL.createObjectURL(new Blob([Buffer.alloc(400000, 65)])); anchor.download = 'backup.json';
timer = setTimeout(() => { throw new Error('Export did not finish'); }, 5000);
anchor.click();
