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
                        readProjectSync(pathname)
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
    dealWithJS: function(files){
        const rule = /import[\s\S]*{([\S\s]*)}[\s\S]*['"]@bone\/next/;
        (function next(index) {
            if(index < files.length) {
                const element = files[index];
                console.log(element)
                fs.readFile(element, 'utf8', function (err,data) {
                    if (err) {
                        return console.log(err);
                    }
                    if (data.match(rule)) {
                        const matchContent = data.match(rule)[1]
                        if (matchContent) {
                            const replacement = data.match(rule)[1].split(',').filter(val => val.trim() !== "").map(val => '  '+val.trim()+',').join('\n')
        
                            var result = data.replace(matchContent, "\n"+replacement+"\n");
                            fs.writeFile(element, result, 'utf8', function (err) {
                                if (err) return console.log(err);
                                next(index+1)
                            });
                        }
                    } else {
                        next(index+1)
                    }
                });
            }
        }(0));
    }
}

module.exports = file