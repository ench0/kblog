'use strict';

const Router = require('koa-router');
const router = new Router();

const tags = require('../controllers/tag_controller');

router
.get('index', '/', tags.index)
.get('view', '/:tag', tags.view)

module.exports = router;
