const file = require('./file')
const fs = require('fs')

async function addCodeLine(location) {
    const files = await file.getFiles(location)
    // 读取eslintrc
    const eslint = JSON.parse(fs.readFileSync(location+'/.eslintrc', {encoding: 'UTF8'}))
    const space = eslint.rules['indent'][1] || eslint.rules['react/jsx-indent'][1] || 2
    file.dealWithJS(files, space)
}

module.exports = addCodeLine