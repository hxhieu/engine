// This task is to remove the // #ifdef redirective for target build
// Borrow from ../build/build.js but make it async to maximise performance

const Preprocessor = require('preprocessor');
const fs = require('fs');
const util = require('util');
const path = require('path');
const mkdir = util.promisify(fs.mkdir);
const readFile = util.promisify(fs.readFile);
const writeFile = util.promisify(fs.writeFile);
const rmdir = util.promisify(fs.rmdir);

const getSourceFiles = require('../utils/getSourceFiles');

const processAFile = async function (src, dst, directivesToRemove) {
    // Ensure dir created
    await mkdir(path.dirname(dst), { recursive: true });
    let content = await readFile(src, "utf-8");
    const pp = new Preprocessor(content);
    const options = {
        PROFILER: directivesToRemove.indexOf("DEBUG") >= 0 || directivesToRemove.indexOf("PROFILER") >= 0,
        DEBUG: directivesToRemove.indexOf("DEBUG") >= 0
    };
    content = pp.process(options);
    await writeFile(dst, content);
    return dst;
}


// run all dependencies through
// preprocesor (for #ifdef's etc)
// output to temp directory
// and return list of paths
var preprocess = async function (directivesToRemove, target) {
    const sourceFiles = await getSourceFiles(target);
    // Fastest one just to return the original source files without any modifications needed
    if (!directivesToRemove || !directivesToRemove.length) {
        return sourceFiles;
    }

    // TODO: Windows path support
    if (util.isArray(target) && process.platform === "win32"){
        throw new Error("Custom modules bundling on Windows is not supported yet");
    }

    var tempDir = "tmp"

    // Clean up
    try {
        await rmdir(tempDir);
    }
    catch { /* Intentionally leave this blank if we try to delete a non-existed folder */ }

    // We need a copy of the source files since we will be modifying them
    const promises = []
    sourceFiles.forEach(function (srcPath) {
        // TODO: This will fail on Windows
        // Can use path.sep but it still fails if using the dependencies.txt with unix path seperator
        const regex = new RegExp("(../)+");
        const dest = srcPath.replace(regex, tempDir + "/");
        promises.push(processAFile(srcPath, dest, directivesToRemove));
    });

    return Promise.all(promises);
};

module.exports = preprocess;