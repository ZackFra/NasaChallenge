const express = require('express');
const app = express();
const PORT = 5000;
const home = require('./routes');

app.use('/', home);

app.listen(PORT, () => {
    console.log(`Express server is listening on port ${PORT}`);
})