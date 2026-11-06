import {readFile,writeFile} from 'node:fs/promises';
let html=await readFile('web/login.html','utf8');
html=html.replace(/<img class="brand([^"]*)" src="\/assets\/prefeitura-paco.png" alt="([^"]*)">/g,(_,cls,alt)=>`<div class="brand${cls}" role="img" aria-label="${alt}"><img class="brand-white" src="/assets/prefeitura-paco.png" alt=""><img class="brand-color" src="/assets/prefeitura-paco.png" alt=""></div>`);
const icons=[`<path d="M4 21V9l8-6 8 6v12H4Z"/><path d="M9 21v-6h6v6M8 10h1m6 0h1M8 13h1m6 0h1M12 3V0m-2 1h4"/>`,`<rect x="2" y="3" width="20" height="14" rx="1"/><path d="M8 21h8m-4-4v4M5 13l4-4 4 3 5-6"/>`,`<path d="M3 21h19M5 18v-5h3v5m4 0V8h3v10m4 0V3h3v15"/>`];
let i=0;html=html.replace(/<span aria-hidden="true">[⌂▣▥]<\/span>/g,()=>`<span aria-hidden="true"><svg viewBox="0 0 24 24">${icons[i++]}</svg></span>`);
html=html.replace('<body>','<body><div class="tech-art" aria-hidden="true"></div>');await writeFile('web/login.html',html);
const geo=JSON.parse(await readFile('web/data/map-v33.json','utf8')).ring;
const xs=geo.map(p=>p[1]),ys=geo.map(p=>p[0]),minX=Math.min(...xs),maxX=Math.max(...xs),minY=Math.min(...ys),maxY=Math.max(...ys);
const points=geo.map(p=>[(p[1]-minX)/(maxX-minX)*260+30,300-(p[0]-minY)/(maxY-minY)*260]);
const path=points.map(p=>p.join(',')).join(' ');
let lines='',nodes='';for(let i=0;i<35;i++){const x=35+(i*67)%260,y=40+(i*89)%240;lines+=`<path d="M${x} ${y}l55 35-20 58-65-25Z"/>`;nodes+=`<circle cx="${x}" cy="${y}" r="2.5"/>`}
await writeFile('web/assets/login-network.svg',`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 360"><defs><filter id="glow"><feGaussianBlur stdDeviation="2"/></filter><clipPath id="region"><polygon points="${path}"/></clipPath></defs><g fill="none" stroke="#00bfff"><polygon points="${path}" fill="#007abf20" stroke-width="1.5"/><g clip-path="url(#region)" opacity=".6" stroke-width=".5">${lines}</g></g><g fill="#00d9ff" clip-path="url(#region)">${nodes}</g><g fill="#5de9ff" filter="url(#glow)"><circle cx="140" cy="90" r="4"/><circle cx="185" cy="170" r="4"/><circle cx="85" cy="220" r="4"/></g></svg>`);
