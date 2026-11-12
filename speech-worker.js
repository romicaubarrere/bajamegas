let transcriber=null,busy=false;
self.onmessage=async({data})=>{
 if(busy)return;busy=true;
 try{
  self.postMessage({type:'status',text:'Cargando el modelo de voz… La primera vez puede tardar unos minutos.'});
  const {pipeline,env}=await import('https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.2/dist/transformers.min.js');
  env.allowLocalModels=false;env.backends.onnx.wasm.numThreads=1;
  transcriber??=await pipeline('automatic-speech-recognition','Xenova/whisper-tiny',{quantized:true,progress_callback:p=>{
   if(p.status==='progress')self.postMessage({type:'status',text:'Descargando modelo · '+(p.file||'archivo')+' · '+Math.round(p.progress||0)+'%'});
  }});
  self.postMessage({type:'status',text:'Transcribiendo en tu dispositivo… Puede tardar más que el audio original.'});let chunks=0;
  const options={task:'transcribe',return_timestamps:true,chunk_length_s:30,stride_length_s:5,chunk_callback:()=>self.postMessage({type:'status',text:'Transcribiendo · '+(++chunks)+' segmento(s) procesado(s)…'})};
  if(data.language!=='auto')options.language=data.language;
  const result=await transcriber(data.audio,options);self.postMessage({type:'result',result});
 }catch(e){self.postMessage({type:'error',message:e.message||'No se pudo transcribir este archivo.'});}
 finally{busy=false;}
};
