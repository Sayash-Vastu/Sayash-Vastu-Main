// ═══ PERFORMANCE — period filters + automatic Star of the Month ═══
// No buttons to press: scores compute from tasks + attendance.

let PERF_PERIOD = 'month';   // month | quarter | year
let PERF_OFFSET = 0;         // 0 = current, -1 = previous, ...

function perfRange(period, off){
  off = off || 0;
  const n = new Date(), y = n.getFullYear(), m = n.getMonth();
  let s, e, label;
  if(period === 'year'){
    const yy = y + off;
    s = new Date(yy,0,1); e = new Date(yy,11,31);
    label = String(yy);
  } else if(period === 'quarter'){
    const q = Math.floor(m/3) + off;
    const yy = y + Math.floor(q/4);
    const qq = ((q % 4) + 4) % 4;
    s = new Date(yy,qq*3,1); e = new Date(yy,qq*3+3,0);
    label = 'Q'+(qq+1)+' '+yy;
  } else {
    s = new Date(y, m+off, 1); e = new Date(y, m+off+1, 0);
    label = s.toLocaleDateString('en-IN',{month:'long',year:'numeric'});
  }
  const f = d => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  return {start:f(s), end:f(e), startD:s, endD:e, label};
}

function perfPeriodOptions(period){
  const out = [];
  for(let i=0; i>=-11; i--){
    const r = perfRange(period, i);
    out.push({off:i, label:r.label});
    if(period==='year' && i<=-4) break;
    if(period==='quarter' && i<=-7) break;
  }
  return out;
}

function perfInitials(n){ return String(n||'').trim().split(/\s+/).map(w=>w[0]).join('').slice(0,2).toUpperCase(); }

