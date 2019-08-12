const request = require('supertest')
const app = require('../app')

describe('POST /request', () => {
    it('should 400 error without query parameter method', done => {
        request(app)
            .post('/request')
            .expect(400, { 'error': 'query parameter method missing' })
            .end(done)
    })
    it('should 400 error with empty query parameter method', done => {
        request(app)
            .post('/request?method=')
            .expect(400, { 'error': 'query parameter method missing' })
            .end(done)
    })
    it('should 400 error without query parameter uri', done => {
        request(app)
            .post('/request?method=GET')
            .expect(400, { 'error': 'query parameter uri missing' })
            .end(done)
    })
    it('should 400 error with empty query parameter uri', done => {
        request(app)
            .post('/request?method=GET&uri=')
            .expect(400, { 'error': 'query parameter uri missing' })
            .end(done)
    })
})
