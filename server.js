#!/usr/bin/env node
const log = require('npmlog')
const fs = require('fs')
const path = require('path')
const express = require('express')
const app = express()
const package = require('./package.json')

const helmet = require('helmet')
app.use(helmet())


const LOGOUTPUT = process.stdout
log.info('express', 'Moin Moin from mhofftestnpm v' + package.version)

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
    log.warn('config', 'Read custom config failed : %j', cust)
  }
  log.warn('config', 'Try default config: %j', def)
  try {
    f = fs.readFileSync(def)
    return f
  } catch (e) {
    log.error('config', 'Read default config failed : %j', def)
    log.error('config', '--> exit')
    process.exit(1)
  }
}

function loadConf () {
  var c = JSON.parse(readConfig(SERVERCONFIG, DEFAULTSERVERCONFIG))
  if (c.LOGLEVEL) { log.level = c.LOGLEVEL }
  log.warn('log  ', 'Read Config - Set LOGLEVEL to %j', c.LOGLEVEL)
   if (c.PORT) { PORT = c.PORT }
  return c
}
log.stream = LOGOUTPUT
log.level = LOGLEVEL
loadConf()

if (process.env.VCAP_APP_PORT) { PORT = process.env.VCAP_APP_PORT }
app.listen(PORT, function () {
  log.info('express', 'server starting on ' + PORT)
})

app.get('/config', (req, res) => {
  log.info('express', 'NodeRequest ' + req.method + ' ' + req.originalUrl)
  var out = JSON.parse(readConfig(CLIENTCONFIG, DEFAULTCLIENTCONFIG))
  log.verbose('express', 'config:\n', json2s(out))
  res.send(out)
})

app.get('/clientconfig.json', (req, res) => {
  log.info('express', 'NodeRequest ' + req.method + ' ' + req.originalUrl)
  var out = JSON.parse(readConfig(CLIENTCONFIG, DEFAULTCLIENTCONFIG))
  log.verbose('express', 'config:\n', json2s(out))
  res.send(out)
})

app.get('/info', (req, res) => {
  log.info('express', 'NodeRequest ' + req.method + ' ' + req.originalUrl)
  var out = '<pre>' + json2s(process.env) + '</pre>'
  log.verbose('express', 'process.env:\n', json2s(process.env))
  res.send(out)
})

log.info('express', 'static_path:', path.join(__dirname, '/webclient'))
app.use(express.static(path.join(__dirname, '/webclient')))
