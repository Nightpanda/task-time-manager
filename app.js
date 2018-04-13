'use strict'

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
        }
    })
}

function addTask() {
    stopRunningTaskTimers()
    readInterface.question('Enter task name: ', name => {
        const index = tasks.push({'name': name, 'time': 0, 'timerRunning': true}) - 1
        tasks[index].timer = setInterval(intervalFunc, 1000, index)
        displayTasks()
    })
}

function stopTask() {
    clearInterval(tasks[0].timer)
    console.log("STOP")
}

function resumeTask() {
    console.log("RESUME")
}

const userInputs = {
    'a': {'description': 'add', 'command': function() {addTask()}},
    'r': {'description': 'resume', 'command': function() {resumeTask()}},
    's': {'description': 'stop', 'command': function() {stopTask()}}}

function listAvailableCommands(commands) {
    console.log('Available commands')
    for (var commandKey in commands) {
        if (userInputs.hasOwnProperty(commandKey)) {
            console.log('Shortcut: {0} Description: {1}'.format(commandKey, commands[commandKey].description))
        }
    }
}

readInterface.on('line', (str) => {
    if (userInputs[str]) {
        const command = userInputs[str]
        console.log(`Running command "${command.description}"`)
        command.command()
    } else {
        console.log(`No command found for "${str}"`)
    }
    readInterface.prompt()
}).on('close', () => {
    console.log('Goodbye')
    process.exit(0)
})

listAvailableCommands(userInputs)
readInterface.prompt()
