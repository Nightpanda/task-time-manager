const readline = require('readline')
readline.emitKeypressEvents(process.stdin)
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

const userInputs = {
    'a': {'description': 'add', 'command': 'ADD'},
    'r': {'description': 'resume', 'command':'RESUME'},
    's': {'description': 'stop', 'command':'STOP'}}

function listAvailableCommands(commands) {
    console.log('Available commands')
    for (var commandKey in commands) {
        if (userInputs.hasOwnProperty(commandKey)) {
            console.log('Shortcut: {0} Description: {1}'.format(commandKey, commands[commandKey].description))
        }
    }
}

process.stdin.on('keypress', (str, key) => {
    if (key.ctrl && key.name === 'c') {
        process.exit()
    } else if (userInputs[str]) {
        const command = userInputs[str]
        console.log(`Running command "${command.command}"`)
    } else {
        console.log(`No command found for "${str}" key`)
    }
})

listAvailableCommands(userInputs)
