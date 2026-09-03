import { chromium } from 'playwright-core';
import fs from 'fs';

const NM = '/home/user/prince-baby-tracker/node_modules/@expo-google-fonts/nunito';
const face = (w, file) =>
  `@font-face{font-family:Nunito;font-weight:${w};font-style:normal;src:url(data:font/ttf;base64,${fs.readFileSync(`${NM}/${file}`).toString('base64')}) format('truetype')}`;
const FONTS = [
  face(400, '400Regular/Nunito_400Regular.ttf'),
  face(600, '600SemiBold/Nunito_600SemiBold.ttf'),
  face(700, '700Bold/Nunito_700Bold.ttf'),
  face(800, '800ExtraBold/Nunito_800ExtraBold.ttf'),
  face(900, '900Black/Nunito_900Black.ttf'),
].join('');

// Real icon paths, lifted verbatim from src/components/icons.tsx
const sv = (vb, inner, size, h) =>
  `<svg width="${size}" height="${h || size}" viewBox="${vb}" fill="none" style="display:block">${inner}</svg>`;
const I = {
  bottle: (c = '#C96F4A', s = 26) => sv('0 0 22 26', `<path d="M8 1h6M9 1v4h4V1M7 7c-2 1.5-3 3.5-3 6v9a3 3 0 003 3h8a3 3 0 003-3v-9c0-2.5-1-4.5-3-6z" stroke="${c}" stroke-width="1.8" stroke-linejoin="round"/><path d="M4 15h14" stroke="${c}" stroke-width="1.8"/>`, s * 22 / 26, s),
  sleep: (c = '#7B6BA8', s = 24) => sv('0 0 22 22', `<path d="M18.5 13.5A8.5 8.5 0 018.5 3.5a8.5 8.5 0 108 10z" stroke="${c}" stroke-width="1.8" stroke-linejoin="round"/>`, s),
  diaper: (c = '#4E86A0', s = 24) => sv('0 0 18 24', `<path d="M9 1C9 1 2 10 2 15a7 7 0 0014 0C16 10 9 1 9 1z" stroke="${c}" stroke-width="1.8" stroke-linejoin="round"/>`, s * 18 / 24, s),
  solids: (c = '#6E8F4C', s = 24) => sv('0 0 24 20', `<path d="M2 8h20c0 6-4.5 10-10 10S2 14 2 8z" stroke="${c}" stroke-width="1.8" stroke-linejoin="round"/><path d="M7 4c1-2 3-2 4 0s3 2 4 0" stroke="${c}" stroke-width="1.8" stroke-linecap="round"/>`, s, s * 20 / 24),
  pump: (c = '#B56A7E', s = 25) => sv('0 0 22 24', `<circle cx="11" cy="14" r="8" stroke="${c}" stroke-width="1.8"/><path d="M11 6V2M7 2h8" stroke="${c}" stroke-width="1.8" stroke-linecap="round"/><path d="M11 11v3l2.5 1.5" stroke="${c}" stroke-width="1.8" stroke-linecap="round"/>`, s * 22 / 24, s),
  medicine: (c = '#A57F2C', s = 25) => sv('0 0 20 24', `<rect x="5" y="1" width="10" height="6" rx="2" stroke="${c}" stroke-width="1.8"/><rect x="2" y="7" width="16" height="16" rx="4" stroke="${c}" stroke-width="1.8"/><path d="M10 12v6M7 15h6" stroke="${c}" stroke-width="1.8" stroke-linecap="round"/>`, s * 20 / 24, s),
  home: (c, f = true) => sv('0 0 20 20', `<path d="M3 9l7-6 7 6v8a1.5 1.5 0 01-1.5 1.5h-11A1.5 1.5 0 013 17z" ${f ? `fill="${c}"` : `stroke="${c}" stroke-width="2" stroke-linejoin="round"`}/>`, 21),
  growth: (c) => sv('0 0 20 20', `<path d="M2 16L7 9l4 4 7-9" stroke="${c}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`, 21),
  health: (c) => sv('0 0 20 20', `<path d="M10 17S3 12.5 3 7.8C3 5.2 5 3.5 7.2 3.5c1.2 0 2.2.6 2.8 1.5.6-.9 1.6-1.5 2.8-1.5C15 3.5 17 5.2 17 7.8 17 12.5 10 17 10 17z" stroke="${c}" stroke-width="1.8" stroke-linejoin="round"/>`, 21),
  baby: (c) => sv('0 0 20 20', `<circle cx="10" cy="7" r="3.5" stroke="${c}" stroke-width="1.8"/><path d="M3.5 17c.8-3 3.4-4.5 6.5-4.5s5.7 1.5 6.5 4.5" stroke="${c}" stroke-width="1.8" stroke-linecap="round"/>`, 21),
  plus: () => sv('0 0 20 20', `<path d="M10 3v14M3 10h14" stroke="#fff" stroke-width="2.5" stroke-linecap="round"/>`, 24),
  bell: (c = '#7C6E5F') => sv('0 0 18 18', `<path d="M9 2a4.5 4.5 0 00-4.5 4.5c0 4-1.5 5-1.5 5h12s-1.5-1-1.5-5A4.5 4.5 0 009 2z" stroke="${c}" stroke-width="1.6" stroke-linejoin="round"/><path d="M7.6 14a1.6 1.6 0 002.8 0" stroke="${c}" stroke-width="1.6" stroke-linecap="round"/>`, 18),
  moon: (c = '#7C6E5F') => sv('0 0 22 22', `<path d="M18.5 13.5A8.5 8.5 0 018.5 3.5a8.5 8.5 0 108 10z" stroke="${c}" stroke-width="1.8" stroke-linejoin="round"/>`, 17),
  chev: (c = '#7C6E5F') => sv('0 0 18 18', `<path d="M11.5 3.5L6 9l5.5 5.5" stroke="${c}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`, 18),
  clock: (c = '#A57F2C') => sv('0 0 18 18', `<circle cx="9" cy="9" r="7.5" stroke="${c}" stroke-width="1.8"/><path d="M9 5v4.5l3 2" stroke="${c}" stroke-width="1.8" stroke-linecap="round"/>`, 17),
  syringe: (c) => sv('0 0 20 20', `<path d="M13 3l4 4M15 5l-8 8-3 1 1-3 8-8zM11 7l2 2" stroke="${c}" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/>`, 19),
  thermo: (c) => sv('0 0 20 20', `<path d="M8 12V4a2 2 0 114 0v8a4 4 0 11-4 0z" stroke="${c}" stroke-width="1.7" stroke-linejoin="round"/><circle cx="10" cy="15" r="1.6" fill="${c}"/>`, 19),
};

