const fs = require('fs');
const util = require('util');
const path = require('path');
const append = util.promisify(fs.appendFile);
const readFile = util.promisify(fs.readFile);
const mkdir = util.promisify(fs.mkdir);
const exist = util.promisify(fs.exists);
const unlink = util.promisify(fs.unlink);

const CONCAT_SRC_FILE = "tmp/__src__.js";

const appendAFile = async function (srcFile) {
    const script = await readFile(srcFile, 'utf-8');
    await append(CONCAT_SRC_FILE, script);
    return CONCAT_SRC_FILE;
}

const concatenateSourceFiles = async function (target) {
    if (await exist(CONCAT_SRC_FILE)){
        await unlink(CONCAT_SRC_FILE);
    }
    else {
        // Ensure dir created
        await mkdir(path.dirname(CONCAT_SRC_FILE), { recursive: true });
    }
    const promises = []
    target.forEach(function (srcFile) {
        if (srcFile) {
            promises.push(appendAFile(srcFile));
        }
    })
    return Promise.all(promises);
}

module.exports = concatenateSourceFiles;