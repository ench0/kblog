'use strict';

const Router = require('koa-router');
const router = new Router();

const posts = require('../controllers/post_controller');

router
.get('index', '/', posts.index)

.get('new', '/new', posts.new)
.post('/new', posts.create)

.get('edit', '/:slug/edit', posts.edit)
.post('/:slug/edit', posts.update)
.get('index', '/index', posts.redirect)
.get('view', '/:slug', posts.view)
.post('/:id', posts.delete)

module.exports = router;
