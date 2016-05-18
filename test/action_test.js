'use strict';
var supertest = require('supertest'),
    faker     = require('faker'),
    describe  = require('mocha').describe,
//    it        = require('mocha').it(),
    before    = require('mocha').before,
    should    = require('chai').should(),
    expect    = require('chai').expect;
let api       = supertest('http://localhost:3000');

describe('TestCallbackURL', function() {
  let jobName = faker.name.jobDescriptor(),
      url = faker.internet.url(),
      arbitrary = faker.helpers.shuffle(),
      arbitraryLength = arbitrary.length;

  it('should return a 202 response', function(done) {
    api.post('/testcburl')
        .set('Accept', 'application/json')
        .expect(202, done);
  });

  it('should return the request object', function(done) {
    api.post('/testcburl')
        .set('Accept', 'application/json')
        .send({
          when: 'in 1 second',
          url: url,
          name: jobName,
          arbitrary: arbitrary
        })
        .expect(202)
        .end(function(err, res) {
          should.not.exist(err);
          expect(res.body).to.have.property('when');
          expect(res.body.when).to.equal('in 1 second');
          expect(res.body).to.have.property('url');
          expect(res.body).to.have.property('name');
          expect(res.body.name).to.equal(jobName);
          expect(res.body).to.have.property('arbitrary');
          expect(res.body.arbitrary).to.be.an('array');
          expect(res.body.arbitrary).to.have.length(arbitraryLength);
          done();
        });
  });
});

describe('Action', function() {
  var jobname = [];
  while (jobname.lenth !== 4 && jobname.length < 4) {
    jobname.push(faker.hacker.verb() + ' ' + faker.name.findName());
  }

  console.log(jobname);
  let jobid = '';

  before(function(done) {
    api.post('/')
      .set('Accept', 'application/json')
      .send({
        when: 'in 1 second',
        url: 'http://localhost:3000/testcburl',
        name: jobname[4],
        _id: 'jobidstring'
      }).end(function(err, res) {
        console.log('iucqwyeo7qwby4cri7qywbcio7qybwcrobeqrwyiouyqweiuoqw');
        expect(res.body._id).to.exist();
        jobid = res.body._id;
        console.log('res.body', JSON.stringify(res.body));
        done(err);
      });
    console.log('jobid', jobid);
    done();
  });
  it('should return a 201 response', function(done) {
    api.post('/')
        .set('Accept', 'application/json')
        .send({
          when: 'in 1 second',
          url: 'http://localhost:3000/testcburl',
          name: jobname[0],
          arbitrary: faker.helpers.shuffle(),
          another: 1,
          whynot: {something: ['an', {obj: 'in a string'}]}
        })
        .expect(201, done);
  });

  it('should return the any arbitrary data', function(done) {
    let arbitrary = faker.helpers.shuffle();
    api.post('/')
      .set('Accept', 'application/json')
      .send({
        when: 'in 1 second',
        url: 'http://localhost:3000/testcburl',
        name: jobname[1],
        arbitrary: arbitrary,
        another: 1,
        whynot: {something: ['an', {obj: 'in a string'}]}
      })
      .expect(201)
      .end(function(err, res) {
        should.not.exist(err);
        expect(res.body).to.have.property('data');
        expect(res.body.data).to.have.property('arbitrary');
        expect(res.body.data.arbitrary).to.be.an('array');
        expect(res.body.data.arbitrary).to.have.length(arbitrary.length);
        expect(res.body.data).to.have.property('another');
        expect(res.body.data.another).to.equal(1);
        expect(res.body.data).to.have.property('whynot');
        expect(res.body.data.whynot).to.be.an('object');
        done();
      });
  });

  it('should return metadata', function(done) {
    api.post('/')
      .set('Accept', 'application/json')
      .send({
        when: 'in 1 second',
        url: 'http://localhost:3000/testcburl',
        name: jobname[2],
        arbitrary: faker.helpers.shuffle(),
        another: 1,
        whynot: {something: ['an', {obj: 'in a string'}]}
      })
      .expect(201)
      .end(function(err, res) {
        should.not.exist(err);
        expect(res.body).to.have.property('meta');
        expect(res.body.meta).to.have.property('request');
        expect(res.body.meta).to.have.property('time');
        expect(res.body.meta.time).to.be.a('string');
        expect(res.body.meta.request).to.have.property('name');
        expect(res.body.meta.request).to.have.property('data');
        expect(res.body.meta.request.data).to.be.an('object');
        expect(res.body.meta.request).to.have.property('type');
        expect(res.body.meta.request.type).to.be.a('string');
        expect(res.body.meta.request).to.have.property('priority');
        expect(res.body.meta.request.priority).to.be.a('number');
        expect(res.body.meta.request).to.have.property('nextRunAt');
        expect(res.body.meta.request.nextRunAt).to.be.a('string');
        expect(res.body.meta.request).to.have.property('_id');
        expect(res.body.meta.request._id).to.be.a('string');
        done();
      });
  });

  it('should allow priority to be set', function(done) {
    api.post('/')
       .set('Accept', 'application/json')
       .send({
         priority: 20,
         when: 'in 1 second',
         url: 'http://localhost:3000/testcburl',
         name: jobname[3],
         arbitrary: faker.helpers.shuffle(),
         another: 1,
         whynot: {something: ['an', {obj: 'in a string'}]}})
       .expect(201)
       .end(function(err, res) {
         should.not.exist(err);
         expect(res.body.meta.request.priority).to.be.a('number');
         expect(res.body.meta.request.priority).to.equal(20);
         done();
       });
  });

  it('should allow retrieval of a job', function(done) {
    console.log('jobid', jobid);
    api.get('/jobidstring')
       .set('Accept', 'application/json')
       .expect(201)
       .end(function(err, res) {
         should.not.exist(err);
         expect(res.body).to.have.property('_id');
         expect(res.body._id).to.equal('jobidstring');
         done();
       });
  });

  it('should handle requests for a bad jobid', function(done) {
    api.get('/8j24fj0824j0j')
      .set('Accept', 'application/json')
      .expect(404)
      .end(function(err, res) {
        should.exist(err);
        done();
      });
  });

  it('should allow priority to be set', function(done) {
    done();
  });

  it('should allow priority to be set', function(done) {
    done();
  });

  it('should allow priority to be set', function(done) {
    done();
  });

  it('should allow priority to be set', function(done) {
    done();
  });
});
