# node-<name>load-tester</end>

## Summary

<description>A load testing server</end>

## Features

* A new session (new set of cookies) is made per sequence
* Control sequence concurrency with `connections`
* Control test duration with `duration`
* Control number of runs with `runs`
* Create response expectations based on status code and body contents

## Demo

http://load-tester-1.herokuapp.com

*Note: free heroku instances have bandwidth caps* 

## Download

<codeBlock("npm install -g " + name)>
```
npm install -g load-tester
```
</end>

## Usage

```
load-tester 3000
```

Basic front-end at: `http://localhost:3000`

## API

`POST /run`

JSON Body:
<showFile("example/basic.json")>
``` json
{
  "baseUrl": "http://echo.jpillora.com",
  "duration": 5000,
  "connections": 1,
  "sequence": [
    { "method": "GET",  "path": "/" },
    { "method": "POST", "path": "/api/login",  "form":{"username":"foo","password":"bar"} },
    { "method": "GET",  "path": "/test/user" },
    { "method": "GET",  "path": "/logout" },
    { "method": "GET",  "path": "/test/user", "expect": { "code": 404 } }
  ]
}
```
</end>


Recieve:
``` json
{
  "paths": {
    "GET /": {
      "pass": 2,
      "fail": 0,
      "total": 2,
      "avgResponseTime": 877
    },
    "POST /api/login": {
      "pass": 2,
      "fail": 0,
      "total": 2,
      "avgResponseTime": 936
    },
    "GET /test/user": {
      "pass": 2,
      "fail": 2,
      "total": 4,
      "avgResponseTime": 692
    },
    "GET /logout": {
      "pass": 2,
      "fail": 0,
      "total": 2,
      "avgResponseTime": 660
    }
  },
  "errors": {
    "expected code: 404 got: 200 (for GET /test/user)": 2
  },
  "pass": 8,
  "fail": 2,
  "total": 10,
  "totalTime": 7719,
  "avgResponseTime": 791
}
```

## More Examples

Random form data

<showFile("example/random-forms.json")>
``` json
{
  "baseUrl": "http://echo.jpillora.com",
  "duration": 5000,
  "connections": 1,
  "sequence": [
    { "method": "POST", "path": "/api/login",  "forms":[
        {"username":"foo","password":"bar"},
        {"username":"ping","password":"pong"},
        {"username":"zap","password":"zoop"}
      ]
    }
  ]
}
```
</end>

More response expectations

<showFile("example/expectations.json")>
``` json
{
  "baseUrl": "http://echo.jpillora.com",
  "runs": 3,
  "connections": 1,
  "sequence": [
    { "method": "GET", "path": "/api/code-test",  "expect": { "code": 408 } },
    { "method": "GET", "path": "/api/string-test",  "expect": { "contains": "abc" } },
    { "method": "GET", "path": "/api/regex-test",  "expect": { "match": "^a[Bb]c$" } }
  ]
}
```
</end>

*`runs` is how many times to run the sequence. Can be used with or instead of `duration`.*

<license()>
#### MIT License

Copyright &copy; 2013 Jaime Pillora &lt;dev@jpillora.com&gt;

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
'Software'), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
</end>
