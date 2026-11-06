// Only explicit geographic coordinates can place a unit on the real basemap.
// Illustration x/y percentages from desktop-data.js are never georeferenced.
function numericCoordinate(value){
 if(typeof value!=='number'&&typeof value!=='string')return null;
 if(typeof value==='string'&&!value.trim())return null;
 const n=Number(String(value).trim().replace(',','.'));
 return Number.isFinite(n)?n:null;
}
export function coordinatesForUnit(unit){
 if(unit?.coordenadaValida===false||['false','nao','não'].includes(String(unit?.coordenadaValida).toLowerCase()))return null;
 const lat=numericCoordinate(unit?.latitude),lng=numericCoordinate(unit?.longitude);
 if(lat===null||lng===null||Math.abs(lat)>90||Math.abs(lng)>180||(lat===0&&lng===0))return null;
 return [lat,lng];
}
export function geolocatedUnits(units){return units.map(unit=>({unit,coordinates:coordinatesForUnit(unit)})).filter(x=>x.coordinates);}
