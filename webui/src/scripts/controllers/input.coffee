App.controller 'Input', ($scope, jobs) ->

  scope = window.sc = $scope

  scope.methods = [
    "GET"
    "POST"
    "PUT"
    "DELETE"
  ]

  scope.expects =
    status: "Status Code"
    contains: "Body Contains"
    match: "Body Matches"

  input = scope.input =
    origin: 'http://echo.jpillora.com'
    duration: 5000
    runs: undefined
    connections: 1
    sequence: [
      { method: "GET", path: '/' },
      {}
    ]

  scope.check = (arr, fields...) ->
    spare = -1
    hasAll = true
    for obj, i in arr
      missingOne = false
      for f in fields
        unless obj[f]
          missingOne = true
          break
      if missingOne
        spare = i unless hasAll
        hasAll = false
    if hasAll #add one...
      arr.push {}
    else if not hasAll and spare >= 1 #remove one...
      arr.splice spare, 1
    return

  copy = (src) ->
    if typeof src isnt "object"
      return src
    dst = if src instanceof Array then [] else {}
    #copy object, skip angulars and functions
    for k,v of src
      if /^\$/.test k
        continue
      else if typeof v is "function"
        continue
      else if typeof v is "object"
        #skip empty objects
        v = copy v
        dst[k] = v if Object.keys(v).length > 0
      else if typeof v is "string" and /^\d+(\.\d+)?$/.test v
        dst[k] = parseFloat v
      else
        dst[k] = v

    #convert {"key": ... "value": ... } into {key:value}
    if dst instanceof Array
      obj = {}
      keyVal = true
      for o in dst
        if o.key and o.value
          obj[o.key] = o.value
        else
          keyVal = false
      if keyVal
        dst = obj

    return dst

  scope.getInput = ->
    copy input

  scope.start = ->
    return if scope.loading
    data = scope.getInput()
    scope.loading = true
    jobs.run(data)

  scope.stop = ->
    return unless scope.loading and scope.polling
    jobs.stop()

  jobs.$on 'started', ->
    scope.polling = true
  jobs.$on 'cancelled', ->
    scope.polling = false
  jobs.$on 'finished', ->
    scope.polling = false
    scope.loading = false


  return
