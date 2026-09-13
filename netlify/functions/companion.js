const CRISIS = /\b(suicid|kill myself|end my life|want to die|self[- ]?harm)\b/i;

const CHECKINS = {
  water: [
    'Water first. I heard it from here. The wick sat up a little.',
    'A glass. That is a whole weather change in a small kitchen.'
  ],
  bed: [
    'Fifteen minutes is a real door. I will keep the lantern dim.',
    'Rest is a care. I folded my wings for it.'
  ],
  read: [
    'One page is a journey I can smell from the glass.',
    'You read. I watched the dust float like tiny moths.'
  ],
  jaw: [
    'Unclenching counts. I unclenched a feeler too.',
    'Your jaw let go. The nest got quieter in a good way.'
  ],
  window: [
    'Outside air came in. I liked the cool edge of it.',
    'A minute of window is a dusk I can feel on the glass.'
  ],
  default: [
    'That tiny thing landed. I kept the warmth going.',
    'Glad you came back. I was not counting the hours.',
    'We can do tiny things. That is plenty.'
  ]
};

const ADVENTURES = [
  'I slipped toward a bakery window. Someone had left the light on for the bread. I brought the smell home. It is still on my wings.',
  'A hedge was full of leftover rain. I sat under one leaf until it ticked. The nest was exactly where I left it.',
  'Two foxes crossed the lane and pretended not to see me. I pretended too. Then I came back because the wick is ours.',
  'The postbox was warm from the afternoon. I listened to it tick. No letter for us. That is fine. We write our own.'
];

const LETTERS = [
  'Evening. I am still here. If today was thin, the lantern does not mind. Tomorrow can be one glass of water.',
  'I kept a little warmth going while you were elsewhere. Missed hours stay kind. Come back when you can.',
  'The nest smelled like paper and dust. I liked it. You do not have to earn a place on the sill.'
];

function pick(arr){return arr[Math.floor(Math.random()*arr.length)]}

exports.handler = async (event) => {
  const headers = {
    'content-type': 'application/json; charset=utf-8',
    'access-control-allow-origin': '*',
    'access-control-allow-headers': 'content-type'
  };
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers, body: '' };
  let body = {};
  try { body = JSON.parse(event.body || '{}'); } catch (e) { body = {}; }
  const surface = String(body.surface || 'checkin');
  const name = String(body.name || 'Pip').slice(0, 24);
  const goal = String(body.goal || '');
  const weather = String(body.weather || '');
  const textIn = String(body.text || '');

  if (CRISIS.test(textIn) || surface === 'sos') {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        source: 'safety',
        text: 'I am glad you said something. I cannot be your crisis line. If you are in danger, contact local emergency services. In the US call or text 988. International help: https://www.iasp.info/suicidalthoughts/'
      })
    };
  }

  let text;
  if (surface === 'adventure') text = pick(ADVENTURES);
  else if (surface === 'evening') text = pick(LETTERS);
  else if (surface === 'hatch') text = `I'm ${name}. I live in the lantern now. I kept a little warmth going while you answered. We can do tiny things. That is plenty.`;
  else {
    const pool = CHECKINS[goal] || CHECKINS.default;
    text = pick(pool);
    if (weather) text += ' The weather inside is ' + weather.toLowerCase() + '.';
  }

  return { statusCode: 200, headers, body: JSON.stringify({ source: 'mock', text }) };
};
