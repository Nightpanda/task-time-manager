'use strict'
const fs = require('fs')
const chalk = require('chalk')
const tasks = require('./tasks.js')
const styles = require('./styles.js')
const interfaces = require('./interface.js')

let autosaver = {status: false}
let liveMode = {status: false}
let taskList = []

const log = console.log
const thickHorizontalLine = '━'

const readInterface = interfaces.createReadInterface()

readInterface.on('line', (str) => {
  if (str !== 'l' && liveMode.status === true) {
    log(styles.warningStyle('Livefeed is on, commands are disabled. Disable with l and enter'))
  } else {
    this.clearAndDisplayHelpAndTasks(taskList)
    handleInput(str)
  }
  readInterface.prompt()
}).on('close', () => {
  quit()
})
readInterface.pause()
process.stdin.setRawMode(true)

function displayTasks (taskList) {
  log(styles.header('Tasks'))
  drawTerminalHorizontalLine(thickHorizontalLine)
  taskList.map((task, index) => {
    log(`${chalk.bgYellow.blue(index)}. ${chalk.green(task.name)} - ${chalk.cyan(task.time)}`)
    drawTerminalHorizontalLine(thickHorizontalLine)
  })
}

exports.addNote = (taskList, readInterface) => {
  readInterface.question(styles.questionStyle('Give the index number of the task to add a note to: '), taskIndex => {
    let task = tasks.findTaskByIndex(taskIndex, taskList)
    if (task) {
      const taskName = task.name
      readInterface.question(styles.questionStyle(`Write the note to add to the task ${taskName}: `), note => {
        task.notes.push(note)
        this.clearAndDisplayHelpAndTasks(taskList)
        log(styles.successStyle(`Task ${taskName} now has notes:`))
        task.notes.map(taskNote => log(noteStyle(taskNote)))
      })
    }
  })
}

function secondsToHours (seconds) {
  return Math.round((seconds / 3600) * 100) / 100
}

const taskNameStyle = chalk.green
const timeStyle = chalk.cyan.bgBlack
const noteStyle = chalk.magenta
const rowHeaderStyle = chalk.red

exports.displayReport = (taskList) => {
  this.clearAndDisplayHelpAndTasks(taskList)
  taskList.map(task => {
    log(styles.header('Task:'))
    log(taskNameStyle(task.name))
    log(rowHeaderStyle(`Time taken: ${timeStyle(secondsToHours(task.time))} h`))
    log(rowHeaderStyle('Notes:'))
    task.notes.map(note => {
      log(noteStyle(note))
    })
    drawTerminalHorizontalLine(thickHorizontalLine)
  })
}

exports.saveTasksToFile = (taskList, filename) => {
  const stringTasks = taskList.filter(task => task !== (undefined || null || '')).map(task => {
    let timerlessTask = task
    delete timerlessTask.timer
    return JSON.stringify(timerlessTask)
  })
  fs.writeFile(`./${filename}`, stringTasks, (error) => {
    if (error) {
      return console.log(error)
    }
    this.clearAndDisplayHelpAndTasks(taskList)
    return log(styles.successStyle(`Currents tasks saved as a file: ${filename}`))
  })
}

exports.writeTasks = (taskList, readInterface) => {
  readInterface.question('What is the filename to write to? ', filename => {
    this.saveTasksToFile(taskList, filename)
  })
}

exports.autosave = (taskList) => {
  const filename = `autosave${Date.now()}`
  this.saveTasksToFile(taskList, filename)
}

exports.switchAutosave = (taskList, readInterface) => {
  autosaver.status = !autosaver.status
  if (autosaver.status) {
    readInterface.question(styles.questionStyle('What is the autosave interval in milliseconds (30000ms = 30s)? '), interval => {
      autosaver.timer = setInterval(this.autosave, interval, taskList)
    })
  } else {
    clearInterval(autosaver.timer)
  }

  this.clearAndDisplayHelpAndTasks(taskList)
}

function quit () {
  log(chalk.inverse('Goodbye'))
  process.exit(0)
}

function confirmQuit (taskList, readInterface) {
  if (tasks.taskTimersActive(taskList)) {
    log(styles.warningStyle('There are still running timers on tasks!'))
    readInterface.question(styles.questionStyle('Are you sure you want to quit? y/n: '), answer => {
      if (answer === 'y') {
        quit()
      } else {
        readInterface.prompt()
      }
    })
  } else {
    quit()
  }
}

