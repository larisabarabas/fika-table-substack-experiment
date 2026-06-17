export const CONFIG = {
  newsletter:    'Stef\'s Dev Notes',
  hostName:      'Stef',
  hostHandle:    '@stefanialarisa',
  dateRange:     'June 2026 · thirty candles',
  age:           30,
  sliceCapacity: 30,

  // Welcome page copy
  welcomeEyebrow:  "Stef's Birthday Month",
  welcomeHeadline: ['The candles', 'are lit'],
  welcomeLede:     'Stef turned thirty on the 11th. The cake is cut into thirty slices, and one of them is for you. There is one catch: one kind word, for anyone at the table.',
  welcomeFineprint: 'No gifts, no fuss — just one kind word, passed around a table.',

  // Cake page copy
  cakeHeadline: ['Cut yourself a', 'slice'],
  cakeSubhead:  'Stef turned thirty. The cake\'s big enough for everyone — readers, writers, lurkers, friends. The only catch: a slice costs one kind word. Leave it for me, or pass it to someone else at the table.',
  footerSub:    'Thank you for celebrating this anniversary with me. Here\'s to more cake!',
};

// Pastel values as JS strings — needed for SVG fills and confetti
export const PASTELS = [
  'oklch(0.86 0.052 18)',
  'oklch(0.88 0.055 55)',
  'oklch(0.90 0.05  96)',
  'oklch(0.87 0.045 150)',
  'oklch(0.88 0.05  178)',
  'oklch(0.86 0.05  232)',
  'oklch(0.85 0.052 300)',
  'oklch(0.86 0.052 342)',
];

export const TO_NAME_FALLBACK = {
  host:   'Stef',
  writer: 'a writer',
  reader: 'a fellow reader',
  anyone: 'the table',
};

export const TYPE_LABEL = {
  writer: 'for a writer',
  reader: 'for a reader',
  host:   'for the birthday girl',
  anyone: 'left on the table',
};
