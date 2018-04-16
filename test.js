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
