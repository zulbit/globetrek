const jsdom = require('jsdom');
const dom = new jsdom.JSDOM('<div id="safepay-button-container"></div>', { runScripts: 'dangerously' });
const code = require('fs').readFileSync('node_modules/@sfpy/checkout-components/dist/sfpy-checkout.js', 'utf8');
dom.window.eval(code);
console.log('Safepay exports:', Object.keys(dom.window.safepay || {}));
