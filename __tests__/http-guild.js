const HttpGuild = require('../lib/http-guild.js')

const guild = new HttpGuild()

describe('Guild', () => {
    describe('makeProxyRequest()', () => {
        test('throws query parameter method missing', () => {
            expect(() => {
                let req = {
                    query: {}
                }
                guild.makeProxyRequest(req)
            }).toThrow('query parameter method missing')
        })
        test('throws query parameter uri missing', () => {
            expect(() => {
                let req = {
                    query: {
                        method: 'GET'
                    }
                }
                guild.makeProxyRequest(req)
            }).toThrow('query parameter uri missing')
        })
        test('id', () => {
            let req = {
                query: {
                    method: 'GET',
                    uri: '/test'
                },
                headers: {
                    'Content-Length': 0
                }
            }
            let proxyRequest = guild.makeProxyRequest(req)
            expect(proxyRequest.id).toMatch(/[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[0-9a-f]{4}-[0-9a-f]{12}/)
        })
        test('query', () => {
            let req = {
                query: {
                    method: 'GET',
                    uri: '/test%3fp=1%26q=2'
                },
                headers: {
                    'Content-Length': 0
                }
            }
            let proxyRequest = guild.makeProxyRequest(req)
            expect(proxyRequest.method).toEqual('GET')
            expect(proxyRequest.uri).toEqual('/test?p=1&q=2')
        })
        test('header', () => {
            let req = {
                query: {
                    method: 'GET',
                    uri: '/test'
                },
                headers: {
                    'Content-Length': 0,
                    'X-Ignored': 'X-Ignored',
                    'X-Guild-Ignored': 'X-Guild-Ignored',
                    'X-Guild-Proxy-Content-Type': 'application/octet-stream',
                    'X-Guild-Proxy-Content-Length': 1234,
                    'X-Guild-Proxy-CSV': 'a, b',
                    'X-Guild-Proxy-Parameter': 42
                }
            }
            let proxyRequest = guild.makeProxyRequest(req)
            expect(proxyRequest.headers).toEqual({
                'content-length': 0,
                'CSV': 'a, b',
                'Parameter': 42
            })
        })
        test('no conditions', () => {
            let req = {
                query: {
                    method: 'GET',
                    uri: '/test'
                },
                headers: {
                    'Content-Length': 0
                }
            }
            let proxyRequest = guild.makeProxyRequest(req)
            expect(proxyRequest.condition).toEqual([])
        })
        test('random conditions', () => {
            let req = {
                query: {
                    method: 'GEET',
                    uri: '/test'
                },
                headers: {
                    'Content-Length': 0,
                    'X-Guild-Condition': 'audio, japan'
                }
            }
            let proxyRequest = guild.makeProxyRequest(req)
            expect(proxyRequest.condition).toEqual([ 'audio', 'japan' ])
        })
        test('content-length missmatch', () => {
            expect(() => {
                let req = {
                    query: {
                        method: 'GET',
                        uri: '/test'
                    },
                    headers: {
                        'Content-Length': 2,
                        'Content-Type': 'text/plain'
                    },
                    body: new Buffer(1)
                }
                guild.makeProxyRequest(req)
            }).toThrow('content-length missmatch')
        })
    })
    describe('notifyProxyRequest', () => {
        test('sequence', () => {
            let guild = new HttpGuild()
            // xxx: use dummy proxy request
            let notifying = guild.startNotiyingProxyRequest({
                id: '0'
            })
            expect(notifying.report).toBeUndefined()
            expect(guild._notifyingProxyRequests).toContain(notifying)
            guild.stopNotifyingProxyRequest('0')
            expect(guild._notifyingProxyRequests).not.toContain(notifying)
        })
    })
})