async function perfComputeStats(period){
  const R = perfRange(period, PERF_OFFSET);
  const today = new Date(); today.setHours(0,0,0,0);

  const [{data:emps},{data:tasks},{data:att},{data:hlds},svRes,auRes] = await Promise.all([
    sb.from('employees').select('name,email,designation,role').eq('is_active',true).order('name'),
    sb.from('tasks').select('*').eq('is_archived',false),
    sb.from('attendance').select('*').eq('is_archived',false).gte('date',R.start).lte('date',R.end),
    sb.from('holidays').select('date').gte('date',R.start).lte('date',R.end),
    Promise.resolve(
      typeof sbClient!=='undefined'
        ? sbClient.from('site_visits').select('visited_by,visit_date').gte('visit_date',R.start).lte('visit_date',R.end)
        : {data:[]}
    ).then(r=>r||{data:[]}).catch(()=>({data:[]})),
    Promise.resolve(
      sb.from('vastu_audits').select('inspector_name,created_at')
        .gte('created_at',R.start).lte('created_at',R.end+'T23:59:59')
    ).then(r=>r||{data:[]}).catch(()=>({data:[]}))
  ]);
  const siteVisits = (svRes && svRes.data) || [];
  const audits     = (auRes && auRes.data) || [];

  const holidaySet = new Set((hlds||[]).map(h=>h.date));
  let workingDays = 0;
  // full-period working days (so % grows toward 100% as the period completes)
  for(let d = new Date(R.startD); d <= R.endD; d.setDate(d.getDate()+1)){
  const ds = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    if(d.getDay() === 0) continue;
    if(holidaySet.has(ds)) continue;
    workingDays++;
  }

  const done = ['Completed','Report Ready'];
  const taskDate = t => t.completed_at || t.updated_at || t.end_date || t.created_at || null;
  const taskDue  = t => t.end_date || null;
  const inRange = t => {
    const d = taskDate(t);
    if(!d) return false;                      // no date -> can't belong to any period
    const ds = String(d).slice(0,10);
    if(!/^\d{4}-\d{2}-\d{2}$/.test(ds)) return false;
    return ds >= R.start && ds <= R.end;
  };

  const EXCLUDE_ROLES = ['ceo','hr'];
  const rows = (emps||[]).filter(e => !EXCLUDE_ROLES.includes(String(e.role||'').toLowerCase())).map(e => {
    const mine = (tasks||[]).filter(t => (t.assigned_to_email||'').toLowerCase() === (e.email||'').toLowerCase());
    const finished = mine.filter(t => done.includes(t.work_status) && inRange(t));
    const onTime = finished.filter(t => {
      const due = taskDue(t);
      if(!due) return true;
      const fin = new Date(taskDate(t) || due);
      return fin <= new Date(new Date(due).setHours(23,59,59));
    }).length;
    const overdue = mine.filter(t => taskDue(t) && !done.includes(t.work_status) && today > new Date(taskDue(t))).length;
    const onTimePct = finished.length ? Math.round(onTime/finished.length*100) : 0;

    let turn = 0, tc = 0;
    finished.forEach(t => {
      const st = t.start_date || t.created_at, fin = t.completed_at || t.updated_at;
      if(st && fin){ const d = (new Date(fin)-new Date(st))/86400000; if(d>=0 && d<180){ turn += d; tc++; } }
    });
    const avgTurn = tc ? (turn/tc).toFixed(1) : null;

    const myAtt = (att||[]).filter(a => (a.employee_email||'').toLowerCase() === (e.email||'').toLowerCase());
    const present = myAtt.filter(a => a.status==='Present').length;
    const halfd = myAtt.filter(a => a.status==='Half Day').length;
    const attPct = workingDays ? Math.min(100, Math.round((present + halfd*0.5)/workingDays*100)) : 0;

    // ── work output from ALL sources the CRM tracks ──
    const nm = String(e.name||'').toLowerCase().trim();
    const visits = siteVisits.filter(v => String(v.visited_by||'').toLowerCase().includes(nm)).length;
    const auditsDone = audits.filter(a => String(a.inspector_name||'').toLowerCase().includes(nm)).length;
    const output = finished.length + visits + auditsDone;          // total delivered work
    const outputPct = Math.min(100, output * 12);                  // ~8 items = full marks

    const hasWork = output > 0 || overdue > 0 || mine.length > 0;
    // Score: delivery quality 35 · work output 35 · reliability 20 · attendance 10
    const score = hasWork
      ? Math.round(onTimePct*0.35 + outputPct*0.35 + Math.max(0,100-overdue*25)*0.20 + attPct*0.10)
      : 0;
    return {...e, finished:finished.length, visits, auditsDone, output, onTimePct, overdue, attPct, avgTurn, score, hasWork, presentDays:present, halfDays:halfd, workingDays};
  });

  rows.sort((a,b) => b.score - a.score);

  // ── Badges: spread recognition so everyone can earn something ──
  const worked = rows.filter(r => r.hasWork);
  const maxOf = (key) => worked.reduce((m,r) => Math.max(m, r[key]||0), 0);
  const bMaxVisits = maxOf('visits'), bMaxAudits = maxOf('auditsDone'), bMaxTasks = maxOf('finished');
  const fastest = worked.filter(r => r.avgTurn !== null)
                        .sort((a,b) => parseFloat(a.avgTurn) - parseFloat(b.avgTurn))[0];
  rows.forEach(r => {
    const b = [];
    if (r.visits    > 0 && r.visits    === bMaxVisits) b.push({icon:'🚗', text:'Most Site Visits'});
    if (r.auditsDone> 0 && r.auditsDone=== bMaxAudits) b.push({icon:'📋', text:'Most Audits'});
    if (r.finished  > 0 && r.finished  === bMaxTasks)  b.push({icon:'✅', text:'Most Tasks Done'});
    if (fastest && r.email === fastest.email)          b.push({icon:'⚡', text:'Fastest Turnaround'});
    if (r.output > 0 && r.overdue === 0)               b.push({icon:'🎯', text:'Zero Overdue'});
    if (r.finished >= 2 && r.onTimePct === 100)        b.push({icon:'⏱️', text:'100% On-Time'});
    if (r.attPct === 100)                              b.push({icon:'📅', text:'Perfect Attendance'});
    r.badges = b;
  });

  return {rows, label:R.label, workingDays};
}

