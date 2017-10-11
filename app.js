const Koa = require('koa')
const csrf = require('koa-csrf')
const app = new Koa()
const fs    = require('fs')
const logger = require('koa-logger')
const koaBody = require('koa-body');
const views = require('koa-views');

const favicon = require('koa-favicon');
const mount = require('koa-mount');

// trust proxy
app.proxy = true

// log messages in console
app.use(logger())

/*
	Server Config
*/
// error handling
app.use(async (ctx, next) => {
    try {
      await next()
    } catch (err) {
      console.log("ERROR HANDLING")
      ctx.status = err.status || 500
      ctx.body = err.message
      ctx.app.emit('error', err, ctx)
    }
  })
// 404
app.use(async function(ctx, next) {
    await next();
    if (ctx.body || !ctx.idempotent) return;
    ctx.redirect('/404');
});


// MongoDB
require('./models');

// sessions
const convert = require('koa-convert')
const session = require('koa-generic-session')
const MongoStore = require('koa-generic-session-mongo')

app.keys = ['your-session-secret', 'another-session-secret']
// app.keys = [process.env.SECRET_KEY]
app.use(convert(session({
  store: new MongoStore(),
  cookie: {
    path: '/',
    httpOnly: false,
    maxAge: 24 * 60 * 60 * 1000,
    rewrite: true,
    signed: true
  },
})))

// body parser
// const bodyParser = require('koa-bodyparser')
// app.use(bodyParser())
// body parser
app.use(koaBody({ multipart: true }));

app.use(new csrf({
    invalidSessionSecretMessage: 'Invalid session secret',
    invalidSessionSecretStatusCode: 403,
    invalidTokenMessage: 'Invalid CSRF token',
    invalidTokenStatusCode: 403,
    excludedMethods: [ 'GET', 'HEAD', 'OPTIONS' ],
    disableQuery: false
}));

// authentication
require('./auth')
const passport = require('koa-passport')
app.use(passport.initialize())
app.use(passport.session())


// VIEWS
app.use(views(__dirname + '/views', { extension: 'pug' }))
// VALIDATION
require('koa-validate')(app);

const router = require('./routes')

app
.use(router.routes())
.use(router.allowedMethods())

// start server
const port = process.env.PORT || 3000
app.listen(port, () => console.log('Server listening on', port))

// favicon & static
app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(mount('/', require('koa-static')('public')));