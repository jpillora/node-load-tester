var path = require('path');
var express = require('express');
var sockjs  = require('sockjs');
var http    = require('http');
var requester = require('./requester');

var port = process.env.PORT || 3000;
var app = express();

app.configure(function() {

  app.use(express.static(path.join(__dirname,'..','webui')));

  app.use(app.router);

  app.use(function(err, req, res, next) {
    console.error('error', err.stack);
    res.send({error: err.toString()});
  });

});

app.post('/job', function(req, res, next) {
  var json = '';
  req.on('data', function(buffer) {
    json += buffer.toString();
  });
  req.on('end', function() {
    try {
      requester(JSON.parse(json), function(err, result) {
        if(err) return next(err);
        res.json(result);
      });
    } catch(e) {
      next(e);
    }
  });
});

app.get('/job/:index', function(req, res, next) {
  if(req.params.index && requester.jobs[req.params.index])
    return res.json(requester.jobs[req.params.index]);
  res.send(404, 'missing');
});

var httpServer = http.createServer(app);
var wsServer = sockjs.createServer({
  sockjs_url: "http://cdn.sockjs.org/sockjs-0.3.min.js"
});

wsServer.on('connection', function(conn) {
  console.log(conn);

  conn.on('data', function(message) {
    conn.write(message);
  });
});

wsServer.installHandlers(httpServer, {prefix:'/load-tester'});

httpServer.listen(port, function() {
  console.log("Listening on 'http://localhost:%s'...", port);
});