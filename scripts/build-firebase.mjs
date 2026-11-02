import {build} from 'esbuild';
import {mkdirSync,cpSync,rmSync} from 'node:fs';
mkdirSync('functions/lib',{recursive:true});
await build({entryPoints:['cloud/index.ts'],outfile:'functions/lib/index.js',bundle:true,platform:'node',target:'node22',format:'esm',packages:'external',logLevel:'info'});
rmSync('dist/public',{recursive:true,force:true});mkdirSync('dist/public',{recursive:true});cpSync('public','dist/public',{recursive:true});

await build({entryPoints:['client/auth.ts'],outfile:'dist/public/firebase-auth.js',bundle:true,platform:'browser',target:'es2022',format:'esm',minify:true,logLevel:'info'});
