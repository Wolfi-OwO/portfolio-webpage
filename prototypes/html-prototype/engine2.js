// Shared mockup engine: same pages, same components, same data; the variant only changes shell, hierarchy, look and tone.
(function () {
  const C = window.C, V = 'a', VAR = document.documentElement.dataset.variant; // text voice is A's; VAR drives the look
  const $ = (s, r = document) => r.querySelector(s);
  const NAV = [['/', 'Home'], ['/projects', 'Projects'], ['/career', 'Career'], ['/services', 'Services'], ['/personal', 'Personal'], ['/contact', 'Contact']];
  const FOOT = [['/status', 'Status'], ['/privacy', 'Privacy'], ['/impressum', 'Imprint']];
  const tag = (t) => `<span class="tag">${t}</span>`;
  const sec = (n, label, kind) => `<h2 class="sec-label"><span class="sec-n">${n}</span>${label}${kind ? addBtn(kind) : ''}</h2>`;

  // Voice per variant: only copy tone differs, facts stay identical.
  const T = {
    a: { hero: 'Hi, I\'m <em>Wolfi</em>.<br>I make software that<br>does what it says.', kicker: 'Portfolio · Carinthia, AT', cta: 'Start a conversation', ctaB: 'Read the work' },
    b: { hero: 'wolfi@portfolio:~$ whoami', kicker: 'fullstack · web · android · desktop · ai', cta: 'open ./contact', ctaB: 'ls ./projects' },
    c: { hero: 'Hi, I\'m Wolfi —<br>I build things for the web <span class="wave">&</span> beyond.', kicker: 'Hello from Carinthia', cta: 'Say hello', ctaB: 'See what I\'ve made' },
  }[V];

  C.ai = { score: 4, provider: 'Sample detector (connect GPTZero, Originality.ai or Sapling)', checked: '4 Oct 2026, 11:20', pages: [['Home', 3], ['Projects', 2], ['Career', 1], ['Services', 9], ['Personal', 6], ['Contact', 2], ['Privacy policy', 0], ['Imprint', 0]] };
  const aiLevel = (n) => (n < 20 ? ['Mostly human-written', 'ok'] : n < 60 ? ['Mixed', 'mid'] : ['Mostly AI-written', 'hi']);
  const aichip = `<button class="aichip" data-ai data-tip="Content transparency" data-tip-sub="Estimated share of AI-written text" data-tip-meta="sample number · click for details"><i class="gauge mini ${aiLevel(C.ai.score)[1]}" style="--v:${C.ai.score}"></i>AI score <b>${C.ai.score}%</b></button>`;
  const badge = `<span class="badge"><i></i>${C.availability.badge}</span>`;
  const social = `<div class="social">${['GitHub', 'LinkedIn', 'Discord', 'Email'].map((s) => `<a href="#/contact">${s}</a>`).join('')}</div>`;

  // Same behaviour as components/activity-heatmap.jsx: starts scrolled to the newest week, scrolls back through earlier years,
  // All/GitHub/GitLab filter, hover card with the per-source split, start-of-history marker, source cards.
  const HW = 156, TODAY = new Date('2026-10-04T12:00:00');
  const HD = (() => { let s = 11; const r = () => (s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296; const out = [];
    for (let w = 0; w < HW; w++) for (let d = 0; d < 7; d++) { const date = new Date(TODAY); date.setDate(TODAY.getDate() - ((HW - 1 - w) * 7 + (6 - d)));
      if (date > TODAY) { out.push(null); continue; } const busy = (d > 0 && d < 6 ? 0.66 : 0.3) * (0.35 + 0.65 * Math.sin(w / 6) ** 2 + 0.15);
      const gh = r() < busy ? Math.ceil(r() * r() * 9) : 0, gl = r() < busy * 0.35 ? Math.ceil(r() * 5) : 0; out.push({ date, gh, gl }); } return out; })();
  const fmtD = (d) => d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
  function heatmap() {
    return `<div class="card heat" id="heat"><div class="heat-top"><h3>What I'm building right now</h3><span class="mono muted" id="heat-total"></span></div>
      <div class="seg" id="heat-src"><button class="on" data-s="all">All</button><button data-s="github">GitHub</button><button data-s="gitlab">GitLab</button></div>
      <div class="heat-scroll" id="heat-scroll"><div class="heat-inner"><div class="heat-months mono" id="heat-months"></div><div class="heat-grid" id="heat-grid"></div></div></div>
      <div class="heat-foot mono muted"><span id="heat-hint">← scroll for earlier years</span><span>less <i class="l0"></i><i class="l1"></i><i class="l2"></i><i class="l3"></i><i class="l4"></i> more</span></div>
      <div class="tip" id="heat-tip" hidden></div>
      <div class="srcs"><a class="src" href="#/projects"><b>GitHub</b><span class="mono muted" id="src-gh"></span><em class="live-dot"></em></a><a class="src" href="#/projects"><b>GitLab</b><span class="mono muted" id="src-gl"></span><em class="live-dot"></em></a></div>
      <div class="recent"><span class="mono muted">Recently touched</span>${['portfolio-webpage', 'network-visualizer', 'metrion'].map((r) => `<a href="#/projects">${r}</a>`).join('')}</div></div>`;
  }
  function bindHeat() {
    const root = $('#heat'); if (!root) return; let src = 'all';
    const grid = $('#heat-grid'), sc = $('#heat-scroll'), tip = $('#heat-tip');
    const cnt = (c) => (src === 'all' ? c.gh + c.gl : src === 'github' ? c.gh : c.gl);
    const lvl = (n) => (n === 0 ? 0 : n < 3 ? 1 : n < 6 ? 2 : n < 10 ? 3 : 4);
    function paint() {
      let total = 0, gh = 0, gl = 0;
      grid.innerHTML = HD.map((c, n) => { if (!c) return '<i style="visibility:hidden"></i>'; const k = cnt(c); total += k; gh += c.gh; gl += c.gl;
        return `<i class="l${lvl(k)}" data-n="${n}" tabindex="${k ? 0 : -1}" aria-label="${k} · ${c.date.toISOString().slice(0, 10)}" data-tip="${k} contribution${k === 1 ? '' : 's'}" data-tip-sub="${fmtD(c.date)}" data-tip-meta="${k ? [c.gh && 'GitHub ' + c.gh, c.gl && 'GitLab ' + c.gl].filter(Boolean).join(' · ') : 'no activity'}" style="--i:${HW - 1 - Math.floor(n / 7)}"></i>`; }).join('');
      $('#heat-total').textContent = `${total.toLocaleString('en-GB')} contributions since ${HD[0].date.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}`;
      $('#src-gh').textContent = `${gh} contributions`; $('#src-gl').textContent = `${gl} contributions`;
      const mo = []; let last = -1; for (let w = 0; w < HW; w++) { const d = HD[w * 7].date; if (d.getMonth() !== last && d.getDate() <= 7) { last = d.getMonth(); mo.push(`<span style="grid-column:${w + 1} / span 3">${d.toLocaleDateString('en-GB', { month: 'short' })}${d.getMonth() === 0 ? " '" + String(d.getFullYear()).slice(2) : ''}</span>`); } }
      $('#heat-months').innerHTML = mo.join('');
      grid.classList.add('go'); root.classList.add('in');
    }
    paint(); sc.scrollLeft = sc.scrollWidth;
    sc.addEventListener('scroll', () => { $('#heat-hint').textContent = sc.scrollLeft < 24 ? 'Start of history' : '← scroll for earlier years'; });
    $('#heat-src').onclick = (e) => { const b = e.target.closest('button'); if (!b) return; src = b.dataset.s; document.querySelectorAll('#heat-src button').forEach((x) => x.classList.toggle('on', x === b)); const x = sc.scrollLeft; paint(); sc.scrollLeft = x; };
  }

  function timeline() {
    return `<div class="card avail"><h3>Availability</h3><p class="lead">${C.availability.intro}</p>
      <ol class="tl">${C.timeline.map((e) => `<li class="${e.state} k-${e.k}">${pen('timeline', C.timeline.indexOf(e))}<span class="dot"></span><div><b>${e.t}</b><span class="mono muted">${e.from} → ${e.to}</span><p>${e.d}</p></div></li>`).join('')}</ol>
      <a class="btn ghost" href="#/services">What I build and what it costs →</a></div>`;
  }

  function techGrid() { return `<div class="techs">${C.tech.map((t) => `<div class="tech"><i class="sw"></i>${t}</div>`).join('')}</div>`; }

  const P = {};
  P['/'] = () => {
    const hero = {
      a: `<section class="hero"><div class="hero-top mono muted"><span>${T.kicker}</span><span class="hb">${badge}</span></div>
          <h1>${T.hero}</h1>
          <div class="hero-row"><img class="portrait" src="assets/profile-image.jpg" alt="Wolfi, portrait">
          <div><p class="lead big">${C.role}.</p><p class="lead">${C.bio}</p><div class="btns"><a class="btn" href="#/contact">${T.cta}</a><a class="btn ghost" href="#/projects">${T.ctaB} →</a></div></div></div></section>`,
      b: `<section class="hero term"><div class="term-bar"><i></i><i></i><i></i><span class="mono">~/wolfi — zsh</span>${badge}</div>
          <div class="term-body mono"><p class="muted">${T.hero}</p><h1>${C.name}</h1><p><span class="acc">~</span> ${C.handle} <span class="muted">· ${C.role}</span></p>
          <p class="muted">$ cat bio.txt</p><p class="bio">${C.bio}</p><p class="muted">$ ls --stack</p><p class="acc">${T.kicker}</p>
          <div class="btns"><a class="btn" href="#/contact">${T.cta}</a><a class="btn ghost" href="#/projects">${T.ctaB}</a><span class="cursor"></span></div></div></section>`,
      c: `<section class="hero"><div class="hero-card"><div class="portrait ph">portrait</div><div><div class="sticker">${T.kicker}</div><h1>${T.hero}</h1>
          <p class="lead">${C.bio}</p><div class="btns"><a class="btn" href="#/contact">${T.cta}</a><a class="btn ghost" href="#/projects">${T.ctaB}</a></div>${badge}</div></div>${social}</section>`,
    }[V];
    const feat = [C.projects[2], C.projects[0], C.projects[3]];
    return `${hero}
      <section>${sec('01', 'Selected work', 'project')}<div class="grid3">${feat.map(projCard).join('')}</div><a class="btn ghost more" href="#/projects">All ${C.projects.length} projects →</a></section>
      <section>${sec('02', 'Where I\'ve been', 'career')}<div class="mini-career">${C.career.slice(0, 3).map(careerRow).join('')}</div><a class="btn ghost more" href="#/career">Full career & education →</a></section>
      <section>${sec('03', 'Availability', 'timeline')}${timeline()}</section>
      <section>${sec('04', 'Activity')}${heatmap()}</section>
      <section>${sec('05', 'Technologies I use')}${techGrid()}</section>
      <section>${sec('06', 'Beyond the code')}<a class="card teaser" href="#/personal">${avatar('sm')}<div><h3>The person behind the code</h3><p class="muted">My sona, art, music and the things I love outside of work.</p></div><span class="btn sm ghost">Meet me →</span></a></section>
      <section class="cta-band"><h2>Not sure what you need?</h2><p>Describe what should happen and I\'ll tell you what it takes to build it — even if it isn\'t worth it.</p><a class="btn" href="#/contact">${T.cta}</a></section>`;
  };

  const SHOT = { 'NetViz': ['shots/proj/netviz.png', 'netviz.woofi-developments.at'], 'Machine Learning Visualizer': ['shots/proj/ml.png', 'ml-visualizer.at'] };
  function projCard(p, i) {
    const sh = SHOT[p.t];
    const shot = sh ? `<div class="shot"><div class="chrome"><i></i><i></i><i></i><span>${sh[1]}</span></div><img src="${sh[0]}" alt="Screenshot of ${p.t}" loading="lazy"></div>`
      : `<div class="shot ph2"><div class="chrome"><i></i><i></i><i></i><span>${p.live || 'repository only'}</span></div><div class="ph2-body"><b>${p.t.split(' ').map((w) => w[0]).join('').slice(0, 3)}</b></div></div>`;
    return `<article class="card proj">${pen('project', C.projects.indexOf(p))}${shot}<h3>${p.t}</h3><p>${p.d}</p>
      <div class="tags">${p.tech.map(tag).join('')}</div><div class="links">${p.live ? `<a class="btn sm" href="#/projects">Live demo <span>↗</span></a>` : ''}<a class="btn sm ghost" href="#/projects">Repository <span>↗</span></a></div></article>`;
  }
  P['/projects'] = () => `<header class="page-h"><span class="kicker mono">Projects</span><h1>${{ a: 'Things I\'ve <em>shipped</em>', b: 'ls ./projects', c: 'Stuff I\'ve made 🛠' }[V]}</h1>
      <p class="lead">${C.projects.length} projects — from teaching tools to infrastructure. Filter by stack.</p>
      <div class="chips">${['All', 'React', 'TypeScript', 'Express', 'Python', 'Docker'].map((c, i) => `<button class="${i ? '' : 'on'}">${c}</button>`).join('')}</div>${addBtn('project', 'New project')}</header>
      <div class="grid2">${C.projects.map(projCard).join('')}</div>`;

  function careerRow(e) {
    return `<div class="crow k-${e.k}">${pen('career', C.career.indexOf(e))}<span class="mono muted when">${e.from} — ${e.to}</span><div><b>${e.t}</b><span class="org">${e.o}${e.loc ? ' · ' + e.loc : ''}</span>${e.d ? `<p>${e.d}</p>` : ''}${e.tags ? `<div class="tags">${e.tags.map(tag).join('')}</div>` : ''}</div></div>`;
  }
  P['/career'] = () => `<header class="page-h"><span class="kicker mono">Career & education</span><h1>${{ a: 'A short, <em>honest</em> CV', b: 'git log --career', c: 'My path so far' }[V]}</h1></header>
      <section>${sec('01', 'Work', 'career')}<div class="career">${C.career.filter((e) => e.k === 'work').map(careerRow).join('')}</div></section>
      <section>${sec('02', 'Education', 'career')}<div class="career">${C.career.filter((e) => e.k === 'education').map(careerRow).join('')}</div></section>`;

  const SVC_IC = { Web: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3.500 3 14.500 0 18M12 3c-3 3.500-3 14.500 0 18"/>', Mobile: '<rect x="7" y="2.500" width="10" height="19" rx="2.500"/><path d="M11 18.500h2"/>', Desktop: '<rect x="3" y="4" width="18" height="12" rx="2"/><path d="M8 20h8M12 16v4"/>', Other: '<path d="M14.700 6.300a4 4 0 0 0-5.400 5.400L3 18l3 3 6.300-6.300a4 4 0 0 0 5.400-5.400l-2.500 2.500-2.300-.5-.5-2.300 2.500-2.500Z"/>' };
  const CHECK = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.600" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12.500 4.500 4.500L19 7.500"/></svg>';
  const svcCard = (sv, i) => { const m = sv.price.match(/^from (.+)$/), big = m ? m[1] : sv.price.charAt(0).toUpperCase() + sv.price.slice(1);
    return `<article class="card svc2"><span class="svc-ico">${'<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">' + (SVC_IC[sv.cat] || SVC_IC.Other) + '</svg>'}</span>${pen('service', C.services.indexOf(sv))}
      <span class="pill">${sv.cat}</span><h3>${sv.t}</h3><p class="svc-d">${sv.d}</p>
      ${sv.del.length ? `<ul class="checks">${sv.del.map((d) => `<li>${CHECK}<span>${d}</span></li>`).join('')}</ul>` : ''}
      <div class="svc-foot"><div class="price2">${m ? '<small class="mono">starting at</small>' : '<small class="mono">price</small>'}<b>${big}</b></div><div class="svc-chips"><span class="metachip">${sv.rate}</span>${sv.dur ? `<span class="metachip">${sv.dur}</span>` : ''}</div></div>
      <a class="btn sm" href="#/contact">Ask about this <span>→</span></a></article>`; };
  const STEP_IC = ['<path d="M21 12a8 8 0 0 1-11.500 7.200L4 20l1-4.500A8 8 0 1 1 21 12Z"/>', '<circle cx="12" cy="12" r="9"/><path d="m15.500 8.500-2 5-5 2 2-5 5-2Z"/>', '<path d="M5 21V4M5 4h11l-2 4 2 4H5"/>'];
  P['/services'] = () => `<header class="page-h"><span class="kicker mono">What I build</span><h1>${{ a: 'Services, <em>priced</em> plainly', b: './services --prices', c: 'How I can help' }[V]}</h1>
      <p class="lead">${C.servicesIntro}</p><div class="svc-meta"><span class="metachip big">Hourly rate €30</span><span class="metachip big live"><i></i>Small jobs now · larger projects from April 2027</span></div>${addBtn('service', 'New service')}</header>
      <div class="svc-grid">${C.services.map(svcCard).join('')}</div>
      <section><h2 class="sec-label">How it works</h2><div class="steps">${[['Tell me what should happen', 'A few lines are enough. Rough ideas are fine.'], ['I tell you what it takes', 'Even if the honest answer is that it is not worth building.'], ['We start', 'Smaller jobs in between, bigger projects from April 2027.']].map(([t, d], i) => `<div class="card step"><span class="step-ico"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">${STEP_IC[i]}</svg></span><b>${t}</b><p class="muted">${d}</p></div>`).join('<span class="step-arr" aria-hidden="true">→</span>')}</div></section>
      <section class="cta-band"><h2>Not sure which of these you need?</h2><p>Describe what should happen and I'll tell you what it takes, even if it isn't worth it.</p><a class="btn" href="#/contact">Get in touch</a></section>`;
  P['/contact'] = () => `<header class="page-h"><span class="kicker mono">Contact</span><h1>${{ a: 'Let\'s talk.', b: 'open ./contact', c: 'Let\'s chat ☕' }[V]}</h1><p class="lead">${C.contactIntro}</p></header>
      <div class="split"><div class="chan">${C.contact.map((c) => `<a class="card ch" href="#/contact"><span class="mono muted">${c.k}</span><b>${c.v}</b><p>${c.n}</p></a>`).join('')}
      <dl class="facts"><div><dt>Reply time</dt><dd>1–2 days</dd></div><div><dt>Location</dt><dd>Villach, Carinthia</dd></div><div><dt>Availability</dt><dd>${C.availability.badge}</dd></div></dl></div>
      <form class="card form" onsubmit="event.preventDefault();this.querySelector('.ok').hidden=false"><h3>Or write here</h3>
      <label>Name<input placeholder="Your name"></label><label>Email<input type="email" placeholder="you@example.com"></label><label>Subject<input placeholder="What's it about?"></label>
      <label>Message<textarea rows="5" placeholder="Describe what should happen…"></textarea></label>
      <p class="muted small">Stored only in my database, visible only to me, deleted after 90 days at the latest.</p><button class="btn">Send message</button><p class="ok" hidden>Message sent. I'll reply within a day or two.</p></form></div>`;

  P['/status'] = () => {
    const bars = (ok) => Array.from({ length: 60 }, (_, i) => `<i class="${!ok && i > 52 && i % 3 ? 'bad' : ''}" data-tip="${!ok && i > 52 && i % 3 ? 'Down' : '100% up'}" data-tip-sub="${59 - i === 0 ? 'Today' : (59 - i) + ' days ago'}"></i>`).join('');
    return `<header class="page-h"><span class="kicker mono">Status</span><h1>${{ a: 'Everything <em>running</em>?', b: 'systemctl status', c: 'Is everything okay?' }[V]}</h1>
      <div class="statusbar ${C.status.every((s) => s.ok) ? '' : 'warn'}"><i></i><b>One service had a hiccup</b><span class="mono muted">updated 12 s ago · via Metrion</span></div>
      <div class="seg"><button>Live</button><button>24 h</button><button>7 d</button><button class="on">30 d</button><button>90 d</button><button>1 y</button><button>All</button><button>Custom…</button></div></header>
      <div class="stats"><div class="card stat"><span class="mono muted">Avg uptime · period</span><b>99.55%</b></div><div class="card stat"><span class="mono muted">Latency · p50 (period)</span><b>240 ms</b></div><div class="card stat"><span class="mono muted">Incidents</span><b>3</b></div></div>
      <div class="card svc-list">${C.status.map((s) => `<div class="srow ${s.ok ? '' : 'down'}"><div class="sname"><i></i><b>${s.n}</b><span class="mono muted">${s.up}% · ${s.ms} ms</span></div><div class="ubars">${bars(s.ok)}</div></div>`).join('')}</div>
      <div class="card inc"><h3>Incidents in this period</h3><p><b>Preussen Web</b> <span class="mono muted">2 Oct 2026 · 14 min</span></p><p><b>Machine Learning Visualizer</b> <span class="mono muted">19 Sep 2026 · 6 min</span></p><a class="btn ghost" href="#/status">view the full incident history →</a></div>
      <p class="muted small">Status data combines this site's own checks with uptime pulled from Metrion.</p>`;
  };

  P['/privacy'] = () => `<header class="page-h"><span class="kicker mono">Legal</span><h1>Privacy policy</h1><p class="mono muted">Last updated: 21 Sep 2026</p><p class="lead">${C.privacyIntro}</p></header>
      <div class="prose card"><h3>The short version</h3><p>${C.privacyShort}</p><h3>Server logs</h3><p>Caddy writes one log line per request. Before it is written, your IP address, path, query string and all headers are stripped.</p><h3>Fonts</h3><p>Manrope and JetBrains Mono are served from my own server — no connection to Google Fonts.</p><h3>Your rights</h3><p>Access, correction, deletion, restriction, portability, objection. Write to me; I reply within a month.</p></div>`;
  P['/impressum'] = () => `<header class="page-h"><span class="kicker mono">Legal</span><h1>Imprint</h1></header><div class="prose card"><p>Information pursuant to §5 ECG and §25 MedienG:</p><p><b>${C.imprint}</b></p><p>Scope: software development, web development and digital solutions.</p><a class="btn ghost" href="#/privacy">To the privacy policy →</a></div>`;
  P['/admin/login'] = () => `<div class="center"><form class="card form narrow" onsubmit="event.preventDefault()"><span class="kicker mono">Admin</span><h1 class="h2">Sign in</h1><label>Username<input></label><label>Password<input type="password"></label><button class="btn">Sign in</button></form></div>`;
  P['/secret'] = () => `<div class="center"><div class="card narrow"><span class="kicker mono">Found something</span><h1 class="h2">It's locked. You know the word.</h1><label>Password<input type="password"></label><button class="btn">Open</button><a class="muted small" href="#/">Rather not — back home</a></div></div>`;
  P['404'] = () => `<div class="center"><div class="narrow"><span class="kicker mono">404</span><h1>${{ a: 'Page not <em>found</em>.', b: 'ENOENT: no such page', c: 'Oops, wrong turn!' }[V]}</h1><p class="lead">That address doesn't exist (anymore).</p><a class="btn" href="#/">Back to start</a></div></div>`;

  // ---------- Edit mode (shown after admin login) ----------
  const PEN = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>';
  const pen = (kind, i) => `<span class="ctl edit-only"><button class="pen" data-edit="${kind}:${i}" aria-label="Edit" data-tip="Edit" data-tip-sub="Changes the entry right here">${PEN}</button><button class="pen del" data-del="${kind}:${i}" aria-label="Delete" data-tip="Delete" data-tip-sub="Asks first">${TRASH}</button></span>`;
  const SPEC = {
    career: { title: 'career entry', list: () => C.career, f: [['t', 'Title'], ['o', 'Organisation'], ['loc', 'Location'], ['from', 'From', 'half'], ['to', 'To (empty = now)', 'half'], ['k', 'Kind', 'select:work,education'], ['d', 'Description', 'area'], ['tags', 'Tags (comma separated)']] },
    timeline: { title: 'availability entry', list: () => C.timeline, f: [['t', 'Title'], ['from', 'From', 'half'], ['to', 'To (empty = open)', 'half'], ['k', 'Kind', 'select:work,military,education,available,unavailable'], ['d', 'Description', 'area']] },
    service: { title: 'service', list: () => C.services, f: [['t', 'Title'], ['cat', 'Category', 'select:Web,Mobile,Desktop,Other'], ['d', 'Description', 'area'], ['del', 'Deliverables (one per line)', 'area'], ['price', 'Price from', 'half'], ['rate', 'Hourly rate', 'half'], ['dur', 'Duration']] },
    project: { title: 'project', list: () => C.projects, f: [['t', 'Title'], ['d', 'Description', 'area'], ['live', 'Live demo URL'], ['tech', 'Technologies (comma separated)']] },
  };
  // ---------- Inline admin: no modals, no edit bar. Signed in = pencil + trash on every entry, forms open in place. ----------
  const TRASH = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2M6 6l1 14a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-14M10 11v6M14 11v6"/></svg>';
  const LISTS = { career: () => C.career, timeline: () => C.timeline, service: () => C.services, project: () => C.projects, gallery: () => C.gallery, hobby: () => C.hobbies, fav: () => [C.favs], music: () => C.music };
  const BLANK = { career: () => ({ t: '', o: '', loc: '', from: '', to: '', k: 'work', d: '', tags: [] }), timeline: () => ({ t: '', from: '', to: '', k: 'work', d: '', state: 'next' }), service: () => ({ t: '', cat: 'Web', d: '', del: [], price: 'on request', rate: '€30 / h', dur: '' }), project: () => ({ t: '', d: '', tech: [], live: '' }), gallery: () => ({ t: '', cap: '', src: 'assets/sona/headshot.webp', r: '1/1' }), hobby: () => ({ t: '', icon: 'code', tags: [] }), music: () => ({ t: '', a: '', al: '', p: 10, h: [220, 280], vid: '' }) };
  const HOSTS = '.card, .crow, .tl li, .tile, .tracks li';
  const addBtn = (kind, label = 'New entry') => `<button class="btn sm ghost addnew edit-only" data-new="${kind}"><svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>${label}</button>`;
  function formHTML(kind, obj) {
    const sp = SPEC[kind], val = (k) => (Array.isArray(obj[k]) ? obj[k].join(k === 'del' ? '\n' : ', ') : obj[k] ?? '');
    const field = ([k, label, t = '']) => t.startsWith('select') ? `<label class="fld">${label}<select name="${k}">${t.slice(7).split(',').map((o) => `<option ${val(k) === o ? 'selected' : ''}>${o}</option>`).join('')}</select></label>`
      : t === 'area' ? `<label class="fld wide">${label}<textarea name="${k}" rows="3">${val(k)}</textarea></label>` : `<label class="fld ${t === 'half' ? '' : 'wide'}">${label}<input name="${k}" value="${String(val(k)).replace(/"/g, '&quot;')}"></label>`;
    return `<form class="inline-form" data-kind="${kind}"><div class="if-h"><span class="kicker mono">${obj._new ? 'New' : 'Edit'} ${sp.title}</span></div><div class="fields">${sp.f.map(field).join('')}</div>
      <label class="switch"><input type="checkbox" name="_pub" checked><i></i><span>Published, visible on the website</span></label>
      <div class="if-f"><button type="button" class="btn sm ghost" data-cancel>Cancel</button><button class="btn sm">Save</button></div></form>`;
  }
  function closeInline() { document.querySelectorAll('.editing').forEach((h) => { if (h._orig != null) { h.innerHTML = h._orig; delete h._orig; } h.classList.remove('editing'); }); }
  function openInline(kind, idx) {
    closeInline(); const host = document.querySelector(`[data-edit="${kind}:${idx}"]`)?.closest(HOSTS); if (!host) return;
    const obj = LISTS[kind]()[+idx]; host._orig = host.innerHTML; host.classList.add('editing'); host.innerHTML = formHTML(kind, obj);
    host.dataset.kind = kind; host.dataset.idx = idx; host.querySelector('input')?.focus(); host.scrollIntoView({ block: 'center', behavior: 'smooth' });
  }
  function toast(t) { const el = document.createElement('div'); el.className = 'toast'; el.textContent = t; document.body.appendChild(el); requestAnimationFrame(() => el.classList.add('in')); setTimeout(() => { el.classList.remove('in'); setTimeout(() => el.remove(), 300); }, 2200); }
  document.addEventListener('click', (e) => {
    const ed = e.target.closest('[data-edit]'); if (ed && ed.dataset.edit.includes(':')) { const [k, i] = ed.dataset.edit.split(':'); if (LISTS[k]) openInline(k, i); return; }
    const nw = e.target.closest('[data-new]'); if (nw) { const k = nw.dataset.new; LISTS[k]().unshift({ ...BLANK[k](), _new: true }); route(); requestAnimationFrame(() => openInline(k, 0)); return; }
    const cn = e.target.closest('[data-cancel]'); if (cn) { const h = cn.closest('.editing'); const k = h.dataset.kind, i = +h.dataset.idx; if (LISTS[k]()[i]?._new) { LISTS[k]().splice(i, 1); route(); } else closeInline(); return; }
    const dl = e.target.closest('[data-del]'); if (dl) { const [k, i] = dl.dataset.del.split(':'), host = dl.closest(HOSTS), obj = LISTS[k]()[+i]; host.querySelector('.confirm-bar')?.remove();
      host.insertAdjacentHTML('afterbegin', `<div class="confirm-bar"><span>Delete “${obj.t || 'this entry'}”? This cannot be undone.</span><button class="btn sm danger" data-yes="${k}:${i}">Yes, delete</button><button class="btn sm ghost" data-no>Keep</button></div>`); return; }
    const yes = e.target.closest('[data-yes]'); if (yes) { const [k, i] = yes.dataset.yes.split(':'); LISTS[k]().splice(+i, 1); route(); return toast('Entry deleted.'); }
    if (e.target.closest('[data-no]')) return e.target.closest('.confirm-bar').remove();
    const go = e.target.closest('[data-go]'); if (go) { adminTab = go.dataset.go; }
    if (e.target.closest('[data-signout]')) { sessionStorage.removeItem('adm'); document.getElementById('umenu').hidden = true; route(); return toast('Signed out.'); }
    const lk = e.target.closest('#lock'); const um = document.getElementById('umenu'); if (lk && sessionStorage.getItem('adm')) { um.hidden = !um.hidden; return; } if (um && !e.target.closest('#umenu')) um.hidden = true;
  });
  document.addEventListener('submit', (e) => {
    const f = e.target.closest('.inline-form'); if (!f) return; e.preventDefault(); const host = f.closest('.editing'), k = f.dataset.kind, obj = LISTS[k]()[+host.dataset.idx], fd = new FormData(f);
    for (const [name, v] of fd.entries()) { if (name === '_pub') continue; obj[name] = ['tags', 'tech', 'words', 'films', 'games', 'interests'].includes(name) ? v.split(',').map((x) => x.trim()).filter(Boolean) : name === 'del' ? v.split('\n').map((x) => x.trim()).filter(Boolean) : v; }
    if (obj.link !== undefined) obj.vid = ytId(obj.link);
    if (!String(obj.t || '').trim()) { f.querySelector('input[name=t]').focus(); return toast('A title is required.'); }
    delete obj._new; route(); toast('Saved. The change is live.');
  });
  // I L O V E U, typed at a human pace (250–1000 ms between letters), ignored inside inputs and with modifiers: mirrors hooks/useSecretCombo.js
  const SECRET_KEY = 'portfolio.secretFound', SEQ = ['i', 'l', 'o', 'v', 'e', 'u'];
  const HEART = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#e5675b" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z"/></svg>';
  const secretLink = (path) => `<a href="#/secret" class="secret-link ${path === '/secret' ? 'on' : ''}">${HEART}<span>Another new Secret?!</span></a>`;
  let progress = 0, lastAt = 0;
  const onCombo = (e) => {
    const t = e.target; if ((t instanceof HTMLElement && (t.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(t.tagName))) || e.ctrlKey || e.metaKey || e.altKey) return;
    const key = e.key.toLowerCase(), gap = e.timeStamp - lastAt, inRhythm = progress === 0 || (gap >= 250 && gap <= 1000);
    progress = inRhythm && key === SEQ[progress] ? progress + 1 : key === SEQ[0] ? 1 : 0; lastAt = e.timeStamp;
    if (progress === SEQ.length) { progress = 0; sessionStorage.setItem(SECRET_KEY, 'true'); removeEventListener('keydown', onCombo); const nav = document.querySelector('.topbar nav'); if (nav && !nav.querySelector('.secret-link')) { nav.insertAdjacentHTML('beforeend', secretLink(location.hash.slice(1))); document.querySelector('.topbar').classList.add('has-secret'); } }
  };
  if (sessionStorage.getItem(SECRET_KEY) !== 'true') addEventListener('keydown', onCombo);

  // ---------- Admin ----------
  let adminTab = 'overview', openMsg = 0;
  const MSGS = [
    { n: 'Anna Berger', e: 'anna.berger@example.com', s: 'Website für unseren Verein', b: 'Hallo Wolfi, wir sind ein kleiner Verein aus Klagenfurt und suchen jemanden, der uns eine neue Website baut. Wäre das im April möglich? Wir hätten ca. 8 Seiten und einen Kalender.', d: '2 hours ago', left: 89, unread: true },
    { n: 'Markus Huber', e: 'markus@example.com', s: 'Frage zu NetViz', b: 'Tolles Projekt! Gibt es eine Möglichkeit, Topologien als JSON zu exportieren und wieder zu importieren?', d: 'yesterday', left: 88, unread: true },
    { n: 'Lea Winter', e: 'lea.w@example.com', s: 'Android-App Prototyp', b: 'Wir brauchen einen klickbaren Prototyp für eine Fitness-App, Budget ca. 1.500 €.', d: '3 days ago', left: 86, unread: false },
  ];
  const MON = ['Network Visualizer', 'Machine Learning Visualizer', 'Machine Learning Visualizer (Preview)', 'Nutrilens', 'Portfolio', 'Status Page', 'Preussen Web'];
  function tbl(head, rows) { return `<div class="tbl"><div class="tr th">${head.map((h) => `<span>${h}</span>`).join('')}<span></span></div>${rows.join('')}</div>`; }
  function adminBody(t) {
    if (t === 'overview') return `<div class="stats"><div class="card stat"><span class="mono muted">Unread messages</span><b>2</b></div><div class="card stat"><span class="mono muted">Monitors</span><b>${MON.length}</b></div><div class="card stat"><span class="mono muted">AI score (text)</span><b>${C.ai.score}%</b></div></div>
      <div class="card"><h3>Edit content right on the page</h3><p class="muted">Career, availability, services, projects and the gallery are edited where they appear: sign in, then use the pencil and trash buttons on any entry, or “New entry” in the section heading.</p><div class="btns"><a class="btn sm" href="#/">Home</a><a class="btn sm ghost" href="#/career">Career</a><a class="btn sm ghost" href="#/services">Services</a><a class="btn sm ghost" href="#/projects">Projects</a><a class="btn sm ghost" href="#/personal">Personal</a></div></div>`;
    const pubs = '<i class="pub on"></i>';
    if (t === 'ai') { const code = [['client/src (React)', 41, 'Low'], ['server/src (Express)', 33, 'Low'], ['jobs/ (Azure Functions)', 28, 'Low'], ['docs/ and README', 52, 'Medium']]; const conf = (c) => `<span class="conf ${c.toLowerCase()}">${c} confidence</span>`;
      return `<div class="adm-h"><h3>AI check</h3><span class="mono muted small"><i class="pub on"></i> private, only you see this</span></div>
      <div class="card"><div class="ai-top"><div class="gauge big ${aiLevel(C.ai.score)[1]}" style="--v:${C.ai.score}"><b>${C.ai.score}%</b><span class="mono small">text, whole site</span></div>
        <div><p class="muted">How likely the visible text of this site is machine-written, averaged over all pages. ${conf('High')}</p><div class="btns"><button class="btn sm" data-recheck-admin>Run check now</button><span class="mono muted small">last run ${C.ai.checked}</span></div></div></div></div>
      <div class="card"><h3>Text, per page</h3><div class="ai-pages">${C.ai.pages.map(([n, v]) => `<div class="aip"><span>${n}</span><span class="bar"><i class="${aiLevel(v)[1]}" style="--w:${Math.max(v, 2)}%"></i></span><span class="mono small muted">${v}%</span></div>`).join('')}</div></div>
      <div class="card"><h3>Code, per area</h3><p class="muted small">Code detectors are far less reliable than text detectors. Read these as a rough hint, never as proof.</p><div class="ai-pages">${code.map(([n, v, c]) => `<div class="aip wide"><span>${n}</span><span class="bar"><i class="${aiLevel(v)[1]}" style="--w:${v}%"></i></span><span class="mono small muted">${v}%</span>${conf(c)}</div>`).join('')}</div></div>
      <div class="card"><div class="fields"><label class="fld wide">Detector<select><option>GPTZero (text)</option><option>Originality.ai (text)</option><option>Sapling (text)</option><option>Own model on commit history (code)</option></select></label><label class="fld">Run<select><option>After every publish</option><option>Weekly</option><option>Manual only</option></select></label><label class="fld">Alert above<select><option>Never</option><option>30%</option><option>50%</option></select></label></div><p class="mono muted small" style="margin-top:10px">Sample numbers in this mockup. A real run needs a detector API key stored on the server.</p></div>`; }
    if (t === 'career') return `<div class="adm-h"><h3>Career &amp; education</h3><button class="btn sm" data-edit="career:new">+ New entry</button></div>${tbl(['Title', 'Organisation', 'Period', 'Live'], C.career.map((e, i) => `<div class="tr"><span><b>${e.t.slice(0, 44)}</b></span><span>${e.o}</span><span class="mono muted">${e.from} – ${e.to}</span><span>${pubs}</span><span>${pen('career', i).replace('edit-only', '')}</span></div>`))}`;
    if (t === 'availability') return `<div class="adm-h"><h3>Availability</h3><button class="btn sm" data-edit="timeline:new">+ New entry</button></div>${tbl(['Title', 'Kind', 'Period', 'Live'], C.timeline.map((e, i) => `<div class="tr"><span><b>${e.t}</b></span><span>${e.k}</span><span class="mono muted">${e.from} → ${e.to}</span><span>${pubs}</span><span>${pen('timeline', i).replace('edit-only', '')}</span></div>`))}`;
    if (t === 'services') return `<div class="adm-h"><h3>Services</h3><button class="btn sm" data-edit="service:new">+ New service</button></div>${tbl(['Title', 'Category', 'Price', 'Live'], C.services.map((e, i) => `<div class="tr"><span><b>${e.t}</b></span><span>${e.cat}</span><span class="mono muted">${e.price}</span><span>${pubs}</span><span>${pen('service', i).replace('edit-only', '')}</span></div>`))}`;
    if (t === 'projects') return `<div class="adm-h"><h3>Projects</h3><button class="btn sm" data-edit="project:new">+ New project</button></div>${tbl(['Title', 'Stack', 'Demo', 'Live'], C.projects.map((e, i) => `<div class="tr"><span><b>${e.t}</b></span><span class="mono muted">${e.tech.slice(0, 3).join(', ')}</span><span>${e.live ? 'yes' : '—'}</span><span>${pubs}</span><span>${pen('project', i).replace('edit-only', '')}</span></div>`))}`;
    if (t === 'messages') { const m = MSGS[openMsg]; return `<div class="adm-h"><h3>Contact messages</h3><span class="mono muted small">stored only here · deleted automatically after 90 days</span></div>
      <div class="inbox"><div class="mlist">${MSGS.map((x, i) => `<button class="mrow ${i === openMsg ? 'on' : ''}" data-msg="${i}">${x.unread ? '<i class="ud"></i>' : '<i></i>'}<span><b>${x.n}</b><em>${x.s}</em></span><span class="mono muted">${x.d}</span></button>`).join('')}</div>
      <div class="card mview"><span class="mono muted small">${m.d} · auto-delete in ${m.left} days</span><h3>${m.s}</h3><p class="muted small">${m.n} &lt;${m.e}&gt;</p><p>${m.b}</p><div class="btns"><a class="btn sm" href="#/admin">Reply by email ↗</a><button class="btn sm ghost danger">Delete now</button></div></div></div>`; }
    return `<div class="adm-h"><h3>Monitors</h3><span class="mono muted small">checked every minute · results kept 90 days</span></div>${tbl(['Name', 'Status', 'Check'], MON.map((n, i) => `<div class="tr"><span><b>${n}</b></span><span><i class="pub ${i === 6 ? 'bad' : 'on'}"></i> ${i === 6 ? 'down' : 'up'}</span><span class="mono muted">${i === 6 ? 'skip' : 'http'}</span><span></span></div>`))}`;
  }
  const TABS = [['overview', 'Overview'], ['ai', 'AI check'], ['messages', 'Messages'], ['monitors', 'Monitors']];
  P['/admin'] = () => `<header class="page-h"><span class="kicker mono">Admin</span><h1>Inbox &amp; checks</h1></header>
    <div class="adm"><aside class="adm-nav">${TABS.map(([k, l]) => `<button data-tab="${k}" class="${k === adminTab ? 'on' : ''}">${l}${k === 'messages' ? '<em>2</em>' : ''}</button>`).join('')}<a href="#/" class="adm-out" id="logout">Sign out</a></aside><div class="adm-body" id="adm-body">${adminBody(adminTab)}</div></div>`;
  P['/admin/login'] = () => `<div class="center"><form class="card form narrow" id="login"><span class="kicker mono">Admin</span><h1 class="h2">Sign in</h1><p class="muted small">Only I use this, to maintain the content of the site.</p>
    <label>Username<input placeholder="admin" autocomplete="off"></label><label>Password<span class="pw"><input id="pw" type="password" placeholder="••••••••"><button type="button" class="eye" id="eye" aria-label="Show password">${'<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12Z"/><circle cx="12" cy="12" r="3"/></svg>'}</button></span></label><button class="btn">Sign in</button><a class="muted small" href="#/">← back to the site</a></form></div>`;
  function bindAdmin() {
    const l = $('#login'); if (l) { l.onsubmit = (e) => { e.preventDefault(); sessionStorage.setItem('adm', '1'); location.hash = '#/'; setTimeout(() => toast('Signed in. Pencils appear on every entry.'), 200); }; $('#eye').onclick = () => { const p = $('#pw'); p.type = p.type === 'password' ? 'text' : 'password'; }; }
    const nav = $('.adm-nav'); if (nav) nav.onclick = (e) => { const b = e.target.closest('[data-tab]'); if (b) { adminTab = b.dataset.tab; nav.querySelectorAll('button').forEach((x) => x.classList.toggle('on', x === b)); $('#adm-body').innerHTML = adminBody(adminTab); } if (e.target.id === 'logout') sessionStorage.removeItem('adm'); };
    const body = $('#adm-body'); if (body) body.addEventListener('click', (e) => { const m = e.target.closest('[data-msg]'); if (m) { openMsg = +m.dataset.msg; body.innerHTML = adminBody('messages'); } });
  }

  // ---------- Secret ----------
  let secretOpen = false, secretTimer;
  const SINCE = new Date('2025-12-25T15:37:48');
  function elapsed(now = new Date()) {
    let y = now.getFullYear() - SINCE.getFullYear(), mo = now.getMonth() - SINCE.getMonth(), d = now.getDate() - SINCE.getDate(), h = now.getHours() - SINCE.getHours(), mi = now.getMinutes() - SINCE.getMinutes(), s = now.getSeconds() - SINCE.getSeconds();
    if (s < 0) { s += 60; mi--; } if (mi < 0) { mi += 60; h--; } if (h < 0) { h += 24; d--; } if (d < 0) { d += new Date(now.getFullYear(), now.getMonth(), 0).getDate(); mo--; } if (mo < 0) { mo += 12; y--; }
    return [['Jahre', y], ['Monate', mo], ['Tage', d], ['Stunden', h], ['Minuten', mi], ['Sekunden', s]];
  }
  P['/secret'] = () => `<div class="secret" id="secret">${secretOpen ? secretView() : secretGate()}</div>`;
  const secretGate = () => `<div class="center"><form class="card form narrow" id="gate"><span class="kicker mono">Geheim</span><h1 class="h2">Du hast etwas gefunden</h1><p class="muted">Es ist aber verschlossen. Du kennst das Wort.</p>
    <label>Passwort<span class="pw"><input id="spw" type="password" autocomplete="off"><button type="button" class="eye" id="seye" aria-label="Passwort anzeigen"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12Z"/><circle cx="12" cy="12" r="3"/></svg></button></span></label><p class="gerr" hidden>Nicht ganz. Versuch es nochmal.</p><button class="btn">Aufmachen</button><a class="muted small" href="#/">Lieber doch nicht — zurück zur Startseite</a></form></div>`;
  const secretView = () => `<div class="hearts" aria-hidden="true">${Array.from({ length: 14 }, (_, i) => `<i style="left:${(i * 37) % 100}%;animation-delay:${(i * 0.7) % 6}s;font-size:${12 + (i % 4) * 6}px">♥</i>`).join('')}</div>
    <figure class="us"><img src="assets/us.webp" alt="A photo of the two of us"></figure>
    <header class="page-h center-t"><svg class="heartbeat" viewBox="0 0 24 24" width="56" height="56" fill="#e5675b" aria-hidden="true"><path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z"/></svg><span class="kicker mono">Zusammen seit 25.12.2025, 15:37:48</span><h1>Für Helmi<br><em>(aka. die Liebe meines Lebens)</em></h1><p class="lead">Manche Dinge kann man nicht bauen, egal, wie gut man darin wird. Man hat einmal Glück — und danach ist man jeden einzelnen Tag dankbar dafür. Du bist das Beste in meinem Leben: der Mensch, dem ich alles zuerst erzählen will, und der aus einem ganz gewöhnlichen Abend den Ort macht, an dem ich am liebsten bin. Danke, dass es dich gibt.</p></header>
    <div class="units" id="units">${elapsed().map(([u, v]) => `<div class="unit"><b>${v}</b><span class="mono muted">${u}</span></div>`).join('')}</div>
    <div class="card mile rose"><span class="badge"><i></i>Heute sind es 9 Monate</span><p>Ich hab immer gedacht, so was legt sich mit der Zeit. Tut es aber nicht. Dein Name leuchtet am Handy auf und ich freu mich, jedes Mal. Und ehrlich, die schönsten Tage waren die, an denen wir eigentlich gar nichts gemacht haben.</p></div>
    <div class="card gift"><span class="kicker mono">Ein Geschenk für dich</span><div class="vrow"><img class="voucher" src="assets/voucher.webp" alt="Virtueller Geschenkgutschein"><div><h3>Virtueller Geschenkgutschein</h3><p class="mono muted small">Geliefert am Samstag, 25. Juli, an Helmi</p></div></div><div class="note"><p>I love you so fucking much <span class="acc">♥</span></p><p>I never knew that an person like you could make my life so colorful again and give it a purpose again. I wanna live with you forever and also die together.</p><p>I never ever wanna loose you...</p></div><button class="btn sm" id="dl">Beleg herunterladen</button></div>
    <p class="center-t muted">…und ich zähle weiter. Ich liebe dich <span class="acc">♥</span></p>`;
  function bindSecret() {
    clearInterval(secretTimer); const g = $('#gate');
    if (g) { g.onsubmit = (e) => { e.preventDefault(); if (!$('#spw').value.trim()) { $('.gerr').hidden = false; return; } secretOpen = true; $('#secret').innerHTML = secretView(); bindSecret(); }; $('#seye').onclick = () => { const p = $('#spw'); p.type = p.type === 'password' ? 'text' : 'password'; }; }
    if ($('#units')) secretTimer = setInterval(() => { const u = $('#units'); if (!u) return clearInterval(secretTimer); u.innerHTML = elapsed().map(([n, v]) => `<div class="unit"><b>${v}</b><span class="mono muted">${n}</span></div>`).join(''); }, 1000);
    const dl = $('#dl'); if (dl) dl.onclick = () => { dl.textContent = 'Wird geholt…'; setTimeout(() => { dl.textContent = 'Beleg herunterladen'; toast('Beleg heruntergeladen.'); }, 900); };
  }

  // ---------- Palettes (switchable live; see the notes in each entry) ----------
  const lum = (hex) => { const n = parseInt(hex.slice(1), 16), f = (v) => { v /= 255; return v <= .03928 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4; }; return .2126 * f(n >> 16) + .7152 * f((n >> 8) & 255) + .0722 * f(n & 255); };
  const ink = (hex, dark) => (lum(hex) > .3 ? (dark ? '#0b0b12' : '#111') : '#fff');
  // id, name, group, hue, sat, accent dark, accent light, note, [live override for dark]
  const RAW = [
    ['current', 'Current site', 'Current', 220, 40, '#6aa5ff', '#1f5fd0', 'The exact palette of woofi-developments.at today: navy ground, clear blue accent, green reserved for live status.', null, { d: { bg: '#070b18', s: '#0e1729', s2: '#17233c', t: '#e6ecf6', m: '#8ea0bd', l: '#22304c', a: '#6aa5ff', on: '#06101f', live: '#5fbf6a' }, l: { bg: '#eef2f9', s: '#ffffff', s2: '#e8eef7', t: '#0c1526', m: '#5a6a86', l: '#d2dcec', a: '#1f5fd0', on: '#ffffff', live: '#2f7d32' } }],
    ['sky', 'Sky Blue', 'Blues', 200, 50, '#7dd3fc', '#0369a1', 'Light and airy blue. Friendly, very readable on dark.'],
    ['azure', 'Azure', 'Blues', 212, 55, '#38a3ff', '#0b63c5', 'A touch brighter than your current blue. Same family, more punch.'],
    ['cobalt', 'Cobalt', 'Blues', 225, 60, '#5b7cff', '#1e40af', 'Deep, saturated blue with a richer navy ground.'],
    ['steel', 'Steel Blue', 'Blues', 210, 22, '#8fb4d9', '#3b5f86', 'Muted and professional. The calmest blue.'],
    ['electric', 'Electric Blue', 'Blues', 230, 65, '#4d6bff', '#2437d6', 'Vivid and modern. Strong on tiny elements.'],
    ['ice', 'Ice', 'Blues', 195, 35, '#bae6fd', '#0e7490', 'Pale ice blue. Subtle accent on dark.'],
    ['aqua', 'Aqua', 'More', 188, 55, '#22e0e0', '#0e8a8a', 'Bright aqua. Fresh and techy.'],
    ['jade', 'Jade', 'More', 160, 45, '#34d399', '#047857', 'Jewel green with a blue-green ground.'],
    ['magenta', 'Magenta', 'More', 320, 45, '#f43f9d', '#be185d', 'Hot magenta. Loud, confident.'],
    ['orchid', 'Orchid', 'More', 305, 35, '#d084e6', '#86198f', 'Soft orchid purple-pink.'],
    ['wine', 'Wine', 'More', 335, 40, '#e0527a', '#9f1239', 'Deep wine red. Elegant on dark.'],
    ['gold', 'Gold Leaf', 'More', 42, 30, '#e6c35c', '#8a6a00', 'Muted gold. Premium, editorial.'],
    ['sage', 'Sage', 'More', 120, 14, '#a3c9a8', '#3f6b47', 'Soft sage green on a quiet ground.'],
    ['mauve', 'Mauve', 'More', 290, 18, '#c4a1d9', '#6b3f82', 'Dusty mauve. Gentle and unusual.'],
    ['violet', 'Violet Night', 'Cool', 250, 45, '#8b7bff', '#5b46e5', 'Cool and creative. The only colour on the page, so it stands out on near-black blue.'],
    ['rose', 'Rose Plum', 'Cool', 285, 30, '#ff5c93', '#d6336c', 'Soft and friendly. Works well next to art and a sona section.'],
    ['cyan', 'Cyan Signal', 'Cool', 205, 55, '#4cc9f0', '#0a7ea4', 'Closest to the current blue site. Crisp and technical.'],
    ['mint', 'Mint Teal', 'Cool', 168, 50, '#3ee0b0', '#0b8f6a', 'Calm and fresh. The live dot turns amber so it never blends in.', '#ffd166'],
    ['lime', 'Lime Ink', 'Cool', 85, 35, '#c6f135', '#4d7c0f', 'Highest energy. Terminal heritage without green-on-black cliché.'],
    ['fuchsia', 'Fuchsia Neon', 'Cool', 295, 45, '#e879f9', '#a21caf', 'Loud and playful. Good for a creative, personality-first site.'],
    ['indigo', 'Indigo Dusk', 'Cool', 236, 48, '#818cf8', '#4338ca', 'Bluer than violet, a late-evening feel. Quiet and focused.'],
    ['crimson', 'Crimson Noir', 'Cool', 350, 38, '#ff4d5e', '#c81e3a', 'Dramatic red on warm black. Editorial and confident.'],
    ['solar', 'Solar Yellow', 'Cool', 48, 28, '#facc15', '#a16207', 'Pure yellow, no orange. Reads like a highlighter on dark.'],
    ['lavender', 'Lavender Mist', 'Cool', 265, 26, '#c4b5fd', '#6d28d9', 'Pastel and gentle. Lower energy, high polish.'],
    ['blue', 'Classic Blue', 'Classic', 220, 24, '#3b82f6', '#2563eb', 'The default, trustworthy blue. Safe for any audience.'],
    ['green', 'Classic Green', 'Classic', 150, 18, '#22c55e', '#15803d', 'Standard green. Pairs with an amber status dot.', '#ffd166'],
    ['red', 'Classic Red', 'Classic', 0, 14, '#ef4444', '#dc2626', 'Standard red. Strong, urgent, use sparingly.'],
    ['purple', 'Classic Purple', 'Classic', 275, 20, '#a855f7', '#7e22ce', 'Standard purple. Creative but conventional.'],
    ['teal', 'Classic Teal', 'Classic', 175, 20, '#14b8a6', '#0f766e', 'Standard teal. Calm, professional, easy to read.'],
  ];
  const OVR = { violet: { d: ['#0c0b1f', '#15132e', '#1f1c42'], l: ['#f6f5ff', '#ffffff', '#ecebff'] }, rose: { d: ['#1a1320', '#251a2e', '#34253f'], l: ['#fff5f8', '#ffffff', '#ffe8ef'] } };
  const PALS = RAW.map(([id, n, g, h, sat, ad, al, w, liveD, full]) => ({ id, n, g, h, sat, ad, al, w, liveD, full, c: [(full?.d.bg) || (OVR[id]?.d[0]) || `hsl(${h} ${sat}% 7%)`, ad, (full?.l.bg) || (OVR[id]?.l[0]) || `hsl(${h} 70% 97%)`] }));
  (function injectPalettes() {
    const css = PALS.map((p) => { if (p.full) { const f = (m) => `--c-bg:${m.bg};--c-surface:${m.s};--c-surface-2:${m.s2};--c-text:${m.t};--c-muted:${m.m};--c-line:${m.l};--c-accent:${m.a};--c-on:${m.on};--c-live:${m.live}`; return `html:root[data-palette=${p.id}][data-theme=dark]{${f(p.full.d)}}\nhtml:root[data-palette=${p.id}][data-theme=light]{${f(p.full.l)}}`; } const o = OVR[p.id], dk = o ? o.d : [`hsl(${p.h} ${p.sat}% 7%)`, `hsl(${p.h} ${Math.round(p.sat * .9)}% 11%)`, `hsl(${p.h} ${Math.round(p.sat * .8)}% 16%)`], lt = o ? o.l : [`hsl(${p.h} 70% 97%)`, '#ffffff', `hsl(${p.h} 55% 93%)`];
      return `html:root[data-palette=${p.id}][data-theme=dark]{--c-bg:${dk[0]};--c-surface:${dk[1]};--c-surface-2:${dk[2]};--c-text:hsl(${p.h} 40% 96%);--c-muted:hsl(${p.h} 20% 70%);--c-line:hsl(${p.h} 40% 96%/.14);--c-accent:${p.ad};--c-on:${ink(p.ad, true)};--c-live:${p.liveD || '#4cd48a'}}\n`
        + `html:root[data-palette=${p.id}][data-theme=light]{--c-bg:${lt[0]};--c-surface:${lt[1]};--c-surface-2:${lt[2]};--c-text:hsl(${p.h} 45% 11%);--c-muted:hsl(${p.h} 14% 38%);--c-line:hsl(${p.h} 45% 11%/.14);--c-accent:${p.al};--c-on:${ink(p.al, false)};--c-live:#1f8a4c}`; }).join('\n');
    const st = document.createElement('style'); st.id = 'pal-css'; st.textContent = css; document.head.appendChild(st);
  })();
  const CTR = [['soft', 'Soft'], ['low', 'Low'], ['medium', 'Medium'], ['medhigh', 'Med-high'], ['high', 'High']];
  const lsGet = (k, d) => { try { return localStorage.getItem(k) || d; } catch (e) { return d; } };
  const lsSet = (k, v) => { try { localStorage.setItem(k, v); } catch (e) {} };
  { const d = document.documentElement; d.dataset.palette = PALS.some((p) => p.id === lsGet('pal')) ? lsGet('pal') : 'cobalt'; d.dataset.contrast = CTR.some(([k]) => k === lsGet('ctr')) ? lsGet('ctr') : 'low'; if (['dark', 'light'].includes(lsGet('thm'))) d.dataset.theme = lsGet('thm'); }
  // ---------- Appearance: palette picker + fine-tune controls ----------
  const FACTORY = { hue: 1, sat: 100, lit: -7, hex: '', tb: 30, tint: 0, mb: 30, depth: -7, lift: 0, line: 60, radius: 36, glow: 43, fs: 94, motion: 0 };
  const DEF = { hue: 0, sat: 100, lit: 0, hex: '', tb: 0, tint: 0, mb: 0, depth: 0, lift: 0, line: 14, radius: 22, glow: 0, fs: 100, motion: 0 };
  let S = { ...FACTORY }; try { const raw = lsGet('cust', ''); if (raw) S = { ...DEF, ...JSON.parse(raw) }; } catch (e) { S = { ...FACTORY }; }
  const SL = [
    ['Accent', [['hue', 'Hue shift', -180, 180, '°'], ['sat', 'Saturation', 0, 200, '%'], ['lit', 'Lightness', -30, 30, '']]],
    ['Text', [['tb', 'Brightness', -40, 40, ''], ['tint', 'Colour tint (flashy text)', 0, 100, '%'], ['mb', 'Secondary text brightness', -30, 30, '']]],
    ['Surfaces', [['depth', 'Background depth', -20, 20, ''], ['lift', 'Surface separation', 0, 30, ''], ['line', 'Line strength', 0, 60, '%']]],
    ['Shape & feel', [['radius', 'Corner radius', 0, 36, 'px'], ['glow', 'Accent glow', 0, 100, '%'], ['fs', 'Text size', 85, 125, '%']]],
  ];
  const cvs = document.createElement('canvas').getContext('2d');
  const toRGB = (str) => { cvs.fillStyle = '#000'; cvs.fillStyle = String(str).trim(); const v = cvs.fillStyle; if (v[0] === '#') { const n = parseInt(v.slice(1), 16); return [n >> 16, (n >> 8) & 255, n & 255]; } return v.match(/[\d.]+/g).map(Number).slice(0, 3); };
  const hx = (c) => '#' + c.map((x) => Math.round(Math.max(0, Math.min(255, x))).toString(16).padStart(2, '0')).join('');
  const mixc = (a, b, t) => a.map((x, i) => x + (b[i] - x) * t);
  const rgb2hsl = ([r, g, b]) => { r /= 255; g /= 255; b /= 255; const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn; let h = 0, s = 0; const l = (mx + mn) / 2; if (d) { s = l > .5 ? d / (2 - mx - mn) : d / (mx + mn); h = mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; h *= 60; } return [h, s, l]; };
  const hsl2rgb = ([h, s, l]) => { const c = (1 - Math.abs(2 * l - 1)) * s, x = c * (1 - Math.abs((h / 60) % 2 - 1)), m = l - c / 2; const [r, g, b] = h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x]; return [(r + m) * 255, (g + m) * 255, (b + m) * 255]; };
  const lumc = ([r, g, b]) => { const f = (v) => { v /= 255; return v <= .03928 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4; }; return .2126 * f(r) + .7152 * f(g) + .0722 * f(b); };
  const OVERRIDES = ['--c-bg', '--c-surface', '--c-surface-2', '--c-text', '--c-muted', '--c-line', '--c-accent', '--c-on', '--r', '--r-s', '--glow'];
  function applyCustom() {
    const root = document.documentElement, st = root.style; OVERRIDES.forEach((v) => st.removeProperty(v)); st.fontSize = ''; root.dataset.motion = S.motion ? 'off' : 'on';
    const cs = getComputedStyle(root), g = (v) => toRGB(cs.getPropertyValue(v)); if (!cs.getPropertyValue('--c-bg').trim()) return;
    let bg = g('--c-bg'), sf = g('--c-surface'), s2 = g('--c-surface-2'), tx = g('--c-text'), mu = g('--c-muted'), ac = g('--c-accent');
    const W = [255, 255, 255], K = [0, 0, 0], set = (k, c) => st.setProperty(k, typeof c === 'string' ? c : hx(c));
    if (S.hex) ac = toRGB(S.hex);
    if (S.hue || S.sat !== 100 || S.lit) { const [h, s, l] = rgb2hsl(ac); ac = hsl2rgb([(h + S.hue + 360) % 360, Math.max(0, Math.min(1, s * S.sat / 100)), Math.max(.08, Math.min(.95, l + S.lit / 100))]); }
    if (S.hex || S.hue || S.sat !== 100 || S.lit) { set('--c-accent', ac); set('--c-on', lumc(ac) > .3 ? '#0b0b12' : '#ffffff'); }
    if (S.depth) { const t = Math.abs(S.depth) / 100, to = S.depth < 0 ? K : W; bg = mixc(bg, to, t); sf = mixc(sf, to, t); s2 = mixc(s2, to, t); set('--c-bg', bg); }
    if (S.lift) { sf = mixc(sf, tx, S.lift / 200); s2 = mixc(s2, tx, S.lift / 140); }
    if (S.depth || S.lift) { set('--c-surface', sf); set('--c-surface-2', s2); }
    let nt = tx; if (S.tb) nt = S.tb > 0 ? mixc(tx, W, S.tb / 100) : mixc(tx, bg, -S.tb / 100); if (S.tint) nt = mixc(nt, ac, S.tint / 100 * .55);
    if (S.tb || S.tint) set('--c-text', nt);
    let nm = mu; if (S.mb) nm = S.mb > 0 ? mixc(mu, W, S.mb / 100) : mixc(mu, bg, -S.mb / 100); if (S.tint) nm = mixc(nm, ac, S.tint / 100 * .3);
    if (S.mb || S.tint) set('--c-muted', nm);
    if (S.line !== 14) { const c = S.tb || S.tint ? nt : tx; set('--c-line', `rgba(${c.map(Math.round).join(',')},${S.line / 100})`); }
    if (S.radius !== 22) { st.setProperty('--r', S.radius + 'px'); st.setProperty('--r-s', Math.round(S.radius * .65) + 'px'); }
    if (S.glow) st.setProperty('--glow', S.glow + '%');
    if (S.fs !== 100) st.fontSize = (16 * S.fs / 100) + 'px';
  }
  const saveS = () => lsSet('cust', JSON.stringify(S));
  let drawerOpen = false, dtab = 'palette';
  const GROUPS = [['Current', 'Your current site'], ['Blues', 'Blues'], ['Cool', 'Cool'], ['Classic', 'Classic'], ['More', 'More colours']];
  const sliderRow = ([k, l, mn, mx, u]) => { const p = Math.round((S[k] - mn) / (mx - mn) * 100); return `<label class="srow"><span>${l}</span><output id="o-${k}">${S[k]}${u}</output><input type="range" min="${mn}" max="${mx}" value="${S[k]}" data-k="${k}" data-u="${u}" style="--p:${p}%"></label>`; };
  function drawerHTML() {
    const d = document.documentElement.dataset, cur = PALS.find((p) => p.id === d.palette) || PALS[0];
    const chip = (p) => `<button class="pchip ${d.palette === p.id ? 'on' : ''}" data-pal="${p.id}" data-tip="${p.n}" aria-label="${p.n}"><span class="pdot" style="--b:${p.c[0]};--a:${p.ad}"></span><em>${p.n.replace('Classic ', '')}</em></button>`;
    const pal = `${GROUPS.map(([g, t]) => `<div class="pgrp"><b class="mono muted small">${t}</b><div class="pgrid">${PALS.filter((p) => p.g === g).map(chip).join('')}</div></div>`).join('')}
      <p class="pnote" id="pnote"><b>${cur.n}</b> ${cur.w}</p>
      <div class="pp-row"><span class="mono muted small">Mode</span><span class="seg"><button data-thm="dark" class="${d.theme === 'dark' ? 'on' : ''}">Dark</button><button data-thm="light" class="${d.theme === 'light' ? 'on' : ''}">Light</button></span></div>
      <div class="pp-row"><span class="mono muted small">Contrast</span><span class="seg">${CTR.map(([k, l]) => `<button data-ctr="${k}" class="${d.contrast === k ? 'on' : ''}">${l}</button>`).join('')}</span></div>`;
    const fine = `<div class="pgrp"><b class="mono muted small">Exact accent colour</b><label class="hexrow"><input type="color" data-k="hex" value="${S.hex || hx(toRGB(getComputedStyle(document.documentElement).getPropertyValue('--c-accent') || '#6aa5ff'))}"><span class="mono small muted">${S.hex || 'from palette'}</span><button class="btn sm ghost" data-clearhex>Use palette</button></label></div>
      ${SL.map(([t, rows]) => `<div class="pgrp"><b class="mono muted small">${t}</b>${rows.map(sliderRow).join('')}</div>`).join('')}
      <label class="switch"><input type="checkbox" data-k="motion" ${S.motion ? 'checked' : ''}><i></i><span>Reduce motion</span></label>`;
    return `<aside class="drawer ${drawerOpen ? 'open' : ''}" id="drawer" aria-label="Appearance"><div class="dh"><b>Appearance</b><button class="tool" data-close aria-label="Close" data-tip="Close" data-tip-key="Esc">✕</button></div>
      <div class="dtabs"><button data-dtab="palette" class="${dtab === 'palette' ? 'on' : ''}">Palette</button><button data-dtab="fine" class="${dtab === 'fine' ? 'on' : ''}">Fine-tune</button></div>
      <div class="db" id="db">${dtab === 'palette' ? pal : fine}</div>
      <div class="df"><button class="btn sm ghost" data-reset data-tip="Back to your saved look" data-tip-sub="Cobalt, low contrast, rounded">Reset</button><button class="btn sm ghost" data-neutral data-tip="Clear every adjustment" data-tip-sub="Plain palette, no tuning">Neutral</button><button class="btn sm ghost" data-copy="json">Copy settings</button><button class="btn sm" data-copy="css">Copy CSS</button></div></aside>`;
  }
  const palPop = drawerHTML;
  function setTheme(t) { document.documentElement.dataset.theme = t; lsSet('thm', t); applyCustom(); document.querySelectorAll('[data-thm]').forEach((x) => x.classList.toggle('on', x.dataset.thm === t)); }
  const redraw = () => { const old = document.getElementById('drawer'); if (!old) return; const keep = old.querySelector('#db')?.scrollTop || 0; old.outerHTML = drawerHTML(); document.getElementById('db').scrollTop = keep; };
  const setDrawer = (o) => { drawerOpen = o; document.getElementById('drawer')?.classList.toggle('open', o); };
  addEventListener('keydown', (e) => { if (e.key === 'Escape') setDrawer(false); });
  document.addEventListener('click', (e) => {
    const q = (s) => e.target.closest(s), d = document.documentElement;
    if (q('#palbtn')) return setDrawer(!drawerOpen); if (q('[data-close]')) return setDrawer(false);
    const tab = q('[data-dtab]'); if (tab) { dtab = tab.dataset.dtab; return redraw(); }
    const pb = q('[data-pal]'); if (pb) { d.dataset.palette = pb.dataset.pal; lsSet('pal', pb.dataset.pal); S.hex = ''; saveS(); applyCustom(); document.querySelectorAll('#drawer [data-pal]').forEach((y) => y.classList.toggle('on', y === pb)); const pp = PALS.find((p) => p.id === pb.dataset.pal); document.getElementById('pnote').innerHTML = `<b>${pp.n}</b> ${pp.w}`; return; }
    const th = q('[data-thm]'); if (th) return setTheme(th.dataset.thm);
    const ct = q('[data-ctr]'); if (ct) { d.dataset.contrast = ct.dataset.ctr; lsSet('ctr', ct.dataset.ctr); applyCustom(); document.querySelectorAll('#drawer [data-ctr]').forEach((y) => y.classList.toggle('on', y === ct)); return; }
    if (q('[data-reset]')) { S = { ...FACTORY }; saveS(); applyCustom(); redraw(); return toast('Back to your saved look.'); }
    if (q('[data-neutral]')) { S = { ...DEF }; saveS(); applyCustom(); redraw(); return toast('All adjustments cleared.'); }
    if (q('[data-clearhex]')) { S.hex = ''; saveS(); applyCustom(); return redraw(); }
    const cp = q('[data-copy]'); if (cp) { const txt = cp.dataset.copy === 'json' ? JSON.stringify({ palette: d.dataset.palette, theme: d.dataset.theme, contrast: d.dataset.contrast, ...S }, null, 2) : ':root{\n' + [...d.style].filter((p) => p.startsWith('--')).map((p) => `  ${p}: ${d.style.getPropertyValue(p)};`).join('\n') + '\n}'; (navigator.clipboard?.writeText(txt) || Promise.reject()).then(() => toast('Copied to clipboard.')).catch(() => toast('Copy not available here.')); }
  });
  document.addEventListener('input', (e) => {
    const el = e.target.closest('#drawer [data-k]'); if (!el) return; const k = el.dataset.k;
    if (k === 'hex') S.hex = el.value; else if (k === 'motion') S.motion = el.checked ? 1 : 0; else { S[k] = +el.value; const o = document.getElementById('o-' + k); if (o) o.textContent = el.value + el.dataset.u; el.style.setProperty('--p', Math.round((el.value - el.min) / (el.max - el.min) * 100) + '%'); }
    saveS(); applyCustom();
  });
  document.addEventListener('dblclick', (e) => { const el = e.target.closest('#drawer input[type=range]'); if (!el) return; S[el.dataset.k] = DEF[el.dataset.k]; saveS(); applyCustom(); redraw(); });
  applyCustom();

  // ---------- Personal page (patterned on ToastyHub: avatar hero, about, sona, styles/gallery, music, interests) ----------
  C.main = { t: 'Hoodie weather', src: 'assets/sona/hoodie.webp', thumb: 'assets/sona/hoodie-crop.webp', r: '1300/677' };
  C.gallery = [
    { t: 'Reference sheet', src: 'assets/sona/ref-full.webp', r: '1900/1182', cap: 'The whole sheet' }, { t: 'Headshot', src: 'assets/sona/headshot.webp', r: '1200/1101' },
    { t: 'Sunset by the sea', src: 'assets/sona/beach.webp', r: '1400/868' }, { t: 'Kiss on the cheek', src: 'assets/sona/kiss.webp', r: '2000/665' }, { t: 'Golden hour', src: 'assets/sona/bedroom.webp', r: '1600/525' },
  ];
  const LB = () => [C.main, ...C.gallery];
  const HI = { code: '<path d="m16 18 6-6-6-6M8 6l-6 6 6 6"/>', shield: '<path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6l-8-3Z"/><path d="m9 12 2 2 4-4"/>', mountain: '<path d="m2 20 7-12 4 6 3-4 6 10H2Z"/><path d="m9 8 1.8 3"/>', climb: '<path d="M12 21V4M7 9l5-5 5 5M5 14h4M15 17h4M6 20h3"/>', pad: '<rect x="2" y="7" width="20" height="11" rx="5.5"/><path d="M7 12.5h4M9 10.5v4"/><circle cx="16" cy="11.5" r=".9"/><circle cx="18.2" cy="13.5" r=".9"/>' };
  C.hobbies = [
    { t: 'Software engineering', icon: 'code', tags: [] }, { t: 'Ethical hacking', icon: 'shield', tags: [] },
    { t: 'Mountaineering', icon: 'mountain', tags: ['Großglockner', 'Matterhorn'] }, { t: 'Rock climbing', icon: 'climb', tags: ['7c'] }, { t: 'Gaming', icon: 'pad', tags: [] },
  ];
  C.music = [{ t: '[Track one]', a: '[Artist]', al: '[Album]', p: 94, h: [255, 300], vid: '' }, { t: '[Track two]', a: '[Artist]', al: '[Album]', p: 71, h: [190, 230] }, { t: '[Track three]', a: '[Artist]', al: '[Album]', p: 58, h: [330, 20] }, { t: '[Track four]', a: '[Artist]', al: '[Album]', p: 40, h: [150, 190] }, { t: '[Track five]', a: '[Artist]', al: '[Album]', p: 33, h: [40, 80] }];
  C.artists = [['[Artist one]', 93, [255, 300]], ['[Artist two]', 71, [190, 230]], ['[Artist three]', 52, [330, 20]], ['[Artist four]', 38, [150, 190]], ['[Artist five]', 27, [40, 80]]];
  SPEC.music = { title: 'track', list: () => C.music, f: [['link', 'YouTube Music link (paste, the cover loads by itself)'], ['t', 'Track'], ['a', 'Artist'], ['al', 'Album']] };
  const ytId = (u) => (String(u).match(/(?:v=|youtu\.be\/|\/embed\/|\/shorts\/)([\w-]{11})/) || [])[1] || '';
  const ytCover = (vid) => `https://i.ytimg.com/vi/${vid}/hqdefault.jpg`;
  SPEC.gallery = { title: 'gallery item', list: () => C.gallery, f: [['t', 'Title'], ['cap', 'Caption (optional)']] };
  SPEC.hobby = { title: 'hobby', list: () => C.hobbies, f: [['t', 'Name'], ['tags', 'Details (comma separated)']] };
  const NOTE = '<svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18V6l10-2v12"/><circle cx="6.5" cy="18" r="2.5"/><circle cx="16.5" cy="16" r="2.5"/></svg>';
  const IC = { telegram: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21.5 3 2.5 10.5l6 2.2 2.3 6.8 3.2-4.2 5 3.7L21.5 3ZM8.5 12.7 18 6.5"/></svg>', paw: '<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><ellipse cx="6.5" cy="10" rx="2" ry="2.7"/><ellipse cx="10.5" cy="5.8" rx="2" ry="2.7"/><ellipse cx="15.5" cy="5.8" rx="2" ry="2.7"/><ellipse cx="19" cy="10" rx="2" ry="2.7"/><path d="M12.5 11c-3 0-6 3.2-6 6 0 2 1.5 3 3 3 1.2 0 2-.5 3-.5s1.8.5 3 .5c1.5 0 3-1 3-3 0-2.800-3-6-6-6Z"/></svg>', discord: '<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M19.5 5.5A16 16 0 0 0 15.6 4.3l-.5 1a15 15 0 0 0-4.200 0l-.5-1A16 16 0 0 0 6.500 5.500C4 9.200 3.300 12.800 3.600 16.300a16 16 0 0 0 4.800 2.400l1-1.600a10 10 0 0 1-1.600-.8l.4-.3a11 11 0 0 0 9.600 0l.4.3a10 10 0 0 1-1.600.8l1 1.600a16 16 0 0 0 4.800-2.400c.4-4-.6-7.600-2.900-10.800ZM9.300 14.200c-.9 0-1.600-.8-1.600-1.800s.7-1.800 1.600-1.800 1.600.8 1.600 1.800-.7 1.800-1.600 1.800Zm5.400 0c-.9 0-1.600-.8-1.600-1.800s.7-1.800 1.600-1.800 1.600.8 1.600 1.800-.7 1.800-1.600 1.800Z"/></svg>' };
  const FIND = [['Discord', 'woofiowo', IC.discord, '#/contact'], ['Telegram', '@WolfiOwO', IC.telegram, 'https://t.me/WolfiOwO'], ['Barq', '@Woofi', IC.paw, '#/contact']];
  C.favs = { films: ['Who Am I', 'Jigsaw / Scream series', 'Documentaries', 'The Rookie'], games: ['Dead by Daylight', 'FNAF series', 'Winter Resort Simulator 2', 'Bloons TD6', 'Phasmophobia', 'GTA 5', 'Rainbow Six Siege'], interests: ['Computer science', 'Geology', 'Natural sciences (physics, chemistry)'], music: 'Everything, really.' };
  SPEC.fav = { title: 'favourites', list: () => [C.favs], f: [['interests', 'Other interests (comma separated)', 'area'], ['films', 'Films (comma separated)', 'area'], ['games', 'Games (comma separated)', 'area']] };
  const favHTML = () => `<div class="card"><span class="fico">${HI.climb ? '' : ''}</span><h3>Other interests</h3><div class="tags big">${C.favs.interests.map(tag).join('')}</div>${pen('fav', 0)}</div>
    <div class="card"><h3>Favourite films</h3><div class="tags big">${C.favs.films.map(tag).join('')}</div></div>
    <div class="card"><h3>Favourite games</h3><div class="tags big">${C.favs.games.map(tag).join('')}</div></div>
    <div class="card"><h3>Music</h3><p class="muted">${C.favs.music}</p><a class="btn sm ghost" href="#/personal">See what's on repeat ↓</a></div>`;
  let aboutStyle = 'card';
  const aboutHTML = (st) => {
    if (st === 'story') return `<p class="lead big2">I'm Wolfi, a wolf from Carinthia who builds software and climbs things for fun.</p>
      <p class="lead">Free time belongs to the mountains and the climbing wall, evenings to horror games, documentaries and whatever music comes next. I like knowing how things work: computers first, then rocks, then physics and chemistry.</p>
      <p class="lead">Strip all of that away and what's left is: <b>cute, silly, lazy, gay AF, beautiful, loving, smart, dumb</b>. Depending on the day, in that order or the other.</p>
      <p class="muted">Want to know more? Write me, I'm happy about every message ^w^</p>`;
    if (st === 'home') return `<p class="lead">${C.bio}</p><p class="lead">Outside of work you'll find me on a mountain, on a climbing wall, or deep in a game. More about all of that right below.</p><p class="muted">Write me anytime ^w^</p>`;
    const row = (k, v) => `<div><dt><i></i>${k}</dt><dd>${v}</dd></div>`;
    return `<dl class="profile">${row('Name', 'Wolfi')}${row('Pronouns', 'he / him')}${row('From', 'Carinthia, Austria')}${row('Hobbies', 'Mountaineering, climbing')}${row('Music', 'Everything')}${row('Also into', C.favs.interests.join(', '))}${row('Films', C.favs.films.join(', '))}${row('Games', C.favs.games.join(', '))}</dl><p class="muted profile-f">If you want to know more about me, write me a message. I'm happy about every one ^w^</p>`;
  };
  document.addEventListener('click', (e) => { const b = e.target.closest('[data-about]'); if (!b) return; aboutStyle = b.dataset.about; document.querySelectorAll('[data-about]').forEach((x) => x.classList.toggle('on', x === b)); const el = document.getElementById('about-body'); el.classList.add('swap'); setTimeout(() => { el.innerHTML = aboutHTML(aboutStyle); el.classList.remove('swap'); }, 160); });
  const avatar = (sz = '') => `<div class="avatar ${sz}"><img src="assets/sona/icon.gif" alt="Woofi, my sona"></div>`;
  P['/personal'] = () => `<section class="phero"><div class="ptxt"><span class="kicker mono">Beyond the code</span><h1>The person<br>behind the <em>code</em>.</h1>
      <p class="lead">Placeholder copy: replace with your own words. A few things I love outside of work: my sona, the mountains, the climbing wall and a good game.</p>
      <div class="chips"><button>Sona</button><button>Mountains</button><button>Climbing</button><button>Gaming</button></div></div>${avatar()}</section>
    <section>${sec('', 'About me')}<div class="about-wrap"><div class="seg about-seg" data-tip="Mockup only" data-tip-sub="Pick the description style you like"><button data-about="card" class="${aboutStyle === 'card' ? 'on' : ''}">Profile card</button><button data-about="story" class="${aboutStyle === 'story' ? 'on' : ''}">Story</button><button data-about="home" class="${aboutStyle === 'home' ? 'on' : ''}">Like the homepage</button></div>
      <div class="card about" id="about-body">${aboutHTML(aboutStyle)}</div></div></section>
    <section>${sec('', 'Meet my sona')}<div class="sona card"><button class="sheet-img" data-light="0" data-tip="Click to enlarge" data-tip-sub="Hoodie weather"><img src="${C.main.thumb || C.main.src}" alt="Woofi in a purple hoodie" loading="lazy"><span class="zoom"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/></svg></span></button><div class="sona-d"><h3>Woofi</h3><p class="mono muted small">Wolf</p>
      <p class="lead">Shy, loves software engineering and rock climbing.</p><div class="swatches">${[['Slate', '#5d6376'], ['Steel', '#476a7d'], ['Ice', '#96d1e1'], ['Ink', '#262626'], ['Lavender', '#d4daf0'], ['Salmon', '#e3978b']].map(([n, c]) => `<span style="--c:${c}" data-tip="${n}" data-tip-meta="${c}"><i></i>${n}</span>`).join('')}</div>
      <p class="muted small">His own colours. The Cobalt and Steel Blue palettes of this site were picked to sit next to them.</p>
      <div class="findme"><span class="mono muted small">Find me</span>${FIND.map(([n, v, ic, href]) => `<a class="fm" href="${href}"${href.startsWith('http') ? ' target="_blank" rel="noreferrer"' : ''} data-tip="${n}" data-tip-meta="${v}">${ic}<span>${v}</span></a>`).join('')}</div></div></div></section>
    <section>${sec('', 'More images', 'gallery')}<p class="muted small gal-n">Click any image to open it in full.</p><div class="masonry">${C.gallery.map((g, i) => `<figure class="tile" data-light="${i + 1}" data-tip="Click to enlarge" data-tip-sub="${g.t}" style="--r:${g.r}">${pen('gallery', i)}<img src="${g.thumb || g.src || 'assets/sona/headshot.webp'}" alt="${g.t}" loading="lazy"><span class="zoom"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/></svg></span><figcaption><b>${g.t}</b>${g.cap ? `<span class="muted small">${g.cap}</span>` : ''}</figcaption></figure>`).join('')}</div></section>
    <section>${sec('', 'On repeat')}<div class="music">
      <div class="card np"><div class="cover big" style="--h1:${C.music[0].h[0]};--h2:${C.music[0].h[1]}">${C.music[0].vid ? `<img class="yt" src="${ytCover(C.music[0].vid)}" alt="">` : NOTE}<i class="vinyl"></i></div>
        <div class="np-d"><span class="live-tag"><em class="eq"><i></i><i></i><i></i><i></i></em>Now playing on YouTube Music</span><h3>${C.music[0].t}</h3><p class="muted">${C.music[0].a} · ${C.music[0].al}</p>
          <div class="prog"><i></i></div><div class="prog-t mono muted small"><span>1:48</span><span>3:12</span></div>
          <div class="btns"><a class="btn sm" href="#/personal"><svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M8 5v14l11-7z"/></svg> Play on YouTube Music</a><a class="btn sm ghost" href="#/personal">My playlist ↗</a></div></div></div>
      <div class="card"><h3>Top artists this month</h3><div class="artists">${C.artists.map(([n, p, h], i) => `<a class="artist" href="#/personal"><span class="cover round" style="--h1:${h[0]};--h2:${h[1]}">${NOTE}</span><b>${n}</b><em class="mono muted small">${p} plays</em></a>`).join('')}</div></div>
      <div class="card tracks-c"><div class="tracks-h"><h3>Most played tracks</h3><span class="mono muted small">Sample data, replace with your playlist</span></div><ol class="tracks">${C.music.map((m, i) => `<li>${pen('music', i)}<span class="mono muted rk">${String(i + 1).padStart(2, '0')}</span><span class="cover sm" style="--h1:${m.h[0]};--h2:${m.h[1]}">${m.vid ? `<img class="yt" src="${ytCover(m.vid)}" alt="">` : NOTE}<span class="play"><svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M8 5v14l11-7z"/></svg></span></span><span class="tt"><b>${m.t}</b><em>${m.a}</em></span><span class="al muted">${m.al}</span><span class="bar"><i style="--w:${m.p}%"></i></span><span class="mono muted small pl">${m.p} plays</span></li>`).join('')}</ol></div>
    </div></section>
    <section>${sec('', 'Hobbies', 'hobby')}<div class="hobbies">${C.hobbies.map((h, i) => `<article class="card hobby" style="--i:${i}">${pen('hobby', i)}<span class="hico"><svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">${HI[h.icon] || HI.code}</svg></span><h3>${h.t}</h3>${h.tags.length ? `<div class="tags">${h.tags.map(tag).join('')}</div>` : ''}</article>`).join('')}</div></section>
    <section>${sec('', 'Favourites', 'fav')}<div class="fav">${favHTML()}</div></section>
    <section class="cta-band"><h2>Say hi, whatever the reason.</h2><p>Work, art, a game night or just a good song recommendation.</p><a class="btn" href="#/contact">Get in touch</a></section>`;
  function showLightbox(idx) {
    const list = LB(), n = list.length, i = (idx + n) % n, g = list[i]; let m = document.querySelector('.modal.lb');
    if (!m) { document.querySelector('.modal')?.remove(); m = document.createElement('div'); m.className = 'modal lb'; document.body.appendChild(m); requestAnimationFrame(() => m.classList.add('in')); m.onclick = (ev) => { if (ev.target === m || ev.target.closest('[data-x]')) closeLb(); const nx = ev.target.closest('[data-lbstep]'); if (nx) showLightbox(+m.dataset.i + +nx.dataset.lbstep); }; }
    m.dataset.i = i;
    m.innerHTML = `<div class="lightbox" role="dialog" aria-modal="true" aria-label="${g.t}"><button class="lbnav prev" data-lbstep="-1" aria-label="Previous">‹</button><img src="${g.src}" alt="${g.t}"><button class="lbnav next" data-lbstep="1" aria-label="Next">›</button><div class="sheet-h"><div><h3>${g.t}</h3>${g.cap ? `<span class="mono muted small">${g.cap}</span>` : ''}</div><span class="mono muted small">${i + 1} / ${n}</span><button class="tool" data-x aria-label="Close">✕</button></div></div>`;
  }
  function closeLb() { const m = document.querySelector('.modal.lb'); if (m) { m.classList.remove('in'); setTimeout(() => m.remove(), 200); } }
  document.addEventListener('click', (e) => { const t = e.target.closest('[data-light]'); if (!t || e.target.closest('.ctl')) return; showLightbox(+t.dataset.light); });
  addEventListener('keydown', (e) => { if (!document.querySelector('.modal.lb')) return; if (e.key === 'Escape') closeLb(); if (e.key === 'ArrowRight') showLightbox(+document.querySelector('.modal.lb').dataset.i + 1); if (e.key === 'ArrowLeft') showLightbox(+document.querySelector('.modal.lb').dataset.i - 1); });

  function openAI() {
    document.querySelector('.modal')?.remove(); const A = C.ai, [lab, cls] = aiLevel(A.score), m = document.createElement('div'); m.className = 'modal';
    m.innerHTML = `<div class="sheet ai" role="dialog" aria-modal="true"><div class="sheet-h"><div><span class="kicker mono">Content transparency</span><h3>How much of this site is AI-written?</h3></div><button class="tool" data-x aria-label="Close">✕</button></div>
      <div class="ai-top"><div class="gauge big ${cls}" style="--v:${A.score}"><b>${A.score}%</b><span class="mono small">${lab}</span></div>
        <p class="muted">An automated detector reads the visible text of every page and estimates how likely it is to be machine-generated. Lower is more human. <b>It is an estimate, not proof</b>: detectors flag clear technical writing and non-native English by mistake, and they cannot see code.</p></div>
      <div class="ai-pages">${A.pages.map(([n, v]) => `<div class="aip"><span>${n}</span><span class="bar"><i class="${aiLevel(v)[1]}" style="--w:${Math.max(v, 2)}%"></i></span><span class="mono small muted">${v}%</span></div>`).join('')}</div>
      <p class="mono muted small">Checked ${A.checked} · ${A.provider}<br>Sample numbers in this mockup. A real run needs a detector API key.</p>
      <div class="sheet-f"><button class="btn sm ghost" data-x>Close</button><button class="btn sm" data-recheck>Re-check now</button></div></div>`;
    document.body.appendChild(m); requestAnimationFrame(() => m.classList.add('in'));
    m.onclick = (e) => { if (e.target === m || e.target.closest('[data-x]')) { m.classList.remove('in'); setTimeout(() => m.remove(), 200); } const r = e.target.closest('[data-recheck]'); if (r) { r.textContent = 'Checking…'; r.disabled = true; setTimeout(() => { r.textContent = 'Re-check now'; r.disabled = false; toast('Checked just now. Score unchanged.'); }, 1400); } };
  }
  document.addEventListener('click', (e) => { if (e.target.closest('[data-ai]')) openAI(); const r = e.target.closest('[data-recheck-admin]'); if (r) { r.textContent = 'Checking…'; r.disabled = true; setTimeout(() => { r.textContent = 'Run check now'; r.disabled = false; toast('Check finished. Scores unchanged.'); }, 1500); } });

  function shell(path, body) {
    const nav2 = sessionStorage.getItem('found') ? [...NAV, ['/secret', 'Ein neues Geheimnis?! ♥']] : NAV;
    const links = nav2.map(([h, l]) => `<a href="#${h}" class="${h === path ? 'on' : ''}">${l}</a>`).join('');
    const foot = FOOT.map(([h, l]) => `<a href="#${h}">${l}</a>`).join('');
    const tools = `<button class="tool lang" id="lang" data-tip="Language" data-tip-sub="English · click for Deutsch" aria-label="Language"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m5 8 6 6"/><path d="m4 14 6-6 2-3"/><path d="M2 5h12"/><path d="M7 2h1"/><path d="m22 22-5-10-5 10"/><path d="M14 18h6"/></svg><b>EN</b></button><button class="tool" id="theme" data-tip="Theme" data-tip-sub="Switch light and dark" aria-label="Theme"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="12" rx="2"/><path d="M8 20h8M12 16v4"/></svg></button><button class="tool lockbtn" id="lock" data-tip="Admin" data-tip-sub="Sign in to edit the site" aria-label="Admin login"><span class="ic ic-lock"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4.5" y="11" width="15" height="10" rx="2.5"/><path d="M8 11V7.5a4 4 0 0 1 8 0V11"/></svg></span><span class="ic ic-out"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/></svg></span></button>`;
    const hnav = [['/projects', 'Projects'], ['/services', 'Services'], ['/personal', 'Personal']].map(([h, l]) => `<a href="#${h}" class="${h === path ? 'on' : ''}">${l}</a>`).join('');
    const top = `<header class="topbar ${sessionStorage.getItem(SECRET_KEY) === 'true' ? 'has-secret' : ''}"><a class="brand" href="#/"><span class="logo-w">W</span><span class="bname"><b>Woofi</b>-Developments</span></a><nav>${hnav}${sessionStorage.getItem(SECRET_KEY) === 'true' ? secretLink(path) : ''}</nav><div class="tools">${tools}</div></header>`;
    const bottom = `<footer class="bottombar"><div class="fl">© 2026 Woofi-Developments<br>All Rights Reserved.</div><a class="buildchip" href="#/" data-tip="Source on GitHub" data-tip-sub="Wolfi-OwO/portfolio-webpage" data-tip-meta="v6.5.0 · MIT licence"><svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m16 18 6-6-6-6M8 6l-6 6 6 6"/></svg>Wolfi-OwO/portfolio-webpage<i>·</i><span>v6.5.0</span></a><nav class="fr"><a href="#/status" data-tip="All systems operational" data-tip-meta="checked 12 s ago"><em class="live-dot"></em>Status</a><a href="#/privacy">Privacy Policy</a><a href="#/impressum">Impressum</a><a href="#/contact">Contact</a></nav></footer>`;
    const palFab = `<button class="palfab" id="palbtn" aria-label="Colour palette" data-tip="Change colours" data-tip-sub="Palette, mode and contrast" data-tip-meta="mockup control, not on the live site"><span class="sw3 mini">${PALS.filter((p, i) => i % 3 === 0 && i < 30).slice(0, 8).map((p) => `<i style="background:${p.ad}"></i>`).join('')}</span>Appearance<small>mockup only</small></button>`;
    const ebar = `<div class="editbar"><b>Editing</b><span class="mono muted small">changes save straight to the database</span><span class="sp"></span><a class="btn sm ghost" href="#/admin">Admin ↗</a><button class="btn sm ghost" data-edit="career:new">+ Career</button><button class="btn sm ghost" data-edit="timeline:new">+ Availability</button><button class="btn sm ghost" data-edit="service:new">+ Service</button><button class="btn sm ghost" data-edit="project:new">+ Project</button><button class="btn sm" id="done">Done</button></div>`;
    return `<div class="progress"></div>${palPop()}<div class="umenu" id="umenu" hidden><a href="#/admin" data-go="messages">Messages <em>2</em></a><a href="#/admin" data-go="ai">AI check</a><button data-signout>Sign out</button></div><div class="ground"></div>${top}${palFab}<main class="page">${body}</main>${bottom}`;
  }

  function route() {
    const path = (location.hash.slice(1) || '/');
    const key = P[path] ? path : '404';
    document.getElementById('app').innerHTML = shell(path, P[key]());
    document.title = `Wolfi — ${path === '/' ? 'Fullstack Web Development' : path.slice(1)}  (Variant ${VAR.toUpperCase()})`;
    window.scrollTo(0, 0); bindHeat(); bindAdmin(); bindSecret(); document.documentElement.dataset.mode = document.documentElement.dataset.mode === 'on' && sessionStorage.getItem('adm') ? 'on' : 'off';
    $('#lock').onclick = () => { if (!sessionStorage.getItem('adm')) location.hash = '#/admin/login'; }; { const lk = $('#lock'), on = !!sessionStorage.getItem('adm'); lk.dataset.tip = on ? 'Signed in' : 'Admin'; lk.dataset.tipSub = on ? 'Menu: messages, AI check, sign out' : 'Sign in to edit the site'; } document.documentElement.dataset.auth = sessionStorage.getItem('adm') ? 'on' : 'off';
    const h1 = $('.hero h1'); if (h1) h1.innerHTML = h1.innerHTML.split('<br>').map((l, i) => `<span class="ln"><span style="--d:${i * 110}ms">${l}</span></span>`).join('');
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: .12 });
    document.querySelectorAll('.page > section, .page-h, .card, .crow, .cta-band, .tech, .tl li, .statusbar').forEach((el, i) => { el.setAttribute('data-r', ''); el.style.setProperty('--rd', (i % 4) * 70 + 'ms'); if (location.search.includes('static')) el.classList.add('in'); else io.observe(el); });
    document.querySelectorAll('.stat b, .gn').forEach((b) => { const m = b.textContent.match(/[\d.]+/); if (!m) return; const end = parseFloat(m[0]), dec = (m[0].split('.')[1] || '').length, tpl = b.textContent; let n = 0; const id = setInterval(() => { n++; const v = end * (1 - Math.pow(1 - n / 24, 3)); b.textContent = tpl.replace(m[0], (n >= 24 ? end : v).toFixed(dec)); if (n >= 24) clearInterval(id); }, 38); });
    const bar = $('.progress'); const upd = () => { bar.style.transform = `scaleX(${scrollY / Math.max(1, document.body.scrollHeight - innerHeight)})`; }; onscroll = upd; upd();
    $('#theme').onclick = () => setTheme(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark');
    $('#lang').onclick = (e) => { const b=e.currentTarget.querySelector('b'); b.textContent = b.textContent === 'EN' ? 'DE' : 'EN'; };
  }

  function boot() {
    const el = document.createElement('div'); el.className = 'boot mono'; document.body.appendChild(el);
    let i = 0, t = 0; const tick = () => {
      if (i >= C.boot.length) { setTimeout(() => el.remove(), 450); return; }
      const [k, x] = C.boot[i++]; const ts = `[${String(10 + (t++ % 3)).padStart(2, '0')}:41:0${i}.${200 + i * 37}]`;
      el.insertAdjacentHTML('beforeend', k === 'cmd' ? `<p><span class="acc">woofi@portfolio</span><span class="muted">:~$</span> ${x}</p>` : k === 'ready' ? `<p class="live">${x}</p>` : `<p class="muted"><span class="dim">${ts}</span> info: <span class="tx">${x}</span></p>`);
      setTimeout(tick, 280 + (i % 3) * 120);
    };
    el.onclick = () => el.remove(); tick();
  }
  window.addEventListener('hashchange', route); route();
  if (!sessionStorage.getItem('b' + VAR) && !location.search.includes('noboot')) { sessionStorage.setItem('b' + VAR, 1); boot(); }
})();
