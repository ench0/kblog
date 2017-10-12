const shell = require('shelljs')
const path = require('path')

const cd = "cd " + path.join(__dirname, "../")

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
    const message = shell.exec('git pull')
    await shell.exec('pm2 reload ensar-blog');

    return ctx.render("pages/update", {
        title: "Update",
        message: message
    });
}

exports.reboot = async (ctx) => {
    
    checkLogin(ctx)
    
    shell.exec(cd);
    const message = shell.exec('sudo reboot')

    return ctx.render("pages/reboot", {
        title: "Reboot",
        message: message
    });
}