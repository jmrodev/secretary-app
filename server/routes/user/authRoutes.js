const express = require('express');
const router = express.Router();
const authController = require('../../controllers/user/authController');
const { verifyToken } = require('../../middleware/authMiddleware');
const { authorizeCanManageUsers } = require('../../middleware/authorize');
const validate = require('../../middleware/validationMiddleware');
const schemas = require('../../validators/userSchemas');

router.post('/register', verifyToken, authorizeCanManageUsers, validate(schemas.register), authController.register);
router.post('/public-register', validate(schemas.publicRegister), authController.publicRegister);
router.post('/login', validate(schemas.login), authController.login);
router.get('/verify', verifyToken, authController.verify);

module.exports = router;


