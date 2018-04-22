'use strict'

const log = console.log
const styles = require('./styles.js')
const app = require('./app.js')
const interfaces = require('./interface.js')

exports.stopRunningTimerInTask = (task) => {
  clearInterval(task.timer)
  if (!this.isTaskTimerRunning(task)) {
    task.timerRunning = !task.timerRunning
    log(styles.successStyle(`Stopped timer for task ${task.name}`))
  } else {
    log(styles.warningStyle(`Problem stopping timer for task ${task.name}`))
  }
  return task
}

exports.stopRunningTaskTimers = (taskList) => {
  return taskList.map(task => {
    if (task.timerRunning) {
      task = this.stopRunningTimerInTask(task)
    }
    return task
  })
}

function intervalFunc (index, taskList) {
  taskList[index].time += 1
}

exports.createTask = name => {
  return {'name': name, 'time': 0, 'timerRunning': true, 'notes': []}
}

exports.addTaskToList = (taskList, name) => {
  const index = taskList.push(this.createTask(name)) - 1
  taskList[index].timer = setInterval(intervalFunc, 1000, index, taskList)
  return taskList
}

exports.addTask = (taskList, readInterface) => {
  taskList = this.stopRunningTaskTimers(taskList)
  interfaces.askQuestion(readInterface, 'Enter task name: ', (name) => {
    taskList = this.addTaskToList(taskList, name)
    app.setTaskList(taskList)
    app.clearAndDisplayHelpAndTasks(taskList)
  })
}

exports.stopAllTasks = (tasks) => {
  app.clearAndDisplayHelpAndTasks(tasks)
  tasks = this.stopRunningTaskTimers(tasks)
  log(styles.successStyle('Finished stopping timers.'))
}

exports.applyToTaskByIndex = (taskList, index, method, ...args) => {
  let task = this.findTaskByIndex(index, taskList)
  if (task) {
    task = method(task, ...args)
  }
  return taskList
}

exports.findTaskByIndex = (taskIndex, tasks) => {
  let task = tasks[taskIndex]
  if (task) {
    return task
  } else {
    log(styles.warningStyle(`No task found for index ${taskIndex}`))
  }
}

exports.setTaskTime = (taskList, readInterface) => {
  readInterface.question(styles.questionStyle('Give the index number of the task to set time for: '), taskIndex => {
    readInterface.question(styles.questionStyle('Give time for task in seconds: '), time => {
      this.applyToTaskByIndex(taskList, taskIndex, this.setTimeFor, parseInt(time))
      app.clearAndDisplayHelpAndTasks(taskList)
    })
  })
}

exports.setTimeFor = (task, time) => {
  task.time = time
  return task
}

exports.isTaskTimerRunning = (task) => {
  if (task.timer) {
    if (task.timer._onTimeout) {
      return true
    } else {
      return false
    }
  } else {
    return false
  }
}

exports.tasksExist = (taskList) => {
  if (!taskList) return false
  return taskList.length > 0
}

exports.taskTimersActive = (taskList) => {
  if (this.tasksExist(taskList)) {
    return taskList.map(task => {
      return this.isTaskTimerRunning(task)
    }).some(status => status)
  } else {
    return false
  }
}

exports.resumeTask = (taskList, readInterface) => {
  readInterface.question(styles.questionStyle('Give the index number of the task to resume timing: '), taskIndex => {
    let task = this.findTaskByIndex(taskIndex, taskList)
    if (task) {
      const running = task.timerRunning
      const taskName = task.name
      if (!running) {
        task.timerRunning = !running
        task.timer = setInterval(intervalFunc, 1000, taskIndex, taskList)
        app.clearAndDisplayHelpAndTasks(taskList)
        log(styles.successStyle(`Resumed task ${taskName}`))
      } else {
        log(styles.warningStyle(`Timer already running for ${taskName}`))
      }
    }
  })
}

exports.deleteTask = (taskList, readInterface) => {
  readInterface.question(styles.questionStyle('Give the index number of the task to delete: '), taskIndex => {
    let task = this.findTaskByIndex(taskIndex, taskList)
    if (task) {
      const taskName = task.name
      log(styles.warningStyle(`Deleting task ${taskName}`))
      readInterface.question(styles.confirmationStyle('Are you sure? y/n: '), response => {
        if (response === 'y') {
          let stoppedTask = this.stopRunningTimerInTask(task)
          if (this.isTaskTimerRunning(stoppedTask)) {
            log(styles.warningStyle(`Couldn't stop ${taskName}. Try again.`))
          } else {
            delete taskList[taskIndex]
            app.clearAndDisplayHelpAndTasks(taskList)
            app.setTaskList(taskList)
            log(styles.successStyle(`Task ${taskName} deleted!`))
          }
        } else {
          log(styles.warningStyle('Task delete aborted.'))
        }
      })
    }
  })
}
