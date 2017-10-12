const Router = require('koa-router');
const router = new Router();

const pages = require('../controllers/page_controller');
const update = require('../controllers/update');

router
.get('index', '/', pages.index)

.get('new', '/new', pages.new)
.post('/new', pages.create)

.get('edit', '/:slug/edit', pages.edit)
.post('/:slug/edit', pages.update)
.get('index', '/index', pages.redirect)
.get('update', '/auth/update', update.github)
.get('reload', '/auth/reload', update.reload)
.get('view', '/:slug', pages.view)
.post('/:id', pages.delete)

module.exports = router;
