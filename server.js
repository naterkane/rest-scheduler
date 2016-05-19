'use strict';
/* eslint-env es6 */
let http = require('http');
let express = require('express');
let bodyParser = require('body-parser');
let url = require('url');
let _ = require('lodash');
let ObjectId = require('mongodb').ObjectId;
let Agenda = require('agenda');
require('env-deploy')(__dirname);
let app = express();
let processname = (process.getuid) ? process.getuid() : 'windozdevbox';
let agenda = new Agenda({name: processname})
                        .database(process.env.MONGOSTRING);
    /**
     * generateResponseObj
     * wrap the request with metadata and return an object to send back
     * @param  {Object} jerb    request Object describing Job
     * @param  {String} reqtime time stamp of request
     * @return {String}         JSON Object as a string
     */
let resp;
let generateResponseObj = function(jerb, reqtime = new Date().toISOString()) {
  /**
   * omit core request keys from the arbitrary data we'll make available under req.data
   * for the object we forwarard on to the callback url
   */
  console.log('jerb', jerb.attrs);
  let time = reqtime;
  let attrs = jerb.attrs;
  console.log('attrs', attrs);
  let data = _.omit(attrs.data, 'when', 'url', 'name');
  return JSON.stringify({
    meta: {
      time: time,
      request: attrs
    },
    data: data
  });
};
let checkForHexRegExp = new RegExp('^[0-9a-fA-F]{24}$');
app.param('poo', function(req, res, next, jobid) {
  agenda.jobs(jobid, function(err, person) {
    if (err) {
      next(err);
    } else if (person) {
      req.person = person;
      next();
    } else {
      next(new Error('failed to load person'));
    }
  });
});
let validateJobID = function(id, res, next) {
  try {
    if (ObjectId(id)) {
      return true;
    }
  } catch (e) {
    Error(e);
    // console.warn(e);
    return false;
  }
};
app.use(bodyParser.json());
app.use((req, res, next) => {
  res.removeHeader('X-Powered-By');
  next();
});

/**
 * development error handler, will print stacktrace
 * @param  {Callback} app.get('env' [description]
 * @return {[type]}               [description]
 */
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

/**
 * production error handler, no stacktraces leaked to user
 * @param  {Callback} function(err, req, res, next [description]
 * @return {[type]}               [description]
 */
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});

app.post('/', function(req, res, next) {
  let reqtime = new Date().toISOString();
  let jerb = req.body;
  let opts = {};
  /**
   * process options
   */
  if (jerb.concurrency !== undefined) {
    opts.concurrency = jerb.concurrency;
  }
  if (jerb.lockLimit !== undefined) {
    opts.lockLimit = jerb.lockLimit;
  }
  if (jerb.priority !== undefined) {
    opts.priority = jerb.priority;
  }
  if (jerb.lockLifetime !== undefined) {
    opts.lockLifetime = jerb.lockLifetime;
  }

  console.log('URL ' + req.body.url);

  /**
   * create job
   * @param  {String} jerb.name [description]
   * @param  {Object} opts      [description]
   * @param  {Callback} (jorb, done          [description]
   * @return {[type]}           [description]
   */
  agenda.define(jerb.name, opts, (jorb, done) => {
    let postData = JSON.stringify(jerb);
    let cburl = url.parse(jerb.url, true, true);
    let options = {
      hostname: cburl.hostname,
      port: cburl.port,
      path: cburl.path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Length': postData.length
      }
    };

    let req = http.request(options, res => {
      console.log(`STATUS: ${res.statusCode}`);
      console.log(`HEADERS: ${JSON.stringify(res.headers)}`);
      res.setEncoding('utf8');
      res.on('data', chunk => {
        console.log(`BODY: ${chunk}`);
      });
      res.on('end', () => {
        console.log('No more data in response.');
      });
    });

    req.on('error', err => {
      console.log(`problem with request: ${err.message}`);
    });

    req.write(postData);
    req.end();
    console.log('done with ' + jerb.name);
    done();
  });

  /**
   * Schedules a job to run name once at a given time. when can be a Date or a
   * String such as tomorrow at 5pm.
   * @param  {Date|String} jerb.when Date or String describing when the job should be run
   * @param  {String} jerb.name Friendly name for Job
   * @param  {Object} jerb      [description]
   * @param  {Callback} (err,     jerb          [description]
   * @return {[type]}           [description]
   */
  agenda.schedule(jerb.when, jerb.name, jerb, (err, jerb) => {
    if (err) {
      res.status(400)
         .send({error: {code: 400, message: 'we were unable to process your reqest'}});
      return next(err);
    }
    res.status(201)
       .set('Content-Type', 'application/json; charset=utf-8')
       .send(generateResponseObj(jerb, reqtime));
  });

  agenda.start();
});

