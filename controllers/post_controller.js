const Post = require('../models/post')

const S = require('string');

const md = require('markdown-it')();
const helpers = require('./helpers');

const reading_time = helpers.reading_time
const time_stamp = helpers.time_stamp
const files_upload  = helpers.files_upload
const files_delete = helpers.files_delete
const files_move = helpers.files_move


// INDEX
exports.index = async (ctx) => {
    ctx.state.dateFormat = require('dateformat');
    
    const messages = ctx.session.messages || []; // get any messages saved in the session
    delete ctx.session.messages; // delete the messages as they've been delivered

    const index = await Post.findOne({ slug: "index" })
    if (index) {var data = index; var body = md.render(data.body);}
    else {var data = []; var body = []}
    
    // console.log('The value of PORT is:', process.env.PORT,  process.env.NODE_ENV);

	if (!ctx.isAuthenticated()) var posts = await Post.find({active:true}).sort('-created')
    else var posts = await Post.find({}).sort('-created')

    // tags with count
    const tags = await Post.aggregate([{ $match: { tags: { $not: {$size: 0} } } },
        { $unwind: "$tags" }, { $group: { _id: {$toLower: '$tags'}, count: { $sum: 1 } } },
        { $match: { count: { $gte: 0 } } }, { $sort : { count : -1} }, { $limit : 5 } ]);

	if (!posts) {
		throw new Error("There was an error retrieving your posts.")
	} else {
        ctx.status = 200
        ctx.state.pagetype = "post"
        ctx.state.envvar = process.env.NODE_ENV

        await ctx.render("posts/index", {
            title: 'List of Posts',
            posts: posts,
            messages: messages,
            path: "/posts/",
            auth: ctx.isAuthenticated(),
            csrfToken: ctx.csrf,
            post: data,
            body: body,
            tags: tags,
            ms: Date.now() - ctx.state.start            
        });
	}
}


