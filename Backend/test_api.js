const http = require('http');

const payload = JSON.stringify({
    title: "Dual-Database Strategy..."
});

const options = {
    hostname: 'localhost',
    port: 4000,
    path: '/knowledge/604df2c589b275211ce2c74d/source/text/69ad091a16b5eb3d9459e4c9', // Need the right orgId!
    method: 'PATCH',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': payload.length
    }
};

// We don't have the Bearer token! We will get a 401 Unauthorized.
