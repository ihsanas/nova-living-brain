// Run on a trusted machine; never put the token into index.html or GitHub files.
import fs from 'node:fs';
if (!process.env.GH_TOKEN) throw Error('GH_TOKEN is required; do not paste credentials into chat');
if (!process.argv[2]) throw Error('Usage: node scripts/send-event.mjs event.json');
const event=JSON.parse(fs.readFileSync(process.argv[2],'utf8'));
if(event.public_safe!==true) throw Error('Review the summary and set public_safe:true before publishing');
const response=await fetch('https://api.github.com/repos/ihsanas/nova-living-brain/dispatches',{
 method:'POST',headers:{Authorization:'Bearer '+process.env.GH_TOKEN,Accept:'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28'},
 body:JSON.stringify({event_type:'nova-update',client_payload:{event}})
});
if(response.status!==204) throw Error('GitHub rejected event: HTTP '+response.status);
console.log('Event accepted. Check the NOVA update workflow in GitHub Actions.');
