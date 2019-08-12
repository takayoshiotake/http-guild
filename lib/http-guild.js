const uuidv4 = require('uuid/v4')

class HttpGuild {
    makeProxyRequest(req) {
        const proxyRequest = {}
        proxyRequest.id = uuidv4()

        // parse query
        if (!req.query.method) {
            throw 'query parameter method missing'
        }
        if (!req.query.uri) {
            throw 'query parameter uri missing'
        }
        proxyRequest.method = req.query.method
        proxyRequest.uri = decodeURIComponent(req.query.uri)

        // parse header field
        proxyRequest.headers = {}
        for (let field in req.headers) {
            if (field.toLowerCase().startsWith('x-guild-proxy-')) {
                let parsedField = field.substring('x-guild-proxy-'.length)
                if (parsedField.toLowerCase() === 'content-length' || parsedField.toLowerCase() === 'content-type') {
                    // Ignore these
                    continue
                }
                proxyRequest.headers[parsedField] = req.headers[field]
            }
        }
        proxyRequest.condition = []
        for (let field in req.headers) {
            switch (field.toLowerCase()) {
                case 'x-guild-condition':
                    proxyRequest.condition = req.headers[field].split(',').map(v => v.trim())
                    break
            }
        }

        // content
        let contentLength
        let contentLengthName
        let contentType
        let contentTypeName
        for (let field in req.headers) {
            switch (field.toLowerCase()) {
                case 'content-length':
                    contentLength = req.headers[field]
                    contentLengthName = field
                    break
                case 'content-type':
                    contentType = req.headers[field]
                    contentTypeName = field
                    break
            }
        }
        if (contentLength === undefined) {
            throw 'header field content-length missing'
        }
        contentLength = parseInt(contentLength)
        if (isNaN(contentLength)) {
            throw 'invalid content-length of header field'
        }
        proxyRequest.headers[contentLengthName] = contentLength
        if (contentLength != 0) {
            if (contentType === undefined) {
                throw 'header field content-type missing'
            }
            proxyRequest.headers[contentTypeName] = contentType
        }

        return proxyRequest
    }
}

module.exports = HttpGuild
