// 로컬 테스트용 정적 서버 (의존성 없음)
//   node serve.js        → 이 컴퓨터에서만 접속
//   node serve.js --lan  → 같은 와이파이의 휴대폰에서도 접속 (실기기 테스트용, 끝나면 꺼 주세요)
// 게임 자체는 index.html 을 바로 열어도 동작합니다.
const http = require('http');
const fs = require('fs');
const os = require('os');
const path = require('path');
const root = __dirname;
const port = Number(process.env.PORT) || 8080;
const host = process.argv.includes('--lan') ? '0.0.0.0' : '127.0.0.1';
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.png': 'image/png', '.svg': 'image/svg+xml', '.json': 'application/json', '.md': 'text/markdown; charset=utf-8' };

http.createServer((req, res) => {
  const url = decodeURIComponent(req.url.split('?')[0]);
  const file = path.normalize(path.join(root, url === '/' ? 'index.html' : url));
  if (!file.startsWith(root) || path.basename(file).startsWith('.')) { res.writeHead(403); return res.end(); }
  fs.readFile(file, (err, data) => {
    if (err) { res.writeHead(404); return res.end('not found'); }
    res.writeHead(200, { 'Content-Type': types[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    res.end(data);
  });
}).listen(port, host, () => {
  console.log(`가갸궁 → http://localhost:${port}`);
  if (host === '0.0.0.0') {
    const lan = Object.values(os.networkInterfaces()).flat().filter(i => i && i.family === 'IPv4' && !i.internal).map(i => i.address);
    lan.forEach(ip => console.log(`휴대폰(같은 와이파이) → http://${ip}:${port}`));
  }
});
