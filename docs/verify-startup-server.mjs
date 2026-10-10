// Local-only startup check: serve the actual production build, with an optional
// four-second main-module delay to exercise the independent splash deadline.
import http from 'node:http';
import {readFile} from 'node:fs/promises';
import {resolve,extname,sep} from 'node:path';
const root=resolve(import.meta.dirname,'../dist');
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.pdf':'application/pdf'};
http.createServer(async(req,res)=>{
  try{
    const url=new URL(req.url,'http://127.0.0.1:4174');
    const file=resolve(root,'.'+decodeURIComponent(url.pathname==='/'?'/index.html':url.pathname));
    if(!file.startsWith(root+sep)){res.writeHead(403).end();return;}
    const bytes=await readFile(file);
    const delayed=/\/assets\/index-[^/]+\.js$/.test(url.pathname)&&new URL(req.headers.referer||'http://127.0.0.1:4174').searchParams.has('slow');
    const send=()=>{res.writeHead(200,{'Content-Type':mime[extname(file)]||'application/octet-stream','Cache-Control':'no-store'});res.end(bytes);};
    if(delayed)setTimeout(send,4000);else send();
  }catch{res.writeHead(404).end();}
}).listen(4174,'127.0.0.1',()=>process.stdout.write('Production startup verification available on 127.0.0.1:4174\n'));
