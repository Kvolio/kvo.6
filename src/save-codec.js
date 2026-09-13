// Lossless tile tables leave room for armies within CrazyGames' 1 MB total quota.
// Keep every tile field (including legacy maps); never regenerate saved terrain.
export function encodeSave(data){
  const groups=new Map();
  data.tiles.forEach((tile,index)=>{const keys=Object.keys(tile),signature=JSON.stringify(keys);if(!groups.has(signature))groups.set(signature,{keys,rows:[]});groups.get(signature).rows.push([index,...keys.map(key=>tile[key])]);});
  const {tiles,...rest}=data;
  return JSON.stringify({...rest,tileTable:{version:1,length:tiles.length,groups:[...groups.values()]}});
}
export function decodeSave(raw){
  const data=JSON.parse(raw);if(!data?.tileTable)return data;
  const table=data.tileTable;
  if(table.version!==1||!Number.isInteger(table.length)||table.length<1||table.length>20000||!Array.isArray(table.groups))throw Error('Invalid tile table');
  const tiles=new Array(table.length);let count=0;
  for(const {keys,rows} of table.groups){
    if(!Array.isArray(keys)||!Array.isArray(rows)||keys.some(k=>typeof k!=='string'))throw Error('Invalid tile fields');
    for(const [index,...values] of rows){if(!Number.isInteger(index)||index<0||index>=tiles.length||tiles[index]||values.length!==keys.length)throw Error('Invalid tile row');tiles[index]=Object.fromEntries(keys.map((key,i)=>[key,values[i]]));count++;}
  }
  if(count!==tiles.length)throw Error('Incomplete saved terrain');
  delete data.tileTable;data.tiles=tiles;return data;
}
