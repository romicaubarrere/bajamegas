import { MB, AUDIO_BPS, createPlan, fractionTarget } from './plan.js';

const $ = id => document.getElementById(id);
const input = $('file');
let file = null, srcUrl = null, meta = null, job = null, loading = null;
let outBlob = null, outUrl = null, outExt = 'mp4';

const fmtMB = bytes => {
  const v = bytes / MB;
  return (v >= 100 ? v.toFixed(0) : v >= 10 ? v.toFixed(1) : v.toFixed(2)) + ' MB';
};
const fmtTime = value => {
  if (!Number.isFinite(value)) return '—';
  const s = Math.max(0, Math.round(value));
  const h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60), sec = s % 60;
  return (h ? h + ':' + String(m).padStart(2, '0') : m) + ':' + String(sec).padStart(2, '0');
};
const fmtKbps = bps => bps >= 1e6 ? (bps / 1e6).toFixed(1) + ' Mbps' : Math.round(bps / 1000) + ' kbps';

function show(id) {
  ['setup', 'work', 'done', 'err'].forEach(s => { $(s).hidden = s !== id; });
  $('pick').hidden = id !== null && id !== 'err';
  $('howto').hidden = $('pick').hidden;
}
function showError(message) {
  $('err').textContent = message;
  show('err');
}
function clearOutput() {
  $('outVideo').pause();
  $('outVideo').removeAttribute('src');
  $('outVideo').load();
  if (outUrl) URL.revokeObjectURL(outUrl);
  outBlob = null; outUrl = null;
}
function resetAll() {
  loading?.abort(); loading = null;
  job?.cancel();
  $('preview').pause();
  $('preview').removeAttribute('src');
  $('preview').load();
  if (srcUrl) URL.revokeObjectURL(srcUrl);
  clearOutput();
  file = null; srcUrl = null; meta = null;
  $('pickBtn').disabled = false;
  $('pickBtn').textContent = 'Elegir video';
  show(null);
}

// Each media wait releases its listeners and timeout on success, failure or cancellation.
function waitMedia(video, event, signal, ready = () => false) {
  return new Promise((resolve, reject) => {
    let timer;
    const cleanup = () => {
      clearTimeout(timer);
      video.removeEventListener(event, success);
      video.removeEventListener('error', failure);
      signal.removeEventListener('abort', aborted);
    };
    const success = () => { cleanup(); resolve(); };
    const failure = () => { cleanup(); reject(new Error('Tu navegador no puede leer este video. Probá otro formato o navegador.')); };
    const aborted = () => { cleanup(); reject(new DOMException('Cancelado', 'AbortError')); };
    if (signal.aborted) { aborted(); return; }
    if (ready()) { success(); return; }
    video.addEventListener(event, success, { once: true });
    video.addEventListener('error', failure, { once: true });
    signal.addEventListener('abort', aborted, { once: true });
    timer = setTimeout(() => { cleanup(); reject(new Error('No se pudo leer el video a tiempo. Probá con otro archivo.')); }, 15000);
  });
}
async function loadFile(f) {
  resetAll();
  if (f.type && !f.type.startsWith('video/')) {
    showError('Eso no parece un video. Elegí un MP4, MOV o WebM.'); return;
  }
  const controller = new AbortController();
  loading = controller;
  const signal = controller.signal;
  file = f; srcUrl = URL.createObjectURL(f);
  const v = $('preview');
  $('pickBtn').disabled = true;
  $('pickBtn').textContent = 'Leyendo video…';
  try {
    const metadataReady = waitMedia(v, 'loadedmetadata', signal);
    v.src = srcUrl;
    await metadataReady;
    if (!Number.isFinite(v.duration)) {
      const seeked = waitMedia(v, 'seeked', signal);
      v.currentTime = 1e7;
      await seeked;
      v.currentTime = 0;
    }
    if (signal.aborted) return;
    meta = { w: v.videoWidth, h: v.videoHeight, dur: v.duration };
    createPlan(meta, 20); // Reject damaged or zero-length media before allowing compression.
    $('mName').textContent = f.name;
    $('mSize').textContent = fmtMB(f.size);
    $('mDur').textContent = fmtTime(meta.dur);
    $('mRes').textContent = meta.w + ' × ' + meta.h;
    $('target').value = f.size / MB > 20 ? 20 : fractionTarget(f.size, 0.5);
    syncChips(); updatePlan(); show('setup');
  } catch (error) {
    if (!signal.aborted) showError(error.message);
  } finally {
    if (loading === controller) {
      loading = null;
      $('pickBtn').disabled = false;
      $('pickBtn').textContent = 'Elegir video';
    }
  }
}

