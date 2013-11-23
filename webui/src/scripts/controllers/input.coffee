App.controller 'Input', ($scope, jobs) ->

  scope = window.sc = $scope

  scope.origin = 'http://echo.jpillora.com'
  scope.duration = 5000
  scope.runs = undefined
  scope.connections = 1
  scope.sequence = [{ method: 'GET', path: '/' }]

  scope.updateSeqence = ->
    spare = -1
    full = true
    for h, i in scope.sequence
      if not h.method or not h.path
        spare = i unless full
        full = false
    if full #add one...
      scope.sequence.push {}
    else if not full and spare >= 1 #remove one...
      scope.sequence.splice spare, 1  

  scope.start = ->
    return if scope.loading

    data = { sequence:[] }
    ['origin', 'duration', 'runs', 'connections'].forEach (k) ->
      data[k] = scope[k]

    for seq in scope.sequence
      if seq.method and seq.path
        data.sequence.push seq

    scope.loading = true
    jobs.run(data).finally ->
      scope.loading = false

  #init
  scope.updateSeqence()

  return
