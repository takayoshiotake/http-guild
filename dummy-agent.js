const fetch = require('node-fetch')
const stream = require('stream')
const unzipper = require('unzipper')

fetch('http://localhost:8080/request').then(async res => {
    if (res.status == 200) {
        let request = []
        let body = []
        res.body
            .pipe(unzipper.Parse())
            .pipe(stream.Transform({
                objectMode: true,
                transform: (entry, encoding, callback) => {
                    if (entry.path === 'request.json') {
                        entry.pipe(stream.Writable({
                            write: function(chunk, encoding, callback) {
                                request.push(chunk)
                                callback()
                            }
                        })).on('finish', callback)
                    } else if (entry.path === 'body') {
                        entry.pipe(stream.Writable({
                            write: function(chunk, encoding, callback) {
                                body.push(chunk)
                                callback()
                            }
                        })).on('finish', callback)
                    } else {
                        entry.autodrain()
                    }
                }
            })).on('finish', async () => {
                request = Buffer.concat(request)
                body = Buffer.concat(body)

                let requestId = JSON.parse(request).id
                // XXX
                let res = await fetch(`http://localhost:8080/reports/${requestId}`, {
                    method: 'POST',
                    body: "dummy"
                })
                console.dir(res)
            })
    }
})
