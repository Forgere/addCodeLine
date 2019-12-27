const addCodeLine = require('./src/addCodeLine.js')
const path = require('path')
// addCodeLine("/Users/ali/workspace/project/iotx-icc-web/app")
addCodeLine(path.join(__dirname))
module.exports = addCodeLine