const assert = require('assert');
const fs = require('fs')
const path = require('path')
const file = require('../src/file')
const cp = require('child_process')

const your_donwload_path = path.join(__dirname, "./down")

describe('file Functions', function () {
    this.beforeAll(() => {

    })
    this.timeout(5000);
    this.afterAll(()=>{

    })
    describe('#formatImportInJS', function () {

        this.beforeEach(() => {
            fs.writeFileSync(path.join(__dirname, '/example/example.js'), "import{ Breadcrumb, Button, Message, Input } from'@bone/next';")
        })

        this.afterAll(()=>{
            fs.writeFileSync(path.join(__dirname, '/example/example.js'), "import{ Breadcrumb, Button, Message, Input } from'@bone/next';")
        })

        it(`should return same value`, function (done) {
            file.formatImportInJS([path.join(__dirname, '/example/example.js')], 2).then(() => {
                assert.equal(fs.readFileSync(path.join(__dirname, '/example/example.js'), {encoding: 'UTF8'}), fs.readFileSync(path.join(__dirname, '/example/example2.js'), {encoding: 'UTF8'}), "不相等")
                done()
            })
        });

        it(`should return same value`, function (done) {
            file.formatImportInJS([path.join(__dirname, '/example/example.js')], 4).then(() => {
                assert.equal(fs.readFileSync(path.join(__dirname, '/example/example.js'), {encoding: 'UTF8'}), fs.readFileSync(path.join(__dirname, '/example/example3.js'), {encoding: 'UTF8'}), "不相等")
                done()
            })
        });
    });

    describe("# getFiles", function(){
        it(`should return files array`, function(done) {
            file.getFiles(path.join(__dirname, '/example')).then(res => {
                assert.equal(res.length, 3, '数量不等')
                done()
            })
        })
    })
});