'use strict'
const fs = require('fs')
const readline = require('readline')
const chalk = require('chalk')

let autosaver = {status: false}
let liveMode = {status: false}
let tasks = []
let readInterface = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

const header = chalk.bold.white.bgRed
const descriptionStyle = chalk.green
const shortcutStyle = chalk.bgBlue.white
const infoStyle = chalk.bgYellow.black
const warningStyle = chalk.yellow
const successStyle = chalk.bgGreen.white
const questionStyle = chalk.gray

const log = console.log
const thickHorizontalLine = '━'

readInterface.on('line', (str) => {
  if (str !== 'l' && liveMode.status === true) {
    log(warningStyle('Livefeed is on, commands are disabled. Disable with l and enter'))
  } else {
    clearAndDisplayHelpAndTasks(tasks)
    handleInput(str)
  }
  readInterface.prompt()
}).on('close', () => {
  log(chalk.inverse('Goodbye'))
  process.exit(0)
})
readInterface.pause()
process.stdin.setRawMode(true)

function displayTasks (tasks) {
  log(header('Tasks'))
  drawTerminalHorizontalLine(thickHorizontalLine)
  tasks.map((task, index) => {
    log(`${chalk.bgYellow.blue(index)}. ${chalk.green(task.name)} - ${chalk.cyan(task.time)}`)
    drawTerminalHorizontalLine(thickHorizontalLine)
  })
}

function intervalFunc (index) {
  tasks[index].time += 1
}

function stopRunningTimerInTask (task) {
  clearInterval(task.timer)
  if (!task.timer._onTimeout) {
    task.timerRunning = !task.timerRunning
    log(successStyle(`Stopped timer for task ${task.name}`))
  } else {
    log(warningStyle(`Problem stopping timer for task ${task.name}`))
  }
  return task
}

function stopRunningTaskTimers (tasks) {
  return tasks.map(task => {
    if (task.timerRunning) {
      task = stopRunningTimerInTask(task)
    }
    return task
  })
}

function addTask () {
  tasks = stopRunningTaskTimers(tasks)
  readInterface.question(questionStyle('Enter task name: '), name => {
    const index = tasks.push({'name': name, 'time': 0, 'timerRunning': true, 'notes': []}) - 1
    tasks[index].timer = setInterval(intervalFunc, 1000, index)
    clearAndDisplayHelpAndTasks(tasks)
  })
}

function stopAllTasks (tasks) {
  clearAndDisplayHelpAndTasks(tasks)
  tasks = stopRunningTaskTimers(tasks)
  log(successStyle('Finished stopping timers.'))
}

function applyToTaskByIndex (tasks, index, method, ...args) {
  let task = findTaskByIndex(index, tasks)
  if (task) {
    task = method(task, ...args)
    clearAndDisplayHelpAndTasks(tasks)
  }
  return tasks
}

function findTaskByIndex (taskIndex, tasks) {
  let task = tasks[taskIndex]
  if (task) {
    return task
  } else {
    log(warningStyle(`No task found for index ${taskIndex}`))
  }
}

function setTaskTime () {
  readInterface.question(questionStyle('Give the index number of the task to set time for: '), taskIndex => {
    readInterface.question(questionStyle('Give time for task in seconds: '), time => {
      applyToTaskByIndex(tasks, taskIndex, setTimeFor, parseInt(time))
    })
  })
}

function setTimeFor (task, time) {
  task.time = time
  return task
}

function resumeTask () {
  readInterface.question(questionStyle('Give the index number of the task to resume timing: '), taskIndex => {
    let task = findTaskByIndex(taskIndex, tasks)
    if (task) {
      const running = task.timerRunning
      const taskName = task.name
      if (!running) {
        task.timerRunning = !running
        task.timer = setInterval(intervalFunc, 1000, taskIndex)
        clearAndDisplayHelpAndTasks(tasks)
        log(successStyle(`Resumed task ${taskName}`))
      } else {
        log(warningStyle(`Timer already running for ${taskName}`))
      }
    }
  })
}

