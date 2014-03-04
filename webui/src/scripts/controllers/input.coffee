App.controller 'Input', ($scope, jobs) ->

  scope = window.sc = $scope

  input = scope.input =
    origin: 'http://echo.jpillora.com'
    duration: 5000
    runs: undefined
    connections: 1
    sequence: [
      { method: 'GET', path: '/' }
    ]

  scope.updateSeqence = ->
    spare = -1
    full = true
    for h, i in input.sequence
      if not h.method or not h.path
        spare = i unless full
        full = false
    if full #add one...
      input.sequence.push {}
    else if not full and spare >= 1 #remove one...
      input.sequence.splice spare, 1  
  #init
  scope.updateSeqence()

  scope.getInput = ->
    copy = _.merge {}, input
    copy.sequence = []
    input.sequence.forEach (seq) ->
      if seq.method and seq.path
        s = {}
        for k,v of seq
          if /^\$/.test k
            s[k] = v
        copy.sequence.push s
      return
    return copy

  scope.start = ->
    return if scope.loading
    data = scope.getInput()
    scope.loading = true
    jobs.run(data).finally ->
      scope.loading = false

  return
