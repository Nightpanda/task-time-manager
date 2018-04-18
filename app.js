'use strict'
const fs = require('fs')
const readline = require('readline')

if (!String.prototype.format) {
  String.prototype.format = function() {
    var args = arguments;
    return this.replace(/{(\d+)}/g, function(match, number) {
      return typeof args[number] != 'undefined'
        ? args[number]
        : match
      ;
    });
  };
}

let autosaver = {status: false}
let liveMode = {status: false}
let tasks = []
let readInterface = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

readInterface.on('line', (str) => {
    if (str != 'l' && liveMode.status == true) {
        console.log('Livefeed is on, commands are disabled. Disable with l and enter')
    } else {
        clearAndDisplayHelpAndTasks(tasks)
        handleInput(str)
    }
    readInterface.prompt()
}).on('close', () => {
    console.log('Goodbye')
    process.exit(0)
})
readInterface.pause()
process.stdin.setRawMode(true)

function displayTasks(tasks){
    tasks.map((task, index) => {
        console.log('{0}. {1} - {2}'.format(index, task.name, task.time))
    })
}

function intervalFunc(index) {
    tasks[index].time += 1
}

function stopRunningTaskTimers(tasks) {
    return tasks.map(task => {
        if(task.timerRunning) {
            clearInterval(task.timer)
            task.timerRunning = !task.timerRunning
            console.log('Stopped timer for task {0}'.format(task.name))
        }
        return task
    })
}

function addTask() {
    tasks = stopRunningTaskTimers(tasks)
    readInterface.question('Enter task name: ', name => {
        const index = tasks.push({'name': name, 'time': 0, 'timerRunning': true, 'notes': []}) - 1
        tasks[index].timer = setInterval(intervalFunc, 1000, index)
        clearAndDisplayHelpAndTasks(tasks)
    })
}

function stopAllTasks(tasks) {
    clearAndDisplayHelpAndTasks(tasks)
    tasks = stopRunningTaskTimers(tasks)
    console.log("Finished stopping timers.")
}

function applyToTaskByIndex(tasks, index, method, ...args) {
    let task = findTaskByIndex(index, tasks)
    if (task) {
        task = method(task, ...args)
        clearAndDisplayHelpAndTasks(tasks)
    }
    return tasks
}

function findTaskByIndex(taskIndex, tasks) {
    let task = tasks[taskIndex]
    if (task) {
        return task
    } else {
        console.log('No task found for index {0}'.format(taskIndex))
    }
}

function setTaskTime() {
    readInterface.question('Give the index number of the task to set time for: ', taskIndex => {
        readInterface.question('Give time for task in seconds: ', time => {
            applyToTaskByIndex(tasks, taskIndex, setTimeFor, parseInt(time))
        })
    })
}

function setTimeFor(task, time) {
    task.time = time
    return task
}

function resumeTask() {
    readInterface.question('Give the index number of the task to resume timing: ', taskIndex => {
        let task = findTaskByIndex(taskIndex, tasks)
        if (task) {
            const running = task.timerRunning
            const taskName = task.name
            if (!running) {
                task.timerRunning = !running
                task.timer = setInterval(intervalFunc, 1000, taskIndex)
                clearAndDisplayHelpAndTasks(tasks)
                console.log('Resumed task {0}'.format(taskName))
            } else {
                console.log('Timer already running for {0}'.format(taskName))
            }
        }
    })
}

function addNote() {
    readInterface.question('Give the index number of the task to add a note to: ', taskIndex => {
        let task = findTaskByIndex(taskIndex, tasks)
        if (task) {
            const taskName = task.name
            readInterface.question('Write the note to add to the task {0}: '.format(taskName), note => {
                task.notes.push(note)
                clearAndDisplayHelpAndTasks(tasks)
                console.log('Task {0} now has notes:'.format(taskName))
                task.notes.map(taskNote => console.log(taskNote))
            })
        }
    })
}

function secondsToHours(seconds) {
    return Math.round((seconds / 3600) * 100) / 100
}

function displayReport(tasks) {
    clearAndDisplayHelpAndTasks(tasks)
    tasks.map(task => {
        console.log('Task: {0}'.format(task.name))
        console.log('Time taken {0}'.format(secondsToHours(task.time)))
        console.log('Notes:')
        task.notes.map(note => {
            console.log(note)
        })
    })
}

