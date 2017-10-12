const mongoose = require('mongoose')

/*
	Post Schema
*/
const PostSchema = mongoose.Schema = {
    title: { type : String , unique : true, required : true, dropDups: true },
    slug: { type : String , unique : true, required : true, dropDups: true },
    abstract: String,
    headline: String,
    body: String,
    active: { type : Boolean, default: true},
    created: { type: Date, default: Date.now },
    updated: { type: Date, default: Date.now },
    tags: [],
    images: []
}

module.exports = mongoose.model("Post", PostSchema)