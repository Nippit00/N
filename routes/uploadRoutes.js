const express = require('express');

const uploadController = require('../controllers/uploadRoutes.js');

const isAuth = require('../middlewares/is-auth.js');
const router = express.Router();

router.post('/formsmart/:solutionID',isAuth, uploadController.uploadFile, uploadController.handleUpload);


module.exports = router;