const addCodeLine = require('./src/addCodeLine.js')
const path = require('path')
// addCodeLine("/Users/ali/workspace/project/iotx-ose-console")
addCodeLine(path.join(__dirname))
module.exports = addCodeLine