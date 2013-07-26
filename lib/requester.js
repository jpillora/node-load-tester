
var requestLib = require('request');
var async = require('async');
var _ = require('lodash');

//job class
function Job(job, callback) {
  this.opts = job;
  this.cb = callback;
  _.bindAll(this);

  // if(!this.opts.name)
  //   return this.cb("'name' required");
  if(!_.isArray(this.opts.sequence))
    return this.cb("requires a 'sequence'");

  if(typeof this.opts.maxSockets !== 'number')
    this.opts.maxSockets = 5;
  if(typeof this.opts.connections === 'number')
    this.opts.maxSockets = this.opts.connections;

  if(typeof this.opts.runs !== 'number')
    this.opts.runs = Infinity;
  if(typeof this.opts.duration !== 'number')
    this.opts.duration = Infinity;

  if(this.opts.runs === Infinity &&
     this.opts.duration === Infinity)
    this.opts.runs = 1;

  if(typeof this.opts.baseUrl === 'string') {
    if(!/^https?:\/\/[^\/]+$/.test(this.opts.baseUrl))
      return this.cb("'baseUrl' invalid origin, expected only protocol+host+port");
  } else
    return this.cb("requires a 'baseUrl'");

  this.request = requestLib.defaults({
    pool: {maxSockets: this.opts.maxSockets}
  });

  this.timesup = false;
  this.running = 0;
  this.results = [];
  this.startTime = Date.now();

  console.log(this.opts);

  for(var b = 0; b < Math.min(this.opts.maxSockets, this.opts.runs); ++b)
    this.runSequence();

  if(this.opts.duration !== Infinity)
    setTimeout(this.stopSequence, this.opts.duration);
}

Job.prototype.stopSequence = function() {
  this.timesup = true;
};

Job.prototype.runSequence = function() {
  if(this.timesup) return;
  if(this.running >= this.opts.runs) return;
  this.running++;

  //bind this cookie jar to this sequence
  async.mapSeries(
    this.opts.sequence,
    this.runRequest.bind(this, requestLib.jar()),
    this.ranSequence);
};

Job.prototype.ranSequence = function(err, results) {

  if(err)
    return this.done(err);

  this.results.push(results);

  if((!this.timesup || this.results.length < this.running) &&
     (this.results.length < this.opts.runs))
    process.nextTick(this.runSequence);
  else
    this.done();
};

Job.prototype.runRequest = function(jar, reqObj, done) {

  if(!_.isObject(reqObj))
    return done("sequence item (#{reqObj}) must be an object");

  reqObj.method  = reqObj.method || 'GET';
  reqObj.path  = reqObj.path || '';

  var expect = reqObj.expect || { code: 200 };

  if(expect.code && typeof expect.code !== 'number')
    return done("sequence property 'code' must be a number");

  if(expect.match)
    if(typeof expect.match === 'string') {
      try {
        expect._re = new RegExp(expect.match);
      } catch(e) {
        return done("sequence property 'match' contains an invalid regex: "+expect.match+": "+e);
      }
    } else
      return done("sequence property 'match' must be a string");

  if(expect.contains && typeof expect.contains !== 'string')
    return done("sequence property 'contains' must be a string");

  var url = this.opts.baseUrl + reqObj.path;

  if(reqObj.forms && _.isArray(reqObj.forms))
    reqObj.form = rand(reqObj.forms);

  if(reqObj.method === 'GET' && reqObj.form)
    return done("sequence has method GET and form data");

  var responseTime = Date.now();
  this.request({
    method: reqObj.method,
    url: url,
    form: reqObj.form,
    jar: jar
  }, function(err, res, body) {
    if(err)
      err = err.toString();
    else if(!res)
      err = '(no response)';
    else if(expect.code && expect.code !== res.statusCode)
      err = 'expected code: ' + expect.code +
                     ' got: ' + res.statusCode +
                     ' (for ' + reqObj.method + ' ' + reqObj.path + ')';
    else if(expect._re && !expect._re.test(body))
      err = 'expected body to match regex: ' + expect._re;
    else if(expect.contains && body.indexOf(expect.contains) === -1)
      err = 'expected body to contain string: ' + expect.contains;

    done(null, {
      responseTime: Date.now() - responseTime,
      err: err
      // body: body
    });

  });
};

Job.prototype.done = function(err) {
  if(err)
    return this.cb(err);


  var finalResults = {
        paths: {}, errors: {}, pass: 0, fail: 0, total: 0,
        totalTime: Date.now() - this.startTime
      },
      finalTimes = [], s,r, res, req, path, pathData, times;

  for(s = 0; s < this.opts.sequence.length; ++s) {

    reqObj = this.opts.sequence[s],
    key = reqObj.method+" "+reqObj.path, times = [];

    //add to path
    if(finalResults.paths[key])
      pathData = finalResults.paths[key];
    else
      pathData = finalResults.paths[key] = { pass: 0, fail: 0, total: 0, times: [] };

    //calculate
    for(r = 0; r < this.results.length; ++r) {
      res = this.results[r][s];
      if(!res) res = {err:'(missing)'};
      pathData.total++;
      if(!res.err) {
        pathData.pass++;
      } else {
        if(finalResults.errors[res.err])
          finalResults.errors[res.err]++;
        else
          finalResults.errors[res.err] = 1;
        pathData.fail++;
      }
      pathData.times.push(res.responseTime);
    }
  }

  //calculate totals
  for(path in finalResults.paths) {
    pathData = finalResults.paths[path];
    pathData.avgResponseTime = avg(pathData.times);
    //delete array
    delete pathData.times;
    finalTimes.push(pathData.avgResponseTime);
    finalResults.pass += pathData.pass;
    finalResults.fail += pathData.fail;
    finalResults.total += pathData.total;
  }

  finalResults.avgResponseTime = avg(finalTimes);
  this.results = finalResults;
  this.cb(null, finalResults);
};

//job runner
module.exports = function(job, callback) {
  module.exports.jobs.push(new Job(job, callback));
};
module.exports.jobs = [];

//helper
var avg = function(arr) {
  return Math.round(arr.reduce(function(p,c) { return p+c; }, 0)/arr.length);
};
var rand = function(arr) {
  return arr[Math.floor(Math.random()*arr.length)];
};

