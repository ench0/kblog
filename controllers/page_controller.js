const Page = require('../models/page')

const S = require('string');

var md = require('markdown-it')();
const helpers = require('./helpers');

const reading_time = helpers.reading_time
const time_stamp = helpers.time_stamp
const files_upload  = helpers.files_upload
const files_delete = helpers.files_delete
const files_move = helpers.files_move

const checkLogin = async (ctx, next) => {
    if (ctx.isAuthenticated()) return
    else { 
        ctx.session.messages = {danger: ["You are not authorised!"]}
        ctx.redirect('/');
    }
}

// INDEX
exports.index = async (ctx) => {
    ctx.state.dateFormat = require('dateformat');
    
    const messages = ctx.session.messages || []; // get any messages saved in the session
    delete ctx.session.messages; // delete the messages as they've been delivered

    const index = await Page.findOne({ slug: "index" })
    if (index) {var data = index; var body = md.render(data.body);}
    else {var data = []; var body = []}

	const pages = await Page.find({}).sort('-created')
	if (!pages) {
		throw new Error("There was an error retrieving your pages.")
	} else {
        ctx.status = 200
        ctx.state.pagetype = "page"
        ctx.state.envvar = process.env.NODE_ENV 
        
        await ctx.render("pages/index", {
            title: data.title || 'List of Pages',
            pages: pages,
            messages: messages,
            path: "/",
            auth: ctx.isAuthenticated(),
            csrfToken: ctx.csrf,
            page: data,
            body: body,
            ms: Date.now() - ctx.state.start            
        });
	}
}

// NEW
exports.new = async (ctx) => {

    const auth =  ctx.isAuthenticated()    
    if (!auth) {ctx.session.messages = {danger: ["You are not authorised!"]}; ctx.redirect('/');}
    else {
    ctx.params._csrf = ctx.csrf;
    
    const messages = ctx.session.messages || []; // get any messages saved in the session
    delete ctx.session.messages; // delete the messages as they've been delivered
    var page = []
    
    ctx.status = 200
    ctx.state.pagetype = "page"
    ctx.state.envvar = process.env.NODE_ENV 
    
    return ctx.render("pages/new", {
        title: 'New page',
        path: "/",
        page: page,
        csrfToken: ctx.csrf,
        messages: messages,
        ms: Date.now() - ctx.state.start        
    });
}
}

// CREATE
exports.create = async (ctx) => {
    const auth =  ctx.isAuthenticated()    
    if (!auth) {ctx.session.messages = {danger: ["You are not authorised!"]}; ctx.redirect('/');}
    else {
    
    ctx.params._csrf = ctx.csrf;

    const data = ctx.request.body.fields
    if (ctx.request.body.files.images.length > 1) {
        var files = ctx.request.body.files.images
    }
    else if (ctx.request.body.files.images.name == '') var files = []
    else var files = [ctx.request.body.files.images]
        
    try {

        if (data.replace) var clear = true; else var clear = false
        if (data.resized) var resized = true; else var resized = false
        
        const images = files_upload(data.slug, "pages", files, clear, resized)

        const update = {title: data.title, slug: data.slug, body: data.body, active: data.active, abstract: data.abstract, images: images, headline: data.headline}

        const result = await Page.create(update)

        if (result) {
            ctx.session.messages = {success: ["Page created successfuly!"]}

            return await ctx.redirect('/'+result.slug);
        }

    } catch(err) {
        console.log("CATCHED CREATE ERR!")
        var messages = {danger: []}
        console.log(err)

        if (err.name === 'MongoError' && err.code === 11000) messages.danger.push("Duplicate entry -  "+S(err.message).between('dup key: { : ', '}').s)


        for (let value in err.errors) {
            messages.danger.push(err.errors[value].message)
        } 

        ctx.session.messages = messages
        delete ctx.session.messages; // delete the messages as they've been delivered
        
        // ctx.status = 102
        ctx.state.pagetype = "page"
        ctx.state.envvar = process.env.NODE_ENV 
        
        await ctx.render("pages/edit", {
            title: 'Edit page',
            csrfToken: data._csrf,
            page: data,
            messages: messages,                
            ms: Date.now() - ctx.state.start                
        });
    }
    }
}

