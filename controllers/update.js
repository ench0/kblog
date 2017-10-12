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

    const git = await shell.exec('git pull')
    const update = await shell.exec('pm2 reload ensar-blog');

    await delay(3000)

    console.log("git", git)
    console.log("update", update)
    
    return ctx.render("pages/update", {
        title: "Update",
        git: git,
        update: [update.stdout, update.stderr]
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