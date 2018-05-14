#!/usr/bin/env node
console.log('Moin Moin')

const fs = require('fs')
const path = require('path')
const express = require('express')
const app = express()
const clientconfig = require('./clientconfig.json')


// const CONFIG = path.join(__dirname, './serverconfig.json') 
const CONFIG = './serverconfig.json'
var PORT = 8080

function json2s (obj) { return JSON.stringify(obj, null, 2) }  // format JSON payload for log

function loadConf () {
  var c = JSON.parse(fs.readFileSync(CONFIG))
  if (c.LOGLEVEL) { log.level = c.LOGLEVEL }
  console.log('log  ', 'Read Config - Set LOGLEVEL to %j', c.LOGLEVEL)
  if (c.PORT) { PORT = c.PORT }
  return c
}

console.log('static_path:', path.join(__dirname, '/webclient'))

loadConf()


if (process.env.VCAP_APP_PORT) { PORT = process.env.VCAP_APP_PORT }
app.listen(PORT, function () {
  console.log('express', 'server starting on ' + PORT)
})

app.use(express.static(path.join(__dirname, '/webclient')))

app.get('/config', (req, res) => {
  console.log('NodeRequest ' + req.method + ' ' + req.originalUrl)
  res.send(clientconfig)
})

app.get('/info', (req, res) => {
  console.log('NodeRequest ' + req.method + ' ' + req.originalUrl)
  var out = '<pre>' + json2s(process.env) + '</pre>'
  console.log('env:', json2s(process.env))
  res.send(out)
})
