#!/usr/bin/env node
const fs = require('fs')
const path = require('path')
const https = require('https')

const packagejson = require('./package.json')
const setup = require('./setup')

const log = require('npmlog')
const program = require('commander');

const express = require('express')
const app = express()
const helmet = require('helmet')

const ERR_ROOT = 4

const LOGOUTPUT = process.stdout

var LOGLEVEL = 'info'
var PORT = 8080
var HTTPSPORT = 8888
var USE_HTTPS = false

const DEFAULT_WEBAPPCONFIG = path.join(__dirname, './webapp/webappconfig.json')
const WEBAPPCONFIG = './webappconfig.json'
const DEFAULT_SERVERCONFIG = path.join(__dirname, './serverconfig.json')
const SERVERCONFIG = './serverconfig.json'

const DEFAULT_KEY = path.join(__dirname, './ssl.key')
const KEY = './ssl.key'
const DEFAULT_CERT = path.join(__dirname, './ssl.cert')
const CERT = './ssl.cert'

program
  .option('--config', 'configure and start the service. Enable auto restart')
  .option('-s, --status', 'show service status')
  .version(packagejson.version, '-v, --version')
  .parse(process.argv);


if (program.config) {
  loadConf()
  setup.service()
  process.exit(0)
}

if (program.status) {
  loadConf()
  setup.status()
  process.exit(0)
}


function json2s(obj) { return JSON.stringify(obj, null, 2) } // format JSON payload for log

function readConfig(cust, def) {
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

function loadConf() {
  var c = JSON.parse(readConfig(SERVERCONFIG, DEFAULT_SERVERCONFIG))
  if (c.LOGLEVEL) { log.level = c.LOGLEVEL }
  log.notice('log  ', 'Read Config - Set LOGLEVEL to %j', c.LOGLEVEL)
  if (c.PORT) { PORT = c.PORT }
  if (c.HTTPSPORT) { HTTPSPORT = c.HTTPSPORT }
  if (c.USE_HTTPS) { USE_HTTPS = c.USE_HTTPS }
  return c
}

function drop_root() {
  if (process.getuid() != 0) {
    log.error('main', 'Error: only root can run with ports below 1024')
    process.exit(ERR_ROOT)
  }
  process.setgid('nobody');
  process.setuid('nobody');
  log.notice('main', 'drop root - new user id:', process.getuid() + ', Group ID:', process.getgid());
}

//**** Main  ****

log.stream = LOGOUTPUT
log.level = LOGLEVEL
log.notice('main', 'Moin Moin from mhofftestnpm v' + packagejson.version)

loadConf()

process.on('SIGHUP', () => {
  log.warn('main', 'Received SIGHUP -> reload config files');
  loadConf()
  webappconfig = JSON.parse(readConfig(WEBAPPCONFIG, DEFAULT_WEBAPPCONFIG))
});

app.use(helmet())

if (USE_HTTPS) {

  const httpsOptions = {
    key: readConfig(KEY, DEFAULT_KEY),
    cert: readConfig(CERT, DEFAULT_CERT)
  };

  httpsApp = https.createServer(httpsOptions, app)
  httpsApp.listen(HTTPSPORT, function() {
    log.http('https', 'https server starting on ' + HTTPSPORT)
  })

  app.use(function(req, res, next) {
    if (req.secure) {
      next();
    } else {
      var https_url = 'https://' + req.hostname + ':' + HTTPSPORT + req.url
      log.http('redirect', 'to: ' + https_url)
      res.redirect(https_url);
    }
  })
}

if (process.env.VCAP_APP_PORT) { PORT = process.env.VCAP_APP_PORT }
if ((PORT <= 1024) && (process.getuid() != 0)) {
  log.error('main', 'Error: PORT ', PORT)
  log.error('main', 'Error: only root can run with ports below 1024')
  process.exit(ERR_ROOT)
}
app.listen(PORT, function() {
  log.http('express', 'server starting on ' + PORT)
  if (PORT <= 1024) { drop_root() }
})

app.get('/info', (req, res) => {
  log.http('express', 'NodeRequest ' + req.method + ' ' + req.originalUrl)
  var out = '<pre>' + json2s(process.env) + '</pre>'
  log.verbose('express', 'process.env:\n', json2s(process.env))
  res.send(out)
})

app.get('/version', (req, res) => {
  log.http('express', 'NodeRequest ' + req.method + ' ' + req.originalUrl)
  log.verbose('express', 'version:', packagejson.version)
  res.send(packagejson)
})

// provide webapp configfile (default or custom)
var webappconfig = JSON.parse(readConfig(WEBAPPCONFIG, DEFAULT_WEBAPPCONFIG))
app.get(['/config', '/webappconfig.json'], (req, res) => {
  log.http('express', 'Request ' + req.method + ' ' + req.originalUrl)
  log.verbose('express', 'webapp config:\n', json2s(webappconfig))
  res.send(webappconfig)
})

// serve static files
log.http('express', 'static_path:', path.join(__dirname, '/webapp'))
app.use(express.static(path.join(__dirname, '/webapp')))