const statusBar = `<div class="status"><span>9:41</span><span class="si">
${sv('0 0 18 12', `<path d="M9 10.5a1.2 1.2 0 100-2.4 1.2 1.2 0 000 2.4z" fill="#43382F"/><path d="M5.6 7.2a4.8 4.8 0 016.8 0M2.8 4.4a8.8 8.8 0 0112.4 0" stroke="#43382F" stroke-width="1.5" stroke-linecap="round"/>`, 18, 12)}
${sv('0 0 27 13', `<rect x=".8" y=".8" width="21" height="11.4" rx="3.2" stroke="#43382F" stroke-opacity=".45" stroke-width="1.1"/><rect x="2.4" y="2.4" width="17" height="8.2" rx="2" fill="#43382F"/><path d="M23.6 4.6v3.8c1-.3 1.6-1 1.6-1.9s-.6-1.6-1.6-1.9z" fill="#43382F" fill-opacity=".45"/>`, 27, 13)}
</span></div>`;

const CSS = `${FONTS}
*{margin:0;padding:0;box-sizing:border-box}
body{background:#FBF4EC;font-family:Nunito;color:#43382F;-webkit-font-smoothing:antialiased}
.status{display:flex;justify-content:space-between;align-items:center;padding:16px 26px 4px;font-size:15.5px;font-weight:800}
.si{display:flex;align-items:center;gap:6px}
.wrap{padding:10px 20px 26px}
h1{font-size:26px;font-weight:900;letter-spacing:-.3px}
h2{font-size:17px;font-weight:900;margin:15px 0 9px}
.row{display:flex;align-items:center;gap:12px}
.av{width:46px;height:46px;border-radius:50%;background:#FFDCC2;color:#C96F4A;display:flex;align-items:center;justify-content:center;font-size:20px;font-weight:900}
.circ{width:38px;height:38px;border-radius:50%;background:#fff;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 16px rgba(67,56,47,.08)}
.sub{font-size:13px;font-weight:700;color:#9B8B7D}
.tiles{display:flex;flex-wrap:wrap;gap:11px;margin:15px 0 18px}
.tile{flex:0 0 calc(50% - 5.5px);border-radius:26px;padding:15px 15px 14px;min-height:106px}
.tile .tt{font-size:16px;font-weight:900;margin-top:9px}
.tile .tc{font-size:11.5px;font-weight:700;margin-top:3px;line-height:1.32}
.card{background:#fff;border-radius:24px;padding:16px 18px;box-shadow:0 6px 22px rgba(67,56,47,.06);margin-bottom:12px}
.seg{display:flex;background:#F0E9DF;border-radius:99px;padding:4px;gap:4px}
.seg div{flex:1;text-align:center;padding:9px 0;border-radius:99px;font-size:13.5px;font-weight:800;color:#9B8B7D}
.seg div.on{background:#E98862;color:#fff;font-weight:900}
.tl{display:flex;gap:12px;padding-bottom:14px}
.tl .dot{width:34px;height:34px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex:none}
.tl .t{font-size:14.5px;font-weight:800}
.tl .s{font-size:12.5px;font-weight:600;color:#9B8B7D;margin-top:1px}
.tl .r{font-size:12px;font-weight:700;color:#B39F8D;margin-left:auto}
.hint{font-size:11.5px;font-weight:600;color:#B39F8D;margin-top:4px}
.bars{display:flex;align-items:flex-end;gap:7px;height:70px;margin-top:10px}
.bars i{flex:1;border-radius:7px 7px 3px 3px}
.days{display:flex;gap:7px;margin-top:8px}
.days span{flex:1;text-align:center;font-size:10.5px;font-weight:700;color:#B39F8D}
.mv{font-size:23px;font-weight:900;margin-top:2px}
.lbl{font-size:11px;font-weight:800;letter-spacing:1px;text-transform:uppercase;color:#B39F8D}
.hrow{display:flex;align-items:center;gap:11px;padding:11px 0;border-bottom:1px solid #F2E8DA}
.hrow:last-child{border-bottom:none}
.ic{width:34px;height:34px;border-radius:12px;display:flex;align-items:center;justify-content:center;flex:none}
.pill{font-size:10.5px;font-weight:800;padding:5px 10px;border-radius:99px;white-space:nowrap}
.add{display:flex;align-items:center;justify-content:center;gap:8px;border:2px dashed #E0CDB4;border-radius:20px;padding:12px;font-size:13.5px;font-weight:800;color:#A98F73;background:#fff;margin-bottom:12px}
.tabbar{position:fixed;left:0;right:0;bottom:0;height:88px;background:rgba(255,255,255,.96);border-top:1px solid #F2E8DA;display:flex;align-items:flex-start;justify-content:space-around;padding-top:12px}
.tb{font-size:10.5px;font-weight:700;color:#B3A493;display:flex;flex-direction:column;align-items:center;gap:4px}
.tb.on{color:#E98862}
.fab{width:56px;height:56px;border-radius:50%;background:#E98862;display:flex;align-items:center;justify-content:center;box-shadow:0 8px 24px rgba(233,136,98,.45);margin-top:-24px}
`;

