const router = require('express').Router();

const { timeout } = require('./test_simulation.controller');

router.get('/timeout', timeout);

module.exports = router;
