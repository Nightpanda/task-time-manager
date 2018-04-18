'use strict'

let should = require('chai').should()
let app = require('./app.js')

describe('Test stopRunningTaskTimers', () => {
    it('stopping timers should reverse timerRunning', () => {
        let tasks = [{timerRunning: true}]
        JSON.stringify(app.stopRunningTaskTimers(tasks))
            .should.equal(JSON.stringify([{timerRunning: false}]))
    })
    it('stopping timers should clear task timer when timerRunning is true', () => {
        let tasks = [{timer: setInterval(() => {}), timerRunning: true}]
        app.stopRunningTaskTimers(tasks).map(task => {
            should.equal(task.timer._onTimeout, null)
        })
    })
})

describe('Test setTimeFor', () => {
    it('setTimeFor(task) results in task having given time', () => {
        let task = {time: 10}
        app.setTimeFor(task, 5).time.should.equal(5)
        app.setTimeFor(task, 12).time.should.equal(12)
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
    let tasks = [{time: 0},  {time: 5}]
    it('findTaskByIndex returns the correct task', () => {
        app.findTaskByIndex(1, tasks).time.should.equal(5)
    })
    it('findTaskByIndex returns undefined when task not found', () => {
        should.equal(undefined, app.findTaskByIndex(2, tasks))
    })
})
