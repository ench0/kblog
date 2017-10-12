const shell = require('shelljs')
const path = require('path')

const cd = "cd " + path.join(__dirname, "../")

const delay = require('await-delay')

const checkLogin = async (ctx, next) => {
    if (ctx.isAuthenticated()) return
    else { 
        ctx.session.messages = {danger: ["You are not authorised!"]}
        ctx.redirect('/');
    }
}

exports.github = async (ctx) => {
    
    checkLogin(ctx)
    console.log("logged in")
    shell.exec(cd)
    
    const git = shell.exec('git pull')

    return ctx.render("pages/update", {
        title: "Update",
        messages: [git.stdout, git.stderr]
    });
}

exports.reload = async (ctx) => {
    
    checkLogin(ctx)
    
    shell.exec(cd);
    const reloadpm2 = shell.exec('pm2 reload ensar-blog');
    
    return ctx.render("pages/update", {
        title: "Reload",
        messages: [reloadpm2.stdout, reloadpm2.stderr]
    });
}