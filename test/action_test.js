var should    = require('chai').should(),
    expect    = require('chai').expect,
    supertest = require('supertest'),
    api       = supertest('http://localhost:3000');

describe('TestCallbackURL', function(){

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
          "url":"http://localhost:3000/testcburl",
          "name":"test job",
          "arbitrary": ["i","am","an","array"]
        })
        .expect(202)
        .end(function(err, res){
          should.not.exist(err);
          expect(res.body).to.have.property("when");
          expect(res.body.when).to.equal("in 3 seconds");
          expect(res.body).to.have.property("url");
          expect(res.body).to.have.property("name");
          expect(res.body.name).to.equal('test job')
          expect(res.body).to.have.property("arbitrary");
          expect(res.body.arbitrary).to.be.an('array');
          expect(res.body.arbitrary).to.have.length(4);
          done();
        })
  })
})

describe('Action', function(){
  it ('should return a 201 response', function(done){
    api.post('/action')
        .set('Accept', 'application/json')
        .send({
          "when":"in 3 seconds",
          "url":"http://localhost:3000/testcburl",
          "name":"3 job",
          "arbitrary": ["i","am","an","array"],
          "another": 1,
          "whynot":{"something":["an",{"obj":"in a string"}]}
        })
        .expect(201, done);
  })

  it ('should return the any arbitrary data', function(done){api.post('/action')
      .set('Accept', 'application/json')
      .send({
        "when":"in 3 seconds",
        "url":"http://localhost:3000/testcburl",
        "name":"3 job",
        "arbitrary": ["i","am","an","array"],
        "another": 1,
        "whynot":{"something":["an",{"obj":"in a string"}]}
      })
      .expect(201)
      .end(function(err, res){
        should.not.exist(err);
        expect(res.body).to.have.property('data');
        expect(res.body.data).to.have.property('arbitrary');
        expect(res.body.data.arbitrary).to.be.an('array');
        expect(res.body.data.arbitrary).to.have.length(4);
        expect(res.body.data).to.have.property('another');
        expect(res.body.data.another).to.equal(1);
        expect(res.body.data).to.have.property('whynot');
        expect(res.body.data.whynot).to.be.an('object');
        done();
      })
  })

  it ('should return metadata', function(done){
    api.post('/action')
      .set('Accept', 'application/json')
      .send({
        "when":"in 3 seconds",
        "url":"http://localhost:3000/testcburl",
        "name":"3 job",
        "arbitrary": ["i","am","an","array"],
        "another": 1,
        "whynot":{"something":["an",{"obj":"in a string"}]}
      })
      .expect(201)
      .end(function(err, res){
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
      })
  })

  it ('should allow priority to be set', function(done){
    api.post('/action')
        .set('Accept', 'application/json')
        .send({
          "priority": 1,
          "when":"in 3 seconds",
          "url":"http://localhost:3000/testcburl",
          "name":"3 job",
          "arbitrary": ["i","am","an","array"],
          "another": 1,
          "whynot":{"something":["an",{"obj":"in a string"}]}
        })
        .expect(201)
        .end(function(err, res){
          should.not.exist(err);
          expect(res.body.meta.request.priority).to.be.a('number');
          expect(res.body.meta.request.priority).to.equal(1);
          done();
        });
  })
});