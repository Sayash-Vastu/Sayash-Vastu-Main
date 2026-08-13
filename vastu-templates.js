// ═══ TEMPLATE MANAGER — apni PPT upload karke naya template banao ═══
// Zaroori: JSZip loaded ho, aur `sbA` (form) ya `sb` (CRM) supabase client maujood ho.
const VT_SB = (typeof sbA !== 'undefined') ? sbA : (typeof sb !== 'undefined' ? sb : null);
const VT_BUCKET = 'ppt-templates';
let VT_CACHE = null;

// ── PPT ke andar se anchors khud dhoondo ──
function vtParas(xml){
  const out=[];
  const re=/<a:p>[\s\S]*?<\/a:p>/g; let m;
  while((m=re.exec(xml))){
    const txt=(m[0].match(/<a:t>[^<]*<\/a:t>/g)||[]).map(t=>t.slice(5,-6)).join('')
      .replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').trim();
    if(!txt) continue;
    const sz=+((m[0].match(/sz="(\d+)"/)||[])[1]||0);
    out.push({txt, sz, first:txt.slice(0,22)});
  }
  return out;
}
function vtPics(xml){
  const out=[];
  const re=/<p:pic>[\s\S]*?<\/p:pic>/g; let m;
  while((m=re.exec(xml))){
    const rid=(m[0].match(/r:embed="(rId\d+)"/)||[])[1];
    const ex=m[0].match(/<a:ext cx="(\d+)" cy="(\d+)"/);
    if(rid&&ex) out.push({rid, area:(+ex[1])*(+ex[2]), w:+ex[1], h:+ex[2]});
  }
  return out.sort((a,b)=>b.area-a.area);
}

