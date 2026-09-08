import {mkdir,readFile,writeFile} from 'node:fs/promises';
// Dependency-free bundler for this project's local, named ES-module imports.
// Source stays modular; release is one self-contained HTML file.
const modules=['data','world','game','art','renderer','input','save','ui','main'];
let bundle='';for(const name of modules){let source=await readFile(`src/${name}.js`,'utf8');source=source.replace(/^import .*?;\r?\n/gm,'').replace(/^export /gm,'');bundle+=`\n// ${name}\n${source}\n`;}
let html=await readFile('index.html','utf8');const css=(await readFile('style.css','utf8')).replace(/^@import[^;]*;/m,'');html=html.replace('<link rel="stylesheet" href="style.css">',`<style>${css}</style>`).replace('<script type="module" src="src/main.js"></script>',`<script type="module">${bundle.replaceAll('</script','<\\/script')}</script>`);await mkdir('dist',{recursive:true});await writeFile('dist/index.html',html);console.log(`Built dist/index.html (${Buffer.byteLength(html)} bytes; no network dependencies).`);
