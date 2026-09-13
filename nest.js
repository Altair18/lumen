/* Gloam local backend. The nest lives on this device. */
(function (w) {
  const KEY = 'gloam-nest-v3';
  const STORIES = [
    'I found a bakery window still warm. A crumb of sugar stuck to my feet. I brought the smell home.',
    'A porch light was on for nobody. I sat under it until the moth-shaped shadow felt like company.',
    'Rain tapped a tin roof. I counted seven taps and lost count on purpose.',
    'Someone left a library book on a bench. The page said only "and then they rested." I liked that ending.',
    'A cat blinked at me from a sill and decided I was not interesting. That felt like a compliment.'
  ];
  const DEFAULT_GOALS = [
    { id: 'bed', t: 'Get in bed 15 minutes earlier', s: 'Rest' },
    { id: 'water', t: 'Drink a glass of water', s: 'Fuel' },
    { id: 'read', t: 'Read one page of anything', s: 'Mind' },
    { id: 'jaw', t: 'Unclench your jaw', s: 'Body' },
    { id: 'window', t: 'Open a window for one minute', s: 'Air' }
  ];

  function day() { return new Date().toISOString().slice(0, 10); }
  function load() { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; } }
  function save(s) { localStorage.setItem(KEY, JSON.stringify(s)); return s; }

  function seed() {
    const s = load();
    s.hatched = !!s.hatched;
    s.name = s.name || 'Pip';
    s.stage = s.stage || 'Hatchling';
    s.traits = s.traits || ['Silly', 'Observant', 'Warm'];
    s.energy = s.energy || 0;
    s.sparks = s.sparks || 0;
    s.weather = s.weather || '';
    s.goals = Array.isArray(s.goals) && s.goals.length ? s.goals : DEFAULT_GOALS.slice();
    s.done = s.done || {};
    s.journal = s.journal || [];
    s.letters = s.letters || [];
    s.adventures = s.adventures || [];
    s.plus = !!s.plus;
    s.memory = s.memory || { lastGoal: '', lastWeather: '', lastVisit: day(), notes: [] };
    return save(s);
  }

  function reply(kind, extra) {
    const s = seed();
    const n = s.name;
    const w = s.weather || extra || 'quiet';
    const last = s.memory.lastGoal;
    const lines = {
      hatch: 'I am ' + n + '. I live in the lantern now. Tiny things are enough.',
      checkin: last
        ? 'You did ' + last.toLowerCase() + '. I felt the wick catch. That was plenty.'
        : 'Glad you came back. I kept a little warmth going.',
      weather: {
        Heavy: 'Heavy is allowed. I will sit still with you.',
        Tender: 'Tender weather. Soft wings today.',
        Steady: 'Steady. We can do one small thing and stop.',
        Light: 'Light as dust. Good for a short look outside.',
        Glowing: 'The glass is glowing. I might go walking when the lantern fills.'
      }[w] || 'The nest is quiet. That is a kind of weather too.',
      adventure: STORIES[s.adventures.length % STORIES.length],
      evening: 'I folded the day into a small letter. You were here. That is the whole plot.',
      sos: 'I am here. Drink water if you can. Sit down. You do not have to play. If you are in danger, US 988 or https://www.iasp.info/suicidalthoughts/'
    };
    if (kind === 'checkin' && /crisis|suicid|kill myself|want to die/i.test(String(extra || ''))) {
      return lines.sos;
    }
    return lines[kind] || lines.checkin;
  }

  async function live(kind, extra) {
    try {
      const r = await fetch('/api/companion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kind: kind, extra: extra, memory: seed().memory, name: seed().name, weather: seed().weather })
      });
      if (r.ok) {
        const j = await r.json();
        if (j && j.text) return j.text;
      }
    } catch (e) {}
    return reply(kind, extra);
  }

  function hatch(name) {
    const s = seed();
    s.hatched = true;
    s.name = (name || '').trim() || 'Pip';
    s.memory.notes.push({ d: day(), k: 'hatch' });
    return save(s);
  }
  function setWeather(w) {
    const s = seed();
    s.weather = w;
    s.memory.lastWeather = w;
    return save(s);
  }
  function toggleGoal(id) {
    const s = seed();
    const d = day();
    s.done[d] = s.done[d] || [];
    const g = s.goals.find(function (x) { return x.id === id; });
    const i = s.done[d].indexOf(id);
    if (i >= 0) s.done[d].splice(i, 1);
    else {
      s.done[d].push(id);
      s.energy = Math.min(3, s.energy + 1);
      s.sparks += 10;
      s.memory.lastGoal = g ? g.t : id;
      s.memory.notes.push({ d: d, k: 'goal', t: s.memory.lastGoal });
    }
    return save(s);
  }
  function addGoal(title, sub) {
    const s = seed();
    const t = (title || '').trim();
    if (!t) return s;
    s.goals.push({ id: 'g' + Date.now(), t: t, s: (sub || 'Care').trim() });
    return save(s);
  }
  function removeGoal(id) {
    const s = seed();
    s.goals = s.goals.filter(function (g) { return g.id !== id; });
    return save(s);
  }
  function addJournal(text) {
    const s = seed();
    const t = (text || '').trim();
    if (!t) return s;
    s.journal.unshift({ d: day(), t: t });
    s.memory.notes.push({ d: day(), k: 'journal' });
    return save(s);
  }
  function adventure() {
    const s = seed();
    if (s.energy < 3) return { s: s, story: '' };
    const story = reply('adventure');
    s.energy = 0;
    s.adventures.unshift({ d: day(), t: story });
    s.letters.unshift({ d: day(), t: reply('evening') });
    return { s: save(s), story: story };
  }
  function setPlus(on) {
    const s = seed();
    s.plus = !!on;
    return save(s);
  }
  function erase() { localStorage.removeItem(KEY); }

  w.Gloam = {
    seed: seed, save: save, day: day, reply: reply, live: live,
    hatch: hatch, setWeather: setWeather, toggleGoal: toggleGoal,
    addGoal: addGoal, removeGoal: removeGoal, addJournal: addJournal,
    adventure: adventure, setPlus: setPlus, erase: erase
  };
})(window);