$('pickBtn').addEventListener('click', e => { e.stopPropagation(); input.click(); });
$('pick').addEventListener('click', e => { if (e.target !== input) input.click(); });
$('pick').addEventListener('keydown', e => {
  if (e.target === $('pick') && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); input.click(); }
});
input.addEventListener('change', () => { if (input.files[0]) loadFile(input.files[0]); input.value = ''; });
['dragenter', 'dragover'].forEach(ev => $('pick').addEventListener(ev, e => { e.preventDefault(); $('pick').classList.add('over'); }));
['dragleave', 'drop'].forEach(ev => $('pick').addEventListener(ev, e => { e.preventDefault(); $('pick').classList.remove('over'); }));
$('pick').addEventListener('drop', e => { const f = e.dataTransfer?.files?.[0]; if (f) loadFile(f); });
for (const id of ['changeBtn', 'newFile']) $(id).addEventListener('click', () => { resetAll(); input.click(); });

const computePlan = () => createPlan(meta, $('target').value, $('res').value);
function updatePlan() {
  if (!meta) return;
  let p;
  try { p = computePlan(); }
  catch (error) {
    $('go').disabled = true;
    $('plan').textContent = error.message;
    $('planWarn').hidden = true;
    return;
  }
  $('go').disabled = false;
  $('plan').textContent = 'Va a salir en ' + p.w + ' × ' + p.h + ' a ' + fmtKbps(p.vbps) + '. Procesarlo tarda unos ' + fmtTime(meta.dur) + '.';
  const warning = $('planWarn');
  if (file.size <= p.targetMB * MB) warning.textContent = 'El video ya pesa ' + fmtMB(file.size) + ', menos que lo que pediste. Podés mandarlo así.';
  else if (p.tooSmall) warning.textContent = 'Para un video de ' + fmtTime(meta.dur) + ' eso es muy poco: la imagen puede quedar borrosa y pesar más de lo pedido. Probá con más MB.';
  else { warning.hidden = true; return; }
  warning.hidden = false;
}
function syncChips() {
  const target = Number($('target').value);
  document.querySelectorAll('.chip').forEach(c => {
    const value = c.dataset.mb ? Number(c.dataset.mb) : file ? fractionTarget(file.size, Number(c.dataset.frac)) : NaN;
    c.setAttribute('aria-pressed', String(value === target));
  });
}
$('chips').addEventListener('click', e => {
  const c = e.target.closest('.chip'); if (!c || !file) return;
  $('target').value = c.dataset.mb ? Number(c.dataset.mb) : fractionTarget(file.size, Number(c.dataset.frac));
  syncChips(); updatePlan();
});
$('target').addEventListener('input', () => { syncChips(); updatePlan(); });
$('res').addEventListener('change', updatePlan);
$('again').addEventListener('click', () => { $('outVideo').pause(); show('setup'); updatePlan(); });
$('cancel').addEventListener('click', () => { job?.cancel(); show('setup'); });
$('go').addEventListener('click', start);

