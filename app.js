'use strict';

const Koa = require('koa')
const csrf = require('koa-csrf')
const app = new Koa()
const fs    = require('fs')
const logger = require('koa-logger')
const koaBody = require('koa-body');
const views = require('koa-views');
// import test from 'ava';

const favicon = require('koa-favicon');
const mount = require('koa-mount');

// trust proxy
app.proxy = true

// log messages in console
app.use(logger())

async function responseTime(ctx, next) {
    if (ctx.hostname == "127.0.0.1" || ctx.hostname == "localhost")
    ctx.state.envlocal = true;
    ctx.state.start = Date.now();
    const start = Date.now();
    await next();
    const ms = Date.now() - start;
    ctx.set('X-Response-Time', `${ms}ms`);
    // console.log(`${ctx.method} ${ctx.url} - ${ms}ms`);
    ctx.state.ms = ms
}
app.use(responseTime);


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

app.keys = ['super-secret', 'another-super-session-secret']
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

// favicon before routes
app.use(favicon(__dirname + '/public/favicon.ico'));

const router = require('./routes')

app
.use(router.routes())
.use(router.allowedMethods())

// start server
const port = process.env.PORT || 3000
app.listen(port, () => console.log('Server listening on', port))

console.log(__dirname + '/public/favicon.ico')
// static
app.use(mount('/', require('koa-static')('public')));