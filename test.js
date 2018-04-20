/* global describe it */
'use strict'

let should = require('chai').should()
let app = require('./app.js')
/*
describe('Test stopRunningTaskTimers', () => {
  it('stopping timers should reverse timerRunning', () => {
    const tasks = [{timer: setInterval(() => {}), timerRunning: true}]
    const stoppedTasks = app.stopRunningTaskTimers(tasks)
    stoppedTasks[0].timerRunning.should.equal(false)
  })
  it('stopping timers should clear task timer when timerRunning is true', () => {
    let tasks = [{timer: setInterval(() => {}), timerRunning: true}]
    app.stopRunningTaskTimers(tasks).map(task => {
      should.equal(task.timer._onTimeout, null)
    })
  })
})
*/
describe('Test stopRunningTimerInTask', () => {
  it('reverses timerRunning in task', () => {
    let task = {timer: setInterval(task => { clearInterval(task.timer) }), timerRunning: true}
    app.stopRunningTimerInTask(task).timerRunning.should.equal(false)
  })
  it('clears timer in task', () => {
    should.equal(app.stopRunningTimerInTask(
      {timer: setInterval(() => {}),
        timerRunning: true}).timer._onTimeout, null)
  })
})

describe('Test setTimeFor', () => {
  it('setTimeFor(task) results in task having given time', () => {
    let task = {time: 10}
    app.setTimeFor(task, 5).time.should.equal(5)
    app.setTimeFor(task, 12).time.should.equal(12)
  })
  it('setTimeFor(task) sets a number as the time', () => {
    let task = {time: 10}
    app.setTimeFor(task, 12).time.should.be.a('number')
  })
})

describe('Test applyToTaskByIndex', () => {
  it('applyToTaskByIndex applies given function to found task by given index number', () => {
    let tasks = [{time: 0}, {time: 5}, {time: 10}]
    JSON.stringify(app.applyToTaskByIndex(tasks, 1, app.setTimeFor, 20))
      .should.equal(JSON.stringify([{time: 0}, {time: 20}, {time: 10}]))
    JSON.stringify(app.applyToTaskByIndex(tasks, 2, app.setTimeFor, 30))
      .should.equal(JSON.stringify([{time: 0}, {time: 20}, {time: 30}]))
  })
})

describe('Test findTaskByIndex', () => {
  let tasks = [{time: 0}, {time: 5}]
  it('findTaskByIndex returns the correct task', () => {
    app.findTaskByIndex(1, tasks).time.should.equal(5)
  })
  it('findTaskByIndex returns undefined when task not found', () => {
    should.equal(undefined, app.findTaskByIndex(2, tasks))
  })
})

describe('Test tasksExist', () => {
  it('taskExists returns false for empty tasks array', () => {
    app.tasksExist([]).should.equal(false)
  })
  it('taskExists returns true for non-empty tasks array', () => {
    app.tasksExist([{name: 'doing things'}]).should.equal(true)
  })
})

describe('Test taskTimersActive', () => {
  it('taskTimersActive returns false when tasks have no timers running', () => {
    app.taskTimersActive([stoppedTask()]).should.equal(false)
  })

  it('taskTimersActive returns true when one task has a timer running', () => {
    app.taskTimersActive([timerTask()]).should.equal(true)
  })

  it('taskTimersActive returns true when several tasks have timers running', () => {
    app.taskTimersActive(
      [timerTask(),
        timerTask()]).should.equal(true)
  })
})

describe('Test isTaskTimerRunning', () => {
  it('isTaskTimerRunning return false when task has no running timer', () => {
    (app.isTaskTimerRunning(stoppedTask())).should.equal(false)
  })
  it('isTaskTimerRunning return true when task has a running timer', () => {
    app.isTaskTimerRunning(timerTask()).should.equal(true)
  })
})

function timerTask () {
  return {timer: {_onTimeout: () => {}}, timerRunning: true}
}

function stoppedTask () {
  let task = {timer: setInterval(task => { clearInterval(task.timer) }), timerRunning: true}
  clearInterval(task.timer)
  return task
}
