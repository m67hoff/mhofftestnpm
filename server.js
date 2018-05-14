#!/usr/bin/env node
console.log('Moin Moin')

const fs = require('fs')
const path = require('path')
const express = require('express')
const app = express()


const CLIENTCONFIG = './clientconfig.json'


// const CONFIG = path.join(__dirname, './serverconfig.json') 
const CONFIG = './serverconfig.json'
var PORT = 8080
var LOGLEVEL = 'warn'

function json2s (obj) { return JSON.stringify(obj, null, 2) }  // format JSON payload for log

function loadConf () {
  var c = JSON.parse(fs.readFileSync(CONFIG))
  if (c.LOGLEVEL) { LOGLEVEL = c.LOGLEVEL }
  console.log('Read Config - Set LOGLEVEL to %j', c.LOGLEVEL)
  if (c.PORT) { PORT = c.PORT }
  return c
}

loadConf()

if (process.env.VCAP_APP_PORT) { PORT = process.env.VCAP_APP_PORT }
app.listen(PORT, function () {
  console.log('express', 'server starting on ' + PORT)
})

console.log('static_path:', path.join(__dirname, '/webclient'))
app.use(express.static(path.join(__dirname, '/webclient')))

app.get('/config', (req, res) => {
  console.log('NodeRequest ' + req.method + ' ' + req.originalUrl)
  var out = JSON.parse(fs.readFileSync(CLIENTCONFIG))
  console.log('env:', json2s(out))
  res.send(out)
})

app.get('/info', (req, res) => {
  console.log('NodeRequest ' + req.method + ' ' + req.originalUrl)
  var out = '<pre>' + json2s(process.env) + '</pre>'
  console.log('env:', json2s(process.env))
  res.send(out)
})
