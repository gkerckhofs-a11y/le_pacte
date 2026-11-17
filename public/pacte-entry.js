// Keep previously distributed territorial links working; the default product is narrative.
const params=new URLSearchParams(location.search);
if(params.get('session')&&['team','screen','organizer'].includes(params.get('mode'))){
 const legacy=new URL('/territorial.html',location.origin);legacy.search=location.search;legacy.hash=location.hash;location.replace(legacy.href);
}
