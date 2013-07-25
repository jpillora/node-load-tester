
var requestLib = require('request');
var async = require('async');
var _ = require('lodash');

//job class
function Job(job, callback) {
  this.opts = job;
  this.cb = callback;
  _.bindAll(this);

  if(!this.opts.name)
    return this.cb("'name' required");
  if(!_.isArray(this.opts.sequence))
    return this.cb("'" + this.opts.name + "' requires a 'sequence'");

  if(typeof this.opts.maxSockets !== 'number')
    this.opts.maxSockets = 5;

  this.request = requestLib.defaults({
    pool: {maxSockets: this.opts.maxSockets}
  });

  this.running = 0;
  this.results = [];

  for(var b = 0; b < Math.min(this.opts.maxSockets, this.opts.times); ++b)
    this.runSequence();
}

Job.prototype.runSequence = function() {
  if(this.running === this.opts.times) return;
  this.running++;

  //bind this cookie jar to this sequence
  async.mapSeries(
    this.opts.sequence,
    this.runRequest.bind(this, requestLib.jar()),
    this.ranSequence);
};

Job.prototype.ranSequence = function(err, results) {

  this.results.push(results);

  if(this.results.length === this.opts.times)
    this.done();
  else
    process.nextTick(this.runSequence);
};

Job.prototype.runRequest = function(jar, args, done) {

  if(!_.isArray(args))
    return this.done("sequence item must be an array");

  var method = args[0];
  var path = args[1];
  var url = (this.opts.baseUrl||'') + path;
  var body = args[2];
  var responseTime = Date.now();

  this.request({
    method: method,
    url: url,
    body: body,
    jar: jar
  }, function(err, res, body) {
    done(null, {
      path: path,
      responseTime: Date.now() - responseTime,
      httpError: err && err.toString(),
      statusCode: res && res.statusCode
      // body: body
    });
  });
};

Job.prototype.done = function() {
  console.log("done job");
  this.cb(null, this.results);
};

//job runner
module.exports = function(job, callback) {
  module.exports.jobs.push(new Job(job, callback));
};
module.exports.jobs = [];


