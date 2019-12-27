const file = require('./file')

async function addCodeLine(location) {
    const files = await file.getFiles(location)
    file.dealWithJS(files)
}

module.exports = addCodeLine