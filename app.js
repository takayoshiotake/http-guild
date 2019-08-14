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
const { Writable } = require('stream')
const HttpGuild = require('./lib/http-guild.js')

function codeLocation() {
    // [ Error, "this function location", "caller location", ...]
    return new Error().stack.split(/\n    at /)[2]
}

const app = express()
app.use(bodyParser.raw({
    limit: '10mb',
    type: '*/*'
}))

const guild = new HttpGuild()

app.post('/request', async (req, res, next) => {
    let prettifies = true

    // Make proxy request
    let proxyRequest
    try {
        proxyRequest = guild.makeProxyRequest(req)
    } catch (err) {
        console.debug(`400 error: ${err} at ${codeLocation()}`)
        res.status(400).json({ error: err })
        return
    }

    let zipChunks = []
    let zip = archiver('zip', {
        zlib: {
            // No compression
            level: 0
        }
    })
    zip.pipe(
        new Writable({
            write: function(chunk, encoding, callback) {
                zipChunks.push(chunk)
                callback()
            }
        })
    )
    zip.append(proxyRequest.jsonWithoutBody(prettifies), { name: 'request.json' })
    if (proxyRequest.body) {
        zip.append(proxyRequest.body, { name: 'body' })
    }
    await zip.finalize()
    let zipBuffer = Buffer.concat(zipChunks)
    console.log(zipBuffer)
    
    // TODO: Return the report of the request (await the report from agent)
    res.status(200).send()
})

if (!module.parent) {
    console.dir(config)
    app.listen(config.port)
} else {
    // for supertest
    module.exports = app
}
