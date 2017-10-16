const mongoose = require('mongoose')

/*
	Post Schema
*/
const PostSchema = mongoose.Schema = {
    title: { type : String , unique : true, required : true, dropDups: true, minlength: [2, 'The value of `{PATH}` (`{VALUE}`) should be at least {MINLENGTH} characters in length.'], maxlength: [50, 'The value of `{PATH}` (`{VALUE}`) exceeds the maximum allowed length ({MAXLENGTH}).']},
    slug: { type : String , unique : true, required : true, dropDups: true , minlength: [2, 'The value of `{PATH}` (`{VALUE}`) should be at least {MINLENGTH} characters in length.'], maxlength: [50, 'The value of `{PATH}` (`{VALUE}`) exceeds the maximum allowed length ({MAXLENGTH}).']},
    abstract: String,
    headline: String,
    body: String,
    active: { type : Boolean},//, default: false
    created: { type: Date, default: Date.now },
    updated: { type: Date, default: Date.now },
    tags: [],
    images: []
}

module.exports = mongoose.model("Post", PostSchema)