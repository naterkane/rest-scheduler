'use strict';
/* eslint-env mocha */
let supertest = require('supertest');
let faker = require('faker');
let should = require('chai').should();
let expect = require('chai').expect;
let testserver = 'http://localhost:3000';
let api = supertest(testserver);

describe('Action', function() {
  let Context = {jobname: []};
  let jobname = '';
  let jobid = '';
  let arbitrary = '';
  before(function(done) {
    let jn = '';
    while (Context.jobname.lenth !== 10 && Context.jobname.length < 10) {
      jn = faker.hacker.verb() + ' ' + faker.name.findName();
      Context.jobname.push(jn);
    }
    api.post('/')
      .set('Accept', 'application/json')
      .send({
        when: 'in 1 day',
        url: testserver + '/testcburl',
        name: Context.jobname[Math.floor(Math.random() * 10)]
      }).end(function(err, res) {
        jobid = res.body.meta.request._id;
        // console.log(jobid);
        done(err);
      });
  });
  beforeEach(() => {
    jobname = Context.jobname[Math.floor(Math.random() * 10)];
    arbitrary = faker.helpers.shuffle();
  });
  afterEach(() => {
    jobname = null;
    arbitrary = null;
  });
  it('should return a 201 response', function(done) {
    api.post('/')
        .set('Accept', 'application/json')
        .send({
          when: 'in 1 second',
          url: testserver + '/testcburl',
          name: jobname,
          arbitrary: arbitrary,
          another: 1,
          whynot: {something: ['an', {obj: 'in a string'}]}
        })
        .expect(201, done);
  });

  it('should return any arbitrary data', function(done) {
    // let jobname = this.jobname[Math.floor(Math.random() * 10)];
    api.post('/')
      .set('Accept', 'application/json')
      .send({
        when: 'in 1 second',
        url: testserver + '/testcburl',
        name: jobname,
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
        url: testserver + '/testcburl',
        name: jobname,
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
         url: testserver + '/testcburl',
         name: jobname,
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
    // console.log(jobid);
    api.get('/' + jobid)
       .set('Accept', 'application/json')
       .expect(200)
       .end(function(err, res) {
         should.not.exist(err);
         expect(res.body.meta.request).to.have.property('_id');
         expect(res.body.meta.request._id).to.equal(jobid);
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

  it('should allow update of a job', function(done) {
    // console.log(jobid);
    api.put('/' + jobid)
      .set('Accept', 'application/json')
      .send({
        name: jobname,
        arbitrary: arbitrary,
        another: 1,
        whynot: {something: ['an', {obj: 'in a string'}]}
      })
      .expect(200)
      .end(function(err, res) {
        // should.not.exist(err);
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

  it('should allow deleting of a job', function(done) {
    api.delete('/' + jobid)
      .set('Accept', 'application/json')
      .expect(200)
      .end(function(err, res) {
        if (err) {
          done(err);
        } else {
        // done();
          api.get('/' + jobid)
            .set('Accept', 'application/json')
            .expect(400)
            .end(function(err, res) {
              if (err) {
                done(err);
              } else {
                done();
              }
            });
        }
      });
  });
/*
  xit('should fail deleting of a job twice', function(done) {
    api.put('/' + jobid)
      .set('Accept', 'application/json')
      .expect(200)
      .end(function(err, res) {
        //console.log(res);
        done();
      });
  });
*/
  it('should allow priority to be set', function(done) {
    done();
  });
});
