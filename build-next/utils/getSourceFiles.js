// This should provide a way to define a way to exclude engine feature for different build
// Tries to address #3 https://github.com/playcanvas/engine/issues/2103#issuecomment-634866511

const os = require('os');
const fs = require('fs');
const path = require('path');
const util = require('util');
const readFile = util.promisify(fs.readFile);
const readDir = util.promisify(fs.readdir);

const getFromFile = async function (file) {
    const deps = await readFile(file || path.join("..", "build", "dependencies.txt"), 'utf-8');
    return deps
        .split(os.EOL)
        // Ignore empty line
        .filter(function (dep) {
            return !!dep
        });
}

// Get from one module
const getFromModule = async function (srcDir, mod) {
    const deps = await readDir(srcDir + mod);
    return deps.map(function (dep) {
        return srcDir + mod + path.sep + dep;
    }); 
}

// Get from modules array
const getFromModules = async function (modules) {
    const srcDir = path.join("..", "src", path.sep);
    const promises = []
    modules.forEach(function (mod) {
        promises.push(getFromModule(srcDir, mod));
    });
    const deps = await Promise.all(promises);
    return [].concat.apply([], deps);
}

const getSourceFiles = async function (target) {
    let promise;
    // Dependencies file
    if (!target || util.isString(target)) {
        promise = getFromFile(target);
    }
    // List of modules
    else if (util.isArray(target)) {
        promise = getFromModules(target)   
    }

    return Promise.resolve(promise)
}

module.exports = getSourceFiles;