'use strict'

/*
 * This is an advanced example that demonstrates using fact priorities to optimize the rules engine.
 *
 * Usage:
 *   node ./examples/optimize-runtime-with-fact-priority.js
 *
 * For detailed output:
 *   DEBUG=json-rules-engine node ./examples/optimize-runtime-with-fact-priority.js
 */

require('colors')
var Engine = require('../dist').Engine

/**
 * Setup a new engine
 */
var engine = new Engine()

/**
 * - Demonstrates setting high performance (cpu) facts higher than low performing (network call) facts.
 */
var microsoftRule = {
  conditions: {
    all: [{
      fact: 'account-information',
      operator: 'equal',
      value: true
    }, {
      fact: 'date',
      operator: 'lessThan',
      value: 1467331200000 // unix ts for 2016-07-01; truthy when current date is prior to 2016-07-01
    }]
  },
  event: { type: 'microsoft-employees' }
}
engine.addRule(microsoftRule)

/**
 * Register listeners with the engine for rule success and failure
 */
var facts
engine
  .on('success', function (event) {
    console.log(facts.accountId + ' DID '.green + 'meet conditions for the ' + event.type.underline + ' rule.')
  })
  .on('failure', function (rule) {
    console.log(facts.accountId + ' did ' + 'NOT'.red + ' meet conditions for the ' + rule.event.type.underline + ' rule.')
  })

/**
 * Low and High Priorities.
 * Facts that do not have a priority set default to 1
 * @type {Integer} - Facts are run in priority from highest to lowest.
 */
var HIGH = 100
var LOW = 1

/**
 * 'account-information' fact executes an api call - network calls are expensive, so
 * we set this fact to be LOW priority; it will only be evaluated after all higher priority facts
 * evaluate truthy
 */
engine.addFact('account-information', function (params, almanac) {
  // this fact will not be evaluated, because the "date" fact will fail first
  console.log('Checking the "account-information" fact..') // this will not appear
  return true
}, { priority: LOW })

/**
 * 'date' fact returns the current unix timestamp in ms.
 * Because this is cheap to compute, we set it to "HIGH" priority
 */
engine.addFact('date', function (params, almanac) {
  console.log('Checking the "date" fact..')
  return Date.now()
}, { priority: HIGH })

// define fact(s) known at runtime
facts = { accountId: 'washington' }
engine.run(facts).catch(console.log)

/*
 * OUTPUT:
 *
 * Checking the "date" fact first..
 * washington did NOT meet conditions for the microsoft-employees rule.
 */

/*
 * NOTES:
 *
 * - Notice that the "account-information" fact was never evaluated, saving a network call and speeding up
 * the engine by an order of magnitude(or more!).  Swap the priorities of the facts to see both run.
 */
