# node-<name>load-tester</end>

> #### Simple load testing with Node.js

<a href="https://twitter.com/intent/tweet?text=Simple+load+testing+with+Node.js&url=https%3A%2F%2Fgithub.com%2Fjpillora%2Fnode-load-tester&hashtags=nodejs%2Cnode-load-tester&original_referer=http%3A%2F%2Fgithub.com%2F&tw_p=tweetbutton" target="_blank">
  <img src="http://jpillora.com/github-twitter-button/img/tweet.png"
       alt="tweet button" title="Simple load testing with Node.js"></img>
</a>

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

## Future

* Nice WebUI **(Pull Request Anyone?)**
  * Dynamic Angular Form to construct a `Job` object
  * Nice display of results object
* Cancel jobs
* Modify result object to mirror the `Request` object 

## Install
```
$ npm install -g load-tester
```

## Run
```
$ load-tester <port>
Listening on <port>
```

Now, you'll find a basic webui at `http://localhost:<port>`

or you can try the live demo:

## Demo

http://node-load-tester.herokuapp.com

*Note: free heroku instances have bandwidth caps* 

## Basic Example

We'll target `http://echo.jpillora.com`, run the following sequence:
 * GET `/` (home) and expect a `200`
 * Then POST `/api/login` with creds and expect a `200`
 * Then confirm that we just logged in (`/test/user` and check it's `200`)
 * Then we'll logout
 * Finally we'll confirm that we just logged out (`/test/user` and check it's **`404`**)

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

Since `http://echo.jpillora.com` is just an echo server, it didn't actually login,
so the second `/test/user` still responded with 200, which is seen as a failure:

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

## API

`POST /job`

Create a load test `Job`

### `Job` Object Properties

* `baseUrl` (String) - Target URL
* `baseUrls` (Array[String]) - Target URLs
* `headers` (Object) - Header/Value pairs to apply to all `Request`s
* `runs` (Number) - Number of times to run through the `sequence`
* `duration` (Number) - Keep running through the `sequence` for `duration`ms
* `connections` (Number) - Number of HTTP clients (each will run through the `sequence`)
* `sequence` (Array[`Request`]) - The sequence of `Request`s to execute (a new cookie jar is created per sequence)

### `Request` Object Properties

* `method` (String) - HTTP Method to use (default:`"GET"`)
* `path` (String) - URL Path to be appended to `baseUrl`
* `headers` (Object) - Header/Value pairs to apply to this `Request` (overrides `Job` `headers`)
* `form` (Object) - Object to application/form encode
* `forms` (Array[Object]) - Round-robin through objects to application/form encode
* `expect` (Object) - Expectation definition object
    * `code` (Number) - Expect a particular HTTP status code **(default:200)**
    * `contains` (String) - Expect the HTTP body to contain
    * `match` (String) - Expect the HTTP body to match `new RegExp(match)`
  
**Note:** There must be **one** `expect`ation

**Note:** Failed expections are accumulated in the results, e.g:
``` json
"errors": {
  "expected code: 404 got: 200 (for GET /test/user)": 2
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

*Every request will round-robin through the `baseUrls`*

*Requests may also specify a `header` object which will override the job's `header` object*

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
