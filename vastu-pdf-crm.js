// ═══ AUDIT REPORT → PDF (Employee CRM) ═══
// Needs: vastu-ppt-crm.js loaded (uses VP_LABELS + vpFindVal)

function vpdSecRows(obj){
  if(!obj) return '';
  return Object.entries(obj)
    .filter(([k,v]) => v && typeof v !== 'object')
    .map(([k,v]) => `<tr><td class="k">${esc(k.replace(/_/g,' '))}</td><td class="v">${esc(String(v))}</td></tr>`)
    .join('');
}
function vpdSection(title, obj){
  const rows = vpdSecRows(obj);
  if(!rows) return '';
  return `<div class="sec"><div class="sec-t">${esc(title)}</div><table>${rows}</table></div>`;
}

function generateAuditPDF(auditId){
  const r = (_auditsAll || []).find(x => x.id === auditId);
  if(!r){ showToast('Report not found','err'); return; }
  const fd = r.form_data || {};
  const photos = fd.pointer_photos || {};
  const notes  = fd.pointer_notes  || {};

  const items = Object.keys(typeof VP_LABELS!=='undefined' ? VP_LABELS : {})
    .filter(k => (notes[k] && String(notes[k]).trim()) || (photos[k] && photos[k].length))
    .map(k => ({
      label: VP_LABELS[k],
      val: (typeof vpFindVal==='function' ? vpFindVal(fd,k) : ''),
      note: String(notes[k]||'').trim(),
      urls: photos[k] || []
    }));

  const score = r.svr_score;
  const scoreCol = score>=80 ? '#1E8449' : score>=55 ? '#B7791F' : '#C0392B';

  const obsHtml = items.length ? items.map((it,i) => `
      <div class="obs">
        <div class="obs-h"><span class="obs-n">${String(i+1).padStart(2,'0')}</span> ${esc(it.label)}</div>
        ${it.val ? `<div class="obs-v">${esc(it.val)}</div>` : ''}
        ${it.note ? `<div class="obs-note">${esc(it.note)}</div>` : ''}
        ${it.urls.length ? `<div class="obs-ph">${it.urls.map(u=>`<img src="${esc(u)}">`).join('')}</div>` : ''}
      </div>`).join('') : '<div class="empty">No observations or photos recorded.</div>';

  const html = `<!doctype html><html><head><meta charset="utf-8">
<title>${esc(r.ref_id||'Vastu Audit Report')}</title>
<style>
  *{box-sizing:border-box}
  body{font-family:Georgia,'Times New Roman',serif;color:#2b2b2b;margin:0;padding:34px 40px;background:#fff}
  .hd{text-align:center;border-bottom:2px solid #8a6d2f;padding-bottom:14px;margin-bottom:20px}
  .hd h1{margin:0;font-size:21px;letter-spacing:1.4px;color:#1b1b1b}
  .hd .sub{font-size:11px;letter-spacing:2px;color:#8a6d2f;text-transform:uppercase;margin-top:4px}
  .meta{display:flex;justify-content:space-between;font-size:11px;color:#6b6152;margin-bottom:18px}
  .verdict{padding:11px;border-radius:8px;text-align:center;font-weight:700;font-size:13px;margin-bottom:8px;background:#fdf6e6;color:#8a6d2f;border:1px solid #e8dcc0}
  .score{text-align:center;font-size:12px;color:#6b6152;margin-bottom:20px}
  .score b{font-size:26px;color:${scoreCol}}
  .sec{margin-bottom:15px;break-inside:avoid}
  .sec-t{font-size:10.5px;font-weight:700;color:#8a6d2f;text-transform:uppercase;letter-spacing:1px;margin-bottom:5px;border-bottom:1px solid #e8dcc0;padding-bottom:3px}
  table{width:100%;border-collapse:collapse}
  td{padding:3.5px 0;font-size:11.5px;border-bottom:1px dashed #eee;vertical-align:top}
  td.k{color:#6b6152;width:47%}
  td.v{font-weight:700;text-align:right}
  h2.obs-title{font-size:13px;color:#8a6d2f;text-transform:uppercase;letter-spacing:1.2px;margin:24px 0 10px;border-bottom:2px solid #8a6d2f;padding-bottom:5px}
  .obs{border:1px solid #e8dcc0;border-radius:8px;padding:11px 13px;margin-bottom:11px;break-inside:avoid}
  .obs-h{font-size:12.5px;font-weight:700;color:#1b1b1b}
  .obs-n{display:inline-block;background:#8a6d2f;color:#fff;border-radius:4px;padding:1px 6px;font-size:11px;margin-right:6px}
  .obs-v{font-size:11.5px;color:#4a4a4a;margin-top:3px}
  .obs-note{font-size:11.5px;font-style:italic;color:#5c5344;margin-top:6px;padding-left:9px;border-left:2px solid #d9c9a3}
  .obs-ph{display:flex;gap:6px;flex-wrap:wrap;margin-top:8px}
  .obs-ph img{width:150px;height:112px;object-fit:cover;border-radius:5px;border:1px solid #e3ddd0}
  .empty{font-size:12px;color:#8a8a8a;font-style:italic;padding:14px 0}
  .ft{margin-top:26px;border-top:1px solid #e8dcc0;padding-top:9px;text-align:center;font-size:10px;color:#8a8a8a}
  @media print{ body{padding:16px 20px} .obs-ph img{width:135px;height:100px} @page{margin:12mm} }
</style></head><body>
  <div class="hd"><h1>SAYASH VASTU</h1><div class="sub">Built-Up Property Vastu Audit Report</div></div>
  <div class="meta"><span>Ref: ${esc(r.ref_id||'-')}</span><span>${fmtDate(r.audit_date)}</span></div>
  <div class="verdict">${esc(r.verdict)||'No verdict recorded'}</div>
  <div class="score">SVR&trade; Score &nbsp; <b>${score ?? '-'}</b> / 100</div>
  ${vpdSection('Client Details', fd.client)}
  ${vpdSection('Property Details', fd.property)}
  ${vpdSection('Site Facing', fd.facing)}
  ${vpdSection('Building', fd.building)}
  ${vpdSection('Cores', fd.cores)}
  ${vpdSection('Utilities', fd.utilities)}
  ${vpdSection('Access', fd.access)}
  ${vpdSection('Surroundings', fd.surroundings)}
  ${vpdSection('Assessment', fd.assessment)}
  <h2 class="obs-title">Site Observations</h2>
  ${obsHtml}
  <div class="ft">Sayash Vastu Corp &nbsp;·&nbsp; Satish Gupta &amp; Yash Gupta (Vastu Consultants)<br>Inspector: ${esc(r.inspector_name)||'-'}</div>
</body></html>`;

  const w = window.open('', '_blank');
  if(!w){ showToast('Popup blocked — please allow popups','err'); return; }
  w.document.write(html);
  w.document.close();
  showToast('📄 Report opened — use Print → Save as PDF','ok');
  setTimeout(()=>{ try{ w.focus(); w.print(); }catch(e){} }, 900);
}
