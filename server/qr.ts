import qrcode from 'qrcode-generator';
export function normalizeOrigin(value:string):string {
 const url=new URL(value);
 if(!['http:','https:'].includes(url.protocol)||url.username||url.password||url.pathname!=='/'||url.search||url.hash)throw new Error('Adresse publique invalide : fournir uniquement une origine HTTP(S)');
 return url.origin;
}
/** Generates a vector QR locally. No external request, filesystem write or log. */
export function accessQr(origin:string,sessionId:string,token:string){
 if(!/^[a-f0-9]{24}$/.test(sessionId)||!/^[A-Za-z0-9_-]{43}$/.test(token))throw new Error('Accès QR invalide');
 const base=normalizeOrigin(origin),link=`${base}/?mode=team&session=${sessionId}#token=${token}`;
 const qr=qrcode(0,'M');qr.addData(link,'Byte');qr.make();
 const count=qr.getModuleCount(),size=count+8;let path='';
 for(let y=0;y<count;y++)for(let x=0;x<count;x++)if(qr.isDark(y,x))path+=`M${x+4} ${y+4}h1v1h-1z`;
 const svg=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" role="img" aria-label="QR d’accès privé à l’équipe" shape-rendering="crispEdges"><rect width="${size}" height="${size}" fill="white"/><path d="${path}" fill="black"/></svg>`;
 return{svg,link};
}
