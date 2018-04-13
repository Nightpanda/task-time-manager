const readline = require('readline')
readline.emitKeypressEvents(process.stdin)
process.stdin.setRawMode(true)

const userInputs = new Map()
userInputs.set('a', 'ADD')
userInputs.set('r', 'RESUME')
userInputs.set('s', 'STOP')

process.stdin.on('keypress', (str, key) => {
    if (key.ctrl && key.name === 'c') {
        process.exit()
    } else if (userInputs.has(str)) {
        const command = userInputs.get(str)
        console.log(`Running command "${command}"`)
    } else {
        console.log(`No command found for "${str}" key`)
    }
})
