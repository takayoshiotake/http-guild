const uuidv4 = require('uuid/v4')

class HttpGuild {
    constructor() {
        this._notifyingProxyRequests = []
    }

    makeProxyRequest(req) {
        let proxyRequest = this._makeProxyRequest(req.query, req.headers, req.body)
        proxyRequest.jsonWithoutBody = function(prettifies) {
            return JSON.stringify(
                this,
                (key, value) => key !== 'body' ? value : undefined,
                prettifies === true ? '    ' : undefined
            )
        }
        return proxyRequest
    }

    _makeProxyRequest(query, headers, body) {
        const proxyRequest = {}
        proxyRequest.id = uuidv4()

        // parse query
        if (!query.method) {
            throw 'query parameter method missing'
        }
        if (!query.uri) {
            throw 'query parameter uri missing'
        }
        proxyRequest.method = query.method
        proxyRequest.uri = decodeURIComponent(query.uri)

        // parse header field
        proxyRequest.headers = {}
        for (let field in headers) {
            if (field.toLowerCase().startsWith('x-guild-proxy-')) {
                let parsedField = field.substring('x-guild-proxy-'.length)
                if (parsedField.toLowerCase() === 'content-length' || parsedField.toLowerCase() === 'content-type') {
                    // Ignore these
                    continue
                }
                proxyRequest.headers[parsedField] = headers[field]
            }
        }
        proxyRequest.condition = []
        for (let field in headers) {
            switch (field.toLowerCase()) {
                case 'x-guild-condition':
                    proxyRequest.condition = headers[field].split(',').map(v => v.trim())
                    break
            }
        }
        // header for content
        let contentLength
        let contentType
        for (let field in headers) {
            switch (field.toLowerCase()) {
                case 'content-length':
                    contentLength = headers[field]
                    break
                case 'content-type':
                    contentType = headers[field]
                    break
            }
        }
        if (contentLength === undefined) {
            throw 'header field content-length missing'
        }
        contentLength = parseInt(contentLength)
        if (isNaN(contentLength) || contentLength < 0) {
            throw 'invalid content-length of header field'
        }
        proxyRequest.headers['content-length'] = contentLength
        if (contentLength > 0) {
            if (contentType === undefined) {
                throw 'header field content-type missing'
            }
            proxyRequest.headers['content-type'] = contentType
        }
        
        // body
        if (contentLength != 0 && contentLength !== body.length) {
            throw 'content-length missmatch'
        }
        if (contentLength > 0) {
            proxyRequest.body = body
        }

        return proxyRequest
    }

    startNotiyingProxyRequest(proxyRequest) {
        if (this._notifyingProxyRequests.find(n => n.request.id === proxyRequest.id)) {
            // already notified
            return
        }
        let notifying = {
            hasReport: false,
            request: proxyRequest
        }
        this._notifyingProxyRequests.push(notifying)
        return notifying
    }

    stopNotifyingProxyRequest(proxyRequestId) {
        this._notifyingProxyRequests = this._notifyingProxyRequests.filter(
            n => n.request.id !== proxyRequestId
        )
    }
}

module.exports = HttpGuild
