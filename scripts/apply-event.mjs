import fs from 'node:fs';
import crypto from 'node:crypto';
import { pathToFileURL } from 'node:url';
export function applyEvent(state, event) {
  if (!event || event.public_safe !== true) throw Error('Only explicitly public-safe summaries are accepted');
  for (const key of ['id','module','summary','next','source']) {
    if (typeof event[key] !== 'string' || !event[key].trim() || event[key].length > 1500) throw Error('Invalid '+key);
  }
  if (!/^[a-zA-Z0-9._:-]{1,120}$/.test(event.id)) throw Error('Invalid event ID');
  const source = new URL(event.source);
  if (source.protocol !== 'https:' || source.username || source.password) throw Error('Source must be an HTTPS evidence link');
  if ('score' in event || 'illustrative_score' in event || 'evidence_status' in event) throw Error('Automatic score or evidence promotion is not permitted');
  const result = structuredClone(state);
  const module = result.modules.find(m => m.id === event.module);
  if (!module) throw Error('Unknown module');
  result.history ??= [];
  if (result.history.some(h => h.event_id === event.id)) return {state:result, changed:false};
  module.current = event.summary;
  module.next = event.next;
  result.updated = new Date().toISOString();
  result.history.unshift({event_id:event.id, date:result.updated, status:'Catatan baru / belum tervalidasi', note:event.summary, source:event.source, module:event.module});
  return {state:result,changed:true};
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const envelope = JSON.parse(fs.readFileSync(process.env.GITHUB_EVENT_PATH, 'utf8'));
  const event = envelope.client_payload?.event ?? JSON.parse(envelope.inputs?.event_json ?? 'null');
  const file = 'data/progress.json';
  const before = fs.readFileSync(file,'utf8');
  const result = applyEvent(JSON.parse(before),event);
  if (result.changed) {
    const temp = file+'.'+crypto.randomUUID()+'.tmp';
    fs.writeFileSync(temp,JSON.stringify(result.state,null,2)+'\n');
    fs.renameSync(temp,file);
  }
  console.log(result.changed ? 'NOVA event applied' : 'Duplicate event ignored');
}
