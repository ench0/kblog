const mongoose = require('mongoose')

/*
	Page Schema
*/
const PageSchema = mongoose.Schema = {
    title: { type : String , unique : true, required : true, dropDups: true },
    slug: { type : String , unique : true, required : true, dropDups: true },
    abstract: String,
    headline: String,
    body: String,
    active: { type : Boolean, default: true},
    created: { type: Date, default: Date.now },
    updated: { type: Date, default: Date.now },
    images: []
}

module.exports = mongoose.model("Page", PageSchema)