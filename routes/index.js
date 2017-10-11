const Router = require('koa-router');
const router = new Router();

// ROUTES
const posts = require('./post_route');
const tags = require('./tag_route');
const auth = require('./auth_route');
const pages = require('./page_route');


router.use('/auth', auth.routes());
router.use('/posts', posts.routes());
router.use('/tags', tags.routes());

// 404
const fs    = require('fs')

router
.get('/404', function(ctx) {
        ctx.type = 'html'
        ctx.status = 404
           
        ctx.body = fs.createReadStream('views/404.html')
})

router.use('', pages.routes());

module.exports = router;
