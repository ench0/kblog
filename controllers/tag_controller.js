'use strict';

const Post = require('../models/post')

const S = require('string');

const helpers = require('./helpers');

const reading_time = helpers.reading_time
const time_stamp = helpers.time_stamp
const files_upload  = helpers.files_upload



// INDEX
exports.index = async (ctx) => {
    ctx.state.dateFormat = require('dateformat');

    // simple list of tags
    // const tags = await Post.distinct( "tags" )

    // tags with count
    const tags = await Post.aggregate([
        {
            $match: {
                tags: { $not: {$size: 0} }
            }
        },
        { $unwind: "$tags" },
        {
            $group: {
                _id: {$toLower: '$tags'},
                count: { $sum: 1 }
            }
        },
        {
            $match: {
                count: { $gte: 0 }
            }
        },
        { $sort : { count : -1} },
        { $limit : 100 }
    ]);


    console.log(tags)

    const messages = []

    if (!tags) {
		throw new Error("There was an error retrieving your posts.")
	} else {
        ctx.status = 200
        ctx.state.pagetype = "tag"
        ctx.state.envvar = process.env.NODE_ENV 
        
        return ctx.render("tags/index", {
            title: 'Tags',
            // tags: tags.sort(), // for simple tags
            tags: tags,            
            messages: messages,
            path: "/tags/",
            ms: Date.now() - ctx.state.start
        });
	}
}


// VIEW
exports.view = async (ctx) => {
    const tag = ctx.params.tag;
    ctx.state.dateFormat = require('dateformat');
    
    const messages = []
    const posts = await Post.find({ tags: tag}, {title: 1, slug: 1, images: 1, created: 1, tags: 1}).sort("-created")

	if (!tag) {
		throw new Error("There was an error retrieving your tasks.")
	} else {
        ctx.status = 200
        ctx.state.pagetype = "tag"
        ctx.state.envvar = process.env.NODE_ENV 
        
        return ctx.render("tags/view", {
            title: tag,
            valerrors: ctx.errors,
            posts: posts,
            path: "/tags/",
            messages: messages,
            ms: Date.now() - ctx.state.start
        });
	}
}

// // Using query builder
// const pages = await Person.
// find({ tags: /host/ }).
// // where('name.last').equals('Ghost').
// // where('age').gt(17).lt(66).
// where('likes').in(['vaporizing', 'talking']).
// limit(10).
// sort('-tag').
// select('tags').
// exec(callback);
