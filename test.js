/* global describe it */
'use strict'

const should = require('chai').should()
const tasks = require('./tasks.js')
const readInterface = require('./interface.js')

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
    tasks.stopRunningTimerInTask(task).timerRunning.should.equal(false)
  })
  it('clears timer in task', () => {
    should.equal(tasks.stopRunningTimerInTask(
      {timer: setInterval(() => {}),
        timerRunning: true}).timer._onTimeout, null)
  })
})

describe('Test setTimeFor', () => {
  it('setTimeFor(task) results in task having given time', () => {
    let task = {time: 10}
    tasks.setTimeFor(task, 5).time.should.equal(5)
    tasks.setTimeFor(task, 12).time.should.equal(12)
  })
  it('setTimeFor(task) sets a number as the time', () => {
    let task = {time: 10}
    tasks.setTimeFor(task, 12).time.should.be.a('number')
  })
})

describe('Test applyToTaskByIndex', () => {
  it('applyToTaskByIndex applies given function to found task by given index number', () => {
    let taskList = [{time: 0}, {time: 5}, {time: 10}]
    JSON.stringify(tasks.applyToTaskByIndex(taskList, 1, tasks.setTimeFor, 20))
      .should.equal(JSON.stringify([{time: 0}, {time: 20}, {time: 10}]))
    JSON.stringify(tasks.applyToTaskByIndex(taskList, 2, tasks.setTimeFor, 30))
      .should.equal(JSON.stringify([{time: 0}, {time: 20}, {time: 30}]))
  })
})

describe('Test findTaskByIndex', () => {
  let taskList = [{time: 0}, {time: 5}]
  it('findTaskByIndex returns the correct task', () => {
    tasks.findTaskByIndex(1, taskList).time.should.equal(5)
  })
  it('findTaskByIndex returns undefined when task not found', () => {
    should.equal(undefined, tasks.findTaskByIndex(2, taskList))
  })
})

describe('Test tasksExist', () => {
  it('taskExists returns false for empty tasks array', () => {
    tasks.tasksExist([]).should.equal(false)
  })
  it('taskExists returns true for non-empty tasks array', () => {
    tasks.tasksExist([{name: 'doing things'}]).should.equal(true)
  })
})

describe('Test taskTimersActive', () => {
  it('taskTimersActive returns false when tasks have no timers running', () => {
    tasks.taskTimersActive([stoppedTask()]).should.equal(false)
  })

  it('taskTimersActive returns true when one task has a timer running', () => {
    tasks.taskTimersActive([timerTask()]).should.equal(true)
  })

  it('taskTimersActive returns true when several tasks have timers running', () => {
    tasks.taskTimersActive(
      [timerTask(),
        timerTask()]).should.equal(true)
  })

  it('taskTimersActive skips deleted tasks.', () => {
    let taskList = [stoppedTask, stoppedTask, timerTask()]
    delete taskList[0]
    tasks.taskTimersActive(taskList).should.equal(true)
  })
})

describe('Test isTaskTimerRunning', () => {
  it('isTaskTimerRunning return false when task has no running timer', () => {
    (tasks.isTaskTimerRunning(stoppedTask())).should.equal(false)
  })
  it('isTaskTimerRunning return true when task has a running timer', () => {
    tasks.isTaskTimerRunning(timerTask()).should.equal(true)
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

describe('Test interface.js', () => {
  let newReadInterface = readInterface.createReadInterface()
  describe('Test createReadInterface', () => {
    it('createReadInterface returns new readline Interface', () => {
      newReadInterface.should.be.an('object')
    })
    newReadInterface.close()
  })
})

describe('Test createTask', () => {
  let newTask = tasks.createTask('Weird Task')
  it('created task has wanted properties and name', () => {
    newTask.should.be.a('object')
    newTask.name.should.equal('Weird Task')
    newTask.time.should.equal(0)
    newTask.timerRunning.should.equal(true)
    newTask.notes.should.be.a('array')
    newTask.notes.should.have.length(0)
  })
})

describe('Test addTaskToList', () => {
  let taskList = []
  const newList = tasks.addTaskToList(taskList, 'Task of Destiny')
  it('addTaskToList adds a new task to a list', () => {
    newList.should.have.length(1)
  })
  it('a new timer is activated for added task', () => {
    newList[0].timer.should.be.an('object')
    should.not.equal(null, newList[0].timer._onTimeout)
    clearInterval(newList[0].timer)
  })
})
