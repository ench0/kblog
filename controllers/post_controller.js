const Post = require('../models/post')

const S = require('string');

const markdown = require( "markdown" ).markdown;
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
        ctx.redirect('/posts/');
    }
}

// INDEX
exports.index = async (ctx) => {
    ctx.state.dateFormat = require('dateformat');
    
    const messages = ctx.session.messages || []; // get any messages saved in the session
    delete ctx.session.messages; // delete the messages as they've been delivered

    const index = await Post.findOne({ slug: "index" })
    if (index) {var data = index; var body = markdown.toHTML(data.body);}
    else {var data = []; var body = []}
    

	const posts = await Post.find({}).sort('-created')
	if (!posts) {
		throw new Error("There was an error retrieving your posts.")
	} else {
        return ctx.render("posts/index", {
            title: 'List of Posts',
            posts: posts,
            messages: messages,
            path: "/posts/",
            auth: ctx.isAuthenticated(),
            csrfToken: ctx.csrf,
            post: data,
            body: body
        });
	}
}

// NEW
exports.new = async (ctx) => {
    checkLogin(ctx)
    ctx.params._csrf = ctx.csrf;
    
    var post = []

    return ctx.render("posts/new", {
        title: 'New post',
        path: "/posts/",
        post: post,
        csrfToken: ctx.csrf
    });
	
}

// CREATE
exports.create = async (ctx) => {
    checkLogin(ctx)
    
    ctx.params._csrf = ctx.csrf;

    const data = ctx.request.body.fields
    if (ctx.request.body.files.images.length > 1) {
        var files = ctx.request.body.files.images
    }
    else if (ctx.request.body.files.images.name == '') var files = []
    else var files = [ctx.request.body.files.images]

    console.log(data._csrf)
    if (data.tags) {
        var tags = data.tags.split(",").map(function(item) {
            return item.trim();
        });
    }
    else var tags = []

    ctx.checkBody('title').notEmpty("Post should have a title!").len(2, 50,"Title needs to be 2-50 characters long!");
    ctx.checkBody('slug').notEmpty("Slug can not be empty!").len(2, 50,"Slug needs to be 2-50 characters long!");
    ctx.checkBody('body').optional().empty().len(2, 10240,"Body needs to be 2-10240 characters long!");

    if (ctx.errors) {

        console.log(ctx.errors)
        return ctx.render("posts/new", {
            title: 'New post',
            csrfToken: data._csrf,
            valerrors: ctx.errors,
            post: data
        });
    }
    else {
        
        try {

            if (data.replace) var clear = true; else var clear = false
            if (data.resized) var resized = true; else var resized = false
            
            const images = files_upload(data.slug, "posts", files, clear, resized)

            const update = {title: data.title, slug: data.slug, body: data.body, active: data.active, tags: tags, abstract: data.abstract, images: images}

            const result = await Post.create(update)

            if (result) {
                ctx.session.messages = {success: ["Post updated successfuly!"]}

                return await ctx.redirect('/posts/'+result.slug);
            }

        } catch(err) {
            console.log("CATCHED UPDATE ERR!")
            console.log(err)
            if (err.name === 'MongoError' && err.code === 11000) var error = "Duplicate entry -  "+S(err.message).between('dup key: { : ', '}').s
            return ctx.render("posts/edit", {
                title: 'Edit post',
                csrfToken: data._csrf,
                duperror: error,
                post: data,
                tags: tags.toString()
            });
        }

    }

}

// VIEW
exports.view = async (ctx) => {
    const slug = ctx.params.slug;
    const post = await Post.findOne({ slug: slug })

    console.log(post)

	if (!post) {
        console.log("ERROR!")
        return ctx.redirect('/404');        
        throw new Error("There was an error retrieving your post.")
	} else {
        const timestamp = time_stamp(post.created)
        const readtime = reading_time(post.body)
        
        const messages = ctx.session.messages || []; // get any messages saved in the session    
        delete ctx.session.messages; // delete the messages as they've been delivered

        return ctx.render("posts/view", {
            title: post.title,
            valerrors: ctx.errors,
            post: post,
            body: markdown.toHTML(post.body),
            timestamp: timestamp,
            messages: messages,
            path: "/posts/",
            readtime: readtime,
            csrfToken: ctx.csrf,
            auth: ctx.isAuthenticated()
        });
	}
}

