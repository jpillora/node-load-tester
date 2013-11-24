var path = require('path');
var express = require('express');
var http    = require('http');
var Job = require('./job');
var jobs = [];

var running = false;
var port = process.env.PORT || 3000;
var app = express();

app.configure(function() {

  app.use(express.static(path.join(__dirname,'..','webui')));

  app.use(app.router);

  app.use(function(err, req, res, next) {
    console.error('error', err.stack || err);
    res.send(500, err.toString());
  });

});

app.post('/job', function(req, res, next) {

  if(running)
    return res.send(503, 'Worker in use');

  var json = '';

  req.on('data', function(buffer) {
    json += buffer.toString();
  });

  req.on('end', function() {
    try {
      var opts = JSON.parse(json);
      running = true;

      var job = new Job(opts);

      jobs.push(job);

      res.header('Content-type', 'application/json');
      res.header('Job-Index', jobs.indexOf(job));
      res.writeHead(200);

      job.run(function(err, result) {
        running = false;
        if(err) return next(err);
        res.end(JSON.stringify(result));
      });
    } catch(e) {
      next(e);
    }
  });
});

// LOAD BALANCER BREAKS THIS
// app.del('/job/:index', function(req, res, next) {
//   var i = req.params.index;
//   var job = requester.jobs[i];
//   if(!job) return res.send(404, 'Could not find job #'+i);
//   if(job.results) return res.send(400, 'Already stopped job #'+i);
//   job.stopped = true;
//   res.send(200, 'stopped job #'+i);
// });

app.get('/job/:index', function(req, res, next) {
  var i = req.params.index;
  var job = requester.jobs[i];
  if(!job) return res.send(404, 'Could not find job #'+i);
  job.stopped = true;
  res.json(job);
});

var httpServer = http.createServer(app);

httpServer.listen(port, function() {
  console.log("Listening on %s", port);
});