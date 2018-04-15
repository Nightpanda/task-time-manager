'use strict'
const fs = require('fs')

const readline = require('readline')
let readInterface = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });
process.stdin.setRawMode(true)

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

let tasks = []

function displayTasks(){
    tasks.map((task, index) => {
        console.log('{0}. {1} - {2}'.format(index, task.name, task.time))
    })
}

function intervalFunc(index) {
    tasks[index].time += 1
}

function stopRunningTaskTimers() {
    tasks.map(task => {
        if(task.timerRunning) {
            clearInterval(task.timer)
            task.timerRunning = !task.timerRunning
            console.log('Stopped timer for task {0}'.format(task.name))
        }
    })
}

function addTask() {
    stopRunningTaskTimers()
    readInterface.question('Enter task name: ', name => {
        const index = tasks.push({'name': name, 'time': 0, 'timerRunning': true, 'notes': []}) - 1
        tasks[index].timer = setInterval(intervalFunc, 1000, index)
        clearAndDisplayHelpAndTasks()
    })
}

function stopAllTasks() {
    clearAndDisplayHelpAndTasks()
    stopRunningTaskTimers()
    console.log("Finished stopping timers.")
}

function findTaskByIndex(taskIndex) {
    let task = tasks[taskIndex]
    if (task) {
        return task
    } else {
        console.log('No task found for index {0}'.format(taskIndex))
    }
}

function resumeTask() {
    readInterface.question('Give the index number of the task to resume timing: ', taskIndex => {
        let task = findTaskByIndex(taskIndex)
        if (task) {
            const running = task.timerRunning
            const taskName = task.name
            if (!running) {
                task.timerRunning = !running
                task.timer = setInterval(intervalFunc, 1000, taskIndex)
                clearAndDisplayHelpAndTasks()
                console.log('Resumed task {0}'.format(taskName))
            } else {
                console.log('Timer already running for {0}'.format(taskName))
            }
        }
    })
}

function addNote() {
    readInterface.question('Give the index number of the task to add a note to: ', taskIndex => {
        let task = findTaskByIndex(taskIndex)
        if (task) {
            const taskName = task.name
            readInterface.question('Write the note to add to the task {0}: '.format(taskName), note => {
                task.notes.push(note)
                clearAndDisplayHelpAndTasks()
                console.log('Task {0} now has notes:'.format(taskName))
                task.notes.map(taskNote => console.log(taskNote))
            })
        }
    })
}

function secondsToHours(seconds) {
    return seconds / 3600
}

function displayReport(tasks) {
    clearAndDisplayHelpAndTasks()
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
        let task = findTaskByIndex(taskIndex)
        if (task) {
            const taskName = task.name
            console.log('Deleting task {0}'.format(taskName))
            readInterface.question('Are you sure? y/n: ', response => {
                if (response === 'y'){
                    clearInterval(task.timer)
                    delete tasks[taskIndex]
                    clearAndDisplayHelpAndTasks()
                    console.log('Task {0} deleted!'.format(taskName))
                } else {
                    console.log('Task delete aborted.')
                }
            })
        }
    })
}

function writeTask(){
    const stringTasks = tasks.filter(task => task !== (undefined || null || '')).map(task => {
        let timerlessTask = task
        delete timerlessTask.timer
        return JSON.stringify(timerlessTask)
    })
    readInterface.question('What is the filename to write to? ', filename => {
        fs.writeFile('./{0}'.format(filename), stringTasks, (error) => {
            if (error) {
                return console.log(error)
            }
            clearAndDisplayHelpAndTasks()
            console.log('Currents tasks saved as a file: {0}'.format(filename))
        })
    })
}

const userInputs = {
    'a': {'description': 'Start tracking a new task.', 'command': function() {addTask()}},
    'r': {'description': 'Resumes a timer on a task.', 'command': function() {resumeTask()}},
    's': {'description': 'Stops all timers. ', 'command': function() {stopAllTasks()}},
    'n': {description: 'Adds a note to a task.', command: () => addNote()},
    'p': {description: 'Prints a task report of time taken with notes.', command: () => displayReport(tasks)},
    'd': {description: 'Deletes a task.', command: () => deleteTask()},
    'w': {description: 'Save tasks to a file.', command: () => writeTask()}}

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

function clearAndDisplayHelpAndTasks(){
    clearScreen()
    listAvailableCommands(userInputs)
    displayTasks()
}

function handleInput(str) {
    if (userInputs[str]) {
        const command = userInputs[str]
        console.log(`Running command "${command.description}"`)
        command.command()
    } else {
        console.log(`No command found for "${str}"`)
    }
}

readInterface.on('line', (str) => {
    clearAndDisplayHelpAndTasks()
    handleInput(str)
    readInterface.prompt()
}).on('close', () => {
    console.log('Goodbye')
    process.exit(0)
})

clearAndDisplayHelpAndTasks()
readInterface.prompt()
