const dateFormat = require('dateformat');
const S = require('string');
const fs = require('fs-extra')
const os = require('os');
const path = require('path');


const sharp = require('sharp');

const date_diff_indays = function(date1, date2) {
    dt1 = new Date(date1);
    dt2 = new Date(date2);
    return Math.floor((Date.UTC(dt2.getFullYear(), dt2.getMonth(), dt2.getDate()) - Date.UTC(dt1.getFullYear(), dt1.getMonth(), dt1.getDate()) ) /(1000 * 60 * 60 * 24));
}

exports.reading_time = function(words) {
    if (!words) return "-"
    let minutes = (words.split(' ').length)/250;
    if (minutes<1) return "less than a minute"
    else if (minutes<2) return "about a minute"
    else if (minutes%10==1) return minutes+" minute"
    else return  Math.round(minutes)+" minutes"
}

exports.time_stamp = function(created) {
    let time = date_diff_indays(created, Date.now())
    if (time==0) return "today"
    else if (time==1) return "yesterday"
    else if (time<30) return time+" days ago"
    else return dateFormat(created, "dddd, dS mmm, yyyy")
}

exports.files_upload = function(slug, path, files, clear, resized) {
    var dir = './public/uploads/'+path+'/'+slug;

    fs.ensureDirSync(dir)    

    // if (!fs.existsSync(dir)){
    //     fs.ensureDirSync(dir)
    // }
    var names = []
    
    // clear dir
    if (clear) {
        fs.emptyDirSync(dir)
        
    //     fs.readdir(dir, (err, files) => {
    //         if (err) throw error;
        
    //         for (const file of files) {
    //         fs.unlink(path.join(dir, file), err => {
    //             if (err) throw error;
    //         });
    //         }
    //         console.log("dir cleared")
    //     });
    }
    
    // let files = ctx.request.body.files.images;
    for (file in files) {
        
        let reader = fs.createReadStream(files[file].path);
        // console.log(files[file])

        if (files[file].type == 'image/jpeg') var ext = "jpg"
        else if (files[file].type == 'image/png') var ext = "png"
        else if (files[file].type == 'image/gif') var ext = "gif"
        else if (files[file].type == 'text/plain') var ext = "txt"
        else if (files[file].type == 'application/pdf') var ext = "pdf"
        else if (files[file].type == 'application/msword') var ext = "doc"
        else if (files[file].type == 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') var ext = "docx"
        else var ext = S(files[file].name).between('.').s
        
        console.log("ext:",ext)
        
        let name = S(files[file].name).strip('.jpg', '.jpeg', '.gif', '.png', '.txt', '.pdf', '.doc', '.docx', '.JPG', '.JPEG', '.GIF', '.PNG', '.TXT', '.PDF', '.DOC', '.DOCX').slugify().s + "." + ext
        names.push({file: name, description: ""})
        
        // var stream = fs.createWriteStream(path.join(os.tmpdir(), Math.random().toString()));
        let stream = fs.createWriteStream(dir+"/"+name);
        // console.log("reader:",reader)
        // console.log("stream:",stream)
        // console.log("stream")

        if (ext==="jpg"||ext==="png"||ext==="gif") {

            console.log("it's image")
            let streamthumb = fs.createWriteStream(dir+"/thumb_"+name);
            
            if (resized) {
                var normal =
                    sharp()
                        .withoutEnlargement(true)
                        .rotate()
                        .crop(sharp.strategy.entropy)
                        .normalise()
                        .trim()
                        .resize(1280, 720)
            }
            else 
            var normal =
            sharp()
                .rotate()

            const thumb =
                sharp()
                    .rotate()
                    .crop(sharp.strategy.entropy)
                    .normalise()
                    .trim()
                    .resize(400, 400)
                    
            reader
                .pipe(normal)
                .pipe(stream);

            reader
                .pipe(thumb)
                .pipe(streamthumb);
        }
        else reader.pipe(stream);
        console.log('uploading %s -> %s', files[file].name, stream.path);
    }
    
    console.log("finished",names)
    return names
}

exports.files_delete  = function(slug, path) {
    var dir = './public/uploads/'+path+'/'+slug;
    fs.removeSync(dir)
}

exports.files_move  = function(oldslug, newslug, path) {

    var olddir = './public/uploads/'+path+'/'+oldslug;
    var newdir = './public/uploads/'+path+'/'+newslug;
    
    if (fs.existsSync(olddir)){
        fs.moveSync(olddir, newdir, { overwrite: true })
        // fs.moveSync(olddir, newdir)
    }
    
    fs.ensureDirSync(newdir)    
    
    // if (!fs.existsSync(newdir)){
    //     fs.mkdirSync(newdir);
    // }
    
}
