var debug = require('debug')('koa-static-folder'),
    send = require('koa-send'),
    fs = require('fs');

module.exports = serve;

/**
 * Serve static files from `root`.
 *
 * Traverses the specified folder and serves all underlying files. Can be used for public and asset folders.
 *
 * @param {String} root
 * @return {Function}
 * @api public
 */
function serve(root){
    if(!root) throw Error('Root must be defined.');
    if(typeof root !== 'string') throw TypeError('Path must be a defined string.');
    
    debug('Static: "%s".', root);
    var rootStat = fs.statSync(root);
    if(!rootStat.isDirectory()) throw Error('Root should be a directory.');
    
    debug('Root is a directory. Initializing static directory serving at "%s"',root);
    var finalFiles = walk(root);
    
    root = fs.realpathSync(root);
    if(!root) throw Error('Root must be a valid path.');
    
    return function* staticFolder(next){
        var file = finalFiles[this.path];
        if(!file) return yield * next;
        return yield send(this, file);
    }
}

function walk(root, directory, finalFiles) {
    var finalFiles = finalFiles || {} ;
    if(!directory) {
        directory = root ;
        var separator = (root.lastIndexOf("/") >  root.lastIndexOf("\\")) ? "/" : "\\" ;
        root = root.substring(0, root.lastIndexOf(separator));
    }

    var files = fs.readdirSync(directory);
    for(var i=0; i<files.length; i++) {
        var file = files[i];
        if(!file) continue;
        file = directory + '/' + file;
        if(fs.statSync(file).isDirectory()) {
            walk(root, file, finalFiles);
        }
        else {
            var fileKey = file.replace(root, '') ;
            finalFiles[fileKey] = file;
        }
    }
    return finalFiles;
}
