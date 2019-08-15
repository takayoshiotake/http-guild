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

function sleep(ms) {
    return new Promise((resolve) => setTimeout(() => resolve(), ms))
}

const app = express()
app.use(bodyParser.raw({
    limit: '10mb',
    type: '*/*'
}))

const guild = new HttpGuild()

// for client

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

    let notifying = guild.startNotifyingProxyRequest(proxyRequest)
    // TODO: parse X-Guild-Timeout in headers
    let timeout = 5000
    while (timeout > 0) {
        await sleep(100)
        timeout -= 100
        if (notifying.report) {
            break
        }
    }

    guild.stopNotifyingProxyRequest(proxyRequest.id)
    let report = notifying.report
    if (report) {
        // TODO: Return the report of the request (await the report from agent)
        res.status(200).send()
    } else {
        // Gateway Timeout
        res.status(504).send()
    }
})

// for agent

app.get('/request', async (req, res, next) => {
    let prettifies = true

    let ability = guild.getAgentAbility(req)
    let proxyRequest = guild.takeProxyRequest(ability)
    if (!proxyRequest) {
        res.status(204).send()
        return
    }

    // let zipChunks = []
    let zip = archiver('zip', {
        zlib: {
            // No compression
            level: 0
        }
    })
    zip.pipe(
        // new Writable({
        //     write: function(chunk, encoding, callback) {
        //         zipChunks.push(chunk)
        //         callback()
        //     }
        // })
        res
    )
    zip.append(proxyRequest.jsonWithoutBody(prettifies), { name: 'request.json' })
    if (proxyRequest.body) {
        zip.append(proxyRequest.body, { name: 'body' })
    }
    await zip.finalize()
    // let zipBuffer = Buffer.concat(zipChunks)
    // console.log(zipBuffer)

    // TODO: zip
    res.status(200).send()
})


if (!module.parent) {
    console.dir(config)
    app.listen(config.port)
} else {
    // for supertest
    module.exports = app
}
