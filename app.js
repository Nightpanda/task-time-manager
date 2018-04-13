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
            console.log('Stopped timer for task {0}'.format(task.name))
        }
    })
}

function addTask() {
    stopRunningTaskTimers()
    readInterface.question('Enter task name: ', name => {
        const index = tasks.push({'name': name, 'time': 0, 'timerRunning': true}) - 1
        tasks[index].timer = setInterval(intervalFunc, 1000, index)
        clearAndDisplayHelpAndTasks()
    })
}

function stopAllTasks() {
    clearAndDisplayHelpAndTasks()
    stopRunningTaskTimers()
    console.log("Finished stopping timers.")
}

function resumeTask() {
    console.log("RESUME")
}

const userInputs = {
    'a': {'description': 'Start tracking a new task.', 'command': function() {addTask()}},
    'r': {'description': 'resume', 'command': function() {resumeTask()}},
    's': {'description': 'Stops all timers. ', 'command': function() {stopAllTasks()}}}

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
