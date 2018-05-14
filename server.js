#!/usr/bin/env node
console.log('Moin Moin')

const fs = require('fs')
const path = require('path')
const express = require('express')
const app = express()

const DEFAULTCLIENTCONFIG = path.join(__dirname, './webclient/clientconfig.json')
const CLIENTCONFIG = './clientconfig.json'

const DEFAULTSERVERCONFIG = path.join(__dirname, './serverconfig.json')
const SERVERCONFIG = './serverconfig.json'
var PORT = 8080
var LOGLEVEL = 'warn'

function json2s (obj) { return JSON.stringify(obj, null, 2) } // format JSON payload for log

function readConfig (cust, def) {
  try {
    var f = fs.readFileSync(cust)
    return f
  } catch (e) {
    console.log('Read custom config failed : %j', cust)
  }
  console.log('Try default config: %j', def)
  try {
    f = fs.readFileSync(def)
    return f
  } catch (e) {
    console.log('Read default config failed : %j', def)
    console.log('--> exit')
    process.exit(1)
  }
}

function loadConf () {
  var c = JSON.parse(readConfig(SERVERCONFIG, DEFAULTSERVERCONFIG))
  if (c.LOGLEVEL) { LOGLEVEL = c.LOGLEVEL }
  console.log('Read config - Set LOGLEVEL to %j', LOGLEVEL)
  if (c.PORT) { PORT = c.PORT }
  return c
}
loadConf()

if (process.env.VCAP_APP_PORT) { PORT = process.env.VCAP_APP_PORT }
app.listen(PORT, function () {
  console.log('express', 'server starting on ' + PORT)
})

app.get('/config', (req, res) => {
  console.log('NodeRequest ' + req.method + ' ' + req.originalUrl)
  var out = JSON.parse(readConfig(CLIENTCONFIG, DEFAULTCLIENTCONFIG))
  console.log('env:', json2s(out))
  res.send(out)
})

app.get('/clientconfig.json', (req, res) => {
  console.log('NodeRequest ' + req.method + ' ' + req.originalUrl)
  var out = JSON.parse(readConfig(CLIENTCONFIG, DEFAULTCLIENTCONFIG))
  console.log('env:', json2s(out))
  res.send(out)
})

app.get('/info', (req, res) => {
  console.log('NodeRequest ' + req.method + ' ' + req.originalUrl)
  var out = '<pre>' + json2s(process.env) + '</pre>'
  console.log('env:', json2s(process.env))
  res.send(out)
})

console.log('static_path:', path.join(__dirname, '/webclient'))
app.use(express.static(path.join(__dirname, '/webclient')))
