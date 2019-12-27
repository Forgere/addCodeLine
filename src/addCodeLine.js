const file = require('./file')
const fs = require('fs')

async function addCodeLine(location) {
    const files = await file.getFiles(location)
    let space = 2
    // 读取eslintrc
    if (fs.existsSync(location+'/.eslintrc')) {
        const eslint = JSON.parse(fs.readFileSync(location+'/.eslintrc', {encoding: 'UTF8'}))
        space = eslint.rules['indent'][1] || eslint.rules['react/jsx-indent'][1]
    }
    file.dealWithJS(files, space || 2)
}

module.exports = addCodeLine