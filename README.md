# node-<name>load-tester</end>

## Summary

<description>A load testing server</end>

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

Visit `http://localhost:3000`

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