const tab = (on) => `<div class="tabbar">
<div class="tb ${on === 'h' ? 'on' : ''}">${I.home(on === 'h' ? '#E98862' : '#B3A493', on === 'h')}Home</div>
<div class="tb ${on === 'g' ? 'on' : ''}">${I.growth(on === 'g' ? '#E98862' : '#B3A493')}Growth</div>
<div class="fab">${I.plus()}</div>
<div class="tb ${on === 'he' ? 'on' : ''}">${I.health(on === 'he' ? '#E98862' : '#B3A493')}Health</div>
<div class="tb ${on === 'b' ? 'on' : ''}">${I.baby(on === 'b' ? '#E98862' : '#B3A493')}Baby</div></div>`;

const P = { peach: ['#FFDCC2', '#6E4429', '#B27B54'], lav: ['#DCD3F0', '#4A3D6E', '#8A7BB8'], sky: ['#CFE7F2', '#2E5A70', '#5E92AC'], sage: ['#DCE8CE', '#43602A', '#7A9A58'], rose: ['#F7D6DC', '#7E4152', '#C0798D'], sand: ['#F3E3BC', '#7A5E20', '#A98A3F'] };
const tile = (k, ic, t, c) => `<div class="tile" style="background:${P[k][0]}">${ic}<div class="tt" style="color:${P[k][1]}">${t}</div><div class="tc" style="color:${P[k][2]}">${c}</div></div>`;
const tl = (k, ic, t, s, r) => `<div class="tl"><div class="dot" style="background:${P[k][0]}">${ic}</div><div style="flex:1"><div class="t">${t}</div><div class="s">${s}</div></div><div class="r">${r}</div></div>`;
const bars = (v, c, d) => `<div class="bars">${v.map(x => `<i style="height:${x}%;background:${c}"></i>`).join('')}</div><div class="days">${d.map(x => `<span>${x}</span>`).join('')}</div>`;
const D = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