function perfSetPeriod(p){ PERF_PERIOD = p; PERF_OFFSET = 0; loadPerformancePanel(); }
function perfSetOffset(v){ PERF_OFFSET = parseInt(v,10)||0; loadPerformancePanel(); }

async function loadPerformancePanel(){
  const el = document.getElementById('perfPanel');
  if(!el) return;
  el.innerHTML = '<div style="text-align:center;color:var(--muted);font-size:13px;padding:22px">⏳ Loading…</div>';

  const {rows, label} = await perfComputeStats(PERF_PERIOD);
  const me = (currentUser && currentUser.email || '').toLowerCase();
  const role = String((currentUser && currentUser.role) || '').toLowerCase();
  const canSeeTeam = role === 'ceo';
  const mine = rows.find(r => (r.email||'').toLowerCase() === me);
  const myRank = mine ? rows.indexOf(mine)+1 : null;
  const top = rows.find(r => r.output > 0 && r.score > 0) || null;   // must have delivered real work
  const isTop = top && mine && top.email === mine.email;
  
  const tab = (k,t) => `<button onclick="perfSetPeriod('${k}')" style="padding:6px 14px;border-radius:7px;font:inherit;font-size:12.5px;cursor:pointer;border:1px solid ${PERF_PERIOD===k?'#8a6d2f':'#e2e5ec'};background:${PERF_PERIOD===k?'#fdf6e6':'#fff'};color:${PERF_PERIOD===k?'#8a6d2f':'#6b7280'};font-weight:${PERF_PERIOD===k?'600':'400'}">${t}</button>`;

  const stat = (lbl,val,sub,col) => `<div style="background:#f8f9fc;border-radius:9px;padding:11px 13px">
      <div style="font-size:11.5px;color:#6b7280;margin-bottom:3px">${lbl}</div>
      <div style="font-size:22px;font-weight:700;color:${col||'#1b2437'}">${val}</div>
      ${sub?`<div style="font-size:11px;color:#6b7280;margin-top:2px">${sub}</div>`:''}
    </div>`;

  el.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:13px;flex-wrap:wrap;gap:8px">
      <div style="font-weight:700;font-size:14px;color:var(--navy)">📊 Performance — ${esc(label)}</div>
      <div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap">
        ${tab('month','Month')}${tab('quarter','Quarter')}${tab('year','Year')}
        <select onchange="perfSetOffset(this.value)" style="padding:6px 9px;border:1px solid #e2e5ec;border-radius:7px;font:inherit;font-size:12.5px;background:#fff;color:#1b2437">
          ${perfPeriodOptions(PERF_PERIOD).map(o=>`<option value="${o.off}" ${o.off===PERF_OFFSET?'selected':''}>${esc(o.label)}</option>`).join('')}
        </select>
      </div>
    </div>

    ${top ? `<div style="background:#fdf6e6;border:1px solid #e8dcc0;border-radius:10px;padding:13px;margin-bottom:14px">
      <div style="display:flex;align-items:center;gap:12px">
        <div style="width:42px;height:42px;border-radius:50%;background:#8a6d2f;color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:14px;flex-shrink:0">${esc(perfInitials(top.name))}</div>
        <div style="flex:1;min-width:0">
          <div style="font-size:11px;color:#8a6d2f;font-weight:600;letter-spacing:.5px">⭐ TOP PERFORMER OF THE TEAM</div>
          <div style="font-weight:700;font-size:15px;color:#5c4a1f">${esc(top.name)}${isTop?' <span style="font-size:10.5px;background:#8a6d2f;color:#fff;padding:2px 7px;border-radius:10px">That\'s you</span>':''}</div>
          <div style="font-size:11.5px;color:#8a6d2f;margin-top:1px">${top.onTimePct}% on-time · ${top.finished} tasks · ${top.visits} visits · ${top.auditsDone} audits · ${top.attPct}% present</div>
        </div>
        <div style="font-size:24px;font-weight:700;color:#8a6d2f">${top.score}</div>
      </div>
    </div>` : ''}

    ${mine ? `<div style="font-size:11px;color:#6b7280;font-weight:600;letter-spacing:.5px;margin:16px 0 8px">YOUR NUMBERS — ${esc(currentUser && currentUser.name || 'You')}</div>
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:10px;margin-bottom:14px">
      ${stat('On-time delivery', mine.onTimePct+'%', mine.finished+' completed', mine.onTimePct>=80?'#1E8449':mine.onTimePct>=60?'#B7791F':'#C0392B')}
      ${stat('Avg turnaround', mine.avgTurn? mine.avgTurn+'d' : '—', 'per task')}
      ${stat('Attendance', mine.attPct+'%', (mine.presentDays + (mine.halfDays?mine.halfDays*0.5:0)) + ' of ' + mine.workingDays + ' working days this period')}
      ${canSeeTeam ? stat('Your rank', '#'+myRank, 'of '+rows.length, myRank===1?'#8a6d2f':null) : stat('Work delivered', mine.output, mine.finished+' tasks · '+mine.visits+' visits · '+mine.auditsDone+' audits')}
    </div>
    ${(mine.badges&&mine.badges.length)?`<div style="display:flex;gap:5px;flex-wrap:wrap;margin-bottom:12px">${mine.badges.map(b=>`<span style="font-size:11px;background:#fdf6e6;color:#8a6d2f;border:1px solid #e8dcc0;border-radius:20px;padding:3px 10px;font-weight:600">${b.icon} ${b.text}</span>`).join('')}</div>`:''}
    ${mine.overdue ? `<div style="background:#fdeceb;border-radius:8px;padding:10px 12px;font-size:12.5px;color:#8c2f26;font-weight:600;margin-bottom:14px">⚠️ ${mine.overdue} task${mine.overdue>1?'s':''} overdue — clearing ${mine.overdue>1?'them':'it'} lifts your score.</div>` : ''}` : ''}

    ${canSeeTeam ? `<div style="font-size:11px;color:#6b7280;font-weight:600;letter-spacing:.5px;margin-bottom:7px">TEAM</div>` : ''}
    ${!canSeeTeam ? '' : rows.map((s,i) => {
      const isMe = (s.email||'').toLowerCase() === me;
      return `<div style="display:flex;align-items:center;gap:11px;padding:8px 10px;border-radius:8px;background:${isMe?'#f0f6ff':'transparent'};border-bottom:1px solid #f5f6fa">
        <div style="width:24px;font-size:12px;font-weight:700;color:${i===0?'#8a6d2f':'#9aa0aa'}">${i===0?'🥇':'#'+(i+1)}</div>
        <div style="flex:1;min-width:0">
          <div style="font-size:13px;font-weight:600;color:#1b2437">${esc(s.name)}${isMe?' <span style="font-size:10px;color:#185FA5">(you)</span>':''}</div>
          <div style="font-size:11px;color:#6b7280;margin-top:1px">${s.onTimePct}% on-time · ${s.finished} tasks · ${s.visits} visits · ${s.auditsDone} audits · ${s.attPct}% present${s.overdue?` · <span style="color:#c0392b">${s.overdue} overdue</span>`:''}</div>
          ${(s.badges&&s.badges.length)?`<div style="display:flex;gap:4px;flex-wrap:wrap;margin-top:4px">${s.badges.map(b=>`<span style="font-size:10px;background:#eef4ff;color:#2c5aa0;border:1px solid #d4e2f7;border-radius:20px;padding:2px 7px">${b.icon} ${b.text}</span>`).join('')}</div>`:''}
        </div>
        <div style="font-size:15px;font-weight:700;color:${i===0?'#8a6d2f':'#6b7280'}">${s.score}</div>
      </div>`;
    }).join('')}

    <div style="font-size:10.5px;color:#9aa0aa;margin-top:11px;line-height:1.6">Score = on-time delivery 35% · work output 35% (tasks + site visits + audits) · no overdue 20% · attendance 10%</div>`;
}
