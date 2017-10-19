'use strict';

const mongoose = require('mongoose')

/*
	Page Schema
*/
const PageSchema = mongoose.Schema = {
    title: { type : String , unique : true, required : true, dropDups: true, minlength: [2, 'The value of `{PATH}` (`{VALUE}`) should be at least {MINLENGTH} characters in length.'], maxlength: [50, 'The value of `{PATH}` (`{VALUE}`) exceeds the maximum allowed length ({MAXLENGTH}).'] },
    slug: { type : String , unique : true, required : true, dropDups: true, minlength: [2, 'The value of `{PATH}` (`{VALUE}`) should be at least {MINLENGTH} characters in length.'], maxlength: [50, 'The value of `{PATH}` (`{VALUE}`) exceeds the maximum allowed length ({MAXLENGTH}).']},
    abstract: String,
    headline: String,
    body: String,
    active: { type : Boolean, default: true},
    created: { type: Date, default: Date.now },
    updated: { type: Date, default: Date.now },
    images: []
}

module.exports = mongoose.model("Page", PageSchema)