const fs = require('fs');
const https = require('https');

const payload = fs.readFileSync('test_wa_payload.json', 'utf8');
const apiKey = '1082e6d8-9d6c-41ef-9a44-09c38ff6e075';

function send(urlStr) {
  const url = new URL(urlStr);
  const req = https.request(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'Content-Length': Buffer.byteLength(payload)
    }
  }, (res) => {
    let body = '';
    res.on('data', chunk => body += chunk);
    res.on('end', () => {
      console.log('URL:', urlStr);
      console.log('Status:', res.statusCode);
      console.log('Body:', body);
    });
  });

  req.on('error', err => console.error('Error for', urlStr, err.message));
  req.write(payload);
  req.end();
}

console.log('--- Testing Primary Gateway ---');
send('https://wa.transmaxsolutions.com/api/send-message');

console.log('--- Testing Backup Railway Gateway ---');
send('https://primary-production-4ff5.up.railway.app/webhook/send-message');
