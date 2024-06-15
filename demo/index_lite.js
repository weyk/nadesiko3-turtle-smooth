#!/usr/bin/env node
/** 超簡易サーバ(生のnodeだけで簡単HTTPサーバ) */
import path from 'path'
import fs from 'fs'
import { execSync } from 'child_process'
import http from 'http'

// __dirname のために
import url from 'url'
const __filename = url.fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// CONST
const SERVER_PORT = 3000
const rootDir = path.resolve(__dirname, '../')

// root => redirect to demo/

const module = await import('opener')
const opener = module.default

if (!isDir(path.join(rootDir, 'node_modules', 'nadesiko3'))) {
  console.log('demoの実行には「nadesiko3」パッケージが必要です。')
  console.log('demoを実行する場合は「npm install nadesiko3」を実行後、再度「npm run start」してください。')
  process.exit(1)
}

const server = http.createServer(function (req, res) {
  console.log('[ようこそ]', JSON.stringify(req.url))

  // root なら "demo/"へリダイレクト
  if (req.url === '/') {
    res.writeHead(302, { 'Location': '/demo/' })
    res.end('<a href="/demo/">DEMO</a>')
    return
  }
  // サニタイズ
  let uri = '' + req.url
  uri = uri.replace(/\.\./g, '') // 上のフォルダは許さない
  if (uri.indexOf('?') >= 0) {
    uri = (uri + '?').split('?')[0]
  }

  // ファイルパスを生成
  let filePath = path.join(rootDir, uri)
  // エイリアス
  if (uri.startsWith('/demo/') && !uri.startsWith('/demo/www/')) {
    filePath = path.join(rootDir, 'demo', 'www', uri.substring(5))
  }
  if (uri.startsWith('/demo/lib/')) {
    filePath = path.join(rootDir, 'lib/', uri.substring(10))
  }
  if (uri.startsWith('/lib/')) {
    filePath = path.join(rootDir, 'lib/', uri.substring(5))
  }
  if (uri.startsWith('/nako3src/')) {
    filePath = path.join(rootDir, 'node_modules/nadesiko3/src/', uri.substring(10))
  }
  if (uri.startsWith('/nako3demo/')) {
    filePath = path.join(rootDir, 'node_modules/nadesiko3/demo/', uri.substring(11))
  }
  if (uri.startsWith('/nako3release/')) {
    filePath = path.join(rootDir, 'node_modules/nadesiko3/release/', uri.substring(14))
  }

  // フォルダか？
  if (isDir(filePath)) {
    // index.html を足す
    filePath = path.join(filePath, 'index_lite.html')
  }

  // ファイルの存在確認
  if (!fs.existsSync(filePath)) {
    console.log('[ERROR] 404 ', uri)
    console.log('| file=', filePath)
    res.statusCode = 404
    res.end('<html><meta charset="utf-8"><body><h1>404 残念(ToT) ファイルがありません。</h1></body></html>')
    return
  }
  // ファイルを読んで返す
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.statusCode = 500
      res.end('Failed to read file.')
      return
    }
    const mime = getMIMEType(filePath)
    res.writeHead(200, { 'Content-Type': mime })
    res.end(data)
  })
})
// サーバを起動
server.listen(SERVER_PORT, function () {
  const url = 'http://localhost:' + SERVER_PORT + '/demo/index_lite.html'
  console.log('### 超簡易Webサーバが起動しました')
  console.log('### script: /demo/nako3server_lite.mjs')
  console.log('[URL]', url)
  opener(url)
})

// MIMEタイプ
const MimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.svg': 'svg+xml'
}
function getMIMEType (url) {
  let ext = '.txt'
  const m = url.match(/(\.[a-z0-9_]+)$/)
  if (m) { ext = m[1] }
  if (MimeTypes[ext]) { return MimeTypes[ext] }
  return 'text/plain; charset=utf-8'
}

// ディレクトリか判定
function isDir (pathName) {
  const stats = fs.statSync(pathName, { throwIfNoEntry: false })
  if (stats && stats.isDirectory()) {
    return true
  }
  return false
}
