'use strict';

const passport = require('koa-passport')

const User = require('./models/user.js')


// const hash = await bcrypt.hash(user.password, saltRounds)

User.findOne({ username: 'admin' }, function (err, testUser) {
  if (!testUser) {
    console.log('admin user did not exist; creating admin user...')
    testUser = new User({
      username: 'admin',
      password: 'test'
    })
    testUser.save()
  }
})

passport.serializeUser(function(user, done) {
  done(null, user._id)
})

passport.deserializeUser(function(id, done) {
  User.findById(id, done);
})

const LocalStrategy = require('passport-local').Strategy
passport.use(new LocalStrategy(function(username, password, done) {
  User.findOne({ username: username, password: password }, done);
}))