// EDIT
exports.edit = async (ctx) => {
    checkLogin(ctx)
    
    const csrfToken = ctx.csrf;    
    console.log(ctx.isAuthenticated())
    const slug = ctx.params.slug;
	const post = await Post.findOne({ slug: slug })
	if (!post) {
        ctx.redirect('/404/');        
        throw new Error("There was an error retrieving your tasks.")
	} else {
        ctx.body = ctx.csrf
        return ctx.render("posts/edit", {
            title: post.title,
            csrfToken: ctx.csrf,
            valerrors: ctx.errors,
            post: post,
            tags: post.tags.toString(),
            path: "/posts/",
            csrfToken: ctx.csrf
        });
	}
}

// UPDATE
exports.update = async (ctx) => {
    checkLogin(ctx)
    
    const data = ctx.request.body.fields
    if (ctx.request.body.files.images.length > 1) {
        var files = ctx.request.body.files.images
    }
    else if (ctx.request.body.files.images.name == '') var files = []
    else var files = [ctx.request.body.files.images]

    console.log(ctx.request.body.files.images.name)

    if (data.tags) {
        var tags = data.tags.split(",").map(function(item) {
            return item.trim();
        });
    }
    else var tags = []

    ctx.checkBody('title').notEmpty("Post should have a title!").len(2, 50,"Title needs to be 2-50 characters long!");
    ctx.checkBody('slug').notEmpty("Slug can not be empty!").len(2, 50,"Slug needs to be 2-50 characters long!");
    ctx.checkBody('body').optional().empty().len(2, 10240,"Body needs to be 2-10240 characters long!");    
    
    if (ctx.errors) {

        console.log("CTX ERRORS")
        console.log(ctx.errors)
        return ctx.render("posts/edit", {
            title: 'Edit post',
            csrfToken: ctx.csrf,
            valerrors: ctx.errors,
            post: data,
            tags: tags.toString()
        });
    }
    else {

        try {
            console.log("old:",ctx.params.slug,"new:",data.slug)
            
            await files_move(ctx.params.slug,data.slug, "posts")
            

            if (data.replace) var clear = true; else var clear = false
            if (data.resized) var resized = true; else var resized = false
            
            const images = await files_upload(data.slug, "posts", files, clear, resized)

            const searchById = {_id: data._id}
            const update = {title: data.title, slug: data.slug, body: data.body, active: data.active, tags: tags, abstract: data.abstract, updated: Date.now()}
                        
            if (!data.replace) {
                var push = { $set: update, $push: { images: {$each: images}}}
            }
            else {
                console.log("else!")
                var push = { $set: update, images: images }
            }

            const result = 
            await Post.findOneAndUpdate(
                searchById,
                push,
                {safe: true, upsert: true, new : true}
            );
            
            if (result) {                
                ctx.session.messages = {success: ["Post updated successfuly!"]}
                await ctx.redirect('/posts/'+result.slug);
            }

        } catch(err) {
            console.log("CATCHED UPDATE ERR!")
            console.log(err)
            if (err.name === 'MongoError' && err.code === 11000) var error = "Duplicate entry -  "+S(err.message).between('dup key: { : ', '}').s
            return ctx.render("posts/edit", {
                title: 'Edit post',
                duperror: error,
                post: data,
                tags: tags.toString(),
                csrfToken: ctx.csrf
            });
        }

    }

}

// DELETE
exports.delete = async (ctx) => {
    checkLogin(ctx)
    
    const slug = ctx.request.body.slug
    const csrfToken = ctx.params._csrf;
	const result = await Post.findOneAndRemove({_id: ctx.request.body._id})
	if (!result) {
		throw new Error('Task failed to delete.')
	} else {
        ctx.status = 200
        files_delete(slug, "posts")
        ctx.session.messages = {success: ["Post deleted successfuly!"]}
        ctx.redirect('/posts/');
        
	}
}


// REDIRECT
exports.redirect = async (ctx) => {    
    ctx.redirect('/posts');
}