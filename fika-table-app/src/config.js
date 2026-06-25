export const CONFIG = {
  newsletter:    'Stef\'s Dev Notes',
  hostName:      'Stef',
  hostHandle:    '@stefanialarisa',
  substackUrl:   'https://substack.com/@stefanialarisa',
  sliceCapacity: 12,
  dateRange:     'Fresh cake every week · oven\'s always on',

  // Welcome page
  welcomeEyebrow:   'Where Substack writers & readers meet',
  welcomeHeadline:  ['Pull up', 'a chair'],
  welcomeLede: [
    'Fika is a Swedish ritual meant to create a relaxing pause for socializing or recharge. The best part is that it\'s filled with sweet baked goods and coffee.',
    'Here you can try a different type of Fika, where each week the cake\'s cut into slices and one has your name on it.',
    'To get your slice, send one kind word for someone whose words you\'re grateful for.',
  ],
  giveModalSub:     'A kind word for someone, or one for the whole table.',
  welcomeFineprint:  'Your word stays visible to everyone at the table all week. Share your best appreciation!',
  welcomeCTA:        'Pour a coffee, take a slice',
  welcomeGhostCTA:   'See who\'s at the table',

  // Cake page
  cakeEyebrow:  '— Pull up a chair —',
  cakeHeadline: ['Pour a coffee,', 'take a slice'],
  cakeSubhead:  'Leave it on the table, or pass it to someone you appreciate.',
  cakeCTA:      'Take a slice',
  cakeFullBannerText: 'This week\'s cake is all gone — every slice taken. Check back next week!',

  // Shared footer
  footerScript: 'the table\'s always set',
  footerSub:    'Pull up a chair whenever you like — there\'s always more coffee.',
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
  host:   'the host',
  writer: 'a writer',
  reader: 'a fellow reader',
  friend: 'a friend',
  anyone: 'the table',
};

export const TYPE_LABEL = {
  writer: 'for a writer',
  reader: 'for a reader',
  friend: 'for a friend',
  host:   'for the host',
  anyone: 'left on the table',
};