// NEW
exports.new = async (ctx, next) => {

    const auth =  ctx.isAuthenticated()    
    if (!auth) {ctx.session.messages = {danger: ["You are not authorised!"]};return ctx.redirect('/');throw new Error("There was an error retrieving your post.")}
    else {

    ctx.params._csrf = ctx.csrf;
    const messages = ctx.session.messages || []; // get any messages saved in the session
    delete ctx.session.messages; // delete the messages as they've been delivered
    var post = []

    ctx.status = 200
    ctx.state.pagetype = "post"
    ctx.state.envvar = process.env.NODE_ENV 

    await ctx.render("posts/new", {
        title: 'New post',
        path: "/posts/",
        post: post,
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

    console.log(data._csrf)
    if (data.tags) {
        var tags = data.tags.split(",").map(function(item) {
            return item.trim();
        });
    }
    else var tags = []
        
    try {

        if (data.replace) var clear = true; else var clear = false
        if (data.resized) var resized = true; else var resized = false
        
        const images = files_upload(data.slug, "posts", files, clear, resized)

        const update = {title: data.title, slug: data.slug, body: data.body, active: data.active, tags: tags, abstract: data.abstract, images: images, headline: data.headline}

        const result = await Post.create(update)

        if (result) {
            ctx.session.messages = {success: ["Post created successfuly!"]}

            return ctx.redirect('/posts/'+result.slug);
        }

    } catch(err) {
        console.log("CATCHED CREATE ERR!")
        var messages = {danger: []}
        // console.log(err)

        if (err.name === 'MongoError' && err.code === 11000) messages.danger.push("Duplicate entry -  "+S(err.message).between('dup key: { : ', '}').s)


        for (let value in err.errors) {
            messages.danger.push(err.errors[value].message)
        } 

        ctx.session.messages = messages
        delete ctx.session.messages; // delete the messages as they've been delivered
        
        // ctx.status = 102
        ctx.state.pagetype = "post"
        ctx.state.envvar = process.env.NODE_ENV 

        console.log("messages:")
        console.log(messages)

        return ctx.render("posts/new", {
            title: 'New post - error',
            csrfToken: data._csrf,
            post: data,
            tags: tags.toString(),
            messages: messages,
            ms: Date.now() - ctx.state.start                
        });
    }
    }
}


// VIEW
exports.view = async (ctx) => {
    const slug = ctx.params.slug;
    const post = await Post.findOne({ slug: slug })
    
	if (!post || (!ctx.isAuthenticated() & !post.active)) {
        console.log("ERROR!")
        return ctx.redirect('/404');        
        throw new Error("There was an error retrieving your post.")
	} else {
        const timestamp = time_stamp(post.created)
        const readtime = reading_time(post.body)
        
        const messages = ctx.session.messages || []; // get any messages saved in the session    
        delete ctx.session.messages; // delete the messages as they've been delivered

        ctx.status = 200
        ctx.state.pagetype = "post"
        ctx.state.envvar = process.env.NODE_ENV 
        
        return ctx.render("posts/view", {
            title: post.title,
            valerrors: ctx.errors,
            post: post,
            body: md.render(post.body),
            timestamp: timestamp,
            messages: messages,
            path: "/posts/",
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
	const post = await Post.findOne({ slug: slug })
	if (!post) {
        return ctx.redirect('/404');        
        throw new Error("There was an error retrieving your tasks.")
	} else {
        ctx.status = 200
        ctx.state.pagetype = "post"
        ctx.body = ctx.csrf
        ctx.state.envvar = process.env.NODE_ENV 
        
        return ctx.render("posts/edit", {
            title: post.title,
            csrfToken: ctx.csrf,
            valerrors: ctx.errors,
            post: post,
            tags: post.tags.toString(),
            path: "/posts/",
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

    console.log(ctx.request.body.files.images.name)

    if (data.tags) {
        var tags = data.tags.split(",").map(function(item) {
            return item.trim();
        });
    }
    else var tags = []


    try {
        console.log("old:",ctx.params.slug,"new:",data.slug)
        
        await files_move(ctx.params.slug,data.slug, "posts")
        
        if (data.replace) var clear = true; else var clear = false
        if (data.resized) var resized = true; else var resized = false
        
        const images = await files_upload(data.slug, "posts", files, clear, resized)

        const searchById = {_id: data._id}
        const update = {title: data.title, slug: data.slug, body: data.body, active: data.active, tags: tags, abstract: data.abstract, headline: data.headline, updated: Date.now()}
                    
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
            {safe: true, new : true}//upsert: true,
        );
        
        if (result) {                
            ctx.session.messages = {success: ["Post updated successfuly!"]}
            return ctx.redirect('/posts/'+result.slug);
        }

    } catch(err) {
        console.log("CATCHED UPDATE ERR!")
        var messages = {danger: []}
        console.log(err)

        if (err.name === 'MongoError' && err.code === 11000) messages.danger.push("Duplicate entry -  "+S(err.message).between('dup key: { : ', '}').s)


        for (let value in err.errors) {
            messages.danger.push(err.errors[value].message)
        } 

        ctx.session.messages = messages
        delete ctx.session.messages; // delete the messages as they've been delivered
        
        // ctx.status = 102
        ctx.state.pagetype = "post"
        ctx.state.envvar = process.env.NODE_ENV 
        
        return ctx.render("posts/edit", {
            title: 'Edit post',
            post: data,
            tags: tags.toString(),
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
	const result = await Post.findOneAndRemove({_id: ctx.request.body._id})
	if (!result) {
		throw new Error('Task failed to delete.')
	} else {
        ctx.status = 200
        files_delete(slug, "posts")
        ctx.session.messages = {success: ["Post deleted successfuly!"]}
        ctx.redirect('/posts');
        
    }
    }
}


// REDIRECT
exports.redirect = async (ctx) => {    
    ctx.redirect('/posts');
}