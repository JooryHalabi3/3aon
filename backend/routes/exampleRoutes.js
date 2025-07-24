const express = require('express');
const router = express.Router();
const exampleController = require('../controllers/exampleController');

router.get('/welcome', exampleController.getWelcome);

module.exports = router;