async function vtDetect(zip){
  const g = async n => { const f=zip.file('ppt/slides/slide'+n+'.xml'); return f?await f.async('string'):''; };
  const s1=await g(1), s2=await g(2), s3=await g(3);
  if(!s1||!s2||!s3) throw new Error('Template me kam se kam 3 slides honi chahiye (cover, direction, key considerations)');

  const p1=vtParas(s1), p2=vtParas(s2), p3=vtParas(s3);
  const find=(arr,re)=>{ const h=arr.find(p=>re.test(p.txt)); return h?h.first:null; };

  // cover: sabse bada font = client name, uske baad wala = property
  const skip1=/SATISH|CONSULTANT|STRATEGIC ANALYSIS|Recommendation on|Site visited on|^VR\s*\/|^\d+$/i;
  const big=[...p1].filter(p=>!skip1.test(p.txt)).sort((a,b)=>b.sz-a.sz);
  const client = big[0] ? big[0].first : null;
  const prop   = big[1] && big[1].first!==client ? big[1].first : null;

  const cfg={
    cover:{ client, prop,
      title: find(p1,/STRATEGIC ANALYSIS|VASTU STRATEGIC/i),
      date : find(p1,/Recommendation on|Site visited on/i),
      vr   : find(p1,/^VR\s*\//i) },
    site:{ prop: (p2.find(p=>p.txt.length>4
        && !/DIRECTION|SITE INFO|NORTH|ALIGN|The site|The plot|Tap Here|SATISH|CONSULTANT|Google|Map|Orientation|Reference|Observation|PROJECT|Facing|^\d+$/i.test(p.txt)
        && !/^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s*\d{4}$/i.test(p.txt))||{}).first || null,
      facing: find(p2,/The site is|The plot is/i),
      facingVal: null },
    obs:{ prop: (p3.find(p=>/^PROJECT/i.test(p.txt)) ? (p3[p3.findIndex(p=>/^PROJECT/i.test(p.txt))+1]||{}).first : null),
      body: (p3.filter(p=>p.txt.length>60).sort((a,b)=>b.txt.length-a.txt.length)[0]||{}).first || null,
      headRid: null, photoRid: null }
  };

  const pics=vtPics(s3);
  if(pics.length){
    cfg.obs.photoRid = pics[0].rid;                                  // sabse badi image = site photo
    const head = pics.find(p=>p.rid!==pics[0].rid && p.w>2500000 && p.h<900000); // chaudi patli = heading strip
    cfg.obs.headRid = head ? head.rid : null;
  }
  const fv=(p2.find(p=>/Facing$|facing\.?$/i.test(p.txt)&&p.txt.length<28&&!/The site|The plot/i.test(p.txt))||{}).first;
  if(fv && fv!==cfg.site.facing) cfg.site.facingVal=fv;
  if(cfg.site.prop===cfg.obs.prop && cfg.site.prop===null) cfg.site.prop=null;
  if(!cfg.obs.body) throw new Error('Slide 3 me koi bada paragraph nahi mila — observation slide chahiye');
  return cfg;
}

// ── upload ──
async function vtUpload(file, label){
  if(!VT_SB) throw new Error('Supabase client nahi mila');
  if(!/\.pptx$/i.test(file.name)) throw new Error('Sirf .pptx file chalegi');
  const buf=await file.arrayBuffer();
  const zip=await JSZip.loadAsync(buf);
  const cfg=await vtDetect(zip);
  const key='tpl_'+Date.now();
  const path=key+'.pptx';
  const up=await VT_SB.storage.from(VT_BUCKET).upload(path,new Blob([buf]),{contentType:'application/vnd.openxmlformats-officedocument.presentationml.presentation',upsert:true});
  if(up.error) throw new Error('Upload fail: '+up.error.message);
  const url=VT_SB.storage.from(VT_BUCKET).getPublicUrl(path).data.publicUrl;
  const ins=await VT_SB.from('ppt_templates').insert({tpl_key:key,label:label,file_url:url,anchors:cfg});
  if(ins.error) throw new Error('Save fail: '+ins.error.message);
  VT_CACHE=null;
  return {key,label,cfg};
}

// ── load (built-in + DB) ──
async function vtLoadAll(){
  if(VT_CACHE) return VT_CACHE;
  const out={};
  if(typeof PPT_TEMPLATES!=='undefined') Object.keys(PPT_TEMPLATES).forEach(k=>out[k]=PPT_TEMPLATES[k]);
  try{
    if(VT_SB){
      const {data}=await VT_SB.from('ppt_templates').select('*').order('created_at',{ascending:true});
      (data||[]).forEach(r=>{ out[r.tpl_key]=Object.assign({file:r.file_url,label:r.label},r.anchors); });
    }
  }catch(e){ console.error('template load',e); }
  VT_CACHE=out;
  if(typeof PPT_TEMPLATES!=='undefined') Object.keys(out).forEach(k=>{ PPT_TEMPLATES[k]=out[k]; });
  return out;
}

async function vtFillSelect(selId){
  const el=document.getElementById(selId); if(!el) return;
  const all=await vtLoadAll();
  const cur=el.value;
  el.innerHTML=Object.keys(all).map(k=>'<option value="'+k+'">'+(all[k].label||k)+'</option>').join('');
  if(cur&&all[cur]) el.value=cur;
}

// ── upload UI popup (CRM ke liye) ──
function openTemplateManager(){
  const box=document.createElement('div');
  box.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:9999;display:flex;align-items:center;justify-content:center';
  box.innerHTML='<div style="background:#fff;border-radius:12px;padding:22px;width:400px;box-shadow:0 12px 40px rgba(0,0,0,.25)">'
   +'<div style="font-weight:700;font-size:15px;margin-bottom:3px">Add PPT Template</div>'
   +'<div style="font-size:12px;color:#6b7280;margin-bottom:14px">Koi bhi purani Vastu report PPT upload karo — usi design me aage se report banegi.</div>'
   +'<input id="vt-label" placeholder="Client / template ka naam" style="width:100%;padding:9px;border:1px solid #e2e5ec;border-radius:8px;font:inherit;margin-bottom:10px">'
   +'<input type="file" id="vt-file" accept=".pptx" style="width:100%;padding:9px;border:1px solid #e2e5ec;border-radius:8px;font:inherit;margin-bottom:6px">'
   +'<div id="vt-msg" style="font-size:12px;color:#6b7280;margin-bottom:12px;min-height:16px"></div>'
   +'<div style="display:flex;gap:8px"><button id="vt-cancel" style="flex:1;padding:9px;border:1px solid #e2e5ec;background:#fff;border-radius:8px;cursor:pointer">Cancel</button>'
   +'<button id="vt-save" style="flex:1;padding:9px;border:0;background:#8a6d2f;color:#fff;border-radius:8px;cursor:pointer;font-weight:600">Save Template</button></div></div>';
  document.body.appendChild(box);
  const msg=t=>box.querySelector('#vt-msg').textContent=t;
  box.querySelector('#vt-cancel').onclick=()=>box.remove();
  box.onclick=e=>{if(e.target===box)box.remove();};
  box.querySelector('#vt-save').onclick=async()=>{
    const lab=box.querySelector('#vt-label').value.trim();
    const f=box.querySelector('#vt-file').files[0];
    if(!lab||!f){ msg('Naam aur file dono chahiye'); return; }
    msg('⏳ Analyse ho raha hai...');
    try{
      const r=await vtUpload(f,lab);
      msg('✅ "'+lab+'" add ho gaya');
      setTimeout(()=>{ box.remove(); if(typeof loadAuditReports==='function') loadAuditReports(); },1200);
    }catch(e){ msg('❌ '+e.message); }
  };
}
