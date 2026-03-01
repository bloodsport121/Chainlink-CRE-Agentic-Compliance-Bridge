const express = require('express');
const app = express();

app.get('/investor-status', (req, res) => {
    const credential = req.query.credential;
    if (credential && credential.trim() !== '') {
        // userId: 0xMockId, balance: 200 ETH, jurisdiction: 840 (USA)
        res.json({ qualified: true, userId: '0xMockId', balance: 200, jurisdiction: 840 });
    } else {
        res.status(400).json({ qualified: false });
    }
});

app.listen(3004, () => console.log('Mock bank on port 3004'));
