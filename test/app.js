const request = require('supertest');
// const myRequire = require('really-need');
const app = require('../app.js');
// describe('loading express', () => {
//   let server;
//   beforeEach(() => {
//     // delete require.cache[require.resolve('../app')];
//     server = myRequire('../app', {bustCache:true});
//   });
//   afterEach((done) => {
//     server.close(done);
//   });
//   it('respond to /', (done) => {
//     request(server).get('/').expect(200, done);
//   });
//   it('404 everything else', (done) => {
//     request(server).get('/foo/bar').expect(404, done);
//   });
// })

describe('GET /', () => {
  it('should return 200 OK', (done) => {
    request(app)
      .get('/')
      .expect(200, done);
  });
});

describe('GET /login', () => {
  it('should return 200 OK', (done) => {
    request(app)
      .get('/login')
      .expect(200, done);
  });
});

describe('GET /signup', () => {
  it('should return 200 OK', (done) => {
    request(app)
      .get('/signup')
      .expect(200, done);
  });
});

describe('GET /api', () => {
  it('should return 200 OK', (done) => {
    request(app)
      .get('/api')
      .expect(200, done);
  });
});

describe('GET /contact', () => {
  it('should return 200 OK', (done) => {
    request(app)
      .get('/contact')
      .expect(200, done);
  });
});

describe('GET /random-url', () => {
  it('should return 404', (done) => {
    request(app)
      .get('/reset')
      .expect(404, done);
  });
});
