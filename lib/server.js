var path = require('path');
var express = require('express');
var http    = require('http');
var requester = require('./requester');

var running = false;
var port = process.env.PORT || 3000;
var app = express();

app.configure(function() {

  app.use(express.static(path.join(__dirname,'..','webui')));

  app.use(app.router);

  app.use(function(err, req, res, next) {
    console.error('error', err.stack);
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
      var obj = JSON.parse(json);
      running = true;
      requester(obj, function(err, result) {
        running = false;
        if(err) return next(err);
        res.json(result);
      });
    } catch(e) {
      next(e);
    }
  });
});

app.get('/job/:index', function(req, res, next) {
  var i = req.params.index;
  if(i && requester.jobs[i])
    return res.json(requester.jobs[i]);
  res.send(404, 'Could not find job #'+i);
});

var httpServer = http.createServer(app);

httpServer.listen(port, function() {
  console.log("Listening on %s", port);
});