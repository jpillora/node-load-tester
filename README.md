# node-<name>load-tester</end>

## Summary

<description>A load testing server</end> - v<version>0.5.0</end>

## Features

* Basic WebUI
* A new session (new set of cookies) is made per sequence
* Control sequence concurrency with `connections`
* Control test duration with `duration`
* Control number of runs with `runs`
* Set custom `headers`
* Create a set of `baseUrls`, randomly choosing a `baseUrl` to test against
* Create a set of `forms`, randomly choosing a `form` to POST with
* Create response expectations based on status code and body contents

## Demo

http://node-load-tester.herokuapp.com

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

`POST /job`

Create a load test `Job`

### `Job` Object Properties

* `baseUrl` (String) - Target URL
* `baseUrls` (Array[String]) - Target URLs
* `runs` (Number) - Number of times to run through the `sequence`
* `duration` (Number) - Keep running through the `sequence` for `duration`ms
* `connections` (Number) - Number of HTTP clients (each will run through the `sequence`)
* `sequence` (Array[Request]) - The sequence of `Request`s to execute (a new cookie jar is created per sequence)

### `Request` Object Properties

* `method` (String) - HTTP Method to use (default:`"GET"`)
* `path` (String) - URL Path to be appended to `baseUrl`
* `form` (Object) - Object to application/form encode
* `forms` (Array[Object]) - Round-robin through objects to application/form encode

* `expect` (Object) - Expectation definition object
  * `code` (Number) - Expect a particular HTTP status code
  * `contains` (String) - Expect the HTTP body to contain
  * `match` (String) - Expect the HTTP body to match `new RegExp(match)`

  Note: failed expections are accumulated in the results
  ``` json
  "errors": {
    "expected code: 404 got: 200 (for GET /test/user)": 2
  }
  ```

## Basic Example

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

#### Random form data

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

#### More response expectations

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


#### Simulate load balancer

<showFile("example/load-balancer.json")>
``` json
{
  "baseUrls": [
    "http://74.125.237.114",
    "http://74.125.237.115",
    "http://74.125.237.116"
  ],
  "headers": {
    "host": "www.google.com.au"
  },
  "duration": 5000,
  "connections": 1,
  "sequence": [
    { "path": "/" }
  ]
}
```
</end>

*Every request will randomly choose one of the `baseUrls`*

*Requests may also specify a `header` object which will override the job's `header` object*

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
