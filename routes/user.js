const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController')
const checkAuth = require('../middlewares/checkAuth')
const checkDateAndTime = require('../middlewares/checkDateAndTime')

// Authentication functions
router.post('/signup', userController.signup)
router.post('/login', userController.login)

// Cleaning functions
router.post('/schedule/clean', checkAuth, checkDateAndTime, userController.scheduleCleaning)
router.post('/schedule/cleanings', checkAuth, userController.scheduleCleanings)
router.patch('/schedule/update', checkAuth, checkDateAndTime, userController.updateCleaningSchedule)

module.exports = router;