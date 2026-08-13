// ═══ VASTU PPT GENERATOR (template-based) ═══
// needs: <script src="https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js"></script>
// needs: template.pptx in same folder as index.html

const PPT_ESC = s => String(s==null?'':s)
  .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');


// ═══ TEMPLATES ═══ (file, and the anchor texts to replace inside it)
const PPT_TEMPLATES = {
  ckpc: { file:'template-ckpc.pptx', label:'CKPC Properties',
          cover:{client:'CKPC', prop:'HEAD OFFICE', title:'VASTU STRATEGIC', date:'Site visited on', vr:'VR/'},
          site:{prop:'Head Office, ', facing:'The site is', facingVal:'North-East Facing'},
          obs:{prop:'Head Office, ', body:'During the site visit', headRid:'rId7', photoRid:'rId3'} },
  max:  { file:'template-max.pptx', label:'MAX Healthcare',
          cover:{client:'MAX HEALTHCARE', prop:'VR Capitol', title:'VASTU STRATEGIC', date:'Recommendation on', vr:'VR/'},
          site:{prop:'Capitol Hospital', facing:'The site is', facingVal:'North-West'},
          obs:{prop:'Capitol Hospital', body:'The', headRid:null, photoRid:'rId3'} },
  sg:   { file:'template-sg.pptx', label:'Signature Global',
          cover:{client:'SIGNATURE GLOBAL', prop:'RESIDENTIAL COMMUNITY', title:'VASTU STRATEGIC', date:'Recommendation on', vr:null},
          site:{prop:null, facing:null, facingVal:null},
          obs:{prop:null, body:'The plot is', headRid:null, photoRid:'rId3'} }
};

// replace a paragraph's text, keeping its formatting
function pptSetPara(xml, anchor, newText){
  const i = xml.indexOf('<a:t>'+anchor);
  if(i<0) return xml;
  const ps = xml.lastIndexOf('<a:p>', i);
  const pe = xml.indexOf('</a:p>', i) + 6;
  const para = xml.slice(ps, pe);
  const rPr = (para.match(/<a:rPr[^>]*\/>|<a:rPr[^>]*>[\s\S]*?<\/a:rPr>/)||[''])[0];
  const pPr = (para.match(/<a:pPr[^>]*\/>|<a:pPr[^>]*>[\s\S]*?<\/a:pPr>/)||[''])[0];
  return xml.slice(0,ps) + '<a:p>'+pPr+'<a:r>'+rPr+'<a:t>'+PPT_ESC(newText)+'</a:t></a:r></a:p>' + xml.slice(pe);
}

// wipe all paragraphs after the first inside the body text shape
function pptCollapseBody(xml, anchor){
  const i = xml.indexOf('<a:t>'+anchor);
  if(i<0) return xml;
  const bodyEnd = xml.indexOf('</p:txBody>', i);
  const firstEnd = xml.indexOf('</a:p>', i)+6;
  return xml.slice(0,firstEnd) + xml.slice(bodyEnd);
}

const EMU = 914400;
function pptTextBox(id, name, x, y, w, h, runs){
  return '<p:sp><p:nvSpPr><p:cNvPr id="'+id+'" name="'+name+'"/><p:cNvSpPr txBox="1"/><p:nvPr/></p:nvSpPr>'
    +'<p:spPr><a:xfrm><a:off x="'+Math.round(x*EMU)+'" y="'+Math.round(y*EMU)+'"/>'
    +'<a:ext cx="'+Math.round(w*EMU)+'" cy="'+Math.round(h*EMU)+'"/></a:xfrm>'
    +'<a:prstGeom prst="rect"><a:avLst/></a:prstGeom><a:noFill/></p:spPr>'
    +'<p:txBody><a:bodyPr wrap="square" rtlCol="0"><a:spAutoFit/></a:bodyPr><a:lstStyle/>'+runs+'</p:txBody></p:sp>';
}
function pptRun(text, sz, bold, color){
  return '<a:p><a:r><a:rPr lang="en-IN" sz="'+sz+'"'+(bold?' b="1"':'')
    +' dirty="0"><a:solidFill><a:srgbClr val="'+color+'"/></a:solidFill>'
    +'<a:latin typeface="+mn-lt"/></a:rPr><a:t>'+PPT_ESC(text)+'</a:t></a:r></a:p>';
}


