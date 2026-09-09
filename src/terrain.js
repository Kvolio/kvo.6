// Seeded, continuous fields make broad coves, headlands, forest groves and ridges.
export function islandTerrain(world,rng){
  const {cols,rows,start}=world,phases=Array.from({length:5},()=>rng()*Math.PI*2);
  const cx=cols/2,cy=rows/2,rx=cols/2-9,ry=rows/2-8;
  for(let y=0;y<rows;y++)for(let x=0;x<cols;x++){
    const nx=(x-cx)/rx,ny=(y-cy)/ry,angle=Math.atan2(ny,nx);
    const edge=1+.095*Math.sin(angle*3+phases[0])+.045*Math.cos(angle*5+phases[1])+.025*Math.sin(angle*9+phases[2]);
    const inland=(edge-Math.hypot(nx,ny))*Math.min(rx,ry);
    const type=inland<0||x<3||y<3||x>=cols-3||y>=rows-3?'water':inland<2?'sand':'grass';
    world.tiles.push({x,y,type,resource:null,amount:0,shade:rng(),elevation:0,moisture:(Math.sin(x*.105+phases[3])+Math.cos(y*.16+phases[4])+2)/4});
  }
  // Remove tiny diagonally detached shoreline cells before adding mountains.
  const mainland=world.flood(start.y*cols+start.x);
  for(const [i,t]of world.tiles.entries())if(t.type!=='water'&&!mainland.has(i))t.type='water';
  world.ranges=[];const count=rng()<.45?2:3;
  for(let i=0;i<count;i++){
    const points=[],phase=rng()*Math.PI*2,offset=(rng()-.5)*6;
    for(let j=0;j<29;j++)points.push(i<2?
      {x:cx+(i===0?-19:19)+offset+Math.sin(j*.16+phase)*4,y:cy-16+j}:
      {x:cx-15+j,y:cy+17+offset*.4+Math.sin(j*.17+phase)*2});
    world.ranges.push(points);
    for(const t of world.tiles){
      if(t.type==='water'||t.type==='sand'||Math.hypot(t.x-start.x,t.y-start.y)<=8)continue;
      const d=Math.min(...points.map(p=>Math.hypot(t.x-p.x,t.y-p.y)));
      t.elevation=Math.max(t.elevation,Math.max(0,1-d/5));
      if(d<1.75)t.type='mountain';else if(d<5&&t.type!=='mountain')t.type='foothill';
    }
    // Each ridge has two deliberate passes. Connectivity repair handles overlaps.
    for(const index of [7+Math.floor(rng()*3),19+Math.floor(rng()*3)]){
      const p=points[index];for(const t of world.tiles)if(t.type==='mountain'&&(i<2?Math.abs(t.y-Math.floor(p.y))<1.1:Math.abs(t.x-Math.floor(p.x))<1.1))Object.assign(t,{type:'foothill',elevation:.2,pass:true});
    }
  }
  world.connectLand();
  for(const t of world.tiles){
    if(!world.walkable(t)||t.type==='sand'||Math.hypot(t.x-start.x,t.y-start.y)<5)continue;
    const n=rng();
    if(t.type==='foothill')t.resource=n<.2?'stone':n<.28?'iron':n<.32?'gold':n>.9?'wood':null;
    else t.resource=n<.035+Math.pow(t.moisture,2)*.65?'wood':n>.994?'stone':n>.993?'iron':n>.9925?'gold':null;
    t.amount=t.resource==='wood'?300:t.resource?(t.type==='foothill'?2100:1400):0;
  }
  for(const [dx,dy,resource]of [[-6,1,'wood'],[-6,2,'wood'],[-5,3,'wood'],[6,0,'stone'],[6,1,'stone']])Object.assign(world.tile(start.x+dx,start.y+dy),{type:'grass',resource,amount:resource==='wood'?300:1400,elevation:0});
}