app.get('/:jobid', (req, res, next) => {
  if (!validateJobID(req.params.jobid)) {
    let err = 'we were unable to process your reqest';
    res.status(400)
       .send({error: {code: 400, message: err}});
    console.warn('something something something darkside');
    return next(err);
  }
  let jobid = (req.params.jobid.length === 24) ? ObjectId(req.params.jobid) : req.params.jobid;
  agenda.jobs({_id: jobid}, (err, job) => {
    if (err || job.length === 0) {
      res.status(400)
         .send({error: {code: 400, message: 'we were unable to process your reqest'}});
      return next(err);
    }

    resp = job[0];
    console.log('resp', resp.attrs);
    res.status(200)
       .set('Content-Type', 'application/json; charset=utf-8')
       .send(generateResponseObj(resp));
  });
});

app.put('/:jobid', (req, res, next) => {
  let jerb = req.body;
  console.log(req.params.jobid, '_id');
  validateJobID(req.params.jobid, res, next);
  /* if (!ObjectId(req.params.jobid)) {
    let err = 'we were unable to process your reqest';
    res.status(400)
       .send({error: {code: 400, message: err}});
    console.warn('something something something darkside');
    return next(err);
  }
  */
  agenda.jobs({_id: ObjectId(req.params.jobid)}, (err, job) => {
    if (err) {
      console.warn(err);
      res.status(400)
         .send({error: {code: 400, message: 'we were unable to process your reqest'}})
         .next();
      return next(err);
    } else if (job[0] === undefined) {
      console.warn('there is no job');
      res.status(400)
         .send({error: {code: 400, message: 'we were unable to process your reqest'}})
         .next();
      if (res) {
        return next(err);
      }
    } else {
      // console.log(job.length, job);
      job = job[0];
      // console.log('there is a job', job);
      // console.dir(job.agenda.attrs, {depth: null, colors: true});
      // console.dir(jerb, {depth: null, colors: true});

      job.attrs = Object.assign(job.attrs, jerb);
      job.attrs.data = Object.assign(job.attrs.data, jerb);
      job.save(err => {
        if (err) {
          res.status(400)
             .send({error: {code: 400, message: 'we were unable to process your reqest'}});
          console.warn(err);
        } else {
          console.log('Successfully saved Job ' + job.attrs.name);
          // let resp = JSON.stringify(job);
          res.status(200)
             .set('Content-Type', 'application/json; charset=utf-8')
             .send(generateResponseObj(job));
        }
      });
    }
  });
});

app.delete('/:jobid', (req, res, next) => {
  agenda.cancel({_id: /* eslint-disable */ ObjectId(req.params.jobid) /* exlint-enable */}, (err, numRemoved) => {
    if (err) {
      res.status(400)
         .send({error: {code: 400, message: 'we were unable to process your reqest'}});
      console.warn(err);
      return next(err);
    }
    res.status(200)
       .set('Content-Type', 'application/json; charset=utf-8')
       .send({message: 'Successfully removed %s Job(s) %s'}, numRemoved, req.params.jobid);
  });
});

app.post('/testcburl', (req, res, next) => {
  if (!req.body) {
    let err = 'we were unable to process your request';
    res.status(400)
       .send({error: {code: 400, message: err}});
    return next(err);
  }
  let resp = JSON.stringify(req.body);
  console.log('TEST CB URL: ' + new Date().toISOString(), resp);
  res.status(202)
     .set('Content-Type', 'application/json; charset=utf-8')
     .send(resp);
});

agenda.on('ready', () => {
  agenda.start();
});

agenda.on('start', job => {
  console.info('Job %s starting', job.attrs.name);
});

let server = app.listen(3000, function() {
  let host = server.address().address;
  host = (host === '::' ? 'localhost' : host);
  let port = server.address().port;

  console.info('listening at http://%s:%s', host, port);
});

/**
 * graceful shutdown of app
 * @return {[type]} [description]
 *
function graceful() {
  agenda.stop(() => {
    process.exit(0);
  });
}

process.on('SIGTERM', graceful);
process.on('SIGINT', graceful);
//*/
