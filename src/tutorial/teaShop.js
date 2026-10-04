// Step-by-step Tea Shop tutorial. Each step shows a complete map definition (`source`) plus
// handwritten `notes` that point at things on the map. Notes target { component | evolve | inertia | stage | point | ... } (see tutorial/geometry.js).
// `at` is where the note sits, in map coordinates [visibility, evolution].

const L = {
  title: 'title Tea Shop',
  // Step 1-5: only the value chain matters. Everything sits in the same stage and the position within it is
  // arbitrary (just to avoid overlaps).
  business0: 'anchor Business [product][95, 50]',
  cup0: 'component Cup of Tea [product][79, 50]',
  tea0: 'component Tea [product][63, 15]',
  kettle0: 'component Kettle [product][45, 85]',
  power0: 'component Power [product][10, 85]',
  links1: 'Business->Cup of Tea',
  links2: ['Cup of Tea->Tea', 'Cup of Tea->Kettle'],
  links3: 'Kettle->Power',
  // Evolved positions: [stage][visibility, position within stage].
  business: 'anchor Business [product][95, 77]',
  cup: 'component Cup of Tea [product][79, 70]',
  tea: 'component Tea [commodity][63, 37]',
  kettle: 'component Kettle [custom][43, 78]',
  power: 'component Power [commodity][10, 50]',
  evolve: 'evolve Kettle [product]',
  inertia: 'inertia Kettle',
};

const src = (...lines) => `${lines.flat().join('\n')}\n`;
const chain = [L.links1, ...L.links2, L.links3];