function addNote () {
  readInterface.question(questionStyle('Give the index number of the task to add a note to: '), taskIndex => {
    let task = findTaskByIndex(taskIndex, tasks)
    if (task) {
      const taskName = task.name
      readInterface.question(questionStyle('Write the note to add to the task {0}: ').format(taskName), note => {
        task.notes.push(note)
        clearAndDisplayHelpAndTasks(tasks)
        log(successStyle(`Task ${taskName} now has notes:`))
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

function displayReport (tasks) {
  clearAndDisplayHelpAndTasks(tasks)
  tasks.map(task => {
    log(header('Task:'))
    log(taskNameStyle(task.name))
    log(rowHeaderStyle(`Time taken: ${timeStyle(secondsToHours(task.time))}`))
    log(rowHeaderStyle('Notes:'))
    task.notes.map(note => {
      log(noteStyle(note))
    })
    drawTerminalHorizontalLine(thickHorizontalLine)
  })
}

function deleteTask () {
  readInterface.question(questionStyle('Give the index number of the task to delete: '), taskIndex => {
    let task = findTaskByIndex(taskIndex, tasks)
    if (task) {
      const taskName = task.name
      log(warningStyle(`Deleting task ${taskName}`))
      readInterface.question(chalk.bgRed.black('Are you sure? y/n: '), response => {
        if (response === 'y') {
          clearInterval(task.timer)
          delete tasks[taskIndex]
          clearAndDisplayHelpAndTasks(tasks)
          log(successStyle(`Task ${taskName} deleted!`))
        } else {
          log(warningStyle('Task delete aborted.'))
        }
      })
    }
  })
}

function saveTasksToFile (filename) {
  const stringTasks = tasks.filter(task => task !== (undefined || null || '')).map(task => {
    let timerlessTask = task
    delete timerlessTask.timer
    return JSON.stringify(timerlessTask)
  })
  fs.writeFile(`./${filename}`, stringTasks, (error) => {
    if (error) {
      return console.log(error)
    }
    clearAndDisplayHelpAndTasks(tasks)
    return log(successStyle(`Currents tasks saved as a file: ${filename}`))
  })
}

function writeTasks () {
  readInterface.question('What is the filename to write to? ', filename => {
    saveTasksToFile(filename)
  })
}

function autosave () {
  const filename = `autosave${Date.now()}`
  saveTasksToFile(filename)
}

function switchAutosave () {
  autosaver.status = !autosaver.status
  if (autosaver.status) {
    readInterface.question(questionStyle('What is the autosave interval in milliseconds (30000ms = 30s)? '), interval => {
      autosaver.timer = setInterval(autosave, interval)
    })
  } else {
    clearInterval(autosaver.timer)
  }

  clearAndDisplayHelpAndTasks(tasks)
}

const userInputs = {
  'a': {description: 'Start tracking a new task.', command: () => addTask()},
  'r': {description: 'Resumes a timer on a task.', command: () => resumeTask()},
  's': {description: 'Stops all timers. ', command: tasks => stopAllTasks(tasks)},
  'n': {description: 'Adds a note to a task.', command: () => addNote()},
  'p': {description: 'Prints a task report of time taken with notes.', command: tasks => displayReport(tasks)},
  'd': {description: 'Deletes a task.', command: () => deleteTask()},
  'w': {description: 'Save tasks to a file.', command: () => writeTasks()},
  't': {description: 'Set time for task.', command: () => setTaskTime()},
  'l': {description: 'Shows live feed of tasks.', command: tasks => switchLiveFeed(tasks)},
  'as': {description: 'Starts autosaving at given interval.', command: () => switchAutosave()}}

function listAvailableCommands (commands) {
  log(header('Available commands'))
  drawTerminalHorizontalLine(thickHorizontalLine)
  for (var commandKey in commands) {
    if (userInputs.hasOwnProperty(commandKey)) {
      const shortcut = shortcutStyle(`${commandKey}`)
      const description = descriptionStyle(commands[commandKey].description)
      log(shortcut + ' ' + description)
    }
  }
}

function clearScreen () {
  console.log('\u001B[2J\u001B[0;0f')
}

function displayAutosaveStatus () {
  const status = autosaver.status ? chalk.green.bgBlack(' on') : chalk.red.bgBlack(' off')
  log(infoStyle(`Autosave status:${status}`))
  drawTerminalHorizontalLine(thickHorizontalLine)
}

function clearAndDisplayHelpAndTasks (tasks) {
  clearScreen()
  listAvailableCommands(userInputs)
  drawTerminalHorizontalLine(thickHorizontalLine)
  displayAutosaveStatus()
  displayTasks(tasks)
}

function drawTerminalHorizontalLine (marker) {
  let horizontalLine = ''
  for (let i = 0; i < process.stdout.columns; i++) {
    horizontalLine += marker
  }
  log(horizontalLine)
}

function liveFeed (tasks) {
  clearScreen()
  log(header('!Livefeed! Press l and enter to return to normal mode.'))
  tasks.map(task => {
    drawTerminalHorizontalLine(thickHorizontalLine)
    log(rowHeaderStyle(`Task name: ${taskNameStyle(task.name)}`))
    log(rowHeaderStyle(`Time taken: ${timeStyle(secondsToHours(task.time))}`))
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

function switchLiveFeed (tasks) {
  if (tasks.length > 0) {
    liveMode.status = !liveMode.status
    if (liveMode.status) {
      liveMode.timer = setInterval(liveFeed, 1000, tasks)
    } else {
      clearInterval(liveMode.timer)
      clearAndDisplayHelpAndTasks(tasks)
    }
  } else {
    log(warningStyle('No tasks found! Please add some by typing a and hitting enter!'))
  }
}

function handleInput (str) {
  if (userInputs[str]) {
    const command = userInputs[str]
    log(successStyle(`Running command "${command.description}"`))
    command.command(tasks)
  } else {
    log(warningStyle(`No command found for "${str}"`))
  }
}

function runManager () {
  readInterface.resume()
  clearAndDisplayHelpAndTasks(tasks)
  readInterface.prompt()
}

module.exports = {runManager: () => runManager(),
  stopRunningTaskTimers: tasks => stopRunningTaskTimers(tasks),
  stopRunningTimerInTask: task => stopRunningTimerInTask(task),
  secondsToHours: () => secondsToHours(),
  setTimeFor: (task, time) => setTimeFor(task, time),
  applyToTaskByIndex: (tasks, index, method, args) => applyToTaskByIndex(tasks, index, method, args),
  findTaskByIndex: (index, tasks) => findTaskByIndex(index, tasks)}
