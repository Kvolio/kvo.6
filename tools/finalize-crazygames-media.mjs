import {execFileSync} from 'node:child_process';
import {mkdir,copyFile,stat} from 'node:fs/promises';
// Normalize fragmented browser MP4 metadata for uploaders and seeking, without
// re-encoding or changing playback speed. FFmpeg is a development-only utility.
export async function finalizePreview(name){
  const ffmpeg=process.env.FFMPEG_PATH||'ffmpeg',file=`dist/crazygames-submission/preview-${name}.mp4`,temp=`artifacts/preview-${name}-final.mp4`;
  await mkdir('artifacts',{recursive:true});
  execFileSync(ffmpeg,['-hide_banner','-loglevel','error','-y','-i',file,'-c','copy','-movflags','+faststart',temp],{stdio:'pipe'});
  let info='';try{execFileSync(ffmpeg,['-hide_banner','-i',temp],{stdio:'pipe'});}catch(error){info=error.stderr?.toString()||'';}
  const duration=info.match(/Duration: (\d+):(\d+):([\d.]+)/),seconds=duration?Number(duration[1])*3600+Number(duration[2])*60+Number(duration[3]):0;
  if(seconds<15||seconds>20||info.includes('Audio:')||!info.includes(name==='landscape'?'1920x1080':'1080x1620')||(await stat(temp)).size>50*1024*1024)throw Error('Invalid preview metadata: '+name);
  await copyFile(temp,file);console.log(`Validated silent ${name} preview: ${seconds}s, fast-start MP4.`);
}
if(process.argv.includes('--all'))for(const name of ['landscape','portrait'])await finalizePreview(name);