export const TEA_SHOP = {
  id: 'tea-shop',
  name: 'Tea Shop: from value chain to map',
  steps: [
    {
      title: "Let's map a cup of tea",
      body: [
        'A Wardley map shows how the parts of a service fit together, and how mature each part is.',
        "We'll build one for a simple tea shop, one step at a time. Use Next (or the arrow keys) to move along.",
      ],
      source: src(L.title),
      notes: [
        { text: 'Up: what the customer can see', at: [0.72, 0.22], target: { point: [0.9, 0] }, width: 140, curve: -0.15 },
        { text: 'Right: how evolved / standardised', at: [0.3, 0.55], target: { point: [0, 0.93] }, width: 160, curve: -0.15 },
      ],
    },
    {
      title: 'Start with the user',
      body: [
        'Every map starts with a user: who are we doing this for? Here it is the business that wants tea.',
        "They sit at the very top because they're the most visible thing - everything else exists to serve them.",
      ],
      source: src(L.title, L.business0),
      notes: [{ text: 'Who needs something?', at: [0.78, 0.28], target: { component: 'Business' }, width: 130 }],
    },
    {
      title: 'What do they need?',
      body: [
        'The business has a need: a cup of tea. Add it just below the user.',
        'Draw a line between them. A line means "depends on" - the business depends on the cup of tea.',
      ],
      source: src(L.title, L.business0, L.cup0, L.links1),
      notes: [
        { text: 'The need: a cup of tea', at: [0.68, 0.22], target: { component: 'Cup of Tea' }, width: 140 },
        { text: 'this line means "needs"', at: [0.8, 0.85], target: { link: ['Business', 'Cup of Tea'] }, width: 120, curve: 0.15 },
      ],
    },
    {
      title: 'What does that need?',
      body: [
        'Ask: what do we need to deliver a cup of tea? Tea, and a kettle to heat the water.',
        "I nudged them left and right so they don't overlap. Sideways position means nothing yet - only up and down matters.",
      ],
      source: src(L.title, L.business0, L.cup0, L.tea0, L.kettle0, L.links1, L.links2),
      notes: [
        { text: 'the ingredient', at: [0.5, 0.12], target: { component: 'Tea' }, width: 100 },
        { text: 'to heat the water', at: [0.3, 0.88], target: { component: 'Kettle' }, width: 120 },
      ],
    },
    {
      title: 'Keep digging',
      body: [
        'Ask the same question of every part. What does a kettle need? Power.',
        'Keep going until you reach something so ordinary that you take it for granted.',
      ],
      source: src(L.title, L.business0, L.cup0, L.tea0, L.kettle0, L.power0, chain),
      notes: [{ text: 'nobody orders tea for the electricity!', at: [0.24, 0.26], target: { component: 'Power' }, width: 150 }],
    },
    {
      title: "That's the value chain",
      body: [
        'Needs are stacked by visibility: the user can see a cup of tea, but never thinks about the power behind the kettle.',
        'Each part is held up by the parts beneath it. Getting this chain right comes before anything else.',
      ],
      source: src(L.title, L.business0, L.cup0, L.tea0, L.kettle0, L.power0, chain),
      notes: [
        { text: 'visible to the user', at: [0.86, 0.14], target: { point: [0.93, 0] }, width: 110, curve: 0.15 },
        { text: 'hidden infrastructure', at: [0.24, 0.12], target: { point: [0.09, 0] }, width: 110, curve: -0.15 },
      ],
    },
    {
      title: 'Now: how evolved is each part?',
      body: [
        'Left to right shows evolution. For each part, ask which stage it is in:',
        'Genesis: brand new and uncertain. Custom: built specially for you. Product: bought off the shelf, many to choose from. Commodity: standard, interchangeable, a utility.',
      ],
      source: src(L.title, L.business0, L.cup0, L.tea0, L.kettle0, L.power0, chain),
      notes: [
        { text: 'brand new, uncertain', at: [0.2, 0.09], target: { stage: 'genesis' }, width: 100, curve: 0.15 },
        { text: 'built just for you', at: [0.34, 0.3], target: { stage: 'custom' }, width: 100, curve: 0.15 },
        { text: 'off the shelf', at: [0.2, 0.52], target: { stage: 'product' }, width: 90, curve: 0.15 },
        { text: 'standard, a utility', at: [0.34, 0.88], target: { stage: 'commodity' }, width: 100, curve: 0.15 },
      ],
    },
    {
      title: 'Place Power',
      body: [
        'Start at the bottom. Electricity: is it new? No. Built specially for us? No. You plug in and pay for what you use.',
        'That is a utility, so Power goes in Commodity. Sideways, it moves to the right.',
      ],
      source: src(L.title, L.business0, L.cup0, L.tea0, L.kettle0, L.power, chain),
      notes: [{ text: 'standard, metered, everywhere', at: [0.3, 0.57], target: { component: 'Power' }, width: 140 }],
    },
    {
      title: 'Place Tea',
      body: [
        'Tea comes in standard bags from many suppliers and you can swap one for another. Another commodity.',
        'It is a bit less standardised than electricity, so it sits nearer the left of Commodity.',
      ],
      source: src(L.title, L.business0, L.cup0, L.tea, L.kettle0, L.power, chain),
      notes: [{ text: 'any supplier will do', at: [0.5, 0.92], target: { component: 'Tea' }, width: 110 }],
    },
    {
      title: 'Place Cup of Tea',
      body: [
        'What we sell is a cup of tea. Plenty of shops sell something similar and customers compare them on features and price.',
        'That makes it a Product.',
      ],
      source: src(L.title, L.business0, L.cup, L.tea, L.kettle0, L.power, chain),
      notes: [{ text: 'many shops, many choices', at: [0.72, 0.18], target: { component: 'Cup of Tea' }, width: 130 }],
    },
    {
      title: 'Place Kettle',
      body: [
        'Our kettle is a one-off that we had made for the shop. Nobody else has one like it, and we have to maintain it ourselves.',
        'That is Custom Built.',
      ],
      source: src(L.title, L.business0, L.cup, L.tea, L.kettle, L.power, chain),
      notes: [{ text: 'built just for us', at: [0.62, 0.12], target: { component: 'Kettle' }, width: 110 }],
    },
    {
      title: 'Place the user',
      body: [
        'Finally the user. Their position reflects how standard their need is: they just want an ordinary cup of tea.',
        'Now every part has a place on both axes.',
      ],
      source: src(L.title, L.business, L.cup, L.tea, L.kettle, L.power, chain),
      notes: [{ text: 'an ordinary, common need', at: [0.8, 0.3], target: { component: 'Business' }, width: 130 }],
    },
    {
      title: 'The map as text',
      body: [
        'Look at the definition on the left. A line like `component Tea [commodity][63, 37]` reads: the stage, then [how high up, how far through that stage], both from 0 to 100.',
        '0 is the left edge of the stage and 100 is the right edge, so a component can never end up in the wrong stage.',
      ],
      source: src(L.title, L.business, L.cup, L.tea, L.kettle, L.power, chain),
      notes: [{ text: '37: about a third of the way into Commodity', at: [0.5, 0.88], target: { component: 'Tea' }, width: 150 }],
    },
    {
      title: 'Maps show movement',
      body: [
        "Nothing stands still: competition and demand push parts to the right. Our custom kettle will become an off-the-shelf product one day.",
        'The red dashed arrow shows that expected move. `evolve Kettle [product]` means "towards the middle of Product".',
      ],
      source: src(L.title, L.business, L.cup, L.tea, L.kettle, L.power, chain, L.evolve),
      notes: [{ text: 'where the kettle is heading', at: [0.52, 0.76], target: { evolve: 'Kettle' }, width: 120 }],
    },
    {
      title: 'Inertia: what holds things back',
      body: [
        'Not everything is keen to move. We paid for that custom kettle and the staff know exactly how to use it, so there is resistance to swapping it for an ordinary one.',
        'That resistance is called inertia, drawn as a bar in the path of the component. `inertia Kettle` adds it. Spotting it early tells you where change will be slow.',
      ],
      source: src(L.title, L.business, L.cup, L.tea, L.kettle, L.power, chain, L.evolve, L.inertia),
      notes: [{ text: 'sunk cost and habit hold it back', at: [0.5, 0.8], target: { inertia: 'Kettle' }, width: 130 }],
    },
    {
      title: 'Your turn',
      body: [
        "That's a complete map: a value chain up and down, positioned by evolution left to right, with arrows for movement.",
        'Press Finish to keep it, then drag the components around or edit the text. Try asking: what if power became a service we had to build ourselves?',
      ],
      source: src(L.title, L.business, L.cup, L.tea, L.kettle, L.power, chain, L.evolve, L.inertia),
      notes: [],
    },
  ],
};
