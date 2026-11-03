import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';
import {createHash} from 'node:crypto';
import {readFileSync,readdirSync} from 'node:fs';
import {join} from 'node:path';
const hash=createHash('sha256');
function scan(dir:string){for(const e of readdirSync(dir,{withFileTypes:true}).sort((a,b)=>a.name.localeCompare(b.name))){const path=join(dir,e.name);if(e.isDirectory())scan(path);else hash.update(path).update(readFileSync(path));}}
scan('src');scan('public');hash.update(readFileSync('index.html')).update(readFileSync('package-lock.json'));
export default defineConfig(({command})=>({base:'./',plugins:[react()],define:{__PWA_ENABLED__:JSON.stringify(command==='build'),__APP_VERSION__:JSON.stringify(hash.digest('hex').slice(0,10))}}));