const TL_ROWS = [
  tl('peach', I.bottle('#C96F4A', 17), 'Bottle · 120 ml', 'logged by you', '2:15 PM'),
  tl('lav', I.sleep('#7B6BA8', 17), 'Sleep · 1h 20m', '11:45 AM – 1:05 PM · logged by you', '1:05 PM'),
  tl('sky', I.diaper('#4E86A0', 17), 'Diaper · wet', 'logged by you', '11:30 AM'),
  tl('sand', I.medicine('#A57F2C', 17), 'Vitamin D drops · 400 IU', 'logged by you', '9:10 AM'),
  tl('sage', I.solids('#6E8F4C', 17), 'Solids · pear', 'logged by you', '8:40 AM'),
  tl('rose', I.pump('#B56A7E', 17), 'Pump · 90 ml', '18 min · left · logged by you', '7:55 AM'),
  tl('peach', I.bottle('#C96F4A', 17), 'Bottle · 110 ml', 'logged by you', '6:30 AM'),
  tl('sky', I.diaper('#4E86A0', 17), 'Diaper · dirty', 'logged by you', '6:10 AM'),
];
const HOME = (rows) => `${statusBar}<div class="wrap">
<div class="row"><div class="av">P</div><div style="flex:1"><h1>Good morning</h1><div class="sub">Prince · 4 months, 12 days</div></div><div class="circ">${I.moon()}</div><div class="circ">${I.bell()}</div></div>
<div class="tiles">
${tile('peach', I.bottle(), 'Bottle', '35m ago · 120ml · hold to change')}
${tile('lav', I.sleep(), 'Sleep', 'Awake 1h 10m')}
${tile('sky', I.diaper(), 'Diaper', '1h ago · wet · hold to change')}
${tile('sage', I.solids(), 'Solids', '3h ago · pear · hold to change')}
${tile('rose', I.pump(), 'Pump', '2h ago · 90ml · hold to change')}
${tile('sand', I.medicine(), 'Medicine', 'Vitamin D drops · 2h ago')}
</div>
<div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:13px"><h2 style="margin:0">Today · 8</h2><span style="font-size:12.5px;font-weight:800;color:#C96F4A">See all ›</span></div>
${TL_ROWS.slice(0, rows).join('')}
<div class="hint">Tap any entry to edit or delete it</div>
</div>${tab('h')}`;