const userInputs = {
  'a': {description: 'Start tracking a new task.', command: (taskList, readInterface) => tasks.addTask(taskList, readInterface)},
  'r': {description: 'Resumes a timer on a task.', command: (taskList, readInterface) => tasks.resumeTask(taskList, readInterface)},
  's': {description: 'Stops all timers. ', command: taskList => tasks.stopAllTasks(taskList)},
  'n': {description: 'Adds a note to a task.', command: (taskList, readInterface) => this.addNote(taskList, readInterface)},
  'p': {description: 'Prints a task report of time taken with notes.', command: taskList => this.displayReport(taskList)},
  'd': {description: 'Deletes a task.', command: (taskList, readInterface) => tasks.deleteTask(taskList, readInterface)},
  'w': {description: 'Save tasks to a file.', command: (taskList, readInterface) => this.writeTasks(taskList, readInterface)},
  't': {description: 'Set time for task.', command: (taskList, readInterface) => tasks.setTaskTime(taskList, readInterface)},
  'l': {description: 'Shows live feed of tasks.', command: taskList => this.switchLiveFeed(taskList)},
  'as': {description: 'Starts autosaving at given interval.', command: (taskList, readInterface) => this.switchAutosave(taskList, readInterface)},
  'q': {description: 'Quit and confirm if tasks are running.', command: taskList => confirmQuit(taskList, readInterface)}}

function listAvailableCommands (commands) {
  log(styles.header('Available commands'))
  drawTerminalHorizontalLine(thickHorizontalLine)
  for (var commandKey in commands) {
    if (userInputs.hasOwnProperty(commandKey)) {
      const shortcut = styles.shortcutStyle(`${commandKey}`)
      const description = styles.descriptionStyle(commands[commandKey].description)
      log(shortcut + ' ' + description)
    }
  }
}

function clearScreen () {
  console.log('\u001B[2J\u001B[0;0f')
}

function displayAutosaveStatus () {
  const status = autosaver.status ? chalk.green.bgBlack(' on') : chalk.red.bgBlack(' off')
  log(styles.infoStyle(`Autosave status:${status}`))
  drawTerminalHorizontalLine(thickHorizontalLine)
}

exports.clearAndDisplayHelpAndTasks = (taskList) => {
  clearScreen()
  listAvailableCommands(userInputs)
  drawTerminalHorizontalLine(thickHorizontalLine)
  displayAutosaveStatus()
  if (taskList) displayTasks(taskList)
}

function drawTerminalHorizontalLine (marker) {
  let horizontalLine = ''
  for (let i = 0; i < process.stdout.columns; i++) {
    horizontalLine += marker
  }
  log(horizontalLine)
}

function liveFeed (taskList) {
  clearScreen()
  log(styles.header('!Livefeed! Press l and enter to return to normal mode.'))
  taskList.map(task => {
    drawTerminalHorizontalLine(thickHorizontalLine)
    log(rowHeaderStyle(`Task name: ${taskNameStyle(task.name)}`))
    log(rowHeaderStyle(`Time taken: ${timeStyle(secondsToHours(task.time))} h`))
    const notes = task.notes
    if (notes.length > 0) {
      log(rowHeaderStyle('Notes: '))
      notes.map(note => {
        log(noteStyle(`* ${note}`))
      })
    }
    drawTerminalHorizontalLine(thickHorizontalLine)
  })
}

exports.switchLiveFeed = (taskList) => {
  if (taskList.length > 0) {
    liveMode.status = !liveMode.status
    if (liveMode.status) {
      liveMode.timer = setInterval(liveFeed, 1000, taskList)
    } else {
      clearInterval(liveMode.timer)
      this.clearAndDisplayHelpAndTasks(taskList)
    }
  } else {
    log(styles.warningStyle('No tasks found! Please add some by typing a and hitting enter!'))
  }
}

exports.setTaskList = (newTaskList) => {
  taskList = newTaskList
}

function handleInput (str) {
  if (userInputs[str]) {
    const command = userInputs[str]
    log(styles.successStyle(`Running command "${command.description}"`))
    command.command(taskList, readInterface)
  } else {
    log(styles.warningStyle(`No command found for "${str}"`))
  }
}

exports.runManager = () => {
  if (!taskList) {
    taskList = []
  }
  readInterface.resume()
  this.clearAndDisplayHelpAndTasks(taskList)
  readInterface.prompt()
}

module.exports = {
  runManager: () => this.runManager(),
  secondsToHours: () => secondsToHours(),
  taskList: taskList}
