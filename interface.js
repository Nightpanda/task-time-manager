'use strict'

const readline = require('readline')
const styles = require('./styles.js')

exports.createReadInterface = () => {
  return readline.createInterface({
    input: process.stdin,
    output: process.stdout
  })
}

exports.askQuestion = (readInterface, question, action, ...args) => {
  readInterface.question(styles.questionStyle(question), answer => {
    return action(answer, ...args)
  })
}
