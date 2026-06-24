//  CONFIG
// ═══════════════════════════════════════════
const SUPABASE_URL = 'https://rgoujuvdqqddqeqnryfg.supabase.co';
const SUPABASE_KEY = 'sb_publishable_Qi90wjrEak0zpymXEecNbQ_C30agpsx';
const sb = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const EJS_PUBLIC_KEY  = 'UJnNfp5bX02L9vf6e';
const EJS_SERVICE_ID  = 'service_tntf75k';
const EJS_TEMPLATE_ID = 'template_7164mdh';
const CEO_EMAIL       = 'yash@sayashvastu.com';
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzVaC0hQXJLb-HN02Tb6nhTNTReFfs6cF4YwJQN8uNBVoao-mh15W_FLMg8anDOp8I_/exec';
emailjs.init(EJS_PUBLIC_KEY);

const STORAGE_BUCKET = 'Task-Files';

// ═══════════════════════════════════════════
//  DAILY QUOTES
// ═══════════════════════════════════════════
const DAILY_QUOTES = [
  { text: "You don't have to be great to start, but you have to start to be great.", author: "Zig Ziglar" },
  { text: "Excellence is not a skill, it's an attitude.", author: "Ralph Marston" },
  { text: "If you want to shine like a sun, first burn like one.", author: "APJ Abdul Kalam" },
  { text: "The future belongs to those who prepare for it today.", author: "APJ Abdul Kalam" },
  { text: "Stay hungry, stay foolish.", author: "Steve Jobs" },
  { text: "Your work is going to fill a large part of your life — the only way to be truly satisfied is to do great work.", author: "Steve Jobs" },
  { text: "None of us is as good as all of us.", author: "Ray Kroc" },
  { text: "Take up one idea. Make that one idea your life — dream of it, think of it, live on that idea.", author: "Swami Vivekananda" },
  { text: "I never dreamt of success. I worked for it.", author: "Estée Lauder" },
  { text: "We cannot all do great things, but we can do small things with great love.", author: "Mother Teresa" },
  { text: "An investment in knowledge pays the best interest.", author: "Benjamin Franklin" },
  { text: "It is during our darkest moments that we must focus to see the light.", author: "Aristotle" },
  { text: "Quality means doing it right when no one is looking.", author: "Henry Ford" },
  { text: "If you really look closely, most overnight successes took a long time.", author: "Steve Jobs" },
  { text: "Don't watch the clock; do what it does. Keep going.", author: "Sam Levenson" },
  { text: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
  { text: "Believe you can and you're halfway there.", author: "Theodore Roosevelt" },
  { text: "Action is the foundational key to all success.", author: "Pablo Picasso" },
  { text: "Dream big and dare to fail.", author: "Norman Vaughan" },
  { text: "Opportunities don't happen, you create them.", author: "Chris Grosser" },
  { text: "The harder you work for something, the greater you'll feel when you achieve it.", author: "Unknown" },
  { text: "Don't be afraid to give up the good to go for the great.", author: "John D. Rockefeller" },
  { text: "Success usually comes to those who are too busy to be looking for it.", author: "Henry David Thoreau" },
  { text: "All progress takes place outside the comfort zone.", author: "Michael John Bobak" },
  { text: "Try not to become a person of success, but rather try to become a person of value.", author: "Albert Einstein" },
  { text: "Great things never come from comfort zones.", author: "Unknown" },
  { text: "Push yourself, because no one else is going to do it for you.", author: "Unknown" },
  { text: "Sometimes later becomes never. Do it now.", author: "Unknown" },
  { text: "If opportunity doesn't knock, build a door.", author: "Milton Berle" },
  { text: "Dreams don't work unless you do.", author: "John C. Maxwell" },
  { text: "Successful people are not gifted; they just work hard, then succeed on purpose.", author: "G.K. Nielson" },
  { text: "There is no substitute for hard work.", author: "Thomas Edison" },
  { text: "Excellence is doing ordinary things extraordinarily well.", author: "John W. Gardner" },
  { text: "Wake up with determination, go to bed with satisfaction.", author: "Unknown" },
  { text: "If you are not willing to risk the usual, you will have to settle for the ordinary.", author: "Jim Rohn" },
  { text: "Don't limit your challenges, challenge your limits.", author: "Unknown" },
  { text: "Strive not to be a success, but rather to be of value.", author: "Albert Einstein" },
  { text: "I find that the harder I work, the more luck I seem to have.", author: "Thomas Jefferson" },
  { text: "The way to get started is to quit talking and begin doing.", author: "Walt Disney" },
  { text: "Either you run the day, or the day runs you.", author: "Jim Rohn" },
];

function getTodaysQuote() {
  const today = new Date();
  const dayOfYear = Math.floor((today - new Date(today.getFullYear(), 0, 0)) / 86400000);
  return DAILY_QUOTES[dayOfYear % DAILY_QUOTES.length];
}

// ═══════════════════════════════════════════
//  STATE
// ═══════════════════════════════════════════
let currentUser = null;
let myTasks = [];
let allTasksData = [];
let allTasksFilter = 'all';
let myTasksFilter = 'all';
let currentTaskRow = null;
let notifications = [];

// ═══════════════════════════════════════════
//  INIT
// ═══════════════════════════════════════════
window.onload = function() {
  updateClock();
  setInterval(updateClock, 1000);
  updateDateHeader();

  const saved = localStorage.getItem('sv_user');
  if (saved) { currentUser = JSON.parse(saved); showApp(); }

  document.getElementById('loginPass').addEventListener('keydown', e => { if (e.key === 'Enter') doLogin(); });

  // Refresh notifications every 10 seconds
setInterval(async function() {
  if (currentUser) loadNotifications();
  }, 10000);

  // Auto logout at 9 PM
  setInterval(async function() {
    if (!currentUser || currentUser.role === 'ceo' || currentUser.role === 'manager') return;
    const now = new Date();
    if (now.getHours() >= 21) {
      const today = now.toISOString().split('T')[0];
      const { data: openAtt } = await sb.from('attendance')
        .select('*').eq('employee_email', currentUser.email)
        .eq('date', today).eq('is_archived', false).maybeSingle();
      if (openAtt && openAtt.check_in && !openAtt.check_out) {
        // Auto checkout at 9 PM (21:00)
        const checkoutTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 21, 0, 0);
        const hrs = ((checkoutTime - new Date(openAtt.check_in))/3600000).toFixed(2);
        const status = parseFloat(hrs) >= 5 ? 'Present' : 'Half Day';
        await sb.from('attendance').update({
          check_out: checkoutTime.toISOString(),
          working_hours: hrs, status
        }).eq('id', openAtt.id);
        console.log('Auto logout at 9 PM — worked', hrs, 'hrs');
        // Refresh dashboard if on home
        if (document.getElementById('view-home').classList.contains('active')) {
          loadEmpDashboard();
        }
        if (document.getElementById('view-attendance').classList.contains('active')) {
          loadAttendance();
        }
      }
    }
    
}, 60000); // Check every minute

  // Payment follow-up reminder check (once per day, for CEO/Alisha/Ritika)
setInterval(async function() {
  if (!currentUser) return;
  const isPayFollowUser = currentUser.role === 'ceo' || ['alisha@sayashvastu.com', 'ritika@sayashvastu.com'].includes(currentUser.email);
  if (!isPayFollowUser) return;
  const todayStr2 = new Date().toISOString().split('T')[0];
  const remKey = 'sv_payfollow_reminded_' + todayStr2;
  if (localStorage.getItem(remKey)) return;

  const { data: dueFollowups } = await sbClient.from('followups').select('*, clients(name)').eq('done', false).eq('type', 'Payment Follow-up').eq('next_followup', todayStr2);
  if (dueFollowups && dueFollowups.length) {
    for (const f of dueFollowups) {
      await createNotification(
        currentUser.email,
        `💰 Payment Follow-up Due Today — ${f.clients?.name || 'Client'}`,
        `Follow-up scheduled for today. ${f.notes ? 'Notes: ' + f.notes : ''}`,
        'General', 'pendingPayments'
      );
    }
    localStorage.setItem(remKey, 'true');
  }
}, 60000);

  // Auto summary emails + birthday check
setInterval(async function() {
  if (!currentUser) return;
    const now = new Date();
    const hr = now.getHours(); const min = now.getMinutes();
    const today = now.toDateString();    
    // Morning birthday wish at 9am
    if (hr === 9 && min < 5 && localStorage.getItem('sv_bday_sent_' + today) === null) {
      loadBirthdaySection();
    }

    // Monthly compliance reminder - 1st of month at 9am
if (hr === 9 && min < 5 && new Date().getDate() === 1) {
  const reminderKey = 'sv_compliance_reminder_' + new Date().toISOString().slice(0,7);
  if (!localStorage.getItem(reminderKey)) {
    localStorage.setItem(reminderKey, 'true');
    await createNotification(
      'alisha@sayashvastu.com',
      '📋 Monthly Compliance Tasks Due!',
      'New month started — please check and complete your compliance tasks for this month.',
      'General', 'compliance'
    );
  }
}
    if (hr === 8 && min < 5 && localStorage.getItem('sv_last_morning') !== today) {
      localStorage.setItem('sv_last_morning', today);
      sendDailySummaryEmail('Morning');
    }
    if (hr === 18 && min < 5 && localStorage.getItem('sv_last_evening') !== today) {
      localStorage.setItem('sv_last_evening', today);
      sendDailySummaryEmail('Evening');
    }
  }, 60000);

  // Close notif panel on outside click
  document.addEventListener('click', function(e) {
    const panel = document.getElementById('notifPanel');
    const btn = document.querySelector('.notif-btn');
    if (panel && panel.classList.contains('open') && !panel.contains(e.target) && !btn.contains(e.target)) {
      panel.classList.remove('open');
    }
  });
};

function updateClock() {
  const t = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const el = document.getElementById('attClock');
  if (el) el.textContent = t;
  updateEmpClock();
}

function updateEmpClock() {
  const el = document.getElementById('empClock');
  if (el) el.textContent = new Date().toLocaleTimeString('en-IN', {hour:'2-digit', minute:'2-digit'});
}

function updateDateHeader() {
  const now = new Date();
  const days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const dateStr = days[now.getDay()] + ', ' + now.getDate() + ' ' + months[now.getMonth()] + ' ' + now.getFullYear();
  const el = document.getElementById('topbarDate');
  if (el) el.textContent = dateStr;
  const attDate = document.getElementById('attDate');
  if (attDate) attDate.textContent = dateStr;
}

// ═══════════════════════════════════════════
//  EMAIL
// ═══════════════════════════════════════════
async function sendEmail(toEmail, toName, subject, message, type = 'General', actionUrl = '', actionLabel = '') {
  try {
    await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to_email: toEmail, to_name: toName,
        subject, message, type, action_url: actionUrl, action_label: actionLabel
      })
    });
  } catch(err) { console.error('Email error:', err); }
}

async function sendDailySummaryEmail(period) {
  try {
    const { data: tasks } = await sb.from('tasks').select('*').eq('is_archived',false).order('created_at', { ascending: false });
    const { data: leaves } = await sb.from('leaves').select('*').eq('status', 'Pending');
    const today = new Date(); today.setHours(0,0,0,0);
    const total = (tasks||[]).length;
    const inProg = (tasks||[]).filter(t => t.work_status === 'In Progress').length;
    const completed = (tasks||[]).filter(t => t.work_status === 'Completed').length;
    const notStart = (tasks||[]).filter(t => t.work_status === 'Not Started').length;
    const delayed = (tasks||[]).filter(t => {
      const ed = t.end_date ? new Date(t.end_date) : null;
      return ed && today > ed && t.work_status !== 'Completed';
    }).length;
    const pendingLeaves = (leaves||[]).length;
    let taskLines = (tasks||[]).slice(0,15).map(t => {
      const ed3 = t.end_date ? new Date(t.end_date) : null;
      const isLate = ed3 && today > ed3 && t.work_status !== 'Completed';
      return `• ${t.project} | ${t.assigned_to_name} | ${t.work_status}${isLate ? ' ⚠️ DELAYED' : ''}`;
    }).join('\n');
    let leaveLines = pendingLeaves > 0
      ? (leaves||[]).map(l => `• ${l.employee_name} | ${l.leave_type} | ${l.from_date} to ${l.to_date}`).join('\n')
      : 'No pending leaves';
    const message = `📊 ${period} SUMMARY — ${new Date().toLocaleDateString('en-IN')}\n${'━'.repeat(30)}\n\n📋 TASK OVERVIEW:\nTotal: ${total} | ✅ Done: ${completed} | ⚡ In Progress: ${inProg} | ○ Not Started: ${notStart} | ⚠️ Delayed: ${delayed}\n\n📋 TASK DETAILS:\n${taskLines}\n\n🏖️ PENDING LEAVES (${pendingLeaves}):\n${leaveLines}\n\n${'━'.repeat(30)}\nView: sayash-vastu-portal.vercel.app`.trim();
    await sendEmail(CEO_EMAIL, 'CEO Admin', `${period} Report — Sayash Vastu`, message, 'Daily Summary', 'https://sayash-vastu-portal.vercel.app', 'View Dashboard →');
    showToast(`✅ ${period} summary sent!`, 'ok');
  } catch (err) { showToast('❌ Email failed!', 'err'); }
}

// ═══════════════════════════════════════════
//  NOTIFICATIONS
// ═══════════════════════════════════════════
// ── Notification Realtime Channel ──
let notifChannel = null;

function renderNotifList(notifs) {
  const typeIcons = {
    'task':'📋','leave':'🏖️','ticket':'🎫','policy':'📜',
    'notice':'📢','birthday':'🎂','forwarded':'📌',
    'General':'🔔','default':'🔔'
  };
  const listEl = document.getElementById('notifList');
  if (!notifs.length) {
    listEl.innerHTML = '<div style="padding:24px;text-align:center;color:var(--muted);font-size:13px">🎉 All caught up!</div>';
  } else {
    listEl.innerHTML = notifs.map(n => `
      <div class="notif-item" onclick="handleNotifClick('${n.id}','${n.link_to||''}')" style="cursor:pointer">
        <div style="display:flex;gap:10px;align-items:flex-start">
          <div style="font-size:20px;flex-shrink:0">${typeIcons[n.type]||'🔔'}</div>
          <div style="flex:1">
            <div class="notif-item-title">${esc(n.title)}</div>
            <div class="notif-item-sub">${esc((n.message||'').substring(0,80))}${(n.message||'').length>80?'...':''}</div>
            <div class="notif-item-time">${new Date(n.created_at).toLocaleString('en-IN',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'})}</div>
          </div>
          <div class="notif-dot-badge" style="margin-top:6px;flex-shrink:0"></div>
        </div>
      </div>
    `).join('');
  }
}

function updateNotifBadge(count) {
  const countEl = document.getElementById('notifCount');
  if (!countEl) return;
  if (count > 0) {
    countEl.textContent = count > 9 ? '9+' : count;
    countEl.classList.add('show');
  } else {
    countEl.classList.remove('show');
  }
}

async function loadNotifications() {
  if (!currentUser) return;
  try {
    const { data: dbNotifs, error } = await sb.from('notifications')
      .select('*')
      .eq('to_email', currentUser.email)
      .eq('is_read', false)
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) { console.error('Notif load error:', error.message); return; }
    notifications = dbNotifs || [];
    updateNotifBadge(notifications.length);
    renderNotifList(notifications);
  } catch(e) { console.error('Notif error:', e); }
}

function setupNotifRealtime() {
  if (!currentUser) return;
  // Remove existing channel
  if (notifChannel) { try { sb.removeChannel(notifChannel); } catch(e){} notifChannel = null; }

  try {
    const chName = 'notif-' + currentUser.email.replace(/[^a-z0-9]/gi,'-');
    notifChannel = sb.channel(chName)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications'
      }, (payload) => {
        // Only process if for current user
        if (!payload.new || payload.new.to_email !== currentUser.email) return;
        console.log('🔔 Realtime notification:', payload.new.title);
        // Avoid duplicates
        if (notifications.find(n => n.id === payload.new.id)) return;
        notifications.unshift(payload.new);
        updateNotifBadge(notifications.length);
        renderNotifList(notifications);
        // Flash bell
        const bell = document.querySelector('.notif-btn');
        if (bell) {
          bell.classList.add('has-notif');
          setTimeout(() => bell.classList.remove('has-notif'), 3000);
        }
        showToast('🔔 ' + payload.new.title, '');
      })
      .subscribe((status) => {
        console.log('🔔 Notif channel [' + currentUser.email + ']:', status);
        if (status === 'SUBSCRIBED') {
          console.log('✅ Realtime active for', currentUser.email);
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          console.warn('⚠️ Realtime error for', currentUser.email, '— polling every 10s');
        }
      });
  } catch(e) {
    console.log('Realtime setup error:', e);
  }
}

async function handleNotifClick(notifId, linkTo) {
  await sb.from('notifications').update({is_read: true}).eq('id', notifId);
  // Remove from local list
  notifications = notifications.filter(n => n.id !== notifId);
  updateNotifBadge(notifications.length);
  renderNotifList(notifications);
  document.getElementById('notifPanel').classList.remove('open');
  if (linkTo) showView(linkTo);
}

function toggleNotifPanel() {
  const panel = document.getElementById('notifPanel');
  panel.classList.toggle('open');
  if (panel.classList.contains('open')) {
    loadNotifications();
    // Reset bell flash
    const bell = document.querySelector('.notif-btn');
    if (bell) { bell.style.background = ''; bell.style.borderColor = ''; }
  }
}

async function markAllRead() {
  await sb.from('notifications').update({is_read: true}).eq('to_email', currentUser.email).eq('is_read', false);
  notifications = [];
  updateNotifBadge(0);
  document.getElementById('notifList').innerHTML = '<div style="padding:24px;text-align:center;color:var(--muted);font-size:13px">🎉 All caught up!</div>';
  document.getElementById('notifPanel').classList.remove('open');
}

// Helper to create notification
async function createNotification(toEmail, title, message, type, linkTo) {
  try {
    const { error } = await sb.from('notifications').insert({
      to_email: toEmail,
      title: title,
      message: message,
      type: type || 'General',
      link_to: linkTo || null,
      is_read: false
    });
    if (error) {
      console.error('❌ Notification insert error:', error.message, '| to:', toEmail);
    } else {
      console.log('✅ Notification created for:', toEmail, '|', title);
    }
  } catch(e) { console.error('Notif error:', e); }
}

// ═══════════════════════════════════════════
//  FILE STORAGE
// ═══════════════════════════════════════════
async function uploadTaskFile(taskId, file) {
  if (!file) return null;
  const ext = file.name.split('.').pop();
  const path = `${taskId}/${Date.now()}_${file.name.replace(/[^a-z0-9.]/gi,'_')}`;
  const { data, error } = await sb.storage.from(STORAGE_BUCKET).upload(path, file, { upsert: false });
  if (error) { showToast('❌ File upload failed: ' + error.message, 'err'); return null; }
  const { data: urlData } = sb.storage.from(STORAGE_BUCKET).getPublicUrl(path);
  return { name: file.name, url: urlData.publicUrl, path };
}

async function getTaskFiles(taskId) {
  const { data } = await sb.storage.from(STORAGE_BUCKET).list(taskId + '/');
  if (!data || !data.length) return [];
  return data.map(f => {
    const { data: urlData } = sb.storage.from(STORAGE_BUCKET).getPublicUrl(`${taskId}/${f.name}`);
    return { name: f.name.replace(/^\d+_/, ''), url: urlData.publicUrl };
  });
}

function renderFileChips(files) {
  if (!files || !files.length) return '<span style="color:var(--muted);font-size:11px">—</span>';
  return files.map(f => `<div class="file-chip">📎 <a href="${f.url}" target="_blank">${esc(f.name.length > 16 ? f.name.substring(0,16)+'…' : f.name)}</a></div>`).join('');
}

// ═══════════════════════════════════════════
//  PDF EXPORT
// ═══════════════════════════════════════════
async function exportTasksPDF() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const W = 210;
  const ORANGE = [232,101,26]; const NAVY = [26,58,92]; const DARK = [34,34,34];
  const MUTED = [85,85,85]; const BORDER = [200,213,229]; const LIGHT = [245,248,252];
  const GREEN = [26,110,60]; const RED = [163,45,45]; const AMBER = [133,79,11];
  const BLUE = [24,95,165];

  const setFill = (rgb) => doc.setFillColor(rgb[0],rgb[1],rgb[2]);
  const setStroke = (rgb) => doc.setDrawColor(rgb[0],rgb[1],rgb[2]);
  const setFont = (c) => doc.setTextColor(c[0],c[1],c[2]);

  // HEADER
  setFill([255,255,255]); doc.rect(0,0,W,28,'F');
  try {
    const logoUrl = 'https://rgoujuvdqqddqeqnryfg.supabase.co/storage/v1/object/public/Task-Files/Sayash%20logo.png';
    const logoRes = await fetch(logoUrl);
    if (logoRes.ok) {
      const logoBlob = await logoRes.blob();
      const logoBase64 = await new Promise(res => {
        const r = new FileReader(); r.onload = () => res(r.result); r.readAsDataURL(logoBlob);
      });
      doc.addImage(logoBase64, 'PNG', 10, 3, 32, 22);
    }
  } catch(e) {}

  doc.setFontSize(13); doc.setFont('helvetica','bold'); setFont(ORANGE);
  doc.text('SAYASH VASTU', W/2, 11, { align: 'center' });
  doc.setFontSize(8); doc.setFont('helvetica','normal'); setFont(DARK);
  doc.text('Vastu Shastra Consultancy Services', W/2, 16, { align: 'center' });
  doc.text('Netaji Subhash Place, New Delhi', W/2, 20.5, { align: 'center' });
  setStroke(ORANGE); doc.setLineWidth(0.5);
  doc.line(0, 28, W, 28);

  // TITLE
  let y = 35;
  doc.setFontSize(17); doc.setFont('helvetica','bold'); setFont(NAVY);
  doc.text('TASK REPORT', W/2, y, { align: 'center' });
  y += 3.5;
  setStroke(ORANGE); doc.setLineWidth(0.4);
  doc.line(10, y, W-10, y);
  y += 5;

  // INFO BOX
  doc.setFontSize(8); doc.setFont('helvetica','normal'); setFont(MUTED);
  doc.text('Generated: ' + new Date().toLocaleDateString('en-IN'), 14, y);
  doc.text('Total Tasks: ' + allTasksData.length, W-14, y, { align: 'right' });
  y += 8;

  // SUMMARY CARDS
  const today = new Date(); today.setHours(0,0,0,0);
  const total = allTasksData.length;
  const inProg = allTasksData.filter(t=>t.work_status==='In Progress').length;
  const done = allTasksData.filter(t=>t.work_status==='Completed'||t.work_status==='Report Ready').length;
  const notStart = allTasksData.filter(t=>t.work_status==='Not Started').length;
  const delayed = allTasksData.filter(t=>{
    const ed = t.end_date ? new Date(t.end_date) : null;
    return ed && today > ed && t.work_status !== 'Completed';
  }).length;

  const cw = (W-20)/5;
  setFill(NAVY); doc.rect(10, y, W-20, 6, 'F');
  doc.setFontSize(6.5); doc.setFont('helvetica','bold'); setFont([255,255,255]);
  ['TOTAL','IN PROGRESS','COMPLETED','NOT STARTED','DELAYED'].forEach((col,i) => {
    doc.text(col, 10+i*cw+cw/2, y+4, { align: 'center' });
  });
  y += 6;
  setFill([235,242,251]); setStroke(BORDER); doc.setLineWidth(0.3);
  doc.rect(10, y, W-20, 10, 'FD');
  for(let i=1;i<5;i++) doc.line(10+i*cw, y, 10+i*cw, y+10);
  doc.setFontSize(14); doc.setFont('helvetica','bold');
  [String(total),String(inProg),String(done),String(notStart),String(delayed)].forEach((v,i) => {
    const clr = i===4?RED:i===2?GREEN:i===1?BLUE:NAVY;
    setFont(clr);
    doc.text(v, 10+i*cw+cw/2, y+7, { align: 'center' });
  });
  y += 16;

  // TABLE HEADER
  doc.setFontSize(9); doc.setFont('helvetica','bold'); setFont(NAVY);
  doc.text('TASK DETAILS', W/2, y, { align: 'center' });
  y += 4;

  const colW = [8, 35, 55, 30, 22, 30];
  const cols = ['#','Project','Task Detail','Assigned To','End Date','Status'];
  setFill(NAVY); doc.rect(10, y, W-20, 6, 'F');
  doc.setFontSize(6.5); doc.setFont('helvetica','bold'); setFont([255,255,255]);
  let cx = 10;
  cols.forEach((col,i) => { doc.text(col, cx+1, y+4); cx += colW[i]; });
  y += 6;

  const sColors = {
    'Not Started': MUTED,
    'In Progress': BLUE,
    'Completed': GREEN,
    'Report Ready': GREEN,
    'Sent for Review': AMBER
  };

  allTasksData.forEach((t, idx) => {
    if (y > 270) { doc.addPage(); y = 20; }
    const endD = t.end_date ? new Date(t.end_date) : null;
    const isLate = endD && today > endD && t.work_status !== 'Completed';
    const bg = isLate ? [253,240,238] : idx%2===0 ? [248,249,252] : [255,255,255];
    setFill(bg); setStroke([221,229,239]); doc.setLineWidth(0.15);
    doc.rect(10, y, W-20, 6, 'FD');

    cx = 10;
    const vals = [
      String(idx+1),
      (t.project||'').substring(0,18),
      (t.task_detail||'').substring(0,32),
      (t.assigned_to_name||'').substring(0,16),
      t.end_date ? new Date(t.end_date).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'}) : '—',
      t.work_status||'—'
    ];
    vals.forEach((val,i) => {
      if (i===5) {
        doc.setFontSize(6); doc.setFont('helvetica','bold');
        setFont(sColors[val]||MUTED);
      } else if (i===4 && isLate) {
        doc.setFontSize(6); doc.setFont('helvetica','bold'); setFont(RED);
      } else {
        doc.setFontSize(6); doc.setFont('helvetica','normal'); setFont(DARK);
      }
      doc.text(String(val), cx+1, y+4);
      cx += colW[i];
    });
    y += 6;
  });

  // FOOTER
  y += 6;
  setFill(LIGHT); setStroke(BORDER); doc.setLineWidth(0.3);
  doc.rect(10, y, W-20, 14, 'FD');
  doc.setFontSize(7); doc.setFont('helvetica','normal'); setFont(MUTED);
  doc.text('This report is auto-generated by Sayash Vastu Portal', W/2, y+5, { align: 'center' });
  doc.text('Confidential — For Internal Use Only', W/2, y+10, { align: 'center' });

  doc.save('SayashVastu_Tasks_' + new Date().toISOString().split('T')[0] + '.pdf');
  showToast('✅ PDF exported!', 'ok');
}

async function exportAttPDF() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const W = 210; const H = 297;

  const monthVal = document.getElementById('att-month-filter').value;
  if (!monthVal) { showToast('⚠️ Please select a month', 'err'); return; }
  const [yr, mo] = monthVal.split('-').map(Number);
  const monthName = new Date(yr, mo - 1, 1).toLocaleString('en', { month: 'long' });
  const lastDay = new Date(yr, mo, 0).getDate();
  const totalDays = lastDay;

  // Fetch all employees
const { data: emps } = await sb.from('employees').select('*').eq('is_active', true).neq('role', 'ceo').order('employee_code', { ascending: true });
  const start = `${yr}-${String(mo).padStart(2,'0')}-01`;
  const end   = `${yr}-${String(mo).padStart(2,'0')}-${String(lastDay).padStart(2,'0')}`;
const { data: attData } = await sb.from('attendance').select('*').eq('is_archived', false).gte('date', start).lte('date', end);
  const { data: leaveData } = await sb.from('leaves').select('*').eq('status', 'Approved').lte('from_date', end).gte('to_date', start);
  
  const ORANGE = [232,101,26]; const NAVY = [26,58,92]; const DARK = [34,34,34];
  const MUTED  = [85,85,85];  const BORDER= [200,213,229]; const LIGHT = [245,248,252];
  const GREEN  = [26,110,60]; const RED   = [163,45,45];  const AMBER = [133,79,11];
  const PURPLE = [83,58,183]; const BLUE  = [24,95,165];

  const setFill   = (rgb) => doc.setFillColor(rgb[0], rgb[1], rgb[2]);
  const setStroke = (rgb) => doc.setDrawColor(rgb[0], rgb[1], rgb[2]);
  const setFont   = (c)   => doc.setTextColor(c[0], c[1], c[2]);

  const days3   = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  const months3 = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  const generateEmpPage = async (emp, isFirst) => {
    if (!isFirst) doc.addPage();

    const empRows = (attData || []).filter(a => a.employee_email === emp.email);
    const empLeaves = (leaveData || []).filter(l => l.employee_email === emp.email);
    const attMap = {};
    empRows.forEach(a => { attMap[a.date] = a; });

    const dailyRows = [];
    for (let d = 1; d <= lastDay; d++) {
      const dateObj   = new Date(yr, mo - 1, d);
      const dateStr   = `${yr}-${String(mo).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
      const dayName   = days3[dateObj.getDay()];
      const dispDate  = `${String(d).padStart(2,'0')}-${months3[mo-1]}-${yr}`;
      const a         = attMap[dateStr];
const isWeekend = dateObj.getDay() === 0;
      const onLeave   = empLeaves.find(l => dateStr >= l.from_date && dateStr <= l.to_date);
      const todayCheck = new Date(); todayCheck.setHours(0,0,0,0);
      const isFuture  = dateObj > todayCheck;
      if (a) {
        const ci  = a.check_in  ? new Date(a.check_in).toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'}) : '—';
        const co  = a.check_out ? new Date(a.check_out).toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'}) : '—';
        const hrs = a.working_hours ? parseFloat(a.working_hours).toFixed(2) : '—';
        const isLate = a.check_in && (() => { const t = new Date(a.check_in); return t.getHours() > 10 || (t.getHours()===10 && t.getMinutes()>15); })();
        dailyRows.push([dispDate, dayName, a.status || 'Present', ci, co, hrs, isLate ? 'Yes' : 'No', a.work_type || '']);
      } else if (onLeave) {
        dailyRows.push([dispDate, dayName, 'Leave', '—', '—', '—', '—', onLeave.leave_type || '']);
      } else if (isWeekend) {
        dailyRows.push([dispDate, dayName, 'Week Off', '—', '—', '—', '—', 'Week Off']);
      } else if (isFuture) {
        dailyRows.push([dispDate, dayName, '—', '—', '—', '—', '—', '']);
      } else {
        dailyRows.push([dispDate, dayName, 'Absent', '—', '—', '—', '—', '']);
      }
}
    const present = dailyRows.filter(r => r[2] === 'Present').length;
    const absent  = dailyRows.filter(r => r[2] === 'Absent').length;
    const leave   = dailyRows.filter(r => r[2] === 'Leave').length;
    const weekOff = dailyRows.filter(r => r[2] === 'Week Off').length;
    const late    = dailyRows.filter(r => r[6] === 'Yes').length;
const futureDays = dailyRows.filter(r => r[2] === '—').length;
    const attPct = (totalDays - weekOff - futureDays) > 0 ? ((present / (totalDays - weekOff - futureDays)) * 100).toFixed(2) + '%' : '0%';
      
    // HEADER
    setFill([255,255,255]); doc.rect(0, 0, W, 28, 'F');
    try {
      const logoUrl = 'https://rgoujuvdqqddqeqnryfg.supabase.co/storage/v1/object/public/Task-Files/Sayash%20logo.png';
      const logoRes = await fetch(logoUrl);
      if (logoRes.ok) {
        const logoBlob = await logoRes.blob();
        const logoBase64 = await new Promise(res => {
          const r = new FileReader(); r.onload = () => res(r.result); r.readAsDataURL(logoBlob);
        });
        doc.addImage(logoBase64, 'PNG', 10, 3, 32, 22);
      }
    } catch(e) {}

    doc.setFontSize(13); doc.setFont('helvetica','bold'); setFont(ORANGE);
    doc.text('SAYASH VASTU', W/2, 11, { align: 'center' });
    doc.setFontSize(8); doc.setFont('helvetica','normal'); setFont(DARK);
    doc.text('Vastu Shastra Consultancy Services', W/2, 16, { align: 'center' });
    doc.text('Netaji Subhash Place, New Delhi', W/2, 20.5, { align: 'center' });
    setStroke(ORANGE); doc.setLineWidth(0.5);
    doc.line(0, 28, W, 28);

    // TITLE
    let y = 35;
    doc.setFontSize(17); doc.setFont('helvetica','bold'); setFont(NAVY);
    doc.text('ATTENDANCE REPORT', W/2, y, { align: 'center' });
    y += 3.5;
    setStroke(ORANGE); doc.setLineWidth(0.4);
    doc.line(10, y, W-10, y);

    // EMP INFO BOX
    y += 3;
    const boxH = 22;
    setFill(LIGHT); setStroke(BORDER); doc.setLineWidth(0.3);
    doc.roundedRect(10, y, W-20, boxH, 2, 2, 'FD');
    const fromDate = `01-${String(mo).padStart(2,'0')}-${yr}`;
    const toDate   = `${lastDay}-${String(mo).padStart(2,'0')}-${yr}`;
    const leftInfo  = [['Employee ID', emp.employee_code || '—'],['Employee Name', emp.name],['Designation', emp.designation || '—'],['Department', emp.department || '—']];
    const rightInfo = [['Report For', monthName + ' ' + yr],['From Date', fromDate],['To Date', toDate],['Total Working Days', String(totalDays)]];
    const rowH = 4.8; const sy = y + 4;
    leftInfo.forEach(([lbl, val], i) => {
      const iy = sy + i * rowH;
      doc.setFontSize(7.5); doc.setFont('helvetica','bold'); setFont(MUTED); doc.text(lbl + ':', 13, iy);
      doc.setFont('helvetica','normal'); setFont(DARK); doc.text(String(val), 46, iy);
    });
    rightInfo.forEach(([lbl, val], i) => {
      const iy = sy + i * rowH;
      doc.setFontSize(7.5); doc.setFont('helvetica','bold'); setFont(MUTED); doc.text(lbl + ':', W/2 + 3, iy);
      doc.setFont('helvetica','normal'); setFont(DARK); doc.text(String(val), W/2 + 38, iy);
    });
    y += boxH + 5;

    // SUMMARY
    doc.setFontSize(9); doc.setFont('helvetica','bold'); setFont(NAVY);
    doc.text('SUMMARY', W/2, y, { align: 'center' });
    y += 4;
const halfDay = dailyRows.filter(r => r[2] === 'Half Day').length;
    const sumCols = ['PRESENT','HALF DAY','ABSENT','LEAVE','LATE MARKS','ATTENDANCE %'];
const sumVals = [String(present), String(halfDay), String(absent), String(leave), String(late), attPct];
const sumClrs = [GREEN, AMBER, RED, PURPLE, RED, GREEN];
    const cw = (W - 20) / 6;
    const hdrH = 6; const valH = 10;
    setFill(NAVY); doc.rect(10, y, W-20, hdrH, 'F');
    doc.setFontSize(6.5); doc.setFont('helvetica','bold'); setFont([255,255,255]);
    sumCols.forEach((col, i) => doc.text(col, 10 + i*cw + cw/2, y + 4, { align: 'center' }));
    y += hdrH;
    setFill([235,242,251]); setStroke(BORDER); doc.setLineWidth(0.3);
    doc.rect(10, y, W-20, valH, 'FD');
    for (let i=1; i<6; i++) doc.line(10+i*cw, y, 10+i*cw, y+valH);
    doc.setFontSize(15); doc.setFont('helvetica','bold');
    sumVals.forEach((v, i) => { setFont(sumClrs[i]); doc.text(v, 10+i*cw+cw/2, y+7, { align: 'center' }); });
    y += valH + 6;

    // DAILY TABLE
    doc.setFontSize(9); doc.setFont('helvetica','bold'); setFont(NAVY);
    doc.text('DAILY ATTENDANCE DETAILS', W/2, y, { align: 'center' });
    y += 4;
    const halfW   = (W - 24) / 2;
    const gap     = 4;
    const tCols   = ['Date','Day','Status','Check In','Check Out','Hours','Late','Remarks'];
    const rawW    = [23, 9, 15, 20, 20, 14, 8, 21];
    const totalW  = rawW.reduce((s,x) => s+x, 0);
    const tWidths = rawW.map(x => (x / totalW) * halfW);
    const trh     = 5;
    const sColors = { 'Present':GREEN,'Absent':RED,'Leave':PURPLE,'Week Off':BLUE,'Half Day':AMBER };

    const drawHalfHeader = (cx, ty) => {
      setFill(NAVY); doc.rect(cx, ty, halfW, trh, 'F');
      doc.setFontSize(6); doc.setFont('helvetica','bold'); setFont([255,255,255]);
      let tx = cx;
      tCols.forEach((col) => { doc.text(col, tx + 0.8, ty + 3.5); tx += tWidths[tCols.indexOf(col)]; });
      return ty + trh;
    };

    const drawHalfRows = (cx, startY, rowsData) => {
      let cy = startY;
      rowsData.forEach((row, idx) => {
        const [date,day,status,ci,co,hrs,lateVal,rem] = row;
        const isWO = status === 'Week Off';
        const bg = isWO ? [238,234,248] : (idx%2===0 ? [248,249,252] : [255,255,255]);
        setFill(bg); setStroke([221,229,239]); doc.setLineWidth(0.15);
        doc.rect(cx, cy, halfW, trh, 'FD');
        const vals = [date,day,status,ci,co,hrs,lateVal,rem];
        let tx = cx;
        vals.forEach((val, ci2) => {
          if (ci2 === 2) { doc.setFontSize(6); doc.setFont('helvetica','bold'); setFont(sColors[val] || DARK); }
          else if (ci2 === 6 && val === 'Yes') { doc.setFontSize(6); doc.setFont('helvetica','bold'); setFont(RED); }
          else { doc.setFontSize(6); doc.setFont('helvetica','normal'); setFont(isWO ? MUTED : [51,51,51]); }
          doc.text(String(val || ''), tx + 0.8, cy + 3.5);
          tx += tWidths[ci2];
        });
        cy += trh;
      });
      return cy;
    };

    const half      = Math.ceil(dailyRows.length / 2);
    const leftRows  = dailyRows.slice(0, half);
    const rightRows = dailyRows.slice(half);
    const lx = 10; const rx = 10 + halfW + gap;
    let yl  = drawHalfHeader(lx, y);
    let yr2 = drawHalfHeader(rx, y);
    yl  = drawHalfRows(lx, yl, leftRows);
    yr2 = drawHalfRows(rx, yr2, rightRows);
    y = Math.max(yl, yr2) + 5;

    // LEGEND
    doc.setFontSize(7); doc.setFont('helvetica','bold'); setFont(MUTED);
    doc.text('LEGEND:', 10, y);
    const legs = [['P','Present',GREEN],['A','Absent',RED],['L','Late',AMBER],['CL','Casual Leave',PURPLE],['WO','Week Off',BLUE]];
    let lx2 = 27;
    legs.forEach(([code, label, color]) => {
      doc.setFontSize(7); doc.setFont('helvetica','bold'); setFont(color); doc.text(code, lx2, y);
      doc.setFont('helvetica','normal'); setFont(DARK); doc.text('= ' + label, lx2 + code.length * 2.5 + 0.5, y);
      lx2 += 33;
    });
    y += 6;

    // SIGNATURE
    const sigH = 20;
    setFill(LIGHT); setStroke(BORDER); doc.setLineWidth(0.3);
    doc.rect(10, y, W-20, sigH, 'FD');
    const sw = (W-20)/2;
    const lsx = 10 + sw/2;
    doc.setFontSize(8.5); doc.setFont('helvetica','bold'); setFont(NAVY);
    doc.text('HR Manager Signature', lsx, y + 5, { align: 'center' });
    setStroke(NAVY); doc.setLineWidth(0.4);
    doc.line(lsx - 25, y + 14, lsx + 25, y + 14);
    doc.setFontSize(7.5); doc.setFont('helvetica','normal'); setFont(MUTED);
    doc.text('Sayash Vastu — HR Department', lsx, y + 17.5, { align: 'center' });
    setStroke(BORDER); doc.setLineWidth(0.3);
    doc.line(10 + sw, y + 2, 10 + sw, y + sigH - 2);
    const rsx = 10 + sw + sw/2;
    doc.setFontSize(8.5); doc.setFont('helvetica','bold'); setFont(NAVY);
    doc.text('Authorized Signatory', rsx, y + 5, { align: 'center' });
    setStroke(NAVY); doc.setLineWidth(0.4);
    doc.line(rsx - 25, y + 14, rsx + 25, y + 14);
    doc.setFontSize(7.5); doc.setFont('helvetica','normal'); setFont(MUTED);
    doc.text('Sayash Vastu — Management', rsx, y + 17.5, { align: 'center' });
  };

  // Generate page for each employee
  for (let i = 0; i < (emps || []).length; i++) {
    await generateEmpPage(emps[i], i === 0);
  }

  doc.save(`SayashVastu_Attendance_All_${monthName}_${yr}.pdf`);
  showToast('✅ Attendance PDF exported!', 'ok');
}

// ═══════════════════════════════════════════
//  LOGIN
// ═══════════════════════════════════════════
async function doLogin() {
  const email = document.getElementById('loginEmail').value.trim();
  const pass = document.getElementById('loginPass').value.trim();
  const btn = document.getElementById('loginBtn');
  const errEl = document.getElementById('loginError');
  if (!email || !pass) { showLoginError('Please enter email and password.'); return; }
  btn.disabled = true; btn.innerHTML = '<span class="spin"></span>Signing in...';
  errEl.style.display = 'none';
  try {
const { data, error } = await sb.from('employees').select('*').eq('email', email.toLowerCase()).eq('password_hash', pass).eq('is_active', true).single();
    if (error || !data) {
      showLoginError('Invalid email or password. Please try again.');
      btn.disabled = false; btn.textContent = 'Sign In to Portal'; return;
    }
    currentUser = data;
    currentUser.displayRole = currentUser.role;
    if (currentUser.role === 'hr') currentUser.role = 'ceo';
    localStorage.setItem('sv_user', JSON.stringify(data));
    await sb.from('user_sessions').insert({ employee_email: data.email, employee_name: data.name, role: data.role, login_at: new Date().toISOString() });
    btn.disabled = false; btn.textContent = 'Sign In to Portal';
    showApp();
  } catch (err) {
    showLoginError('Connection error. Please try again.');
    btn.disabled = false; btn.textContent = 'Sign In to Portal';
  }
}

function showLoginError(msg) {
  const el = document.getElementById('loginError');
  el.textContent = msg; el.style.display = 'block';
}

function doLogout() {
  localStorage.removeItem('sv_user'); currentUser = null;
  document.getElementById('loginPage').style.display = 'flex';
  document.getElementById('appPage').style.display = 'none';
  document.getElementById('loginEmail').value = '';
  document.getElementById('loginPass').value = '';
}

// ═══════════════════════════════════════════
//  SHOW APP
// ═══════════════════════════════════════════
function showApp() {
  document.getElementById('loginPage').style.display = 'none';
  document.getElementById('appPage').style.display = 'block';
  const av = currentUser.name.substring(0,2).toUpperCase();
  const sidebarAvEl = document.getElementById('sidebarAv');
  if (currentUser.photo_url) {
    sidebarAvEl.innerHTML = `<img src="${currentUser.photo_url}" style="width:36px;height:36px;object-fit:cover;border-radius:50%"/>`;
    sidebarAvEl.style.background = 'transparent';
    sidebarAvEl.style.padding = '0';
  } else {
    sidebarAvEl.textContent = av;
    sidebarAvEl.style.background = '';
  }
  document.getElementById('sidebarName').textContent = currentUser.name;
document.getElementById('sidebarRole').textContent = (currentUser.displayRole || currentUser.role).toUpperCase();
  document.getElementById('nav-assign').style.display = 'flex';

  if (currentUser.role === 'ceo') {
['nav-employees','nav-att-report','nav-leave-approve','nav-all-tasks-work','nav-assign-ceo','nav-reports-approval','nav-ceo-my-tasks','nav-regularization','nav-payroll-parent'].forEach(id => {
    const el = document.getElementById(id);
      if (el) el.style.display = 'flex';
    });
    document.getElementById('ceo-section').style.display = 'block';
    document.getElementById('nav-ceo-parent').style.display = 'flex';
    document.getElementById('ceo-notice-form').style.display = 'block';
    // CEO ko My Tasks, Attendance, Leave nahi chahiye
    document.getElementById('nav-tasks').style.display = 'none';
    document.getElementById('nav-assign').style.display = 'none';
    const navAttCeo = document.getElementById('nav-attendance');
    const navLeavesCeo = document.getElementById('nav-leaves');
    if (navAttCeo) navAttCeo.style.display = 'none';
    if (navLeavesCeo) navLeavesCeo.style.display = 'none';
   // Hide My Reports for CEO (Follow-up stays visible for CEO)
    const navMyRep = document.getElementById('nav-my-reports');
    if (navMyRep) navMyRep.style.display = 'none';
    const navFU = document.getElementById('nav-followup');
    if (navFU) navFU.style.display = 'flex';
} else {
    ['nav-all-tasks-work','nav-employees','nav-att-report','nav-leave-approve','nav-regularization'].forEach(id => {
      document.getElementById(id).style.display = 'none';
    });
    document.getElementById('ceo-section').style.display = 'none';
    document.getElementById('ceo-notice-form').style.display = 'none';
    document.getElementById('nav-tasks').style.display = 'flex';
    const ceoParentBtn = document.getElementById('nav-ceo-parent');
    if (ceoParentBtn) ceoParentBtn.style.display = 'none';
    // Show attendance/leave for employees only
    const navAtt = document.getElementById('nav-attendance');
    const navLeaves = document.getElementById('nav-leaves');
    if (navAtt) navAtt.style.display = 'flex';
    if (navLeaves) navLeaves.style.display = 'flex';

    // Alisha/Rajendra get Reports Approval instead of My Reports
    const isApprover = ['alisha@sayashvastu.com', 'rajendra@sayashvastu.com'].includes(currentUser.email);
    const navMyReports = document.getElementById('nav-my-reports');
    const navReportsApproval = document.getElementById('nav-reports-approval');
    if (isApprover) {
      if (navMyReports) navMyReports.style.display = 'none';
      if (navReportsApproval) navReportsApproval.style.display = 'flex';
    } else {
      if (navMyReports) navMyReports.style.display = 'flex';
      if (navReportsApproval) navReportsApproval.style.display = 'none';
    }

    // Show Follow-up for employees
const navFollowup = document.getElementById('nav-followup');
    if (navFollowup) navFollowup.style.display = 'flex';

    // Leads section — only Harshita and Ritika
    const isLeadHandler = ['harshita@sayashvastu.com', 'ritika@sayashvastu.com'].includes(currentUser.email);
    const navLeads = document.getElementById('nav-leads');
    if (navLeads) navLeads.style.display = isLeadHandler ? 'flex' : 'none';
    // Senior Review removed
  }
    loadEmployeeAutocomplete();
  loadHome();
  showView('home');
  // Load notifications and setup realtime
  setTimeout(() => {
    loadNotifications();
    setupNotifRealtime();
  }, 500);

  // Greeting handled in loadHome now
  // Documents aur Calendar employee ko dikhao
  const navCompliance = document.getElementById('nav-compliance');
if (navCompliance) {
  if (currentUser.role === 'ceo' || currentUser.email === 'alisha@sayashvastu.com') {
    navCompliance.style.display = 'flex';
  } else {
    navCompliance.style.display = 'none';
  }
}
  // Client CRM Navigation
const navClientCrmParent = document.getElementById('nav-client-crm-parent');
const navClientCrmMenu = document.getElementById('clientCrmMenu');
const navClients = document.getElementById('nav-clients');
const navClientProjects = document.getElementById('nav-client-projects');
const navClientVisits = document.getElementById('nav-client-visits');
const navPayments = document.getElementById('nav-payments-link');

const hideClientCrm = ['shantanu@sayashvastu.com', 'komal@sayashvastu.com'].includes(currentUser.email);
const showClientData = !hideClientCrm;
const showPayments = currentUser.role === 'ceo' || ['alisha@sayashvastu.com', 'ritika@sayashvastu.com'].includes(currentUser.email);
  
if (navClientCrmParent) navClientCrmParent.style.display = hideClientCrm ? 'none' : 'flex';
const clientCrmSection = document.getElementById('client-crm-section');
if (clientCrmSection) clientCrmSection.style.display = hideClientCrm ? 'none' : 'block';
  if (navClientCrmMenu) navClientCrmMenu.style.display = 'none';

if (navClients) navClients.style.display = showClientData ? 'flex' : 'none';
if (navClientProjects) navClientProjects.style.display = showClientData ? 'flex' : 'none';
if (navClientVisits) navClientVisits.style.display = showClientData ? 'flex' : 'none';
if (navPayments) navPayments.style.display = showPayments ? 'flex' : 'none';
    const navDocs = document.getElementById('nav-documents');
    const navCal = document.getElementById('nav-calendar');
    if (navDocs) navDocs.style.display = 'flex';
    if (navCal) navCal.style.display = 'flex';

  const today = new Date().toISOString().split('T')[0];
  const atStart = document.getElementById('at-start');
  if (atStart) atStart.value = today;
  // Auto refresh start
  startAutoRefresh();
}

// ═══════════════════════════════════════════
//  NAVIGATION
// ═══════════════════════════════════════════
const viewTitles = {
  home: ['Dashboard','Welcome back!'],
  tasks: ['My Tasks','Track and update your tasks'],
  assign: ['Assign Task','Create and assign tasks to employees'],
  attendance: ['Attendance','Mark your daily attendance'],
  leaves: ['Leave Management','Apply and track leaves'],
  notices: ['Notice Board','Company announcements'],
  allTasks: ['All Tasks','Complete task overview'],
  employees: ['Employees','Manage company employees'],
  attReport: ['Attendance Report','Monthly attendance overview'],
  leaveApprove: ['Leave Approvals','Approve or reject leave requests'],
  reportsApproval: ['Reports Approval','Pending approvals — SG & YG'],
  ceoMyTasks: ['My Tasks','Tasks assigned to you by employees'],
  myReports: ['My Reports','Reports submitted for approval'],
  followUp: ['Follow-up Tasks','Tasks you assigned — track progress'],
  seniorReview: ['Senior Review','Approve tasks before CEO review'],
  myProfile: ['My Profile','Update your personal information'],
  tickets: ['Tickets','Raise and track support tickets'],
  holidays: ['Holidays','Company holiday calendar 2026'],
  hrPolicy: ['HR Policies','Company policies — read and acknowledge'],
  projects: ['Projects','Company project overview'],
  helpRequest: ['Help Requests','Request help from colleagues'],
expenses: ['Expense Claims','Submit and track your expense reimbursements'],
compliance: ['Compliance Checklist','Monthly finance and compliance tasks'],
  offerLetters: ['Offer Letters','Upload and manage employee offer letters'],
  salarySlips: ['Salary Slips','Generate and download salary slips'],
  salaryStructure: ['Salary Setup','Set monthly salary for employees'],
  pendingPayments: ['Pending Payments','Track outstanding payments and follow-ups'],
};
  function showView(name) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  // Auto open parent menus
  if (['tasks','assign','seniorReview','projects','helpRequest','allTasks','reportsApproval','myReports','followUp','ceoMyTasks'].includes(name)) {
    document.getElementById('workMenu').style.display = 'block';
    const arr = document.getElementById('work-arrow');
    if (arr) arr.style.transform = 'rotate(90deg)';
  }
  if (['performance','notices','tickets'].includes(name)) {
    const cm = document.getElementById('companyMenu');
    if (cm) cm.style.display = 'block';
    const arr = document.getElementById('company-arrow');
    if (arr) arr.style.transform = 'rotate(90deg)';
  }
  if (['attendance','leaves','holidays','hrPolicy'].includes(name)) {
    const hrMenuEl = document.getElementById('hrMenu');
    if (hrMenuEl) hrMenuEl.style.display = 'block';
    const arr = document.getElementById('hr-arrow');
    if (arr) arr.style.transform = 'rotate(90deg)';
  }
if (['allTasks','employees','attReport','leaveApprove'].includes(name)) {
    document.getElementById('ceoMenu').style.display = 'block';
    const arr = document.getElementById('ceo-arrow');
    if (arr) arr.style.transform = 'rotate(90deg)';
  }
  if (['offerLetters','salarySlips','salaryStructure'].includes(name)) {
    document.getElementById('ceoMenu').style.display = 'block';
    const arr = document.getElementById('ceo-arrow');
    if (arr) arr.style.transform = 'rotate(90deg)';
    const pm = document.getElementById('payrollMenu');
    if (pm) pm.style.display = 'block';
    const parr = document.getElementById('payroll-arrow');
    if (parr) parr.style.transform = 'rotate(90deg)';
  }
  const el = document.getElementById('view-' + name);
  if (el) el.classList.add('active');
  const navBtn = document.querySelector(`[onclick="showView('${name}')"]`);
  if (navBtn) navBtn.classList.add('active');
  const titles = viewTitles[name] || [name,''];
  document.getElementById('topbarTitle').textContent = titles[0];
  document.getElementById('topbarSub').textContent = titles[1];

  if (name === 'home') loadHome();
  if (name === 'tasks') loadMyTasks();
  if (name === 'attendance') { loadAttendance(); initAttMonth(); }
  if (name === 'leaves') loadLeaves();
  if (name === 'notices') loadNotices();
  if (name === 'allTasks') loadAllTasks();
  if (name === 'employees') loadEmployees();
  if (name === 'attReport') {
    const now = new Date();
    document.getElementById('att-month-filter').value = now.getFullYear() + '-' + String(now.getMonth()+1).padStart(2,'0');
    loadAttReport();
  }
  if (name === 'leaveApprove') loadLeaveApprovals();
  if (name === 'reportsApproval') loadReportsApproval();
  if (name === 'ceoMyTasks') loadCeoMyTasks();
  if (name === 'myReports') loadMyReports();
  if (name === 'followUp') loadFollowUp();
  if (name === 'seniorReview') loadSeniorReview();
  if (name === 'myProfile') loadMyProfile();
  if (name === 'performance') loadPerformance();
  if (name === 'tickets') loadTickets();
  if (name === 'holidays') loadHolidays();
  if (name === 'hrPolicy') loadHRPolicies();
  if (name === 'projects') loadProjects();
  if (name === 'helpRequest') loadHelpRequests();
  if (name === 'regularization') loadAllRegularizations();
if (name === 'documents') {
    if (currentUser.role === 'ceo') loadAllDocuments();
    else loadMyDocs();
}
if (name === 'offerLetters') loadOfferLetters();
  if (name === 'salaryStructure') loadSalaryStructure();
    if (name === 'calendar') loadCalendar();
  if (name === 'expenses') loadExpenses();
  if (name === 'compliance') loadCompliance();
  if (name === 'attendance') loadMyRegularizations();
if (name === 'clientsList') loadClientsList();
if (name === 'clientProjects') loadClientProjectsAll();
if (name === 'clientVisits') loadClientVisitsAll();
if (name === 'pendingPayments') loadPendingPayments();
  if (name === 'leadsManagement') loadLeadsManagement();    
}
function openClientCrmWithRole() {
  const fullAccessEmails = ['alisha@sayashvastu.com', 'ritika@sayashvastu.com'];
  const accessLevel = (currentUser.role === 'ceo' || fullAccessEmails.includes(currentUser.email)) ? 'full' : 'limited';
  window.open(`https://sayash-client-crm.vercel.app?access=${accessLevel}`, '_blank');
}

async function loadClientVisitsAll() {
  const el = document.getElementById('view-clientVisits');
  el.innerHTML = `
    <div class="page-header"><h2>🏗️ Site Visit / MOM</h2><p>All client site visits</p></div>
    <div id="siteVisitSummary" style="margin-bottom:20px"></div>
    <div style="display:flex;justify-content:flex-end;margin-bottom:16px">
      <button class="btn btn-gold" onclick="openAddVisitEmpGlobal()">➕ Add Site Visit</button>
    </div>
    <div id="clientVisitsList"></div>
  `;
  const { data } = await sbClient.from('site_visits').select('*, clients(name)').order('visit_date', { ascending: false });

  // Build summary: total visits + per-employee breakdown
  const totalVisits = (data || []).length;
  const empCounts = {};
  (data || []).forEach(v => {
    const name = v.visited_by || 'Unknown';
    empCounts[name] = (empCounts[name] || 0) + 1;
  });
  const sortedEmps = Object.entries(empCounts).sort((a,b) => b[1] - a[1]);

  document.getElementById('siteVisitSummary').innerHTML = `
    <div class="panel">
      <div class="panel-head">
        <div class="panel-title">📊 Site Visit Summary</div>
        <span class="badge b-navy">${totalVisits} Total Visits</span>
      </div>
      <div class="panel-body" style="display:flex;flex-wrap:wrap;gap:10px">
        ${!sortedEmps.length ? '<div style="color:var(--muted);font-size:13px">No visits recorded yet</div>' :
          sortedEmps.map(([name, count]) => `
            <div style="display:flex;align-items:center;gap:8px;background:var(--bg);padding:8px 14px;border-radius:8px">
              <div class="av" style="width:26px;height:26px;font-size:10px;background:var(--navy)">${esc(name).substring(0,2).toUpperCase()}</div>
              <span style="font-size:12px;font-weight:600;color:var(--navy)">${esc(name)}</span>
              <span class="badge b-blue" style="font-size:11px">${count} visit${count>1?'s':''}</span>
            </div>
          `).join('')}
      </div>
    </div>
  `;

  if (!data?.length) {
    document.getElementById('clientVisitsList').innerHTML = '<div class="empty-state"><div class="empty-icon">🏗️</div><div class="empty-title">No site visits yet</div></div>';
    return;
  }
document.getElementById('clientVisitsList').innerHTML = data.map(v => `
    <div class="panel" style="margin-bottom:14px">
      <div class="panel-head">
<div class="panel-title">🏗️ ${esc(v.clients?.name||'-')} <span style="font-size:12px;font-weight:400;color:var(--muted);margin-left:8px">${fmtDate(v.visit_date)}</span></div>
        <div style="display:flex;gap:8px;align-items:center">
          <span class="badge b-blue">${esc(v.visited_by||'-')}</span>
          <button class="btn btn-sm" onclick="deleteSiteVisitGlobal('${v.id}')" style="background:#fdf0ee;color:var(--red);border-color:var(--red-bg)">🗑️</button>
        </div>
      </div>
      <div class="panel-body">
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">
          ${v.location?`<div><div style="font-size:11px;color:var(--muted);font-weight:700;text-transform:uppercase;margin-bottom:4px">📍 Location</div><div style="font-size:13px">${esc(v.location)}</div></div>`:''}
          ${v.assigned_to?`<div><div style="font-size:11px;color:var(--muted);font-weight:700;text-transform:uppercase;margin-bottom:4px">👤 Assigned To</div><div style="font-size:13px">${esc(v.assigned_to)}</div></div>`:''}
          ${v.discussion?`<div style="grid-column:1/-1"><div style="font-size:11px;color:var(--muted);font-weight:700;text-transform:uppercase;margin-bottom:4px">💬 Site Description</div><div style="font-size:13px">${esc(v.discussion)}</div></div>`:''}
          ${v.suggestions?`<div style="grid-column:1/-1"><div style="font-size:11px;color:var(--muted);font-weight:700;text-transform:uppercase;margin-bottom:4px">✨ Vastu Suggestions</div><div style="font-size:13px">${esc(v.suggestions)}</div></div>`:''}
          ${v.remarks?`<div style="grid-column:1/-1"><div style="font-size:11px;color:var(--muted);font-weight:700;text-transform:uppercase;margin-bottom:4px">📝 Remarks</div><div style="font-size:13px">${esc(v.remarks)}</div></div>`:''}
        </div>
      </div>
    </div>
  `).join('');
}
async function deleteSiteVisitGlobal(visitId) {
  if (!confirm('Delete this site visit?')) return;
  const { error } = await sbClient.from('site_visits').delete().eq('id', visitId);
  if (error) { showToast('❌ ' + error.message, 'err'); return; }
  showToast('✅ Site visit deleted!', 'ok');
  loadClientVisitsAll();
}
// ═══════════════════════════════════════════
//  VOICE NOTES RECORDING
// ═══════════════════════════════════════════
window._voiceRecordings = {};
window._mediaRecorder = null;
window._recordingChunks = [];

async function toggleVoiceRecording(prefix) {
  const btn = document.getElementById(prefix + 'RecordBtn');
  if (!window._mediaRecorder || window._mediaRecorder.state === 'inactive') {
    // Start recording
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      window._mediaRecorder = new MediaRecorder(stream);
      window._recordingChunks = [];

      window._mediaRecorder.ondataavailable = (e) => window._recordingChunks.push(e.data);
      window._mediaRecorder.onstop = () => {
        const blob = new Blob(window._recordingChunks, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        if (!window._voiceRecordings[prefix]) window._voiceRecordings[prefix] = [];
        window._voiceRecordings[prefix].push({ blob, url, id: Date.now() });
        renderVoiceNotesList(prefix);
        stream.getTracks().forEach(track => track.stop());
      };

      window._mediaRecorder.start();
      btn.textContent = '⏹️ Stop Recording';
      btn.classList.add('btn-red');
      btn.classList.remove('btn-outline');
    } catch (err) {
      showToast('❌ Microphone access denied or unavailable', 'err');
    }
  } else {
    // Stop recording
    window._mediaRecorder.stop();
    btn.textContent = '🎙️ Record Voice Note';
    btn.classList.remove('btn-red');
    btn.classList.add('btn-outline');
  }
}

function renderVoiceNotesList(prefix) {
  const listEl = document.getElementById(prefix + 'VoiceList');
  if (!listEl) return;
  const recordings = window._voiceRecordings[prefix] || [];
  listEl.innerHTML = recordings.map((r, i) => `
    <div style="display:flex;align-items:center;gap:8px;padding:6px 10px;background:#f8f9fc;border-radius:8px">
      <audio src="${r.url}" controls style="height:32px;flex:1"></audio>
      <button type="button" onclick="deleteVoiceNote('${prefix}', ${r.id})" style="background:#fdf0ee;color:var(--red);border:1px solid var(--red-bg);border-radius:6px;padding:4px 8px;font-size:11px;cursor:pointer">🗑️</button>
    </div>
  `).join('');
}

function deleteVoiceNote(prefix, id) {
  window._voiceRecordings[prefix] = (window._voiceRecordings[prefix] || []).filter(r => r.id !== id);
  renderVoiceNotesList(prefix);
}

async function uploadVoiceNotes(prefix) {
  const recordings = window._voiceRecordings[prefix] || [];
  if (!recordings.length) return [];
  const urls = [];
  for (const r of recordings) {
    const path = `voice-notes/${Date.now()}_${Math.random().toString(36).substring(7)}.webm`;
    const { error } = await sbClient.storage.from('client-documents').upload(path, r.blob);
    if (!error) {
      const { data: urlData } = sbClient.storage.from('client-documents').getPublicUrl(path);
      urls.push(urlData.publicUrl);
    }
  }
  return urls;
}
function toggleVisitorSelect(checkbox) {
  window._avgSelectedVisitors = window._avgSelectedVisitors || [];
  const name = checkbox.value;
  const chipId = 'visitor-chip-' + name.replace(/[^a-z0-9]/gi,'_');
  const chip = document.getElementById(chipId);

  if (checkbox.checked) {
    if (!window._avgSelectedVisitors.includes(name)) window._avgSelectedVisitors.push(name);
    if (chip) { chip.style.background='var(--gold)'; chip.style.borderColor='var(--gold)'; chip.style.color='var(--navy)'; chip.style.fontWeight='700'; }
  } else {
    window._avgSelectedVisitors = window._avgSelectedVisitors.filter(n => n !== name);
    if (chip) { chip.style.background='var(--bg)'; chip.style.borderColor='var(--border)'; chip.style.color='var(--text)'; chip.style.fontWeight='400'; }
  }
}
function openAddVisitEmpGlobal() {
  document.body.insertAdjacentHTML('beforeend', `
    <div class="modal-overlay open" id="addVisitGlobalModal">
      <div class="modal">
        <div class="modal-title">🏗️ Add Site Visit</div>
        <div class="form-grid cols-2">
<div class="field" style="grid-column:1/-1"><label>Client *</label>
            <input id="avg-client" list="avgClientList" placeholder="Type or select client..." onchange="loadProjectsForClientByName(this.value)">
            <datalist id="avgClientList"></datalist>
          </div>
<div class="field" style="grid-column:1/-1"><label>Project</label>
            <input id="avg-project" list="avgProjectList" placeholder="Type or select project...">
            <datalist id="avgProjectList"></datalist>
          </div>
          <div class="field" style="grid-column:1/-1"><label>Sub Project</label>
            <input id="avg-subproject" list="avgSubProjectList" placeholder="Type or select sub project...">
            <datalist id="avgSubProjectList"></datalist>
          </div>
          <div class="field"><label>Visit Date</label><input type="date" id="avg-date" value="${new Date().toISOString().split('T')[0]}"></div>
          <div class="field"><label>Layout Received Date</label><input type="date" id="avg-layout-date"></div>
<div class="field" style="grid-column:1/-1"><label>Visited By</label>
  <div id="avg-by-list" style="display:flex;flex-wrap:wrap;gap:8px;padding:10px;border:1.5px solid var(--border);border-radius:8px;min-height:44px;background:#fff">
    <span style="font-size:12px;color:var(--muted)">Loading...</span>
  </div>
</div>
<div class="field"><label>Assign Report To *</label>
  <input id="avg-assigned" list="avgAssignedList" placeholder="Type or select employee...">
  <datalist id="avgAssignedList"></datalist>
</div>
<div class="field"><label>Type</label>
            <select id="avg-type">
              <option>Site Visit</option>
              <option>Meeting</option>
              <option>Telephonic</option>
              <option>Mail</option>
            </select>
          </div>
          <div class="field" style="grid-column:1/-1"><label>Location</label><input id="avg-location" placeholder="Site address or Google Maps link"></div>
          <div class="field" style="grid-column:1/-1"><label>Site Description</label><textarea id="avg-discussion" placeholder="Site description..."></textarea></div>
          <div class="field" style="grid-column:1/-1"><label>Vastu Suggestions</label><textarea id="avg-suggestions" placeholder="Suggestions given..."></textarea></div>
<div class="field" style="grid-column:1/-1"><label>Comments / Remarks</label><textarea id="avg-remarks" placeholder="Any comments or remarks..."></textarea></div>
          <div class="field" style="grid-column:1/-1">
            <label>🎙️ Voice Notes (Optional)</label>
            <div id="avgVoiceList" style="display:flex;flex-direction:column;gap:8px;margin-bottom:8px"></div>
            <button type="button" class="btn btn-outline btn-sm" id="avgRecordBtn" onclick="toggleVoiceRecording('avg')">🎙️ Record Voice Note</button>
            <div style="font-size:11px;color:var(--muted);margin-top:4px">Jaldi mein ho to bol kar record karo, jisko task assign hoga woh sun sakega</div>
          </div>
          <div class="field" style="grid-column:1/-1"><label>Upload Report File (Optional)</label>
            <div class="upload-zone" onclick="document.getElementById('avgFile').click()">
              <input type="file" id="avgFile" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" onchange="document.getElementById('avgFileName').textContent = this.files[0] ? '✅ ' + this.files[0].name : ''">
              <div style="font-size:24px;margin-bottom:6px">📎</div>
              <div style="font-size:13px;color:var(--muted)">Click to upload file</div>
              <div id="avgFileName" style="font-size:12px;color:var(--green);font-weight:600;margin-top:6px"></div>
            </div>
          </div>
          <div class="field" style="grid-column:1/-1"><label>Or OneDrive / SharePoint Link (Optional)</label>
            <input id="avg-onedrive-link" placeholder="https://sayashvastucorp-my.sharepoint.com/...">
            <div style="font-size:11px;color:var(--muted);margin-top:4px">📌 File already OneDrive par hai toh share link yahan paste karo</div>
          </div>
        </div>
        <div class="modal-actions">
          <button class="btn btn-outline" onclick="closeModal('addVisitGlobalModal')">Cancel</button>
          <button class="btn btn-gold" onclick="saveVisitGlobal()">💾 Save Visit</button>
        </div>
      </div>
    </div>
  `);
sbClient.from('clients').select('id, name').order('name').then(({ data }) => {
    window._avgAllClients = data || [];
    const dl = document.getElementById('avgClientList');
    if (dl) dl.innerHTML = (data||[]).map(c => `<option value="${esc(c.name)}">`).join('');
  });
  sb.from('employees').select('name').eq('is_active', true).order('name').then(({ data }) => {
    const assignedList = document.getElementById('avgAssignedList');
    const opts = (data || []).map(e => `<option value="${esc(e.name)}">`).join('');
    if (assignedList) assignedList.innerHTML = opts;

    window._avgSelectedVisitors = [currentUser.name];
    const byListEl = document.getElementById('avg-by-list');
    if (byListEl && data) {
      byListEl.innerHTML = data.map(e => {
        const isMe = e.name === currentUser.name;
        return `<label style="display:flex;align-items:center;gap:6px;padding:6px 12px;background:${isMe?'var(--gold)':'var(--bg)'};border-radius:20px;cursor:pointer;font-size:12px;border:1.5px solid ${isMe?'var(--gold)':'var(--border)'};color:${isMe?'var(--navy)':'var(--text)'};font-weight:${isMe?'700':'400'}" id="visitor-chip-${e.name.replace(/[^a-z0-9]/gi,'_')}">
          <input type="checkbox" value="${esc(e.name)}" ${isMe?'checked':''} onchange="toggleVisitorSelect(this)" style="cursor:pointer;accent-color:var(--gold)"/>
          ${esc(e.name)}
        </label>`;
      }).join('');
    }
  });
}
window._avgClientRecords = [];
window._atClientRecords = [];

async function loadPendingPayments() {
  const el = document.getElementById('view-pendingPayments');
el.innerHTML = `
    <div class="page-header"><h2>💰 Pending Payments</h2><p>Track outstanding payments and follow-ups</p></div>
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;flex-wrap:wrap;gap:10px">
      <div style="display:flex;gap:8px">
        <button class="btn btn-gold btn-sm" id="ppTabPending" onclick="switchPaymentTab('pending')">⏳ Pending</button>
        <button class="btn btn-outline btn-sm" id="ppTabCompleted" onclick="switchPaymentTab('completed')">✅ Completed</button>
      </div>
      <button class="btn btn-gold" onclick="openAddPendingPaymentModal()">➕ Add Pending Payment</button>
    </div>
    <div id="pendingPaymentsStats" style="display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin-bottom:20px"></div>
    <div id="pendingPaymentsList"></div>
  `;  
  const [{ data: clients }, { data: projects }, { data: payments }, { data: followups }] = await Promise.all([
    sbClient.from('clients').select('id, name'),
    sbClient.from('projects').select('*'),
    sbClient.from('payments').select('*'),
    sbClient.from('followups').select('*').order('next_followup', { ascending: true }),
  ]);

  const clientMap = {};
  (clients || []).forEach(c => { clientMap[c.id] = c.name; });

const paidByClient = {};
  (payments || []).forEach(p => {
    paidByClient[p.client_id] = (paidByClient[p.client_id] || 0) + (p.amount || 0);
  });

const allPaymentRows = (projects || []).map(p => {
    const total = p.total_amount || 0;
    const paid = paidByClient[p.client_id] || 0;
    const balance = total - paid;
    return {
      clientId: p.client_id,
      clientName: clientMap[p.client_id] || '—',
      projectId: p.id,
      projectTitle: p.title,
      total, paid, balance,
    };
  });
  const pendingRows = allPaymentRows.filter(r => r.balance > 0);
  const completedRows = allPaymentRows.filter(r => r.balance <= 0 && r.total > 0);
  window._completedPaymentRows = completedRows;
  const followupsByClient = {};
  (followups || []).forEach(f => {
    if (!followupsByClient[f.client_id]) followupsByClient[f.client_id] = [];
    followupsByClient[f.client_id].push(f);
  });

  window._pendingPaymentRows = pendingRows;
  window._followupsByClient = followupsByClient;

  const totalPending = pendingRows.reduce((s, r) => s + r.balance, 0);
  const today = new Date().toISOString().split('T')[0];
  const overdueCount = Object.values(followupsByClient).flat().filter(f => !f.done && f.next_followup && f.next_followup < today).length;

  document.getElementById('pendingPaymentsStats').innerHTML = `
    <div class="stat-card sc-red"><div class="stat-icon">⏳</div><div class="stat-num">${pendingRows.length}</div><div class="stat-lbl">Pending Projects</div></div>
    <div class="stat-card sc-navy"><div class="stat-icon">💰</div><div class="stat-num">₹${(totalPending/100000).toFixed(1)}L</div><div class="stat-lbl">Total Outstanding</div></div>
    <div class="stat-card sc-amber"><div class="stat-icon">⚠️</div><div class="stat-num">${overdueCount}</div><div class="stat-lbl">Overdue Follow-ups</div></div>
  `;

  renderPendingPaymentsList();
}

function renderPendingPaymentsList() {
  const rows = window._pendingPaymentRows || [];
  const followupsByClient = window._followupsByClient || {};
  const today = new Date().toISOString().split('T')[0];

  const el = document.getElementById('pendingPaymentsList');
  if (!rows.length) {
    el.innerHTML = '<div class="empty-state"><div class="empty-icon">✅</div><div class="empty-title">No pending payments!</div></div>';
    return;
  }

  el.innerHTML = `
    <div class="tbl-wrap">
      <table>
        <thead><tr><th>Client</th><th>Project</th><th>Total</th><th>Received</th><th>Balance Due</th><th>Next Follow-up</th><th>Last Outcome</th><th>Action</th></tr></thead>
        <tbody>
          ${rows.map(r => {
            const clientFollowups = (followupsByClient[r.clientId] || []);
            const pendingFollowup = clientFollowups.find(f => !f.done);
            const lastDone = clientFollowups.filter(f => f.done).sort((a,b) => new Date(b.created_at||0) - new Date(a.created_at||0))[0];
            const isOverdue = pendingFollowup && pendingFollowup.next_followup && pendingFollowup.next_followup < today;
            return `<tr style="${isOverdue ? 'background:#fdf0ee' : ''}">
              <td><strong>${esc(r.clientName)}</strong></td>
              <td>${esc(r.projectTitle)}</td>
              <td>₹${r.total.toLocaleString()}</td>
              <td style="color:var(--green);font-weight:600">₹${r.paid.toLocaleString()}</td>
              <td style="color:var(--red);font-weight:700">₹${r.balance.toLocaleString()}</td>
              <td style="font-size:12px;${isOverdue ? 'color:var(--red);font-weight:700' : ''}">${pendingFollowup ? fmtDate(pendingFollowup.next_followup) + (isOverdue ? ' ⚠️ Overdue' : '') : '—'}</td>
              <td style="font-size:12px;color:var(--muted)">${lastDone ? esc(lastDone.outcome || 'Followed up') + ' (' + fmtDate(lastDone.date||lastDone.created_at) + ')' : '—'}</td>
<td>
                <div style="display:flex;gap:4px">
                  <button class="btn btn-gold btn-sm" onclick="openPaymentFollowupModal('${r.clientId}','${esc(r.clientName).replace(/'/g,"\\'")}', ${r.balance})">📞 Follow-up</button>
                  <button class="btn btn-outline btn-sm" onclick="openEditPendingPaymentModal('${r.projectId}','${esc(r.projectTitle).replace(/'/g,"\\'")}',${r.total})">✏️</button>
                  <button class="btn btn-outline btn-sm" onclick="openPaymentHistoryModal('${r.clientId}','${esc(r.clientName).replace(/'/g,"\\'")}')">👁️</button>
                </div>
              </td>
</tr>`;
          }).join('')}
        </tbody>
      </table>
    </div>
  `;
}

function switchPaymentTab(tab) {
  const pendingBtn = document.getElementById('ppTabPending');
  const completedBtn = document.getElementById('ppTabCompleted');
  if (tab === 'pending') {
    pendingBtn.className = 'btn btn-gold btn-sm';
    completedBtn.className = 'btn btn-outline btn-sm';
    renderPendingPaymentsList();
  } else {
    pendingBtn.className = 'btn btn-outline btn-sm';
    completedBtn.className = 'btn btn-gold btn-sm';
    renderCompletedPaymentsList();
  }
}

function renderCompletedPaymentsList() {
  const rows = window._completedPaymentRows || [];
  const el = document.getElementById('pendingPaymentsList');
  if (!rows.length) {
    el.innerHTML = '<div class="empty-state"><div class="empty-icon">✅</div><div class="empty-title">No completed payments yet</div></div>';
    return;
  }

  el.innerHTML = `
    <div class="tbl-wrap">
      <table>
        <thead><tr><th>Client</th><th>Project</th><th>Total</th><th>Received</th><th>Status</th><th>Action</th></tr></thead>
        <tbody>
          ${rows.map(r => `<tr>
              <td><strong>${esc(r.clientName)}</strong></td>
              <td>${esc(r.projectTitle)}</td>
              <td>₹${r.total.toLocaleString()}</td>
              <td style="color:var(--green);font-weight:700">₹${r.paid.toLocaleString()}</td>
              <td><span class="badge b-green">✅ Fully Paid</span></td>
              <td>
                <button class="btn btn-outline btn-sm" onclick="openPaymentHistoryModal('${r.clientId}','${esc(r.clientName).replace(/'/g,"\\'")}')">👁️ History</button>
              </td>
            </tr>`).join('')}
        </tbody>
      </table>
    </div>
  `;
}

function openPaymentFollowupModal(clientId, clientName, balanceDue) {
  document.body.insertAdjacentHTML('beforeend', `
    <div class="modal-overlay open" id="paymentFollowupModal">
      <div class="modal">
        <div class="modal-title">📞 Payment Follow-up — ${esc(clientName)}</div>
        <div style="padding:10px 14px;background:#fdf0ee;border-radius:8px;margin-bottom:14px">
          <div style="font-size:11px;color:var(--muted);font-weight:700;text-transform:uppercase">Balance Due</div>
          <div style="font-size:20px;font-weight:800;color:var(--red)">₹${balanceDue.toLocaleString()}</div>
        </div>
        <div class="form-grid cols-2">
          <div class="field"><label>Outcome of this contact</label>
            <select id="pf-outcome">
              <option value="">— Select —</option>
              <option>Promised to pay — Rescheduled</option>
              <option>Paid Partial</option>
              <option>Paid Full</option>
              <option>No Response</option>
              <option>Refused / Disputed</option>
            </select>
          </div>
          <div class="field"><label>Amount Collected Now (₹) — if any</label><input type="number" id="pf-amount" placeholder="0"></div>
          <div class="field"><label>Next Follow-up Date</label><input type="date" id="pf-nextdate"></div>
          <div class="field" style="grid-column:1/-1"><label>Notes</label><textarea id="pf-notes" placeholder="e.g. Client said call in 2 days..."></textarea></div>
        </div>
        <div class="modal-actions">
          <button class="btn btn-outline" onclick="closeModal('paymentFollowupModal')">Cancel</button>
          <button class="btn btn-gold" onclick="savePaymentFollowup('${clientId}')">💾 Save Follow-up</button>
        </div>
      </div>
    </div>
  `);
}

async function savePaymentFollowup(clientId) {
  const outcome = document.getElementById('pf-outcome').value;
  const amountCollected = parseFloat(document.getElementById('pf-amount').value) || 0;
  const nextDate = document.getElementById('pf-nextdate').value || null;
  const notes = document.getElementById('pf-notes').value.trim();

  if (!outcome) { showToast('⚠️ Outcome select karo', 'warn'); return; }

  // Record the actual payment if an amount was collected
  if (amountCollected > 0) {
    const { error: payErr } = await sbClient.from('payments').insert({
      client_id: clientId,
      amount: amountCollected,
      date: new Date().toISOString().split('T')[0],
      mode: 'Other',
      note: 'Collected via follow-up — ' + outcome,
    });
    if (payErr) {
      showToast('⚠️ Payment record failed: ' + payErr.message, 'warn');
    }
  }
  // Mark any existing pending followup as done with this outcome
  const existingFollowups = (window._followupsByClient || {})[clientId] || [];
  const pendingFollowup = existingFollowups.find(f => !f.done);

  if (pendingFollowup) {
    await sbClient.from('followups').update({
      done: true,
      outcome,
      amount_collected: amountCollected,
      notes: notes || pendingFollowup.notes,
    }).eq('id', pendingFollowup.id);
  } else {
    await sbClient.from('followups').insert({
      client_id: clientId,
      type: 'Payment Follow-up',
      done: true,
      outcome,
      amount_collected: amountCollected,
      notes,
      date: new Date().toISOString(),
    });
  }

  // If a next follow-up date is set, create a new pending followup entry
  if (nextDate) {
    await sbClient.from('followups').insert({
      client_id: clientId,
      type: 'Payment Follow-up',
      next_followup: nextDate,
      notes: notes,
      done: false,
      date: new Date().toISOString(),
    });

    // Create a reminder notification for this date (will surface via existing notification check on that day)
    await createNotification(
      currentUser.email,
      `💰 Payment Follow-up Due — ${(window._pendingPaymentRows||[]).find(r=>r.clientId===clientId)?.clientName || 'Client'}`,
      `Follow-up scheduled for ${nextDate}. Notes: ${notes || 'No notes'}`,
      'General', 'pendingPayments'
    );
  }
showToast('✅ Follow-up saved!', 'ok');
  closeModal('paymentFollowupModal');
  loadPendingPayments();
}

function openAddPendingPaymentModal() {
  document.body.insertAdjacentHTML('beforeend', `
    <div class="modal-overlay open" id="addPendingPaymentModal">
      <div class="modal">
        <div class="modal-title">➕ Add Pending Payment</div>
        <div class="form-grid cols-2">
          <div class="field" style="grid-column:1/-1"><label>Client *</label>
            <input id="app-client" list="appClientList" placeholder="Type or select client...">
            <datalist id="appClientList"></datalist>
          </div>
          <div class="field" style="grid-column:1/-1"><label>Project Name</label><input id="app-project" placeholder="e.g. Vastu Consultation"></div>
          <div class="field"><label>Total Amount (₹) *</label><input type="number" id="app-total" placeholder="0"></div>
          <div class="field"><label>Already Received (₹)</label><input type="number" id="app-received" placeholder="0"></div>
        </div>
        <div class="modal-actions">
          <button class="btn btn-outline" onclick="closeModal('addPendingPaymentModal')">Cancel</button>
          <button class="btn btn-gold" onclick="saveAddPendingPayment()">💾 Save</button>
        </div>
      </div>
    </div>
  `);

  sbClient.from('clients').select('id, name').order('name').then(({ data }) => {
    window._appAllClients = data || [];
    const dl = document.getElementById('appClientList');
    if (dl) dl.innerHTML = (data||[]).map(c => `<option value="${esc(c.name)}">`).join('');
  });
}

async function saveAddPendingPayment() {
  const clientName = document.getElementById('app-client').value.trim();
  const projectName = document.getElementById('app-project').value.trim() || 'Payment Tracking';
  const total = parseFloat(document.getElementById('app-total').value) || 0;
  const received = parseFloat(document.getElementById('app-received').value) || 0;

  if (!clientName || total <= 0) { showToast('⚠️ Client aur Total Amount required', 'warn'); return; }

  let clientId = (window._appAllClients || []).find(c => c.name.toLowerCase() === clientName.toLowerCase())?.id;

  if (!clientId) {
    const { data: newClient } = await sbClient.from('clients').insert({ name: clientName, status: 'Active' }).select().single();
    if (newClient) clientId = newClient.id;
  }

  if (!clientId) { showToast('❌ Client create nahi ho saka', 'err'); return; }

  const { error } = await sbClient.from('projects').insert({
    client_id: clientId,
    title: projectName,
    total_amount: total,
    paid_amount: 0,
    status: 'In Progress',
  });

  if (error) { showToast('❌ ' + error.message, 'err'); return; }

  if (received > 0) {
    await sbClient.from('payments').insert({
      client_id: clientId,
      amount: received,
      date: new Date().toISOString().split('T')[0],
      mode: 'Other',
      note: 'Initial amount recorded',
    });
  }
showToast('✅ Pending payment entry created!', 'ok');
  closeModal('addPendingPaymentModal');
  loadPendingPayments();
}

function openEditPendingPaymentModal(projectId, projectTitle, currentTotal) {
  document.body.insertAdjacentHTML('beforeend', `
    <div class="modal-overlay open" id="editPendingPaymentModal">
      <div class="modal">
        <div class="modal-title">✏️ Edit Pending Payment</div>
        <div class="form-grid cols-2">
          <div class="field" style="grid-column:1/-1"><label>Project Name</label><input id="epp-project" value="${esc(projectTitle)}"></div>
          <div class="field"><label>Total Amount (₹)</label><input type="number" id="epp-total" value="${currentTotal}"></div>
        </div>
        <div class="modal-actions">
          <button class="btn btn-red" onclick="deletePendingPaymentProject('${projectId}')">🗑️ Delete</button>
          <button class="btn btn-outline" onclick="closeModal('editPendingPaymentModal')">Cancel</button>
          <button class="btn btn-gold" onclick="saveEditPendingPayment('${projectId}')">💾 Update</button>
        </div>
      </div>
    </div>
  `);
}

async function saveEditPendingPayment(projectId) {
  const title = document.getElementById('epp-project').value.trim();
  const total = parseFloat(document.getElementById('epp-total').value) || 0;
  const { error } = await sbClient.from('projects').update({ title, total_amount: total }).eq('id', projectId);
  if (error) { showToast('❌ ' + error.message, 'err'); return; }
  showToast('✅ Updated!', 'ok');
  closeModal('editPendingPaymentModal');
  loadPendingPayments();
}

async function deletePendingPaymentProject(projectId) {
  if (!confirm('Delete this pending payment entry? (Payment history will remain)')) return;
  const { error } = await sbClient.from('projects').delete().eq('id', projectId);
  if (error) { showToast('❌ ' + error.message, 'err'); return; }
  showToast('✅ Deleted!', 'ok');
  closeModal('editPendingPaymentModal');
  loadPendingPayments();
}

async function openPaymentHistoryModal(clientId, clientName) {
  const { data: history } = await sbClient.from('payments').select('*').eq('client_id', clientId).order('date', { ascending: false });
  document.body.insertAdjacentHTML('beforeend', `
    <div class="modal-overlay open" id="paymentHistoryModal">
      <div class="modal">
        <div class="modal-title">👁️ Payment History — ${esc(clientName)}</div>
        <div id="paymentHistoryList">
          ${!history?.length ? '<div style="text-align:center;color:var(--muted);padding:20px">No payments recorded yet</div>' :
            history.map(p => `
              <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:1px solid #f5f6fa">
                <div>
                  <div style="font-weight:700;color:var(--green)">₹${(p.amount||0).toLocaleString()}</div>
                  <div style="font-size:11px;color:var(--muted)">${fmtDate(p.date)} · ${esc(p.note||p.mode||'')}</div>
                </div>
                <button class="btn btn-sm" onclick="deletePaymentHistoryEntry('${p.id}','${clientId}','${esc(clientName).replace(/'/g,"\\'")}')" style="background:#fdf0ee;color:var(--red);border-color:var(--red-bg)">🗑️</button>
              </div>
            `).join('')}
        </div>
        <div class="modal-actions">
          <button class="btn btn-outline" onclick="closeModal('paymentHistoryModal')">Close</button>
        </div>
      </div>
    </div>
  `);
}

async function deletePaymentHistoryEntry(paymentId, clientId, clientName) {
  if (!confirm('Delete this payment record?')) return;
  const { error } = await sbClient.from('payments').delete().eq('id', paymentId);
  if (error) { showToast('❌ ' + error.message, 'err'); return; }
  showToast('✅ Payment deleted!', 'ok');
  closeModal('paymentHistoryModal');
  openPaymentHistoryModal(clientId, clientName);
  loadPendingPayments();
}

let _atResolvedClientId = null;
let _atResolvedClientName = null;

async function loadProjectsForClientAssignByName(clientName) {
  const sel = document.getElementById('at-project');
  const subSel = document.getElementById('at-subproject');
  if (!clientName || !clientName.trim()) {
    _atResolvedClientId = null; _atResolvedClientName = null;
    if (sel) sel.innerHTML = '<option value="">Select Project</option>';
    if (subSel) subSel.innerHTML = '<option value="">Select Sub Project</option>';
    return;
  }

  const trimmedName = clientName.trim();
  const existing = (window._atAllClients || []).find(c => c.name.toLowerCase() === trimmedName.toLowerCase());

  if (existing) {
    _atResolvedClientId = existing.id;
    _atResolvedClientName = existing.name;
    await loadProjectsForClientAssign(existing.id);
  } else {
    // Not found — will be created as a new client on save
    _atResolvedClientId = null;
    _atResolvedClientName = trimmedName;
    if (sel) sel.innerHTML = '<option value="">New client — no existing projects</option>';
    if (subSel) subSel.innerHTML = '<option value="">Select Sub Project</option>';
  }
}

async function loadProjectsForClientAssign(clientId) {
  const sel = document.getElementById('at-project');
  const subSel = document.getElementById('at-subproject');
  if (!sel) return;
  if (!clientId) { sel.innerHTML = '<option value="">Select Project</option>'; if (subSel) subSel.innerHTML = '<option value="">Select Sub Project</option>'; return; }

  const { data } = await sbClient.from('project_records').select('project_name, sub_project_name').eq('client_id', clientId);
  window._atClientRecords = data || [];
  const projectNames = [...new Set(window._atClientRecords.map(r => r.project_name).filter(Boolean))];

  if (!projectNames.length) { sel.innerHTML = '<option value="">No projects found</option>'; if (subSel) subSel.innerHTML = '<option value="">Select Sub Project</option>'; return; }
  sel.innerHTML = '<option value="">Select Project</option>' + projectNames.map(name => `<option value="${esc(name)}">${esc(name)}</option>`).join('');
  if (subSel) subSel.innerHTML = '<option value="">Select Sub Project</option>';
}

function loadSubProjectsForProjectAssign(projectName) {
  const subSel = document.getElementById('at-subproject');
  if (!subSel) return;
  if (!projectName) { subSel.innerHTML = '<option value="">Select Sub Project</option>'; return; }

  const subNames = [...new Set((window._atClientRecords || [])
    .filter(r => r.project_name === projectName)
    .map(r => r.sub_project_name)
    .filter(Boolean))];

  if (!subNames.length) { subSel.innerHTML = '<option value="">No sub projects</option>'; return; }
  subSel.innerHTML = '<option value="">Select Sub Project</option>' + subNames.map(name => `<option value="${esc(name)}">${esc(name)}</option>`).join('');
}

let _avgResolvedClientId = null;
let _avgResolvedClientName = null;

async function loadProjectsForClientByName(clientName) {
  if (!clientName || !clientName.trim()) {
    _avgResolvedClientId = null; _avgResolvedClientName = null;
    document.getElementById('avgProjectList').innerHTML = '';
    document.getElementById('avgSubProjectList').innerHTML = '';
    return;
  }
  const trimmedName = clientName.trim();
  const existing = (window._avgAllClients || []).find(c => c.name.toLowerCase() === trimmedName.toLowerCase());

  if (existing) {
    _avgResolvedClientId = existing.id;
    _avgResolvedClientName = existing.name;
    await loadProjectsForClient(existing.id);
  } else {
    // New client — no existing projects, datalists stay empty (user can type new project)
    _avgResolvedClientId = null;
    _avgResolvedClientName = trimmedName;
    document.getElementById('avgProjectList').innerHTML = '';
    document.getElementById('avgSubProjectList').innerHTML = '';
    window._avgClientRecords = [];
  }
}

async function loadProjectsForClient(clientId) {
  const dl = document.getElementById('avgProjectList');
  const subDl = document.getElementById('avgSubProjectList');
  if (!dl) return;
  if (!clientId) { dl.innerHTML = ''; if (subDl) subDl.innerHTML = ''; return; }

  const { data } = await sbClient.from('project_records').select('project_name, sub_project_name').eq('client_id', clientId);
  window._avgClientRecords = data || [];
  const projectNames = [...new Set(window._avgClientRecords.map(r => r.project_name).filter(Boolean))];

  dl.innerHTML = projectNames.map(name => `<option value="${esc(name)}">`).join('');
  if (subDl) subDl.innerHTML = [...new Set(window._avgClientRecords.map(r => r.sub_project_name).filter(Boolean))].map(name => `<option value="${esc(name)}">`).join('');
}
function loadSubProjectsForProject(projectName) {
  const subSel = document.getElementById('avg-subproject');
  if (!subSel) return;
  if (!projectName) { subSel.innerHTML = '<option value="">Select Sub Project</option>'; return; }

  const subNames = [...new Set((window._avgClientRecords || [])
    .filter(r => r.project_name === projectName)
    .map(r => r.sub_project_name)
    .filter(Boolean))];

  if (!subNames.length) { subSel.innerHTML = '<option value="">No sub projects</option>'; return; }
  subSel.innerHTML = '<option value="">Select Sub Project</option>' + subNames.map(name => `<option value="${esc(name)}">${esc(name)}</option>`).join('');
}
async function saveVisitGlobal() {
  const clientInput = document.getElementById('avg-client');
  let clientId = _avgResolvedClientId;
  let clientName = _avgResolvedClientName || clientInput.value.trim();

  if (!clientName) { showToast('⚠️ Client required', 'warn'); return; }

  // If client name typed but doesn't exist, create it
  if (!clientId) {
    const { data: newClient, error: newClientErr } = await sbClient.from('clients').insert({
      name: clientName,
      status: 'Active',
    }).select().single();
    if (!newClientErr && newClient) {
      clientId = newClient.id;
      window._avgAllClients = window._avgAllClients || [];
      window._avgAllClients.push(newClient);
      showToast('✅ New client "' + clientName + '" created!', 'ok');
    } else {
      showToast('❌ Client create nahi ho saka', 'err');
      return;
    }
  }
const projectName = document.getElementById('avg-project').value;
  const subName = document.getElementById('avg-subproject').value;
  const assignedToName = document.getElementById('avg-assigned').value.trim();
const visitedBy = (window._avgSelectedVisitors || []).join(', ');
  if (!visitedBy) { showToast('⚠️ Kam se kam ek visitor select karo', 'warn'); return; }
  const visitType = document.getElementById('avg-type').value;
  const discussion = document.getElementById('avg-discussion').value.trim();
  const location = document.getElementById('avg-location').value.trim();
  const visitDate = document.getElementById('avg-date').value || null;
  const suggestions = document.getElementById('avg-suggestions').value.trim();

  // Handle file upload / OneDrive link
  let attachmentUrl = document.getElementById('avg-onedrive-link').value.trim() || null;
  const avgFile = document.getElementById('avgFile').files[0];
  if (avgFile) {
    const path = `site-visits/${Date.now()}_${avgFile.name.replace(/[^a-z0-9.]/gi,'_')}`;
    const { error: uploadErr } = await sbClient.storage.from('client-documents').upload(path, avgFile);
    if (uploadErr) {
      showToast('❌ File upload failed: ' + uploadErr.message, 'err');
    } else {
      const { data: urlData } = sbClient.storage.from('client-documents').getPublicUrl(path);
      attachmentUrl = urlData.publicUrl;
    }
  }

const voiceNoteUrls = await uploadVoiceNotes('avg');

  const { error } = await sbClient.from('site_visits').insert({
    client_id: clientId,
    visit_date: visitDate,
    layout_received_date: document.getElementById('avg-layout-date').value || null,
    visited_by: visitedBy,
    assigned_to: assignedToName,
    location: location,
    discussion: discussion,
    suggestions: suggestions,
    remarks: document.getElementById('avg-remarks').value.trim(),
    voice_notes: voiceNoteUrls,
  });
  if (error) { showToast('❌ ' + error.message, 'err'); return; }

  // Detect client type to build the right tracker_records payload
  const isMaxHealthcare = clientName === 'MAX Healthcare';
  const isSignatureGlobal = clientName === 'Signature Global';

let trackerPayload = {
    client_id: clientId,
    project_name: projectName || 'Site Visit',
    sub_project_name: subName || null,
    tracker_status: 'Pending',
    hyperlink: attachmentUrl,
    assigned_to_name: assignedToName || null,
  };
  if (isMaxHealthcare) {
    trackerPayload.coordinator = visitedBy;
    trackerPayload.site_visit_date = visitDate;
    trackerPayload.recommendation = discussion || 'Site visit report pending';
    trackerPayload.record_type = visitType;
    trackerPayload.location_links = location ? [location] : [];
    trackerPayload.vastu_reports = [];
  } else if (isSignatureGlobal) {
    trackerPayload.site_visit_date = visitDate;
    trackerPayload.sg_team_visitor = visitedBy;
    trackerPayload.sayash_observation = discussion || 'Site visit report pending';
    trackerPayload.document_received = visitType;
    trackerPayload.site_plan_link = location || null;
  } else {
    trackerPayload.received_from = visitedBy;
    trackerPayload.recommendation = discussion || 'Site visit report pending';
    trackerPayload.site_visit_date = visitDate;
    trackerPayload.record_type = visitType === 'Site Visit' ? 'Site Visit' : visitType === 'Meeting' ? 'Meeting' : visitType === 'Mail' ? 'Mail Consultation' : 'Other';
    trackerPayload.location_link = location || null;
    trackerPayload.comments = suggestions || null;
  }

  let linkedRecordId = null;
  const { data: trackerRecord, error: trackerErr } = await sbClient.from('project_records').insert(trackerPayload).select().single();
  if (trackerErr) {
    showToast('⚠️ Tracker record nahi bana: ' + trackerErr.message, 'warn');
  } else if (trackerRecord) {
    linkedRecordId = trackerRecord.id;
  }

  // Create a task for the assigned person
  if (assignedToName) {
    const { data: empMatch } = await sb.from('employees').select('email,name').ilike('name', assignedToName).maybeSingle();
    const assignedEmail = empMatch?.email || null;
    const assignedName = empMatch?.name || assignedToName;

    if (assignedEmail) {
await sb.from('tasks').insert({
        project: clientName,
        task_detail: `Site visit report pending — ${clientName}${projectName ? ' / ' + projectName : ''}${subName ? ' / ' + subName : ''}. ${discussion || ''}`.trim(),
        voice_notes: voiceNoteUrls,
      assigned_to_email: assignedEmail.toLowerCase(),
        assigned_to_name: assignedName,
        assigned_by_email: currentUser.email,
        assigned_by_name: currentUser.name,
        start_date: new Date().toISOString().split('T')[0],
        end_date: new Date().toISOString().split('T')[0],
        work_status: 'Not Started',
        ceo_approval: 'Pending',
        linked_record_id: linkedRecordId,
        linked_client_id: clientId,
        file_url: attachmentUrl,
        file_name: avgFile ? avgFile.name : (attachmentUrl ? 'OneDrive Link' : null),
      });
      await createNotification(assignedEmail.toLowerCase(), `📋 New task — Site visit report pending`, `${clientName}${projectName ? ' / ' + projectName : ''} — report banani hai.`, 'task', 'tasks');
      await sendEmail(assignedEmail, assignedName, '📋 New Task — Site Visit Report Pending',
        `You have been assigned a task.\n\nClient: ${clientName}\nProject: ${projectName || '-'}\nDetails: ${discussion || '-'}\n\nPlease login to view and complete.`,
        'Task Assigned', 'https://sayash-vastu-portal.vercel.app', 'View My Tasks →');
    } else {
      showToast('⚠️ Task create nahi hua — employee email nahi mila "' + assignedToName + '" ke liye', 'warn');
    }
  }

  showToast('✅ Site visit saved' + (assignedToName ? ' & task assigned!' : '!'), 'ok');
  closeModal('addVisitGlobalModal');
  loadClientVisitsAll();
}
// ═══════════════════════════════════════════
//  HOME
// ═══════════════════════════════════════════
async function loadHome() {
const isCEO = currentUser.role === 'ceo';
  if (isCEO) {
    document.getElementById('empDashboard').style.display = 'none';
    document.getElementById('ceoDashboard').style.display = 'block';
    await loadCeoDashboard();
  } else {
    document.getElementById('empDashboard').style.display = 'block';
    document.getElementById('ceoDashboard').style.display = 'none';
    await loadEmpDashboard();
  }

  loadBirthdaySection();
}

async function loadEmpDashboard() {
  // Clear CEO stats — employee dashboard nahi dikhne chahiye
  document.getElementById('ceoDashStats').innerHTML = '';

  // Quote of the Day
const quoteEl = document.getElementById('dailyQuoteText');
  if (quoteEl) {
    const q = getTodaysQuote();
    quoteEl.innerHTML = `"${esc(q.text)}"<div style="font-size:12px;color:var(--gold);font-style:normal;font-weight:600;margin-top:8px;font-family:'DM Sans',sans-serif;letter-spacing:0.3px">— ${esc(q.author)}</div>`;
  }
  // Greeting
  const h = new Date().getHours();
  const greet = h < 12 ? 'Good Morning' : h < 17 ? 'Good Afternoon' : 'Good Evening';
  document.getElementById('empGreeting').textContent = greet + ', ' + currentUser.name + '! 👋';

  // Date
  const now = new Date();
  const days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  document.getElementById('empDateSub').textContent = days[now.getDay()] + ', ' + now.getDate() + ' ' + months[now.getMonth()] + ' ' + now.getFullYear();

  // Clock
  updateEmpClock();

  // Profile Card
  document.getElementById('empProfileName').textContent = currentUser.name;
  document.getElementById('empProfileDesig').textContent = currentUser.designation || currentUser.role.toUpperCase();
  document.getElementById('empProfileCode').textContent = 'Employee ID: ' + (currentUser.employee_code || '—');

  // Avatar - always fetch fresh from DB
  const { data: freshEmp } = await sb.from('employees').select('photo_url').eq('email', currentUser.email).single();
  const photoUrl = (freshEmp && freshEmp.photo_url) ? freshEmp.photo_url : currentUser.photo_url;
  if (freshEmp && freshEmp.photo_url && freshEmp.photo_url !== currentUser.photo_url) {
    currentUser.photo_url = freshEmp.photo_url;
    localStorage.setItem('sv_user', JSON.stringify(currentUser));
  }
  const avEl = document.getElementById('empPhotoAv');
  if (photoUrl) {
    avEl.innerHTML = `<img src="${photoUrl}?t=${Date.now()}" style="width:64px;height:64px;object-fit:cover;border-radius:50%"/>`;
    avEl.style.background = 'transparent';
    avEl.style.padding = '0';
    // Also update sidebar
    const sidebarAvEl3 = document.getElementById('sidebarAv');
    if (sidebarAvEl3) {
      sidebarAvEl3.innerHTML = `<img src="${photoUrl}?t=${Date.now()}" style="width:36px;height:36px;object-fit:cover;border-radius:50%"/>`;
      sidebarAvEl3.style.background = 'transparent';
    }
  } else {
    avEl.textContent = currentUser.name.substring(0,2).toUpperCase();
    avEl.style.background = 'linear-gradient(135deg,var(--gold),var(--gold2))';
  }

  // Today attendance - Login/Logout buttons
  const today = new Date().toISOString().split('T')[0];
  const { data: todayAtt } = await sb.from('attendance').select('*').eq('employee_email', currentUser.email).eq('date', today).eq('is_archived',false).maybeSingle();

  const loginBtn = document.getElementById('empLoginBtn');
  const logoutBtn = document.getElementById('empLogoutBtn');
  const loginDone = document.getElementById('empLoginDone');
  const loginStatus = document.getElementById('empLoginStatus');

  if (!todayAtt) {
    loginBtn.style.display = 'block';
    logoutBtn.style.display = 'none';
    loginDone.style.display = 'none';
    const lwrap = document.getElementById('loginTypeWrap');
    if (lwrap) lwrap.style.display = 'none';
    loginStatus.textContent = 'Not logged in today';
    loginStatus.style.color = 'var(--muted)';
    document.getElementById('empHrsWorked').textContent = '0.0h';
  } else if (todayAtt.check_in && !todayAtt.check_out) {
    loginBtn.style.display = 'none';
    logoutBtn.style.display = 'block';
    loginDone.style.display = 'none';
    const lwrap2 = document.getElementById('loginTypeWrap');
    if (lwrap2) lwrap2.style.display = 'none';
    const inTime = new Date(todayAtt.check_in).toLocaleTimeString('en-IN', {hour:'2-digit', minute:'2-digit'});
    const wfhBadge = todayAtt.work_type === 'WFH' ? ' 🏠 WFH' : ' 🏢 Office';
    loginStatus.textContent = 'Logged in at ' + inTime + wfhBadge;
    loginStatus.style.color = 'var(--green)';
    // Calculate hours so far
    const hrs = ((new Date() - new Date(todayAtt.check_in)) / 3600000).toFixed(1);
    document.getElementById('empHrsWorked').textContent = parseFloat(hrs).toFixed(1) + 'h';
  } else if (todayAtt.check_in && todayAtt.check_out) {
    loginBtn.style.display = 'none';
    logoutBtn.style.display = 'none';
    loginDone.style.display = 'block';
    const inTime = new Date(todayAtt.check_in).toLocaleTimeString('en-IN', {hour:'2-digit', minute:'2-digit'});
    const outTime = new Date(todayAtt.check_out).toLocaleTimeString('en-IN', {hour:'2-digit', minute:'2-digit'});
    loginStatus.textContent = 'In: ' + inTime + ' | Out: ' + outTime;
    loginStatus.style.color = 'var(--green)';
    document.getElementById('empHrsWorked').textContent = parseFloat(todayAtt.working_hours || 0).toFixed(1) + 'h';
  }

  // Open tasks count
  const { data: myTasks } = await sb.from('tasks').select('id').eq('assigned_to_email', currentUser.email).eq('is_archived',false).neq('work_status', 'Completed').neq('work_status', 'Report Ready');
  document.getElementById('empOpenTasks').textContent = (myTasks || []).length;

  // All tasks for stats
  const { data: allMyTasks } = await sb.from('tasks').select('*').eq('assigned_to_email', currentUser.email).eq('is_archived',false);
  const totalT = (allMyTasks||[]).length;
  const pendingT = (allMyTasks||[]).filter(t=>t.work_status==='Not Started').length;
  const inProgT = (allMyTasks||[]).filter(t=>t.work_status==='In Progress'||t.work_status==='Sent to Senior'||t.work_status==='Sent for Review').length;
  const doneT = (allMyTasks||[]).filter(t=>t.work_status==='Completed'||t.work_status==='Report Ready').length;
  document.getElementById('empTotalTasks').textContent = totalT;
  document.getElementById('empPendingTasks').textContent = pendingT;
  document.getElementById('empInProgressTasks').textContent = inProgT;
  document.getElementById('empCompletedTasks').textContent = doneT;

  // Recent tasks table (active only, limit 5)
  const tasks = (allMyTasks||[]).filter(t=>t.work_status!=='Completed'&&t.work_status!=='Report Ready').slice(0,5);
  const tbody = document.getElementById('empTaskTable');
  if (!tasks.length) {
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:var(--muted);padding:20px">🎉 All tasks completed!</td></tr>';
  } else {
    const todayD = new Date(); todayD.setHours(0,0,0,0);
    tbody.innerHTML = tasks.map((t, i) => {
      const ed4 = t.end_date ? new Date(t.end_date) : null;
      const isLate = ed4 && todayD > ed4 && t.work_status !== 'Completed';
      return `<tr style="${isLate ? 'background:#fdf0ee' : ''}">
        <td style="font-size:11px;color:var(--muted)">${i+1}</td>
        <td><span style="background:#e8ecf5;color:var(--navy);padding:2px 7px;border-radius:4px;font-size:11px;font-weight:700">${esc(t.project)}</span></td>
        <td style="font-size:12px;max-width:160px">${esc(t.task_detail.substring(0,40))}${t.task_detail.length>40?'...':''}</td>
        <td>${statusBadge(t.work_status)}</td>
        <td style="font-size:11px;color:${isLate?'var(--red)':'var(--muted)'};font-weight:${isLate?'700':'400'}">${fmtDate(t.end_date)}${isLate?' ⚠️':''}</td>
      </tr>`;
    }).join('');
  }

  // Help Request Notifications
  const { data: pendingHelp } = await sb.from('help_requests').select('*')
    .eq('to_email', currentUser.email).eq('is_resolved', false).limit(3);
  const helpPanel = document.getElementById('helpNotifPanel');
  const helpList = document.getElementById('helpNotifList');
  if (helpPanel && helpList) {
    if (pendingHelp && pendingHelp.length > 0) {
      helpPanel.style.display = 'block';
      helpList.innerHTML = pendingHelp.map(h => `
        <div style="display:flex;align-items:flex-start;gap:10px;padding:8px 0;border-bottom:1px solid #f5f6fa">
          <span style="font-size:18px">📌</span>
          <div style="flex:1">
            <div style="font-size:12px;font-weight:600;color:var(--navy)">${esc(h.from_name)} needs help${h.project_name?' on '+esc(h.project_name):''}</div>
            <div style="font-size:11px;color:var(--muted);margin-top:2px">${esc((h.message||'').substring(0,60))}...</div>
          </div>
          <button class="btn btn-green btn-sm" onclick="resolveHelp('${h.id}');loadEmpDashboard()">✅</button>
        </div>
      `).join('');
    } else {
      helpPanel.style.display = 'none';
    }
  }

  // WFH Today
  const { data: wfhToday } = await sb.from('attendance').select('*').eq('date', today).eq('is_archived',false).eq('work_type','WFH');
  const wfhEl = document.getElementById('empWFHToday');
  if (!wfhToday || !wfhToday.length) {
    wfhEl.innerHTML = '<div style="text-align:center;color:var(--muted);font-size:13px;padding:16px">No one working from home today</div>';
  } else {
    wfhEl.innerHTML = wfhToday.map(a => `
      <div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid #f5f6fa">
        <div class="av" style="background:var(--blue);width:28px;height:28px;font-size:10px">${esc(a.employee_name).substring(0,2).toUpperCase()}</div>
        <div>
          <div style="font-size:12px;font-weight:600;color:var(--navy)">${esc(a.employee_name)}</div>
          <div style="font-size:11px;color:var(--muted)">Working from home</div>
        </div>
        <span class="badge b-blue" style="margin-left:auto;font-size:10px">WFH</span>
      </div>
    `).join('');
  }

  // On Leave Today
  const { data: leaveToday } = await sb.from('leaves').select('*').eq('status', 'Approved').lte('from_date', today).gte('to_date', today);
  const leaveTodayEl = document.getElementById('empLeaveToday');
  if (!leaveToday || !leaveToday.length) {
    leaveTodayEl.innerHTML = '<div style="text-align:center;color:var(--muted);font-size:13px;padding:16px">No one on leave today</div>';
  } else {
    leaveTodayEl.innerHTML = leaveToday.map(l => `
      <div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid #f5f6fa">
        <div class="av" style="background:var(--navy);width:28px;height:28px;font-size:10px">${esc(l.employee_name).substring(0,2).toUpperCase()}</div>
        <div>
          <div style="font-size:12px;font-weight:600;color:var(--navy)">${esc(l.employee_name)}</div>
<div style="font-size:11px;color:var(--muted)">On Leave</div>
        </div>
        <span class="badge b-blue" style="margin-left:auto;font-size:10px">On Leave</span>
      </div>
    `).join('');
  }

  // Work Anniversary & Joinings
  const mm = String(new Date().getMonth()+1).padStart(2,'0');
  const dd = String(new Date().getDate()).padStart(2,'0');
  const { data: emps } = await sb.from('employees').select('name,designation,joining_date,employee_code').eq('is_active', true);
  const anniversaries = (emps || []).filter(e => {
    if (!e.joining_date) return false;
    const jd = new Date(e.joining_date);
    return String(jd.getMonth()+1).padStart(2,'0') === mm && String(jd.getDate()).padStart(2,'0') === dd;
  });
  const annEl = document.getElementById('empAnniversary');
  if (!anniversaries.length) {
    annEl.innerHTML = '<div style="text-align:center;color:var(--muted);font-size:13px;padding:16px">No work anniversaries today</div>';
  } else {
    annEl.innerHTML = anniversaries.map(e => {
      const years = new Date().getFullYear() - new Date(e.joining_date).getFullYear();
      return `<div style="display:flex;align-items:flex-start;gap:10px;padding:8px 0;border-bottom:1px solid #f5f6fa">
        <span style="font-size:20px">🎊</span>
        <div>
          <div style="font-size:12px;font-weight:600;color:var(--navy)">${esc(e.name)}</div>
          ${years===0
            ? `<div style="font-size:11px;color:var(--navy);margin-top:4px;line-height:1.6">A warm welcome to the Sayash Vastu family! 🌟 We are excited to have you on board and look forward to the skills, ideas, and enthusiasm you bring to our team. Wishing you a successful career and a wonderful experience with us.<br><em>Best Regards, Team Sayash Vastu</em></div>`
            : `<div style="font-size:11px;color:var(--muted)">${years} year${years!==1?'s':''} with Sayash Vastu! 🎊</div>`
          }
        </div>
      </div>`;
    }).join('');
  }

  // Upcoming Birthdays (this month)
  const { data: allEmps } = await sb.from('employees').select('name,designation,date_of_birth').eq('is_active', true);
  const upcomingBdays = (allEmps || []).filter(e => {
    if (!e.date_of_birth) return false;
    const dob = new Date(e.date_of_birth);
    return String(dob.getMonth()+1).padStart(2,'0') === mm;
  }).sort((a,b) => new Date(a.date_of_birth).getDate() - new Date(b.date_of_birth).getDate());

  const bdayEl = document.getElementById('empBirthdays');
  if (!upcomingBdays.length) {
    bdayEl.innerHTML = '<div style="text-align:center;color:var(--muted);font-size:13px;padding:16px">No birthdays this month</div>';
  } else {
    bdayEl.innerHTML = upcomingBdays.map(e => {
      const dob = new Date(e.date_of_birth);
      const isToday = String(dob.getDate()).padStart(2,'0') === dd;
      const months2 = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
      return `<div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid #f5f6fa">
        <div class="av" style="background:${isToday?'var(--gold)':'var(--navy)'};width:32px;height:32px;font-size:11px;color:${isToday?'var(--navy)':'#fff'}">${esc(e.name).substring(0,2).toUpperCase()}</div>
        <div style="flex:1">
          <div style="font-size:12px;font-weight:600;color:var(--navy)">${esc(e.name)}</div>
          <div style="font-size:11px;color:var(--muted)">${esc(e.designation||'')}</div>
        </div>
        <div style="font-size:11px;font-weight:600;color:${isToday?'var(--gold)':'var(--muted)'}">
          ${isToday ? '🎂 Today!' : dob.getDate() + ' ' + months2[dob.getMonth()]}
        </div>
      </div>`;
    }).join('');
  }

  // HR Policy pending acknowledgements
  const { data: pendingPolicies } = await sb.from('hr_policies').select('*').eq('is_active', true);
  const { data: myAcks } = await sb.from('policy_acknowledgements').select('policy_id').eq('employee_email', currentUser.email);
  const myAckIds = (myAcks||[]).map(a=>a.policy_id);
  const unackedPolicies = (pendingPolicies||[]).filter(p=>p.mandatory_acknowledge && !myAckIds.includes(p.id));
  if (unackedPolicies.length > 0) {
    const notifCount = document.getElementById('notifCount');
    if (notifCount) { notifCount.textContent = unackedPolicies.length; notifCount.classList.add('show'); }
  }

  // Notices
  const { data: notices } = await sb.from('notices').select('*').eq('is_active', true).order('created_at', {ascending: false}).limit(4);
  const noticesEl = document.getElementById('homeNotices');
  if (!notices || !notices.length) {
    noticesEl.innerHTML = '<p style="color:var(--muted);font-size:13px;text-align:center;padding:20px">No notices yet</p>';
  } else {
    noticesEl.innerHTML = notices.map(n => `
      <div style="padding:10px 0;border-bottom:1px solid var(--border)">
        <div style="display:flex;align-items:center;gap:6px">
          <span class="badge ${n.priority==='Urgent'?'b-red':n.priority==='High'?'b-gold':'b-blue'}" style="font-size:10px">${n.priority}</span>
          <span style="font-size:12px;font-weight:600;color:var(--navy)">${esc(n.title)}</span>
        </div>
        <div style="font-size:11px;color:var(--muted);margin-top:3px">${esc(n.content.substring(0,70))}...</div>
        <div style="font-size:10px;color:var(--muted);margin-top:3px">${new Date(n.created_at).toLocaleDateString('en-IN')}</div>
      </div>
    `).join('');
  }

// Payment Follow-ups Due (Ritika/Alisha/CEO only)
  const showPayFollowWidget = currentUser.role === 'ceo' || ['alisha@sayashvastu.com', 'ritika@sayashvastu.com'].includes(currentUser.email);
  const payFollowPanelEl = document.getElementById('empPayFollowupsPanel');
  if (payFollowPanelEl) payFollowPanelEl.style.display = showPayFollowWidget ? 'block' : 'none';
  if (showPayFollowWidget) {
  const { data: pendingFollowupsEmp } = await sbClient.from('followups').select('*, clients(name)').eq('done', false).eq('type', 'Payment Follow-up').order('next_followup', {ascending: true});
    const empPayFollowEl = document.getElementById('empPayFollowups');
    if (empPayFollowEl) {
const overdueFollowsEmp = (pendingFollowupsEmp||[]).filter(f => f.next_followup);
      if (!overdueFollowsEmp.length) {
        empPayFollowEl.innerHTML = '<div style="text-align:center;color:var(--muted);font-size:12px;padding:16px">No payment follow-ups due</div>';
      } else {
        empPayFollowEl.innerHTML = overdueFollowsEmp.map(f => {
const isOverdueEmp = f.next_followup < today;
          const isTodayEmp = f.next_followup === today;
          const dueLabel = isOverdueEmp ? '⚠️ Overdue' : isTodayEmp ? '📅 Due today' : '📅 Upcoming';
          return `<div style="display:flex;align-items:center;justify-content:space-between;padding:8px 0;border-bottom:1px solid #f5f6fa">
            <div>
              <div style="font-size:12px;font-weight:600;color:var(--navy)">${esc(f.clients?.name||'-')} — ₹${(f.amount_collected||0)>0?'':''}call for payment follow-up</div>
              <div style="font-size:11px;color:${isOverdueEmp?'var(--red)':'var(--muted)'};font-weight:${isOverdueEmp?'700':'400'}">${fmtDate(f.next_followup)} · ${dueLabel}</div>
            </div>
            <button class="btn btn-outline btn-sm" onclick="showView('pendingPayments')">View →</button>
          </div>`;
        }).join('');
      }
    }
  }

  // Today's attendance log
  loadTodayAttendanceWidget();
   // Team Today - all members attendance
  const { data: teamToday } = await sb.from('attendance')
    .select('*')
    .eq('date', today)
    .eq('is_archived', false)
    .order('check_in', {ascending: true});

  // Fetch employee photos
  const { data: empPhotos } = await sb.from('employees').select('email,photo_url').eq('is_active', true);
  const photoMap = {};
  (empPhotos||[]).forEach(e => { if(e.photo_url) photoMap[e.email] = e.photo_url; });

  const empTeamEl = document.getElementById('empTeamToday');
  if (empTeamEl) {
    if (!teamToday || !teamToday.length) {
      empTeamEl.innerHTML = '<div style="text-align:center;color:var(--muted);font-size:12px;padding:12px">No one checked in yet</div>';
    } else {
      empTeamEl.innerHTML = teamToday.map(a => {
        const isMe = a.employee_email === currentUser.email;
        const workTypeBadge = a.work_type === 'WFH'
          ? '<span class="badge b-blue" style="font-size:10px">🏠 WFH</span>'
          : a.work_type === 'On Site'
          ? '<span class="badge b-green" style="font-size:10px">📍 On Site</span>'
          : '<span class="badge b-navy" style="font-size:10px">🏢 Office</span>';
        const statusColor = a.check_out ? 'var(--muted)' : 'var(--green)';
        const statusText = a.check_out
          ? 'Checked out ' + new Date(a.check_out).toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'})
          : 'In since ' + new Date(a.check_in).toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'});
        const initials = esc(a.employee_name).substring(0,2).toUpperCase();
        const avBg = isMe ? 'var(--gold)' : 'var(--navy)';
        const avColor = isMe ? 'var(--navy)' : '#fff';
        const rowStyle = isMe ? 'background:#fdf9ef;border-radius:6px;' : '';
        const nameLabel = esc(a.employee_name) + (isMe ? ' (You)' : '');
        const photoUrl = photoMap[a.employee_email];
        const avHtml = (photoUrl && photoUrl !== 'null' && photoUrl !== '')
          ? `<img src="${photoUrl}?t=${Date.now()}" style="width:28px;height:28px;border-radius:50%;object-fit:cover;border:2px solid ${isMe?'var(--gold)':'var(--border)'}" onerror="this.parentNode.innerHTML='<div class=av style=background:${avBg};width:28px;height:28px;font-size:10px;color:${avColor}>${initials}</div>'">`
          : `<div class="av" style="background:${avBg};width:28px;height:28px;font-size:10px;color:${avColor}">${initials}</div>`;
return '<div onclick="openEmpQuickView(\'' + a.employee_email + '\')" style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid #f5f6fa;cursor:pointer;' + rowStyle + '" onmouseover="this.style.background=\'#f8f9fc\'" onmouseout="this.style.background=\'' + (rowStyle?'#fdf9ef':'') + '\'">'
        + avHtml
          + '<div style="flex:1">'
          + '<div style="font-size:12px;font-weight:600;color:var(--navy)">' + nameLabel + '</div>'
          + '<div style="font-size:10px;color:' + statusColor + ';margin-top:2px">' + statusText + '</div>'
          + '</div>'
          + workTypeBadge
          + '</div>';
      }).join('');
    }
  }
}

async function loadCeoDashboard() {
  const h = new Date().getHours();
  const greet = h < 12 ? 'Good Morning' : h < 17 ? 'Good Afternoon' : 'Good Evening';
  document.getElementById('homeGreeting').textContent = greet + ', ' + currentUser.name + '! 👋';
  document.getElementById('homeSubtitle').textContent = "Here's your company overview for today";

  const { count: totalEmp } = await sb.from('employees').select('*',{count:'exact'}).eq('is_active',true);
  const { count: totalTasks } = await sb.from('tasks').select('*',{count:'exact'}).eq('is_archived',false);
  const { count: pendingLeaves } = await sb.from('leaves').select('*',{count:'exact'}).eq('status','Pending');
  const { count: doneTasks } = await sb.from('tasks').select('*',{count:'exact'}).eq('is_archived',false).eq('work_status','Completed');

const todayDate = new Date().toISOString().split('T')[0];
  const { data: todayAtt } = await sb.from('attendance').select('*').eq('date', todayDate).eq('is_archived',false);
  const presentToday = (todayAtt||[]).filter(a=>a.status==='Present'||a.status==='Half Day').length;
  const { data: leaveTodayCount } = await sb.from('leaves').select('employee_email').eq('status','Approved').lte('from_date',todayDate).gte('to_date',todayDate);
  const onLeaveCount = (leaveTodayCount||[]).length;
  const isWeekendNow = [0,6].includes(new Date().getDay());
  const absentToday = isWeekendNow ? 0 : Math.max(0, (totalEmp||0) - presentToday - onLeaveCount);
  
  const { data: allTasks } = await sb.from('tasks').select('*').eq('is_archived',false);
  const today2 = new Date(); today2.setHours(0,0,0,0);
  const delayedTasks = (allTasks||[]).filter(t=>{
    const ed = t.end_date ? new Date(t.end_date) : null;
    return ed && today2 > ed && t.work_status !== 'Completed';
  });

  document.getElementById('nb-leave-approve').textContent = pendingLeaves || 0;
  if (pendingLeaves > 0) document.getElementById('nb-leave-approve').style.display = 'inline-block';

document.getElementById('ceoDashStats').innerHTML = `
    <div style="display:grid;grid-template-columns:repeat(7,1fr);gap:12px;margin-bottom:20px">
    <div style="background:var(--navy);border-radius:10px;padding:14px 12px;cursor:pointer" onclick="showView('employees')">
        <div style="font-size:16px;margin-bottom:6px">👥</div>
        <div style="font-size:22px;font-weight:800;color:#fff;line-height:1">${totalEmp||0}</div>
        <div style="font-size:9px;color:rgba(255,255,255,0.45);margin-top:4px;text-transform:uppercase;letter-spacing:0.5px;font-weight:700">Employees</div>
      </div>
      <div style="background:var(--navy);border-radius:10px;padding:14px 12px;cursor:pointer" onclick="showView('allTasks')">
        <div style="font-size:16px;margin-bottom:6px">📋</div>
        <div style="font-size:22px;font-weight:800;color:#fff;line-height:1">${totalTasks||0}</div>
        <div style="font-size:9px;color:rgba(255,255,255,0.45);margin-top:4px;text-transform:uppercase;letter-spacing:0.5px;font-weight:700">Total Tasks</div>
      </div>
      <div style="background:var(--navy);border-radius:10px;padding:14px 12px;cursor:pointer" onclick="showView('allTasks')">
        <div style="font-size:16px;margin-bottom:6px">✅</div>
        <div style="font-size:22px;font-weight:800;color:#fff;line-height:1">${doneTasks||0}</div>
        <div style="font-size:9px;color:rgba(255,255,255,0.45);margin-top:4px;text-transform:uppercase;letter-spacing:0.5px;font-weight:700">Completed</div>
      </div>
<div style="background:#fff;border-radius:10px;padding:14px 12px;border:1px solid var(--border);border-left:3px solid var(--green);cursor:pointer">
        <div style="font-size:16px;margin-bottom:6px">🟢</div>
        <div style="font-size:22px;font-weight:800;color:var(--green);line-height:1">${presentToday}</div>
        <div style="font-size:9px;color:var(--muted);margin-top:4px;text-transform:uppercase;letter-spacing:0.5px;font-weight:700">Present Today</div>
      </div>
      <div style="background:#fff;border-radius:10px;padding:14px 12px;border:1px solid var(--border);border-left:3px solid var(--red);cursor:pointer">
        <div style="font-size:16px;margin-bottom:6px">🔴</div>
        <div style="font-size:22px;font-weight:800;color:var(--red);line-height:1">${absentToday}</div>
        <div style="font-size:9px;color:var(--muted);margin-top:4px;text-transform:uppercase;letter-spacing:0.5px;font-weight:700">Absent Today</div>
      </div>
      <div style="background:#fff;border-radius:10px;padding:14px 12px;border:1px solid var(--border);border-left:3px solid var(--red);cursor:pointer" onclick="showView('allTasks')">
        <div style="font-size:16px;margin-bottom:6px">⚠️</div>
        <div style="font-size:22px;font-weight:800;color:var(--red);line-height:1">${delayedTasks.length}</div>
        <div style="font-size:9px;color:var(--muted);margin-top:4px;text-transform:uppercase;letter-spacing:0.5px;font-weight:700">Delayed</div>
      </div>
      <div style="background:#fff;border-radius:10px;padding:14px 12px;border:1px solid var(--border);border-left:3px solid var(--amber);cursor:pointer" onclick="showView('leaveApprove')">
        <div style="font-size:16px;margin-bottom:6px">⏳</div>
        <div style="font-size:22px;font-weight:800;color:var(--amber);line-height:1">${pendingLeaves||0}</div>
        <div style="font-size:9px;color:var(--muted);margin-top:4px;text-transform:uppercase;letter-spacing:0.5px;font-weight:700">Leave Pending</div>
      </div>
    </div>
  `;
  document.getElementById('homeStats').innerHTML = '';
  document.getElementById('ceoActivitySection').style.display = 'block';
  loadCeoActivityFeed();

  // CEO notices
  const { data: notices } = await sb.from('notices').select('*').eq('is_active',true).order('created_at',{ascending:false}).limit(3);
  const noticesEl = document.getElementById('homeNotices');
  if (noticesEl) {
    if (!notices||!notices.length) {
      noticesEl.innerHTML = '<p style="color:var(--muted);font-size:13px;text-align:center;padding:20px">No notices yet</p>';
    } else {
      noticesEl.innerHTML = notices.map(n=>`
        <div style="padding:10px 0;border-bottom:1px solid var(--border)">
          <div style="display:flex;align-items:center;gap:6px">
            <span class="badge ${n.priority==='Urgent'?'b-red':n.priority==='High'?'b-gold':'b-blue'}" style="font-size:10px">${n.priority}</span>
            <span style="font-size:13px;font-weight:600;color:var(--navy)">${esc(n.title)}</span>
          </div>
          <div style="font-size:11px;color:var(--muted);margin-top:3px">${esc(n.content.substring(0,70))}...</div>
        </div>
      `).join('');
    }
  }

  // On Leave Today
  const todayStr = new Date().toISOString().split('T')[0];
  const { data: leaveToday } = await sb.from('leaves').select('*').eq('status','Approved').lte('from_date',todayStr).gte('to_date',todayStr);
  const leaveTodayEl = document.getElementById('ceoLeaveToday');
  if (leaveTodayEl) {
    if (!leaveToday||!leaveToday.length) {
      leaveTodayEl.innerHTML = '<div style="text-align:center;color:var(--muted);font-size:12px;padding:12px">No one on leave</div>';
    } else {
      leaveTodayEl.innerHTML = leaveToday.map(l=>`
        <div style="display:flex;align-items:center;gap:8px;padding:7px 0;border-bottom:1px solid #f5f6fa">
          <div class="av" style="background:var(--red);width:26px;height:26px;font-size:9px">${esc(l.employee_name).substring(0,2).toUpperCase()}</div>
          <div>
            <div style="font-size:12px;font-weight:600;color:var(--navy)">${esc(l.employee_name)}</div>
            <div style="font-size:10px;color:var(--muted)">${esc(l.leave_type)}</div>
          </div>
        </div>`).join('');
    }
  }

  // WFH Today
  const { data: wfhToday } = await sb.from('attendance').select('*').eq('date',todayStr).eq('is_archived',false).eq('work_type','WFH');
  const wfhEl = document.getElementById('ceoWFHToday');
  if (wfhEl) {
    if (!wfhToday||!wfhToday.length) {
      wfhEl.innerHTML = '<div style="text-align:center;color:var(--muted);font-size:12px;padding:12px">No one on WFH</div>';
    } else {
      wfhEl.innerHTML = wfhToday.map(a=>`
        <div style="display:flex;align-items:center;gap:8px;padding:7px 0;border-bottom:1px solid #f5f6fa">
          <div class="av" style="background:var(--blue);width:26px;height:26px;font-size:9px">${esc(a.employee_name).substring(0,2).toUpperCase()}</div>
          <div>
            <div style="font-size:12px;font-weight:600;color:var(--navy)">${esc(a.employee_name)}</div>
            <div style="font-size:10px;color:var(--muted)">Working from home</div>
          </div>
        </div>`).join('');
    }
  }

  // Work Anniversary & New Joinings
  const mm = String(new Date().getMonth()+1).padStart(2,'0');
  const dd = String(new Date().getDate()).padStart(2,'0');
  const { data: allEmpsAnn } = await sb.from('employees').select('name,designation,joining_date').eq('is_active',true);
  const anniversaries = (allEmpsAnn||[]).filter(e => {
    if (!e.joining_date) return false;
    const jd = new Date(e.joining_date);
    return String(jd.getMonth()+1).padStart(2,'0')===mm && String(jd.getDate()).padStart(2,'0')===dd;
  });
  const annEl = document.getElementById('ceoAnniversary');
  if (annEl) {
    if (!anniversaries.length) {
      annEl.innerHTML = '<div style="text-align:center;color:var(--muted);font-size:12px;padding:12px">No anniversaries today</div>';
    } else {
      annEl.innerHTML = anniversaries.map(e => {
        const years = new Date().getFullYear() - new Date(e.joining_date).getFullYear();
        return `<div style="display:flex;align-items:flex-start;gap:8px;padding:10px 0;border-bottom:1px solid #f5f6fa">
<span style="font-size:18px">🎊</span>
          <div>
            <div style="font-size:12px;font-weight:600;color:var(--navy)">${esc(e.name)}</div>
            ${years===0?`
<div style="font-size:11px;font-weight:600;color:var(--gold);margin-top:2px">A warm welcome to the Sayash Vastu family!</div>
              <div style="font-size:10px;color:var(--muted);margin-top:4px;line-height:1.5">We are excited to have you on board and look forward to the skills, ideas, and enthusiasm you bring to our team. Wishing you a successful career and a wonderful experience with us.</div>
              <div style="font-size:10px;color:var(--muted);margin-top:3px;font-style:italic">Best Regards, Team Sayash Vastu</div>
            `:`<div style="font-size:10px;color:var(--muted)">${years} year${years!==1?'s':''} with Sayash Vastu! 🎊</div>`}
          </div>
        </div>`;
      }).join('');
    }
  }

  // CEO My Tasks (tasks assigned to CEO by employees) - dashboard preview
  const { data: ceoTasks } = await sb.from('tasks')
    .select('*')
    .eq('assigned_to_email', currentUser.email)
    .eq('is_archived', false)
    .neq('work_status', 'Completed')
    .order('created_at', {ascending: false})
    .limit(5);

  const ceoTasksEl = document.getElementById('ceoDashMyTasks');
  if (ceoTasksEl) {
    if (!ceoTasks || !ceoTasks.length) {
      ceoTasksEl.innerHTML = '<div style="text-align:center;color:var(--muted);font-size:12px;padding:16px">No active tasks assigned to you</div>';
    } else {
      const today2 = new Date(); today2.setHours(0,0,0,0);
      ceoTasksEl.innerHTML = ceoTasks.map(t => {
        const endD = t.end_date ? new Date(t.end_date) : null;
        const isLate = endD && today2 > endD;
        return '<div style="display:flex;align-items:center;gap:10px;padding:10px 14px;border-bottom:1px solid #f5f6fa;' + (isLate?'background:#fdf0ee':'') + '">'
          + '<div style="flex:1">'
          + '<div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap">'
          + '<span style="background:#e8ecf5;color:var(--navy);padding:1px 7px;border-radius:4px;font-size:10px;font-weight:700">' + esc(t.project) + '</span>'
          + statusBadge(t.work_status)
          + '</div>'
          + '<div style="font-size:12px;font-weight:600;color:var(--navy);margin-top:4px">' + esc(t.task_detail.substring(0,60)) + (t.task_detail.length>60?'...':'') + '</div>'
          + '<div style="font-size:11px;color:var(--muted);margin-top:2px">👤 By: ' + esc(t.assigned_by_name||'—') + ' &nbsp;|&nbsp; End: <span style="color:' + (isLate?'var(--red)':'var(--muted)') + ';font-weight:' + (isLate?'700':'400') + '">' + fmtDate(t.end_date) + (isLate?' ⚠️':'') + '</span></div>'
          + '</div>'
          + '</div>';
      }).join('')
      + (ceoTasks.length >= 5 ? '<div style="padding:10px 14px;text-align:center"><button class="btn btn-outline btn-sm" onclick="showView(&quot;ceoMyTasks&quot;)">View All →</button></div>' : '');
    }
  }
 // Payment Follow-ups Due (overdue + today)
  const { data: pendingFollowupsCeo } = await sbClient.from('followups').select('*, clients(name)').eq('done', false).eq('type', 'Payment Follow-up').order('next_followup', {ascending: true});
  const ceoPayFollowEl = document.getElementById('ceoPayFollowups');
  if (ceoPayFollowEl) {
const overdueFollows = (pendingFollowupsCeo||[]).filter(f => f.next_followup);
    if (!overdueFollows.length) {
      ceoPayFollowEl.innerHTML = '<div style="text-align:center;color:var(--muted);font-size:12px;padding:16px">No payment follow-ups due</div>';
    } else {
      ceoPayFollowEl.innerHTML = overdueFollows.map(f => {
        const isOverdue = f.next_followup < todayStr;
        return `<div style="display:flex;align-items:center;justify-content:space-between;padding:8px 0;border-bottom:1px solid #f5f6fa">
          <div>
            <div style="font-size:12px;font-weight:600;color:var(--navy)">${esc(f.clients?.name||'-')}</div>
            <div style="font-size:11px;color:${isOverdue?'var(--red)':'var(--muted)'};font-weight:${isOverdue?'700':'400'}">${fmtDate(f.next_followup)}${isOverdue?' ⚠️ Overdue':' (Today)'}</div>
          </div>
          <button class="btn btn-outline btn-sm" onclick="showView('pendingPayments')">View →</button>
        </div>`;
      }).join('');
    }
  }
    // Today's Attendance Log
  const { data: todayAttAll } = await sb.from('attendance').select('*').eq('date',todayStr).eq('is_archived',false).order('check_in',{ascending:true});
  const { data: ceoEmpPhotos } = await sb.from('employees').select('email,photo_url').eq('is_active', true);
  const ceoPhotoMap = {};
  (ceoEmpPhotos||[]).forEach(e => { if(e.photo_url) ceoPhotoMap[e.email] = e.photo_url; });
  const todayLogEl = document.getElementById('ceoTodayLog');
  if (todayLogEl) {
    if (!todayAttAll||!todayAttAll.length) {
      todayLogEl.innerHTML = '<div style="text-align:center;color:var(--muted);font-size:12px;padding:20px">No attendance marked today</div>';
    } else {
      todayLogEl.innerHTML = `<table style="width:100%;border-collapse:collapse;font-size:12px">
        <thead><tr style="background:#f8f9fc;border-bottom:1px solid var(--border)">
          <th style="padding:8px 14px;text-align:left;color:var(--muted);font-size:10px;font-weight:700;text-transform:uppercase">Employee</th>
          <th style="padding:8px 14px;text-align:left;color:var(--muted);font-size:10px;font-weight:700;text-transform:uppercase">Check In</th>
          <th style="padding:8px 14px;text-align:left;color:var(--muted);font-size:10px;font-weight:700;text-transform:uppercase">Check Out</th>
          <th style="padding:8px 14px;text-align:left;color:var(--muted);font-size:10px;font-weight:700;text-transform:uppercase">Hours</th>
          <th style="padding:8px 14px;text-align:left;color:var(--muted);font-size:10px;font-weight:700;text-transform:uppercase">Type</th>
          <th style="padding:8px 14px;text-align:left;color:var(--muted);font-size:10px;font-weight:700;text-transform:uppercase">Location</th>
          <th style="padding:8px 14px;text-align:left;color:var(--muted);font-size:10px;font-weight:700;text-transform:uppercase">Status</th>
        </tr></thead>
        <tbody>${todayAttAll.map(a=>`<tr style="border-bottom:1px solid #f5f6fa">
<td style="padding:9px 14px">
  <div style="display:flex;align-items:center;gap:8px">
    ${ceoPhotoMap[a.employee_email] 
  ? `<img src="${ceoPhotoMap[a.employee_email]}?t=${Date.now()}" style="width:28px;height:28px;border-radius:50%;object-fit:cover;border:1px solid var(--border)" onerror="this.style.display='none'">`
      : `<div class="av" style="background:var(--navy);width:28px;height:28px;font-size:10px">${esc(a.employee_name).substring(0,2).toUpperCase()}</div>`
    }
    <span style="font-weight:600;color:var(--navy)">${esc(a.employee_name)}</span>
  </div>
</td>
          <td style="padding:9px 14px">${a.check_in?new Date(a.check_in).toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'}):'—'}</td>
          <td style="padding:9px 14px">${a.check_out?new Date(a.check_out).toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'}):'—'}</td>
          <td style="padding:9px 14px;font-weight:600">${a.working_hours?parseFloat(a.working_hours).toFixed(1)+'h':'—'}</td>
<td style="padding:9px 14px">
  <div style="display:flex;align-items:center;gap:6px">
    <span class="badge ${a.work_type==='WFH'?'b-blue':a.work_type==='On Site'?'b-green':'b-navy'}" style="font-size:10px">${a.work_type||'Office'}</span>
    <select onchange="updateWorkType('${a.id}',this.value)" style="font-size:10px;padding:2px 4px;border:1px solid var(--border);border-radius:4px;cursor:pointer;font-family:'DM Sans',sans-serif;color:var(--navy)">
      <option value="">Change</option>
      <option value="Office" ${a.work_type==='Office'?'selected':''}>🏢 Office</option>
      <option value="WFH" ${a.work_type==='WFH'?'selected':''}>🏠 WFH</option>
      <option value="On Site" ${a.work_type==='On Site'?'selected':''}>📍 On Site</option>
    </select>
  </div>
</td>
          <td style="padding:9px 14px;font-size:11px;color:var(--muted)">
            ${a.latitude && a.longitude ? 
  `<a href="https://maps.google.com/?q=${a.latitude},${a.longitude}" target="_blank" style="color:var(--blue);text-decoration:none;font-size:11px">📍 View Map</a><br><span style="font-size:10px;color:var(--muted)">${a.location_address ? esc(a.location_address.substring(0,30)) : ''}</span>` 
  : (a.location_address ? `<span style="font-size:10px;color:var(--muted)">🏢 ${esc(a.location_address.substring(0,35))}</span>` : a.ip_address ? `<span style="font-size:10px;color:var(--muted)">🖥️ Office | ${esc(a.ip_address)}</span>` : '—')}
          </td>
          <td style="padding:9px 14px">${attBadge(a.status)}</td>
        </tr>`).join('')}
        </tbody></table>`;
    }
  }

  // Upcoming Birthdays for CEO
  const { data: allEmpsBday } = await sb.from('employees').select('name,designation,date_of_birth').eq('is_active',true);
  const upBdays = (allEmpsBday||[]).filter(e => {
    if (!e.date_of_birth) return false;
    const dob = new Date(e.date_of_birth);
    return String(dob.getMonth()+1).padStart(2,'0')===mm;
  }).sort((a,b)=>new Date(a.date_of_birth).getDate()-new Date(b.date_of_birth).getDate());
  const ceoBdayEl = document.getElementById('ceoBirthdays');
  if (ceoBdayEl) {
    if (!upBdays.length) {
      ceoBdayEl.innerHTML = '<div style="text-align:center;color:var(--muted);font-size:12px;padding:12px">No birthdays this month</div>';
    } else {
      const months2=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
      ceoBdayEl.innerHTML = upBdays.map(e=>{
        const dob = new Date(e.date_of_birth);
        const isToday = String(dob.getDate()).padStart(2,'0')===dd;
        return `<div style="display:flex;align-items:center;gap:8px;padding:8px 0;border-bottom:1px solid #f5f6fa">
          <div class="av" style="background:${isToday?'var(--gold)':'var(--navy)'};width:28px;height:28px;font-size:10px;color:${isToday?'var(--navy)':'#fff'}">${esc(e.name).substring(0,2).toUpperCase()}</div>
          <div style="flex:1">
            <div style="font-size:12px;font-weight:600;color:var(--navy)">${esc(e.name)}</div>
            <div style="font-size:10px;color:var(--muted)">${esc(e.designation||'')}</div>
          </div>
          <div style="font-size:11px;font-weight:600;color:${isToday?'var(--gold)':'var(--muted)'}">${isToday?'🎂 Today!':dob.getDate()+' '+months2[dob.getMonth()]}</div>
        </div>`;
      }).join('');
    }
  }

  loadTodayAttendanceWidget();
}

function updateEmpClock() {
  const el = document.getElementById('empClock');
  if (el) {
    el.textContent = new Date().toLocaleTimeString('en-IN', {hour:'2-digit', minute:'2-digit'});
  }
}

function showLoginTypeOptions() {
  const btn = document.getElementById('empLoginBtn');
  const wrap = document.getElementById('loginTypeWrap');
  if (btn) btn.style.display = 'none';
  if (wrap) wrap.style.display = 'flex';
}

async function markEmpLogin(workType) {
  const now = new Date();
  const today = now.toISOString().split('T')[0];
  const wrap = document.getElementById('loginTypeWrap');
  if (wrap) wrap.style.display = 'none';

  // Get IP Address
  let ip_address = null;
  try {
    const ipRes = await fetch('https://api.ipify.org?format=json');
    const ipData = await ipRes.json();
    ip_address = ipData.ip;
  } catch(e) {
    console.log('IP fetch failed:', e.message);
  }
  // Get location based on work type
  let latitude = null, longitude = null, location_address = null;
 if (workType === 'Office') {
    latitude = 28.6917;
    longitude = 77.1520;
    location_address = '3rd Floor, Big Jos Tower, Netaji Subhash Place, New Delhi';
  } else {
    try {
      const pos = await new Promise((resolve, reject) => 
        navigator.geolocation.getCurrentPosition(resolve, reject, {timeout: 8000}));
      latitude = pos.coords.latitude;
      longitude = pos.coords.longitude;
      location_address = `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`);
        const geo = await res.json();
        if (geo.display_name) location_address = geo.display_name.split(',').slice(0,3).join(',');
      } catch(e) {}
    } catch(e) {
      console.log('Location not available:', e.message);
    }
  }

  const { data: emp } = await sb.from('employees').select('id').eq('email', currentUser.email).single();
 const { error } = await sb.from('attendance').insert({
    employee_id: emp?.id,
    employee_email: currentUser.email,
    employee_name: currentUser.name,
    date: today,
    check_in: now.toISOString(),
status: (() => {
  const h = new Date().getHours();
  return h >= 13 ? 'Half Day' : 'Present';
})(),
   work_type: workType || 'Office',
    latitude: latitude,
    longitude: longitude,
    location_address: location_address,
    ip_address: ip_address
  });
  if (error) { showToast('❌ '+error.message, 'err'); return; }
  const typeLabel = workType==='WFH'?'Work From Home':workType==='On Site'?'On Site':'Office';
  showToast(`✅ Logged in (${typeLabel}) at `+now.toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'}), 'ok');
  loadEmpDashboard();
}
async function markEmpLogout() {
  const now = new Date();
  const today = now.toISOString().split('T')[0];
  const btn = document.getElementById('empLogoutBtn');
  btn.disabled = true; btn.textContent = 'Logging out...';
const { data: todayAtt } = await sb.from('attendance').select('*')
    .eq('employee_email', currentUser.email)
    .eq('date', today)
    .eq('is_archived',false)
    .is('check_out', null)
    .order('check_in', {ascending: false})
    .limit(1)
    .maybeSingle();
  if (!todayAtt) { showToast('❌ No login found!', 'err'); btn.disabled=false; btn.textContent='🚪 Log Out'; return; }
  const hrs = ((now - new Date(todayAtt.check_in))/3600000).toFixed(2);
  const status = parseFloat(hrs) >= 5 ? 'Present' : 'Half Day';
  const { error } = await sb.from('attendance').update({
    check_out: now.toISOString(),
    working_hours: hrs, status
  }).eq('id', todayAtt.id);
  btn.disabled = false; btn.textContent = '🚪 Log Out';
  if (error) { showToast('❌ '+error.message, 'err'); return; }
  showToast(`✅ Logged out! Worked ${parseFloat(hrs).toFixed(1)} hrs — ${status}`, 'ok');
  loadEmpDashboard();
}

async function loadTicketBadge() {
  try {
    const isCEO = currentUser.role === 'ceo' || currentUser.role === 'manager';
    let query = sb.from('tickets').select('id').eq('status','Open');
    if (!isCEO) query = query.eq('created_by_email', currentUser.email);
    const { data } = await query;
    const badge = document.getElementById('nb-tickets');
    if (badge) {
      const count = (data||[]).length;
      badge.textContent = count;
      badge.style.display = count > 0 ? 'inline-block' : 'none';
    }
  } catch(e) {}
}

async function loadHelpBadge() {
  try {
    const { data } = await sb.from('help_requests').select('id')
      .eq('to_email', currentUser.email).eq('is_resolved', false);
    const badge = document.getElementById('nb-help');
    if (badge) {
      const count = (data||[]).length;
      badge.textContent = count;
      badge.style.display = count > 0 ? 'inline-block' : 'none';
    }
  } catch(e) {}
}

async function loadCeoActivityFeed() {
  document.getElementById('ceoActivitySection').style.display = 'block';
  const { data: tasks } = await sb.from('tasks').select('*').eq('is_archived',false).order('updated_at',{ascending:false});
  const { data: todayAtt } = await sb.from('attendance').select('*').eq('date', new Date().toISOString().split('T')[0]).eq('is_archived',false);
  const { data: emps } = await sb.from('employees').select('name,email,designation').eq('is_active',true);
  const el = document.getElementById('ceoActivityFeed');

  if (!tasks || !tasks.length) {
    el.innerHTML = '<div class="empty-state"><div class="empty-icon">📭</div><p>No activity yet</p></div>';
    return;
  }

  const today = new Date(); today.setHours(0,0,0,0);

  const empMap = {};
  tasks.forEach(t => {
    const key = t.assigned_to_email || t.assigned_to_name;
    if (!empMap[key]) empMap[key] = [];
    empMap[key].push(t);
  });

  let html = '<div style="padding:14px 16px;display:flex;flex-direction:column;gap:10px">';

  Object.keys(empMap).forEach(empKey => {
    const empTasks = empMap[empKey];
    const empName = empTasks[0]?.assigned_to_name || empKey;
const empEmail = empTasks[0]?.assigned_to_email || '';
    const empExists = (emps||[]).find(e => e.email === empEmail || e.name === empName);
    if (!empExists) return;
      const activeTasks = empTasks.filter(t => t.work_status !== 'Completed' && t.work_status !== 'Report Ready');
    const completedCount = empTasks.filter(t => t.work_status === 'Completed' || t.work_status === 'Report Ready').length;
    const delayedCount = activeTasks.filter(t => {
      const ed = t.end_date ? new Date(t.end_date) : null;
      return ed && today > ed;
    }).length;

    const attRecord = (todayAtt||[]).find(a => a.employee_name === empName);
    const empInfo = (emps||[]).find(e => e.name === empName);

    let attBadge = '<span class="badge b-red" style="font-size:10px">Absent</span>';
    if (attRecord?.check_in && !attRecord?.check_out) attBadge = '<span class="badge b-green" style="font-size:10px">Present</span>';
    else if (attRecord?.check_in && attRecord?.check_out) attBadge = '<span class="badge b-blue" style="font-size:10px">Checked Out</span>';
    else if (attRecord?.status === 'Half Day') attBadge = '<span class="badge b-amber" style="font-size:10px">Half Day</span>';

    const urgentTask = activeTasks.sort((a,b) => {
      const edA = a.end_date ? new Date(a.end_date) : new Date('9999');
      const edB = b.end_date ? new Date(b.end_date) : new Date('9999');
      return edA - edB;
    })[0];

    let pendingWith = '—'; let pendingColor = 'var(--muted)';
    if (urgentTask) {
      if (urgentTask.pending_with_name) {
        pendingWith = '📌 ' + urgentTask.pending_with_name;
        pendingColor = 'var(--purple)';
      } else if (urgentTask.work_status === 'Not Started' || urgentTask.work_status === 'In Progress') {
        pendingWith = empName; pendingColor = 'var(--blue)';
      } else if (urgentTask.work_status === 'Completed') {
        pendingWith = '✅ Completed'; pendingColor = 'var(--green)';
      } else if (urgentTask.work_status === 'Report Ready') {
        pendingWith = '📄 Report Ready'; pendingColor = 'var(--green)';
      } else if (urgentTask.work_status === 'Senior Approved') {
        pendingWith = '⏳ CEO Approval'; pendingColor = '#c9a84c';
      }
    }

    const isLate = urgentTask && (() => { const ed = urgentTask.end_date ? new Date(urgentTask.end_date) : null; return ed && today > ed; })();

    html += `<div style="background:#fff;border:1px solid var(--border);border-radius:10px;padding:14px 16px;${isLate?'border-left:3px solid var(--red)':delayedCount===0&&activeTasks.length===0?'border-left:3px solid var(--green)':'border-left:3px solid var(--blue)'}">
      <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px">
        <div style="display:flex;align-items:center;gap:10px">
          <div class="av" style="background:var(--navy);width:34px;height:34px;font-size:12px">${esc(empName).substring(0,2).toUpperCase()}</div>
          <div>
            <div style="font-size:13px;font-weight:700;color:var(--navy)">${esc(empName)}</div>
            <div style="font-size:10px;color:var(--muted)">${esc(empInfo?.designation||'')}</div>
          </div>
          ${attBadge}
        </div>
        <div style="display:flex;gap:16px;align-items:center">
          <div style="text-align:center">
            <div style="font-size:16px;font-weight:800;color:var(--blue)">${activeTasks.length}</div>
            <div style="font-size:9px;color:var(--muted);text-transform:uppercase;letter-spacing:0.5px">Active</div>
          </div>
          <div style="text-align:center">
            <div style="font-size:16px;font-weight:800;color:var(--green)">${completedCount}</div>
            <div style="font-size:9px;color:var(--muted);text-transform:uppercase;letter-spacing:0.5px">Done</div>
          </div>
          ${delayedCount>0?`<div style="text-align:center">
            <div style="font-size:16px;font-weight:800;color:var(--red)">${delayedCount}</div>
            <div style="font-size:9px;color:var(--muted);text-transform:uppercase;letter-spacing:0.5px">Delayed</div>
          </div>`:''}
        </div>
        ${urgentTask?`<div style="background:#f8f9fc;border-radius:8px;padding:8px 12px;flex:1;min-width:200px;max-width:340px">
          <div style="font-size:9px;color:var(--muted);font-weight:700;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:4px">Current Task</div>
          <div style="font-size:12px;font-weight:600;color:var(--navy)">${esc(urgentTask.project)} — ${esc(urgentTask.task_detail.substring(0,40))}${urgentTask.task_detail.length>40?'...':''}</div>
          <div style="display:flex;align-items:center;gap:8px;margin-top:6px">
            ${statusBadge(urgentTask.work_status)}
            <span style="font-size:10px;color:${isLate?'var(--red)':'var(--muted)'};font-weight:600">End: ${fmtDate(urgentTask.end_date)}${isLate?' ⚠️':''}</span>
          </div>
        </div>`:'<div style="font-size:12px;color:var(--green);font-weight:600">✅ All tasks completed!</div>'}
        <div style="text-align:right">
          ${urgentTask && urgentTask.work_status==='Senior Approved' ? `
          <div style="font-size:9px;color:var(--muted);margin-bottom:4px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px">CEO Finalize</div>
          <select onchange="ceoFinalizeTask('${urgentTask.id}',this.value)"
            style="padding:5px 10px;border:1.5px solid var(--gold);border-radius:6px;font-size:11px;font-family:'DM Sans',sans-serif;cursor:pointer;color:var(--navy);background:#fdf6e3;font-weight:600">
            <option value="">— Select —</option>
            <option>Finalize with SG</option>
            <option>Finalize with YG</option>
          </select>
          ` : `
          <div style="font-size:11px;font-weight:600;color:${pendingColor}">${pendingWith}</div>
          <div style="font-size:9px;color:var(--muted);margin-top:2px">${urgentTask && urgentTask.pending_with_name ? 'Forwarded for review' : 'Pending with'}</div>
          `}
        </div>
      </div>
    </div>`;
  });

  html += '</div>';
  el.innerHTML = html;
}

async function loadTodayAttendanceWidget() {
  const today = new Date().toISOString().split('T')[0];
  const { data } = await sb.from('attendance').select('*').eq('employee_email', currentUser.email).eq('date', today).eq('is_archived',false).maybeSingle();
  const el = document.getElementById('homeAttendance');
  if (data) {
    el.innerHTML = `
      <div style="display:flex;align-items:center;gap:12px">
        <div style="width:44px;height:44px;border-radius:50%;background:var(--green-bg);display:flex;align-items:center;justify-content:center;font-size:20px">✅</div>
        <div>
          <div style="font-size:13px;font-weight:700;color:var(--navy)">${data.status}</div>
          <div style="font-size:11px;color:var(--muted)">In: ${data.check_in?new Date(data.check_in).toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'}):'—'}</div>
          ${data.check_out?`<div style="font-size:11px;color:var(--muted)">Out: ${new Date(data.check_out).toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'})}</div>`:'<div style="font-size:11px;color:var(--amber);font-weight:600">Not checked out yet</div>'}
        </div>
      </div>
    `;
  } else {
    el.innerHTML = `<div style="text-align:center"><p style="color:var(--muted);font-size:13px;margin-bottom:12px">Not checked in yet today</p><button class="btn btn-gold btn-sm" onclick="showView('attendance')">Mark Attendance →</button></div>`;
  }
}

// ═══════════════════════════════════════════
//  TASKS
// ═══════════════════════════════════════════
async function loadMyTasks() {
  // 1. Tasks assigned TO me
  const { data: ownTasks } = await sb.from('tasks').select('*').eq('assigned_to_email', currentUser.email).eq('is_archived',false).order('created_at',{ascending:false});
  // 2. Tasks forwarded TO me (pending_with) - excluding own tasks
const { data: forwardedTasks } = await sb.from('tasks').select('*').eq('pending_with_email', currentUser.email).neq('assigned_to_email', currentUser.email).eq('is_archived',false).order('created_at',{ascending:false});
  // Merge and deduplicate
  const allMyTasksMap = {};
  (ownTasks||[]).forEach(t => allMyTasksMap[t.id] = {...t, _isForwarded: false});
 (forwardedTasks||[]).forEach(t => {
    if (!allMyTasksMap[t.id] && t.assigned_to_email !== currentUser.email) {
      allMyTasksMap[t.id] = {...t, _isForwarded: true};
    }
  });

  myTasks = Object.values(allMyTasksMap).sort((a,b) => new Date(b.created_at) - new Date(a.created_at));
  renderMyTasks();
  const ns = myTasks.filter(t=>t.work_status==='Not Started').length;
  const ip = myTasks.filter(t=>t.work_status==='In Progress').length;
  const rv = myTasks.filter(t=>t.work_status==='Sent for Review').length;
  const done = myTasks.filter(t=>t.work_status==='Completed').length;
  document.getElementById('taskStats').innerHTML = `
    <div class="stat-card sc-navy"><div class="stat-icon">📋</div><div class="stat-num">${myTasks.length}</div><div class="stat-lbl">My Tasks</div></div>
    <div class="stat-card sc-blue"><div class="stat-icon">⚡</div><div class="stat-num">${ip}</div><div class="stat-lbl">In Progress</div></div>
    <div class="stat-card sc-gold"><div class="stat-icon">🔍</div><div class="stat-num">${rv}</div><div class="stat-lbl">In Review</div></div>
    <div class="stat-card sc-green"><div class="stat-icon">✅</div><div class="stat-num">${done}</div><div class="stat-lbl">Completed</div></div>
  `;
  const pendingCount = myTasks.filter(t=>t.work_status!=='Completed'||t._isForwarded).length;
  document.getElementById('nb-tasks').textContent = pendingCount;
}

function filterMyTasks(val) { myTasksFilter = val; renderMyTasks(); }

async function renderMyTasks() {
  const filtered = myTasksFilter==='all' ? myTasks : myTasks.filter(t=>t.work_status===myTasksFilter);
  const tbody = document.getElementById('myTasksBody');
  if (!filtered.length) {
    tbody.innerHTML = '<tr><td colspan="10" style="text-align:center;color:var(--muted);padding:30px">No tasks found</td></tr>';
    return;
  }
  const today = new Date(); today.setHours(0,0,0,0);
  // Load files for all tasks
  const fileMap = {};
  await Promise.all(filtered.map(async t => {
    fileMap[t.id] = await getTaskFiles(t.id);
  }));

  tbody.innerHTML = filtered.map(t => {
    const endD = t.end_date ? new Date(t.end_date) : null;
    const isLate = endD && today > endD && t.work_status !== 'Completed';
    const files = fileMap[t.id] || [];
    const isForwarded = t._isForwarded;
    const rowBg = isLate ? 'background:#fdf0ee' : isForwarded ? 'background:#f0ebff' : '';
    return `<tr style="${rowBg}">
      <td>
        <span style="background:#e8ecf5;color:var(--navy);padding:2px 8px;border-radius:4px;font-size:11px;font-weight:700">${esc(t.project)}</span>
        ${isForwarded?'<div style="font-size:10px;color:var(--purple);font-weight:700;margin-top:3px">📌 Forwarded to you by '+esc(t.assigned_to_name)+'</div>':''}
        ${t.assigned_by_name && t.assigned_by_name !== currentUser.name && !isForwarded?'<div style="font-size:10px;color:var(--muted);margin-top:2px">👤 Assigned by: '+esc(t.assigned_by_name)+'</div>':''}
      </td>
      <td style="font-weight:600;max-width:180px">${esc(t.task_detail.substring(0,45))}${t.task_detail.length>45?'...':''}</td>
      <td style="font-size:11px">${fmtDate(t.start_date)}</td>
      <td style="font-size:11px;font-weight:${isLate?'700':'400'};color:${isLate?'var(--red)':'var(--text)'}">${fmtDate(t.end_date)}${isLate?' ⚠️':''}</td>
      <td>${statusBadge(t.work_status)}</td>
      <td>${t.pending_with_name ? `<span style="font-size:11px;font-weight:600;color:var(--purple)">📌 ${esc(t.pending_with_name)}</span>` : t.approval_type && t.approval_status==='Pending' ? `<span style="font-size:11px;font-weight:600;color:var(--amber)">⏳ ${esc(t.approval_type)}</span>` : isForwarded?'<span style="font-size:11px;color:var(--purple);font-weight:600">⏳ Your review</span>':'—'}</td>
<td style="min-width:100px">
        ${files.length ? renderFileChips(files) : ''}
        ${t.file_url ? `<div class="file-chip">📎 <a href="${t.file_url}" target="_blank">${esc((t.file_name||'File').length > 16 ? (t.file_name||'File').substring(0,16)+'…' : (t.file_name||'File'))}</a></div>` : ''}
        ${!files.length && !t.file_url ? '<span style="color:var(--muted);font-size:11px">—</span>' : ''}
      </td>
      <td style="min-width:160px">
        ${(t.voice_notes && t.voice_notes.length) ? t.voice_notes.map((url, vi) => `<audio src="${url}" controls style="height:26px;width:150px;display:block;margin-bottom:4px"></audio>`).join('') : '<span style="color:var(--muted);font-size:11px">—</span>'}
      </td>
      <td style="display:flex;gap:5px">
        <button class="btn btn-outline btn-sm" onclick="openTaskViewModal('${t.id}')">👁️</button>
        <button class="btn btn-primary btn-sm" onclick="openTaskModal('${t.id}')">Update</button>
        <button class="btn btn-sm" onclick="deleteTask('${t.id}',false)" style="background:#fdf0ee;color:var(--red);border-color:var(--red-bg)">🗑️</button>
      </td>
    </tr>`;
  }).join('');
}

async function openTaskModal(taskId) {
  const t = myTasks.find(x => x.id === taskId);
  if (!t) return;
  currentTaskRow = t;
  const locked = t.work_status === 'Completed';
  document.getElementById('taskModalContent').innerHTML = `
<div style="margin-bottom:16px;padding:14px;background:#f8f9fc;border-radius:10px;border:1px solid var(--border)">
      <div style="font-size:13px;font-weight:700;color:var(--navy)">${esc(t.project)}</div>
      <div style="margin-top:8px">
        ${statusBadge(t.work_status)}
        ${t.pending_with_name?`<span style="font-size:11px;font-weight:600;color:var(--purple);margin-left:8px">📌 Pending with: ${esc(t.pending_with_name)}</span>`:''}
      </div>
    </div>
    ${!locked ? `
    <div class="field" style="margin-bottom:14px">
      <label>Task Detail</label>
      <textarea id="modal-task-detail">${esc(t.task_detail)}</textarea>
    </div>
    <div class="form-grid cols-2" style="margin-bottom:14px">
      <div class="field">
        <label>Start Date</label>
        <input type="date" id="modal-start-date" value="${t.start_date||''}"/>
      </div>
      <div class="field">
        <label>End Date</label>
        <input type="date" id="modal-end-date" value="${t.end_date||''}"/>
      </div>
    </div>
    ` : `
    <div style="margin-bottom:16px;padding:14px;background:#f8f9fc;border-radius:10px;border:1px solid var(--border)">
      <div style="font-size:12px;color:var(--muted);line-height:1.5">${esc(t.task_detail)}</div>
      <div style="margin-top:8px;font-size:11px;color:var(--muted)">End: ${fmtDate(t.end_date)}</div>
    </div>
    `}
    ${locked ? '<div class="badge b-green" style="margin-bottom:12px">✅ Task Completed — locked</div>' : `
    <div class="field" style="margin-bottom:14px">
      <label>Update Status</label>
      <select id="modal-status" onchange="handleStatusChange(this.value)">
        ${['Not Started','In Progress','Sent for Review','Completed'].map(s=>`<option ${s===t.work_status?'selected':''}>${s}</option>`).join('')}
      </select>
    </div>
    <div id="approval-field" style="margin-bottom:14px;display:none">
      <label style="display:block;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.8px;color:var(--muted);margin-bottom:5px">Approval Type</label>
<select id="modal-approval" style="width:100%;padding:9px 12px;border:1.5px solid var(--border);border-radius:8px;font-size:13px;font-family:'DM Sans',sans-serif;outline:none">
        <option value="">— Select Approval —</option>
        <option value="Approval for SG">Approval for SG</option>
        <option value="Approval for YG">Approval for YG</option>
        <option value="Approval for Rajendra">Approval for Rajendra</option>
        <option value="Approval for Alisha">Approval for Alisha</option>
      </select>
    </div>
    <div id="send-to-field" style="margin-bottom:14px;display:block">
      <label style="display:block;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.8px;color:var(--muted);margin-bottom:5px">
        ${t._isForwarded ? '📌 Forward To (after your review)' : '📌 Send To (for help/review)'}
      </label>
      <select id="modal-send-to" style="width:100%;padding:9px 12px;border:1.5px solid var(--border);border-radius:8px;font-size:13px;font-family:'DM Sans',sans-serif;outline:none">
        <option value="">— Keep with me / No forward —</option>
      </select>
      ${t.pending_with_name?`<div style="margin-top:6px;font-size:11px;color:var(--purple);font-weight:600">📌 Currently with: ${esc(t.pending_with_name)}</div>`:''}
      ${t._isForwarded?`<div style="margin-top:6px;padding:8px;background:#f0ebff;border-radius:6px;font-size:11px;color:var(--purple)">This task was forwarded to you by <strong>${esc(t.assigned_to_name)}</strong> for review.</div>`:''}
    </div>
    `}
    <div class="field" style="margin-bottom:14px">
      <label>Comments / Notes</label>
      <textarea id="modal-comments" ${locked?'disabled':''}>${esc(t.comments||'')}</textarea>
    </div>
    ${!locked?`
    <div class="field">
      <label>Upload Work File (PDF, Image, etc.)</label>
      <div class="upload-zone" onclick="document.getElementById('modal-file').click()" 
           ondragover="event.preventDefault();this.classList.add('drag')"
           ondragleave="this.classList.remove('drag')"
           ondrop="event.preventDefault();this.classList.remove('drag');handleFileDrop(event)">
        <input type="file" id="modal-file" accept=".pdf,.jpg,.jpeg,.png,.xlsx,.docx,.dwg,.zip" onchange="previewFile(this)"/>
        <div class="upload-zone-icon">📎</div>
        <div class="upload-zone-text">Click to select file or drag & drop</div>
        <div class="upload-zone-hint">PDF, Image, Excel, Word, DWG, ZIP — max 10MB</div>
      </div>
      <div id="file-preview" style="margin-top:8px"></div>
    </div>
    `:''}
    <div id="modalMsg" style="font-size:12px;font-weight:600;margin-top:8px"></div>
  `;
  const selEl = document.getElementById('modal-status');
  if (selEl) {
    selEl.addEventListener('change', function() {
      const cf = document.getElementById('ceo-approval-field');
      if (cf) cf.style.display = this.value==='Completed'?'block':'none';
    });
  }
  document.getElementById('taskModal').classList.add('open');
  // Load employees for Send To dropdown
  const { data: emps } = await sb.from('employees').select('name,email').eq('is_active',true);
  const sendToEl = document.getElementById('modal-send-to');
  if (sendToEl && emps) {
    sendToEl.innerHTML = '<option value="">— Select Person —</option>' +
      emps.filter(e => e.email !== currentUser.email)
        .map(e => `<option value="${esc(e.email)}" data-name="${esc(e.name)}" ${t.pending_with_email===e.email?'selected':''}>${esc(e.name)}</option>`)
        .join('');
  }
}

function previewFile(input) {
  const file = input.files[0];
  const preview = document.getElementById('file-preview');
  if (file) {
    preview.innerHTML = `<div class="file-chip">📎 ${esc(file.name)} <span style="color:var(--muted)">(${(file.size/1024).toFixed(0)} KB)</span></div>`;
  }
}

function handleFileDrop(event) {
  const file = event.dataTransfer.files[0];
  if (file) {
    const input = document.getElementById('modal-file');
    const dt = new DataTransfer();
    dt.items.add(file);
    input.files = dt.files;
    previewFile(input);
  }
}

async function saveTaskUpdate() {
  if (!currentTaskRow) return;
  const locked = currentTaskRow.work_status === 'Completed';
  if (locked) { closeModal('taskModal'); return; }
  const status = document.getElementById('modal-status').value;
  const comments = document.getElementById('modal-comments').value.trim();
  const ceoVal = (document.getElementById('modal-ceo')||{}).value || currentTaskRow.ceo_approval;
  const msgEl = document.getElementById('modalMsg');
  const fileInput = document.getElementById('modal-file');

  msgEl.textContent = 'Saving...'; msgEl.style.color = 'var(--muted)';

  // Upload file if selected
  if (fileInput && fileInput.files[0]) {
    const file = fileInput.files[0];
    if (file.size > 10 * 1024 * 1024) {
      msgEl.textContent = '❌ File too large (max 10MB)'; msgEl.style.color = 'var(--red)'; return;
    }
    msgEl.textContent = '⏳ Uploading file...';
    await uploadTaskFile(currentTaskRow.id, file);
  }

  // Get Send To person
  const sendToEl = document.getElementById('modal-send-to');
  const sendToEmail = sendToEl ? sendToEl.value : '';
  const sendToName = sendToEl && sendToEl.selectedOptions[0] ? sendToEl.selectedOptions[0].dataset.name : '';

  // Validate approval for Sent for Review
  const approvalEl = document.getElementById('modal-approval');
  const approvalVal = approvalEl ? approvalEl.value : '';
  if (status === 'Sent for Review' && !approvalVal) {
    msgEl.textContent = '⚠️ Please select Approval type (SG or YG)';
    msgEl.style.color = 'var(--red)';
    return;
  }

const newEndDate = document.getElementById('modal-end-date')?.value;
const newStartDate = document.getElementById('modal-start-date')?.value;
const newTaskDetail = document.getElementById('modal-task-detail')?.value?.trim();
const updates = { work_status: status, comments, updated_at: new Date().toISOString() };
if (newEndDate) updates.end_date = newEndDate;
if (newStartDate) updates.start_date = newStartDate;
if (newTaskDetail) updates.task_detail = newTaskDetail;
  if (status === 'Sent for Review' && approvalVal) {
    updates.ceo_approval = approvalVal;
    updates.approval_type = approvalVal;
    updates.approval_status = 'Pending';
  }
  if (status === 'Completed' && ceoVal) updates.ceo_approval = ceoVal;
  // Handle forwarding
  if (sendToEmail && sendToName) {
    // Forward to someone
    updates.pending_with_email = sendToEmail;
    updates.pending_with_name = sendToName;
  } else if (!sendToEmail && sendToEl && sendToEl.value === '') {
    // Explicitly cleared - remove forward
    updates.pending_with_email = null;
    updates.pending_with_name = null;
  }

  const { error } = await sb.from('tasks').update(updates).eq('id', currentTaskRow.id);
  if (error) { msgEl.textContent = '❌ ' + error.message; msgEl.style.color = 'var(--red)'; return; }

  // If this task is linked to a Client CRM project tracker record, sync its status
  if (currentTaskRow.linked_record_id) {
    let newTrackerStatus = null;
    if (status === 'Completed') newTrackerStatus = 'Completed';
    else if (status === 'In Progress' || status === 'Sent for Review') newTrackerStatus = 'In Progress';
    if (newTrackerStatus) {
      await sbClient.from('project_records').update({ tracker_status: newTrackerStatus }).eq('id', currentTaskRow.linked_record_id);
    }
  }
  // Send email + notify when forwarded
  if (sendToEmail && sendToName) {
    // Create notification in DB
    await createNotification(
      sendToEmail,
      `📌 Task forwarded by ${currentUser.name}`,
      `${currentUser.name} forwarded a task to you: ${currentTaskRow.project} — ${currentTaskRow.task_detail.substring(0,50)}`,
      'forwarded',
      'tasks'
    );
    await sendEmail(
      sendToEmail, sendToName,
      `📌 Task Forwarded to You — ${currentTaskRow.project}`,
      `Dear ${sendToName},

${currentUser.name} has forwarded a task to you for review/help.

Project: ${currentTaskRow.project}
Task: ${currentTaskRow.task_detail}
Status: ${status}
Comments: ${comments || 'No comments'}

Please login to My Tasks — it will appear there for your review.

Regards,
Sayash Vastu Portal`,
      'Task Forwarded',
      'https://sayash-vastu-portal.vercel.app',
      'View My Tasks →'
    );
    showToast('✅ Task forwarded to ' + sendToName + '!', 'ok');
  } else {
    showToast('✅ Task updated!', 'ok');
  }
  // Notify CEO if Sent for Review
  if (status === 'Sent for Review' && approvalVal) {
    await createNotification(
      CEO_EMAIL,
      `📑 Report pending ${approvalVal} — ${currentTaskRow.project}`,
      `${currentUser.name} submitted a report for ${approvalVal}. Project: ${currentTaskRow.project}`,
      'task', 'reportsApproval'
    );
  }
  closeModal('taskModal');
  // Reload appropriate task list
if (currentUser.role === 'ceo') {
  loadCeoMyTasks();
  } else {
    loadMyTasks();
  }
  loadNotifications();
  loadMyReportsBadge();
}

// ═══════════════════════════════════════════
//  ASSIGN TASK
// ═══════════════════════════════════════════
async function loadEmployeeAutocomplete() {
  const { data } = await sb.from('employees').select('name,email').eq('is_active',true);
  if (!data) return;
  window._selectedAssignEmps = [];
  const atEmpList = document.getElementById('at-emp-list');
  if (atEmpList) {
    atEmpList.innerHTML = data.map(e => {
      const chipId = 'emp-chip-' + e.email.replace(/[@.]/g,'_');
      return `<label id="${chipId}" style="display:flex;align-items:center;gap:6px;padding:6px 12px;background:var(--bg);border-radius:20px;cursor:pointer;font-size:12px;border:1.5px solid var(--border);transition:all 0.15s;user-select:none">
        <input type="checkbox" value="${esc(e.email)}" data-name="${esc(e.name)}" onchange="toggleAssignEmp(this)" style="cursor:pointer;accent-color:var(--gold)"/>
        <div class="av" style="width:20px;height:20px;font-size:8px;background:var(--navy);color:#fff;flex-shrink:0">${esc(e.name).substring(0,2).toUpperCase()}</div>
        ${esc(e.name)}
      </label>`;
    }).join('');
  }
  const helpList = document.getElementById('helpNameList');
  if (helpList) helpList.innerHTML = data.filter(e=>e.email!==(currentUser&&currentUser.email)).map(e=>`<option value="${esc(e.name)}" data-email="${esc(e.email)}">`).join('');
const tkList = document.getElementById('tkAssignList');
  if (tkList) tkList.innerHTML = data.map(e=>`<option value="${esc(e.name)}">`).join('');

// Load clients for Assign Task client datalist
  const atClientDatalist = document.getElementById('atClientList');
  if (atClientDatalist) {
    const { data: clientsData } = await sbClient.from('clients').select('id, name').order('name');
    window._atAllClients = clientsData || [];
    atClientDatalist.innerHTML = (clientsData||[]).map(c => `<option value="${esc(c.name)}">`).join('');
  }
}
  function previewAssignFile(input) {
  const file = input.files[0];
  if (!file) return;
  document.getElementById('at-file-preview').innerHTML = `
    <div style="display:flex;align-items:center;gap:10px;justify-content:center">
      <span style="font-size:20px">📎</span>
      <div>
        <div style="font-size:12px;font-weight:600;color:var(--navy)">${file.name}</div>
        <div style="font-size:11px;color:var(--muted)">${(file.size/1024).toFixed(0)} KB</div>
      </div>
    </div>`;
}
  

function toggleAssignEmp(checkbox) {
  window._selectedAssignEmps = window._selectedAssignEmps || [];
  const email = checkbox.value;
  const name = checkbox.dataset.name;
  const chipId = 'emp-chip-' + email.replace(/[@.]/g,'_');
  const chip = document.getElementById(chipId);
  if (checkbox.checked) {
    if (!window._selectedAssignEmps.find(e => e.email === email)) window._selectedAssignEmps.push({email, name});
    if (chip) { chip.style.background='var(--gold)'; chip.style.borderColor='var(--gold)'; chip.style.color='var(--navy)'; chip.style.fontWeight='700'; }
  } else {
    window._selectedAssignEmps = window._selectedAssignEmps.filter(e => e.email !== email);
    if (chip) { chip.style.background='var(--bg)'; chip.style.borderColor='var(--border)'; chip.style.color='var(--text)'; chip.style.fontWeight='400'; }
  }
  const countEl = document.getElementById('at-selected-count');
  if (countEl) {
    const cnt = (window._selectedAssignEmps||[]).length;
    countEl.textContent = cnt > 0 ? `✅ ${cnt} employee${cnt>1?'s':''} selected: ${window._selectedAssignEmps.map(e=>e.name).join(', ')}` : '';
  }
}

async function assignTask() {
  const btn = document.getElementById('assignBtn');
  if (btn.disabled) return;
  btn.disabled = true;
  btn.textContent = 'Assigning...';

  window._selectedAssignEmps = window._selectedAssignEmps || [];
  const empsToAssign = window._selectedAssignEmps;

  if (currentUser.role === 'employee') {
    const todayStr = new Date().toISOString().split('T')[0];
    const { data: todayAtt } = await sb.from('attendance')
      .select('id').eq('employee_email', currentUser.email)
      .eq('date', todayStr).eq('is_archived', false).maybeSingle();
    if (!todayAtt) {
      showToast('⚠️ Please mark your attendance before assigning tasks!', 'warn');
      btn.disabled = false; btn.textContent = '➕ Assign Task';
      showView('home');
      return;
    }
  }

const atClientInput = document.getElementById('at-client');
  let clientId = _atResolvedClientId;
  let clientName = _atResolvedClientName || (atClientInput ? atClientInput.value.trim() : '');
  const project = document.getElementById('at-project').value.trim();
  const subProjectName = document.getElementById('at-subproject') ? document.getElementById('at-subproject').value : '';
  const detail = document.getElementById('at-detail').value.trim();

  // If a client name was typed but doesn't exist yet, create it
  if (clientName && !clientId) {
    const { data: newClient, error: newClientErr } = await sbClient.from('clients').insert({
      name: clientName,
      status: 'Active',
    }).select().single();
    if (!newClientErr && newClient) {
      clientId = newClient.id;
      window._atAllClients = window._atAllClients || [];
      window._atAllClients.push(newClient);
      showToast('✅ New client "' + clientName + '" created!', 'ok');
    }
  }
  const start = document.getElementById('at-start').value;
  const end = document.getElementById('at-end').value;
  const msg = document.getElementById('assignMsg');

  if (!empsToAssign.length) { 
    msg.textContent='⚠️ Kam se kam ek employee select karo'; 
    msg.style.color='var(--red)'; 
    btn.disabled = false; btn.textContent = '➕ Assign Task';
    return; 
  }
if (!detail||!start||!end) { 
    msg.textContent='⚠️ Please fill all fields'; 
    msg.style.color='var(--red)'; 
    btn.disabled = false; btn.textContent = '➕ Assign Task';
    return; 
  }
  const atFile = document.getElementById('at-file');
  const atOneDriveLink = document.getElementById('at-onedrive-link') ? document.getElementById('at-onedrive-link').value.trim() : '';
  let atFileUrl = null; let atFileName = null;
  if (atFile && atFile.files[0]) {
    const f = atFile.files[0];
    if (f.size > 10 * 1024 * 1024) { 
      msg.textContent='❌ File too large (max 10MB)'; 
      msg.style.color='var(--red)'; 
      btn.disabled = false; btn.textContent = '➕ Assign Task';
      return; 
    }
    msg.textContent='⏳ Uploading file...'; msg.style.color='var(--muted)';
    const path = `assign/${Date.now()}_${f.name.replace(/[^a-z0-9.]/gi,'_')}`;
    const { error: uploadErr } = await sb.storage.from('Task-Files').upload(path, f, {upsert: false});
    if (!uploadErr) {
      const { data: urlData } = sb.storage.from('Task-Files').getPublicUrl(path);
      atFileUrl = urlData.publicUrl; atFileName = f.name;
    } else {
      console.error('Upload error:', uploadErr);
      msg.textContent = '⚠️ File upload failed: ' + uploadErr.message;
      msg.style.color = 'var(--amber)';
    }
  } else if (atOneDriveLink) {
    atFileUrl = atOneDriveLink;
    atFileName = 'OneDrive Link';
  }

  const assignedEmails = new Set();
  let successCount = 0;

    const projectDisplayName = project || clientName || 'Task';
for (const emp of empsToAssign) {
    if (assignedEmails.has(emp.email)) continue;
    assignedEmails.add(emp.email);

    // Create a Project Tracker record in Client CRM if a client was selected
    let linkedRecordId = null;
    if (clientId) {
      const isMaxHealthcareAT = clientName === 'MAX Healthcare';
      const isSignatureGlobalAT = clientName === 'Signature Global';

      let atTrackerPayload = {
        client_id: clientId,
        project_name: project || 'Task',
        sub_project_name: subProjectName || null,
        tracker_status: 'Pending',
        hyperlink: atFileUrl,
        assigned_to_name: emp.name,
      };

      if (isMaxHealthcareAT) {
        atTrackerPayload.coordinator = currentUser.name;
        atTrackerPayload.recommendation = detail || 'Task pending';
      } else if (isSignatureGlobalAT) {
        atTrackerPayload.sg_team_visitor = currentUser.name;
        atTrackerPayload.sayash_observation = detail || 'Task pending';
      } else {
        atTrackerPayload.received_from = currentUser.name;
        atTrackerPayload.recommendation = detail || 'Task pending';
        atTrackerPayload.record_type = 'Other';
      }

      const { data: atTrackerRecord, error: atTrackerErr } = await sbClient.from('project_records').insert(atTrackerPayload).select().single();
      if (!atTrackerErr && atTrackerRecord) linkedRecordId = atTrackerRecord.id;
    }

const { error } = await sb.from('tasks').insert({
      project: projectDisplayName, task_detail: detail,
  assigned_to_email: emp.email.toLowerCase(), 
      assigned_to_name: emp.name,
      assigned_by_email: currentUser.email, 
      assigned_by_name: currentUser.name,
      start_date: start, end_date: end,
      work_status: 'Not Started', ceo_approval: 'Pending',
      file_url: atFileUrl, file_name: atFileName,
      linked_record_id: linkedRecordId,
      linked_client_id: clientId || null,
    });
    if (!error) {
      successCount++;
      await createNotification(emp.email.toLowerCase(), `📋 New task assigned by ${currentUser.name}`, `Project: ${project} — ${detail.substring(0,60)}`, 'task', 'tasks');
      await sendEmail(emp.email, emp.name, '📋 New Task Assigned — Sayash Vastu',
        `You have been assigned a new task.\n\nProject: ${project}\nTask: ${detail}\nStart: ${start}\nEnd: ${end}${atFileUrl?'\nFile: '+atFileName:''}`,
        'Task Assigned', 'https://sayash-vastu-portal.vercel.app', 'View My Tasks →');
    }
  }
  btn.disabled = false; btn.textContent = '➕ Assign Task';

  if (successCount > 0) {
    msg.textContent=`✅ Task assigned to ${empsToAssign.map(e=>e.name).join(', ')}!`; 
    msg.style.color='var(--green)';
    showToast(`✅ Task assigned to ${successCount} employee(s)!`, 'ok');
  } else { 
    msg.textContent='❌ Assignment failed'; 
    msg.style.color='var(--red)'; 
  }

  window._selectedAssignEmps = [];
  document.querySelectorAll('#at-emp-list input[type=checkbox]').forEach(cb => {
    cb.checked = false;
    const chip = document.getElementById('emp-chip-' + cb.value.replace(/[@.]/g,'_'));
    if (chip) { chip.style.background='var(--bg)'; chip.style.borderColor='var(--border)'; chip.style.color='var(--text)'; chip.style.fontWeight='400'; }
  });
  const countEl = document.getElementById('at-selected-count');
  if (countEl) countEl.textContent = '';
['at-project','at-detail','at-end','at-onedrive-link'].forEach(id => { const el=document.getElementById(id); if(el) el.value=''; });
  if (atFile) { atFile.value=''; document.getElementById('at-file-preview').innerHTML='<div style="display:flex;align-items:center;gap:10px;justify-content:center"><span style="font-size:20px">📎</span><div><div class="upload-zone-text">Click to attach file</div><div class="upload-zone-hint">PDF, Image, Excel, DWG — max 10MB</div></div></div>'; }
  setTimeout(()=>msg.textContent='',5000);
  loadNotifications();
}

// ═══════════════════════════════════════════
//  ATTENDANCE
// ═══════════════════════════════════════════
async function loadAttendance() {
  const today = new Date().toISOString().split('T')[0];
  const { data: todayAtt } = await sb.from('attendance').select('*').eq('employee_email',currentUser.email).eq('date',today).eq('is_archived',false).maybeSingle();
  const checkInBtn = document.getElementById('checkInBtn');
  const checkOutBtn = document.getElementById('checkOutBtn');
  const checkedMsg = document.getElementById('attCheckedMsg');
  const statusText = document.getElementById('attStatusText');
  if (!todayAtt) {
    checkInBtn.style.display='block'; checkOutBtn.style.display='none'; checkedMsg.style.display='none';
    statusText.textContent='You have not checked in today.';
  } else if (todayAtt.check_in && !todayAtt.check_out) {
    checkInBtn.style.display='none'; checkOutBtn.style.display='block'; checkedMsg.style.display='none';
    statusText.textContent='Checked in at '+new Date(todayAtt.check_in).toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'});
  } else {
    checkInBtn.style.display='none'; checkOutBtn.style.display='none';
    checkedMsg.style.display='block'; checkedMsg.textContent='✅ Attendance complete for today!';
    statusText.textContent='In: '+new Date(todayAtt.check_in).toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'})+' | Out: '+new Date(todayAtt.check_out).toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'});
  }
const now = new Date();
  const monthStart = now.getFullYear() + '-' + String(now.getMonth()+1).padStart(2,'0') + '-01';
  const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth()+1, 0).getDate();
  const monthEndStr = now.getFullYear() + '-' + String(now.getMonth()+1).padStart(2,'0') + '-' + String(lastDayOfMonth).padStart(2,'0');
  const { data: monthAtt } = await sb.from('attendance').select('status,date').eq('employee_email',currentUser.email).eq('is_archived',false).gte('date',monthStart);
  const { data: monthLeaves } = await sb.from('leaves').select('*').eq('employee_email',currentUser.email).eq('status','Approved').lte('from_date',monthEndStr).gte('to_date',monthStart);
 let leaveCountThisMonth = (monthLeaves||[]).reduce((sum,l) => sum + (parseFloat(l.total_days) || 0), 0);
const presentDatesSet = new Set((monthAtt||[]).map(a=>a.date));
const presentCount = (monthAtt||[]).filter(a=>a.status==='Present').length;
  const halfCount = (monthAtt||[]).filter(a=>a.status==='Half Day').length;
  const todayForCalc = new Date(); todayForCalc.setHours(0,0,0,0);
  let absentCount = 0;
  const dInLoop = new Date(now.getFullYear(), now.getMonth(), 1);
  while (dInLoop.getMonth() === now.getMonth()) {
    const dsLoop = dInLoop.getFullYear() + '-' + String(dInLoop.getMonth()+1).padStart(2,'0') + '-' + String(dInLoop.getDate()).padStart(2,'0');
    const isSundayLoop = dInLoop.getDay() === 0;
    const hasAttLoop = presentDatesSet.has(dsLoop);
    const isOnLeaveLoop = (monthLeaves||[]).some(l => dsLoop >= l.from_date && dsLoop <= l.to_date);
    const isFutureLoop = dInLoop > todayForCalc;
    if (!hasAttLoop && !isSundayLoop && !isOnLeaveLoop && !isFutureLoop) absentCount++;
    dInLoop.setDate(dInLoop.getDate()+1);
  }
  document.getElementById('att-present').textContent=presentCount;
  document.getElementById('att-absent').textContent=absentCount;
  document.getElementById('att-half').textContent=halfCount;
  document.getElementById('att-leave').textContent=leaveCountThisMonth;
  const { data: allAtt } = await sb.from('attendance').select('*').eq('employee_email',currentUser.email).eq('is_archived',false).order('date',{ascending:false}).limit(30);
  const tbody = document.getElementById('attBody');
  if (!allAtt||!allAtt.length) {
    tbody.innerHTML='<tr><td colspan="7" style="text-align:center;color:var(--muted);padding:30px">No attendance records</td></tr>'; return;
  }
  const days2 = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  tbody.innerHTML = allAtt.map(a=>{
    const d = new Date(a.date);
const isWeekend = d.getDay()===0;
    return `<tr style="${isWeekend?'background:#f8f9fc':''}">
    <td style="font-weight:600">${fmtDate(a.date)}</td>
    <td style="font-size:11px;color:${isWeekend?'var(--muted)':'var(--text)'}">${days2[d.getDay()]}</td>
    <td>${a.check_in?new Date(a.check_in).toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'}):'—'}</td>
    <td>${a.check_out?new Date(a.check_out).toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'}):'—'}</td>
    <td style="font-weight:600">${a.working_hours?parseFloat(a.working_hours).toFixed(1)+' hrs':'—'}</td>
    <td>${attBadge(a.status)}</td>
    <td><button class="btn btn-sm" onclick="deleteAttendance('${a.id}')" style="background:#fdf0ee;color:var(--red);border-color:var(--red-bg)">🗑️</button></td>
  </tr>`;
  }).join('');
}

function initAttMonth() {
  const now = new Date();
  const monthEl = document.getElementById('att-my-month');
  if (monthEl && !monthEl.value) {
    monthEl.value = now.getFullYear() + '-' + String(now.getMonth()+1).padStart(2,'0');
    loadMyAttendance();
  }
}

async function markCheckIn() {
  const now = new Date();
  const today = now.toISOString().split('T')[0];
  const btn = document.getElementById('checkInBtn');
  btn.disabled=true; btn.textContent='Checking in...';
  const { data: emp } = await sb.from('employees').select('id').eq('email',currentUser.email).single();
  const { error } = await sb.from('attendance').insert({
    employee_id: emp?.id, employee_email: currentUser.email,
    employee_name: currentUser.name, date: today,
check_in: now.toISOString(), status: new Date().getHours() >= 13 ? 'Half Day' : 'Present'
  });
  btn.disabled=false; btn.textContent='✅ Check In';
  if (error) { showToast('❌ '+error.message,'err'); return; }
  showToast('✅ Checked in at '+now.toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'}),'ok');
  loadAttendance();
}

async function markCheckOut() {
  const now = new Date();
  const today = now.toISOString().split('T')[0];
  const btn = document.getElementById('checkOutBtn');
  btn.disabled=true; btn.textContent='Checking out...';
  const { data: todayAtt } = await sb.from('attendance').select('*').eq('employee_email',currentUser.email).eq('date',today).eq('is_archived',false).maybeSingle();
  if (!todayAtt) { showToast('❌ No check-in found!','err'); btn.disabled=false; btn.textContent='🚪 Check Out'; return; }
  const hrs = ((now - new Date(todayAtt.check_in))/3600000).toFixed(2);
  const status = parseFloat(hrs) >= 5 ? 'Present' : parseFloat(hrs) >= 2 ? 'Half Day' : 'Half Day';
  const { error } = await sb.from('attendance').update({
    check_out: now.toISOString(), working_hours: hrs, status
  }).eq('id',todayAtt.id);
  btn.disabled=false; btn.textContent='🚪 Check Out';
  if (error) { showToast('❌ '+error.message,'err'); return; }
  showToast(`✅ Checked out! Worked ${parseFloat(hrs).toFixed(1)} hrs — ${status}`,'ok');
  loadAttendance();
}

// ═══════════════════════════════════════════
//  LEAVES
// ═══════════════════════════════════════════
async function loadLeaves() {
  const { data } = await sb.from('leaves').select('*').eq('employee_email',currentUser.email).order('created_at',{ascending:false});
  const leaves = data || [];
  const pending = leaves.filter(l=>l.status==='Pending').length;
const taken = leaves.filter(l=>l.status==='Approved').reduce((s,l)=>s+(l.leave_type==='Half Day'?0.5:(l.total_days||0)),0);
  const rejected = leaves.filter(l=>l.status==='Rejected').length;
  document.getElementById('lv-pending').textContent=pending;
  document.getElementById('lv-taken').textContent=taken;
  document.getElementById('lv-rejected') && (document.getElementById('lv-rejected').textContent=rejected);
  document.getElementById('lv-balance').textContent=Math.max(0,12-taken);
  
  // Leave breakdown by type
  const bdEl = document.getElementById('leaveBreakdown');
  if (bdEl) {
    const types = ['Casual','Sick','Earned','Unpaid'];
    bdEl.innerHTML = types.map(t => {
      const count = leaves.filter(l=>l.leave_type===t&&l.status==='Approved').reduce((s,l)=>s+(l.total_days||0),0);
      return `<div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid #f5f6fa">
        <span style="font-size:12px;color:var(--muted)">${t} Leave</span>
        <span style="font-size:13px;font-weight:700;color:var(--navy)">${count} day${count!==1?'s':''}</span>
      </div>`;
    }).join('');
  }
  const tbody = document.getElementById('leaveBody');
  if (!leaves.length) {
    tbody.innerHTML='<tr><td colspan="7" style="text-align:center;color:var(--muted);padding:30px">No leave records</td></tr>'; return;
  }
  tbody.innerHTML = leaves.map(l=>`<tr>
    <td><span class="badge b-blue">${esc(l.leave_type)}</span></td>
    <td style="font-size:12px">${fmtDate(l.from_date)}</td>
    <td style="font-size:12px">${fmtDate(l.to_date)}</td>
    <td style="font-weight:700">${l.total_days||1}</td>
    <td style="font-size:12px;color:var(--muted)">${esc(l.reason||'—')}</td>
    <td>${leaveBadge(l.status)}</td>
    <td>${l.status==='Pending'?`<button onclick="cancelLeave('${l.id}')" style="background:#fdf0ee;color:var(--red);border:1px solid var(--red-bg);border-radius:6px;padding:3px 10px;font-size:11px;cursor:pointer;font-family:'DM Sans',sans-serif">Cancel</button>`:'—'}</td>
  </tr>`).join('');
}

async function applyLeave() {
  const btn = document.querySelector('#leaveForm button') || document.querySelector('[onclick="applyLeave()"]');
  if (btn && btn.disabled) return;
  if (btn) { btn.disabled = true; btn.textContent = 'Applying...'; }
  const type=document.getElementById('lv-type').value;
  const from=document.getElementById('lv-from').value;
  const to=document.getElementById('lv-to').value;
  const reason=document.getElementById('lv-reason').value.trim();
  const msg=document.getElementById('leaveMsg');
  if (!from||!to||!reason) { 
    msg.textContent='⚠️ Fill all fields'; 
    msg.style.color='var(--red)'; 
    if (btn) { btn.disabled = false; btn.textContent = 'Apply Leave'; }
    return; 
  }
const days = type === 'Half Day' ? 0.5 : Math.ceil((new Date(to)-new Date(from))/86400000)+1;
  const { data: emp } = await sb.from('employees').select('id').eq('email',currentUser.email).single();
  const { error } = await sb.from('leaves').insert({
    employee_id: emp?.id, employee_email: currentUser.email,
    employee_name: currentUser.name,
    leave_type: type, from_date: from, to_date: to,
    total_days: days, reason, status: 'Pending'
  });
  if (error) { 
    msg.textContent='❌ '+error.message; 
    msg.style.color='var(--red)'; 
    if (btn) { btn.disabled = false; btn.textContent = 'Apply Leave'; }
    return; 
  }
  msg.textContent='✅ Leave applied!'; msg.style.color='var(--green)';
  showToast('✅ Leave application submitted!','ok');
  if (btn) { btn.disabled = false; btn.textContent = 'Apply Leave'; }
  await createNotification(
    CEO_EMAIL,
    `🏖️ Leave request from ${currentUser.name}`,
    `${currentUser.name} applied for ${type} leave from ${from} to ${to} (${days} days).`,
    'leave', 'leaveApprove'
  );
  await sendEmail(CEO_EMAIL,'CEO',`Leave Request — ${currentUser.name}`,
    `${currentUser.name} has applied for ${type} leave.\nFrom: ${from}\nTo: ${to}\nDays: ${days}\nReason: ${reason}\n\nLogin to approve:\nsayash-vastu-portal.vercel.app`);
  document.getElementById('lv-from').value='';
  document.getElementById('lv-to').value='';
  document.getElementById('lv-reason').value='';
  loadLeaves();
  setTimeout(()=>msg.textContent='',4000);
}

// ═══════════════════════════════════════════
//  NOTICES
// ═══════════════════════════════════════════
async function loadNotices() {
const now = new Date().toISOString();
  const { data } = await sb.from('notices').select('*').eq('is_active',true).or(`expires_at.is.null,expires_at.gt.${now}`).order('created_at',{ascending:false});
  const { data: myReactions } = await sb.from('notice_reactions').select('*').eq('employee_email', currentUser.email);
  const myReactionMap = {};
  (myReactions||[]).forEach(r => {
    if (!myReactionMap[r.notice_id]) myReactionMap[r.notice_id] = [];
    myReactionMap[r.notice_id].push(r.reaction);
  });
  const { data: allReactions } = await sb.from('notice_reactions').select('*');
  const reactionCountMap = {};
  (allReactions||[]).forEach(r => {
    if (!reactionCountMap[r.notice_id]) reactionCountMap[r.notice_id] = {};
    reactionCountMap[r.notice_id][r.reaction] = (reactionCountMap[r.notice_id][r.reaction]||0) + 1;
  });
  const el = document.getElementById('noticesList');
  if (!data||!data.length) {
    el.innerHTML='<div class="empty-state"><div class="empty-icon">📢</div><div class="empty-title">No notices yet</div></div>'; return;
  }
  el.innerHTML = data.map(n=>{
    const myR = myReactionMap[n.id]||[];
    const counts = reactionCountMap[n.id]||{};
    const emojis = ['👍','❤️','😂','😮','🙏'];
    const reactHtml = emojis.map(e=>{
      const count = counts[e]||0;
      const active = myR.includes(e);
      return `<button onclick="toggleReaction('${n.id}','${e}')" style="background:${active?'var(--gold)':'#f1f3f7'};border:1.5px solid ${active?'var(--gold)':'var(--border)'};border-radius:20px;padding:4px 10px;cursor:pointer;font-size:13px;font-family:'DM Sans',sans-serif;font-weight:600;color:${active?'var(--navy)':'var(--muted)'};transition:all 0.15s">
        ${e}${count>0?` <span style="font-size:11px">${count}</span>`:''}
      </button>`;
    }).join('');
    return `<div class="notice-card ${n.priority.toLowerCase()}">
      <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:10px">
        <div class="notice-title">${esc(n.title)}</div>
        <span class="badge ${n.priority==='Urgent'?'b-red':n.priority==='High'?'b-gold':'b-blue'}">${n.priority}</span>
      </div>
      <div class="notice-body" style="margin-top:8px">${esc(n.content)}</div>
      <div class="notice-meta" style="justify-content:space-between">
        <div style="display:flex;gap:12px">
          <span>👤 ${esc(n.created_by_name)}</span>
          <span>🕐 ${new Date(n.created_at).toLocaleDateString('en-IN')}</span>
          <span>🎯 ${esc(n.target)}</span>
        </div>
        ${currentUser.role==='ceo'||currentUser.role==='manager'?`<button onclick="deleteNotice('${n.id}')" style="background:#fdf0ee;color:var(--red);border:1px solid var(--red-bg);border-radius:6px;padding:3px 10px;font-size:11px;cursor:pointer;font-family:'DM Sans',sans-serif">🗑️ Delete</button>`:''}
      </div>
      <div style="margin-top:10px;display:flex;gap:6px;flex-wrap:wrap">
        ${reactHtml}
      </div>
    </div>`;
  }).join('');
}
async function toggleReaction(noticeId, emoji) {
  const { data: existing } = await sb.from('notice_reactions')
    .select('*')
    .eq('notice_id', noticeId)
    .eq('employee_email', currentUser.email)
    .eq('reaction', emoji)
    .maybeSingle();

  if (existing) {
    await sb.from('notice_reactions').delete().eq('id', existing.id);
  } else {
    await sb.from('notice_reactions').insert({
      notice_id: noticeId,
      employee_email: currentUser.email,
      employee_name: currentUser.name,
      reaction: emoji
    });
  }
  loadNotices();
}
async function postNotice() {
  const title=document.getElementById('nt-title').value.trim();
  const content=document.getElementById('nt-content').value.trim();
  const priority=document.getElementById('nt-priority').value;
  const target=document.getElementById('nt-target').value;
  const msg=document.getElementById('noticeMsg');
  if (!title||!content) { msg.textContent='⚠️ Fill all fields'; msg.style.color='var(--red)'; return; }
  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + 3);
  const { error } = await sb.from('notices').insert({
    title, content, priority, target,
    created_by_email: currentUser.email, created_by_name: currentUser.name,
    expires_at: expiryDate.toISOString()
  });
  if (error) { msg.textContent='❌ '+error.message; msg.style.color='var(--red)'; return; }
  msg.textContent='✅ Notice posted!'; msg.style.color='var(--green)';
  showToast('✅ Notice posted!','ok');
  // Notify all employees
  const { data: allEmpsNotif } = await sb.from('employees').select('email').eq('is_active',true);
  for (const emp of (allEmpsNotif||[])) {
    if (emp.email !== currentUser.email) {
      await createNotification(emp.email, `📢 New Notice: ${title}`, content.substring(0,100), 'notice', 'notices');
    }
  }
  document.getElementById('nt-title').value='';
  document.getElementById('nt-content').value='';
  loadNotices();
  loadNotifications();
  setTimeout(()=>msg.textContent='',4000);
}

// ═══════════════════════════════════════════
//  ALL TASKS CEO
// ═══════════════════════════════════════════
async function loadAllTasks() {
  const { data } = await sb.from('tasks').select('*').eq('is_archived',false).order('created_at',{ascending:false});
// Deduplicate by id
const seen = new Set();
allTasksData = (data || []).filter(t => {
    if (seen.has(t.id)) return false;
    seen.add(t.id);
    return true;
});
  renderAllTasks();
  const today=new Date(); today.setHours(0,0,0,0);
  const total=allTasksData.length;
  const ip=allTasksData.filter(t=>t.work_status==='In Progress').length;
  const done=allTasksData.filter(t=>t.work_status==='Completed').length;
  const delayed=allTasksData.filter(t=>{
    const ed=t.end_date?new Date(t.end_date):null;
    return ed&&today>ed&&t.work_status!=='Completed';
  }).length;
  document.getElementById('allTaskStats').innerHTML=`
    <div class="stat-card sc-navy"><div class="stat-icon">📋</div><div class="stat-num">${total}</div><div class="stat-lbl">Total Tasks</div></div>
    <div class="stat-card sc-blue"><div class="stat-icon">⚡</div><div class="stat-num">${ip}</div><div class="stat-lbl">In Progress</div></div>
    <div class="stat-card sc-red"><div class="stat-icon">⚠️</div><div class="stat-num">${delayed}</div><div class="stat-lbl">Delayed</div></div>
    <div class="stat-card sc-green"><div class="stat-icon">✅</div><div class="stat-num">${done}</div><div class="stat-lbl">Completed</div></div>
  `;
}

function filterAllTasks(val) { allTasksFilter=val; renderAllTasks(); }

async function renderAllTasks() {
  const today=new Date(); today.setHours(0,0,0,0);
  let data=allTasksData;
  if (allTasksFilter==='Delayed') {
    data=data.filter(t=>{ const ed=t.end_date?new Date(t.end_date):null; return ed&&today>ed&&t.work_status!=='Completed'; });
  } else if (allTasksFilter!=='all') {
    data=data.filter(t=>t.work_status===allTasksFilter);
  }
  const tbody=document.getElementById('allTasksBody');
  if (!data.length) { tbody.innerHTML='<tr><td colspan="8" style="text-align:center;color:var(--muted);padding:30px">No tasks</td></tr>'; return; }

  // Get files for all tasks
  const fileMap = {};
  await Promise.all(data.slice(0,20).map(async t => {
    fileMap[t.id] = await getTaskFiles(t.id);
  }));

  tbody.innerHTML=data.map((t,i)=>{
    const endDate2=t.end_date?new Date(t.end_date):null;
    const isLate=endDate2&&today>endDate2&&t.work_status!=='Completed';
    const files=fileMap[t.id]||[];
    return `<tr style="${isLate?'background:#fdf0ee':''}">
      <td style="color:var(--muted);font-size:11px">${i+1}</td>
      <td><span style="background:#e8ecf5;color:var(--navy);padding:2px 8px;border-radius:4px;font-size:11px;font-weight:700">${esc(t.project)}</span></td>
      <td style="font-weight:600;max-width:160px;font-size:12px">${esc(t.task_detail.substring(0,45))}...</td>
      <td style="font-size:12px">${esc(t.assigned_to_name)}</td>
      <td style="font-size:11px;font-weight:${isLate?'700':'400'};color:${isLate?'var(--red)':'var(--text)'}">${fmtDate(t.end_date)}${isLate?' ⚠️':''}</td>
      <td>${statusBadge(t.work_status)}</td>
<td>${t.pending_with_name?`<span style="font-size:11px;font-weight:600;color:var(--purple)">📌 ${esc(t.pending_with_name)}</span>`:(t.approval_type&&t.approval_status==='Pending')?`<span style="font-size:11px;font-weight:600;color:var(--amber)">⏳ ${esc(t.approval_type)}</span>`:'<span style="color:var(--muted);font-size:11px">—</span>'}</td>
      <td>${files.length?renderFileChips(files):'<span style="color:var(--muted);font-size:11px">—</span>'}</td>
      <td style="display:flex;gap:5px">
        <button class="btn btn-primary btn-sm" onclick="openTaskViewModal('${t.id}')">👁️ View</button>
        <button class="btn btn-sm" onclick="deleteTask('${t.id}',true)" style="background:#fdf0ee;color:var(--red);border-color:var(--red-bg)">🗑️</button>
      </td>
    </tr>`;
  }).join('');
}

// ═══════════════════════════════════════════
//  EMPLOYEES CEO
// ═══════════════════════════════════════════
async function loadEmployees() {
const { data } = await sb.from('employees').select('*').order('employee_code',{ascending:true});
  const tbody=document.getElementById('employeesBody');
  if (!data||!data.length) { tbody.innerHTML='<tr><td colspan="7" style="text-align:center;color:var(--muted);padding:30px">No employees</td></tr>'; return; }
  tbody.innerHTML=data.map(e=>`<tr>
    <td style="font-weight:700;color:var(--navy)">${esc(e.employee_code)}</td>
    <td>
      <div style="display:flex;align-items:center;gap:10px">
        <div class="av" style="background:var(--navy)">${esc(e.name).substring(0,2).toUpperCase()}</div>
        <span style="font-weight:600">${esc(e.name)}</span>
      </div>
    </td>
    <td style="font-size:12px">${esc(e.email)}</td>
    <td style="font-size:12px">${esc(e.department||'—')}</td>
    <td style="font-size:12px">${esc(e.designation||'—')}</td>
    <td style="font-size:12px">${e.date_of_birth?fmtDate(e.date_of_birth):'—'}</td>
    <td><span class="badge ${e.role==='ceo'?'b-gold':e.role==='manager'?'b-purple':'b-navy'}">${e.role.toUpperCase()}</span></td>
    <td>
      <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap">
<span class="badge ${e.is_active?'b-green':'b-red'}">${e.is_active?'Active':'Inactive'}</span>
        ${e.role!=='ceo'?`<button class="btn btn-sm" onclick="toggleEmployee('${e.id}',${e.is_active})" style="padding:3px 8px;font-size:10px;background:${e.is_active?'#fdf0ee':'#e6f5ee'};color:${e.is_active?'var(--red)':'var(--green)'};border-color:${e.is_active?'var(--red-bg)':'var(--green-bg)'}">${e.is_active?'Deactivate':'Activate'}</button>`:''}
        ${!e.is_active && e.role!=='ceo'?`<button class="btn btn-sm" onclick="permanentlyDeleteEmployee('${e.id}','${esc(e.name)}','${e.email}')" style="padding:3px 8px;font-size:10px;background:#fdf0ee;color:var(--red);border-color:var(--red-bg)">🗑️ Delete Permanently</button>`:''}
        ${currentUser && (currentUser.role==='ceo'||currentUser.role==='manager')?`
          <button class="btn btn-sm" onclick="openEditEmpModal('${e.id}','${esc(e.name)}','${esc(e.employee_code)}','${esc(e.department||'')}','${esc(e.designation||'')}','${e.joining_date||''}','${e.role}')" style="padding:3px 8px;font-size:10px;background:#e6f5ee;color:var(--green);border-color:#b8e0c8">✏️ Edit</button>
          <button class="btn btn-sm" onclick="openPassModal('${e.id}','${esc(e.name)}','${esc(e.email)}')" style="padding:3px 8px;font-size:10px;background:#eef2fb;color:var(--blue);border-color:#c0d0f0">🔑 Pass</button>
          <button class="btn btn-sm" onclick="openPhotoModal('${e.id}','${esc(e.name)}','${esc(e.email)}')" style="padding:3px 8px;font-size:10px;background:#f0ebff;color:var(--purple);border-color:#d4c5f9">📷 Photo</button>
        `:''}
      </div>
    </td>
  </tr>`).join('');
}

async function permanentlyDeleteEmployee(id, name, email) {
  if (!confirm(`⚠️ PERMANENTLY DELETE ${name}?\n\nYeh action undo nahi ho sakti! Sab tasks, attendance, leaves bhi delete ho jayenge.\n\nConfirm karo?`)) return;
  if (!confirm(`Final confirmation: ${name} ko DB se hamesha ke liye delete karna hai?`)) return;
  
  await sb.from('tasks').delete().eq('assigned_to_email', email);
  await sb.from('attendance').delete().eq('employee_email', email);
  await sb.from('leaves').delete().eq('employee_email', email);
  await sb.from('expense_claims').delete().eq('employee_email', email);
  
  const { error } = await sb.from('employees').delete().eq('id', id);
  if (error) { showToast('❌ ' + error.message, 'err'); return; }
  
  showToast(`✅ ${name} permanently deleted!`, 'ok');
  loadEmployees();
}
function openAddEmpModal() { document.getElementById('addEmpModal').classList.add('open'); }

async function addEmployee() {
  const name=document.getElementById('ae-name').value.trim();
  const email=document.getElementById('ae-email').value.trim();
  const phone=document.getElementById('ae-phone').value.trim();
  const code=document.getElementById('ae-code').value.trim();
  const dept=document.getElementById('ae-dept').value.trim();
  const desig=document.getElementById('ae-desig').value.trim();
  const role=document.getElementById('ae-role').value;
  const pass=document.getElementById('ae-pass').value.trim();
  if (!name||!email||!code||!pass) { showToast('⚠️ Fill required fields!','err'); return; }
  const dob = document.getElementById('ae-dob').value;
  const joining = document.getElementById('ae-joining').value;
  const photoFile = document.getElementById('ae-photo').files[0];
  
  const { data: newEmp, error } = await sb.from('employees').insert({
    name, email: email.toLowerCase(), phone, employee_code: code,
    department: dept, designation: desig, role, password_hash: pass,
    date_of_birth: dob || null, joining_date: joining || null
  }).select().single();
  
  // Upload photo if selected
  if (!error && newEmp && photoFile) {
    const photoPath = `${newEmp.id}/profile.${photoFile.name.split('.').pop()}`;
    const { data: uploadData } = await sb.storage.from('employee-photos').upload(photoPath, photoFile, {upsert: true});
    if (uploadData) {
      const { data: urlData } = sb.storage.from('employee-photos').getPublicUrl(photoPath);
      await sb.from('employees').update({photo_url: urlData.publicUrl}).eq('id', newEmp.id);
    }
  }
  if (error) { showToast('❌ '+error.message,'err'); return; }
  showToast('✅ Employee added!','ok');
  closeModal('addEmpModal');
  loadEmployees(); loadEmployeeAutocomplete();
}

async function loadOfferLetters() {
  const { data } = await sb.from('employees').select('*').eq('is_active', true).neq('role', 'ceo').order('employee_code', { ascending: true });
  const tbody = document.getElementById('offerLettersBody');
  if (!data || !data.length) {
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:var(--muted);padding:30px">No employees</td></tr>';
    return;
  }
  tbody.innerHTML = data.map(e => `<tr>
    <td style="font-weight:700;color:var(--navy)">${esc(e.employee_code)}</td>
    <td>
      <div style="display:flex;align-items:center;gap:10px">
        <div class="av" style="background:var(--navy)">${esc(e.name).substring(0,2).toUpperCase()}</div>
        <span style="font-weight:600">${esc(e.name)}</span>
      </div>
    </td>
    <td style="font-size:12px">${esc(e.designation||'—')}</td>
    <td>${e.offer_letter_url ? `<a href="${e.offer_letter_url}" target="_blank" class="btn btn-outline btn-sm" style="background:#E6F1FB;border-color:#378ADD;color:#185FA5">📄 View</a>` : '<span style="color:var(--muted);font-size:11px">Not uploaded</span>'}</td>
<td>
      <input type="file" id="ol-file-${e.id}" accept=".pdf,.doc,.docx" style="display:none" onchange="uploadOfferLetter('${e.id}','${esc(e.name)}',this)">
      <button class="btn btn-gold btn-sm" onclick="document.getElementById('ol-file-${e.id}').click()">⬆️ ${e.offer_letter_url ? 'Replace' : 'Upload'}</button>
      ${e.offer_letter_url ? `<button class="btn btn-sm" onclick="deleteOfferLetter('${e.id}','${esc(e.name)}')" style="background:#fdf0ee;color:var(--red);border-color:var(--red-bg);margin-left:4px">🗑️</button>` : ''}
    </td>
  </tr>`).join('');
}

async function uploadOfferLetter(empId, empName, input) {
  const file = input.files[0];
  if (!file) return;
  if (file.size > 10 * 1024 * 1024) { showToast('❌ File too large (max 10MB)', 'err'); return; }
  const path = `offer-letters/${empId}_${Date.now()}_${file.name.replace(/[^a-z0-9.]/gi,'_')}`;
  const { error: uploadErr } = await sb.storage.from('Task-Files').upload(path, file, {upsert: true});
  if (uploadErr) { showToast('❌ Upload failed: ' + uploadErr.message, 'err'); return; }
  const { data: urlData } = sb.storage.from('Task-Files').getPublicUrl(path);
  const { error } = await sb.from('employees').update({ offer_letter_url: urlData.publicUrl }).eq('id', empId);
  if (error) { showToast('❌ ' + error.message, 'err'); return; }
  showToast(`✅ Offer letter uploaded for ${empName}!`, 'ok');
  loadOfferLetters();
}
async function deleteOfferLetter(empId, empName) {
  if (!confirm(`Delete offer letter for ${empName}?`)) return;
  const { error } = await sb.from('employees').update({ offer_letter_url: null }).eq('id', empId);
  if (error) { showToast('❌ ' + error.message, 'err'); return; }
  showToast(`✅ Offer letter deleted!`, 'ok');
  loadOfferLetters();
}
async function loadSalaryStructure() {
  const { data } = await sb.from('employees').select('*').eq('is_active', true).neq('role', 'ceo').order('employee_code', { ascending: true });
  const tbody = document.getElementById('salaryStructureBody');
  if (!data || !data.length) {
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:var(--muted);padding:30px">No employees</td></tr>';
    return;
  }
  tbody.innerHTML = data.map(e => `<tr>
    <td style="font-weight:700;color:var(--navy)">${esc(e.employee_code)}</td>
    <td>
      <div style="display:flex;align-items:center;gap:10px">
        <div class="av" style="background:var(--navy)">${esc(e.name).substring(0,2).toUpperCase()}</div>
        <span style="font-weight:600">${esc(e.name)}</span>
      </div>
    </td>
    <td style="font-size:12px">${esc(e.designation||'—')}</td>
    <td>
      <input type="number" id="sal-${e.id}" value="${e.monthly_salary || 0}" style="width:140px;padding:6px 10px;border:1.5px solid var(--border);border-radius:6px;font-family:'DM Sans',sans-serif">
    </td>
    <td>
      <button class="btn btn-gold btn-sm" onclick="updateSalary('${e.id}','${esc(e.name)}')">💾 Save</button>
    </td>
  </tr>`).join('');
}

async function updateSalary(empId, empName) {
  const val = document.getElementById('sal-' + empId).value;
  const salary = parseFloat(val) || 0;
  const { error } = await sb.from('employees').update({ monthly_salary: salary }).eq('id', empId);
  if (error) { showToast('❌ ' + error.message, 'err'); return; }
  showToast(`✅ Salary updated for ${empName}: ₹${salary.toLocaleString('en-IN')}`, 'ok');
}
// ═══════════════════════════════════════════
//  ATT REPORT CEO
// ═══════════════════════════════════════════
async function loadAttReport() {
  const monthVal=document.getElementById('att-month-filter').value;
  if (!monthVal) return;
  const [yr,mo]=monthVal.split('-');
  const start=`${yr}-${mo}-01`;
  const end=new Date(yr,mo,0).toISOString().split('T')[0];
const { data: emps } = await sb.from('employees').select('name,email').eq('is_active',true).neq('role','ceo');
  const { data: attData } = await sb.from('attendance').select('*').eq('is_archived',false).gte('date',start).lte('date',end);
  const { data: leaveDataReport } = await sb.from('leaves').select('*').eq('status','Approved').lte('from_date',end).gte('to_date',start);
  const tbody=document.getElementById('attReportBody');
  if (!emps) { tbody.innerHTML='<tr><td colspan="7" style="text-align:center;padding:30px">No data</td></tr>'; return; }
  const totalDays=new Date(yr,mo,0).getDate();
  const todayForReport = new Date(); todayForReport.setHours(0,0,0,0);

  // Calculate per-employee Absent/Leave properly
  const empCalc = {};
  emps.forEach(e => {
    const presentDatesR = new Set((attData||[]).filter(a=>a.employee_email===e.email).map(a=>a.date));
    const empLeavesR = (leaveDataReport||[]).filter(l=>l.employee_email===e.email);
    let absentR = 0, leaveR = 0;
    const dIter = new Date(yr, mo-1, 1);
    while (dIter.getMonth() === mo-1) {
      const dsIter = dIter.getFullYear() + '-' + String(dIter.getMonth()+1).padStart(2,'0') + '-' + String(dIter.getDate()).padStart(2,'0');
      const isSunIter = dIter.getDay() === 0;
      const isFutureIter = dIter > todayForReport;
      const onLeaveIter = empLeavesR.find(l => dsIter >= l.from_date && dsIter <= l.to_date);
      if (!presentDatesR.has(dsIter)) {
        if (onLeaveIter) leaveR++;
        else if (!isSunIter && !isFutureIter) absentR++;
      }
      dIter.setDate(dIter.getDate()+1);
    }
    empCalc[e.email] = { absent: absentR, leave: leaveR };
  });

  // Summary cards
  const totalPresent = (attData||[]).filter(a=>a.status==='Present').length;
  const totalAbsent = Object.values(empCalc).reduce((s,v)=>s+v.absent,0);
  const totalHalf = (attData||[]).filter(a=>a.status==='Half Day').length;
 const totalLeave = Object.values(empCalc).reduce((s,v)=>s+v.leave,0);
  const totalLate = (attData||[]).filter(a=>{
    if (!a.check_in) return false;
    const t = new Date(a.check_in);
    return t.getHours() > 10 || (t.getHours() === 10 && t.getMinutes() > 15);
  }).length;
  const avgAtt = emps.length > 0 ? Math.round((totalPresent / (emps.length * totalDays)) * 100) : 0;

  const summaryEl = document.getElementById('att-report-summary');
  if (summaryEl) {
    summaryEl.innerHTML = `
      <div style="display:grid;grid-template-columns:repeat(6,1fr);gap:12px;margin-bottom:20px">
        <div style="background:#fff;border-radius:10px;border:1px solid var(--border);border-top:3px solid var(--green);padding:14px;text-align:center">
          <div style="font-size:22px;font-weight:800;color:var(--green)">${totalPresent}</div>
          <div style="font-size:10px;color:var(--muted);margin-top:4px;font-weight:700;text-transform:uppercase">Total Present</div>
        </div>
        <div style="background:#fff;border-radius:10px;border:1px solid var(--border);border-top:3px solid var(--red);padding:14px;text-align:center">
          <div style="font-size:22px;font-weight:800;color:var(--red)">${totalAbsent}</div>
          <div style="font-size:10px;color:var(--muted);margin-top:4px;font-weight:700;text-transform:uppercase">Total Absent</div>
        </div>
        <div style="background:#fff;border-radius:10px;border:1px solid var(--border);border-top:3px solid var(--amber);padding:14px;text-align:center">
          <div style="font-size:22px;font-weight:800;color:var(--amber)">${totalHalf}</div>
          <div style="font-size:10px;color:var(--muted);margin-top:4px;font-weight:700;text-transform:uppercase">Half Day</div>
        </div>
        <div style="background:#fff;border-radius:10px;border:1px solid var(--border);border-top:3px solid var(--blue);padding:14px;text-align:center">
          <div style="font-size:22px;font-weight:800;color:var(--blue)">${totalLeave}</div>
          <div style="font-size:10px;color:var(--muted);margin-top:4px;font-weight:700;text-transform:uppercase">Total Leave</div>
        </div>
        <div style="background:#fff;border-radius:10px;border:1px solid var(--border);border-top:3px solid var(--red);padding:14px;text-align:center">
          <div style="font-size:22px;font-weight:800;color:var(--red)">${totalLate}</div>
          <div style="font-size:10px;color:var(--muted);margin-top:4px;font-weight:700;text-transform:uppercase">Late Marks</div>
        </div>
        <div style="background:var(--navy);border-radius:10px;padding:14px;text-align:center">
          <div style="font-size:22px;font-weight:800;color:#fff">${avgAtt}%</div>
          <div style="font-size:10px;color:rgba(255,255,255,0.5);margin-top:4px;font-weight:700;text-transform:uppercase">Avg Attendance</div>
        </div>
      </div>
    `;
  }
  tbody.innerHTML=emps.map(e=>{
    const empAtt=(attData||[]).filter(a=>a.employee_email===e.email);
    const present=empAtt.filter(a=>a.status==='Present').length;
    const absent=empCalc[e.email]?.absent || 0;
    const half=empAtt.filter(a=>a.status==='Half Day').length;
    const leave=empCalc[e.email]?.leave || 0;
    const pct=totalDays>0?Math.round((present/totalDays)*100):0;
     const late = empAtt.filter(a=>{
      if (!a.check_in) return false;
      const t = new Date(a.check_in);
      return t.getHours() > 10 || (t.getHours() === 10 && t.getMinutes() > 15);
    }).length;
    return `<tr>
      <td style="font-weight:600">${esc(e.name)}</td>
      <td><span class="badge b-green">${present}</span></td>
      <td><span class="badge b-red">${absent}</span></td>
<td>${half > 0 ? `<span class="badge b-amber" title="${empAtt.filter(a=>a.status==='Half Day').map(a=>a.date).join(', ')}" style="cursor:help">${half}</span>` : `<span class="badge b-amber">0</span>`}</td>
      <td><span class="badge b-blue">${leave}</span></td>
<td><span class="badge ${late===0?'b-green':'b-red'}">${late}</span></td>
      <td style="font-weight:700">${totalDays}</td>
      <td style="font-size:11px">
        ${empAtt.filter(a=>a.status==='Half Day').length > 0 ? `<span class="badge b-amber">Half Day: ${empAtt.filter(a=>a.status==='Half Day').map(a=>fmtDate(a.date)).join(', ')}</span>` : ''}
        ${empAtt.filter(a=>a.status==='Leave').length > 0 ? `<span class="badge b-blue">Leave: ${empAtt.filter(a=>a.status==='Leave').map(a=>fmtDate(a.date)).join(', ')}</span>` : ''}
        ${empAtt.filter(a=>a.status==='Half Day').length === 0 && empAtt.filter(a=>a.status==='Leave').length === 0 ? '—' : ''}
      </td>
      <td>
        <div style="display:flex;align-items:center;gap:8px">
          <div class="progress-bar" style="width:80px">
            <div class="progress-fill" style="width:${pct}%;background:${pct>=80?'var(--green)':pct>=60?'var(--amber)':'var(--red)'}"></div>
          </div>
          <span style="font-size:12px;font-weight:700;color:${pct>=80?'var(--green)':pct>=60?'var(--amber)':'var(--red)'}">${pct}%</span>
        </div>
      </td>
      <td><button class="btn btn-sm" onclick="deleteEmpAttendance('${e.email}','${monthVal}')" style="background:#fdf0ee;color:var(--red);border-color:var(--red-bg)">🗑️</button></td>
    </tr>`;
  }).join('');
}

// ═══════════════════════════════════════════
//  LEAVE APPROVALS CEO
// ═══════════════════════════════════════════
async function loadLeaveApprovals() {
  const { data } = await sb.from('leaves').select('*').eq('is_archived',false).order('created_at',{ascending:false});
  const el=document.getElementById('leaveApproveList');
  if (!data||!data.length) {
    el.innerHTML='<div class="empty-state"><div class="empty-icon">✅</div><div class="empty-title">No leave requests</div></div>'; return;
  }
  const pending=data.filter(l=>l.status==='Pending');
  const others=data.filter(l=>l.status!=='Pending');
  el.innerHTML=(pending.length?`
    <div class="section-div"><div class="sd-line"></div><div class="sd-label">Pending Requests (${pending.length})</div><div class="sd-line"></div></div>
    ${pending.map(l=>leaveCard(l,true)).join('')}
  `:'')+(others.length?`
    <div class="section-div"><div class="sd-line"></div><div class="sd-label">Processed Requests</div><div class="sd-line"></div></div>
    ${others.map(l=>leaveCard(l,false)).join('')}
  `:'');
  document.getElementById('nb-leave-approve').textContent=pending.length;
  document.getElementById('nb-leave-approve').style.display=pending.length>0?'inline-block':'none';
}

function leaveCard(l, canApprove) {
  return `<div class="leave-action-card">
    <div class="leave-action-head">
      <div>
        <div style="font-size:14px;font-weight:700;color:var(--navy)">${esc(l.employee_name)}</div>
        <div style="font-size:12px;color:var(--muted);margin-top:3px">
          <span class="badge b-blue" style="margin-right:6px">${esc(l.leave_type)}</span>
          ${fmtDate(l.from_date)} → ${fmtDate(l.to_date)} · <strong>${l.total_days}</strong> day(s)
        </div>
        <div style="font-size:12px;margin-top:6px;color:var(--text)">${esc(l.reason||'—')}</div>
      </div>
      <div>${leaveBadge(l.status)}</div>
    </div>
    ${canApprove?`<div class="leave-action-actions">
      <button class="btn btn-green btn-sm" onclick="approveLeave('${l.id}','Approved')">✅ Approve</button>
      <button class="btn btn-red btn-sm" onclick="approveLeave('${l.id}','Rejected')">❌ Reject</button>
      <button class="btn btn-sm" onclick="deleteLeaveRecord('${l.id}')" style="background:#fdf0ee;color:var(--red);border-color:var(--red-bg);margin-left:auto">🗑️ Delete</button>
    </div>`:`<div class="leave-action-actions">
      <button class="btn btn-sm" onclick="deleteLeaveRecord('${l.id}')" style="background:#fdf0ee;color:var(--red);border-color:var(--red-bg)">🗑️ Delete Record</button>
    </div>`}
  </div>`;
}

async function approveLeave(id, status) {
  const { data: leave } = await sb.from('leaves').select('*').eq('id',id).single();
  const { error } = await sb.from('leaves').update({
    status, approved_by: currentUser.name, approved_at: new Date().toISOString()
  }).eq('id',id);
  if (error) { showToast('❌ '+error.message,'err'); return; }
  showToast(`✅ Leave ${status}!`,'ok');
  loadNotifications();
  if (leave) {
    // Create notification for employee
    await createNotification(
      leave.employee_email,
      `${status==='Approved'?'✅':'❌'} Leave ${status} by ${currentUser.name}`,
      `Your ${leave.leave_type} leave (${leave.from_date} to ${leave.to_date}) has been ${status}.`,
      'leave', 'leaves'
    );
    const icon=status==='Approved'?'✅':'❌';
    await sendEmail(leave.employee_email, leave.employee_name,
      `${icon} Leave ${status} — Sayash Vastu`,
      `Dear ${leave.employee_name},\n\nYour ${leave.leave_type} leave has been ${status} by ${currentUser.name}.\n\nPeriod: ${leave.from_date} to ${leave.to_date}\nDays: ${leave.total_days}\n\nLogin for details:\nsayash-vastu-portal.vercel.app`
    );
  }
  loadLeaveApprovals();
}

// ═══════════════════════════════════════════
//  DELETE / TOGGLE HELPERS
// ═══════════════════════════════════════════
// Photo preview in add modal
function previewEmpPhoto(input) {
  const file = input.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function(e) {
    document.getElementById('ae-photo-preview').innerHTML = `
      <img src="${e.target.result}" style="width:50px;height:50px;border-radius:50%;object-fit:cover;border:2px solid var(--gold)"/>
      <div>
        <div style="font-size:12px;font-weight:600;color:var(--navy)">${file.name.substring(0,20)}</div>
        <div style="font-size:11px;color:var(--muted)">${(file.size/1024).toFixed(0)} KB</div>
      </div>
    `;
  };
  reader.readAsDataURL(file);
}

// Photo modal
let currentPhotoEmpId = null;
function openPhotoModal(empId, empName, empEmail) {
  currentPhotoEmpId = empId;
  document.getElementById('photoModalName').textContent = empName;
  document.getElementById('photoModalEmail').textContent = empEmail;
  document.getElementById('photoModalAv').textContent = empName.substring(0,2).toUpperCase();
  document.getElementById('photo-file').value = '';
  document.getElementById('photo-modal-preview').innerHTML = `
    <div class="upload-zone-icon">📷</div>
    <div class="upload-zone-text">Click to select photo</div>
    <div class="upload-zone-hint">JPG, PNG — max 2MB</div>`;
  document.getElementById('photoMsg').textContent = '';
  document.getElementById('photoModal').classList.add('open');
}

function previewModalPhoto(input) {
  const file = input.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function(e) {
    document.getElementById('photo-modal-preview').innerHTML = `
      <img src="${e.target.result}" style="width:60px;height:60px;border-radius:50%;object-fit:cover;border:2px solid var(--gold);margin:0 auto;display:block"/>
      <div style="text-align:center;margin-top:8px;font-size:12px;color:var(--muted)">${file.name}</div>`;
  };
  reader.readAsDataURL(file);
}

async function saveEmpPhoto() {
  const file = document.getElementById('photo-file').files[0];
  const msgEl = document.getElementById('photoMsg');
  if (!file) { msgEl.textContent = '⚠️ Please select a photo'; msgEl.style.color = 'var(--red)'; return; }
  if (file.size > 2 * 1024 * 1024) { msgEl.textContent = '❌ File too large (max 2MB)'; msgEl.style.color = 'var(--red)'; return; }
  msgEl.textContent = '⏳ Uploading...'; msgEl.style.color = 'var(--muted)';
  const ext = file.name.split('.').pop();
  const path = `${currentPhotoEmpId}/profile.${ext}`;
  const { error: uploadErr } = await sb.storage.from('employee-photos').upload(path, file, {upsert: true});
  if (uploadErr) { msgEl.textContent = '❌ Upload failed: '+uploadErr.message; msgEl.style.color = 'var(--red)'; return; }
  const { data: urlData } = sb.storage.from('employee-photos').getPublicUrl(path);
  const { error: updateErr } = await sb.from('employees').update({photo_url: urlData.publicUrl}).eq('id', currentPhotoEmpId);
  if (updateErr) { msgEl.textContent = '❌ '+updateErr.message; msgEl.style.color = 'var(--red)'; return; }
  showToast('✅ Photo updated!', 'ok');
  closeModal('photoModal');
  loadEmployees();
  // Update current user if own photo
  if (currentUser && currentUser.id === currentPhotoEmpId) {
    currentUser.photo_url = urlData.publicUrl;
    localStorage.setItem('sv_user', JSON.stringify(currentUser));
    // Update sidebar photo
    const sidebarAvEl2 = document.getElementById('sidebarAv');
    if (sidebarAvEl2) {
      sidebarAvEl2.innerHTML = `<img src="${urlData.publicUrl}?t=${Date.now()}" style="width:36px;height:36px;object-fit:cover;border-radius:50%"/>`;
      sidebarAvEl2.style.background = 'transparent';
    }
    loadEmpDashboard();
  }
}

// Edit Employee
let currentEditEmpId = null;
function openEditEmpModal(empId, empName, empCode, empDept, empDesig, empJoining, empRole) {
  currentEditEmpId = empId;
  document.getElementById('editEmpModalName').textContent = empName;
  document.getElementById('edit-code').value = empCode || '';
  document.getElementById('edit-dept').value = empDept || '';
  document.getElementById('edit-desig').value = empDesig || '';
  document.getElementById('edit-joining').value = empJoining || '';
  document.getElementById('edit-role').value = empRole || 'employee';
  document.getElementById('editEmpMsg').textContent = '';
  document.getElementById('editEmpModal').classList.add('open');
}

async function saveEditEmp() {
  const code = document.getElementById('edit-code').value.trim();
  const dept = document.getElementById('edit-dept').value.trim();
  const desig = document.getElementById('edit-desig').value.trim();
  const joining = document.getElementById('edit-joining').value;
  const role = document.getElementById('edit-role').value;
  const msgEl = document.getElementById('editEmpMsg');

  const { error } = await sb.from('employees').update({
    employee_code: code,
    department: dept,
    designation: desig,
    joining_date: joining || null,
    role: role
  }).eq('id', currentEditEmpId);

  if (error) { msgEl.textContent = '❌ '+error.message; msgEl.style.color = 'var(--red)'; return; }
  showToast('✅ Employee updated!', 'ok');
  closeModal('editEmpModal');
  loadEmployees();
}

// Password change
let currentPassEmpId = null;
function openPassModal(empId, empName, empEmail) {
  currentPassEmpId = empId;
  document.getElementById('passEmpName').textContent = empName;
  document.getElementById('passEmpEmail').textContent = empEmail;
  document.getElementById('new-pass').value = '';
  document.getElementById('passMsg').textContent = '';
  document.getElementById('passModal').classList.add('open');
}

async function savePassword() {
  const newPass = document.getElementById('new-pass').value.trim();
  const msgEl = document.getElementById('passMsg');
  if (!newPass) { msgEl.textContent = '⚠️ Enter a password'; msgEl.style.color = 'var(--red)'; return; }
  if (newPass.length < 6) { msgEl.textContent = '⚠️ Min 6 characters'; msgEl.style.color = 'var(--red)'; return; }
  const { error } = await sb.from('employees').update({ password_hash: newPass }).eq('id', currentPassEmpId);
  if (error) { msgEl.textContent = '❌ ' + error.message; msgEl.style.color = 'var(--red)'; return; }
  showToast('✅ Password updated!', 'ok');
  closeModal('passModal');
}

// ═══════════════════════════════════════════
//  TICKETS
// ═══════════════════════════════════════════
let allTickets = [];
let ticketsFilter = 'all';

const SLA_HOURS = { 'Urgent': 4, 'High': 24, 'Medium': 48, 'Low': 72 };

function updateSLAInfo(priority) {
  const slaMap = {
    'Urgent': 'Response in <strong>1hr</strong>, Resolution in <strong>4hrs</strong>',
    'High': 'Response in <strong>4hrs</strong>, Resolution in <strong>24hrs</strong>',
    'Medium': 'Response in <strong>8hrs</strong>, Resolution in <strong>48hrs</strong>',
    'Low': 'Response in <strong>24hrs</strong>, Resolution in <strong>72hrs</strong>'
  };
  const el = document.getElementById('sla-info-box');
  if (el) el.innerHTML = '⏱️ SLA: ' + (slaMap[priority] || slaMap['Medium']);
}

async function loadTickets() {
  const { data: emps } = await sb.from('employees').select('name,email').eq('is_active',true);
  const assignList = document.getElementById('tkAssignList');
  if (assignList && emps) {
    assignList.innerHTML = emps.map(e=>`<option value="${esc(e.name)}">`).join('');
  }

  const isCEO = currentUser.role === 'ceo' || currentUser.role === 'manager';
  let query = sb.from('tickets').select('*').eq('is_archived',false).order('created_at',{ascending:false});
  if (!isCEO) query = query.eq('created_by_email', currentUser.email);
  const { data: tickets } = await query;
  allTickets = tickets || [];

  // Calculate SLA overdue
  const now = new Date();
  allTickets.forEach(t => {
    if (t.status === 'Resolved' || t.status === 'Closed') { t._overdue = false; return; }
    const created = new Date(t.created_at);
    const hrs = (now - created) / 3600000;
    const slaHrs = SLA_HOURS[t.priority] || 48;
    t._overdue = hrs > slaHrs;
    t._hrsOpen = Math.round(hrs);
    t._slaHrs = slaHrs;
  });

  const total = allTickets.length;
  const open = allTickets.filter(t=>t.status==='Open').length;
  const inProg = allTickets.filter(t=>t.status==='In Progress').length;
  const resolved = allTickets.filter(t=>t.status==='Resolved'||t.status==='Closed').length;
  const overdue = allTickets.filter(t=>t._overdue).length;

  document.getElementById('tk-total').textContent = total;
  document.getElementById('tk-open').textContent = open;
  document.getElementById('tk-progress').textContent = inProg;
  document.getElementById('tk-resolved').textContent = resolved;
  document.getElementById('tk-overdue').textContent = overdue;

  const badge = document.getElementById('nb-tickets');
  if (badge) {
    const pending = isCEO ? (open + overdue) : allTickets.filter(t=>t.status==='Open'||t.status==='In Progress').length;
    badge.textContent = pending;
    badge.style.display = pending > 0 ? 'inline-block' : 'none';
  }

  renderTickets();
}

function filterTickets(status) {
  ticketsFilter = status;
  const sel = document.getElementById('tk-filter');
  if (sel && status !== 'overdue') sel.value = status;
  renderTickets();
}

function renderTickets() {
  let filtered = allTickets;
  if (ticketsFilter === 'overdue') filtered = allTickets.filter(t=>t._overdue);
  else if (ticketsFilter !== 'all') filtered = allTickets.filter(t=>t.status===ticketsFilter);

  const el = document.getElementById('ticketsList');
  const isCEO = currentUser.role === 'ceo' || currentUser.role === 'manager';

  if (!filtered.length) {
    el.innerHTML = '<div class="empty-state"><div class="empty-icon">🎫</div><div class="empty-title">No tickets found</div><p>All caught up!</p></div>';
    return;
  }

  const priorityColors = {'Low':'b-gray','Medium':'b-blue','High':'b-amber','Urgent':'b-red'};
  const statusColors = {'Open':'b-gold','In Progress':'b-blue','Resolved':'b-green','Closed':'b-gray'};

  el.innerHTML = filtered.map(t => {
    const isOverdue = t._overdue;
    const slaWarning = isOverdue ? `<span class="badge b-red" style="font-size:10px">⚠️ SLA Breached ${t._hrsOpen}h/${t._slaHrs}h</span>` :
      (t.status !== 'Resolved' && t.status !== 'Closed') ? `<span style="font-size:10px;color:var(--muted)">⏱️ ${t._hrsOpen}h / ${t._slaHrs}h SLA</span>` : '';

    return `<div style="padding:14px 18px;border-bottom:1px solid var(--border);${isOverdue?'background:#fdf0ee;':''}${t.status==='Resolved'||t.status==='Closed'?'opacity:0.7':''}">
      <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:12px">
        <div style="flex:1;cursor:pointer" onclick="openTicketDetail('${t.id}')">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;flex-wrap:wrap">
            <span style="font-size:11px;font-weight:700;color:var(--muted)">#${t.ticket_number}</span>
            <span style="font-size:13px;font-weight:700;color:var(--navy)">${esc(t.title)}</span>
            <span class="badge ${priorityColors[t.priority]||'b-gray'}" style="font-size:10px">${t.priority}</span>
            <span class="badge ${statusColors[t.status]||'b-gray'}" style="font-size:10px">${t.status}</span>
            ${slaWarning}
          </div>
          <div style="font-size:12px;color:var(--muted);margin-bottom:6px">${esc(t.description||'').substring(0,100)}${(t.description||'').length>100?'...':''}</div>
          <div style="display:flex;gap:12px;flex-wrap:wrap;font-size:11px;color:var(--muted)">
            <span>📂 ${esc(t.category)}</span>
            <span>👤 By: ${esc(t.created_by_name)}</span>
            ${t.assigned_to_name?`<span>→ Assigned: ${esc(t.assigned_to_name)}</span>`:''}
            <span>🕐 ${new Date(t.created_at).toLocaleDateString('en-IN')}</span>
          </div>
          ${t.resolution_note?`<div style="margin-top:8px;padding:8px;background:var(--green-bg);border-radius:6px;font-size:12px;color:var(--green)">✅ Resolution: ${esc(t.resolution_note)}</div>`:''}
          ${t.rating?`<div style="margin-top:6px;font-size:12px">${'⭐'.repeat(t.rating)} <span style="color:var(--muted);font-size:11px">${esc(t.employee_feedback||'')}</span></div>`:''}
        </div>
        <div style="display:flex;flex-direction:column;gap:6px;flex-shrink:0">
          ${isCEO && t.status==='Open'?`<button class="btn btn-primary btn-sm" onclick="updateTicketStatus('${t.id}','In Progress')">⚡ Start</button>`:''}
          ${isCEO && (t.status==='Open'||t.status==='In Progress')?`<button class="btn btn-green btn-sm" onclick="resolveTicket('${t.id}')">✅ Resolve</button>`:''}
          ${isCEO && t.status==='Resolved'?`<button class="btn btn-outline btn-sm" onclick="updateTicketStatus('${t.id}','Closed')">🔒 Close</button>`:''}
          ${!isCEO && t.status==='Resolved' && !t.rating?`<button class="btn btn-gold btn-sm" onclick="rateTicket('${t.id}')">⭐ Rate</button>`:''}
          ${!isCEO && (t.status==='Open'||t.status==='In Progress')?`<button class="btn btn-outline btn-sm" onclick="openTicketDetail('${t.id}')">💬 View</button>`:''}
          ${isCEO?`<button class="btn btn-sm" onclick="deleteTicket('${t.id}')" style="background:#fdf0ee;color:var(--red);border-color:var(--red-bg)">🗑️</button>`:''}
        </div>
      </div>
    </div>`;
  }).join('');
}

async function openTicketDetail(ticketId) {
  const t = allTickets.find(x=>x.id===ticketId);
  if (!t) return;
  const isCEO = currentUser.role === 'ceo' || currentUser.role === 'manager';

  // Load comments
  const { data: comments } = await sb.from('ticket_comments').select('*')
    .eq('ticket_id', ticketId).order('created_at',{ascending:true});

  const priorityColors = {'Low':'b-gray','Medium':'b-blue','High':'b-amber','Urgent':'b-red'};
  const statusColors = {'Open':'b-gold','In Progress':'b-blue','Resolved':'b-green','Closed':'b-gray'};

  document.getElementById('ticketDetailContent').innerHTML = `
    <div style="padding:14px;background:#f8f9fc;border-radius:10px;margin-bottom:16px">
      <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:8px">
        <span style="font-size:12px;font-weight:700;color:var(--muted)">#${t.ticket_number}</span>
        <span style="font-size:15px;font-weight:700;color:var(--navy)">${esc(t.title)}</span>
        <span class="badge ${priorityColors[t.priority]||'b-gray'}">${t.priority}</span>
        <span class="badge ${statusColors[t.status]||'b-gray'}">${t.status}</span>
        ${t._overdue?'<span class="badge b-red">⚠️ SLA Breached</span>':''}
      </div>
      <div style="font-size:13px;color:var(--text);line-height:1.6;margin-bottom:10px">${esc(t.description||'')}</div>
      <div style="display:flex;gap:14px;flex-wrap:wrap;font-size:11px;color:var(--muted)">
        <span>📂 ${esc(t.category)}</span>
        <span>👤 ${esc(t.created_by_name)}</span>
        ${t.assigned_to_name?`<span>→ ${esc(t.assigned_to_name)}</span>`:''}
        <span>🕐 ${new Date(t.created_at).toLocaleDateString('en-IN')}</span>
      </div>
      ${t.resolution_note?`<div style="margin-top:10px;padding:10px;background:var(--green-bg);border-radius:8px;font-size:12px;color:var(--green)">✅ <strong>Resolution:</strong> ${esc(t.resolution_note)}</div>`:''}
    </div>

    <!-- Comments Thread -->
    <div style="margin-bottom:14px">
      <div style="font-size:12px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:0.8px;margin-bottom:10px">💬 Comments</div>
      <div id="commentThread" style="display:flex;flex-direction:column;gap:10px;max-height:250px;overflow-y:auto;margin-bottom:12px">
        ${(!comments||!comments.length)?'<div style="text-align:center;color:var(--muted);font-size:12px;padding:16px">No comments yet</div>':
          comments.map(c=>`
            <div style="display:flex;gap:10px;${c.is_internal?'opacity:0.7':''}">
              <div class="av" style="background:var(--navy);width:28px;height:28px;font-size:10px;flex-shrink:0">${esc(c.commented_by_name||'?').substring(0,2).toUpperCase()}</div>
              <div style="flex:1">
                <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px">
                  <span style="font-size:12px;font-weight:700;color:var(--navy)">${esc(c.commented_by_name)}</span>
                  ${c.is_internal?'<span class="badge b-gray" style="font-size:9px">Internal</span>':''}
                  <span style="font-size:10px;color:var(--muted)">${new Date(c.created_at).toLocaleString('en-IN',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'})}</span>
                </div>
                <div style="font-size:13px;color:var(--text);background:var(--bg);padding:8px 12px;border-radius:8px;line-height:1.5">${esc(c.comment)}</div>
              </div>
            </div>
          `).join('')
        }
      </div>

      <!-- Add Comment -->
      ${t.status!=='Closed'?`
      <div>
        <textarea id="new-comment" placeholder="Add a comment..." style="width:100%;padding:10px;border:1.5px solid var(--border);border-radius:8px;font-family:'DM Sans',sans-serif;font-size:13px;resize:vertical;min-height:70px;outline:none"></textarea>
        <div style="display:flex;gap:8px;margin-top:8px;align-items:center">
          <button class="btn btn-gold btn-sm" onclick="addTicketComment('${t.id}', false)">💬 Add Comment</button>
          ${isCEO?`<button class="btn btn-outline btn-sm" onclick="addTicketComment('${t.id}', true)">🔒 Internal Note</button>`:''}
          <span id="commentMsg" style="font-size:11px;font-weight:600"></span>
        </div>
      </div>`:'<div style="text-align:center;color:var(--muted);font-size:12px;padding:10px">Ticket is closed</div>'}
    </div>

    <!-- CEO Actions -->
    ${isCEO?`
    <div style="border-top:1px solid var(--border);padding-top:14px;display:flex;gap:8px;flex-wrap:wrap">
      ${t.status==='Open'?`<button class="btn btn-primary btn-sm" onclick="updateTicketStatus('${t.id}','In Progress');closeModal('ticketDetailModal');loadTickets()">⚡ Start Working</button>`:''}
      ${(t.status==='Open'||t.status==='In Progress')?`<button class="btn btn-green btn-sm" onclick="resolveTicketFromModal('${t.id}')">✅ Mark Resolved</button>`:''}
      ${t.status==='Resolved'?`<button class="btn btn-outline btn-sm" onclick="updateTicketStatus('${t.id}','Closed');closeModal('ticketDetailModal');loadTickets()">🔒 Close Ticket</button>`:''}
    </div>`:''}
  `;

  document.getElementById('ticketDetailModal').classList.add('open');
}

async function addTicketComment(ticketId, isInternal) {
  const comment = document.getElementById('new-comment').value.trim();
  const msgEl = document.getElementById('commentMsg');
  if (!comment) { msgEl.textContent = '⚠️ Enter a comment'; msgEl.style.color = 'var(--red)'; return; }

  const { error } = await sb.from('ticket_comments').insert({
    ticket_id: ticketId,
    comment,
    commented_by_name: currentUser.name,
    commented_by_email: currentUser.email,
    is_internal: isInternal
  });

  if (error) { msgEl.textContent = '❌ ' + error.message; msgEl.style.color = 'var(--red)'; return; }
  msgEl.textContent = '✅ Added!'; msgEl.style.color = 'var(--green)';
  document.getElementById('new-comment').value = '';
  setTimeout(() => msgEl.textContent = '', 2000);
  openTicketDetail(ticketId); // Refresh
}

async function resolveTicketFromModal(ticketId) {
  const note = prompt('Resolution note (what was done):');
  if (note === null) return;
  const ticket = allTickets.find(t=>t.id===ticketId);
  await sb.from('tickets').update({
    status: 'Resolved',
    resolution_note: note,
    resolved_by_name: currentUser.name,
    resolved_at: new Date().toISOString()
  }).eq('id', ticketId);
  if (ticket && ticket.created_by_email !== currentUser.email) {
    await sendEmail(ticket.created_by_email, ticket.created_by_name,
      'Your Ticket Has Been Resolved — Sayash Vastu',
      `Dear ${ticket.created_by_name},

Your ticket "${ticket.title}" has been resolved.

Resolution: ${note}
Resolved by: ${currentUser.name}

Please login to rate your experience.`,
      'Ticket Resolved', 'https://sayash-vastu-portal.vercel.app', 'Rate & View →'
    );
  }
  closeModal('ticketDetailModal');
  showToast('✅ Ticket resolved!', 'ok');
  loadTickets();
}

async function rateTicket(ticketId) {
  const rating = prompt('Rate this resolution (1-5 stars):');
  if (!rating || isNaN(rating) || rating < 1 || rating > 5) { showToast('⚠️ Enter 1-5', 'err'); return; }
  const feedback = prompt('Any feedback? (optional):');
  await sb.from('tickets').update({
    rating: parseInt(rating),
    employee_feedback: feedback || ''
  }).eq('id', ticketId);
  showToast('✅ Thank you for your feedback!', 'ok');
  loadTickets();
}

async function createTicket() {
  const title = document.getElementById('tk-title').value.trim();
  const category = document.getElementById('tk-category').value;
  const priority = document.getElementById('tk-priority').value;
  const assignName = document.getElementById('tk-assign-name').value.trim();
  const desc = document.getElementById('tk-desc').value.trim();
  const msgEl = document.getElementById('tkMsg');

  if (!title || !desc) { msgEl.textContent='⚠️ Title aur description required'; msgEl.style.color='var(--red)'; return; }

  let assignEmail = null;
  if (assignName) {
    const { data: emp } = await sb.from('employees').select('email').eq('name', assignName).single();
    if (emp) assignEmail = emp.email;
  }

  const slaHrs = SLA_HOURS[priority] || 48;

  const { data: newTicket, error } = await sb.from('tickets').insert({
    title, description: desc, category, priority,
    status: 'Open',
    sla_hours: slaHrs,
    created_by_email: currentUser.email,
    created_by_name: currentUser.name,
    assigned_to_email: assignEmail || CEO_EMAIL,
    assigned_to_name: assignName || 'CEO Admin'
  }).select().single();

  if (error) { msgEl.textContent='❌ '+error.message; msgEl.style.color='var(--red)'; return; }

  // Email notification
  const notifyEmail = assignEmail || CEO_EMAIL;
  const notifyName = assignName || 'CEO Admin';
  await sendEmail(notifyEmail, notifyName,
    `🎫 New Ticket #${newTicket?.ticket_number||''} — ${priority} Priority`,
    `Dear ${notifyName},

A new ticket has been raised.

Title: ${title}
Category: ${category}
Priority: ${priority}
Raised by: ${currentUser.name}
SLA: Resolve within ${slaHrs} hours

Description: ${desc}

Please login to view and respond.`,
    'Ticket', 'https://sayash-vastu-portal.vercel.app', 'View Ticket →'
  );

  msgEl.textContent='✅ Ticket submitted!'; msgEl.style.color='var(--green)';
  showToast('✅ Ticket created!','ok');
  document.getElementById('tk-title').value='';
  document.getElementById('tk-desc').value='';
  document.getElementById('tk-assign-name').value='';
  loadTickets();
  setTimeout(()=>msgEl.textContent='',4000);
}

async function updateTicketStatus(ticketId, status) {
  await sb.from('tickets').update({ status }).eq('id', ticketId);
  showToast('✅ Ticket updated!','ok');
  loadTickets();
}

async function resolveTicket(ticketId) {
  const note = prompt('Resolution note (what was done):');
  if (note === null) return;
  const ticket = allTickets.find(t=>t.id===ticketId);
  await sb.from('tickets').update({
    status: 'Resolved', resolution_note: note,
    resolved_by_name: currentUser.name,
    resolved_at: new Date().toISOString()
  }).eq('id', ticketId);
  if (ticket && ticket.created_by_email !== currentUser.email) {
    await sendEmail(ticket.created_by_email, ticket.created_by_name,
      'Your Ticket Has Been Resolved — Sayash Vastu',
      `Dear ${ticket.created_by_name},

Your ticket "${ticket.title}" has been resolved.

Resolution: ${note}
Resolved by: ${currentUser.name}

Please login to rate your experience.`,
      'Ticket Resolved', 'https://sayash-vastu-portal.vercel.app', 'Rate & View →'
    );
  }
  if (ticket && ticket.created_by_email !== currentUser.email) {
    await createNotification(
      ticket.created_by_email,
      `✅ Ticket resolved — ${ticket.title}`,
      `Your ticket has been resolved by ${currentUser.name}. Please rate your experience.`,
      'ticket', 'tickets'
    );
  }
  showToast('✅ Ticket resolved!','ok');
  loadTickets();
}

async function deleteTicket(ticketId) {
  if (!confirm('Delete this ticket?')) return;
  const { error } = await sb.from('tickets').update({is_archived: true}).eq('id', ticketId);
  if (error) { showToast('❌ ' + error.message, 'err'); return; }
  showToast('✅ Ticket archived!', 'ok');
  loadTickets();
}

function exportTicketsPDF() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  doc.setFontSize(16); doc.setFont('helvetica','bold');
  doc.text('Sayash Vastu — Tickets Report', 14, 18);
  doc.setFontSize(10); doc.setFont('helvetica','normal');
  doc.text('Generated: '+new Date().toLocaleDateString('en-IN'), 14, 26);
  let y = 36;
  doc.setFontSize(9); doc.setFont('helvetica','bold');
  doc.text('#    Title                 Category      Priority  Status     SLA', 14, y);
  y += 4; doc.line(14, y, 196, y); y += 5;
  doc.setFont('helvetica','normal');
  allTickets.forEach(t => {
    if (y > 270) { doc.addPage(); y = 20; }
    const slaStatus = t._overdue ? 'BREACHED' : 'OK';
    doc.text(`${t.ticket_number}. ${(t.title||'').substring(0,20).padEnd(21)} ${(t.category||'').padEnd(14)} ${(t.priority||'').padEnd(10)} ${(t.status||'').padEnd(11)} ${slaStatus}`, 14, y);
    y += 6;
  });
  doc.save('SayashVastu_Tickets.pdf');
  showToast('✅ Tickets PDF exported!','ok');
}

// ═══════════════════════════════════════════
//  PROJECTS
// ═══════════════════════════════════════════
async function loadProjects() {
  const isCEO = currentUser.role === 'ceo' || currentUser.role === 'manager';
  const addPanel = document.getElementById('addProjectPanel');
  if (addPanel) addPanel.style.display = isCEO ? 'block' : 'none';

  // Load employees for member selection (CEO only)
  if (isCEO) {
    const { data: emps } = await sb.from('employees').select('name,email').eq('is_active',true);
    const membersList = document.getElementById('proj-members-list');
    if (membersList && emps) {
      membersList.innerHTML = emps.map(e => `
        <label style="display:flex;align-items:center;gap:6px;padding:6px 10px;background:var(--bg);border-radius:6px;cursor:pointer;font-size:12px">
          <input type="checkbox" value="${esc(e.email)}" data-name="${esc(e.name)}" style="cursor:pointer"/>
          ${esc(e.name)}
        </label>
      `).join('');
    }
  }

  const { data: projects } = await sb.from('projects').select('*').order('created_at',{ascending:false});
  const el = document.getElementById('projectsList');

  if (!projects || !projects.length) {
    el.innerHTML = '<div class="empty-state"><div class="empty-icon">🗂️</div><div class="empty-title">No projects yet</div><p>CEO will add projects here</p></div>';
    return;
  }

  const statusColors = {
    'In Progress': 'b-blue',
    'Not Started': 'b-gray',
    'On Hold': 'b-amber',
    'Completed': 'b-green'
  };

  el.innerHTML = projects.map(p => {
    const members = Array.isArray(p.assigned_to) ? p.assigned_to : [];
    const today = new Date(); today.setHours(0,0,0,0);
    const endDate = p.end_date ? new Date(p.end_date) : null;
    const isOverdue = endDate && today > endDate && p.status !== 'Completed';
    return `<div class="panel" style="margin-bottom:14px;${isOverdue?'border-left:3px solid var(--red)':''}">
      <div class="panel-head">
        <div>
          <div style="display:flex;align-items:center;gap:10px">
            <div class="panel-title">🗂️ ${esc(p.project_name)}</div>
            <span class="badge ${statusColors[p.status]||'b-gray'}">${esc(p.status)}</span>
            ${isOverdue?'<span class="badge b-red">⚠️ Overdue</span>':''}
          </div>
          ${p.description?`<div style="font-size:12px;color:var(--muted);margin-top:4px">${esc(p.description)}</div>`:''}
        </div>
        <div style="display:flex;gap:8px;align-items:center">
          ${(isCEO || members.some(m=>m.email===currentUser.email))?`<button class="btn btn-primary btn-sm" onclick="openProjectUpdate('${p.id}','${esc(p.project_name)}','${esc(p.description||'')}','${esc(p.status)}')">✏️ Update</button>`:''}
          ${isCEO?`<button class="btn btn-sm" onclick="deleteProject('${p.id}')" style="background:#fdf0ee;color:var(--red);border-color:var(--red-bg)">🗑️</button>`:''}
        </div>
      </div>
      <div class="panel-body" style="padding-top:10px">
        <div style="display:flex;align-items:center;gap:20px;flex-wrap:wrap;margin-bottom:8px">
          <div style="font-size:12px;color:var(--muted)">
            📅 <strong>Start:</strong> ${fmtDate(p.start_date)} &nbsp;|&nbsp; 
            🏁 <strong>End:</strong> <span style="color:${isOverdue?'var(--red)':'var(--text)'};font-weight:${isOverdue?'700':'400'}">${fmtDate(p.end_date)}</span>
          </div>
          <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap">
            <span style="font-size:11px;color:var(--muted);font-weight:600">TEAM:</span>
            ${members.length ? members.map(m=>`
              <div style="display:flex;align-items:center;gap:5px;background:var(--bg);padding:3px 8px;border-radius:20px;${m.email===currentUser.email?'border:1px solid var(--gold)':''}">
                <div class="av" style="width:20px;height:20px;font-size:8px;background:${m.email===currentUser.email?'var(--gold)':'var(--navy)'};color:${m.email===currentUser.email?'var(--navy)':'#fff'}">${esc(m.name||'').substring(0,2).toUpperCase()}</div>
                <span style="font-size:11px;color:var(--navy);font-weight:600">${esc(m.name||'')}${m.email===currentUser.email?' (You)':''}</span>
              </div>
            `).join('') : '<span style="font-size:11px;color:var(--muted)">No members assigned</span>'}
          </div>
        </div>
        ${p.file_url ? `<div style="margin-bottom:8px"><a href="${p.file_url}" target="_blank" class="file-chip">📎 ${esc(p.file_name||'Attached File')}</a></div>` : ''}
        ${p.last_update ? `<div style="padding:8px 12px;background:var(--bg);border-radius:8px;font-size:12px;border-left:3px solid var(--blue)"><span style="font-weight:700;color:var(--navy)">Latest Update: </span><span style="color:var(--muted)">${esc(p.last_update)}</span>${p.updated_by?`<span style="font-size:10px;color:var(--muted)"> — ${esc(p.updated_by)}</span>`:''}</div>` : ''}
      </div>
    </div>`;
  }).join('');
}

async function addProject() {
  const name = document.getElementById('proj-name').value.trim();
  const status = document.getElementById('proj-status').value;
  const start = document.getElementById('proj-start').value;
  const end = document.getElementById('proj-end').value;
  const desc = document.getElementById('proj-desc').value.trim();
  const msgEl = document.getElementById('projMsg');

  if (!name) { msgEl.textContent='⚠️ Project name required'; msgEl.style.color='var(--red)'; return; }

  // Get selected members
  const checkboxes = document.querySelectorAll('#proj-members-list input[type=checkbox]:checked');
  const members = Array.from(checkboxes).map(cb => ({ email: cb.value, name: cb.dataset.name }));

  // Upload file if selected
  const projFile = document.getElementById('proj-file');
  let projFileUrl = null; let projFileName = null;
  if (projFile && projFile.files[0]) {
    const f = projFile.files[0];
    msgEl.textContent='⏳ Uploading file...'; msgEl.style.color='var(--muted)';
    const path = `projects/${Date.now()}_${f.name.replace(/[^a-z0-9.]/gi,'_')}`;
    const { error: uploadErr } = await sb.storage.from('task-files').upload(path, f, {upsert: false});
    if (!uploadErr) {
const { data: urlData } = sb.storage.from('Task-Files').getPublicUrl(path);
      projFileUrl = urlData.publicUrl;
      projFileName = f.name;
    }
  }

  const { error } = await sb.from('projects').insert({
    project_name: name, status, start_date: start||null, end_date: end||null,
    description: desc, assigned_to: members,
    file_url: projFileUrl, file_name: projFileName,
    created_by_name: currentUser.name, created_by_email: currentUser.email
  });

  if (error) { msgEl.textContent='❌ '+error.message; msgEl.style.color='var(--red)'; return; }
  msgEl.textContent='✅ Project added!'; msgEl.style.color='var(--green)';
  showToast('✅ Project added!','ok');
  document.getElementById('proj-name').value='';
  document.getElementById('proj-desc').value='';
  if (projFile) { projFile.value=''; }
  document.getElementById('proj-file-preview').innerHTML = `
    <div style="display:flex;align-items:center;gap:10px;justify-content:center">
      <span style="font-size:20px">📎</span>
      <div><div class="upload-zone-text">Click to attach file</div><div class="upload-zone-hint">PDF, Image, Excel, DWG — max 10MB</div></div>
    </div>`;
  loadProjects();
  setTimeout(()=>msgEl.textContent='',3000);
}

async function deleteProject(id) {
  if (!confirm('Delete this project?')) return;
  await sb.from('projects').delete().eq('id',id);
  showToast('✅ Project deleted!','ok');
  loadProjects();
}

let currentProjectId = null;
function openProjectUpdate(projId, projName, projDesc, projStatus) {
  currentProjectId = projId;
  document.getElementById('puProjectName').textContent = projName;
  document.getElementById('puProjectDesc').textContent = projDesc || 'No description';
  document.getElementById('pu-status').value = projStatus || 'In Progress';
  document.getElementById('pu-comment').value = '';
  document.getElementById('puMsg').textContent = '';
  document.getElementById('projectUpdateModal').classList.add('open');
}

async function saveProjectUpdate() {
  const status = document.getElementById('pu-status').value;
  const comment = document.getElementById('pu-comment').value.trim();
  const msgEl = document.getElementById('puMsg');
  if (!comment) { msgEl.textContent = '⚠️ Please add a comment'; msgEl.style.color = 'var(--red)'; return; }
  
  const { error } = await sb.from('projects').update({
    status: status,
    last_update: comment,
    updated_by: currentUser.name,
    updated_at: new Date().toISOString()
  }).eq('id', currentProjectId);
  
  if (error) { msgEl.textContent = '❌ ' + error.message; msgEl.style.color = 'var(--red)'; return; }
  showToast('✅ Project updated!', 'ok');
  closeModal('projectUpdateModal');
  loadProjects();
}

// ═══════════════════════════════════════════
//  HELP REQUESTS
// ═══════════════════════════════════════════
async function loadHelpRequests() {
  // Load employee names for autocomplete
  const { data: emps } = await sb.from('employees').select('name,email').eq('is_active',true);
  const helpList = document.getElementById('helpNameList');
  if (helpList && emps) {
    helpList.innerHTML = emps.filter(e=>e.email!==currentUser.email).map(e=>`<option value="${esc(e.name)}" data-email="${esc(e.email)}">`).join('');
  }

  // Load projects for autocomplete
  const { data: projs } = await sb.from('projects').select('project_name');
  const projList = document.getElementById('helpProjectList');
  if (projList && projs) {
    projList.innerHTML = projs.map(p=>`<option value="${esc(p.project_name)}">`).join('');
  }

  // Help badge count
  const { data: incoming } = await sb.from('help_requests').select('*')
    .eq('to_email', currentUser.email).eq('is_resolved', false);
  const badge = document.getElementById('nb-help');
  if (badge) {
    const count = (incoming||[]).length;
    badge.textContent = count;
    badge.style.display = count > 0 ? 'inline-block' : 'none';
  }

  // Render incoming requests
  const inEl = document.getElementById('incomingHelp');
  if (!incoming || !incoming.length) {
    inEl.innerHTML = '<div style="text-align:center;color:var(--muted);font-size:13px;padding:16px">No pending help requests</div>';
  } else {
    inEl.innerHTML = incoming.map(h => `
      <div style="padding:12px;background:var(--bg);border-radius:10px;margin-bottom:10px;border-left:3px solid var(--gold)">
        <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:10px">
          <div>
            <div style="font-size:13px;font-weight:600;color:var(--navy)">📌 ${esc(h.from_name)} needs your help</div>
            ${h.project_name?`<div style="font-size:11px;color:var(--muted);margin-top:3px">Project: ${esc(h.project_name)}</div>`:''}
            <div style="font-size:12px;color:var(--text);margin-top:6px;padding:8px;background:#fff;border-radius:6px">${esc(h.message||'')}</div>
            <div style="font-size:10px;color:var(--muted);margin-top:6px">${new Date(h.created_at).toLocaleDateString('en-IN')}</div>
          </div>
          <button class="btn btn-green btn-sm" onclick="resolveHelp('${h.id}')">✅ Done</button>
        </div>
      </div>
    `).join('');
  }

  // My sent requests
  const { data: sent } = await sb.from('help_requests').select('*')
    .eq('from_email', currentUser.email).order('created_at',{ascending:false}).limit(10);
  const sentEl = document.getElementById('sentHelp');
  if (!sent || !sent.length) {
    sentEl.innerHTML = '<div style="text-align:center;color:var(--muted);font-size:13px;padding:16px">No requests sent yet</div>';
  } else {
    sentEl.innerHTML = sent.map(h => `
      <div style="padding:12px;background:var(--bg);border-radius:10px;margin-bottom:10px;border-left:3px solid ${h.is_resolved?'var(--green)':'var(--blue)'}">
        <div style="display:flex;align-items:flex-start;justify-content:space-between">
          <div>
            <div style="font-size:13px;font-weight:600;color:var(--navy)">To: ${esc(h.to_name)}</div>
            ${h.project_name?`<div style="font-size:11px;color:var(--muted);margin-top:2px">Project: ${esc(h.project_name)}</div>`:''}
            <div style="font-size:12px;color:var(--text);margin-top:6px">${esc(h.message||'')}</div>
          </div>
          <span class="badge ${h.is_resolved?'b-green':'b-blue'}">${h.is_resolved?'✅ Resolved':'⏳ Pending'}</span>
        </div>
      </div>
    `).join('');
  }
}

function previewProjFile(input) {
  const file = input.files[0];
  if (!file) return;
  document.getElementById('proj-file-preview').innerHTML = `
    <div style="display:flex;align-items:center;gap:10px;justify-content:center">
      <span style="font-size:20px">📎</span>
      <div>
        <div style="font-size:12px;font-weight:600;color:var(--navy)">${file.name}</div>
        <div style="font-size:11px;color:var(--muted)">${(file.size/1024).toFixed(0)} KB</div>
      </div>
    </div>`;
}

function previewHelpFile(input) {
  const file = input.files[0];
  if (!file) return;
  document.getElementById('help-file-preview').innerHTML = `
    <div style="display:flex;align-items:center;gap:10px;justify-content:center">
      <span style="font-size:20px">📎</span>
      <div>
        <div style="font-size:12px;font-weight:600;color:var(--navy)">${file.name}</div>
        <div style="font-size:11px;color:var(--muted)">${(file.size/1024).toFixed(0)} KB</div>
      </div>
    </div>`;
}

async function sendHelpRequest() {
  const toName = document.getElementById('help-to-name').value.trim();
  const project = document.getElementById('help-project').value.trim();
  const message = document.getElementById('help-message').value.trim();
  const msgEl = document.getElementById('helpMsg');
  const fileInput = document.getElementById('help-file');
  const file = fileInput ? fileInput.files[0] : null;

  if (!toName || !message) { msgEl.textContent='⚠️ Fill all fields'; msgEl.style.color='var(--red)'; return; }

  // Find email from name
  const { data: emp } = await sb.from('employees').select('name,email').eq('name',toName).single();
  if (!emp) { msgEl.textContent='⚠️ Employee not found'; msgEl.style.color='var(--red)'; return; }

  // Upload file if selected
  let fileUrl = null; let fileName = null;
  if (file) {
    if (file.size > 10 * 1024 * 1024) { msgEl.textContent='❌ File too large (max 10MB)'; msgEl.style.color='var(--red)'; return; }
    msgEl.textContent='⏳ Uploading file...'; msgEl.style.color='var(--muted)';
    const path = `help-requests/${Date.now()}_${file.name.replace(/[^a-z0-9.]/gi,'_')}`;
    const { error: uploadErr } = await sb.storage.from('task-files').upload(path, file, {upsert: false});
    if (!uploadErr) {
      const { data: urlData } = sb.storage.from('task-files').getPublicUrl(path);
      fileUrl = urlData.publicUrl;
      fileName = file.name;
    }
  }

  const { error } = await sb.from('help_requests').insert({
    from_email: currentUser.email, from_name: currentUser.name,
    to_email: emp.email, to_name: emp.name,
    project_name: project, message,
    file_url: fileUrl, file_name: fileName
  });

  if (error) { msgEl.textContent='❌ '+error.message; msgEl.style.color='var(--red)'; return; }

  // Send email notification
  await sendEmail(emp.email, emp.name,
    'Help Request from ' + currentUser.name + ' — Sayash Vastu',
    `Dear ${emp.name},

${currentUser.name} has requested your help.

Project: ${project||'—'}
Message: ${message}

Please login to view and respond.

Regards,
Sayash Vastu Portal`,
    'Help Request', 'https://sayash-vastu-portal.vercel.app', 'View Request →'
  );

  msgEl.textContent='✅ Help request sent!'; msgEl.style.color='var(--green)';
  showToast('✅ Help request pinned!','ok');
  document.getElementById('help-to-name').value='';
  document.getElementById('help-project').value='';
  document.getElementById('help-message').value='';
  if (fileInput) fileInput.value='';
  document.getElementById('help-file-preview').innerHTML = `
    <div style="display:flex;align-items:center;gap:10px;justify-content:center">
      <span style="font-size:20px">📎</span>
      <div>
        <div class="upload-zone-text">Click to attach file</div>
        <div class="upload-zone-hint">PDF, Image, Excel, Word, DWG — max 10MB</div>
      </div>
    </div>`;
  loadHelpRequests();
  setTimeout(()=>msgEl.textContent='',4000);
}

async function resolveHelp(id) {
  await sb.from('help_requests').update({is_resolved:true}).eq('id',id);
  showToast('✅ Marked as resolved!','ok');
  loadHelpRequests();
}

// ═══════════════════════════════════════════
//  HOLIDAYS
// ═══════════════════════════════════════════
async function loadHolidays() {
  // Show add panel for CEO
  const addPanel = document.getElementById('addHolidayPanel');
  if (addPanel) addPanel.style.display = (currentUser.role==='ceo'||currentUser.role==='manager') ? 'block' : 'none';

  const { data } = await sb.from('holidays').select('*').order('date', {ascending: true});
  const tbody = document.getElementById('holidaysBody');
  const days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  const today = new Date(); today.setHours(0,0,0,0);

  if (!data || !data.length) {
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:30px;color:var(--muted)">No holidays found</td></tr>';
    return;
  }

  tbody.innerHTML = data.map((h, i) => {
    const hDate = new Date(h.date);
    const isPast = hDate < today;
    const isToday = hDate.toDateString() === today.toDateString();
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    return `<tr style="${isToday?'background:#fdf6e3':isPast?'opacity:0.5':''}">
      <td style="font-size:11px;color:var(--muted)">${i+1}</td>
      <td style="font-weight:600;color:var(--navy)">${esc(h.title)}${isToday?' 🎉':''}</td>
      <td style="font-size:12px">${hDate.getDate()} ${months[hDate.getMonth()]} ${hDate.getFullYear()}</td>
      <td style="font-size:12px">${days[hDate.getDay()]}</td>
      <td><span class="badge ${h.type==='National'?'b-blue':h.type==='Festival'?'b-gold':'b-gray'}">${h.type}</span></td>
    </tr>`;
  }).join('');

  // Summary
  const national = data.filter(h=>h.type==='National').length;
  const festival = data.filter(h=>h.type==='Festival').length;
  const remaining = data.filter(h=>new Date(h.date)>=today).length;
  document.getElementById('holidaySummary').innerHTML = `
    <div style="display:flex;justify-content:space-between;padding:10px;background:var(--bg);border-radius:8px">
      <span style="font-size:12px;color:var(--muted)">Total Holidays</span>
      <span style="font-size:13px;font-weight:700;color:var(--navy)">${data.length}</span>
    </div>
    <div style="display:flex;justify-content:space-between;padding:10px;background:var(--bg);border-radius:8px">
      <span style="font-size:12px;color:var(--muted)">National</span>
      <span style="font-size:13px;font-weight:700;color:var(--blue)">${national}</span>
    </div>
    <div style="display:flex;justify-content:space-between;padding:10px;background:var(--bg);border-radius:8px">
      <span style="font-size:12px;color:var(--muted)">Festival</span>
      <span style="font-size:13px;font-weight:700;color:var(--amber)">${festival}</span>
    </div>
    <div style="display:flex;justify-content:space-between;padding:10px;background:#e6f5ee;border-radius:8px">
      <span style="font-size:12px;color:var(--green);font-weight:600">Remaining</span>
      <span style="font-size:13px;font-weight:700;color:var(--green)">${remaining}</span>
    </div>
  `;

  // Upcoming holidays
  const upcoming = data.filter(h=>new Date(h.date)>=today).slice(0,3);
  const upEl = document.getElementById('upcomingHolidays');
  if (!upcoming.length) {
    upEl.innerHTML = '<div style="text-align:center;color:var(--muted);font-size:12px;padding:16px">No upcoming holidays</div>';
  } else {
    const months2 = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    upEl.innerHTML = upcoming.map(h => {
      const hDate = new Date(h.date);
      const diff = Math.ceil((hDate-today)/(1000*60*60*24));
      return `<div style="display:flex;align-items:center;gap:10px;padding:10px 16px;border-bottom:1px solid #f5f6fa">
        <div style="width:40px;height:40px;border-radius:8px;background:${h.type==='National'?'var(--blue-bg)':'var(--amber-bg)'};display:flex;flex-direction:column;align-items:center;justify-content:center;flex-shrink:0">
          <div style="font-size:14px;font-weight:800;color:${h.type==='National'?'var(--blue)':'var(--amber)'}">${hDate.getDate()}</div>
          <div style="font-size:8px;color:${h.type==='National'?'var(--blue)':'var(--amber)'}">${months2[hDate.getMonth()]}</div>
        </div>
        <div style="flex:1">
          <div style="font-size:12px;font-weight:600;color:var(--navy)">${esc(h.title)}</div>
          <div style="font-size:11px;color:var(--muted)">${diff===0?'Today!':diff===1?'Tomorrow':diff+' days away'}</div>
        </div>
      </div>`;
    }).join('');
  }
}

async function addHoliday() {
  const title = document.getElementById('h-title').value.trim();
  const date = document.getElementById('h-date').value;
  const type = document.getElementById('h-type').value;
  const msg = document.getElementById('holidayMsg');
  if (!title || !date) { msg.textContent='⚠️ Fill all fields'; msg.style.color='var(--red)'; return; }
  const { error } = await sb.from('holidays').insert({ title, date, type });
  if (error) { msg.textContent='❌ '+error.message; msg.style.color='var(--red)'; return; }
  msg.textContent='✅ Holiday added!'; msg.style.color='var(--green)';
  document.getElementById('h-title').value='';
  document.getElementById('h-date').value='';
  loadHolidays();
  setTimeout(()=>msg.textContent='',3000);
}

function exportHolidaysPDF() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  doc.setFontSize(16); doc.setFont('helvetica','bold');
  doc.text('Sayash Vastu — Holiday List 2026', 14, 18);
  doc.setFontSize(10); doc.setFont('helvetica','normal');
  doc.text('Generated: '+new Date().toLocaleDateString('en-IN'), 14, 26);
  let y = 36;
  doc.setFontSize(9); doc.setFont('helvetica','bold');
  doc.text('#    Holiday                    Date              Day      Type', 14, y);
  y += 4; doc.line(14, y, 196, y); y += 5;
  doc.setFont('helvetica','normal');
  const rows = document.querySelectorAll('#holidaysBody tr');
  rows.forEach((row, i) => {
    if (y > 270) { doc.addPage(); y = 20; }
    const cells = row.querySelectorAll('td');
    if (cells.length >= 5) {
      doc.text(`${cells[0].textContent}.  ${cells[1].textContent.padEnd(25)} ${cells[2].textContent.padEnd(18)} ${cells[3].textContent.padEnd(8)} ${cells[4].textContent}`, 14, y);
      y += 6;
    }
  });
  doc.save('SayashVastu_Holidays_2026.pdf');
  showToast('✅ Holidays PDF exported!','ok');
}

// ═══════════════════════════════════════════
//  HR POLICIES
// ═══════════════════════════════════════════
async function loadHRPolicies() {
  const isCEO = currentUser.role === 'ceo';
  const ceoPanel = document.getElementById('ceo-policy-panel');
  if (ceoPanel) ceoPanel.style.display = isCEO ? 'block' : 'none';

  const { data: policies } = await sb.from('hr_policies').select('*').eq('is_active', true).order('created_at', {ascending: false});
  const el = document.getElementById('policiesList');

  if (!policies || !policies.length) {
    el.innerHTML = '<div class="empty-state"><div class="empty-icon">📜</div><div class="empty-title">No policies uploaded yet</div><p>CEO will upload company policies here</p></div>';
    return;
  }

  // Get acknowledgements for current user
  const { data: acks } = await sb.from('policy_acknowledgements').select('policy_id').eq('employee_email', currentUser.email);
  const ackedIds = (acks || []).map(a => a.policy_id);

  // Get acknowledgement counts for each policy
  const { data: allAcks } = await sb.from('policy_acknowledgements').select('policy_id, employee_email, employee_name, acknowledged_at');
  const { data: totalEmps } = await sb.from('employees').select('id').eq('is_active',true);
  const totalEmpCount = (totalEmps||[]).length;

  el.innerHTML = policies.map(p => {
    const isAcked = ackedIds.includes(p.id);
    const policyAcks = (allAcks||[]).filter(a=>a.policy_id===p.id);
    const ackCount = policyAcks.length;
    const ackPct = totalEmpCount > 0 ? Math.round((ackCount/totalEmpCount)*100) : 0;

    if (isCEO) {
      // CEO view - tracker only
      return `<div class="panel" style="margin-bottom:14px">
        <div class="panel-head">
          <div>
            <div class="panel-title">📜 ${esc(p.title)}</div>
            <div style="font-size:11px;color:var(--muted);margin-top:3px">${esc(p.description||'')} · Uploaded: ${new Date(p.created_at).toLocaleDateString('en-IN')}</div>
          </div>
          <div style="display:flex;align-items:center;gap:8px">
            <span class="badge ${ackPct===100?'b-green':ackPct>50?'b-amber':'b-red'}">${ackPct}% Acknowledged</span>
            ${p.file_url?`<a href="${p.file_url}" target="_blank" class="btn btn-outline btn-sm">👁️ View</a>`:''}
            <button class="btn btn-sm" onclick="deletePolicy('${p.id}')" style="background:#fdf0ee;color:var(--red);border-color:var(--red-bg)">🗑️</button>
          </div>
        </div>
        <div class="panel-body">
          <div style="display:flex;align-items:center;gap:12px;margin-bottom:10px">
            <div style="flex:1">
              <div class="progress-bar" style="height:8px">
                <div class="progress-fill" style="width:${ackPct}%;background:${ackPct===100?'var(--green)':ackPct>50?'var(--amber)':'var(--red)'}"></div>
              </div>
            </div>
            <span style="font-size:12px;font-weight:700;color:var(--navy)">${ackCount}/${totalEmpCount} employees</span>
          </div>
          ${ackCount > 0 ? `<div style="display:flex;flex-wrap:wrap;gap:6px">
            ${policyAcks.map(a=>`<div style="display:flex;align-items:center;gap:5px;background:var(--green-bg);padding:4px 8px;border-radius:20px">
              <span style="font-size:10px">✅</span>
              <span style="font-size:11px;font-weight:600;color:var(--green)">${esc(a.employee_name)}</span>
            </div>`).join('')}
          </div>` : '<div style="font-size:12px;color:var(--muted)">No acknowledgements yet</div>'}
        </div>
      </div>`;
    } else {
      // Employee view - full with acknowledge
      return `<div class="panel" style="margin-bottom:14px">
        <div class="panel-head">
          <div>
            <div class="panel-title">📜 ${esc(p.title)}</div>
            <div style="font-size:11px;color:var(--muted);margin-top:3px">${esc(p.description||'')} · Uploaded: ${new Date(p.created_at).toLocaleDateString('en-IN')}</div>
          </div>
          <div style="display:flex;align-items:center;gap:8px">
            ${isAcked ? '<span class="badge b-green">✅ Acknowledged</span>' : 
              p.mandatory_acknowledge ? '<span class="badge b-red">⚠️ Action Required</span>' : '<span class="badge b-gray">Optional</span>'}
          </div>
        </div>
        <div class="panel-body" style="display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap">
          <div style="display:flex;align-items:center;gap:10px">
            <span style="font-size:24px">📄</span>
            <div>
              <div style="font-size:13px;font-weight:600;color:var(--navy)">${esc(p.file_name||'Policy Document')}</div>
              ${p.mandatory_acknowledge && !isAcked ? '<div style="font-size:11px;color:var(--red);font-weight:600;margin-top:2px">⚠️ Please read and acknowledge this policy</div>' : ''}
            </div>
          </div>
          <div style="display:flex;gap:8px">
            ${p.file_url ? `<a href="${p.file_url}" target="_blank" class="btn btn-outline btn-sm">👁️ View PDF</a>` : ''}
            ${!isAcked ? `<button class="btn btn-gold btn-sm" onclick="acknowledgePolicy('${p.id}')">✅ I have read this policy</button>` : ''}
          </div>
        </div>
      </div>`;
    }
  }).join('');
}

async function acknowledgePolicy(policyId) {
  const { error } = await sb.from('policy_acknowledgements').insert({
    policy_id: policyId,
    employee_email: currentUser.email,
    employee_name: currentUser.name
  });
  if (error) { showToast('❌ '+error.message, 'err'); return; }
  showToast('✅ Policy acknowledged!', 'ok');
  loadHRPolicies();
}

async function deletePolicy(policyId) {
  if (!confirm('Delete this policy?')) return;
  await sb.from('hr_policies').update({is_active: false}).eq('id', policyId);
  showToast('✅ Policy removed!', 'ok');
  loadHRPolicies();
}

function previewPolicyFile(input) {
  const file = input.files[0];
  if (!file) return;
  document.getElementById('pol-preview').innerHTML = `
    <div style="display:flex;align-items:center;gap:10px">
      <span style="font-size:24px">📄</span>
      <div>
        <div style="font-size:12px;font-weight:600;color:var(--navy)">${file.name}</div>
        <div style="font-size:11px;color:var(--muted)">${(file.size/1024).toFixed(0)} KB</div>
      </div>
    </div>`;
}

async function uploadPolicy() {
  const title = document.getElementById('pol-title').value.trim();
  const desc = document.getElementById('pol-desc').value.trim();
  const file = document.getElementById('pol-file').files[0];
  const msgEl = document.getElementById('policyUploadMsg');
  if (!title) { msgEl.textContent='⚠️ Enter policy title'; msgEl.style.color='var(--red)'; return; }
  if (!file) { msgEl.textContent='⚠️ Select a PDF file'; msgEl.style.color='var(--red)'; return; }
  msgEl.textContent='⏳ Uploading...'; msgEl.style.color='var(--muted)';
  const path = `policies/${Date.now()}_${file.name.replace(/[^a-z0-9.]/gi,'_')}`;
  // Try task-files first, fallback to employee-photos bucket
  let uploadErr, urlData;
  const uploadResult = await sb.storage.from('task-files').upload(path, file, {upsert: true});
  if (uploadResult.error) {
    const uploadResult2 = await sb.storage.from('employee-photos').upload(path, file, {upsert: true});
    if (uploadResult2.error) { msgEl.textContent='❌ Upload failed: '+uploadResult2.error.message; msgEl.style.color='var(--red)'; return; }
    urlData = sb.storage.from('employee-photos').getPublicUrl(path).data;
  } else {
    urlData = sb.storage.from('task-files').getPublicUrl(path).data;
  }
  const { error } = await sb.from('hr_policies').insert({
    title, description: desc,
    file_url: urlData.publicUrl,
    file_name: file.name,
    mandatory_acknowledge: true,
    created_by_name: currentUser.name,
    created_by_email: currentUser.email
  });
  if (error) { msgEl.textContent='❌ '+error.message; msgEl.style.color='var(--red)'; return; }
  msgEl.textContent='✅ Policy uploaded!'; msgEl.style.color='var(--green)';
  document.getElementById('pol-title').value='';
  document.getElementById('pol-desc').value='';
  document.getElementById('pol-file').value='';
  document.getElementById('pol-preview').innerHTML='<div class="upload-zone-icon">📄</div><div class="upload-zone-text">Click to upload PDF</div>';
  loadHRPolicies();
  setTimeout(()=>msgEl.textContent='',4000);
}

// ═══════════════════════════════════════════
//  ATTENDANCE - ENHANCED
// ═══════════════════════════════════════════
async function loadMyAttendance() {
  const monthVal = document.getElementById('att-my-month').value;
  if (!monthVal) return;
  const [yr, mo] = monthVal.split('-');
  const start = `${yr}-${mo}-01`;
  const end = new Date(yr, mo, 0).toISOString().split('T')[0];
  const totalDays = new Date(yr, mo, 0).getDate();

 const { data: attData } = await sb.from('attendance').select('*')
    .eq('employee_email', currentUser.email)
    .eq('is_archived', false)
    .gte('date', start).lte('date', end)
    .order('date', {ascending: false});

  const { data: leaveDataMy } = await sb.from('leaves').select('*')
    .eq('employee_email', currentUser.email)
    .eq('status', 'Approved')
    .lte('from_date', end).gte('to_date', start);

  const presentDates = new Set((attData||[]).map(a => a.date));
  let leaveDayCount = 0;
  (leaveDataMy||[]).forEach(l => {
    let cur = new Date(Math.max(new Date(l.from_date), new Date(start)));
    const lend = new Date(Math.min(new Date(l.to_date), new Date(end)));
    while (cur <= lend) {
      const ds = cur.toISOString().split('T')[0];
      if (!presentDates.has(ds)) leaveDayCount++;
      cur.setDate(cur.getDate()+1);
    }
  });

  const present = (attData||[]).filter(a=>a.status==='Present').length;
  const absent = (attData||[]).filter(a=>a.status==='Absent').length;
  const half = (attData||[]).filter(a=>a.status==='Half Day').length;
  const leave = leaveDayCount;
  const pct = totalDays > 0 ? Math.round((present/totalDays)*100) : 0;

  document.getElementById('att-present').textContent = present;
  document.getElementById('att-absent').textContent = absent;
  document.getElementById('att-half').textContent = half;
  document.getElementById('att-leave').textContent = leave;
  document.getElementById('att-pct').textContent = pct + '%';

  // Summary card
  const totalHrs = (attData||[]).reduce((s,a) => s + parseFloat(a.working_hours||0), 0);
  const avgHrs = present > 0 ? (totalHrs/present).toFixed(1) : 0;
  document.getElementById('attSummary').innerHTML = `
    <div style="display:flex;flex-direction:column;gap:8px">
      <div style="display:flex;justify-content:space-between;padding:8px 10px;background:var(--bg);border-radius:8px">
        <span style="font-size:12px;color:var(--muted)">Working Days</span>
        <span style="font-size:13px;font-weight:700;color:var(--navy)">${totalDays}</span>
      </div>
      <div style="display:flex;justify-content:space-between;padding:8px 10px;background:var(--green-bg);border-radius:8px">
        <span style="font-size:12px;color:var(--green)">Attendance %</span>
        <span style="font-size:13px;font-weight:700;color:var(--green)">${pct}%</span>
      </div>
      <div style="display:flex;justify-content:space-between;padding:8px 10px;background:var(--bg);border-radius:8px">
        <span style="font-size:12px;color:var(--muted)">Total Hours</span>
        <span style="font-size:13px;font-weight:700;color:var(--navy)">${totalHrs.toFixed(1)}h</span>
      </div>
      <div style="display:flex;justify-content:space-between;padding:8px 10px;background:var(--bg);border-radius:8px">
        <span style="font-size:12px;color:var(--muted)">Avg Hours/Day</span>
        <span style="font-size:13px;font-weight:700;color:var(--navy)">${avgHrs}h</span>
      </div>
    </div>
  `;

  // Table
  const days2 = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  const tbody = document.getElementById('attBody');
  if (!attData || !attData.length) {
    tbody.innerHTML='<tr><td colspan="7" style="text-align:center;color:var(--muted);padding:30px">No attendance records this month</td></tr>';
    return;
  }
  tbody.innerHTML = attData.map(a => {
    const d = new Date(a.date);
const isWeekend = d.getDay()===0;
    return `<tr style="${isWeekend?'background:#f8f9fc':''}">
      <td style="font-weight:600">${fmtDate(a.date)}</td>
      <td style="font-size:11px;color:${isWeekend?'var(--muted)':'var(--text)'}">${days2[d.getDay()]}</td>
      <td>${a.check_in?new Date(a.check_in).toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'}):'—'}</td>
      <td>${a.check_out?new Date(a.check_out).toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'}):'—'}</td>
      <td style="font-weight:600">${a.working_hours?parseFloat(a.working_hours).toFixed(1)+'h':'—'}</td>
      <td>${attBadge(a.status)}</td>
      <td><button class="btn btn-sm" onclick="deleteAttendance('${a.id}')" style="background:#fdf0ee;color:var(--red);border-color:var(--red-bg)">🗑️</button></td>
    </tr>`;
  }).join('');
}

async function exportMyAttPDF() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const W = 210; const H = 297;

  const monthVal = document.getElementById('att-my-month').value;
  if (!monthVal) { showToast('⚠️ Please select a month', 'err'); return; }
  const [yr, mo] = monthVal.split('-').map(Number);
  const monthName = new Date(yr, mo - 1, 1).toLocaleString('en', { month: 'long' });
  const lastDay = new Date(yr, mo, 0).getDate();
  const fromDate = `01-${String(mo).padStart(2,'0')}-${yr}`;
  const toDate = `${lastDay}-${String(mo).padStart(2,'0')}-${yr}`;
  const totalDays = lastDay;

  const start = `${yr}-${String(mo).padStart(2,'0')}-01`;
  const end   = `${yr}-${String(mo).padStart(2,'0')}-${String(lastDay).padStart(2,'0')}`;
const { data: attData } = await sb.from('attendance')
    .select('*').eq('employee_email', currentUser.email)
    .eq('is_archived', false).gte('date', start).lte('date', end)
    .order('date', { ascending: true });

  const { data: leaveDataMyPdf } = await sb.from('leaves').select('*')
    .eq('employee_email', currentUser.email)
    .eq('status', 'Approved')
    .lte('from_date', end).gte('to_date', start);

  const rows = attData || [];

  const days3   = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  const months3 = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const attMap  = {};
  rows.forEach(a => { attMap[a.date] = a; });

  const dailyRows = [];
  for (let d = 1; d <= lastDay; d++) {
    const dateObj  = new Date(yr, mo - 1, d);
    const dateStr  = `${yr}-${String(mo).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    const dayName  = days3[dateObj.getDay()];
    const dispDate = `${String(d).padStart(2,'0')}-${months3[mo-1]}-${yr}`;
    const a        = attMap[dateStr];
const isWeekend = dateObj.getDay() === 0;
    const onLeave = (leaveDataMyPdf||[]).find(l => dateStr >= l.from_date && dateStr <= l.to_date);
    const todayCheckPdf = new Date(); todayCheckPdf.setHours(0,0,0,0);
    const isFuturePdf = dateObj > todayCheckPdf;
    if (a) {
      const ci  = a.check_in  ? new Date(a.check_in).toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'}) : '—';
      const co  = a.check_out ? new Date(a.check_out).toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'}) : '—';
      const hrs = a.working_hours ? parseFloat(a.working_hours).toFixed(2) : '—';
const isLate = a.check_in && (() => { const t = new Date(a.check_in); return t.getHours() > 10 || (t.getHours()===10 && t.getMinutes()>15); })();
      dailyRows.push([dispDate, dayName, a.status || 'Present', ci, co, hrs, isLate ? 'Yes' : 'No', a.work_type || '']);
    } else if (onLeave) {
      dailyRows.push([dispDate, dayName, 'Leave', '—', '—', '—', '—', onLeave.leave_type || '']);
    } else if (isWeekend) {
      dailyRows.push([dispDate, dayName, 'Week Off', '—', '—', '—', '—', 'Week Off']);
    } else if (isFuturePdf) {
      dailyRows.push([dispDate, dayName, '—', '—', '—', '—', '—', '']);
    } else {
      dailyRows.push([dispDate, dayName, 'Absent', '—', '—', '—', '—', '']);
    }
  }

  const present = dailyRows.filter(r => r[2] === 'Present').length;
  const absent  = dailyRows.filter(r => r[2] === 'Absent').length;
  const leave   = dailyRows.filter(r => r[2] === 'Leave').length;
  const weekOff = dailyRows.filter(r => r[2] === 'Week Off').length;
  const futureDaysPdf = dailyRows.filter(r => r[2] === '—').length;
  const late    = dailyRows.filter(r => r[6] === 'Yes').length;
  const attPct = (totalDays - weekOff - futureDaysPdf) > 0 ? ((present / (totalDays - weekOff - futureDaysPdf)) * 100).toFixed(2) + '%' : '0%';
  const ORANGE = [232,101,26]; const NAVY = [26,58,92]; const DARK = [34,34,34];
  const MUTED  = [85,85,85];  const BORDER= [200,213,229]; const LIGHT = [245,248,252];
  const GREEN  = [26,110,60]; const RED   = [163,45,45];  const AMBER = [133,79,11];
  const PURPLE = [83,58,183]; const BLUE  = [24,95,165];

  const setFill   = (rgb) => doc.setFillColor(rgb[0], rgb[1], rgb[2]);
  const setStroke = (rgb) => doc.setDrawColor(rgb[0], rgb[1], rgb[2]);
  const setFont   = (c)   => doc.setTextColor(c[0], c[1], c[2]);

  // ── HEADER ──────────────────────────────────────────
  setFill([255,255,255]); doc.rect(0, 0, W, 28, 'F');

  try {
const logoUrl = 'https://rgoujuvdqqddqeqnryfg.supabase.co/storage/v1/object/public/Task-Files/Sayash%20logo.png';
    const logoRes = await fetch(logoUrl);
    if (logoRes.ok) {
      const logoBlob = await logoRes.blob();
      const logoBase64 = await new Promise(res => {
        const r = new FileReader(); r.onload = () => res(r.result); r.readAsDataURL(logoBlob);
      });
      doc.addImage(logoBase64, 'PNG', 10, 3, 32, 22);
    }
  } catch(e) { console.log('Logo skip:', e.message); }

  doc.setFontSize(13); doc.setFont('helvetica','bold'); setFont(ORANGE);
  doc.text('SAYASH VASTU', W/2, 11, { align: 'center' });
  doc.setFontSize(8); doc.setFont('helvetica','normal'); setFont(DARK);
  doc.text('Vastu Shastra Consultancy Services', W/2, 16, { align: 'center' });
  doc.text('Netaji Subhash Place, New Delhi', W/2, 20.5, { align: 'center' });

  setStroke(ORANGE); doc.setLineWidth(0.5);
  doc.line(0, 28, W, 28);

  // ── TITLE ───────────────────────────────────────────
  let y = 35;
  doc.setFontSize(17); doc.setFont('helvetica','bold'); setFont(NAVY);
  doc.text('ATTENDANCE REPORT', W/2, y, { align: 'center' });
  y += 3.5;
  setStroke(ORANGE); doc.setLineWidth(0.4);
  doc.line(10, y, W-10, y);

  // ── EMPLOYEE INFO BOX ────────────────────────────────
  y += 3;
  const boxH = 22;
  setFill(LIGHT); setStroke(BORDER); doc.setLineWidth(0.3);
  doc.roundedRect(10, y, W-20, boxH, 2, 2, 'FD');

const { data: empFresh } = await sb.from('employees').select('*').eq('email', currentUser.email).single();
const leftInfo  = [['Employee ID', empFresh?.employee_code || currentUser.employee_code || '—'],['Employee Name', empFresh?.name || currentUser.name],['Designation', empFresh?.designation || currentUser.designation || '—'],['Department', empFresh?.department || currentUser.department || '—']];
  const rightInfo = [['Report For', monthName + ' ' + yr],['From Date', fromDate],['To Date', toDate],['Total Working Days', String(totalDays)]];
  const rowH = 4.8; const sy = y + 4;
  leftInfo.forEach(([lbl, val], i) => {
    const iy = sy + i * rowH;
    doc.setFontSize(7.5); doc.setFont('helvetica','bold'); setFont(MUTED); doc.text(lbl + ':', 13, iy);
    doc.setFont('helvetica','normal'); setFont(DARK); doc.text(String(val), 46, iy);
  });
  rightInfo.forEach(([lbl, val], i) => {
    const iy = sy + i * rowH;
    doc.setFontSize(7.5); doc.setFont('helvetica','bold'); setFont(MUTED); doc.text(lbl + ':', W/2 + 3, iy);
    doc.setFont('helvetica','normal'); setFont(DARK); doc.text(String(val), W/2 + 38, iy);
  });
  y += boxH + 5;

  // ── SUMMARY ─────────────────────────────────────────
  doc.setFontSize(9); doc.setFont('helvetica','bold'); setFont(NAVY);
  doc.text('SUMMARY', W/2, y, { align: 'center' });
  y += 4;
const halfDay = rows.filter(a => a.status === 'Half Day').length;
  const sumCols = ['PRESENT','HALF DAY','ABSENT','LEAVE','LATE MARKS','ATTENDANCE %'];
const sumVals = [String(present), String(halfDay), String(absent), String(leave), String(late), attPct];
const sumClrs = [GREEN, AMBER, RED, PURPLE, RED, GREEN];
  const cw = (W - 20) / 6;
  const hdrH = 6; const valH = 10;

  setFill(NAVY); doc.rect(10, y, W-20, hdrH, 'F');
  doc.setFontSize(6.5); doc.setFont('helvetica','bold'); setFont([255,255,255]);
  sumCols.forEach((col, i) => doc.text(col, 10 + i*cw + cw/2, y + 4, { align: 'center' }));
  y += hdrH;

  setFill([235,242,251]); setStroke(BORDER); doc.setLineWidth(0.3);
  doc.rect(10, y, W-20, valH, 'FD');
  for (let i=1; i<6; i++) doc.line(10+i*cw, y, 10+i*cw, y+valH);
  doc.setFontSize(15); doc.setFont('helvetica','bold');
  sumVals.forEach((v, i) => { setFont(sumClrs[i]); doc.text(v, 10+i*cw+cw/2, y+7, { align: 'center' }); });
  y += valH + 6;

  // ── DAILY ATTENDANCE DETAILS ─────────────────────────
  doc.setFontSize(9); doc.setFont('helvetica','bold'); setFont(NAVY);
  doc.text('DAILY ATTENDANCE DETAILS', W/2, y, { align: 'center' });
  y += 4;

  const halfW   = (W - 24) / 2;
  const gap     = 4;
  const tCols   = ['Date','Day','Status','Check In','Check Out','Hours','Late','Remarks'];
  const rawW    = [23, 9, 15, 20, 20, 14, 8, 21];
  const totalW  = rawW.reduce((s,x) => s+x, 0);
  const tWidths = rawW.map(x => (x / totalW) * halfW);
  const trh     = 5;
  const sColors = { 'Present':GREEN,'Absent':RED,'Leave':PURPLE,'Week Off':BLUE,'Half Day':AMBER };

  const drawHalfHeader = (cx, ty) => {
    setFill(NAVY); doc.rect(cx, ty, halfW, trh, 'F');
    doc.setFontSize(6); doc.setFont('helvetica','bold'); setFont([255,255,255]);
    let tx = cx;
    tCols.forEach((col, i) => { doc.text(col, tx + 0.8, ty + 3.5); tx += tWidths[i]; });
    return ty + trh;
  };

  const drawHalfRows = (cx, startY, rowsData) => {
    let cy = startY;
    rowsData.forEach((row, idx) => {
      const [date,day,status,ci,co,hrs,lateVal,rem] = row;
      const isWO = status === 'Week Off';
      const bg = isWO ? [238,234,248] : (idx%2===0 ? [248,249,252] : [255,255,255]);
      setFill(bg); setStroke([221,229,239]); doc.setLineWidth(0.15);
      doc.rect(cx, cy, halfW, trh, 'FD');
      const vals = [date,day,status,ci,co,hrs,lateVal,rem];
      let tx = cx;
      vals.forEach((val, ci2) => {
        if (ci2 === 2) {
          doc.setFontSize(6); doc.setFont('helvetica','bold');
          setFont(sColors[val] || DARK);
        } else if (ci2 === 6 && val === 'Yes') {
          doc.setFontSize(6); doc.setFont('helvetica','bold'); setFont(RED);
        } else {
          doc.setFontSize(6); doc.setFont('helvetica','normal');
          setFont(isWO ? MUTED : [51,51,51]);
        }
        doc.text(String(val || ''), tx + 0.8, cy + 3.5);
        tx += tWidths[ci2];
      });
      cy += trh;
    });
    return cy;
  };

  const half      = Math.ceil(dailyRows.length / 2);
  const leftRows  = dailyRows.slice(0, half);
  const rightRows = dailyRows.slice(half);
  const lx = 10; const rx = 10 + halfW + gap;

  let yl  = drawHalfHeader(lx, y);
  let yr2 = drawHalfHeader(rx, y);
  yl  = drawHalfRows(lx, yl, leftRows);
  yr2 = drawHalfRows(rx, yr2, rightRows);
  y = Math.max(yl, yr2) + 5;

  // ── LEGEND ───────────────────────────────────────────
  doc.setFontSize(7); doc.setFont('helvetica','bold'); setFont(MUTED);
  doc.text('LEGEND:', 10, y);
  const legs = [['P','Present',GREEN],['A','Absent',RED],['L','Late',AMBER],['CL','Casual Leave',PURPLE],['WO','Week Off',BLUE]];
  let lx2 = 27;
  legs.forEach(([code, label, color]) => {
    doc.setFontSize(7); doc.setFont('helvetica','bold'); setFont(color); doc.text(code, lx2, y);
    doc.setFont('helvetica','normal'); setFont(DARK); doc.text('= ' + label, lx2 + code.length * 2.5 + 0.5, y);
    lx2 += 33;
  });
  y += 6;

  // ── SIGNATURE ────────────────────────────────────────
  const sigH = 20;
  setFill(LIGHT); setStroke(BORDER); doc.setLineWidth(0.3);
  doc.rect(10, y, W-20, sigH, 'FD');
  const sw = (W-20)/2;

  const lsx = 10 + sw/2;
  doc.setFontSize(8.5); doc.setFont('helvetica','bold'); setFont(NAVY);
  doc.text('HR Manager Signature', lsx, y + 5, { align: 'center' });
  setStroke(NAVY); doc.setLineWidth(0.4);
  doc.line(lsx - 25, y + 14, lsx + 25, y + 14);
  doc.setFontSize(7.5); doc.setFont('helvetica','normal'); setFont(MUTED);
  doc.text('Sayash Vastu — HR Department', lsx, y + 17.5, { align: 'center' });

  setStroke(BORDER); doc.setLineWidth(0.3);
  doc.line(10 + sw, y + 2, 10 + sw, y + sigH - 2);

  const rsx = 10 + sw + sw/2;
  doc.setFontSize(8.5); doc.setFont('helvetica','bold'); setFont(NAVY);
  doc.text('Authorized Signatory', rsx, y + 5, { align: 'center' });
  setStroke(NAVY); doc.setLineWidth(0.4);
  doc.line(rsx - 25, y + 14, rsx + 25, y + 14);
  doc.setFontSize(7.5); doc.setFont('helvetica','normal'); setFont(MUTED);
  doc.text('Sayash Vastu — Management', rsx, y + 17.5, { align: 'center' });

  doc.save(`SayashVastu_Attendance_${currentUser.name.replace(/ /g,'_')}_${monthName}_${yr}.pdf`);
  showToast('✅ Attendance PDF exported!', 'ok');
}
// ═══════════════════════════════════════════
//  LEAVES - ENHANCED
// ═══════════════════════════════════════════
async function exportLeavesPDF() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  doc.setFontSize(16); doc.setFont('helvetica','bold');
  doc.text('Sayash Vastu — Leave Report', 14, 18);
  doc.setFontSize(10); doc.setFont('helvetica','normal');
  doc.text(`Employee: ${currentUser.name} | Generated: ${new Date().toLocaleDateString('en-IN')}`, 14, 26);
  const rows = document.querySelectorAll('#leaveBody tr');
  let y = 36;
  doc.setFontSize(9); doc.setFont('helvetica','bold');
  doc.text('Type       From         To           Days  Reason                Status', 14, y);
  y += 4; doc.line(14, y, 196, y); y += 5;
  doc.setFont('helvetica','normal');
  rows.forEach(row => {
    if (y > 270) { doc.addPage(); y = 20; }
    const cells = row.querySelectorAll('td');
    if (cells.length >= 6) {
      const line = `${cells[0].textContent.padEnd(11)} ${cells[1].textContent.padEnd(13)} ${cells[2].textContent.padEnd(13)} ${cells[3].textContent.padEnd(6)} ${cells[4].textContent.substring(0,20).padEnd(22)} ${cells[5].textContent}`;
      doc.text(line, 14, y);
      y += 6;
    }
  });
  doc.save(`SayashVastu_Leaves_${currentUser.name}.pdf`);
  showToast('✅ Leave PDF exported!','ok');
}

// ═══════════════════════════════════════════
//  MY PROFILE
// ═══════════════════════════════════════════
async function loadMyProfile() {
  const { data: emp } = await sb.from('employees').select('*').eq('email', currentUser.email).single();
  if (!emp) return;

  // Photo
  const photoEl = document.getElementById('profilePhotoWrap');
  if (emp.photo_url) {
    photoEl.innerHTML = `<img src="${emp.photo_url}" style="width:90px;height:90px;object-fit:cover;border-radius:50%"/>`;
  } else {
    photoEl.textContent = emp.name.substring(0,2).toUpperCase();
  }

  // Work info (read only)
  document.getElementById('pi-code').textContent = emp.employee_code || '—';
  document.getElementById('pi-dept').textContent = emp.department || '—';
  document.getElementById('pi-desig').textContent = emp.designation || '—';
document.getElementById('pi-joining').textContent = emp.joining_date ? fmtDate(emp.joining_date) : '—';
  const offerLetterEl = document.getElementById('myOfferLetter');
  if (offerLetterEl) {
    offerLetterEl.innerHTML = emp.offer_letter_url 
      ? `<a href="${emp.offer_letter_url}" target="_blank" class="btn btn-gold btn-sm">📄 View / Download Offer Letter</a>`
      : `<span style="color:var(--muted);font-size:12px">Offer letter not uploaded yet by HR</span>`;
  }
  loadMyDocs();
  // Editable fields
  document.getElementById('pi-name').value = emp.name || '';
  document.getElementById('pi-email').value = emp.email || '';
  document.getElementById('pi-phone').value = emp.phone || '';
  document.getElementById('pi-dob').value = emp.date_of_birth || '';
  document.getElementById('pi-gender').value = emp.gender || '';
  document.getElementById('pi-address').value = emp.address || '';
}
async function loadMyDocs() {
  const { data } = await sb.from('employee_documents')
    .select('*').eq('employee_email', currentUser.email)
    .order('uploaded_at', {ascending: false});
  const el = document.getElementById('myDocsList');
  if (!el) return;
  if (!data || !data.length) {
    el.innerHTML = '<div style="text-align:center;color:var(--muted);font-size:13px;padding:16px">No documents uploaded yet</div>';
    return;
  }
  el.innerHTML = data.map(d => `
    <div style="display:flex;align-items:center;justify-content:space-between;padding:10px 0;border-bottom:1px solid #f5f6fa">
      <div style="display:flex;align-items:center;gap:10px">
        <span style="font-size:20px">🪪</span>
        <div>
          <div style="font-size:13px;font-weight:600;color:var(--navy)">${esc(d.document_type)}</div>
          <div style="font-size:11px;color:var(--muted)">${esc(d.file_name||'—')} · ${new Date(d.uploaded_at).toLocaleDateString('en-IN')}</div>
        </div>
      </div>
      <div style="display:flex;gap:8px">
        <a href="${d.file_url}" target="_blank" class="btn btn-outline btn-sm">👁️ View</a>
        <button class="btn btn-sm" onclick="deleteDoc('${d.id}')" style="background:#fdf0ee;color:var(--red);border-color:var(--red-bg)">🗑️</button>
      </div>
    </div>
  `).join('');
}

function previewDocFile(input) {
  const file = input.files[0];
  if (!file) return;
  document.getElementById('doc-preview').innerHTML = `
    <div style="font-size:12px;font-weight:600;color:var(--navy)">${file.name}</div>
    <div style="font-size:11px;color:var(--muted)">${(file.size/1024).toFixed(0)} KB</div>`;
}

async function uploadDocument() {
  const type = document.getElementById('doc-type').value;
  const file = document.getElementById('doc-file').files[0];
  const msgEl = document.getElementById('docMsg');
  if (!file) { msgEl.textContent='⚠️ Please select a file'; msgEl.style.color='var(--red)'; return; }
  if (file.size > 5*1024*1024) { msgEl.textContent='❌ Max 5MB allowed'; msgEl.style.color='var(--red)'; return; }
  msgEl.textContent='⏳ Uploading...'; msgEl.style.color='var(--muted)';
  const path = `documents/${currentUser.id}/${Date.now()}_${file.name.replace(/[^a-z0-9.]/gi,'_')}`;
const { error: uploadErr } = await sb.storage.from('employee-docs').upload(path, file, {upsert: false});
  if (uploadErr) { msgEl.textContent='❌ '+uploadErr.message; msgEl.style.color='var(--red)'; return; }
const { data: urlData } = sb.storage.from('employee-docs').getPublicUrl(path);
  const { error } = await sb.from('employee_documents').insert({
    employee_email: currentUser.email,
    employee_name: currentUser.name,
    document_type: type,
    file_url: urlData.publicUrl,
    file_name: file.name
  });
  if (error) { msgEl.textContent='❌ '+error.message; msgEl.style.color='var(--red)'; return; }
  msgEl.textContent='✅ Document uploaded!'; msgEl.style.color='var(--green)';
  document.getElementById('doc-file').value='';
  document.getElementById('doc-preview').innerHTML='<div class="upload-zone-text">Click to upload</div><div class="upload-zone-hint">PDF, JPG, PNG — max 5MB</div>';
  loadMyDocs();
  setTimeout(()=>msgEl.textContent='',4000);
}

async function deleteDoc(docId) {
  if (!confirm('Delete this document?')) return;
  await sb.from('employee_documents').delete().eq('id', docId);
  showToast('✅ Document deleted!','ok');
  loadMyDocs();
}
async function saveProfile() {
  const name = document.getElementById('pi-name').value.trim();
  const phone = document.getElementById('pi-phone').value.trim();
  const dob = document.getElementById('pi-dob').value;
  const gender = document.getElementById('pi-gender').value;
  const address = document.getElementById('pi-address').value.trim();
  const msgEl = document.getElementById('profileMsg');

  if (!name) { msgEl.textContent = '⚠️ Name required'; msgEl.style.color = 'var(--red)'; return; }

  const { error } = await sb.from('employees').update({
    name, phone, date_of_birth: dob || null, gender, address
  }).eq('email', currentUser.email);

  if (error) { msgEl.textContent = '❌ '+error.message; msgEl.style.color = 'var(--red)'; return; }

  // Update session
  currentUser.name = name;
  currentUser.phone = phone;
  localStorage.setItem('sv_user', JSON.stringify(currentUser));

  msgEl.textContent = '✅ Profile saved!'; msgEl.style.color = 'var(--green)';
  showToast('✅ Profile updated!', 'ok');
  document.getElementById('sidebarName').textContent = name;
  document.getElementById('sidebarAv').textContent = name.substring(0,2).toUpperCase();
  setTimeout(() => msgEl.textContent = '', 4000);
}

async function changeOwnPassword() {
  const newPass = document.getElementById('pi-newpass').value.trim();
  const confirmPass = document.getElementById('pi-confirmpass').value.trim();
  const msgEl = document.getElementById('passChangeMsg');

  if (!newPass) { msgEl.textContent = '⚠️ Enter new password'; msgEl.style.color = 'var(--red)'; return; }
  if (newPass.length < 6) { msgEl.textContent = '⚠️ Min 6 characters'; msgEl.style.color = 'var(--red)'; return; }
  if (newPass !== confirmPass) { msgEl.textContent = '❌ Passwords do not match'; msgEl.style.color = 'var(--red)'; return; }

  const { error } = await sb.from('employees').update({ password_hash: newPass }).eq('email', currentUser.email);
  if (error) { msgEl.textContent = '❌ '+error.message; msgEl.style.color = 'var(--red)'; return; }

  msgEl.textContent = '✅ Password updated!'; msgEl.style.color = 'var(--green)';
  showToast('✅ Password changed!', 'ok');
  document.getElementById('pi-newpass').value = '';
  document.getElementById('pi-confirmpass').value = '';
  setTimeout(() => msgEl.textContent = '', 4000);
}

async function uploadProfilePhoto(input) {
  const file = input.files[0];
  if (!file) return;
  if (file.size > 5 * 1024 * 1024) { showToast('❌ File too large (max 5MB)', 'err'); return; }

  // Show preview immediately
  const reader = new FileReader();
  reader.onload = function(e) {
    const photoEl = document.getElementById('profilePhotoWrap');
    if (photoEl) photoEl.innerHTML = `<img src="${e.target.result}" style="width:90px;height:90px;object-fit:cover;border-radius:50%"/>`;
  };
  reader.readAsDataURL(file);

  showToast('⏳ Uploading photo...', '');
  const ext = file.name.split('.').pop().toLowerCase();
  const path = `${currentUser.id}/profile_${Date.now()}.${ext}`;

  // Try employee-photos bucket
  const { error: uploadErr } = await sb.storage.from('employee-photos').upload(path, file, {upsert: true});
  if (uploadErr) {
    // Try task-files bucket as fallback
    const { error: uploadErr2 } = await sb.storage.from('task-files').upload(path, file, {upsert: true});
    if (uploadErr2) { showToast('❌ Upload failed: '+uploadErr2.message, 'err'); return; }
    var urlData = sb.storage.from('task-files').getPublicUrl(path).data;
  } else {
    var urlData = sb.storage.from('employee-photos').getPublicUrl(path).data;
  }

  // Add cache buster to URL
  const photoUrl = urlData.publicUrl + '?t=' + Date.now();
  const { error: updateErr } = await sb.from('employees').update({photo_url: urlData.publicUrl}).eq('email', currentUser.email);
  if (updateErr) { showToast('❌ '+updateErr.message, 'err'); return; }
  currentUser.photo_url = urlData.publicUrl;
  localStorage.setItem('sv_user', JSON.stringify(currentUser));
  showToast('✅ Photo updated!', 'ok');

  // Update sidebar photo
  const sidebarAvEl = document.getElementById('sidebarAv');
  if (sidebarAvEl) {
    sidebarAvEl.innerHTML = `<img src="${photoUrl}" style="width:36px;height:36px;object-fit:cover;border-radius:50%"/>`;
    sidebarAvEl.style.background = 'transparent';
  }
  // Update profile photo wrap
  const photoWrap = document.getElementById('profilePhotoWrap');
  if (photoWrap) photoWrap.innerHTML = `<img src="${photoUrl}" style="width:90px;height:90px;object-fit:cover;border-radius:50%"/>`;
  // Update emp dashboard avatar
  const empAv = document.getElementById('empPhotoAv');
  if (empAv) { empAv.innerHTML = `<img src="${photoUrl}" style="width:64px;height:64px;object-fit:cover;border-radius:50%"/>`; empAv.style.background='transparent'; }
}

// Birthday check
async function checkBirthdays() {
  const today = new Date();
  const mm = String(today.getMonth()+1).padStart(2,'0');
  const dd = String(today.getDate()).padStart(2,'0');
  const { data: emps } = await sb.from('employees').select('name,email,date_of_birth').eq('is_active',true);
  if (!emps) return;
  const bdays = emps.filter(e => {
    if (!e.date_of_birth) return false;
    const dob = new Date(e.date_of_birth);
    return String(dob.getMonth()+1).padStart(2,'0') === mm && String(dob.getDate()).padStart(2,'0') === dd;
  });
  return bdays;
}

async function loadBirthdaySection() {
  const bdays = await checkBirthdays();
  if (!bdays || !bdays.length) return;
  
  // Show birthday banner for ALL users
  const bdayEl = document.getElementById('birthdayBanner');
  if (bdayEl) {
    bdayEl.style.display = 'block';
    bdayEl.innerHTML = bdays.map(e => `
      <div style="display:flex;align-items:center;gap:12px;padding:14px 18px;background:linear-gradient(135deg,#fdf6e3,#fff8e7);border-radius:12px;border:1px solid #f0c96a;margin-bottom:8px;box-shadow:0 2px 8px rgba(201,168,76,0.15)">
        <span style="font-size:32px">🎂</span>
        <div style="flex:1">
          <div style="font-size:14px;font-weight:700;color:var(--navy)">Happy Birthday, ${esc(e.name)}! 🎉</div>
          <div style="font-size:12px;color:var(--muted);margin-top:2px">Wishing you a wonderful day from the entire Sayash Vastu family!</div>
        </div>
        <div style="font-size:24px">🎊</div>
      </div>
    `).join('');
  }

  // Send birthday wish email - only once per day at morning
  const bdayKey = 'sv_bday_sent_' + new Date().toDateString();
  const alreadySent = localStorage.getItem(bdayKey);
  if (!alreadySent) {
    for (const emp of bdays) {
      await sendEmail(
        emp.email,
        emp.name,
        'Happy Birthday! - Sayash Vastu',
        `Dear ${emp.name},

Wishing you a very Happy Birthday! 🎉🎂

May this special day bring you lots of joy, happiness and success.

Your hard work and dedication inspire us all. Have a fantastic day!

With warm wishes,
Sayash Vastu Family

P.S. Your team is lucky to have you!`,
        'Birthday',
        'https://sayash-vastu-portal.vercel.app',
        'Visit Portal →'
      );
      // Also notify CEO
      if (emp.email !== CEO_EMAIL) {
        await sendEmail(
          CEO_EMAIL,
          'CEO Admin',
          'Birthday Reminder - ' + emp.name,
          `Today is ${emp.name}'s birthday!

Don't forget to wish them! A birthday wish from the CEO means a lot to the team.

Employee: ${emp.name}
Designation: ${emp.designation||'—'}`,
          'Birthday Reminder',
          'https://sayash-vastu-portal.vercel.app',
          'View Portal →'
        );
      }
    }
    localStorage.setItem(bdayKey, 'true');
  }
}

async function deleteAttendance(attId) {
  if (!confirm('Delete this attendance record?')) return;
  const { error } = await sb.from('attendance').update({is_archived: true}).eq('id', attId);
  if (error) { showToast('❌ ' + error.message, 'err'); return; }
  showToast('✅ Attendance archived!', 'ok');
  loadAttendance();
  loadMyAttendance();
}

async function deleteEmpAttendance(empEmail, monthVal) {
  if (!confirm('Delete all attendance records for this employee this month?')) return;
  const [yr, mo] = monthVal.split('-');
  const start = `${yr}-${mo}-01`;
  const end = new Date(yr, mo, 0).toISOString().split('T')[0];
  const { error } = await sb.from('attendance').delete().eq('employee_email', empEmail).gte('date', start).lte('date', end);
  if (error) { showToast('❌ ' + error.message, 'err'); return; }
  showToast('✅ Records deleted!', 'ok');
  loadAttReport();
}

async function toggleEmployee(empId, isActive) {
  const action = isActive ? 'deactivate' : 'activate';
  if (!confirm(`Are you sure you want to ${action} this employee?`)) return;
  const { error } = await sb.from('employees').update({ is_active: !isActive }).eq('id', empId);
  if (error) { showToast('❌ ' + error.message, 'err'); return; }
  showToast(`✅ Employee ${action}d!`, 'ok');
  loadEmployees();
}

async function deleteNotice(noticeId) {
  if (!confirm('Delete this notice?')) return;
  const { error } = await sb.from('notices').update({ is_active: false }).eq('id', noticeId);
  if (error) { showToast('❌ ' + error.message, 'err'); return; }
  showToast('✅ Notice deleted!', 'ok');
  loadNotices();
}

async function cancelLeave(leaveId) {
  if (!confirm('Cancel this leave request?')) return;
  const { error } = await sb.from('leaves').delete().eq('id', leaveId);
  if (error) { showToast('❌ ' + error.message, 'err'); return; }
  showToast('✅ Leave cancelled!', 'ok');
  loadLeaves();
}

async function deleteLeaveRecord(leaveId) {
  if (!confirm('Delete this leave record?')) return;
  const { error } = await sb.from('leaves').update({is_archived: true}).eq('id', leaveId);
  if (error) { showToast('❌ ' + error.message, 'err'); return; }
  showToast('✅ Leave archived!', 'ok');
  loadLeaveApprovals();
}

// ═══════════════════════════════════════════
//  SENIOR REVIEW
// ═══════════════════════════════════════════
async function loadSeniorBadge() {
  const { data } = await sb.from('tasks').select('id').eq('is_archived',false).eq('work_status','Sent to Senior').eq('senior_approval','Pending');
  const count = (data||[]).length;
  const badge = document.getElementById('nb-senior');
  if (badge) { badge.textContent = count; badge.style.display = count > 0 ? 'inline-block' : 'none'; }
}

async function loadSeniorReview() {
  const { data } = await sb.from('tasks').select('*').eq('is_archived',false).eq('work_status','Sent to Senior').order('created_at',{ascending:false});
  const el = document.getElementById('seniorReviewList');
  if (!data || !data.length) {
    el.innerHTML = '<div class="empty-state"><div class="empty-icon">🎉</div><div class="empty-title">No pending reviews</div><p>All tasks reviewed!</p></div>';
    return;
  }
  el.innerHTML = data.map(t => `
    <div class="leave-action-card" style="margin-bottom:12px">
      <div class="leave-action-head">
        <div>
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">
            <span style="background:#e8ecf5;color:var(--navy);padding:2px 8px;border-radius:4px;font-size:11px;font-weight:700">${esc(t.project)}</span>
            ${statusBadge(t.work_status)}
          </div>
          <div style="font-size:13px;font-weight:600;color:var(--navy)">${esc(t.task_detail)}</div>
          <div style="font-size:11px;color:var(--muted);margin-top:4px">
            👤 Assigned to: ${esc(t.assigned_to_name)} · End: ${fmtDate(t.end_date)}
          </div>
          ${t.comments ? `<div style="font-size:12px;color:var(--muted);margin-top:6px;padding:8px;background:#f8f9fc;border-radius:6px">💬 ${esc(t.comments)}</div>` : ''}
        </div>
        <div>${t.senior_approval==='Approved'?'<span class="badge b-green">✓ Approved</span>':'<span class="badge b-amber">Pending Review</span>'}</div>
      </div>
      ${t.senior_approval!=='Approved'?`
      <div class="leave-action-actions">
        <button class="btn btn-green btn-sm" onclick="approveSeniorTask('${t.id}')">✅ Approve — Send to CEO</button>
        <button class="btn btn-red btn-sm" onclick="rejectSeniorTask('${t.id}')">↩️ Send Back</button>
      </div>`:''}
    </div>
  `).join('');
}

async function approveSeniorTask(taskId) {
  const { error } = await sb.from('tasks').update({
    senior_approval: 'Approved',
    senior_approved_by: currentUser.name,
    work_status: 'Senior Approved',
    updated_at: new Date().toISOString()
  }).eq('id', taskId);
  if (error) { showToast('❌ '+error.message,'err'); return; }
  showToast('✅ Approved! Sent to CEO.','ok');
  loadSeniorReview();
  loadSeniorBadge();
}

async function rejectSeniorTask(taskId) {
  const reason = prompt('Reason for sending back:');
  if (reason === null) return;
  const { error } = await sb.from('tasks').update({
    work_status: 'In Progress',
    senior_approval: 'Pending',
    comments: (reason ? 'Senior feedback: ' + reason : ''),
    updated_at: new Date().toISOString()
  }).eq('id', taskId);
  if (error) { showToast('❌ '+error.message,'err'); return; }
  showToast('↩️ Task sent back to employee','ok');
  loadSeniorReview();
}

function handleStatusChange(val) {
  const sendToField = document.getElementById('send-to-field');
  if (sendToField) sendToField.style.display = (val==='Completed'||val==='Sent for Review') ? 'block' : 'block';
  const approvalField = document.getElementById('approval-field');
  if (approvalField) approvalField.style.display = val==='Sent for Review' ? 'block' : 'none';
}

// ═══════════════════════════════════════════
//  DELETE TASK
// ═══════════════════════════════════════════
async function ceoFinalizeTask(taskId, decision) {
  if (!decision) return;
  const { error } = await sb.from('tasks').update({
    ceo_approval: decision,
    work_status: 'Report Ready',
    report_status: 'Ready',
    updated_at: new Date().toISOString()
  }).eq('id', taskId);
  if (error) { showToast('❌ '+error.message,'err'); return; }
  showToast('✅ '+decision+' — Report Ready!','ok');
  loadAllTasks();
}

async function openTaskViewModal(taskId) {
  // Always fetch fresh from DB for CEO tasks
  const { data: taskData } = await sb.from('tasks').select('*').eq('id', taskId).maybeSingle();
  let t = taskData || allTasksData.find(x => x.id === taskId);
  if (!t) return;

  const files = await getTaskFiles(taskId);
  const today = new Date();
  const endD = t.end_date ? new Date(t.end_date) : null;
  const isLate = endD && today > endD && t.work_status !== 'Completed';

  // Status color
  const sMap = {
    'Not Started': 'background:#f1f3f7;color:var(--muted)',
    'In Progress': 'background:var(--blue-bg);color:var(--blue)',
    'Sent for Review': 'background:var(--amber-bg);color:var(--amber)',
    'Completed': 'background:var(--green-bg);color:var(--green)',
    'Report Ready': 'background:var(--green-bg);color:var(--green)'
  };
  const sStyle = sMap[t.work_status] || 'background:#f1f3f7;color:var(--muted)';

  // Approval section
  let approvalHtml = '';
  if (t.approval_status && t.approval_type) {
    const bg = t.approval_status === 'Approved' ? 'var(--green-bg)' : t.approval_status === 'Rejected' ? 'var(--red-bg)' : 'var(--amber-bg)';
    const col = t.approval_status === 'Approved' ? 'var(--green)' : t.approval_status === 'Rejected' ? 'var(--red)' : 'var(--amber)';
    const icon = t.approval_status === 'Approved' ? '✅' : t.approval_status === 'Rejected' ? '❌' : '⏳';
    approvalHtml = '<div style="background:' + bg + ';border-radius:10px;padding:12px 16px;margin-bottom:14px">'
      + '<div style="font-size:11px;font-weight:700;color:' + col + ';margin-bottom:4px">' + icon + ' APPROVAL: ' + esc(t.approval_type) + ' — ' + esc(t.approval_status) + '</div>'
      + (t.approval_note ? '<div style="font-size:12px;color:var(--text)">' + esc(t.approval_note) + '</div>' : '')
      + '</div>';
  }

  // Files section
  let filesHtml = '';
  if (files.length) {
    filesHtml = '<div style="margin-bottom:14px">'
      + '<div style="font-size:10px;color:var(--muted);font-weight:700;text-transform:uppercase;letter-spacing:0.8px;margin-bottom:8px">📎 Attached Files</div>'
      + '<div style="display:flex;flex-wrap:wrap;gap:6px">' + renderFileChips(files) + '</div>'
      + '</div>';
  }

  // Pending with section
  let pendingHtml = '';
  if (t.pending_with_name) {
    pendingHtml = '<div style="background:var(--purple-bg);border-radius:10px;padding:12px 16px;margin-bottom:14px;border-left:3px solid var(--purple)">'
      + '<div style="font-size:11px;color:var(--purple);font-weight:700;margin-bottom:4px">📌 CURRENTLY WITH</div>'
      + '<div style="font-size:13px;font-weight:700;color:var(--purple)">' + esc(t.pending_with_name) + '</div>'
      + '</div>';
  }

  // Comments section
  let commentsHtml = '';
  if (t.comments) {
    commentsHtml = '<div style="background:#f8f9fc;border-radius:10px;padding:14px;margin-bottom:14px">'
      + '<div style="font-size:10px;color:var(--muted);font-weight:700;text-transform:uppercase;letter-spacing:0.8px;margin-bottom:8px">💬 Latest Comments</div>'
      + '<div style="font-size:13px;color:var(--text);line-height:1.6">' + esc(t.comments) + '</div>'
      + '</div>';
  }

  const endColor = isLate ? 'var(--red)' : 'var(--navy)';
  const endWeight = isLate ? '700' : '400';

  document.getElementById('taskViewModalContent').innerHTML =
    '<div style="background:linear-gradient(135deg,var(--navy),var(--navy2));border-radius:12px;padding:18px 20px;margin-bottom:18px;color:#fff">'
    + '<div style="display:flex;align-items:center;gap:10px;margin-bottom:10px;flex-wrap:wrap">'
    + '<span style="background:rgba(201,168,76,0.2);color:var(--gold);padding:3px 10px;border-radius:4px;font-size:12px;font-weight:700">' + esc(t.project) + '</span>'
    + '<span style="padding:3px 10px;border-radius:20px;font-size:11px;font-weight:700;' + sStyle + '">' + esc(t.work_status) + '</span>'
    + (t.approval_type ? '<span style="background:rgba(255,255,255,0.1);color:rgba(255,255,255,0.8);padding:3px 10px;border-radius:20px;font-size:11px">' + esc(t.approval_type) + '</span>' : '')
    + '</div>'
    + '<div style="font-size:16px;font-weight:700;color:#fff;line-height:1.4">' + esc(t.task_detail) + '</div>'
    + '</div>'

    + '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px">'
    + '<div style="background:#f8f9fc;border-radius:10px;padding:14px">'
    + '<div style="font-size:10px;color:var(--muted);font-weight:700;text-transform:uppercase;letter-spacing:0.8px;margin-bottom:8px">Assignment</div>'
    + '<div style="font-size:13px;font-weight:600;color:var(--navy);margin-bottom:4px">👤 ' + esc(t.assigned_to_name) + '</div>'
    + '<div style="font-size:12px;color:var(--muted)">' + esc(t.assigned_to_email) + '</div>'
    + (t.assigned_by_name ? '<div style="font-size:11px;color:var(--muted);margin-top:6px">Assigned by: <strong>' + esc(t.assigned_by_name) + '</strong></div>' : '')
    + '</div>'
    + '<div style="background:#f8f9fc;border-radius:10px;padding:14px">'
    + '<div style="font-size:10px;color:var(--muted);font-weight:700;text-transform:uppercase;letter-spacing:0.8px;margin-bottom:8px">Timeline</div>'
    + '<div style="font-size:12px;color:var(--muted);margin-bottom:4px">📅 Start: <strong style="color:var(--navy)">' + fmtDate(t.start_date) + '</strong></div>'
    + '<div style="font-size:12px;color:var(--muted)">🏁 End: <strong style="color:' + endColor + ';font-weight:' + endWeight + '">' + fmtDate(t.end_date) + (isLate ? ' ⚠️' : '') + '</strong></div>'
    + '<div style="font-size:11px;color:var(--muted);margin-top:6px">Created: ' + new Date(t.created_at).toLocaleDateString('en-IN') + '</div>'
    + '</div>'
    + '</div>'

    + pendingHtml
    + commentsHtml
    + approvalHtml
    + filesHtml;

  document.getElementById('taskViewModal').classList.add('open');
}


async function openCeoTaskUpdateModal(taskId) {
  let t = allTasksData.find(x => x.id === taskId);
  if (!t) {
    const { data } = await sb.from('tasks').select('*').eq('id', taskId).single();
    t = data;
  }
  if (!t) return;

  // Reuse taskModal for CEO too
  currentTaskRow = t;
  const locked = t.work_status === 'Completed';

  document.getElementById('taskModalContent').innerHTML =
    '<div style="margin-bottom:16px;padding:14px;background:#f8f9fc;border-radius:10px;border:1px solid var(--border)">'
    + '<div style="font-size:13px;font-weight:700;color:var(--navy)">' + esc(t.project) + '</div>'
    + '<div style="font-size:12px;color:var(--muted);margin-top:4px;line-height:1.5">' + esc(t.task_detail) + '</div>'
    + '<div style="margin-top:8px;display:flex;gap:8px;flex-wrap:wrap">'
    + statusBadge(t.work_status)
    + '<span style="font-size:11px;color:var(--muted)">Assigned by: ' + esc(t.assigned_by_name || '—') + '</span>'
    + '<span style="font-size:11px;color:var(--muted)">End: ' + fmtDate(t.end_date) + '</span>'
    + '</div>'
    + '</div>'
    + (locked ? '<div class="badge b-green" style="margin-bottom:12px">✅ Task Completed</div>' :
      '<div class="field" style="margin-bottom:14px">'
      + '<label>Update Status</label>'
      + '<select id="modal-status" onchange="handleStatusChange(this.value)">'
      + ['Not Started','In Progress','Sent for Review','Completed'].map(s => '<option' + (s === t.work_status ? ' selected' : '') + '>' + s + '</option>').join('')
      + '</select>'
      + '</div>'
      + '<div id="approval-field" style="margin-bottom:14px;display:none">'
      + '<label style="display:block;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.8px;color:var(--muted);margin-bottom:5px">Approval Type</label>'
      + '<select id="modal-approval" style="width:100%;padding:9px 12px;border:1.5px solid var(--border);border-radius:8px;font-size:13px;font-family:DM Sans,sans-serif;outline:none">'
      + '<option value="">— Select Approval —</option>'
      + '<option value="Approval for SG">Approval for SG</option>'
      + '<option value="Approval for YG">Approval for YG</option>'
      + '</select>'
      + '</div>'
    )
    + '<div class="field" style="margin-bottom:14px">'
    + '<label>Comments / Notes</label>'
    + '<textarea id="modal-comments"' + (locked ? ' disabled' : '') + '>' + esc(t.comments || '') + '</textarea>'
    + '</div>'
    + '<div class="field">'
    + '<label>Upload File (Optional)</label>'
    + '<div class="upload-zone" onclick="document.getElementById(&quot;modal-file&quot;).click()" ondragover="event.preventDefault();this.classList.add(&quot;drag&quot;)" ondragleave="this.classList.remove(&quot;drag&quot;)" ondrop="event.preventDefault();this.classList.remove(&quot;drag&quot;);handleFileDrop(event)">'
    + '<input type="file" id="modal-file" accept=".pdf,.jpg,.jpeg,.png,.xlsx,.docx,.dwg,.zip" onchange="previewFile(this)"/>'
    + '<div class="upload-zone-icon">📎</div>'
    + '<div class="upload-zone-text">Click or drag file here</div>'
    + '</div>'
    + '<div id="file-preview" style="margin-top:8px"></div>'
    + '</div>'
    + '<div id="modalMsg" style="font-size:12px;font-weight:600;margin-top:8px"></div>';

  // Load employees for send-to dropdown (hidden for CEO tasks, but needed by saveTaskUpdate)
  const sendToHtml = '<div id="send-to-field" style="display:none"><select id="modal-send-to"><option value="">—</option></select></div>';
  document.getElementById('taskModalContent').innerHTML += sendToHtml;

  document.getElementById('taskModal').classList.add('open');
}

async function deleteTask(taskId, reload=false) {
  if (!confirm('Delete this task?')) return;
  const { error } = await sb.from('tasks').update({is_archived: true}).eq('id', taskId);
  if (error) { showToast('❌ Failed: ' + error.message, 'err'); return; }
  showToast('✅ Task archived!', 'ok');
  if (reload) { loadAllTasks(); } else { loadMyTasks(); }
}

// ═══════════════════════════════════════════
//  PERFORMANCE
// ═══════════════════════════════════════════
async function loadPerformance() {
const isCEO = currentUser.role === 'ceo';
  const subtitle = document.getElementById('perfSubtitle');
  if (subtitle) subtitle.textContent = isCEO ? 'Team performance overview for this month' : 'Your performance overview for this month';

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
  const monthEnd = new Date(now.getFullYear(), now.getMonth()+1, 0).toISOString().split('T')[0];
  const totalDays = new Date(now.getFullYear(), now.getMonth()+1, 0).getDate();
  const today = new Date(); today.setHours(0,0,0,0);

  if (isCEO) {
    document.getElementById('allPerfSection').style.display = 'block';
    document.getElementById('myPerfCard').style.display = 'none';
const { data: emps } = await sb.from('employees').select('*').eq('is_active', true);
    const { data: allTasks } = await sb.from('tasks').select('*').eq('is_archived',false);
    const { data: allAtt } = await sb.from('attendance').select('*').eq('is_archived',false).gte('date', monthStart).lte('date', monthEnd);
    const { data: allVisits } = await sbClient.from('site_visits').select('visited_by');
    const visitCounts = {};
    (allVisits || []).forEach(v => {
      if (!v.visited_by) return;
      visitCounts[v.visited_by] = (visitCounts[v.visited_by] || 0) + 1;
    });
    const tbody = document.getElementById('perfTableBody');
    if (!emps || !emps.length) {
      tbody.innerHTML = '<tr><td colspan="10" style="text-align:center;padding:30px;color:var(--muted)">No employees found</td></tr>';
      return;
    }
    tbody.innerHTML = emps.map((emp, i) => {
      const empTasks = (allTasks||[]).filter(t => t.assigned_to_email === emp.email);
      const total = empTasks.length;
      const completed = empTasks.filter(t => t.work_status === 'Completed' || t.work_status === 'Report Ready').length;
      const pending = empTasks.filter(t => t.work_status === 'Not Started' || t.work_status === 'In Progress').length;
      const delayed = empTasks.filter(t => {
        const ed = t.end_date ? new Date(t.end_date) : null;
        return ed && today > ed && t.work_status !== 'Completed' && t.work_status !== 'Report Ready';
      }).length;
      const completionPct = total > 0 ? Math.round((completed/total)*100) : 0;
      const empAtt = (allAtt||[]).filter(a => a.employee_email === emp.email);
      const presentDays = empAtt.filter(a => a.status === 'Present').length;
      const attPct = totalDays > 0 ? Math.round((presentDays/totalDays)*100) : 0;
      let status, statusClass;
      const score = (completionPct * 0.6) + (attPct * 0.4);
      if (score >= 90) { status = '🟢 Excellent'; statusClass = 'b-green'; }
      else if (score >= 75) { status = '🔵 Good'; statusClass = 'b-blue'; }
      else if (score >= 60) { status = '🟡 Average'; statusClass = 'b-amber'; }
      else { status = '🔴 Needs Improvement'; statusClass = 'b-red'; }
      const compColor = completionPct >= 75 ? 'var(--green)' : completionPct >= 50 ? 'var(--amber)' : 'var(--red)';
      const attColor = attPct >= 75 ? 'var(--green)' : attPct >= 50 ? 'var(--amber)' : 'var(--red)';
      return `<tr>
        <td style="color:var(--muted);font-size:11px">${i+1}</td>
        <td>
          <div style="display:flex;align-items:center;gap:8px">
            <div class="av" style="background:var(--navy);width:28px;height:28px;font-size:10px">${esc(emp.name).substring(0,2).toUpperCase()}</div>
            <div>
<div style="font-weight:600;font-size:13px;cursor:pointer;color:var(--blue);text-decoration:underline" onclick="openEmpPerfReport('${emp.email}','${esc(emp.name)}')">${esc(emp.name)}</div>
              <div style="font-size:10px;color:var(--muted)">${esc(emp.designation||'')}</div>
            </div>
          </div>
        </td>
        <td style="font-size:12px">${esc(emp.department||'—')}</td>
        <td style="font-weight:700;text-align:center">${total}</td>
        <td style="color:var(--green);font-weight:700;text-align:center">${completed}</td>
        <td style="color:var(--amber);font-weight:700;text-align:center">${pending}</td>
        <td style="color:var(--red);font-weight:700;text-align:center">${delayed}</td>
        <td>
          <div style="display:flex;align-items:center;gap:8px">
            <div class="progress-bar" style="width:60px"><div class="progress-fill" style="width:${completionPct}%;background:${compColor}"></div></div>
            <span style="font-size:12px;font-weight:700;color:${compColor}">${completionPct}%</span>
          </div>
        </td>
        <td>
          <div style="display:flex;align-items:center;gap:8px">
            <div class="progress-bar" style="width:60px"><div class="progress-fill" style="width:${attPct}%;background:${attColor}"></div></div>
            <span style="font-size:12px;font-weight:700;color:${attColor}">${attPct}%</span>
          </div>
</td>
<td style="text-align:center;font-weight:700;color:var(--navy)">${visitCounts[emp.name] || '—'}</td>
        <td><span class="badge ${statusClass}" style="font-size:10px;white-space:nowrap">${status}</span></td>
      </tr>`;
    }).join('');
  } else {

    // Employee view
    document.getElementById('myPerfCard').style.display = 'block';
    document.getElementById('allPerfSection').style.display = 'none';
    const { data: myTasksData } = await sb.from('tasks').select('*').eq('assigned_to_email', currentUser.email).eq('is_archived',false);
    const { data: myAtt } = await sb.from('attendance').select('*').eq('employee_email', currentUser.email).eq('is_archived',false).gte('date', monthStart).lte('date', monthEnd);
    const total = (myTasksData||[]).length;
    const completed = (myTasksData||[]).filter(t => t.work_status==='Completed'||t.work_status==='Report Ready').length;
    const pending = (myTasksData||[]).filter(t => t.work_status==='Not Started'||t.work_status==='In Progress').length;
    const delayed = (myTasksData||[]).filter(t => { const ed = t.end_date ? new Date(t.end_date) : null; return ed && today > ed && t.work_status !== 'Completed'; }).length;
    const completionPct = total > 0 ? Math.round((completed/total)*100) : 0;
const presentDays = (myAtt||[]).filter(a => a.status==='Present').length;
    const attPct = totalDays > 0 ? Math.round((presentDays/totalDays)*100) : 0;
    const totalHrs = (myAtt||[]).reduce((s,a) => s + parseFloat(a.working_hours||0), 0);
    const avgHrs = presentDays > 0 ? (totalHrs/presentDays).toFixed(1) : '0.0';
    const { data: myVisits } = await sbClient.from('site_visits').select('id').eq('visited_by', currentUser.name);
    const mySiteVisitCount = (myVisits || []).length;
    let status, statusColor;
    const score = (completionPct * 0.6) + (attPct * 0.4);
    if (score >= 90) { status = '🟢 Excellent'; statusColor = 'var(--green)'; }
    else if (score >= 75) { status = '🔵 Good'; statusColor = 'var(--blue)'; }
    else if (score >= 60) { status = '🟡 Average'; statusColor = 'var(--amber)'; }
    else { status = '🔴 Needs Improvement'; statusColor = 'var(--red)'; }
   document.getElementById('myPerfContent').innerHTML = `
  <div style="padding:16px;max-width:100%;width:100%">
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:20px">
        <div style="background:var(--bg);border-radius:10px;padding:16px;text-align:center;border-top:3px solid var(--navy)">
          <div style="font-size:28px;font-weight:800;color:var(--navy)">${total}</div>
          <div style="font-size:11px;color:var(--muted);margin-top:4px;text-transform:uppercase;font-weight:700">Total Tasks</div>
        </div>
        <div style="background:var(--green-bg);border-radius:10px;padding:16px;text-align:center;border-top:3px solid var(--green)">
          <div style="font-size:28px;font-weight:800;color:var(--green)">${completed}</div>
          <div style="font-size:11px;color:var(--green);margin-top:4px;text-transform:uppercase;font-weight:700">Completed</div>
        </div>
        <div style="background:var(--amber-bg);border-radius:10px;padding:16px;text-align:center;border-top:3px solid var(--amber)">
          <div style="font-size:28px;font-weight:800;color:var(--amber)">${pending}</div>
          <div style="font-size:11px;color:var(--amber);margin-top:4px;text-transform:uppercase;font-weight:700">Pending</div>
        </div>
        <div style="background:var(--red-bg);border-radius:10px;padding:16px;text-align:center;border-top:3px solid var(--red)">
          <div style="font-size:28px;font-weight:800;color:var(--red)">${delayed}</div>
          <div style="font-size:11px;color:var(--red);margin-top:4px;text-transform:uppercase;font-weight:700">Delayed</div>
        </div>
      </div>
<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin-top:14px">
        <div style="background:var(--bg);border-radius:10px;padding:16px">
          <div style="font-size:11px;color:var(--muted);font-weight:700;text-transform:uppercase;margin-bottom:8px">Task Completion</div>
          <div style="font-size:28px;font-weight:800;color:${completionPct>=75?'var(--green)':completionPct>=50?'var(--amber)':'var(--red)'}">${completionPct}%</div>
          <div class="progress-bar" style="margin-top:8px"><div class="progress-fill" style="width:${completionPct}%;background:${completionPct>=75?'var(--green)':completionPct>=50?'var(--amber)':'var(--red)'}"></div></div>
        </div>
        <div style="background:var(--bg);border-radius:10px;padding:16px">
          <div style="font-size:11px;color:var(--muted);font-weight:700;text-transform:uppercase;margin-bottom:8px">Attendance</div>
          <div style="font-size:28px;font-weight:800;color:${attPct>=75?'var(--green)':attPct>=50?'var(--amber)':'var(--red)'}">${attPct}%</div>
          <div class="progress-bar" style="margin-top:8px"><div class="progress-fill" style="width:${attPct}%;background:${attPct>=75?'var(--green)':attPct>=50?'var(--amber)':'var(--red)'}"></div></div>
          <div style="font-size:11px;color:var(--muted);margin-top:6px">⏱️ Avg ${avgHrs}h/day</div>
        </div>
        <div style="background:var(--bg);border-radius:10px;padding:16px">
          <div style="font-size:11px;color:var(--muted);font-weight:700;text-transform:uppercase;margin-bottom:8px">Overall Status</div>
          <div style="font-size:20px;font-weight:800;color:${statusColor};margin-top:8px">${status}</div>
          <div style="font-size:11px;color:var(--muted);margin-top:8px">Score: ${Math.round(score)}%</div>
        </div>
      </div>
      </div>
    `;
  }
}

async function openEmpPerfReport(empEmail, empName) {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
  const monthEnd = new Date(now.getFullYear(), now.getMonth()+1, 0).toISOString().split('T')[0];
  const today = new Date(); today.setHours(0,0,0,0);

  const { data: tasks } = await sb.from('tasks').select('*').eq('assigned_to_email', empEmail).eq('is_archived', false).order('created_at', {ascending: false});
  const { data: attData } = await sb.from('attendance').select('*').eq('employee_email', empEmail).eq('is_archived', false).gte('date', monthStart).lte('date', monthEnd);

  const total = (tasks||[]).length;
  const completed = (tasks||[]).filter(t => t.work_status==='Completed'||t.work_status==='Report Ready').length;
  const inProgress = (tasks||[]).filter(t => t.work_status==='In Progress').length;
  const pending = (tasks||[]).filter(t => t.work_status==='Not Started').length;
  const delayed = (tasks||[]).filter(t => {
    const ed = t.end_date ? new Date(t.end_date) : null;
    return ed && today > ed && t.work_status !== 'Completed';
  }).length;
  const completionPct = total > 0 ? Math.round((completed/total)*100) : 0;
  const presentDays = (attData||[]).filter(a => a.status==='Present').length;
  const totalDays = new Date(now.getFullYear(), now.getMonth()+1, 0).getDate();
  const attPct = totalDays > 0 ? Math.round((presentDays/totalDays)*100) : 0;
  const totalHrs = (attData||[]).reduce((s,a) => s + parseFloat(a.working_hours||0), 0);
  const score = (completionPct * 0.6) + (attPct * 0.4);
  let status, statusColor;
  if (score >= 90) { status = '🟢 Excellent'; statusColor = 'var(--green)'; }
  else if (score >= 75) { status = '🔵 Good'; statusColor = 'var(--blue)'; }
  else if (score >= 60) { status = '🟡 Average'; statusColor = 'var(--amber)'; }
  else { status = '🔴 Needs Improvement'; statusColor = 'var(--red)'; }

  document.getElementById('compModalContent').innerHTML = `
    <div style="background:linear-gradient(135deg,var(--navy),var(--navy2));border-radius:12px;padding:18px;margin-bottom:16px;color:#fff">
      <div style="font-size:18px;font-weight:800">${esc(empName)}</div>
      <div style="font-size:13px;color:rgba(255,255,255,0.6);margin-top:4px">Performance Report — ${now.toLocaleString('en',{month:'long',year:'numeric'})}</div>
      <div style="font-size:22px;font-weight:800;color:var(--gold);margin-top:8px">${status}</div>
      <div style="font-size:12px;color:rgba(255,255,255,0.5)">Score: ${Math.round(score)}%</div>
    </div>
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:16px">
      <div style="background:var(--bg);border-radius:10px;padding:14px;text-align:center;border-top:3px solid var(--navy)">
        <div style="font-size:24px;font-weight:800;color:var(--navy)">${total}</div>
        <div style="font-size:10px;color:var(--muted);font-weight:700;text-transform:uppercase;margin-top:4px">Total Tasks</div>
      </div>
      <div style="background:var(--green-bg);border-radius:10px;padding:14px;text-align:center;border-top:3px solid var(--green)">
        <div style="font-size:24px;font-weight:800;color:var(--green)">${completed}</div>
        <div style="font-size:10px;color:var(--green);font-weight:700;text-transform:uppercase;margin-top:4px">Completed</div>
      </div>
      <div style="background:var(--red-bg);border-radius:10px;padding:14px;text-align:center;border-top:3px solid var(--red)">
        <div style="font-size:24px;font-weight:800;color:var(--red)">${delayed}</div>
        <div style="font-size:10px;color:var(--red);font-weight:700;text-transform:uppercase;margin-top:4px">Delayed</div>
      </div>
      <div style="background:var(--blue-bg);border-radius:10px;padding:14px;text-align:center;border-top:3px solid var(--blue)">
        <div style="font-size:24px;font-weight:800;color:var(--blue)">${inProgress}</div>
        <div style="font-size:10px;color:var(--blue);font-weight:700;text-transform:uppercase;margin-top:4px">In Progress</div>
      </div>
      <div style="background:var(--amber-bg);border-radius:10px;padding:14px;text-align:center;border-top:3px solid var(--amber)">
        <div style="font-size:24px;font-weight:800;color:var(--amber)">${pending}</div>
        <div style="font-size:10px;color:var(--amber);font-weight:700;text-transform:uppercase;margin-top:4px">Not Started</div>
      </div>
      <div style="background:var(--bg);border-radius:10px;padding:14px;text-align:center;border-top:3px solid var(--navy)">
        <div style="font-size:24px;font-weight:800;color:var(--navy)">${presentDays}d</div>
        <div style="font-size:10px;color:var(--muted);font-weight:700;text-transform:uppercase;margin-top:4px">Present Days</div>
      </div>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:16px">
      <div style="background:var(--bg);border-radius:10px;padding:14px">
        <div style="font-size:11px;color:var(--muted);font-weight:700;text-transform:uppercase;margin-bottom:8px">Task Completion</div>
        <div style="font-size:26px;font-weight:800;color:${completionPct>=75?'var(--green)':completionPct>=50?'var(--amber)':'var(--red)'}">${completionPct}%</div>
        <div class="progress-bar" style="margin-top:8px"><div class="progress-fill" style="width:${completionPct}%;background:${completionPct>=75?'var(--green)':completionPct>=50?'var(--amber)':'var(--red)'}"></div></div>
      </div>
      <div style="background:var(--bg);border-radius:10px;padding:14px">
        <div style="font-size:11px;color:var(--muted);font-weight:700;text-transform:uppercase;margin-bottom:8px">Attendance</div>
        <div style="font-size:26px;font-weight:800;color:${attPct>=75?'var(--green)':attPct>=50?'var(--amber)':'var(--red)'}">${attPct}%</div>
        <div class="progress-bar" style="margin-top:8px"><div class="progress-fill" style="width:${attPct}%;background:${attPct>=75?'var(--green)':attPct>=50?'var(--amber)':'var(--red)'}"></div></div>
        <div style="font-size:11px;color:var(--muted);margin-top:6px">⏱️ Total: ${totalHrs.toFixed(1)}h</div>
      </div>
    </div>
    <div style="font-size:12px;font-weight:700;color:var(--muted);text-transform:uppercase;margin-bottom:8px">All Tasks (${total})</div>
    ${(tasks||[]).length ? (tasks||[]).map(t => {
const isLate = t.end_date && today > new Date(t.end_date) && t.work_status !== 'Completed' && t.work_status !== 'Report Ready';
      const isDone = t.work_status==='Completed'||t.work_status==='Report Ready';
      return '<div style="display:flex;align-items:center;gap:8px;padding:10px 0;border-bottom:1px solid #f5f6fa;' + (isDone?'opacity:0.6':'') + (isLate?'background:#fdf0ee;padding:10px 8px;border-radius:6px;margin-bottom:4px':'') + '">'
        + '<div style="flex:1">'
        + '<div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;margin-bottom:4px">'
        + '<span style="background:#e8ecf5;color:var(--navy);padding:1px 6px;border-radius:4px;font-size:10px;font-weight:700">' + esc(t.project) + '</span>'
        + statusBadge(t.work_status)
        + (isLate?'<span class="badge b-red" style="font-size:9px">⚠️ Late</span>':'')
        + '</div>'
        + '<div style="font-size:12px;color:var(--navy);font-weight:600">' + esc(t.task_detail.substring(0,60)) + (t.task_detail.length>60?'...':'') + '</div>'
+ '<div style="display:flex;align-items:center;gap:8px;margin-top:4px">'
+ '<div style="font-size:11px;color:var(--muted)">📅 End: ' + fmtDate(t.end_date) + '</div>'
+ '<button class="btn btn-outline btn-sm" onclick="openTaskViewModal(\'' + t.id + '\');"> 👁️ View</button>'
+ '</div>'
        + '</div>'
        + '</div>';
    }).join('') : '<div style="font-size:12px;color:var(--muted);text-align:center;padding:16px">No tasks found</div>'}
    `;
  document.getElementById('complianceModal').classList.add('open');
}

async function exportPerformancePDF() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const W = 297; const H = 210;

  const ORANGE = [232,101,26]; const NAVY = [26,58,92]; const DARK = [34,34,34];
  const MUTED = [85,85,85]; const BORDER = [200,213,229]; const LIGHT = [245,248,252];
  const GREEN = [26,110,60]; const RED = [163,45,45]; const AMBER = [133,79,11];
  const BLUE = [24,95,165];

  const setFill = (rgb) => doc.setFillColor(rgb[0],rgb[1],rgb[2]);
  const setStroke = (rgb) => doc.setDrawColor(rgb[0],rgb[1],rgb[2]);
  const setFont = (c) => doc.setTextColor(c[0],c[1],c[2]);

  // HEADER
  setFill([255,255,255]); doc.rect(0,0,W,28,'F');
  try {
    const logoUrl = 'https://rgoujuvdqqddqeqnryfg.supabase.co/storage/v1/object/public/Task-Files/Sayash%20logo.png';
    const logoRes = await fetch(logoUrl);
    if (logoRes.ok) {
      const logoBlob = await logoRes.blob();
      const logoBase64 = await new Promise(res => {
        const r = new FileReader(); r.onload = () => res(r.result); r.readAsDataURL(logoBlob);
      });
      doc.addImage(logoBase64, 'PNG', 10, 3, 32, 22);
    }
  } catch(e) {}

  doc.setFontSize(13); doc.setFont('helvetica','bold'); setFont(ORANGE);
  doc.text('SAYASH VASTU', W/2, 11, { align: 'center' });
  doc.setFontSize(8); doc.setFont('helvetica','normal'); setFont(DARK);
  doc.text('Vastu Shastra Consultancy Services', W/2, 16, { align: 'center' });
  doc.text('Netaji Subhash Place, New Delhi', W/2, 20.5, { align: 'center' });
  setStroke(ORANGE); doc.setLineWidth(0.5);
  doc.line(0, 28, W, 28);

  // TITLE
  let y = 36;
  doc.setFontSize(17); doc.setFont('helvetica','bold'); setFont(NAVY);
  doc.text('PERFORMANCE REPORT', W/2, y, { align: 'center' });
  y += 3.5;
  setStroke(ORANGE); doc.setLineWidth(0.4);
  doc.line(10, y, W-10, y);
  y += 5;

  // INFO
  doc.setFontSize(8); doc.setFont('helvetica','normal'); setFont(MUTED);
  const monthName = new Date().toLocaleString('en', {month:'long', year:'numeric'});
  doc.text('Month: ' + monthName, 14, y);
  doc.text('Generated: ' + new Date().toLocaleDateString('en-IN'), W-14, y, { align: 'right' });
  y += 8;

  // SUMMARY CARDS
  const rows = document.querySelectorAll('#perfTableBody tr');
  const total = rows.length;
  let excellent = 0, good = 0, average = 0, needsImprovement = 0;
  rows.forEach(row => {
    const status = row.querySelector('td:last-child')?.textContent || '';
    if (status.includes('Excellent')) excellent++;
    else if (status.includes('Good')) good++;
    else if (status.includes('Average')) average++;
    else if (status.includes('Needs')) needsImprovement++;
  });

  const cw = (W-20)/4;
  setFill(NAVY); doc.rect(10, y, W-20, 6, 'F');
  doc.setFontSize(6.5); doc.setFont('helvetica','bold'); setFont([255,255,255]);
  ['TOTAL EMPLOYEES','EXCELLENT','GOOD','NEEDS IMPROVEMENT'].forEach((col,i) => {
    doc.text(col, 10+i*cw+cw/2, y+4, { align: 'center' });
  });
  y += 6;
  setFill([235,242,251]); setStroke(BORDER); doc.setLineWidth(0.3);
  doc.rect(10, y, W-20, 10, 'FD');
  for(let i=1;i<4;i++) doc.line(10+i*cw, y, 10+i*cw, y+10);
  doc.setFontSize(14); doc.setFont('helvetica','bold');
  [String(total), String(excellent), String(good), String(needsImprovement)].forEach((v,i) => {
    const clr = i===0?NAVY:i===1?GREEN:i===2?BLUE:RED;
    setFont(clr);
    doc.text(v, 10+i*cw+cw/2, y+7, { align: 'center' });
  });
  y += 16;

  // TABLE HEADER
  doc.setFontSize(9); doc.setFont('helvetica','bold'); setFont(NAVY);
  doc.text('EMPLOYEE PERFORMANCE DETAILS', W/2, y, { align: 'center' });
  y += 4;

  const colW = [8, 40, 30, 18, 18, 18, 18, 22, 22, 35];
  const cols = ['#','Name','Dept','Total','Done','Pending','Delayed','Done %','Att %','Status'];
  setFill(NAVY); doc.rect(10, y, W-20, 6, 'F');
  doc.setFontSize(6.5); doc.setFont('helvetica','bold'); setFont([255,255,255]);
  let cx = 10;
  cols.forEach((col,i) => { doc.text(col, cx+1, y+4); cx += colW[i]; });
  y += 6;

  const sColors = {
    'Excellent': GREEN,
    'Good': BLUE,
    'Average': AMBER,
    'Needs Improvement': RED
  };

  rows.forEach((row, idx) => {
    if (y > 185) { doc.addPage(); y = 20; }
    const cells = row.querySelectorAll('td');
    if (cells.length < 10) return;

    const bg = idx%2===0 ? [248,249,252] : [255,255,255];
    setFill(bg); setStroke([221,229,239]); doc.setLineWidth(0.15);
    doc.rect(10, y, W-20, 6, 'FD');

const rawStatus = cells[9].textContent.trim();
const statusText = rawStatus.includes('Excellent') ? 'Excellent' :
  rawStatus.includes('Good') ? 'Good' :
  rawStatus.includes('Average') ? 'Average' :
  rawStatus.includes('Needs') ? 'Needs Improvement' : 'Unknown';
    let statusColor = MUTED;
    Object.keys(sColors).forEach(key => {
      if (statusText.includes(key)) statusColor = sColors[key];
    });

    cx = 10;
    const vals = [
      String(idx+1),
      cells[1].textContent.trim().substring(0,20),
      cells[2].textContent.trim().substring(0,14),
      cells[3].textContent.trim(),
      cells[4].textContent.trim(),
      cells[5].textContent.trim(),
      cells[6].textContent.trim(),
      cells[7].textContent.trim().replace(/[^\d%]/g,''),
      cells[8].textContent.trim().replace(/[^\d%]/g,''),
statusText.replace(/[^\x00-\x7F]/g,'').trim().substring(0,18)
    ];

    vals.forEach((val,i) => {
      if (i===9) {
        doc.setFontSize(6); doc.setFont('helvetica','bold'); setFont(statusColor);
      } else if (i===4) {
        doc.setFontSize(6); doc.setFont('helvetica','bold'); setFont(GREEN);
      } else if (i===6) {
        doc.setFontSize(6); doc.setFont('helvetica','bold'); setFont(RED);
      } else {
        doc.setFontSize(6); doc.setFont('helvetica','normal'); setFont(DARK);
      }
      doc.text(String(val), cx+1, y+4);
      cx += colW[i];
    });
    y += 6;
  });

  // FOOTER
  y += 6;
  setFill(LIGHT); setStroke(BORDER); doc.setLineWidth(0.3);
  doc.rect(10, y, W-20, 14, 'FD');
  doc.setFontSize(7); doc.setFont('helvetica','normal'); setFont(MUTED);
  doc.text('This report is auto-generated by Sayash Vastu Portal', W/2, y+5, { align: 'center' });
  doc.text('Confidential — For Internal Use Only', W/2, y+10, { align: 'center' });

  doc.save('SayashVastu_Performance_' + new Date().toISOString().split('T')[0] + '.pdf');
  showToast('✅ Performance PDF exported!', 'ok');
}

// ═══════════════════════════════════════════
//  FOLLOW-UP TASKS (Tasks assigned BY me to others)
// ═══════════════════════════════════════════
async function loadFollowUp() {
  const { data: tasks } = await sb.from('tasks')
    .select('*')
    .eq('assigned_by_email', currentUser.email)
    .neq('assigned_to_email', currentUser.email)
    .eq('is_archived', false)
    .order('created_at', {ascending: false});
  
 const followTasks = tasks || [];
  const total = followTasks.length;
  const active = followTasks.filter(t => t.work_status !== 'Completed' && t.work_status !== 'Report Ready').length;
  const done = followTasks.filter(t => t.work_status === 'Completed' || t.work_status === 'Report Ready').length;

  document.getElementById('fu-total').textContent = total;
  document.getElementById('fu-active').textContent = active;
  document.getElementById('fu-done').textContent = done;

  // Update badge
  const badge = document.getElementById('nb-followup');
  if (badge) {
    badge.textContent = active;
    badge.style.display = active > 0 ? 'inline-block' : 'none';
  }

  const el = document.getElementById('followUpList');
  if (!followTasks.length) {
    el.innerHTML = '<div class="empty-state"><div class="empty-icon">👁️</div><div class="empty-title">No follow-up tasks</div><p>Tasks you assign to others will appear here</p></div>';
    return;
  }

  const today = new Date(); today.setHours(0,0,0,0);

  el.innerHTML = followTasks.map(t => {
    const endD = t.end_date ? new Date(t.end_date) : null;
    const isLate = endD && today > endD && t.work_status !== 'Completed';
    let statusColor = 'var(--blue)';
    if (t.work_status === 'Completed' || t.work_status === 'Report Ready') statusColor = 'var(--green)';
    else if (isLate) statusColor = 'var(--red)';
    else if (t.work_status === 'Sent for Review') statusColor = 'var(--amber)';

    return '<div class="panel" style="margin-bottom:12px;border-left:3px solid ' + statusColor + ';' + (isLate ? 'background:linear-gradient(90deg,#fdf0ee,#fff)' : '') + '">'
      + '<div class="panel-head">'
      + '<div style="flex:1">'
      + '<div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:6px">'
      + '<span style="background:#e8ecf5;color:var(--navy);padding:2px 8px;border-radius:4px;font-size:11px;font-weight:700">' + esc(t.project) + '</span>'
      + statusBadge(t.work_status)
      + (isLate ? '<span class="badge b-red">⚠️ Delayed</span>' : '')
      + '</div>'
      + '<div style="font-size:13px;font-weight:600;color:var(--navy);margin-bottom:6px">' + esc(t.task_detail.substring(0,80)) + (t.task_detail.length > 80 ? '...' : '') + '</div>'
      + '<div style="display:flex;gap:16px;flex-wrap:wrap;font-size:12px;color:var(--muted)">'
      + '<span>👤 Assigned to: <strong style="color:var(--navy)">' + esc(t.assigned_to_name) + '</strong></span>'
      + '<span>📅 End: <span style="color:' + (isLate ? 'var(--red)' : 'var(--muted)') + ';font-weight:' + (isLate ? '700' : '400') + '">' + fmtDate(t.end_date) + '</span></span>'
      + (t.pending_with_name ? '<span>📌 With: <strong style="color:var(--purple)">' + esc(t.pending_with_name) + '</strong></span>' : '')
      + '</div>'
+ (t.comments ? '<div style="margin-top:8px;padding:8px 12px;background:var(--bg);border-radius:8px;font-size:12px;color:var(--muted)">💬 ' + esc(t.comments) + '</div>' : '')
+ (t.file_url ? '<div style="margin-top:8px"><a href="' + t.file_url + '" target="_blank" class="btn btn-outline btn-sm">📎 ' + esc(t.file_name || 'View Attachment') + '</a></div>' : '')
      + '</div>'
+ '<div style="padding:10px 18px;border-top:1px solid var(--border);background:#fafbff;display:flex;gap:8px">'
      + '<button class="btn btn-primary btn-sm" onclick="openTaskViewModal(\'' + t.id + '\')">👁️ View Details</button>'
      + '<button class="btn btn-gold btn-sm" onclick="openFollowUpEditModal(\'' + t.id + '\')">✏️ Edit</button>'
      + '<button class="btn btn-sm" onclick="deleteFollowUpTask(\'' + t.id + '\')" style="background:#fdf0ee;color:var(--red);border-color:var(--red-bg)">🗑️ Delete</button>'
      + '</div>'
      + '</div>'
      + '</div>';
  }).join('');
  }

  async function deleteFollowUpTask(id) {
  if (!confirm('Delete this task permanently?')) return;
  const { error } = await sb.from('tasks').update({ is_archived: true }).eq('id', id);
  if (error) { showToast('❌ ' + error.message, 'err'); return; }
  showToast('✅ Task deleted!', 'ok');
  loadFollowUp();
}
async function openFollowUpEditModal(taskId) {
  const { data: t } = await sb.from('tasks').select('*').eq('id', taskId).single();
  if (!t) return;
  currentTaskRow = t;

  document.getElementById('taskModalContent').innerHTML = `
    <div style="margin-bottom:16px;padding:14px;background:#f8f9fc;border-radius:10px;border:1px solid var(--border)">
      <div style="font-size:13px;font-weight:700;color:var(--navy)">${esc(t.project)}</div>
      <div style="margin-top:8px">
        ${statusBadge(t.work_status)}
        <span style="font-size:11px;color:var(--muted);margin-left:8px">👤 Assigned to: ${esc(t.assigned_to_name)}</span>
      </div>
    </div>
    <div class="field" style="margin-bottom:14px">
      <label>Task Detail</label>
      <textarea id="modal-task-detail">${esc(t.task_detail)}</textarea>
    </div>
    <div class="form-grid cols-2" style="margin-bottom:14px">
      <div class="field">
        <label>Start Date</label>
        <input type="date" id="modal-start-date" value="${t.start_date||''}"/>
      </div>
      <div class="field">
        <label>End Date</label>
        <input type="date" id="modal-end-date" value="${t.end_date||''}"/>
      </div>
    </div>
    <div id="modalMsg" style="font-size:12px;font-weight:600;margin-top:8px"></div>
  `;
  document.getElementById('taskModal').classList.add('open');
  document.getElementById('taskModalSaveBtn').setAttribute('onclick', 'saveFollowUpEdit()');
}

async function saveFollowUpEdit() {
  if (!currentTaskRow) return;
  const newTaskDetail = document.getElementById('modal-task-detail')?.value?.trim();
  const newStartDate = document.getElementById('modal-start-date')?.value;
  const newEndDate = document.getElementById('modal-end-date')?.value;

  const updates = { updated_at: new Date().toISOString() };
  if (newTaskDetail) updates.task_detail = newTaskDetail;
  if (newStartDate) updates.start_date = newStartDate;
  if (newEndDate) updates.end_date = newEndDate;

  const { error } = await sb.from('tasks').update(updates).eq('id', currentTaskRow.id);
  if (error) { showToast('❌ ' + error.message, 'err'); return; }

  showToast('✅ Task updated!', 'ok');
  closeModal('taskModal');
  document.getElementById('taskModalSaveBtn').setAttribute('onclick', 'saveTaskUpdate()');
  loadFollowUp();
}
async function loadFollowUpBadge() {
  try {
    const { count } = await sb.from('tasks').select('*', {count: 'exact'})
      .eq('assigned_by_email', currentUser.email)
      .neq('assigned_to_email', currentUser.email)
      .eq('is_archived', false)
      .neq('work_status', 'Completed')
      .neq('work_status', 'Report Ready');
    const badge = document.getElementById('nb-followup');
    if (badge) {
      badge.textContent = count || 0;
      badge.style.display = (count && count > 0) ? 'inline-block' : 'none';
    }
  } catch(e) {}
}

// ═══════════════════════════════════════════
//  MY REPORTS (Employee)
// ═══════════════════════════════════════════
async function loadMyReports() {
  const { data: reports } = await sb.from('tasks')
    .select('*')
    .eq('assigned_to_email', currentUser.email)
    .eq('is_archived', false)
    .not('approval_type', 'is', null)
    .order('updated_at', {ascending: false});

  const myReports = reports || [];

  const pending = myReports.filter(r => r.approval_status === 'Pending').length;
  const approved = myReports.filter(r => r.approval_status === 'Approved').length;
  const rejected = myReports.filter(r => r.approval_status === 'Rejected').length;

  document.getElementById('mr-pending').textContent = pending;
  document.getElementById('mr-approved').textContent = approved;
  document.getElementById('mr-rejected').textContent = rejected;

  // Update badge
  const badge = document.getElementById('nb-my-reports');
  if (badge) {
    badge.textContent = pending;
    badge.style.display = pending > 0 ? 'inline-block' : 'none';
  }

  const el = document.getElementById('myReportsList');
  if (!myReports.length) {
    el.innerHTML = '<div class="empty-state"><div class="empty-icon">📑</div><div class="empty-title">No reports submitted yet</div><p>Submit a task for review to see it here</p></div>';
    return;
  }

  el.innerHTML = myReports.map(r => {
    const statusColor = r.approval_status === 'Approved' ? 'var(--green)' : r.approval_status === 'Rejected' ? 'var(--red)' : 'var(--amber)';
    const statusIcon = r.approval_status === 'Approved' ? '✅' : r.approval_status === 'Rejected' ? '❌' : '⏳';
    const statusClass = r.approval_status === 'Approved' ? 'b-green' : r.approval_status === 'Rejected' ? 'b-red' : 'b-amber';

    return `<div class="panel" style="margin-bottom:14px;border-left:3px solid ${statusColor}">
      <div class="panel-head">
        <div>
          <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
            <span style="background:#e8ecf5;color:var(--navy);padding:2px 8px;border-radius:4px;font-size:11px;font-weight:700">${esc(r.project)}</span>
            <span class="badge ${r.approval_type==='Approval for SG'?'b-navy':'b-blue'}">${esc(r.approval_type||'—')}</span>
            <span class="badge ${statusClass}">${statusIcon} ${esc(r.approval_status||'Pending')}</span>
          </div>
          <div style="font-size:13px;font-weight:600;color:var(--navy);margin-top:8px">${esc(r.task_detail.substring(0,80))}${r.task_detail.length>80?'...':''}</div>
        </div>
      </div>
      <div class="panel-body">
        <div style="display:flex;gap:16px;flex-wrap:wrap;font-size:12px;color:var(--muted)">
          <span>📅 End Date: ${fmtDate(r.end_date)}</span>
          <span>🕐 Submitted: ${new Date(r.updated_at||r.created_at).toLocaleDateString('en-IN')}</span>
        </div>
        ${r.comments ? `<div style="margin-top:8px;padding:8px 12px;background:var(--bg);border-radius:8px;font-size:12px;color:var(--muted)">💬 ${esc(r.comments)}</div>` : ''}
        ${r.approval_status === 'Rejected' && r.approval_note ? `
          <div style="margin-top:10px;padding:10px 14px;background:var(--red-bg);border-radius:8px;border-left:3px solid var(--red)">
            <div style="font-size:11px;font-weight:700;color:var(--red);margin-bottom:4px">❌ Rejection Reason:</div>
            <div style="font-size:12px;color:var(--text)">${esc(r.approval_note)}</div>
          </div>` : ''}
        ${r.approval_status === 'Approved' ? `
          <div style="margin-top:10px;padding:10px 14px;background:var(--green-bg);border-radius:8px">
            <div style="font-size:12px;font-weight:600;color:var(--green)">✅ Approved by CEO — Task Completed!</div>
          </div>` : ''}
        ${r.approval_status === 'Pending' ? `
          <div style="margin-top:10px;padding:10px 14px;background:var(--amber-bg);border-radius:8px">
            <div style="font-size:12px;font-weight:600;color:var(--amber)">⏳ Waiting for CEO approval...</div>
          </div>` : ''}
      </div>
    </div>`;
  }).join('');
}

async function loadMyReportsBadge() {
  try {
    const { count } = await sb.from('tasks').select('*', {count: 'exact'})
      .eq('assigned_to_email', currentUser.email)
      .eq('is_archived', false)
      .eq('approval_status', 'Pending')
      .not('approval_type', 'is', null);
    const badge = document.getElementById('nb-my-reports');
    if (badge) {
      badge.textContent = count || 0;
      badge.style.display = (count && count > 0) ? 'inline-block' : 'none';
    }
  } catch(e) {}
}

// ═══════════════════════════════════════════
//  CEO MY TASKS
// ═══════════════════════════════════════════
async function loadCeoMyTasks() {
  const { data: tasks } = await sb.from('tasks')
    .select('*')
    .eq('assigned_to_email', currentUser.email)
    .eq('is_archived', false)
    .order('created_at', {ascending: false});

  const ceoTasks = tasks || [];
  const today = new Date(); today.setHours(0,0,0,0);

  const total = ceoTasks.length;
  const active = ceoTasks.filter(t => t.work_status !== 'Completed' && t.work_status !== 'Report Ready').length;
  const done = ceoTasks.filter(t => t.work_status === 'Completed' || t.work_status === 'Report Ready').length;
  const delayed = ceoTasks.filter(t => {
    const ed = t.end_date ? new Date(t.end_date) : null;
    return ed && today > ed && t.work_status !== 'Completed';
  }).length;

  document.getElementById('cmt-total').textContent = total;
  document.getElementById('cmt-active').textContent = active;
  document.getElementById('cmt-delayed').textContent = delayed;
  document.getElementById('cmt-done').textContent = done;

  const badge = document.getElementById('nb-ceo-tasks');
  if (badge) {
    badge.textContent = active;
    badge.style.display = active > 0 ? 'inline-block' : 'none';
  }

  const tbody = document.getElementById('ceoMyTasksBody');
  if (!ceoTasks.length) {
    tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;color:var(--muted);padding:30px">No tasks assigned to you yet</td></tr>';
    return;
  }

  const fileMap = {};
  await Promise.all(ceoTasks.slice(0,20).map(async t => {
    fileMap[t.id] = await getTaskFiles(t.id);
  }));

  tbody.innerHTML = ceoTasks.map(t => {
    const endD = t.end_date ? new Date(t.end_date) : null;
    const isLate = endD && today > endD && t.work_status !== 'Completed';
    const files = fileMap[t.id] || [];
    const rowStyle = isLate ? 'background:#fdf0ee' : '';
    const endStyle = isLate ? 'color:var(--red);font-weight:700' : '';
    return `<tr style="${rowStyle}">
      <td><span style="background:#e8ecf5;color:var(--navy);padding:2px 8px;border-radius:4px;font-size:11px;font-weight:700">${esc(t.project)}</span></td>
      <td style="font-weight:600;max-width:180px;font-size:12px">${esc(t.task_detail.substring(0,50))}${t.task_detail.length>50?'...':''}</td>
      <td style="font-size:12px;color:var(--navy);font-weight:600">${esc(t.assigned_by_name||'—')}</td>
      <td style="font-size:11px">${fmtDate(t.start_date)}</td>
      <td style="font-size:11px;${endStyle}">${fmtDate(t.end_date)}${isLate?' ⚠️':''}</td>
      <td>${statusBadge(t.work_status)}</td>
      <td>${files.length ? renderFileChips(files) : '<span style="color:var(--muted);font-size:11px">—</span>'}</td>
      <td style="display:flex;gap:5px">
        <button class="btn btn-outline btn-sm" onclick="openTaskViewModal('${t.id}')">👁️</button>
        <button class="btn btn-gold btn-sm" onclick="openCeoTaskUpdateModal('${t.id}')">✏️ Update</button>
      </td>
    </tr>`;
  }).join('');
}

async function loadCeoTasksBadge() {
  try {
    const { count } = await sb.from('tasks').select('*', {count:'exact'})
      .eq('assigned_to_email', currentUser.email)
      .eq('is_archived', false)
      .neq('work_status', 'Completed')
      .neq('work_status', 'Report Ready');
    const badge = document.getElementById('nb-ceo-tasks');
    if (badge) {
      badge.textContent = count || 0;
      badge.style.display = (count && count > 0) ? 'inline-block' : 'none';
    }
  } catch(e) {}
}

// ═══════════════════════════════════════════
//  REPORTS APPROVAL
// ═══════════════════════════════════════════
let allReports = [];
let reportsFilter = 'all';

async function loadReportsApproval() {
  // Load tasks that are Sent for Review with pending approval
  const { data: tasks } = await sb.from('tasks')
    .select('*')
    .eq('is_archived', false)
    .eq('work_status', 'Sent for Review')
    .eq('approval_status', 'Pending')
    .order('updated_at', {ascending: false});

let myApprovalType = null;
  if (currentUser.email === 'alisha@sayashvastu.com') myApprovalType = 'Approval for Alisha';
  else if (currentUser.email === 'rajendra@sayashvastu.com') myApprovalType = 'Approval for Rajendra';

  allReports = myApprovalType ? (tasks || []).filter(t => t.approval_type === myApprovalType) : (tasks || []);

  const titleEl = document.getElementById('ra-page-title');
  const subtitleEl = document.getElementById('ra-page-subtitle');
  if (myApprovalType) {
    if (titleEl) titleEl.textContent = 'Your Pending Approvals';
    if (subtitleEl) subtitleEl.textContent = 'Tasks waiting for your review';
  } else {
    if (titleEl) titleEl.textContent = 'Reports Approval';
    if (subtitleEl) subtitleEl.textContent = 'Tasks pending approval — SG & YG';
  }
  const total = allReports.length;
  document.getElementById('ra-total').textContent = total;

  if (myApprovalType) {
    // Alisha/Rajendra view — hide SG/YG specific cards, just show total
    const sgCard = document.getElementById('ra-sg')?.closest('.stat-card');
    const ygCard = document.getElementById('ra-yg')?.closest('.stat-card');
    if (sgCard) sgCard.style.display = 'none';
    if (ygCard) ygCard.style.display = 'none';
  } else {
    const sg = allReports.filter(t => t.approval_type === 'Approval for SG').length;
    const yg = allReports.filter(t => t.approval_type === 'Approval for YG').length;
    document.getElementById('ra-sg').textContent = sg;
    document.getElementById('ra-yg').textContent = yg;
  }
  // Update badge
  const badge = document.getElementById('nb-reports');
  if (badge) {
    badge.textContent = total;
    badge.style.display = total > 0 ? 'inline-block' : 'none';
  }

  renderReportsApproval();
}

function filterReports(type) {
  reportsFilter = type;
  renderReportsApproval();
}

function renderReportsApproval() {
  const filtered = reportsFilter === 'all' ? allReports : allReports.filter(t => t.approval_type === reportsFilter);
  const el = document.getElementById('reportsApprovalList');

  if (!filtered.length) {
    el.innerHTML = '<div class="empty-state"><div class="empty-icon">📑</div><div class="empty-title">No pending approvals</div><p>All reports reviewed!</p></div>';
    return;
  }

  el.innerHTML = filtered.map(t => `
    <div class="leave-action-card" style="margin-bottom:12px">
      <div class="leave-action-head">
        <div style="flex:1">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;flex-wrap:wrap">
            <span style="background:#e8ecf5;color:var(--navy);padding:2px 8px;border-radius:4px;font-size:11px;font-weight:700">${esc(t.project)}</span>
            <span class="badge ${t.approval_type==='Approval for SG'?'b-navy':'b-blue'}">${esc(t.approval_type||'—')}</span>
            <span class="badge b-amber">⏳ Pending</span>
          </div>
          <div style="font-size:13px;font-weight:600;color:var(--navy);margin-bottom:6px">${esc(t.task_detail.substring(0,80))}${t.task_detail.length>80?'...':''}</div>
          <div style="display:flex;gap:14px;flex-wrap:wrap;font-size:11px;color:var(--muted)">
            <span>👤 By: <strong>${esc(t.assigned_to_name)}</strong></span>
            <span>📅 End: ${fmtDate(t.end_date)}</span>
            <span>🕐 Submitted: ${new Date(t.updated_at||t.created_at).toLocaleDateString('en-IN')}</span>
          </div>
          ${t.comments ? `<div style="margin-top:8px;padding:8px 12px;background:var(--bg);border-radius:8px;font-size:12px;color:var(--muted)">💬 ${esc(t.comments)}</div>` : ''}
        </div>
      </div>
      <div class="leave-action-actions">
        <button class="btn btn-green btn-sm" onclick="approveReport('${t.id}','${esc(t.assigned_to_email)}','${esc(t.assigned_to_name)}','${esc(t.project)}')">✅ Approve</button>
        <button class="btn btn-red btn-sm" onclick="rejectReport('${t.id}','${esc(t.assigned_to_email)}','${esc(t.assigned_to_name)}','${esc(t.project)}')">❌ Reject</button>
      </div>
    </div>
  `).join('');
}

async function approveReport(taskId, empEmail, empName, project) {
  const { error } = await sb.from('tasks').update({
    approval_status: 'Approved',
    work_status: 'Completed',
    ceo_approval: 'Approved',
    updated_at: new Date().toISOString()
  }).eq('id', taskId);

  if (error) { showToast('❌ ' + error.message, 'err'); return; }

  // Notify employee
  await createNotification(
    empEmail,
    `✅ Report Approved — ${project}`,
    `Your report for project "${project}" has been approved by ${currentUser.name}.`,
    'task', 'tasks'
  );
  await sendEmail(empEmail, empName,
    `✅ Report Approved — ${project}`,
    `Dear ${empName},

Your report for project "${project}" has been approved by ${currentUser.name}.

Great work!

Regards,
Sayash Vastu Portal`,
    'Report Approved', 'https://sayash-vastu-portal.vercel.app', 'View Tasks →'
  );

  showToast('✅ Report Approved!', 'ok');
  loadNotifications();
  loadReportsApproval();
  // Update badge
  const badge = document.getElementById('nb-reports');
  const count = allReports.length;
  if (badge) { badge.textContent = count; badge.style.display = count > 0 ? 'inline-block' : 'none'; }
}

async function rejectReport(taskId, empEmail, empName, project) {
  const note = prompt('Reason for rejection (will be sent to employee):');
  if (note === null) return;

  const { error } = await sb.from('tasks').update({
    approval_status: 'Rejected',
    work_status: 'In Progress',
    approval_note: note,
    updated_at: new Date().toISOString()
  }).eq('id', taskId);

  if (error) { showToast('❌ ' + error.message, 'err'); return; }

  // Notify employee
  await createNotification(
    empEmail,
    `❌ Report Rejected — ${project}`,
    `Your report for "${project}" was rejected. Reason: ${note}`,
    'task', 'tasks'
  );
  await sendEmail(empEmail, empName,
    `❌ Report Needs Revision — ${project}`,
    `Dear ${empName},

Your report for project "${project}" needs revision.

Reason: ${note}

Please update and resubmit.

Regards,
Sayash Vastu Portal`,
    'Report Revision', 'https://sayash-vastu-portal.vercel.app', 'View Tasks →'
  );

  showToast('↩️ Report sent back!', 'ok');
  loadNotifications();
  loadReportsApproval();
}

async function loadReportsBadge() {
  try {
    const { count } = await sb.from('tasks').select('*', {count: 'exact'})
      .eq('is_archived', false)
      .eq('work_status', 'Sent for Review')
      .eq('approval_status', 'Pending');
    const badge = document.getElementById('nb-reports');
    if (badge) {
      badge.textContent = count || 0;
      badge.style.display = (count && count > 0) ? 'inline-block' : 'none';
    }
  } catch(e) {}
}

// ═══════════════════════════════════════════
//  HELPERS
// ═══════════════════════════════════════════
function toggleSideMenu(menuId) {
  const menu = document.getElementById(menuId);
  if (!menu) return;
  const isOpen = menu.style.display !== 'none';
  menu.style.display = isOpen ? 'none' : 'block';
  const arrowMap = {'workMenu':'work-arrow','hrMenu':'hr-arrow','ceoMenu':'ceo-arrow','companyMenu':'company-arrow'};
  const arrowEl = document.getElementById(arrowMap[menuId]);
  if (arrowEl) arrowEl.style.transform = isOpen ? '' : 'rotate(90deg)';
}

function esc(s) { return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

function fmtDate(d) {
  if (!d) return '—';
  const dt=new Date(d);
  const months=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return dt.getDate()+'-'+months[dt.getMonth()]+'-'+dt.getFullYear();
}

function statusBadge(s) {
  const map={
    'Not Started':'b-gray',
    'In Progress':'b-blue',
    'Sent for Review':'b-amber',
    'Completed':'b-green',
    'Senior Approved':'b-blue',
    'Report Ready':'b-green'
  };
  return `<span class="badge ${map[s]||'b-gray'}">${esc(s)}</span>`;
}

function ceoBadge(v) {
  if (v==='Finalize with SG') return '<span class="badge b-green">✓ Finalized SG</span>';
  if (v==='Finalize with YG') return '<span class="badge b-green">✓ Finalized YG</span>';
  if (v==='Report Ready') return '<span class="badge b-green">📄 Report Ready</span>';
  return '<span class="badge b-amber">Pending</span>';
}

function attBadge(s) {
  const map={'Present':'b-green','Absent':'b-red','Half Day':'b-amber','Leave':'b-blue','Holiday':'b-purple'};
  return `<span class="badge ${map[s]||'b-gray'}">${esc(s)}</span>`;
}

function leaveBadge(s) {
  const map={'Pending':'b-amber','Approved':'b-green','Rejected':'b-red'};
  return `<span class="badge ${map[s]||'b-gray'}">${esc(s)}</span>`;
}

function closeModal(id) { 
  const el = document.getElementById(id);
  if (el) {
    el.classList.remove('open');
    // Dynamically added modals remove karo
if (['addClientEmpModal','editClientEmpModal','addProjEmpModal','addVisitEmpModal','addVisitGlobalModal','addPendingPaymentModal','editPendingPaymentModal','paymentHistoryModal'].includes(id)) {
    el.remove();
    }
  }
}
function showToast(msg, type) {
  const t=document.getElementById('toast');
  t.textContent=msg; t.className='toast show '+(type||'');
  setTimeout(()=>t.className='toast',10000);
}
document.querySelectorAll('.modal-overlay').forEach(el=>{
  el.addEventListener('click',function(e){ if(e.target===this) this.classList.remove('open'); });
});
// Hide Vercel badge
function hideVercelBadge() {
  ['vercel-live-feedback','nextjs-portal','[data-vercel-toolbar]'].forEach(s => {
    try { document.querySelectorAll(s).forEach(el => el.style.cssText = 'display:none!important;opacity:0!important;width:0!important;height:0!important'); } catch(e){}
  });
  document.querySelectorAll('*').forEach(el => {
    try { if(parseInt(window.getComputedStyle(el).zIndex) > 9999999 && !['BODY','HTML'].includes(el.tagName) && el.id !== 'toast') el.style.display='none'; } catch(e){}
  });
}
setTimeout(hideVercelBadge, 500);
setTimeout(hideVercelBadge, 2000);
new MutationObserver(hideVercelBadge).observe(document.body, {childList:true, subtree:true});
async function loadAllDocuments() {
  const { data: docs } = await sb.from('employee_documents')
    .select('*').order('uploaded_at', {ascending: false});
  const { data: emps } = await sb.from('employees')
    .select('name,email').eq('is_active', true);

  // Populate filter dropdown
  const filterEl = document.getElementById('doc-emp-filter');
  if (filterEl && emps) {
    const currentVal = filterEl.value;
    filterEl.innerHTML = '<option value="all">All Employees</option>' +
      emps.map(e => `<option value="${esc(e.email)}" ${currentVal===e.email?'selected':''}>${esc(e.name)}</option>`).join('');
  }

  const filterVal = filterEl ? filterEl.value : 'all';
  const filtered = filterVal === 'all' ? (docs||[]) : (docs||[]).filter(d => d.employee_email === filterVal);

  const el = document.getElementById('allDocsList');
  if (!el) return;

  if (!filtered.length) {
    el.innerHTML = '<div style="text-align:center;color:var(--muted);font-size:13px;padding:24px">No documents uploaded yet</div>';
    return;
  }

  // Group by employee
  const grouped = {};
  filtered.forEach(d => {
    if (!grouped[d.employee_email]) grouped[d.employee_email] = { name: d.employee_name, docs: [] };
    grouped[d.employee_email].docs.push(d);
  });

  el.innerHTML = Object.values(grouped).map(emp => `
    <div style="margin-bottom:20px;padding:14px;background:var(--bg);border-radius:10px">
      <div style="font-size:13px;font-weight:700;color:var(--navy);margin-bottom:10px">
        👤 ${esc(emp.name)}
        <span class="badge b-navy" style="margin-left:8px">${emp.docs.length} document${emp.docs.length>1?'s':''}</span>
      </div>
      <div style="display:flex;flex-wrap:wrap;gap:10px">
        ${emp.docs.map(d => `
          <div style="background:#fff;border:1px solid var(--border);border-radius:8px;padding:10px 14px;display:flex;align-items:center;gap:10px;min-width:200px">
            <span style="font-size:20px">🪪</span>
            <div style="flex:1">
              <div style="font-size:12px;font-weight:600;color:var(--navy)">${esc(d.document_type)}</div>
              <div style="font-size:10px;color:var(--muted)">${new Date(d.uploaded_at).toLocaleDateString('en-IN')}</div>
            </div>
            <a href="${d.file_url}" target="_blank" class="btn btn-outline btn-sm">👁️ View</a>
          </div>
        `).join('')}
      </div>
    </div>
  `).join('');
}
// ═══════════════════════════════════════════
//  ATTENDANCE REGULARIZATION
// ═══════════════════════════════════════════
async function submitRegularization() {
  const date = document.getElementById('reg-date').value;
  const reason = document.getElementById('reg-reason').value.trim();
  const checkin = document.getElementById('reg-checkin').value;
  const checkout = document.getElementById('reg-checkout').value;
  const workType = document.getElementById('reg-work-type').value;
  const msgEl = document.getElementById('regMsg');

  if (!date || !reason || !checkin) {
    msgEl.textContent = '⚠️ Date, Check In time and Reason are required';
    msgEl.style.color = 'var(--red)'; return;
  }

  const { error } = await sb.from('attendance_regularization').insert({
    employee_email: currentUser.email,
    employee_name: currentUser.name,
    date, reason,
    requested_check_in: checkin,
    requested_check_out: checkout || null,
    work_type: workType,
    status: 'Pending'
  });

  if (error) { msgEl.textContent = '❌ ' + error.message; msgEl.style.color = 'var(--red)'; return; }

  msgEl.textContent = '✅ Request submitted!'; msgEl.style.color = 'var(--green)';
  showToast('✅ Regularization request submitted!', 'ok');

  // Notify CEO
  await createNotification(
    CEO_EMAIL,
    `📋 Attendance Regularization — ${currentUser.name}`,
    `${currentUser.name} requested attendance regularization for ${date}. Reason: ${reason}`,
    'attendance', 'leaveApprove'
  );

  document.getElementById('reg-date').value = '';
  document.getElementById('reg-reason').value = '';
  document.getElementById('reg-checkin').value = '';
  document.getElementById('reg-checkout').value = '';
  loadMyRegularizations();
  setTimeout(() => msgEl.textContent = '', 4000);
}

async function loadMyRegularizations() {
  const { data } = await sb.from('attendance_regularization')
    .select('*').eq('employee_email', currentUser.email)
    .order('created_at', {ascending: false}).limit(10);

  const el = document.getElementById('myRegList');
  if (!el) return;

  if (!data || !data.length) {
    el.innerHTML = '<div style="text-align:center;color:var(--muted);font-size:13px;padding:16px">No requests submitted yet</div>';
    return;
  }

  el.innerHTML = data.map(r => {
    const statusClass = r.status==='Approved'?'b-green':r.status==='Rejected'?'b-red':'b-amber';
    const statusIcon = r.status==='Approved'?'✅':r.status==='Rejected'?'❌':'⏳';
    return `<div style="padding:12px;background:var(--bg);border-radius:10px;margin-bottom:10px;border-left:3px solid ${r.status==='Approved'?'var(--green)':r.status==='Rejected'?'var(--red)':'var(--amber)'}">
      <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px">
        <div>
          <div style="font-size:13px;font-weight:600;color:var(--navy)">📅 ${fmtDate(r.date)} — ${esc(r.work_type)}</div>
          <div style="font-size:12px;color:var(--muted);margin-top:3px">⏰ ${r.requested_check_in||'—'} → ${r.requested_check_out||'—'}</div>
          <div style="font-size:12px;color:var(--text);margin-top:4px">💬 ${esc(r.reason)}</div>
          ${r.status!=='Pending'?`<div style="font-size:11px;color:var(--muted);margin-top:4px">By: ${esc(r.approved_by||'—')}</div>`:''}
        </div>
        <span class="badge ${statusClass}">${statusIcon} ${r.status}</span>
      </div>
    </div>`;
  }).join('');
}

// CEO — Load all regularization requests
async function loadAllRegularizations() {
  const { data } = await sb.from('attendance_regularization')
    .select('*').eq('status','Pending')
    .order('created_at', {ascending: false});

  const el = document.getElementById('regularizationApproveList');
  if (!el) return;

  if (!data || !data.length) {
    el.innerHTML = '<div class="empty-state"><div class="empty-icon">✅</div><div class="empty-title">No pending requests</div></div>';
    return;
  }

  el.innerHTML = data.map(r => `
    <div class="leave-action-card" style="margin-bottom:12px">
      <div class="leave-action-head">
        <div>
          <div style="font-size:14px;font-weight:700;color:var(--navy)">${esc(r.employee_name)}</div>
          <div style="font-size:12px;color:var(--muted);margin-top:3px">
            📅 ${fmtDate(r.date)} &nbsp;|&nbsp; ⏰ ${r.requested_check_in} → ${r.requested_check_out||'—'} &nbsp;|&nbsp; ${esc(r.work_type)}
          </div>
          <div style="font-size:12px;color:var(--text);margin-top:6px">💬 ${esc(r.reason)}</div>
        </div>
        <span class="badge b-amber">⏳ Pending</span>
      </div>
      <div class="leave-action-actions">
        <button class="btn btn-green btn-sm" onclick="approveRegularization('${r.id}','${esc(r.employee_email)}','${esc(r.employee_name)}','${r.date}','${r.requested_check_in}','${r.requested_check_out||''}','${esc(r.work_type)}')">✅ Approve</button>
        <button class="btn btn-red btn-sm" onclick="rejectRegularization('${r.id}','${esc(r.employee_email)}','${esc(r.employee_name)}')">❌ Reject</button>
      </div>
    </div>
  `).join('');
}

async function approveRegularization(id, empEmail, empName, date, checkIn, checkOut, workType) {
  // Create attendance record
  const { data: emp } = await sb.from('employees').select('id').eq('email', empEmail).single();
  const checkInDT = new Date(`${date}T${checkIn}`);
  const checkOutDT = checkOut ? new Date(`${date}T${checkOut}`) : null;
  const hrs = checkOutDT ? ((checkOutDT - checkInDT)/3600000).toFixed(2) : null;
  const status = hrs ? (parseFloat(hrs) >= 5 ? 'Present' : 'Half Day') : 'Present';

  await sb.from('attendance').insert({
    employee_id: emp?.id,
    employee_email: empEmail,
    employee_name: empName,
    date, check_in: checkInDT.toISOString(),
    check_out: checkOutDT ? checkOutDT.toISOString() : null,
    working_hours: hrs, status, work_type: workType,
    is_archived: false
  });

  await sb.from('attendance_regularization').update({
    status: 'Approved',
    approved_by: currentUser.name,
    approved_at: new Date().toISOString()
  }).eq('id', id);

  await createNotification(empEmail,
    '✅ Attendance Regularization Approved',
    `Your attendance for ${date} has been approved by ${currentUser.name}.`,
    'attendance', 'attendance'
  );

  showToast('✅ Regularization approved!', 'ok');
  loadAllRegularizations();
}

async function rejectRegularization(id, empEmail, empName) {
  const reason = prompt('Reason for rejection:');
  if (reason === null) return;

  await sb.from('attendance_regularization').update({
    status: 'Rejected',
    approved_by: currentUser.name,
    approved_at: new Date().toISOString()
  }).eq('id', id);

  await createNotification(empEmail,
    '❌ Attendance Regularization Rejected',
    `Your regularization request was rejected. Reason: ${reason}`,
    'attendance', 'attendance'
  );

  showToast('↩️ Request rejected!', 'ok');
  loadAllRegularizations();
}
// ═══════════════════════════════════════════
//  CEO CALENDAR
// ═══════════════════════════════════════════
let calCurrentDate = new Date();

async function loadCalendar() {
  renderCalendar();
  loadUpcomingEvents();
}

async function renderCalendar() {
  const year = calCurrentDate.getFullYear();
  const month = calCurrentDate.getMonth();
  const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  document.getElementById('calMonthLabel').textContent = months[month] + ' ' + year;

  const { data: events } = await sb.from('ceo_events').select('*')
    .gte('event_date', new Date(year, month, 1).toISOString().split('T')[0])
    .lte('event_date', new Date(year, month+1, 0).toISOString().split('T')[0]);

  const eventMap = {};
  (events||[]).forEach(e => {
    if (!eventMap[e.event_date]) eventMap[e.event_date] = [];
    eventMap[e.event_date].push(e);
  });

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month+1, 0).getDate();
  const today = new Date().toISOString().split('T')[0];
  const typeColors = {'Meeting':'var(--blue)','Deadline':'var(--red)','Site Visit':'var(--green)','Call':'var(--amber)','Other':'var(--muted)'};

  let html = `<div style="display:grid;grid-template-columns:repeat(7,1fr);gap:4px;margin-bottom:8px">
    ${['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d=>`<div style="text-align:center;font-size:10px;font-weight:700;color:var(--muted);padding:4px">${d}</div>`).join('')}
  </div>
  <div style="display:grid;grid-template-columns:repeat(7,1fr);gap:4px">`;

  for (let i=0; i<firstDay; i++) html += `<div></div>`;

  for (let d=1; d<=daysInMonth; d++) {
    const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    const isToday = dateStr === today;
    const dayEvents = eventMap[dateStr] || [];
    html += `<div onclick="openCalDay('${dateStr}')" style="min-height:60px;border:1px solid ${isToday?'var(--gold)':'var(--border)'};border-radius:8px;padding:6px;cursor:pointer;background:${isToday?'#fdf9ef':'#fff'};transition:all 0.15s" onmouseover="this.style.background='#f8f9fc'" onmouseout="this.style.background='${isToday?'#fdf9ef':'#fff'}'">
      <div style="font-size:12px;font-weight:${isToday?'800':'600'};color:${isToday?'var(--gold)':'var(--navy)'};margin-bottom:4px">${d}</div>
      ${dayEvents.slice(0,2).map(e=>`<div style="font-size:9px;background:${typeColors[e.event_type]||'var(--muted)'};color:#fff;border-radius:4px;padding:1px 5px;margin-bottom:2px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(e.title)}</div>`).join('')}
      ${dayEvents.length>2?`<div style="font-size:9px;color:var(--muted)">+${dayEvents.length-2} more</div>`:''}
    </div>`;
  }
  html += '</div>';
  document.getElementById('calGrid').innerHTML = html;
}

async function loadUpcomingEvents() {
  const today = new Date().toISOString().split('T')[0];
  const { data: events } = await sb.from('ceo_events').select('*')
    .gte('event_date', today).order('event_date',{ascending:true}).limit(10);
  const el = document.getElementById('upcomingEvents');
  if (!el) return;
  if (!events||!events.length) {
    el.innerHTML='<div style="text-align:center;color:var(--muted);font-size:13px;padding:16px">No upcoming events</div>';
    return;
  }
  const typeColors = {'Meeting':'var(--blue)','Deadline':'var(--red)','Site Visit':'var(--green)','Call':'var(--amber)','Other':'var(--muted)'};
  const typeIcons = {'Meeting':'🔵','Deadline':'🔴','Site Visit':'🟢','Call':'🟡','Other':'⚪'};
  el.innerHTML = events.map(e=>`
    <div style="padding:10px 0;border-bottom:1px solid #f5f6fa;display:flex;gap:10px;align-items:flex-start">
      <div style="width:36px;height:36px;border-radius:8px;background:${typeColors[e.event_type]||'var(--muted)'};display:flex;align-items:center;justify-content:center;font-size:16px;flex-shrink:0">${typeIcons[e.event_type]||'⚪'}</div>
      <div style="flex:1">
        <div style="font-size:12px;font-weight:600;color:var(--navy)">${esc(e.title)}</div>
        <div style="font-size:11px;color:var(--muted);margin-top:2px">${fmtDate(e.event_date)}${e.event_time?' · '+e.event_time.substring(0,5):''}</div>
        ${e.description?`<div style="font-size:11px;color:var(--muted);margin-top:2px">${esc(e.description.substring(0,40))}...</div>`:''}
      </div>
      <button onclick="deleteCalEvent('${e.id}')" style="background:#fdf0ee;color:var(--red);border:1px solid var(--red-bg);border-radius:6px;padding:3px 8px;font-size:11px;cursor:pointer">🗑️</button>
    </div>
  `).join('');
}

function calPrevMonth() {
  calCurrentDate = new Date(calCurrentDate.getFullYear(), calCurrentDate.getMonth()-1, 1);
  renderCalendar();
}

function calNextMonth() {
  calCurrentDate = new Date(calCurrentDate.getFullYear(), calCurrentDate.getMonth()+1, 1);
  renderCalendar();
}

function openCalDay(dateStr) {
  document.getElementById('cal-date').value = dateStr;
  document.getElementById('cal-title').focus();
  showToast('📅 Date selected: ' + dateStr, '');
}

async function addCalEvent() {
  const title = document.getElementById('cal-title').value.trim();
  const type = document.getElementById('cal-type').value;
  const date = document.getElementById('cal-date').value;
  const time = document.getElementById('cal-time').value;
  const desc = document.getElementById('cal-desc').value.trim();
  const msgEl = document.getElementById('calMsg');
  if (!title||!date) { msgEl.textContent='⚠️ Title aur Date required'; msgEl.style.color='var(--red)'; return; }
  const { error } = await sb.from('ceo_events').insert({
    title, event_type: type, event_date: date,
    event_time: time||null, description: desc||null
  });
  if (error) { msgEl.textContent='❌ '+error.message; msgEl.style.color='var(--red)'; return; }
  msgEl.textContent='✅ Event added!'; msgEl.style.color='var(--green)';
  document.getElementById('cal-title').value='';
  document.getElementById('cal-date').value='';
  document.getElementById('cal-time').value='';
  document.getElementById('cal-desc').value='';
  showToast('✅ Event added!','ok');
  renderCalendar();
  loadUpcomingEvents();
  setTimeout(()=>msgEl.textContent='',3000);
}

async function deleteCalEvent(id) {
  if (!confirm('Delete this event?')) return;
  await sb.from('ceo_events').delete().eq('id',id);
  showToast('✅ Event deleted!','ok');
  renderCalendar();
  loadUpcomingEvents();
}
// ═══════════════════════════════════════════
//  EXPENSE CLAIMS
// ═══════════════════════════════════════════
// ═══════════════════════════════════════════
//  COMPLIANCE / FINANCE CHECKLIST
// ═══════════════════════════════════════════
let currentComplianceId = null;

async function loadCompliance() {
const now = new Date();
  const defaultMonth = now.getFullYear() + '-' + String(now.getMonth()+1).padStart(2,'0');
  const monthEl = document.getElementById('comp-month-filter');
if (!monthEl.value) monthEl.value = defaultMonth;
const personEl = document.getElementById('comp-person-filter');
if (!personEl.value) personEl.value = 'all';  
  const monthVal = monthEl ? monthEl.value : defaultMonth;
  const personVal = document.getElementById('comp-person-filter')?.value || 'all';
  const freqVal = document.getElementById('comp-freq-filter')?.value || 'all';
const catVal = document.getElementById('comp-cat-filter')?.value || 'all';
  
  // Alisha sirf apni tasks dekhe
  const isAlisha = currentUser.email === 'alisha@sayashvastu.com';
  const isCEO = currentUser.role === 'ceo';
  let query = sb.from('compliance_tasks').select('*').order('assigned_to_name').order('category');
  if (monthVal) query = query.eq('month_year', monthVal);
  if (personVal !== 'all') query = query.eq('assigned_to_name', personVal);
  if (freqVal !== 'all') query = query.eq('frequency', freqVal);
  if (catVal !== 'all') query = query.eq('category', catVal);
  const { data: tasks } = await query;
  const allTasks = tasks || [];

  const done = allTasks.filter(t => t.status === 'Done').length;
  const pending = allTasks.filter(t => t.status !== 'Done').length;
  document.getElementById('comp-done').textContent = done;
  document.getElementById('comp-pending').textContent = pending;
  document.getElementById('comp-total').textContent = allTasks.length;
  
 const tbody = document.getElementById('complianceBody');
  if (!allTasks.length) {
    tbody.innerHTML = '<tr><td colspan="10" style="text-align:center;padding:30px;color:var(--muted)">No tasks found for this month</td></tr>';
    return;
  }
  const catColors = {
    'Tax':'b-red','GST':'b-blue','PF':'b-navy','ESI':'b-purple',
    'Accounts':'b-green','Bank':'b-amber','Invoice':'b-gold','Bills':'b-gray',
    'Insurance':'b-purple','Other':'b-navy'
  };
  const freqLabels = {'M':'Monthly','Q':'Quarterly','Y':'Yearly'};

  tbody.innerHTML = allTasks.map((t, i) => {
    const isDone = t.status === 'Done';
const today = new Date(); today.setHours(0,0,0,0);
const dueDate = t.last_date ? new Date(t.last_date) : null;
const daysLeft = dueDate ? Math.ceil((dueDate - today) / 86400000) : null;
const isDueSoon = !isDone && daysLeft !== null && daysLeft <= 5 && daysLeft >= 0;
const freq = (t.frequency||'').toLowerCase();
const isYearly = freq === 'y' || freq === 'yearly';
const isOverdue = !isDone && daysLeft !== null && daysLeft < 0 && !isYearly;
    const rowBg = isDone ? 'background:#f0faf5' : isOverdue ? 'background:#fdf0ee' : isDueSoon ? 'background:#fef3e2' : '';
const canUpdate = currentUser.email === 'alisha@sayashvastu.com' || currentUser.role === 'ceo';
    return `<tr style="${rowBg}">
      <td style="font-size:11px;color:var(--muted)">${i+1}</td>
      <td style="font-weight:600;font-size:12px;max-width:200px">${esc(t.particulars)}</td>
      <td><span class="badge b-blue" style="font-size:10px">${freqLabels[t.frequency]||t.frequency||'—'}</span></td>
<td style="font-size:12px;font-weight:700;color:${isOverdue?'var(--red)':isDueSoon?'var(--amber)':'var(--navy)'}">
${esc(t.last_date||'—')}
${isOverdue?'<span style="color:var(--red);">●</span>':''}
  ${isDueSoon?`<span class="badge b-amber" style="font-size:9px;margin-left:4px">${daysLeft}d left</span>`:''}
</td>
      <td><span style="font-size:11px;font-weight:600;color:var(--navy)">${esc(t.assigned_to_name||'—')}</span></td>
      <td><span class="badge ${catColors[t.category]||'b-gray'}" style="font-size:10px">${esc(t.category||'—')}</span></td>
      <td>
        ${isDone
          ? '<span class="badge b-green">✅ Done</span>'
          : '<span class="badge b-amber">⏳ Pending</span>'}
      </td>
      <td style="font-size:11px;color:var(--muted)">${esc(t.done_by_name||'—')}</td>
      <td style="font-size:11px;color:var(--muted);max-width:120px">${esc((t.remarks||'').substring(0,30))}${(t.remarks||'').length>30?'...':''}</td>
      <td>
        <div style="display:flex;gap:5px">
  <button class="btn btn-outline btn-sm" onclick="openComplianceView('${t.id}','${esc(t.particulars)}','${esc(t.remarks||'')}','${esc(t.done_by_name||'')}','${t.done_at||''}')">👁️</button>
  ${!isDone && currentUser.email === 'alisha@sayashvastu.com'
    ? `<button class="btn btn-green btn-sm" onclick="openComplianceDone('${t.id}','${esc(t.particulars)}')">✅ Mark Done</button>`
    : isDone && currentUser.role === 'ceo'
    ? `<button class="btn btn-sm" onclick="resetCompliance('${t.id}')" style="background:#fdf0ee;color:var(--red);border-color:var(--red-bg)">↩️ Reset</button>`
    : '—'}
      ${(currentUser.role === 'ceo' || currentUser.email === 'alisha@sayashvastu.com') ? `<button class="btn btn-sm" onclick="deleteComplianceTask('${t.id}')" style="background:#fdf0ee;color:var(--red);border-color:var(--red-bg)">🗑️</button>` : ''}
</div>
      </td>
    </tr>`;
  }).join('');

  const compAddPanel = document.getElementById('comp-add-panel');
  if (compAddPanel) compAddPanel.style.display = (currentUser.role === 'ceo' || currentUser.email === 'alisha@sayashvastu.com') ? 'block' : 'none';
  // Due soon notifications
  if (currentUser.role === 'ceo' || currentUser.email === 'alisha@sayashvastu.com') {
    const dueSoonTasks = allTasks.filter(t => {
      if (t.status === 'Done') return false;
      const due = t.last_date ? new Date(t.last_date) : null;
      const today2 = new Date(); today2.setHours(0,0,0,0);
      const diff = due ? Math.ceil((due - today2) / 86400000) : null;
      return diff !== null && diff <= 5 && diff >= 0;
    });
    if (dueSoonTasks.length > 0) {
      const notifKey = 'sv_compliance_due_' + new Date().toDateString();
      if (!localStorage.getItem(notifKey)) {
        localStorage.setItem(notifKey, 'true');
        await createNotification(
          currentUser.email,
          `⚠️ ${dueSoonTasks.length} Compliance task(s) due soon!`,
          dueSoonTasks.map(t => `${t.particulars} — ${t.last_date}`).join(', '),
          'General', 'compliance'
        );
      }
    }
  }
}

function openComplianceDone(taskId, taskName) {
  currentComplianceId = taskId;
  document.getElementById('compModalContent').innerHTML = `
    <div style="padding:12px;background:#f8f9fc;border-radius:8px;margin-bottom:16px">
      <div style="font-size:13px;font-weight:700;color:var(--navy)">${esc(taskName)}</div>
    </div>
    <div class="field" style="margin-bottom:14px">
      <label>Remarks (Optional)</label>
      <textarea id="comp-remarks" placeholder="Any notes or reference number..." style="min-height:80px"></textarea>
    </div>
  `;
  document.getElementById('complianceModal').classList.add('open');
}

async function saveComplianceDone() {
  const remarks = document.getElementById('comp-remarks')?.value?.trim() || '';
  const { error } = await sb.from('compliance_tasks').update({
    status: 'Done',
    done_by_name: currentUser.name,
    done_at: new Date().toISOString(),
    remarks: remarks || null
  }).eq('id', currentComplianceId);
  if (error) { showToast('❌ ' + error.message, 'err'); return; }
  showToast('✅ Task marked as done!', 'ok');
  closeModal('complianceModal');
  loadCompliance();

  // CEO ko notify karo
  if (currentUser.email !== CEO_EMAIL) {
    await createNotification(
      CEO_EMAIL,
      `✅ Compliance task done — ${currentUser.name}`,
      `${currentUser.name} marked a compliance task as done.`,
      'General', 'compliance'
    );
  }
}

async function deleteComplianceTask(id) {
  if (!confirm('Delete this compliance task?')) return;
  const { error } = await sb.from('compliance_tasks').delete().eq('id', id);
  if (error) { showToast('❌ ' + error.message, 'err'); return; }
  showToast('✅ Task deleted!', 'ok');
  loadCompliance();
}
function openComplianceView(id, particulars, remarks, doneBy, doneAt) {
  document.getElementById('compModalContent').innerHTML = `
    <div style="padding:12px;background:#f8f9fc;border-radius:8px;margin-bottom:16px">
      <div style="font-size:13px;font-weight:700;color:var(--navy)">${esc(particulars)}</div>
    </div>
    <div style="font-size:12px;color:var(--muted);margin-bottom:8px">
      ${doneBy ? `✅ Done by: <strong>${esc(doneBy)}</strong>` : '⏳ Not completed yet'}
    </div>
    ${doneAt ? `<div style="font-size:11px;color:var(--muted)">🕐 ${new Date(doneAt).toLocaleString('en-IN')}</div>` : ''}
    ${remarks ? `<div style="margin-top:10px;padding:10px;background:var(--bg);border-radius:8px;font-size:12px">💬 Remarks: ${esc(remarks)}</div>` : ''}
  `;
  document.getElementById('complianceModal').classList.add('open');
}
async function openEmpQuickView(empEmail) {
  const { data: emp } = await sb.from('employees').select('*').eq('email', empEmail).single();
  const { data: todayAtt } = await sb.from('attendance').select('*').eq('employee_email', empEmail).eq('date', new Date().toISOString().split('T')[0]).eq('is_archived', false).maybeSingle();
  const { data: tasks } = await sb.from('tasks').select('*').eq('assigned_to_email', empEmail).eq('is_archived', false).neq('work_status', 'Completed');
  if (!emp) return;
  const today = new Date(); today.setHours(0,0,0,0);
  document.getElementById('compModalContent').innerHTML = `
    <div style="display:flex;align-items:center;gap:14px;margin-bottom:16px;padding:14px;background:linear-gradient(135deg,var(--navy),var(--navy2));border-radius:10px">
      <div class="av" style="background:var(--gold);width:48px;height:48px;font-size:16px;color:var(--navy)">${esc(emp.name).substring(0,2).toUpperCase()}</div>
      <div>
        <div style="font-size:15px;font-weight:700;color:#fff">${esc(emp.name)}</div>
        <div style="font-size:12px;color:rgba(255,255,255,0.6)">${esc(emp.designation||'—')} · ${esc(emp.department||'—')}</div>
        <div style="font-size:11px;color:rgba(255,255,255,0.5);margin-top:2px">${esc(emp.employee_code||'—')}</div>
      </div>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:14px">
      <div style="padding:10px;background:var(--bg);border-radius:8px">
        <div style="font-size:10px;color:var(--muted);font-weight:700;text-transform:uppercase;margin-bottom:4px">📧 Email</div>
        <div style="font-size:12px;color:var(--navy);font-weight:600">${esc(emp.email)}</div>
      </div>
      <div style="padding:10px;background:var(--bg);border-radius:8px">
        <div style="font-size:10px;color:var(--muted);font-weight:700;text-transform:uppercase;margin-bottom:4px">📱 Phone</div>
        <div style="font-size:12px;color:var(--navy);font-weight:600">${esc(emp.phone||'—')}</div>
      </div>
      <div style="padding:10px;background:var(--bg);border-radius:8px">
        <div style="font-size:10px;color:var(--muted);font-weight:700;text-transform:uppercase;margin-bottom:4px">📅 Joining Date</div>
        <div style="font-size:12px;color:var(--navy);font-weight:600">${emp.joining_date?fmtDate(emp.joining_date):'—'}</div>
      </div>
      <div style="padding:10px;background:var(--bg);border-radius:8px">
        <div style="font-size:10px;color:var(--muted);font-weight:700;text-transform:uppercase;margin-bottom:4px">🎂 Birthday</div>
<div style="font-size:12px;color:var(--navy);font-weight:600">${emp.date_of_birth?new Date(emp.date_of_birth).toLocaleDateString('en-IN',{day:'2-digit',month:'long'}):'—'}</div>
      </div>
    </div>
    <div style="padding:10px;background:${todayAtt?'var(--green-bg)':'var(--red-bg)'};border-radius:8px;margin-bottom:14px">
      <div style="font-size:11px;font-weight:700;color:${todayAtt?'var(--green)':'var(--red)'};margin-bottom:4px">Today's Attendance</div>
      <div style="font-size:12px;color:var(--text)">
        ${todayAtt ? `✅ ${todayAtt.status} | In: ${todayAtt.check_in?new Date(todayAtt.check_in).toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'}):'—'} | Out: ${todayAtt.check_out?new Date(todayAtt.check_out).toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'}):'—'} | ${todayAtt.working_hours?parseFloat(todayAtt.working_hours).toFixed(1)+'h':'—'}` : '❌ Not checked in today'}
      </div>
    </div>
    <div style="padding:10px;background:var(--bg);border-radius:8px">
      <div style="font-size:11px;font-weight:700;color:var(--muted);margin-bottom:8px">Active Tasks (${(tasks||[]).length})</div>
      ${(tasks||[]).length ? (tasks||[]).slice(0,3).map(t => {
const isLate = t.end_date && today > new Date(t.end_date) && t.work_status !== 'Completed' && t.work_status !== 'Report Ready';
        return `<div style="display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid #f5f6fa">
          <span style="background:#e8ecf5;color:var(--navy);padding:1px 6px;border-radius:4px;font-size:10px;font-weight:700">${esc(t.project)}</span>
          <span style="font-size:11px;flex:1">${esc(t.task_detail.substring(0,35))}...</span>
          ${isLate?'<span class="badge b-red" style="font-size:9px">Late</span>':statusBadge(t.work_status)}
        </div>`;
      }).join('') : '<div style="font-size:12px;color:var(--muted)">No active tasks</div>'}
    </div>
  `;
  document.getElementById('complianceModal').classList.add('open');
}
async function loadExpenses() {
  const isCEO = currentUser.role === 'ceo';
  const isManager = currentUser.role === 'manager';
  const formPanel = document.getElementById('expense-form-panel');
  const allPanel = document.getElementById('allExpensesPanel');
  if (isCEO || isManager) {
    if (allPanel) allPanel.style.display = 'block';
    loadAllExpenses();
  } else {
    if (allPanel) allPanel.style.display = 'none';
  }
  loadMyExpenses();
}

async function loadMyExpenses() {
  const { data } = await sb.from('expense_claims')
    .select('*').eq('employee_email', currentUser.email)
    .eq('is_archived', false)
    .order('created_at', {ascending: false});
  const el = document.getElementById('myExpenseList');
  if (!el) return;
  if (!data || !data.length) {
    el.innerHTML = '<div style="text-align:center;color:var(--muted);font-size:13px;padding:20px">No expense claims submitted yet</div>';
    return;
  }
  const today = new Date(); today.setHours(0,0,0,0);
  el.innerHTML = data.map(e => {
    const statusClass = e.status==='Approved'?'b-green':e.status==='Rejected'?'b-red':'b-amber';
    const statusIcon = e.status==='Approved'?'✅':e.status==='Rejected'?'❌':'⏳';
    const typeIcons = {'Travel':'✈️','Food':'🍽️','Accommodation':'🏨','Fuel':'⛽','Other':'📦'};
    const expDate = new Date(e.expense_date);
    const daysDiff = Math.floor((today - expDate) / 86400000);
    const daysLeft = 7 - daysDiff;
    return `<div style="padding:14px;background:var(--bg);border-radius:10px;margin-bottom:12px;border-left:3px solid ${e.status==='Approved'?'var(--green)':e.status==='Rejected'?'var(--red)':'var(--amber)'}">
      <div style="display:flex;align-items:flex-start;justify-content:space-between;flex-wrap:wrap;gap:10px">
        <div style="flex:1">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;flex-wrap:wrap">
            <span style="font-size:18px">${typeIcons[e.expense_type]||'📦'}</span>
            <span style="font-size:14px;font-weight:700;color:var(--navy)">${esc(e.expense_type)}</span>
            <span class="badge ${statusClass}">${statusIcon} ${e.status}</span>
            ${e.is_paid?'<span class="badge b-green">💰 Paid</span>':''}
          </div>
          <div style="font-size:13px;color:var(--text);margin-bottom:6px">💬 ${esc(e.description||'—')}</div>
          <div style="display:flex;gap:14px;font-size:11px;color:var(--muted);flex-wrap:wrap;margin-bottom:6px">
            <span>📅 Expense Date: <strong>${fmtDate(e.expense_date)}</strong></span>
            <span>🕐 Submitted: ${fmtDate(e.created_at)}</span>
          </div>
          ${e.status==='Approved'?`
            <div style="background:var(--green-bg);border-radius:8px;padding:8px 12px;font-size:12px;color:var(--green);font-weight:600">
              ✅ Approved by: <strong>${esc(e.approved_by||'—')}</strong>
              ${e.is_paid?`&nbsp;|&nbsp; 💰 Paid by: <strong>${esc(e.paid_by||'—')}</strong>`:'<span style="color:var(--amber)"> &nbsp;|&nbsp; ⏳ Payment Pending</span>'}
            </div>
          `:''}
          ${e.status==='Rejected'?`
            <div style="background:var(--red-bg);border-radius:8px;padding:8px 12px;font-size:12px;color:var(--red);font-weight:600">
              ❌ Rejected by: <strong>${esc(e.approved_by||'—')}</strong>
            </div>
          `:''}
          ${e.status==='Pending' && daysLeft > 0?`
            <div style="font-size:11px;color:var(--amber);font-weight:600;margin-top:4px">
              ⏰ ${daysLeft} day${daysLeft>1?'s':''} left to process
            </div>
          `:''}
        </div>
        <div style="text-align:right">
<div style="font-size:22px;font-weight:800;color:var(--navy)">₹${parseFloat(e.amount).toLocaleString('en-IN')}</div>
          ${e.receipt_url ? `<div style="margin-top:6px">${e.receipt_url.split(',').map((url,idx) => `<a href="${url.trim()}" target="_blank" class="btn btn-outline btn-sm" style="font-size:10px;margin:2px 0">📄 View ${e.receipt_url.split(',').length > 1 ? (idx+1) : ''}</a>`).join('')}</div>` : ''}
<button onclick="deleteExpense('${e.id}')" class="btn btn-sm" style="background:#fdf0ee;color:var(--red);border-color:var(--red-bg);margin-top:6px">🗑️ Delete</button>
        </div>
      </div>
    </div>`;
  }).join('');
}
async function loadAllExpenses() {
  const filterVal = document.getElementById('exp-status-filter')?.value || 'all';
let query = sb.from('expense_claims').select('*').eq('is_archived', false).order('created_at', {ascending: false});
  if (filterVal !== 'all') query = query.eq('status', filterVal);
  const { data } = await query;
  const el = document.getElementById('allExpenseList');
  if (!el) return;
  if (!data || !data.length) {
    el.innerHTML = '<div style="text-align:center;color:var(--muted);font-size:13px;padding:20px">No claims found</div>';
    return;
  }
  const isCEO = currentUser.role === 'ceo';
  const isManager = currentUser.role === 'manager';
  const typeIcons = {'Travel':'✈️','Food':'🍽️','Accommodation':'🏨','Fuel':'⛽','Other':'📦'};

  // Total summary
  const totalPending = data.filter(e=>e.status==='Pending').length;
  const totalApproved = data.filter(e=>e.status==='Approved').length;
  const totalAmount = data.filter(e=>e.status==='Approved').reduce((s,e)=>s+parseFloat(e.amount||0),0);
  const totalPaid = data.filter(e=>e.is_paid).reduce((s,e)=>s+parseFloat(e.amount||0),0);

  let html = `
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:16px">
      <div style="background:#fdf6e3;border-radius:8px;padding:12px;text-align:center;border-top:3px solid var(--amber)">
        <div style="font-size:18px;font-weight:800;color:var(--amber)">${totalPending}</div>
        <div style="font-size:10px;color:var(--muted);font-weight:700;text-transform:uppercase;margin-top:3px">Pending</div>
      </div>
      <div style="background:var(--green-bg);border-radius:8px;padding:12px;text-align:center;border-top:3px solid var(--green)">
        <div style="font-size:18px;font-weight:800;color:var(--green)">${totalApproved}</div>
        <div style="font-size:10px;color:var(--muted);font-weight:700;text-transform:uppercase;margin-top:3px">Approved</div>
      </div>
      <div style="background:var(--blue-bg);border-radius:8px;padding:12px;text-align:center;border-top:3px solid var(--blue)">
        <div style="font-size:18px;font-weight:800;color:var(--blue)">₹${totalAmount.toLocaleString('en-IN')}</div>
        <div style="font-size:10px;color:var(--muted);font-weight:700;text-transform:uppercase;margin-top:3px">Total Approved</div>
      </div>
      <div style="background:var(--green-bg);border-radius:8px;padding:12px;text-align:center;border-top:3px solid var(--green)">
        <div style="font-size:18px;font-weight:800;color:var(--green)">₹${totalPaid.toLocaleString('en-IN')}</div>
        <div style="font-size:10px;color:var(--muted);font-weight:700;text-transform:uppercase;margin-top:3px">Total Paid</div>
      </div>
    </div>
    <div class="tbl-wrap">
      <table>
        <thead>
          <tr style="background:#f8f9fc">
            <th style="padding:10px 14px;text-align:left;color:var(--muted);font-size:10px;font-weight:700;text-transform:uppercase">Employee</th>
            <th style="padding:10px 14px;text-align:left;color:var(--muted);font-size:10px;font-weight:700;text-transform:uppercase">Type</th>
            <th style="padding:10px 14px;text-align:left;color:var(--muted);font-size:10px;font-weight:700;text-transform:uppercase">Amount</th>
            <th style="padding:10px 14px;text-align:left;color:var(--muted);font-size:10px;font-weight:700;text-transform:uppercase">Date</th>
            <th style="padding:10px 14px;text-align:left;color:var(--muted);font-size:10px;font-weight:700;text-transform:uppercase">Description</th>
            <th style="padding:10px 14px;text-align:left;color:var(--muted);font-size:10px;font-weight:700;text-transform:uppercase">Status</th>
            <th style="padding:10px 14px;text-align:left;color:var(--muted);font-size:10px;font-weight:700;text-transform:uppercase">Approved By</th>
            <th style="padding:10px 14px;text-align:left;color:var(--muted);font-size:10px;font-weight:700;text-transform:uppercase">Paid By</th>
            <th style="padding:10px 14px;text-align:left;color:var(--muted);font-size:10px;font-weight:700;text-transform:uppercase">Receipt</th>
<th style="padding:10px 14px;text-align:left;color:var(--muted);font-size:10px;font-weight:700;text-transform:uppercase">Action</th>
          </tr>
        </thead>
        <tbody>
          ${data.map(e=>`<tr style="border-bottom:1px solid #f5f6fa">
            <td style="padding:10px 14px;font-weight:600;color:var(--navy)">${esc(e.employee_name)}</td>
            <td style="padding:10px 14px">${typeIcons[e.expense_type]||'📦'} ${esc(e.expense_type)}</td>
            <td style="padding:10px 14px;font-weight:700;color:var(--navy)">₹${parseFloat(e.amount).toLocaleString('en-IN')}</td>
            <td style="padding:10px 14px;font-size:12px">${fmtDate(e.expense_date)}</td>
            <td style="padding:10px 14px;font-size:12px;color:var(--muted);max-width:150px">${esc((e.description||'—').substring(0,40))}</td>
            <td style="padding:10px 14px">
              <span class="badge ${e.status==='Approved'?'b-green':e.status==='Rejected'?'b-red':'b-amber'}">
                ${e.status==='Approved'?'✅':e.status==='Rejected'?'❌':'⏳'} ${e.status}
              </span>
              ${e.is_paid?'<span class="badge b-green" style="margin-left:4px">💰 Paid</span>':''}
            </td>
            <td style="padding:10px 14px;font-size:12px;font-weight:600;color:var(--green)">${e.approved_by?esc(e.approved_by):'—'}</td>
            <td style="padding:10px 14px;font-size:12px;font-weight:600;color:var(--blue)">${e.paid_by?esc(e.paid_by):'—'}</td>
<td style="padding:10px 14px">${e.receipt_url ? e.receipt_url.split(',').map((url,idx) => `<a href="${url.trim()}" target="_blank" class="btn btn-outline btn-sm" style="margin:2px">📄 View ${e.receipt_url.split(',').length > 1 ? (idx+1) : ''}</a>`).join('') : '—'}</td>
<td style="padding:10px 14px">
  <div style="display:flex;gap:6px;flex-wrap:wrap">
    ${isManager && e.status==='Pending'?`
      <button class="btn btn-green btn-sm" onclick="approveExpense('${e.id}','${esc(e.employee_email)}','${esc(e.employee_name)}')">✅ Approve</button>
      <button class="btn btn-red btn-sm" onclick="rejectExpense('${e.id}','${esc(e.employee_email)}','${esc(e.employee_name)}')">❌ Reject</button>
    `:''}
    ${isManager && e.status==='Approved' && !e.is_paid?`
      <button class="btn btn-gold btn-sm" onclick="markExpensePaid('${e.id}','${esc(e.employee_email)}','${esc(e.employee_name)}')">💰 Mark Paid</button>
    `:''}
    ${e.status==='Approved' && e.is_paid?'<span class="badge b-green">Done ✅</span>':''}
<button class="btn btn-sm" onclick="deleteExpense('${e.id}')" style="background:#fdf0ee;color:var(--red);border-color:var(--red-bg)">🗑️</button>
  </div>
</td>
          </tr>`).join('')}
        </tbody>
      </table>
    </div>`;
  el.innerHTML = html;
}
function previewExpFile(input) {
  const files = input.files;
  if (!files.length) return;
  document.getElementById('exp-preview').innerHTML = Array.from(files).map(file => `
    <div style="display:flex;align-items:center;gap:8px;padding:4px 0;border-bottom:1px solid #f5f6fa">
      <span style="font-size:16px">📄</span>
      <div>
        <div style="font-size:12px;font-weight:600;color:var(--navy)">${file.name}</div>
        <div style="font-size:11px;color:var(--muted)">${(file.size/1024).toFixed(0)} KB</div>
      </div>
    </div>
  `).join('');
}

async function submitExpense() {
  const btn = document.querySelector('[onclick="submitExpense()"]');
  if (btn && btn.disabled) return;
  if (btn) { btn.disabled = true; btn.textContent = 'Submitting...'; }

  const type = document.getElementById('exp-type').value;
  const amount = document.getElementById('exp-amount').value;
  const date = document.getElementById('exp-date').value;
  const desc = document.getElementById('exp-desc').value.trim();
  const files = document.getElementById('exp-file').files;
  const msgEl = document.getElementById('expMsg');

  if (!amount || !date) { 
    msgEl.textContent='⚠️ Amount aur Date required'; 
    msgEl.style.color='var(--red)'; 
    if (btn) { btn.disabled = false; btn.textContent = '📤 Submit Claim'; }
    return; 
  }

  const expDate = new Date(date);
  const today = new Date(); today.setHours(0,0,0,0);
  const diffDays = Math.floor((today - expDate) / 86400000);
  if (diffDays > 7) { 
    msgEl.textContent='❌ 1 week se purani expense claim nahi kar sakte!'; 
    msgEl.style.color='var(--red)'; 
    if (btn) { btn.disabled = false; btn.textContent = '📤 Submit Claim'; }
    return; 
  }

  const onedriveLink = document.getElementById('exp-onedrive-link') ? document.getElementById('exp-onedrive-link').value.trim() : '';
  let receiptUrls = []; let receiptNames = [];
  if (onedriveLink) {
    receiptUrls.push(onedriveLink);
    receiptNames.push('OneDrive Link');
  }
  if (files && files.length) {
    msgEl.textContent='⏳ Uploading files...'; msgEl.style.color='var(--muted)';
    for (const file of files) {
      if (file.size > 5*1024*1024) { 
        msgEl.textContent='❌ Max 5MB per file allowed'; 
        msgEl.style.color='var(--red)'; 
        if (btn) { btn.disabled = false; btn.textContent = '📤 Submit Claim'; }
        return; 
      }
const path = `expenses/${Date.now()}_${file.name.replace(/[^a-z0-9.]/gi,'_').toLowerCase()}`;
const { error: uploadErr } = await sb.storage.from('Task-Files').upload(path, file, {upsert: true});
      if (uploadErr) {
        msgEl.textContent='❌ Upload failed: '+uploadErr.message;
        msgEl.style.color='var(--red)';
        if (btn) { btn.disabled = false; btn.textContent = '📤 Submit Claim'; }
        return;
      }
      const { data: urlData } = sb.storage.from('Task-Files').getPublicUrl(path);
      receiptUrls.push(urlData.publicUrl);
      receiptNames.push(file.name);
    }
  }

const { error } = await sb.from('expense_claims').insert({
    employee_email: currentUser.email,
    employee_name: currentUser.name,
    expense_type: type, amount: parseFloat(amount),
    expense_date: date, description: desc,
    receipt_url: receiptUrls.join(', ') || null,
    receipt_name: receiptNames.join(', ') || null
  });
  if (error) { 
    msgEl.textContent='❌ '+error.message; 
    msgEl.style.color='var(--red)'; 
    if (btn) { btn.disabled = false; btn.textContent = '📤 Submit Claim'; }
    return; 
  }

  msgEl.textContent='✅ Claim submitted!'; msgEl.style.color='var(--green)';
  showToast('✅ Expense claim submitted!','ok');
  if (btn) { btn.disabled = false; btn.textContent = '📤 Submit Claim'; }

  await createNotification(CEO_EMAIL,
    `💰 Expense Claim — ${currentUser.name}`,
    `${currentUser.name} submitted a ${type} expense claim of ₹${amount}.`,
    'info', 'expenses'
  );

  document.getElementById('exp-amount').value='';
  document.getElementById('exp-date').value='';
  document.getElementById('exp-desc').value='';
document.getElementById('exp-file').value='';
  if (document.getElementById('exp-onedrive-link')) document.getElementById('exp-onedrive-link').value='';
  document.getElementById('exp-preview').innerHTML='<div class="upload-zone-text">Click to upload receipt</div><div class="upload-zone-hint">PDF, JPG, PNG — max 5MB</div>';
  loadMyExpenses();
  setTimeout(()=>msgEl.textContent='',4000);
}

async function approveExpense(id, empEmail, empName) {
  const approver = prompt('Approved by:\n1. Neha\n2. Yash\n\nType name:');
  if (!approver) return;
  const approverName = approver.toLowerCase().includes('neha') ? 'Neha' : 
                       approver.toLowerCase().includes('yash') ? 'Yash' : approver;
  await sb.from('expense_claims').update({
    status: 'Approved',
    approved_by: approverName,
    approved_at: new Date().toISOString()
  }).eq('id', id);
  await createNotification(empEmail,
    '✅ Expense Claim Approved',
    `Your expense claim has been approved by ${approverName}.`,
    'info', 'expenses'
  );
  showToast('✅ Expense approved by '+approverName+'!','ok');
  loadAllExpenses();
}
async function rejectExpense(id, empEmail, empName) {
  const reason = prompt('Reason for rejection:');
  if (reason === null) return;
  await sb.from('expense_claims').update({
    status: 'Rejected',
    approved_by: currentUser.name,
    approved_at: new Date().toISOString()
  }).eq('id', id);
  await createNotification(empEmail,
    '❌ Expense Claim Rejected',
    `Your expense claim was rejected by ${currentUser.name}. Reason: ${reason}`,
    'info', 'expenses'
  );
  showToast('↩️ Expense rejected!','ok');
  loadAllExpenses();
}

async function markExpensePaid(id, empEmail, empName) {
  await sb.from('expense_claims').update({
    is_paid: true,
    paid_by: currentUser.name,
    paid_at: new Date().toISOString()
  }).eq('id', id);
  await createNotification(empEmail,
    '💰 Expense Payment Done',
    `Your approved expense has been paid by ${currentUser.name}.`,
    'info', 'expenses'
  );
  showToast('💰 Marked as paid!','ok');
  loadAllExpenses();
}
async function deleteExpense(id) {
  if (!confirm('Delete this expense claim?')) return;
  await sb.from('expense_claims').update({is_archived: true}).eq('id', id);
  showToast('✅ Expense archived!','ok');
  loadAllExpenses();
}
// ═══════════════════════════════════════════
//  MOBILE SIDEBAR TOGGLE
// ═══════════════════════════════════════════
function toggleMobileSidebar() {
  const sidebar = document.querySelector('.sidebar');
  sidebar.classList.toggle('open');
}

// Close sidebar when nav item clicked on mobile
document.addEventListener('DOMContentLoaded', function() {
  if (window.innerWidth <= 600) {
    document.getElementById('hamburgerBtn').style.display = 'inline-block';
  }
});

window.addEventListener('resize', function() {
  const btn = document.getElementById('hamburgerBtn');
  if (btn) btn.style.display = window.innerWidth <= 600 ? 'inline-block' : 'none';
  if (window.innerWidth > 600) {
    document.querySelector('.sidebar').classList.remove('open');
  }
});

// Close sidebar on nav click (mobile)
document.querySelectorAll('.nav-btn').forEach(btn => {
  btn.addEventListener('click', function() {
    if (window.innerWidth <= 600) {
      document.querySelector('.sidebar').classList.remove('open');
    }
  });
});
async function updateWorkType(attId, workType) {
  if (!workType) return;
  const { error } = await sb.from('attendance').update({ work_type: workType }).eq('id', attId);
  if (error) { showToast('❌ ' + error.message, 'err'); return; }
  showToast('✅ Work type updated!', 'ok');
  loadCeoDashboard();
}
// ═══════════════════════════════════════════
//  COMPLIANCE - MISSING FUNCTIONS
// ═══════════════════════════════════════════
async function resetCompliance(id) {
  if (!confirm('Reset this task back to Pending?')) return;
  const { error } = await sb.from('compliance_tasks').update({
    status: 'Pending',
    done_by_name: null,
    done_at: null,
    remarks: null
  }).eq('id', id);
  if (error) { showToast('❌ ' + error.message, 'err'); return; }
  showToast('✅ Task reset to Pending!', 'ok');
  loadCompliance();
}

async function addComplianceTask() {
  const particulars = document.getElementById('comp-particulars').value.trim();
  const frequency = document.getElementById('comp-frequency').value;
  const lastDate = document.getElementById('comp-last-date').value;
  const assignedTo = document.getElementById('comp-assigned-to').value.trim();
  const category = document.getElementById('comp-category').value;
  const monthYear = document.getElementById('comp-month-filter').value;
  const msgEl = document.getElementById('compAddMsg');
  if (!particulars || !assignedTo) { msgEl.textContent='⚠️ Fill required fields'; msgEl.style.color='var(--red)'; return; }
  const { error } = await sb.from('compliance_tasks').insert({
    particulars, frequency, last_date: lastDate||null,
    assigned_to_name: assignedTo, category,
    month_year: monthYear, status: 'Pending'
  });
  if (error) { msgEl.textContent='❌ '+error.message; msgEl.style.color='var(--red)'; return; }
  msgEl.textContent='✅ Task added!'; msgEl.style.color='var(--green)';
  showToast('✅ Compliance task added!','ok');
  document.getElementById('comp-particulars').value='';
  document.getElementById('comp-last-date').value='';
  document.getElementById('comp-assigned-to').value='';
  loadCompliance();
  setTimeout(()=>msgEl.textContent='',3000);
}
// ═══════════════════════════════════════════
//  PWA SERVICE WORKER
// ═══════════════════════════════════════════
if ('serviceWorker' in navigator) {
  window.addEventListener('load', function() {
    navigator.serviceWorker.register('/sw.js')
      .then(function(reg) {
        console.log('✅ Service Worker registered!', reg.scope);
      })
      .catch(function(err) {
        console.log('❌ Service Worker failed:', err);
      });
  });
}
// ═══════════════════════════════════════════
// CLIENT CRM CONNECTION
// ═══════════════════════════════════════════
const CLIENT_SUPABASE_URL = 'https://cyfqyhrwxtxwbcolbuny.supabase.co';
const CLIENT_SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN5ZnF5aHJ3eHR4d2Jjb2xidW55Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA2MzM4NjQsImV4cCI6MjA5NjIwOTg2NH0.vHZwo2QxrnTOIU4gurM7kU9ALeDQfaNatielfUh56aI';
const sbClient = supabase.createClient(CLIENT_SUPABASE_URL, CLIENT_SUPABASE_KEY);

async function loadClientsList() {
  const el = document.getElementById('view-clientsList');
  el.innerHTML = `
    <div class="page-header">
      <h2>👥 Clients</h2>
      <p>All client details</p>
    </div>
    <div style="display:flex;gap:10px;margin-bottom:16px;flex-wrap:wrap">
      <input type="text" id="empClientSearch" placeholder="🔍 Search clients..." 
        style="padding:8px 14px;border:1.5px solid var(--border);border-radius:8px;font-size:13px;outline:none;width:250px" 
        oninput="filterEmpClients()">
      <select id="empClientStatus" style="padding:8px 14px;border:1.5px solid var(--border);border-radius:8px;font-size:13px;outline:none" onchange="filterEmpClients()">
        <option value="">All Status</option>
        <option>Lead</option><option>Active</option><option>Completed</option><option>Inactive</option>
      </select>
      <button class="btn btn-gold" onclick="openAddClientEmp()">➕ Add Client</button>
    </div>
    <div id="empClientGrid" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:14px"></div>
  `;
  const { data } = await sbClient.from('clients').select('*').order('created_at', { ascending: false });
  window._empClients = data || [];
  filterEmpClients();
}

function filterEmpClients() {
  const search = document.getElementById('empClientSearch')?.value.toLowerCase() || '';
  const status = document.getElementById('empClientStatus')?.value || '';
  const filtered = (window._empClients || []).filter(c => {
    const matchSearch = !search || c.name?.toLowerCase().includes(search) || c.phone?.includes(search);
    const matchStatus = !status || c.status === status;
    return matchSearch && matchStatus;
  });
  const grid = document.getElementById('empClientGrid');
  if (!grid) return;
  if (!filtered.length) {
    grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;color:var(--muted);padding:30px">No clients found</div>';
    return;
  }
  const statusColors = { Lead: 'b-amber', Active: 'b-green', Completed: 'b-blue', Inactive: 'b-gray' };
  grid.innerHTML = filtered.map(c => `
    <div style="background:#fff;border:1px solid var(--border);border-radius:12px;padding:16px;cursor:pointer" onclick="openEmpClientDetail('${c.id}')">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px">
        <div class="av" style="background:var(--navy)">${c.name.charAt(0)}</div>
        <div style="flex:1">
          <div style="font-weight:700;color:var(--navy);font-size:13px">${esc(c.name)}</div>
          <div style="font-size:11px;color:var(--muted)">${esc(c.city||'')}${c.city&&c.state?', ':''}${esc(c.state||'')}</div>
        </div>
        <span class="badge ${statusColors[c.status]||'b-gray'}">${c.status}</span>
      </div>
      <div style="font-size:12px;color:var(--muted);display:flex;flex-direction:column;gap:4px">
        ${c.phone ? `<div style="display:flex;align-items:center;gap:8px">📞 ${esc(c.phone)} 
          <a href="https://wa.me/91${c.phone.replace(/\D/g,'')}" target="_blank" 
            style="background:#25D366;color:#fff;padding:2px 8px;border-radius:4px;font-size:10px;text-decoration:none;font-weight:600">WhatsApp</a>
        </div>` : ''}
        ${c.property_type ? `<div>🏠 ${esc(c.property_type)}</div>` : ''}
        ${c.source ? `<div>📌 ${esc(c.source)}</div>` : ''}
      </div>
    </div>
  `).join('');
}

async function openEmpClientDetail(clientId) {
  const { data: c } = await sbClient.from('clients').select('*').eq('id', clientId).single();
  const { data: projects } = await sbClient.from('projects').select('*').eq('client_id', clientId);
  const { data: payments } = await sbClient.from('payments').select('*').eq('client_id', clientId).order('date', { ascending: false });
  const { data: followups } = await sbClient.from('followups').select('*').eq('client_id', clientId).order('created_at', { ascending: false });
  const { data: visits } = await sbClient.from('site_visits').select('*').eq('client_id', clientId).order('visit_date', { ascending: false });
  if (!c) return;

  const totalPaid = (payments||[]).reduce((s,p) => s+(p.amount||0), 0);
  const totalProject = (projects||[]).reduce((s,p) => s+(p.total_amount||0), 0);
  const pending = totalProject - totalPaid;

  const el = document.getElementById('view-clientsList');
  el.innerHTML = `
    <button class="btn btn-outline btn-sm" onclick="loadClientsList()" style="margin-bottom:16px">← Back to Clients</button>
    <div style="background:linear-gradient(135deg,var(--navy),#1a3a5c);border-radius:14px;padding:20px;margin-bottom:20px;color:#fff">
      <div style="display:flex;align-items:center;gap:14px;flex-wrap:wrap">
        <div class="av" style="background:var(--gold);width:50px;height:50px;font-size:18px;color:var(--navy)">${c.name.charAt(0)}</div>
        <div style="flex:1">
          <div style="font-size:20px;font-weight:800">${esc(c.name)}</div>
          <div style="font-size:13px;color:rgba(255,255,255,0.6);margin-top:4px">
            ${c.phone?`📞 ${esc(c.phone)}`:''}
            ${c.email?` · ✉️ ${esc(c.email)}`:''}
            ${c.city?` · 📍 ${esc(c.city)}, ${esc(c.state)}`:''}
          </div>
          <div style="margin-top:8px;display:flex;gap:6px;flex-wrap:wrap">
            <span class="badge b-green">${c.status}</span>
            ${c.property_type?`<span class="badge b-gold">${esc(c.property_type)}</span>`:''}
          </div>
        </div>
        <div style="display:flex;gap:8px">
          ${c.phone?`<a href="https://wa.me/91${c.phone.replace(/\D/g,'')}" target="_blank" style="background:#25D366;color:#fff;padding:8px 14px;border-radius:8px;text-decoration:none;font-size:12px;font-weight:700">💬 WhatsApp</a>`:''}
          <button class="btn btn-outline btn-sm" style="color:#fff;border-color:rgba(255,255,255,0.3)" onclick="openEditClientEmp('${c.id}')">✏️ Edit</button>
        </div>
      </div>
    </div>

    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin-bottom:20px">
      <div class="stat-card sc-blue"><div class="stat-icon">📋</div><div class="stat-num">${(projects||[]).length}</div><div class="stat-lbl">Projects</div></div>
      <div class="stat-card sc-green"><div class="stat-icon">💰</div><div class="stat-num">₹${(totalPaid/1000).toFixed(0)}K</div><div class="stat-lbl">Paid</div></div>
      <div class="stat-card sc-red"><div class="stat-icon">⏳</div><div class="stat-num">₹${(pending/1000).toFixed(0)}K</div><div class="stat-lbl">Pending</div></div>
    </div>

    ${(projects||[]).length ? `
    <div class="panel" style="margin-bottom:16px">
      <div class="panel-head"><div class="panel-title">📋 Projects</div><button class="btn btn-gold btn-sm" onclick="openAddProjectEmp('${c.id}')">➕ Add</button></div>
      <div class="panel-body">
        ${projects.map(p => {
          const pct = p.total_amount > 0 ? Math.round((p.paid_amount||0)/p.total_amount*100) : 0;
          return `<div style="padding:10px 0;border-bottom:1px solid #f5f6fa">
            <div style="display:flex;justify-content:space-between;align-items:center">
              <div style="font-weight:600;color:var(--navy)">${esc(p.title)}</div>
              <span class="badge ${p.status==='Completed'?'b-green':p.status==='In Progress'?'b-blue':'b-amber'}">${p.status}</span>
            </div>
            <div style="font-size:12px;color:var(--muted);margin-top:4px">Total: ₹${(p.total_amount||0).toLocaleString()} · Paid: ₹${(p.paid_amount||0).toLocaleString()}</div>
            <div class="progress-bar" style="margin-top:6px"><div class="progress-fill" style="width:${pct}%;background:var(--green)"></div></div>
          </div>`;
        }).join('')}
      </div>
    </div>` : `<div class="panel" style="margin-bottom:16px">
      <div class="panel-head"><div class="panel-title">📋 Projects</div><button class="btn btn-gold btn-sm" onclick="openAddProjectEmp('${c.id}')">➕ Add</button></div>
      <div class="panel-body"><div style="text-align:center;color:var(--muted);padding:20px">No projects yet</div></div>
    </div>`}

    ${(visits||[]).length ? `
    <div class="panel" style="margin-bottom:16px">
      <div class="panel-head"><div class="panel-title">🏗️ Site Visits</div><button class="btn btn-gold btn-sm" onclick="openAddVisitEmp('${c.id}')">➕ Add</button></div>
      <div class="panel-body">
        ${visits.map(v => `
          <div style="padding:10px 0;border-bottom:1px solid #f5f6fa">
            <div style="font-weight:600;color:var(--navy)">📅 ${fmtDate(v.visit_date)} · ${esc(v.visited_by||'—')}</div>
            ${v.location?`<div style="font-size:12px;color:var(--muted)">📍 ${esc(v.location)}</div>`:''}
            ${v.discussion?`<div style="font-size:12px;color:var(--muted);margin-top:3px">💬 ${esc(v.discussion.substring(0,80))}...</div>`:''}
          </div>
        `).join('')}
      </div>
    </div>` : `<div class="panel" style="margin-bottom:16px">
      <div class="panel-head"><div class="panel-title">🏗️ Site Visits</div><button class="btn btn-gold btn-sm" onclick="openAddVisitEmp('${c.id}')">➕ Add</button></div>
      <div class="panel-body"><div style="text-align:center;color:var(--muted);padding:20px">No site visits yet</div></div>
    </div>`}

    ${(followups||[]).length ? `
    <div class="panel" style="margin-bottom:16px">
      <div class="panel-head"><div class="panel-title">📞 Follow Ups</div></div>
      <div class="panel-body">
        ${followups.slice(0,5).map(f => `
          <div style="padding:8px 0;border-bottom:1px solid #f5f6fa">
            <div style="font-weight:600;color:var(--navy)">${esc(f.type||'Follow Up')}</div>
            <div style="font-size:12px;color:var(--muted)">${esc(f.notes||'')} · ${fmtDate(f.next_followup)}</div>
          </div>
        `).join('')}
      </div>
    </div>` : ''}

    ${(currentUser.role === 'ceo' || currentUser.email === 'alisha@sayashvastu.com') ? `
    <div class="panel">
      <div class="panel-head"><div class="panel-title">💰 Payments</div></div>
      <div class="panel-body">
        <div style="margin-bottom:12px;font-size:16px;font-weight:700;color:var(--green)">Total Received: ₹${totalPaid.toLocaleString()}</div>
        ${(payments||[]).length ? payments.map(p => `
          <div style="padding:8px 0;border-bottom:1px solid #f5f6fa;display:flex;justify-content:space-between">
            <div>
              <div style="font-weight:700;color:var(--green)">₹${(p.amount||0).toLocaleString()}</div>
              <div style="font-size:11px;color:var(--muted)">${fmtDate(p.date)} · ${esc(p.mode||'')}</div>
            </div>
            <span class="badge b-green">Received</span>
          </div>
        `).join('') : '<div style="text-align:center;color:var(--muted);padding:16px">No payments yet</div>'}
        <div style="margin-top:12px">
          <a href="https://sayash-client-crm.vercel.app" target="_blank" class="btn btn-gold" style="display:block;text-align:center">💰 Full Payment Management → Client CRM</a>
        </div>
      </div>
    </div>` : ''}
  `;
}

function openAddClientEmp() {
  document.body.insertAdjacentHTML('beforeend', `
    <div class="modal-overlay open" id="addClientEmpModal">
      <div class="modal">
        <div class="modal-title">➕ Add New Client</div>
        <div class="form-grid cols-2">
          <div class="field"><label>Full Name *</label><input id="ace-name" placeholder="Client name"></div>
          <div class="field"><label>Phone</label><input id="ace-phone" placeholder="Phone number"></div>
          <div class="field"><label>Email</label><input id="ace-email" placeholder="Email address"></div>
          <div class="field"><label>Birthday</label><input type="date" id="ace-birthday"></div>
          <div class="field"><label>State</label><input id="ace-state" placeholder="State"></div>
          <div class="field"><label>City</label><input id="ace-city" placeholder="City"></div>
          <div class="field"><label>Property Type</label>
            <select id="ace-property">
              <option value="">Select</option>
              <option>Residential</option><option>Commercial</option><option>Plot</option><option>Office</option><option>Villa</option><option>Other</option>
            </select>
          </div>
          <div class="field"><label>Source</label>
            <select id="ace-source">
              <option value="">Select</option>
              <option>Google</option><option>Referral</option><option>Walk-in</option><option>Social Media</option><option>Phone</option><option>Other</option>
            </select>
          </div>
          <div class="field"><label>Status</label>
            <select id="ace-status"><option>Lead</option><option>Active</option><option>Completed</option><option>Inactive</option></select>
          </div>
        </div>
        <div class="field" style="margin-top:14px"><label>Notes</label><textarea id="ace-notes" placeholder="Any notes..."></textarea></div>
        <div class="modal-actions">
          <button class="btn btn-outline" onclick="closeModal('addClientEmpModal')">Cancel</button>
          <button class="btn btn-gold" onclick="saveClientEmp()">💾 Save Client</button>
        </div>
      </div>
    </div>
  `);
}

async function saveClientEmp() {
  const name = document.getElementById('ace-name').value.trim();
  if (!name) { showToast('⚠️ Name required', 'warn'); return; }
  const { error } = await sbClient.from('clients').insert({
    name,
    phone: document.getElementById('ace-phone').value.trim(),
    email: document.getElementById('ace-email').value.trim(),
    birthday: document.getElementById('ace-birthday').value || null,
    state: document.getElementById('ace-state').value.trim(),
    city: document.getElementById('ace-city').value.trim(),
    property_type: document.getElementById('ace-property').value,
    source: document.getElementById('ace-source').value,
    status: document.getElementById('ace-status').value,
    notes: document.getElementById('ace-notes').value.trim(),
  });
  if (error) { showToast('❌ ' + error.message, 'err'); return; }
  showToast('✅ Client added!', 'ok');
  closeModal('addClientEmpModal');
  loadClientsList();
}

async function openEditClientEmp(clientId) {
  const { data: c } = await sbClient.from('clients').select('*').eq('id', clientId).single();
  if (!c) return;
  document.body.insertAdjacentHTML('beforeend', `
    <div class="modal-overlay open" id="editClientEmpModal">
      <div class="modal">
        <div class="modal-title">✏️ Edit Client</div>
        <div class="form-grid cols-2">
          <div class="field"><label>Full Name *</label><input id="ece-name" value="${esc(c.name||'')}"></div>
          <div class="field"><label>Phone</label><input id="ece-phone" value="${esc(c.phone||'')}"></div>
          <div class="field"><label>Email</label><input id="ece-email" value="${esc(c.email||'')}"></div>
          <div class="field"><label>State</label><input id="ece-state" value="${esc(c.state||'')}"></div>
          <div class="field"><label>City</label><input id="ece-city" value="${esc(c.city||'')}"></div>
          <div class="field"><label>Property Type</label>
            <select id="ece-property">
              <option ${c.property_type==='Residential'?'selected':''}>Residential</option>
              <option ${c.property_type==='Commercial'?'selected':''}>Commercial</option>
              <option ${c.property_type==='Plot'?'selected':''}>Plot</option>
              <option ${c.property_type==='Office'?'selected':''}>Office</option>
              <option ${c.property_type==='Villa'?'selected':''}>Villa</option>
              <option ${c.property_type==='Other'?'selected':''}>Other</option>
            </select>
          </div>
          <div class="field"><label>Status</label>
            <select id="ece-status">
              <option ${c.status==='Lead'?'selected':''}>Lead</option>
              <option ${c.status==='Active'?'selected':''}>Active</option>
              <option ${c.status==='Completed'?'selected':''}>Completed</option>
              <option ${c.status==='Inactive'?'selected':''}>Inactive</option>
            </select>
          </div>
        </div>
        <div class="field" style="margin-top:14px"><label>Notes</label><textarea id="ece-notes">${esc(c.notes||'')}</textarea></div>
        <div class="modal-actions">
          <button class="btn btn-outline" onclick="closeModal('editClientEmpModal')">Cancel</button>
          <button class="btn btn-gold" onclick="updateClientEmp('${c.id}')">💾 Update</button>
        </div>
      </div>
    </div>
  `);
}

async function updateClientEmp(clientId) {
  const { error } = await sbClient.from('clients').update({
    name: document.getElementById('ece-name').value.trim(),
    phone: document.getElementById('ece-phone').value.trim(),
    email: document.getElementById('ece-email').value.trim(),
    state: document.getElementById('ece-state').value.trim(),
    city: document.getElementById('ece-city').value.trim(),
    property_type: document.getElementById('ece-property').value,
    status: document.getElementById('ece-status').value,
    notes: document.getElementById('ece-notes').value.trim(),
  }).eq('id', clientId);
  if (error) { showToast('❌ ' + error.message, 'err'); return; }
  showToast('✅ Client updated!', 'ok');
  closeModal('editClientEmpModal');
  openEmpClientDetail(clientId);
}

function openAddProjectEmp(clientId) {
  document.body.insertAdjacentHTML('beforeend', `
    <div class="modal-overlay open" id="addProjEmpModal">
      <div class="modal">
        <div class="modal-title">📋 Add Project</div>
        <div class="form-grid cols-2">
          <div class="field" style="grid-column:1/-1"><label>Project Title *</label><input id="ape-title" placeholder="Project title"></div>
          <div class="field"><label>Status</label>
            <select id="ape-status"><option>In Progress</option><option>Completed</option><option>On Hold</option></select>
          </div>
          <div class="field"><label>Start Date</label><input type="date" id="ape-start"></div>
          <div class="field"><label>Total Amount (₹)</label><input type="number" id="ape-total" placeholder="0"></div>
          <div class="field"><label>Paid Amount (₹)</label><input type="number" id="ape-paid" placeholder="0"></div>
        </div>
        <div class="field" style="margin-top:14px"><label>Notes</label><textarea id="ape-notes" placeholder="Project notes..."></textarea></div>
        <div class="modal-actions">
          <button class="btn btn-outline" onclick="closeModal('addProjEmpModal')">Cancel</button>
          <button class="btn btn-gold" onclick="saveProjEmp('${clientId}')">💾 Save</button>
        </div>
      </div>
    </div>
  `);
}

async function saveProjEmp(clientId) {
  const title = document.getElementById('ape-title').value.trim();
  if (!title) { showToast('⚠️ Title required', 'warn'); return; }
  const { error } = await sbClient.from('projects').insert({
    client_id: clientId, title,
    status: document.getElementById('ape-status').value,
    start_date: document.getElementById('ape-start').value || null,
    total_amount: parseFloat(document.getElementById('ape-total').value) || 0,
    paid_amount: parseFloat(document.getElementById('ape-paid').value) || 0,
    notes: document.getElementById('ape-notes').value.trim(),
  });
  if (error) { showToast('❌ ' + error.message, 'err'); return; }
  showToast('✅ Project added!', 'ok');
  closeModal('addProjEmpModal');
  openEmpClientDetail(clientId);
}

function openAddVisitEmp(clientId) {
  document.body.insertAdjacentHTML('beforeend', `
    <div class="modal-overlay open" id="addVisitEmpModal">
      <div class="modal">
        <div class="modal-title">🏗️ Add Site Visit</div>
        <div class="form-grid cols-2">
          <div class="field"><label>Visit Date</label><input type="date" id="ave-date" value="${new Date().toISOString().split('T')[0]}"></div>
          <div class="field"><label>Visited By</label><input id="ave-by" value="${currentUser.name}"></div>
          <div class="field" style="grid-column:1/-1"><label>Location</label><input id="ave-location" placeholder="Site address"></div>
          <div class="field" style="grid-column:1/-1"><label>Discussion</label><textarea id="ave-discussion" placeholder="What was discussed..."></textarea></div>
          <div class="field" style="grid-column:1/-1"><label>Vastu Suggestions</label><textarea id="ave-suggestions" placeholder="Suggestions given..."></textarea></div>
          <div class="field" style="grid-column:1/-1"><label>Next Steps</label><textarea id="ave-nextsteps" placeholder="What needs to be done next..."></textarea></div>
        </div>
        <div class="modal-actions">
          <button class="btn btn-outline" onclick="closeModal('addVisitEmpModal')">Cancel</button>
          <button class="btn btn-gold" onclick="saveVisitEmp('${clientId}')">💾 Save Visit</button>
        </div>
      </div>
    </div>
  `);
}

async function saveVisitEmp(clientId) {
  const { error } = await sbClient.from('site_visits').insert({
    client_id: clientId,
    visit_date: document.getElementById('ave-date').value || null,
    visited_by: document.getElementById('ave-by').value.trim(),
    location: document.getElementById('ave-location').value.trim(),
    discussion: document.getElementById('ave-discussion').value.trim(),
    suggestions: document.getElementById('ave-suggestions').value.trim(),
    next_steps: document.getElementById('ave-nextsteps').value.trim(),
  });
  if (error) { showToast('❌ ' + error.message, 'err'); return; }
  showToast('✅ Site visit saved!', 'ok');
  closeModal('addVisitEmpModal');
  openEmpClientDetail(clientId);
}
async function loadClientProjectsAll() {
  const el = document.getElementById('view-clientProjects');
  el.innerHTML = `
    <div class="page-header"><h2>📋 All Projects</h2><p>Select a client to view projects</p></div>
    <div id="clientProjectsList"></div>
  `;

  // Load all clients
  const { data: clients } = await sbClient.from('clients').select('*').order('name');
  
  if (!clients?.length) {
    document.getElementById('clientProjectsList').innerHTML = '<div class="empty-state"><div class="empty-icon">📋</div><div class="empty-title">No clients found</div></div>';
    return;
  }

  const statusColors = { Lead: 'b-amber', Active: 'b-green', Completed: 'b-blue', Inactive: 'b-gray' };

  document.getElementById('clientProjectsList').innerHTML = `
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:14px">
      ${clients.map(c => `
        <div onclick="openClientProjects('${c.id}','${esc(c.name)}')" 
          style="background:#fff;border:1px solid var(--border);border-radius:12px;padding:18px;cursor:pointer;transition:all 0.15s;border-left:4px solid var(--gold)"
          onmouseover="this.style.transform='translateY(-2px)';this.style.boxShadow='0 8px 24px rgba(0,0,0,0.08)'"
          onmouseout="this.style.transform='';this.style.boxShadow=''">
          <div style="display:flex;align-items:center;gap:12px">
            <div class="av" style="background:var(--navy);width:40px;height:40px;font-size:14px">${esc(c.name).charAt(0).toUpperCase()}</div>
            <div style="flex:1">
              <div style="font-size:14px;font-weight:700;color:var(--navy)">${esc(c.name)}</div>
              <div style="font-size:11px;color:var(--muted);margin-top:3px">${esc(c.city||'')}${c.city&&c.state?', ':''}${esc(c.state||'')}</div>
            </div>
            <span class="badge ${statusColors[c.status]||'b-gray'}" style="font-size:10px">${c.status||'—'}</span>
          </div>
          <div style="margin-top:12px;font-size:11px;color:var(--muted);display:flex;align-items:center;gap:6px">
            <span>📋 Click to view projects →</span>
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

async function openClientProjects(clientId, clientName) {
  const el = document.getElementById('view-clientProjects');
  el.innerHTML = `
    <button class="btn btn-outline btn-sm" onclick="loadClientProjectsAll()" style="margin-bottom:16px">← Back to Clients</button>
    <div class="page-header">
      <h2>📋 ${esc(clientName)}</h2>
      <p>All projects for this client</p>
    </div>
    <div style="display:flex;justify-content:flex-end;margin-bottom:16px">
      <button class="btn btn-gold" onclick="openAddProjectEmp('${clientId}')">➕ Add Project</button>
    </div>
    <div id="clientSubProjectsList">
      <div style="text-align:center;color:var(--muted);padding:30px">Loading...</div>
    </div>
  `;

  const { data: projects } = await sbClient.from('projects').select('*').eq('client_id', clientId).order('created_at', { ascending: false });

  if (!projects?.length) {
    document.getElementById('clientSubProjectsList').innerHTML = '<div class="empty-state"><div class="empty-icon">📋</div><div class="empty-title">No projects yet</div><p>Add a project to get started</p></div>';
    return;
  }

  const statusColors = { 'In Progress': 'b-blue', 'Completed': 'b-green', 'On Hold': 'b-amber', 'Not Started': 'b-gray' };

  document.getElementById('clientSubProjectsList').innerHTML = projects.map(p => {
    const pct = p.total_amount > 0 ? Math.round((p.paid_amount||0)/p.total_amount*100) : 0;
    const pending = (p.total_amount||0) - (p.paid_amount||0);
    return `
      <div class="panel" style="margin-bottom:14px;border-left:4px solid var(--blue);cursor:pointer"
        onclick="openSubProjectDetail('${p.id}','${esc(p.title)}','${clientId}','${esc(clientName)}')">
        <div class="panel-head">
          <div>
            <div style="font-size:15px;font-weight:700;color:var(--navy)">${esc(p.title)}</div>
            ${p.description?`<div style="font-size:12px;color:var(--muted);margin-top:3px">${esc(p.description)}</div>`:''}
          </div>
          <span class="badge ${statusColors[p.status]||'b-gray'}">${p.status||'—'}</span>
        </div>
        <div class="panel-body">
          <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:10px">
            <div style="text-align:center;padding:10px;background:var(--bg);border-radius:8px">
              <div style="font-size:16px;font-weight:800;color:var(--navy)">₹${((p.total_amount||0)/1000).toFixed(0)}K</div>
              <div style="font-size:10px;color:var(--muted);margin-top:3px">Total</div>
            </div>
            <div style="text-align:center;padding:10px;background:var(--green-bg);border-radius:8px">
              <div style="font-size:16px;font-weight:800;color:var(--green)">₹${((p.paid_amount||0)/1000).toFixed(0)}K</div>
              <div style="font-size:10px;color:var(--muted);margin-top:3px">Paid</div>
            </div>
            <div style="text-align:center;padding:10px;background:var(--red-bg);border-radius:8px">
              <div style="font-size:16px;font-weight:800;color:var(--red)">₹${(pending/1000).toFixed(0)}K</div>
              <div style="font-size:10px;color:var(--muted);margin-top:3px">Pending</div>
            </div>
          </div>
          <div class="progress-bar"><div class="progress-fill" style="width:${pct}%;background:var(--green)"></div></div>
          <div style="font-size:11px;color:var(--muted);margin-top:4px">${pct}% complete · Click to view details →</div>
        </div>
      </div>
    `;
  }).join('');
}

async function openSubProjectDetail(projectId, projectName, clientId, clientName) {
  const el = document.getElementById('view-clientProjects');
  el.innerHTML = `
    <button class="btn btn-outline btn-sm" onclick="openClientProjects('${clientId}','${esc(clientName)}')" style="margin-bottom:16px">← Back to ${esc(clientName)}</button>
    <div class="page-header">
      <h2>📋 ${esc(projectName)}</h2>
      <p>${esc(clientName)}</p>
    </div>
    <div id="subProjectDetailContent">
      <div style="text-align:center;color:var(--muted);padding:30px">Loading...</div>
    </div>
  `;

  const [{ data: project }, { data: visits }, { data: payments }, { data: followups }] = await Promise.all([
    sbClient.from('projects').select('*').eq('id', projectId).single(),
    sbClient.from('site_visits').select('*').eq('client_id', clientId).order('visit_date', { ascending: false }),
    sbClient.from('payments').select('*').eq('client_id', clientId).order('date', { ascending: false }),
    sbClient.from('followups').select('*').eq('client_id', clientId).order('created_at', { ascending: false })
  ]);

  const totalPaid = (payments||[]).reduce((s,p) => s+(p.amount||0), 0);
  const totalAmt = project?.total_amount || 0;
  const pct = totalAmt > 0 ? Math.round((totalPaid/totalAmt)*100) : 0;

  document.getElementById('subProjectDetailContent').innerHTML = `
    <!-- Stats -->
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:20px">
      <div class="stat-card sc-blue"><div class="stat-icon">🏗️</div><div class="stat-num">${(visits||[]).length}</div><div class="stat-lbl">Site Visits</div></div>
      <div class="stat-card sc-green"><div class="stat-icon">💰</div><div class="stat-num">₹${(totalPaid/1000).toFixed(0)}K</div><div class="stat-lbl">Paid</div></div>
      <div class="stat-card sc-red"><div class="stat-icon">⏳</div><div class="stat-num">₹${((totalAmt-totalPaid)/1000).toFixed(0)}K</div><div class="stat-lbl">Pending</div></div>
      <div class="stat-card sc-gold"><div class="stat-icon">📊</div><div class="stat-num">${pct}%</div><div class="stat-lbl">Complete</div></div>
    </div>

    <!-- Site Visits -->
    <div class="panel" style="margin-bottom:16px">
      <div class="panel-head">
        <div class="panel-title">🏗️ Site Visits</div>
        <button class="btn btn-gold btn-sm" onclick="openAddVisitEmp('${clientId}')">➕ Add Visit</button>
      </div>
      <div class="panel-body">
        ${(visits||[]).length ? visits.map(v => `
          <div style="padding:10px 0;border-bottom:1px solid #f5f6fa">
            <div style="display:flex;justify-content:space-between;align-items:center">
              <div style="font-weight:600;color:var(--navy)">📅 ${fmtDate(v.visit_date)}</div>
              <span class="badge b-blue">${esc(v.visited_by||'—')}</span>
            </div>
            ${v.location?`<div style="font-size:12px;color:var(--muted);margin-top:3px">📍 ${esc(v.location)}</div>`:''}
            ${v.discussion?`<div style="font-size:12px;color:var(--muted);margin-top:3px">💬 ${esc(v.discussion.substring(0,80))}...</div>`:''}
            ${v.suggestions?`<div style="font-size:12px;color:var(--muted);margin-top:3px">✨ ${esc(v.suggestions.substring(0,80))}...</div>`:''}
          </div>
        `).join('') : '<div style="text-align:center;color:var(--muted);padding:20px">No site visits yet</div>'}
      </div>
    </div>

    <!-- Payments -->
    ${(currentUser.role === 'ceo' || currentUser.email === 'alisha@sayashvastu.com') ? `
    <div class="panel" style="margin-bottom:16px">
      <div class="panel-head">
        <div class="panel-title">💰 Payments</div>
        <a href="https://sayash-client-crm.vercel.app" target="_blank" class="btn btn-gold btn-sm">Full View →</a>
      </div>
      <div class="panel-body">
        ${(payments||[]).length ? `
          <div class="progress-bar" style="margin-bottom:12px"><div class="progress-fill" style="width:${pct}%;background:var(--green)"></div></div>
          ${payments.map(p => `
            <div style="padding:8px 0;border-bottom:1px solid #f5f6fa;display:flex;justify-content:space-between">
              <div>
                <div style="font-weight:700;color:var(--green)">₹${(p.amount||0).toLocaleString()}</div>
                <div style="font-size:11px;color:var(--muted)">${fmtDate(p.date)} · ${esc(p.mode||'')}</div>
              </div>
              <span class="badge b-green">Received</span>
            </div>
          `).join('')}
        ` : '<div style="text-align:center;color:var(--muted);padding:16px">No payments yet</div>'}
      </div>
    </div>` : ''}

    <!-- Follow Ups -->
    <div class="panel">
      <div class="panel-head"><div class="panel-title">📞 Follow Ups</div></div>
      <div class="panel-body">
        ${(followups||[]).length ? followups.slice(0,5).map(f => `
          <div style="padding:8px 0;border-bottom:1px solid #f5f6fa">
            <div style="font-weight:600;color:var(--navy)">${esc(f.type||'Follow Up')}</div>
            <div style="font-size:12px;color:var(--muted)">${esc(f.notes||'')} · ${fmtDate(f.next_followup)}</div>
          </div>
        `).join('') : '<div style="text-align:center;color:var(--muted);padding:16px">No follow ups yet</div>'}
      </div>
    </div>
  `;
}
// ═══════════════════════════════════════════
// AUTO REFRESH SYSTEM
// ═══════════════════════════════════════════
let autoRefreshInterval = null;

function startAutoRefresh() {
  if (autoRefreshInterval) clearInterval(autoRefreshInterval);
  autoRefreshInterval = setInterval(async () => {
    if (!currentUser || !localStorage.getItem('sv_user')) {
      clearInterval(autoRefreshInterval);
      return;
    }
    if (!currentUser) currentUser = JSON.parse(localStorage.getItem('sv_user'));
    const activeView = document.querySelector('.view.active');
    if (!activeView) return;
    const viewId = activeView.id.replace('view-', '');
    try {
      if (viewId === 'home') {
        if (currentUser.role === 'ceo') await loadCeoDashboard();
        else await loadEmpDashboard();
      }
      if (viewId === 'tasks') await loadMyTasks();
      if (viewId === 'allTasks') await loadAllTasks();
      if (viewId === 'attendance') await loadAttendance();
      if (viewId === 'leaves') await loadLeaves();
      if (viewId === 'notices') await loadNotices();
      if (viewId === 'leaveApprove') await loadLeaveApprovals();
      if (viewId === 'clientsList') await loadClientsList();
      if (viewId === 'clientProjects') await loadClientProjectsAll();
      if (viewId === 'clientVisits') await loadClientVisitsAll();
    } catch(e) {
      console.log('Auto refresh error:', e);
    }
  }, 30000);
}

// Tab visibility change — jab user wapas aaye
document.addEventListener('visibilitychange', async function() {
if (document.visibilityState === 'visible') {
    if (!currentUser) currentUser = JSON.parse(localStorage.getItem('sv_user'));
    if (!currentUser) return;
  console.log('Tab active — refreshing data...');
    const activeView = document.querySelector('.view.active');
    if (!activeView) return;
    const viewId = activeView.id.replace('view-', '');
    try {
if (viewId === 'home') {
  if (currentUser.role === 'ceo') await loadCeoDashboard();
  else await loadEmpDashboard();
}
      if (viewId === 'tasks') await loadMyTasks();
      if (viewId === 'allTasks') await loadAllTasks();
      if (viewId === 'clientsList') await loadClientsList();
    } catch(e) {}
  }
});

// Network wapas aane par refresh
window.addEventListener('online', async function() {
 if (currentUser) {
    showToast('🌐 Connection restored!', 'ok');
    const activeView = document.querySelector('.view.active');
    if (!activeView) return;
    const viewId = activeView.id.replace('view-', '');
    if (viewId === 'home') {
      if (currentUser.role === 'ceo') await loadCeoDashboard();
      else await loadEmpDashboard();
    }
  }
});