// ═══ CRM VERSION: saved audit row se PPT banao ═══
const VP_LABELS={facing:'Building Facing',corner:'Corner Plot Type','setback-bal':'Setback Balance',brahma:'Brahmasthan (Centre)','stair-zone':'Staircase Location','stair-dir':'Staircase Direction','lift-zone':'Lift Location','toilet-ne':'NE Toilet Check','dg-zone':'DG Set Location','stp-zone':'STP Location','ugt-zone':'Water Tank (UGT) Location','oht-zone':'Overhead Tank (OHT) Location','entry-dir':'Main Entry Direction','entry-pos':'Main Entry Position','ramp-zone':'Ramp Location','ramp-slope':'Ramp Slope Direction',drain2:'Drainage Zone',water2:'Water Body Proximity',pole2:'Electric Pole Position',ht2:'HT Wire Proximity',temple2:'Temple Shadow',cem2:'Cemetery Proximity'};

// form_data me pointer ka answer dhoondo (nested objects me)
function vpFindVal(fd, key){
  const map={facing:['facing','direction'],corner:['facing','corner'],'setback-bal':['building','setback_balance'],
   brahma:['building','brahmasthan'],'stair-zone':['cores','staircase_zone'],'stair-dir':['cores','staircase_direction'],
   'lift-zone':['cores','lift_zone'],'toilet-ne':['cores','toilet_ne_check'],'dg-zone':['utilities','dg_zone'],
   'stp-zone':['utilities','stp_zone'],'ugt-zone':['utilities','ugt_zone'],'oht-zone':['utilities','oht_zone'],
   'entry-dir':['access','entry_direction'],'entry-pos':['access','entry_position'],'ramp-zone':['access','ramp_zone'],
   'ramp-slope':['access','ramp_slope'],drain2:['surroundings','drainage'],water2:['surroundings','water_body'],
   pole2:['surroundings','pole'],ht2:['surroundings','ht_wire'],temple2:['surroundings','temple'],cem2:['surroundings','cemetery']};
  const m=map[key];
  return (m && fd[m[0]] && fd[m[0]][m[1]]) || '';
}

async function vpUrlToB64(url){
  try{
    const r=await fetch(url);
    const b=await r.blob();
    return await new Promise(res=>{const fr=new FileReader();fr.onload=e=>res(e.target.result);fr.onerror=()=>res(null);fr.readAsDataURL(b);});
  }catch(e){ console.error('photo fetch fail',url,e); return null; }
}

