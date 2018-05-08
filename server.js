#!/usr/bin/env node
console.log('Moin Moin')

const fs = require('fs')
const path = require('path')
const express = require('express')
const app = express()

const CONFIG = './serverconfig.json'
var PORT = 8080

function json2s (obj) { return JSON.stringify(obj, null, 2) }  // format JSON payload for log

function loadConf () {
  var c = JSON.parse(fs.readFileSync(CONFIG))
  if (c.PORT) { PORT = c.PORT }
  return c
}

loadConf()

console.log('env:', json2s(process.env))
if (process.env.VCAP_APP_PORT) { PORT = process.env.VCAP_APP_PORT }
app.listen(PORT, function () {
  console.log('express', 'server starting on ' + PORT)
})

app.use(express.static(path.join(__dirname, '/webclient')))

app.get('/info', (req, res) => {
  var out = '<pre>' + json2s(process.env) + '</pre>'
  res.send(out)
})