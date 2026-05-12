const { Router } = require('express');
const { registerPunch } = require('../controllers/punchController');
const { pointLimiter } = require('../middlewares/rateLimiters');
const { baterPontoValidator } = require('../middlewares/validators');

const router = Router();

router.post('/bater', pointLimiter, baterPontoValidator, registerPunch);

module.exports = router;
