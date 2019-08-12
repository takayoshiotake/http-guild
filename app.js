let config = {
    port: 8080
}
!(function () {
    const yargs = require('yargs')
        .option('port',
            {
                alias: 'p',
                description: 'HTTP server port',
                type: 'number',
                default: config.port
            })
        .help('help')
    const argv = yargs.argv
    if (isNaN(argv.port)) {
        yargs.showHelp()
        process.exit(0)
    }
    config.port = argv.port
})()

const archiver = require('archiver')
const bodyParser = require('body-parser')
const express = require('express')
const fs = require('fs')
const HttpGuild = require('./lib/http-guild.js')

function codeLocation() {
    // [ Error, "this function location", "caller location", ...]
    return new Error().stack.split(/\n    at /)[2]
}

const app = express()
// app.use(bodyParser.raw({
//     limit: '10mb',
//     type: '*/*'
// }))

const guild = new HttpGuild()

app.post('/request', async (req, res, next) => {
    // Make proxy request
    let proxyRequest
    try {
        proxyRequest = guild.makeProxyRequest(req)
    } catch (err) {
        console.debug(`400 error: ${err} at ${codeLocation()}`)
        res.status(400).json({ error: err })
        return
    }

    // xxx
    // bodyParser.raw({
    //     limit: '10mb',
    //     type: '*/*'
    // })(req, res, next)
    // console.dir(req.body)

    // TODO...
    // fs.mkdir(__dirname + '/requests', err => {})
    // req.pipe(fs.createWriteStream(__dirname + `/requests/${proxyRequest.id}.body`))
    // let fileOutput = fs.createWriteStream(__dirname + `/requests/${proxyRequest.id}.zip`)
    // let zip = archiver('zip', {
    //     zlib: {
    //         // No compression
    //         level: 0
    //     }
    // })
    // fileOutput.on('close', () => {
    // })
    // fileOutput.on('end', () => {
    // })
    // zip.pipe(fileOutput)
    // zip.append(JSON.stringify(proxyRequest), { name: 'request.json' })
    // zip.append(fs.createReadStream(__dirname + `/requests/${proxyRequest.id}.body`), { name: 'body' })
    // zip.finalize()

    res.status(200).send()
})

if (!module.parent) {
    console.dir(config)
    app.listen(config.port)
} else {
    // for supertest
    module.exports = app
}