function pickMime() {
  return [
    'video/mp4;codecs=avc1.42E01E,mp4a.40.2', 'video/mp4;codecs=avc1.640028,mp4a.40.2',
    'video/mp4;codecs=avc1,mp4a.40.2', 'video/webm;codecs=vp9,opus',
    'video/webm;codecs=vp8,opus', 'video/webm', 'video/mp4',
  ].find(mime => MediaRecorder.isTypeSupported(mime));
}
async function start() {
  if (job || !meta) return;
  let p;
  try { p = computePlan(); } catch { updatePlan(); return; }
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!window.MediaRecorder || !HTMLCanvasElement.prototype.captureStream || !AC) {
    showError('Este navegador no puede comprimir videos. Abrí la página en Chrome, Edge o Safari actualizados.'); return;
  }
  const controller = new AbortController();
  const signal = controller.signal;
  let video, audio, recorder, canvasStream, stream, frameId, frameKind, endTimer;
  let cleaned = false;
  const cleanup = () => {
    if (cleaned) return;
    cleaned = true;
    clearTimeout(endTimer);
    if (frameKind === 'video') video?.cancelVideoFrameCallback?.(frameId);
    else if (frameId) clearTimeout(frameId);
    if (video) {
      video.onended = null; video.onerror = null; video.pause();
      video.removeAttribute('src'); video.load(); video.remove();
    }
    const tracks = new Set([...(stream?.getTracks() || []), ...(canvasStream?.getTracks() || [])]);
    tracks.forEach(track => track.stop());
    if (audio && audio.state !== 'closed') audio.close().catch(() => {});
    if (job === currentJob) job = null;
  };
  const currentJob = { cancel() {
    controller.abort();
    if (recorder?.state !== 'inactive') { try { recorder?.stop(); } catch {} }
    cleanup();
  } };
  job = currentJob;
  $('preview').pause(); clearOutput();
  $('barFill').style.width = '0%'; $('pct').textContent = '0%'; $('eta').textContent = '';
  document.querySelector('[role="progressbar"]').setAttribute('aria-valuenow', '0');
  show('work');
  const fail = message => { if (!signal.aborted) { currentJob.cancel(); showError(message); } };
  try {
    const canvas = $('canvas'); canvas.width = p.w; canvas.height = p.h;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('No se pudo preparar la imagen. Probá otro navegador.');
    video = document.createElement('video');
    video.id = 'worker'; video.playsInline = true; video.preload = 'auto';
    document.querySelector('.stage').appendChild(video);
    const canPlay = waitMedia(video, 'canplay', signal);
    video.src = srcUrl;
    audio = new AC();
    const resumed = audio.resume();
    await canPlay;
    await resumed;
    if (signal.aborted) return;
    const destination = audio.createMediaStreamDestination();
    audio.createMediaElementSource(video).connect(destination);
    canvasStream = canvas.captureStream(30);
    stream = new MediaStream([...canvasStream.getVideoTracks(), ...destination.stream.getAudioTracks()]);
    const opts = { videoBitsPerSecond: Math.round(p.vbps), audioBitsPerSecond: AUDIO_BPS };
    const mime = pickMime(); if (mime) opts.mimeType = mime;
    try { recorder = new MediaRecorder(stream, opts); }
    catch { delete opts.mimeType; recorder = new MediaRecorder(stream, opts); }
    const chunks = [];
    recorder.ondataavailable = e => { if (e.data?.size) chunks.push(e.data); };
    recorder.onerror = () => fail('El navegador no pudo guardar el video. Probá con menos resolución o con otro navegador.');
    recorder.onstop = () => {
      if (signal.aborted) return;
      const type = recorder.mimeType || chunks[0]?.type || 'video/webm';
      cleanup();
      outBlob = new Blob(chunks, { type });
      if (!outBlob.size) { showError('No se generó un video. Probá de nuevo con otro formato.'); return; }
      outExt = type.includes('mp4') ? 'mp4' : 'webm';
      finish(p);
    };
    const draw = () => {
      if (signal.aborted || cleaned) return;
      if (video.readyState >= 2) context.drawImage(video, 0, 0, p.w, p.h);
      const pct = Math.floor(Math.min(1, video.currentTime / meta.dur) * 100);
      $('barFill').style.width = pct + '%'; $('pct').textContent = pct + '%';
      document.querySelector('[role="progressbar"]').setAttribute('aria-valuenow', String(pct));
      $('eta').textContent = document.hidden ? 'Volvé a esta pestaña para continuar' : 'faltan ' + fmtTime(meta.dur - video.currentTime);
      // A timer also works when a browser reduces animation-frame callbacks.
      frameKind = 'timer'; frameId = setTimeout(draw, 1000 / 30);
    };
    video.onerror = () => fail('Se cortó la lectura del video. Probá de nuevo o con otro navegador.');
    video.onended = () => {
      $('barFill').style.width = '100%'; $('pct').textContent = '100%'; $('eta').textContent = 'Terminando…';
      document.querySelector('[role="progressbar"]').setAttribute('aria-valuenow', '100');
      endTimer = setTimeout(() => { if (!signal.aborted && recorder.state !== 'inactive') recorder.stop(); }, 200);
    };
    context.drawImage(video, 0, 0, p.w, p.h);
    recorder.start(1000);
    await video.play();
    if (signal.aborted) return;
    draw();
  } catch (error) {
    if (!signal.aborted) fail(error.message || 'No se pudo arrancar el proceso. Probá de nuevo o con otro navegador.');
  }
}

function finish(p) {
  outUrl = URL.createObjectURL(outBlob);
  $('outVideo').src = outUrl;
  $('rFrom').textContent = fmtMB(file.size);
  $('rTo').textContent = fmtMB(outBlob.size);
  const percent = Math.round((1 - outBlob.size / file.size) * 100);
  $('rDelta').textContent = percent > 0 ? '−' + percent + '%' : '+' + Math.abs(percent) + '%';
  const warning = $('overWarn');
  if (outBlob.size >= file.size) warning.textContent = 'Esta versión pesa igual o más que el original. Conservá el original o probá un tamaño y una resolución menores.';
  else if (outBlob.size > p.targetMB * MB * 1.05) warning.textContent = 'Superó los ' + p.targetMB + ' MB que pediste. Probá de nuevo pidiendo unos MB menos.';
  else { warning.hidden = true; }
  if (outBlob.size >= file.size || outBlob.size > p.targetMB * MB * 1.05) warning.hidden = false;
  $('dlMsg').textContent = 'Formato: ' + outExt.toUpperCase() + '. Podés reproducirlo antes de descargar.';
  show('done');
}
$('dl').addEventListener('click', () => {
  if (!outBlob || !outUrl) return;
  const base = (file.name.replace(/\.[^.]+$/, '') || 'video') + '-liviano.' + outExt;
  const link = document.createElement('a');
  link.href = outUrl; link.download = base; document.body.appendChild(link); link.click(); link.remove();
  $('dlMsg').textContent = 'Si no arrancó la descarga, usá la opción Descargar del reproductor.';
});
window.addEventListener('pagehide', () => { loading?.abort(); job?.cancel(); });
