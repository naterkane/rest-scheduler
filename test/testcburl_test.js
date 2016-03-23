'use strict';
var should    = require('chai').should(),
    expect    = require('chai').expect,
    supertest = require('supertest'),
    faker     = require('faker'),
    api       = supertest('http://localhost:3000');

describe('TestCallbackURL', function(){

  let jobName = faker.name.jobDescriptor(),
      url = faker.internet.url(),
      arbitrary = faker.helpers.shuffle(),
      arbitraryLength = arbitrary.length;

  it ('should return a 202 response', function(done){
    api.post('/testcburl')
        .set('Accept', 'application/json')

        .expect(202, done);
  })
  it ('should return the request object', function(done){
    api.post('/testcburl')
        .set('Accept', 'application/json')
        .send({
          "when":"in 3 seconds",
          "url":url,
          "name":jobName,
          "arbitrary": arbitrary
        })
        .expect(202)
        .end(function(err, res){
          should.not.exist(err);
          expect(res.body).to.have.property("when");
          expect(res.body.when).to.equal("in 3 seconds");
          expect(res.body).to.have.property("url");
          expect(res.body).to.have.property("name");
          expect(res.body.name).to.equal(jobName)
          expect(res.body).to.have.property("arbitrary");
          expect(res.body.arbitrary).to.be.an('array');
          expect(res.body.arbitrary).to.have.length(arbitraryLength);
          done();
        })
  })
})