async function generateAuditPPT(auditId, tplKey){
  const row=(_auditsAll||[]).find(x=>x.id===auditId);
  if(!row){ showToast('Report nahi mili','err'); return; }
  const T=PPT_TEMPLATES[tplKey||'ckpc'];
  const fd=row.form_data||{};
  const photos=fd.pointer_photos||{}, notes=fd.pointer_notes||{};

  const items=Object.keys(VP_LABELS)
    .filter(k=>(notes[k]&&String(notes[k]).trim())||(photos[k]&&photos[k].length))
    .map(k=>({key:k,label:VP_LABELS[k],val:vpFindVal(fd,k),note:String(notes[k]||'').trim(),urls:photos[k]||[]}));

  if(!items.length){ showToast('Is report me koi observation ya photo nahi hai','warn'); return; }

  showToast('⏳ PPT ban raha hai...','warn');
  try{
    const propName=row.property_name||'Property';
    const clientNm=(row.client_name||'CLIENT').toUpperCase();
    const dateStr=row.audit_date?new Date(row.audit_date).toLocaleDateString('en-IN',{day:'numeric',month:'long',year:'numeric'}):'';
    const vrNo=(fd.property&&fd.property.vr_ref)||'';
    const facing=(fd.facing&&fd.facing.direction)||'—';

    const zip=await JSZip.loadAsync(await (await fetch(T.file)).arrayBuffer());

    let s1=await zip.file('ppt/slides/slide1.xml').async('string');
    if(T.cover.client) s1=pptSetPara(s1,T.cover.client,clientNm);
    if(T.cover.prop) s1=pptSetPara(s1,T.cover.prop,propName.toUpperCase());
    if(T.cover.title) s1=pptSetPara(s1,T.cover.title,'VASTU STRATEGIC ANALYSIS');
    if(T.cover.date) s1=pptSetPara(s1,T.cover.date,T.cover.date+' - '+dateStr);
    if(vrNo&&T.cover.vr) s1=pptSetPara(s1,T.cover.vr,vrNo);
    zip.file('ppt/slides/slide1.xml',s1);

    let s2=await zip.file('ppt/slides/slide2.xml').async('string');
    if(T.site.prop) s2=pptSetPara(s2,T.site.prop,propName);
    if(T.site.facing) s2=pptSetPara(s2,T.site.facing,'The site is '+facing+'.');
    if(T.site.facingVal) s2=pptSetPara(s2,T.site.facingVal,facing);
    zip.file('ppt/slides/slide2.xml',s2);

    const tplXml=await zip.file('ppt/slides/slide3.xml').async('string');
    const tplRels=await zip.file('ppt/slides/_rels/slide3.xml.rels').async('string');
    let pres=await zip.file('ppt/presentation.xml').async('string');
    let presRels=await zip.file('ppt/_rels/presentation.xml.rels').async('string');
    let ct=await zip.file('[Content_Types].xml').async('string');
    const sldIds=[...pres.matchAll(/<p:sldId id="(\d+)" r:id="(rId\d+)"\/>/g)];
    const keep=sldIds.slice(0,2).map(m=>m[0]);
    let maxId=Math.max(...sldIds.map(m=>+m[1]));
    let maxRid=Math.max(...[...presRels.matchAll(/Id="rId(\d+)"/g)].map(m=>+m[1]));
    const added=[]; let mediaN=900;

    for(let i=0;i<items.length;i++){
      const it=items[i], n=10+i;
      let x=tplXml, rels=tplRels;
      if(T.obs.prop) x=pptSetPara(x,T.obs.prop,propName);
      x=pptCollapseBody(x,T.obs.body);
      x=pptSetPara(x,T.obs.body,it.note||'(observation pending)');
      if(T.obs.headRid) x=x.replace(new RegExp('<p:pic>(?:(?!</p:pic>)[\\s\\S])*?r:embed="'+T.obs.headRid+'"[\\s\\S]*?</p:pic>','g'),'');

      let dataUrl=null;
      if(it.urls.length) dataUrl=await vpUrlToB64(it.urls[0]);
      if(dataUrl){
        const b64=dataUrl.split(',')[1];
        const mName='uimg'+(++mediaN)+'.jpg';
        zip.file('ppt/media/'+mName,b64,{base64:true});
        rels=rels.replace(new RegExp('(<Relationship Id="'+T.obs.photoRid+'"[^>]*Target=")[^"]*(")'),'$1../media/'+mName+'$2');
        if(!/Extension="jpg"/.test(ct)) ct=ct.replace(/(<Types[^>]*>)/,'$1<Default Extension="jpg" ContentType="image/jpeg"/>');
      }else{
        x=x.replace(new RegExp('<p:pic>(?:(?!</p:pic>)[\\s\\S])*?r:embed="'+T.obs.photoRid+'"[\\s\\S]*?</p:pic>','g'),'');
      }

      const head=pptTextBox(9000+i,'Head'+i,0.39,1.68,5.4,0.5,
        pptRun(String(i+1).padStart(2,'0')+'   '+it.label.toUpperCase(),1400,true,'F47D35'));
      const sub=it.val?pptTextBox(9500+i,'Sub'+i,0.42,2.18,5.4,0.35,pptRun(it.val,1050,false,'4A4A4A')):'';
      x=x.replace('</p:spTree>',head+sub+'</p:spTree>');

      zip.file('ppt/slides/slide'+n+'.xml',x);
      zip.file('ppt/slides/_rels/slide'+n+'.xml.rels',rels);
      maxId++;maxRid++;
      added.push('<p:sldId id="'+maxId+'" r:id="rId'+maxRid+'"/>');
      presRels=presRels.replace('</Relationships>','<Relationship Id="rId'+maxRid+'" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide" Target="slides/slide'+n+'.xml"/></Relationships>');
      ct=ct.replace('</Types>','<Override PartName="/ppt/slides/slide'+n+'.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/></Types>');
    }

    pres=pres.replace(/<p:sldIdLst>[\s\S]*?<\/p:sldIdLst>/,'<p:sldIdLst>'+keep.join('')+added.join('')+'</p:sldIdLst>');
    presRels=presRels.replace(/<Relationship[^>]*Target="slides\/slide3\.xml"[^>]*\/>/g,'');
    ct=ct.replace(/<Override[^>]*PartName="\/ppt\/slides\/slide3\.xml"[^>]*\/>/g,'');
    zip.remove('ppt/slides/slide3.xml'); zip.remove('ppt/slides/_rels/slide3.xml.rels');
    zip.file('ppt/presentation.xml',pres);
    zip.file('ppt/_rels/presentation.xml.rels',presRels);
    zip.file('[Content_Types].xml',ct);

    const blob=await zip.generateAsync({type:'blob',compression:'DEFLATE'});
    const a=document.createElement('a');
    a.href=URL.createObjectURL(blob);
    a.download=(vrNo?vrNo.replace(/\//g,'-'):(row.ref_id||'Vastu-Report'))+' - '+propName+'.pptx';
    a.click();
    setTimeout(()=>URL.revokeObjectURL(a.href),4000);
    showToast('✅ PPT ready','ok');
  }catch(e){
    console.error(e);
    showToast('❌ PPT fail: '+e.message,'err');
  }
}

function openPptPicker(auditId){
  const r=(_auditsAll||[]).find(x=>x.id===auditId);
  const box=document.createElement('div');
  box.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:9999;display:flex;align-items:center;justify-content:center';
  box.innerHTML='<div style="background:#fff;border-radius:12px;padding:22px;width:330px;box-shadow:0 12px 40px rgba(0,0,0,.25)">'
    +'<div style="font-weight:700;font-size:15px;margin-bottom:4px">Download PPT</div>'
    +'<div style="font-size:12px;color:#6b7280;margin-bottom:14px">'+((r&&(r.client_name||r.ref_id))||'')+'</div>'
    +'<div style="font-size:11px;color:#6b7280;margin-bottom:6px">Template</div>'
    +'<select id="vp-tpl" style="width:100%;padding:9px;border:1px solid #e2e5ec;border-radius:8px;font:inherit;margin-bottom:14px">'
    +'<option value="ckpc">CKPC Properties</option><option value="max">MAX Healthcare</option><option value="sg">Signature Global</option></select>'
    +'<div style="display:flex;gap:8px"><button id="vp-cancel" style="flex:1;padding:9px;border:1px solid #e2e5ec;background:#fff;border-radius:8px;cursor:pointer">Cancel</button>'
    +'<button id="vp-go" style="flex:1;padding:9px;border:0;background:#8a6d2f;color:#fff;border-radius:8px;cursor:pointer;font-weight:600">Generate</button></div></div>';
  document.body.appendChild(box);
  vtFillSelect('vp-tpl');
  box.querySelector('#vp-cancel').onclick=()=>box.remove();
  box.querySelector('#vp-cancel').onclick=()=>box.remove();
  box.onclick=e=>{if(e.target===box)box.remove();};
  box.querySelector('#vp-go').onclick=()=>{const t=box.querySelector('#vp-tpl').value;box.remove();generateAuditPPT(auditId,t);};
}