// VIEW
exports.view = async (ctx) => {
    const slug = ctx.params.slug;
    const page = await Page.findOne({ slug: slug })

	if (!page) {
        return ctx.redirect('/404');        
		throw new Error("There was an error retrieving your tasks.")
	} else {
        const timestamp = time_stamp(page.created)
        const readtime = reading_time(page.body)
        
        const messages = ctx.session.messages || []; // get any messages saved in the session    
        delete ctx.session.messages; // delete the messages as they've been delivered

        ctx.status = 200
        ctx.state.pagetype = "page"
        ctx.state.envvar = process.env.NODE_ENV 
        
        return ctx.render("pages/view", {
            title: page.title,
            valerrors: ctx.errors,
            page: page,
            body: md.render(page.body),
            timestamp: timestamp,
            messages: messages,
            path: "/",
            readtime: readtime,
            csrfToken: ctx.csrf,
            auth: ctx.isAuthenticated(),
            ms: Date.now() - ctx.state.start            
        });
	}
}

// EDIT
exports.edit = async (ctx) => {

    const auth =  ctx.isAuthenticated()    
    if (!auth) {ctx.session.messages = {danger: ["You are not authorised!"]}; ctx.redirect('/');}
    else {

    const csrfToken = ctx.csrf; 
    const messages = []
    
    console.log(ctx.isAuthenticated())
    const slug = ctx.params.slug;
	const page = await Page.findOne({ slug: slug })
	if (!page) {
		throw new Error("There was an error retrieving your tasks.")
	} else {
        ctx.status = 200
        ctx.state.pagetype = "page"
        ctx.body = ctx.csrf
        ctx.state.envvar = process.env.NODE_ENV 
        
        return ctx.render("pages/edit", {
            title: page.title,
            csrfToken: ctx.csrf,
            valerrors: ctx.errors,
            page: page,
            path: "/",
            csrfToken: ctx.csrf,
            messages: messages,
            ms: Date.now() - ctx.state.start            
        });
    }
    }
}

// UPDATE
exports.update = async (ctx) => {

    const auth =  ctx.isAuthenticated()    
    if (!auth) {ctx.session.messages = {danger: ["You are not authorised!"]}; ctx.redirect('/');}
    else {

    const data = ctx.request.body.fields
    if (ctx.request.body.files.images.length > 1) {
        var files = ctx.request.body.files.images
    }
    else if (ctx.request.body.files.images.name == '') var files = []
    else var files = [ctx.request.body.files.images]

    try {
        console.log("old:",ctx.params.slug,"new:",data.slug)
        
        await files_move(ctx.params.slug,data.slug, "pages")
        

        if (data.replace) var clear = true; else var clear = false
        if (data.resized) var resized = true; else var resized = false
        
        const images = await files_upload(data.slug, "pages", files, clear, resized)

        const searchById = {_id: data._id}
        const update = {title: data.title, slug: data.slug, body: data.body, active: data.active, abstract: data.abstract, headline: data.headline, updated: Date.now()}
                    
        if (!data.replace) {
            var push = { $set: update, $push: { images: {$each: images}}}
        }
        else {
            console.log("else!")
            var push = { $set: update, images: images }
        }

        const result = 
        await Page.findOneAndUpdate(
            searchById,
            push,
            {safe: true, upsert: true, new : true}
        );
        
        if (result) {                
            ctx.session.messages = {success: ["Page updated successfuly!"]}
            await ctx.redirect('/'+result.slug);
        }

    } catch(err) {
        console.log("CATCHED UPDATE ERR!")
        var messages = {danger: []}
        // console.log(err)

        if (err.name === 'MongoError' && err.code === 11000) messages.danger.push("Duplicate entry -  "+S(err.message).between('dup key: { : ', '}').s)


        for (let value in err.errors) {
            messages.danger.push(err.errors[value].message)
        } 

        ctx.session.messages = messages
        delete ctx.session.messages; // delete the messages as they've been delivered
        
        // ctx.status = 102
        ctx.state.pagetype = "page"
        ctx.state.envvar = process.env.NODE_ENV 
        
        await ctx.render("pages/edit", {
            title: 'Edit page',
            page: data,
            csrfToken: ctx.csrf,
            messages: messages,                
            ms: Date.now() - ctx.state.start                
        });
    }
    }
}

// DELETE
exports.delete = async (ctx) => {
    const auth =  ctx.isAuthenticated()    
    if (!auth) {ctx.session.messages = {danger: ["You are not authorised!"]}; ctx.redirect('/');}
    else {
    
    const slug = ctx.request.body.slug
    const csrfToken = ctx.params._csrf;
	const result = await Page.findOneAndRemove({_id: ctx.request.body._id})
	if (!result) {
		throw new Error('Task failed to delete.')
	} else {
        ctx.status = 200
        files_delete(slug, "pages")
        ctx.session.messages = {success: ["Page deleted successfuly!"]}
        ctx.redirect('/');
        
    }
}
}


// REDIRECT
exports.redirect = async (ctx) => {    
    ctx.redirect('/');
}