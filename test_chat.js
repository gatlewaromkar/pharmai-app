const http = require('http');

const data = JSON.stringify({
    message: "Bhau Metformin ahe ka?",
    context: [{ name: "Metformin", qty: 45, price: 10, expiry: "2025-10-10" }]
});

const options = {
    hostname: 'localhost',
    port: 3001,
    path: '/api/chat',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
    }
};

const req = http.request(options, (res) => {
    let body = '';
    res.on('data', (chunk) => body += chunk);
    res.on('end', () => {
        console.log("Status:", res.statusCode);
        console.log("Response:", body);
    });
});

req.on('error', (e) => {
    console.error(`Problem with request: ${e.message}`);
});

req.write(data);
req.end();