const TRENDS = `${statusBar}<div class="wrap">
<div class="row" style="margin-bottom:18px"><div class="circ">${I.chev()}</div><h1>Trends</h1></div>
<div class="seg"><div>Day</div><div class="on">Week</div><div>Month</div><div>Year</div></div>
<div style="margin:12px 0 13px" class="sub">This week · tap a bar to open that day</div>
<div class="card"><div style="display:flex;justify-content:space-between;align-items:baseline"><span class="lbl">Milk</span><span style="font-size:11.5px;font-weight:800;color:#C96F4A">4.6 L this week</span></div><div class="mv">660 ml <span style="font-size:13px;color:#9B8B7D;font-weight:700">avg / day</span></div>${bars([62, 78, 55, 88, 70, 95, 74], '#F0A47E', D)}</div>
<div class="card"><div style="display:flex;justify-content:space-between;align-items:baseline"><span class="lbl">Sleep</span><span style="font-size:11.5px;font-weight:800;color:#7B6BA8">71 h this week</span></div><div class="mv">10 h 8 m <span style="font-size:13px;color:#9B8B7D;font-weight:700">avg / day</span></div>${bars([80, 72, 90, 66, 84, 95, 78], '#B9A9E0', D)}</div>
<div class="card"><div style="display:flex;justify-content:space-between;align-items:baseline"><span class="lbl">Diapers</span><span style="font-size:11.5px;font-weight:800;color:#4E86A0">44 this week</span></div><div class="mv">6.3 <span style="font-size:13px;color:#9B8B7D;font-weight:700">avg / day</span></div>${bars([70, 85, 60, 75, 90, 65, 80], '#8FC4DC', D)}</div>
</div>${tab('h')}`;

