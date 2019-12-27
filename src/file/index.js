const fs = require('fs')
const path = require('path')

const ext = {
    js: ['.js' , '.jsx' , '.ts' , '.tsx']
}

const file = {
    getFiles: function(location){
        return new Promise((resolve, reject) => {
            let results = []
    
            function readProjectSync(dir) {
                fs.readdirSync(dir).forEach((file) => {
                    const pathname = path.join(dir, file)
            
                    if (fs.statSync(pathname).isDirectory()){
                        if (!pathname.includes('node_modules')) {
                            readProjectSync(pathname)
                        }
                    } else {
                        if (ext.js.includes(path.extname(file))) {
                            results.push(pathname)
                        }
                    }
            
                })
            }
    
            readProjectSync(location)
            resolve(results)
        })
    },
    dealWithJS: function(files, space=2){
        this.formatImportInJS(files, space)
    },

    formatImportInJS: function(files, space=2){
        return new Promise((resolve, reject) => {
            const rule = /import[\s\S]*?{([\S\s]*?)}[\s\S]*?from/g;
            (function next(index) {
                if(index < files.length) {
                    const element = files[index];
                    if (element == path.resolve(__filename)) {
                        next(index + 1)
                        return
                    }
                    fs.readFile(element, 'utf8', function (err,data) {
                        if (err) {
                            return console.log(err);
                        }
                        if (data.match(rule)) {
                            const matchContents = data.match(rule)
                            if (matchContents.length) {
                                (function inner(number){
                                    if (number < matchContents.length) {
                                        let innerRule = /import[\s\S]*{([\S\s]*)}[\s\S]*from/
                                        const matchContent = matchContents[number].match(innerRule);
                                        if (matchContent) {
                                            const matchContentArray = matchContent[1].split(',').filter(val => val.trim() !== "")
                                            if (matchContentArray.length <= 1) return inner(number + 1)
                                            const replacement = matchContentArray.map(val => (space === 2 ? '  ' : '    ')+val.trim()+',').join('\n')
                                            if (matchContent[1].trim() === replacement.trim()) {
                                                return inner(number+1)
                                            }
                                            var result = fs.readFileSync(element).toString().replace(matchContent[1], "\n"+replacement+"\n");
    
                                            fs.writeFile(element, result, 'utf8', function (err) {
                                                if (err) return console.log(err);
                                                inner(number + 1)
                                            });
                                        }
                                    } else {
                                        next(index+1)
                                    }
                                }(0))
                            } else {
                                next(index + 1)
                            }
                        } else {
                            next(index+1)
                        }
                    });
                } else {
                    resolve()
                }
            }(0));
        })
    }
}

module.exports = file