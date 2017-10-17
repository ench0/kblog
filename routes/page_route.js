const Router = require('koa-router');
const router = new Router();

const pages = require('../controllers/page_controller');

router
.get('index', '/', pages.index)

.get('new', '/new', pages.new)
.post('/new', pages.create)

.get('edit', '/:slug/edit', pages.edit)
.post('/:slug/edit', pages.update)
.get('index', '/index', pages.redirect)
.get('view', '/:slug', pages.view)
.post('/:id', pages.delete)

module.exports = router;