const GROWTH = `${statusBar}<div class="wrap">
<h1 style="margin-bottom:14px">Growth</h1>
<div class="seg" style="margin-bottom:13px"><div class="on">Weight</div><div>Height</div><div>Head</div></div>
<div class="card">
<div class="lbl">Weight</div><div style="font-size:30px;font-weight:900;margin:2px 0">7.1 kg</div>
<div class="sub" style="margin-bottom:11px">+220 g since last measurement · steady curve</div>
<svg viewBox="0 0 320 140" style="width:100%;height:auto">
<path d="M10,122 C70,106 120,85 180,59 C220,42 270,31 310,21" fill="none" stroke="#F2E8DA" stroke-width="10" stroke-linecap="round"/>
<path d="M10,129 C70,116 120,96 180,72 C220,55 270,42 310,34" fill="none" stroke="#E98862" stroke-width="3.5" stroke-linecap="round"/>
${[[10, 129], [70, 116], [130, 98], [190, 73], [250, 52], [310, 34]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="5.5" fill="#fff" stroke="#E98862" stroke-width="3"/>`).join('')}
</svg>
<div class="days" style="margin-top:6px"><span>Birth</span><span>1 mo</span><span>2 mo</span><span>3 mo</span><span>4 mo</span><span>now</span></div>
</div>
<div style="display:flex;gap:12px;margin-bottom:14px">
<div class="card" style="flex:1;margin:0"><div class="lbl">Height</div><div style="font-size:21px;font-weight:900;margin-top:2px">63 cm</div></div>
<div class="card" style="flex:1;margin:0"><div class="lbl">Head</div><div style="font-size:21px;font-weight:900;margin-top:2px">41.5 cm</div></div>
</div>
<div style="background:#FFDCC2;border-radius:24px;padding:14px 18px;display:flex;align-items:center;gap:12px;margin-bottom:6px">${sv('0 0 20 20', `<path d="M10 3v14M3 10h14" stroke="#C96F4A" stroke-width="2.5" stroke-linecap="round"/>`, 20)}<span style="flex:1;font-size:14px;font-weight:800;color:#6E4429">Add measurement</span><span style="font-size:12px;font-weight:700;color:#B27B54">Last: 28 Jul</span></div>
<h2>History</h2>
<div class="card" style="padding:4px 18px">
<div class="hrow"><b style="width:96px;font-size:13.5px;font-weight:800">28 Jul 26</b><span class="sub" style="flex:1">7.1 kg · 63 cm · 41.5 cm head</span><span style="font-size:12px;font-weight:700;color:#B39F8D">Edit ›</span></div>
<div class="hrow"><b style="width:96px;font-size:13.5px;font-weight:800">14 Jul 26</b><span class="sub" style="flex:1">6.88 kg · 62 cm</span><span style="font-size:12px;font-weight:700;color:#B39F8D">Edit ›</span></div>
</div>
<div style="font-size:11px;font-weight:700;color:#B39F8D;text-align:center;margin-top:11px;padding:0 12px;line-height:1.5">For your records only — not medical advice. Talk to your pediatrician about your baby's growth.</div>
</div>${tab('g')}`;

const addBtn = (emoji, label) =>
  `<div class="add">${sv('0 0 20 20', `<path d="M10 3v14M3 10h14" stroke="#A98F73" stroke-width="2.5" stroke-linecap="round"/>`, 17)} ${label}</div>`;

// Mirrors src/screens/health/HealthScreen.tsx as of build 21. Note the vaccine
// add button sits ABOVE its card while the other two sit BELOW theirs — that
// asymmetry is what the screen actually does, so the render keeps it. Tidying
// it is queued with the Health redesign rather than risking an unverified
// change to a build that has already passed on a device.
const HEALTH = `${statusBar}<div class="wrap">
<h1 style="margin-bottom:3px">Health</h1><div class="sub">Prince · 4 months, 12 days</div>
<h2>Vaccines</h2>
${addBtn('+', 'Add vaccine appointment')}
<div class="card" style="padding:4px 18px">
<div class="hrow"><div class="ic" style="background:#CFE7F2">${I.syringe('#2E5A70')}</div><div style="flex:1"><div style="font-size:14.5px;font-weight:800">DTaP · dose 3</div><div class="sub" style="font-size:12px">Mon 8 Sep, 10:30 AM · Dr Rao</div></div><span class="pill" style="background:#CFE7F2;color:#2E5A70">in 5 weeks</span></div>
<div class="hrow"><div class="ic" style="background:#DCE8CE">${I.syringe('#43602A')}</div><div style="flex:1"><div style="font-size:14.5px;font-weight:800">DTaP · dose 2</div><div class="sub" style="font-size:12px">12 May · left thigh · batch K4821 · no reaction</div></div><span class="pill" style="background:#DCE8CE;color:#43602A">done ✓</span></div>
</div>
<h2>Sickness &amp; symptoms</h2>
<div class="card" style="padding:4px 18px">
<div class="hrow"><div class="ic" style="background:#F7D6DC">${I.thermo('#A04E63')}</div><div style="flex:1"><div style="font-size:14.5px;font-weight:800">🌡️ Mild fever</div><div class="sub" style="font-size:12px">peak 38.4° · Calpol ×2 · resolved · tap to edit</div></div><span style="font-size:12px;font-weight:700;color:#B39F8D">12 Jul – 18</span></div>
</div>
${addBtn('+', 'Add an illness')}
<h2>Medicine</h2>
<div class="card" style="padding:4px 18px">
<div class="hrow"><div class="ic" style="background:#F3E3BC">${I.medicine('#A57F2C', 20)}</div><div style="flex:1"><div style="font-size:14.5px;font-weight:800">Vitamin D drops</div><div class="sub" style="font-size:12px">400 IU · daily 6 PM · last given today 6:04 PM</div></div><span class="pill" style="background:#F3E3BC;color:#A57F2C">6:00 PM ⏰</span></div>
<div class="hrow"><div class="ic" style="background:#F3E3BC">${I.medicine('#A57F2C', 20)}</div><div style="flex:1"><div style="font-size:14.5px;font-weight:800">Paracetamol syrup</div><div class="sub" style="font-size:12px">2.5 ml · as needed · 2 doses for Mild fever</div></div><span style="font-size:11px;font-weight:800;color:#B39F8D">PRN</span></div>
</div>
${addBtn('+', 'Add a medicine')}
</div>${tab('he')}`;

const PROFILE = `${statusBar}<div class="wrap">
<h1 style="margin-bottom:14px">My babies</h1>
<div style="background:#43382F;border-radius:28px;padding:18px;display:flex;align-items:center;gap:16px;margin-bottom:11px;box-shadow:0 8px 26px rgba(67,56,47,.25)">
<div class="av" style="width:64px;height:64px;font-size:28px">P</div>
<div style="flex:1"><div style="font-size:19px;font-weight:900;color:#F5E9DB">Prince</div><div style="font-size:12.5px;font-weight:700;color:#C9B8A5">Born 8 Mar 2026 · 4 months, 12 days</div><div style="font-size:12.5px;font-weight:700;color:#C9B8A5">7.1 kg · 63 cm</div></div>
<span class="pill" style="background:#E98862;color:#fff">ACTIVE</span></div>
<div class="add" style="margin-bottom:18px">${sv('0 0 20 20', `<path d="M10 3v14M3 10h14" stroke="#A98F73" stroke-width="2.5" stroke-linecap="round"/>`, 17)} Add another baby</div>
<div style="background:#DCD3F0;border-radius:26px;padding:15px 18px;display:flex;align-items:center;gap:12px;margin-bottom:6px"><span style="font-size:19px">✨</span><span style="flex:1;font-size:14px;font-weight:800;color:#4A3D6E">Milestones &amp; memories</span><span style="font-size:12px;font-weight:700;color:#8A7BB8">View all ›</span></div>
<h2>Settings</h2>
<div class="card" style="padding:4px 18px">
<div class="hrow"><span style="flex:1;font-size:14.5px;font-weight:800">Units</span><span class="pill" style="background:#E98862;color:#fff">ml · kg</span></div>
<div class="hrow" style="display:block"><div style="font-size:14.5px;font-weight:800;margin-bottom:9px">Appearance</div><div class="seg"><div class="on">Light</div><div>Dark</div><div>Auto</div></div></div>
<div class="hrow"><div style="flex:1"><div style="font-size:14.5px;font-weight:800">Feed reminder</div><div class="sub" style="font-size:11.5px">Every 3 hours</div></div><div style="width:48px;height:29px;border-radius:99px;background:#E98862;position:relative"><div style="position:absolute;right:3px;top:3px;width:23px;height:23px;border-radius:50%;background:#fff"></div></div></div>
<div class="hrow"><div style="flex:1"><div style="font-size:14.5px;font-weight:800">App Lock</div><div class="sub" style="font-size:11.5px">Require Face ID to open DenBaby</div></div><div style="width:48px;height:29px;border-radius:99px;background:#E4DACB;position:relative"><div style="position:absolute;left:3px;top:3px;width:23px;height:23px;border-radius:50%;background:#fff"></div></div></div>
<div class="hrow"><span style="flex:1;font-size:14.5px;font-weight:800">Export for pediatrician</span><span style="font-size:12px;font-weight:700;color:#C96F4A">PDF ›</span></div>
</div>
</div>${tab('b')}`;

const SCREENS = (rows) => ({ '1-home': HOME(rows), '2-trends': TRENDS, '3-growth': GROWTH, '4-health': HEALTH, '5-profile': PROFILE });
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
fs.mkdirSync('out2', { recursive: true });
for (const [dev, w, h, s, wrapFn] of [
  ['iphone', 414, 896, 3, (x) => x],
  // Matches src/theme/layout.ts: at or above TABLET_BREAKPOINT every scroll
  // view is capped at CONTENT_MAX_WIDTH and centred. Keep these two in step —
  // a screenshot showing a layout the app does not have is a 2.3.3 rejection.
  ['ipad', 1024, 1366, 2, (x) => `<div style="max-width:700px;margin:0 auto">${x}</div>`],
]) {
  const p = await b.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: s });
  for (const [n, html] of Object.entries(SCREENS(dev === 'iphone' ? 4 : 8))) {
    await p.setContent(`<style>${CSS}</style>${wrapFn(html)}`);
    await p.evaluate(() => document.fonts.ready);
    await p.screenshot({ path: `out2/${dev}-${n}.png` });
  }
  await p.close();
  console.log(`${dev} done ${w * s}×${h * s}`);
}
await b.close();
