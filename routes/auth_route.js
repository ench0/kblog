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
    

    const messages = ctx.session.messages || [];
    delete ctx.session.messages;
//   var body = fs.readFileSync('views/login.html', 'utf8')
//   ctx.body = body.replace('{csrfToken}', ctx.csrf)
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


