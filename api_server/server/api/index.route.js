
const express = require('express');
const cameraRoutes = require('./camera/camera.route');

const router = express.Router();

router.use('/camera', cameraRoutes);

module.exports = router;
