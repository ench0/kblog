const Router = require('koa-router');
const router = new Router();

// routes
const fs    = require('fs')
const passport = require('koa-passport')

// const route = require('koa-route')

router
.get('/', function(ctx) {
    console.log("authed!")  
    console.log(ctx.isAuthenticated()) 
//   ctx.type = 'html'
    if (ctx.isAuthenticated()) ctx.session.messages = {success: ["You are logged in!"]}
    

    console.log(ctx.request.path, ctx.request.href, ctx.request.url, ctx.request.host, ctx.request.hostname, ctx.request.ip, ctx.request.ips, ctx.request.origin, ctx.request.originalUrl, ctx.request.header)
    
    
    // console.log(ctx.router.url('view',slug))
    // console.log(ctx.router.stack.map(i => i.path));
    // console.log(ctx.router.path);


    const messages = ctx.session.messages || [];
    delete ctx.session.messages;
//   var body = fs.readFileSync('views/login.html', 'utf8')
//   ctx.body = body.replace('{csrfToken}', ctx.csrf)
    ctx.status = 200
    ctx.state.pagetype = "auth"

    return ctx.render("auth/index", {
        title: 'Login area',
        messages: messages,
        csrfToken: ctx.csrf,
        auth: ctx.isAuthenticated()
    });
})
.post('/custom', function(ctx, next) {
  return passport.authenticate('local', function(user, info, status) {
    if (user === false) {        
      ctx.status = 401
      ctx.body = { success: false }
    } else {
      ctx.body = { success: true }      
      return ctx.login(user)
    }
  })(ctx, next)
})

// POST /login
.post('/login', function(ctx, next) {
    const result = passport.authenticate('local', {
        // successRedirect: '/auth/app',
        successRedirect: '/auth',
        failureRedirect: '/auth'
    })(ctx, next)

    ctx.session.messages = {danger: ["Logging in failed!"]}

    return result
    }
)

.get('/logout', function(ctx) {
  ctx.logout()
  ctx.status = 204
  ctx.session.messages = {success: ["You are logged out!"]}
  ctx.redirect('/auth')
})


.get('/app', function(ctx) {
    console.log("authed!")  
    console.log(ctx.isAuthenticated())  
    if (ctx.isAuthenticated()) {
        ctx.type = 'html'
        ctx.body = fs.createReadStream('views/app.html')
    }
    else ctx.redirect('/auth')
})

module.exports = router;


