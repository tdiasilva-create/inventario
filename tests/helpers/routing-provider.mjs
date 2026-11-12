// Isolated provider fixture. Never used by deployment or production data.
export function routeResponse(url){
 const points=new URL(url).pathname.split('/').at(-1).split(';').map(p=>p.split(',').map(Number)),coordinates=[points[0]];
 for(let i=1;i<points.length;i++){coordinates.push([points[i][0],points[i-1][1]],points[i]);}
 return Response.json({code:'Ok',waypoints:points.map(location=>({location,distance:0})),routes:[{geometry:{type:'LineString',coordinates},distance:1200,duration:300,legs:points.slice(1).map(()=>({distance:400,duration:100}))}]});
}
