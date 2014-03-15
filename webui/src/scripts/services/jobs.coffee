App.factory 'jobs', ($rootScope, $http, $q, $timeout) ->

  jobs = window.jobs = $rootScope.$new true

  jobIndex = null

  poll = ->
    if typeof jobIndex isnt 'number'
      return
    $http.get('/job/'+jobIndex).
      success((job) ->
        if job.finished
          jobIndex = null
          jobs.$emit 'finished', job
        else
          jobs.$emit 'progress', job
          $timeout poll, 1000
      ).
      error((err) ->
        console.error err
        jobs.$emit 'error', err
      )

  jobs.run = (data) ->
    if jobIndex isnt null
      return
    $http.post('/job', data).
      success((job) ->
        jobIndex = job.index
        jobs.$emit 'started', job.index
        poll()
      ).
      error((err) ->
        console.error "job error", err
        jobs.$emit 'error', err
      )

  jobs.stop = ->
    if jobIndex is null
      return
    $http.delete('/job/'+jobIndex).
      success((job) ->
        console.log 'stopped job',jobIndex
        jobs.$emit 'cancelled', job
      ).
      error((err) ->
        console.error "job error", err
        jobs.$emit 'error', err
      )

  jobs