function deleteTask(){
    readInterface.question('Give the index number of the task to delete: ', taskIndex => {
        let task = findTaskByIndex(taskIndex, tasks)
        if (task) {
            const taskName = task.name
            console.log('Deleting task {0}'.format(taskName))
            readInterface.question('Are you sure? y/n: ', response => {
                if (response === 'y'){
                    clearInterval(task.timer)
                    delete tasks[taskIndex]
                    clearAndDisplayHelpAndTasks(tasks)
                    console.log('Task {0} deleted!'.format(taskName))
                } else {
                    console.log('Task delete aborted.')
                }
            })
        }
    })
}

function saveTasksToFile(filename) {
    const stringTasks = tasks.filter(task => task !== (undefined || null || '')).map(task => {
        let timerlessTask = task
        delete timerlessTask.timer
        return JSON.stringify(timerlessTask)
    })
    fs.writeFile('./{0}'.format(filename), stringTasks, (error) => {
        if (error) {
            return console.log(error)
        }
        clearAndDisplayHelpAndTasks(tasks)
        console.log('Currents tasks saved as a file: {0}'.format(filename))
    })
}

function writeTasks() {
    readInterface.question('What is the filename to write to? ', filename => {
        saveTasksToFile(filename)
    })
}

function autosave() {
    const filename = 'autosave{0}'.format(Date.now())
    saveTasksToFile(filename)
}

function switchAutosave() {
    autosaver.status = !autosaver.status
    if (autosaver.status) {
        readInterface.question('What is the autosave interval in milliseconds (30000ms = 30s)? ', interval => {
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
    't': {description: 'Set time for task.', command: () =>  setTaskTime()},
    'l': {description: 'Shows live feed of tasks.', command: tasks => switchLiveFeed(tasks)},
    'as': {description: 'Starts autosaving at given interval.', command: () => switchAutosave()}}

function listAvailableCommands(commands) {
    console.log('Available commands')
    for (var commandKey in commands) {
        if (userInputs.hasOwnProperty(commandKey)) {
            console.log('Shortcut: {0} Description: {1}'.format(commandKey, commands[commandKey].description))
        }
    }
}

function clearScreen() {
    console.log('\u001B[2J\u001B[0;0f')
}

function displayAutosaveStatus() {
    const status = autosaver.status ? 'on' : 'off'
    console.log('Autosave status: {0}'.format(status))
}

function clearAndDisplayHelpAndTasks(tasks) {
    clearScreen()
    listAvailableCommands(userInputs)
    displayAutosaveStatus()
    displayTasks(tasks)
}

function drawTerminalHorizontalLine(marker) {
    let horizontalLine = ''
    for (let i = 0; i < process.stdout.columns; i++){
        horizontalLine += marker
    }
    console.log(horizontalLine)
}

function liveFeed(tasks) {
    clearScreen()
    console.log('!Livefeed! Press l and enter to return to normal mode.')
    tasks.map(task => {
        drawTerminalHorizontalLine('━')
        console.log('Task name: {0}'.format(task.name))
        console.log('Time taken: {0}'.format(secondsToHours(task.time)))
        const notes = task.notes
        if (notes.length > 0) {
            console.log('Notes: ')
            drawTerminalHorizontalLine('─')
            notes.map(note => {
                console.log('* {0}'.format(note))
            })
            drawTerminalHorizontalLine('─')
        }
        drawTerminalHorizontalLine('━')
    })
}

function switchLiveFeed(tasks){
    if (tasks.length > 0) {
        liveMode.status = !liveMode.status
        if (liveMode.status) {
            liveMode.timer = setInterval(liveFeed, 1000, tasks)
        }  else {
            clearInterval(liveMode.timer)
            clearAndDisplayHelpAndTasks(tasks)
        }
    } else {
        console.log('No tasks found! Please add some by typing a and hitting enter!')
    }
}

function handleInput(str) {
    if (userInputs[str]) {
        const command = userInputs[str]
        console.log(`Running command "${command.description}"`)
        command.command(tasks)
    } else {
        console.log(`No command found for "${str}"`)
    }
}

function runManager() {
    readInterface.resume()
    clearAndDisplayHelpAndTasks(tasks)
    readInterface.prompt()
}

module.exports = {runManager: () => runManager(),
                  stopRunningTaskTimers: tasks => stopRunningTaskTimers(tasks),
                  secondsToHours: () => secondsToHours(),
                  setTimeFor: (task, time) => setTimeFor(task, time),
                  applyToTaskByIndex: (tasks, index, method, args) => applyToTaskByIndex(tasks, index, method, args),
                  findTaskByIndex: (index, tasks) => findTaskByIndex(index, tasks)}
