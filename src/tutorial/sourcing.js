import { src } from './util.js';

// Tutorial: build / buy / outsource, then inertia. Uses the finished tea shop positions.
const base = [
  'title Tea Shop',
  'anchor Business [product][95, 77]',
  'component Cup of Tea [product][79, 70]',
  'component Tea [commodity][63, 37]',
  'component Kettle [custom][43, 78]',
  'component Power [commodity][10, 50]',
  'Business->Cup of Tea',
  'Cup of Tea->Tea',
  'Cup of Tea->Kettle',
  'Kettle->Power',
];

export const SOURCING = {
  id: 'sourcing',
  name: 'Build, buy or outsource, and inertia',
  steps: [
    {
      title: 'How do we get each part?',
      body: [
        'A map shows what you need and how evolved it is. The next question is how you will get each part: make it yourself, buy it, or have someone else run it.',
        'Three statements record the answer: `build`, `buy` and `outsource`. Each draws a ring round the component.',
      ],
      source: src(base),
      notes: [{ text: 'how will we get the kettle?', at: [0.3, 0.1], target: { component: 'Kettle' }, width: 130 }],
    },
    {
      title: 'Build',
      body: [
        '`build Kettle` means we make it ourselves. It is shown with a dashed ring.',
        'Building makes sense in Genesis and Custom Built, where doing it yourself can give you an edge. Our kettle is a one-off, so it fits.',
      ],
      source: src(base, 'build Kettle'),
      notes: [{ text: 'a dashed ring: we build it', at: [0.62, 0.1], target: { component: 'Kettle' }, width: 120 }],
    },
    {
      title: 'Buy',
      body: [
        '`buy Tea` means we purchase it ready-made. It is shown with a grey ring.',
        'This is the natural choice for Product and the left of Commodity: several suppliers compete, so compare them and expect them to get cheaper.',
      ],
      source: src(base, 'build Kettle', 'buy Tea'),
      notes: [{ text: 'a grey ring: we buy it', at: [0.8, 0.5], target: { component: 'Tea' }, width: 110 }],
    },
    {
      title: 'Outsource',
      body: [
        '`outsource Power` means someone else runs it for us as a service. It is shown with a solid dark ring.',
        'This suits commodities and utilities. Spend your own effort on the parts that make you different.',
      ],
      source: src(base, 'build Kettle', 'buy Tea', 'outsource Power'),
      notes: [{ text: 'a solid ring: a service we use', at: [0.3, 0.62], target: { component: 'Power' }, width: 130 }],
    },
    {
      title: 'Spot the odd one out',
      body: [
        'The rings make unusual choices easy to see. Imagine we had written `build Power`: running our own power station for a tea shop.',
        'Electricity is a commodity, so building it is rarely worth the effort. The map is a prompt to ask "why are we doing this ourselves?"',
      ],
      source: src(base, 'build Kettle', 'buy Tea', 'build Power'),
      notes: [{ text: 'our own power station?', at: [0.3, 0.62], target: { component: 'Power' }, width: 120 }],
    },
    {
      title: 'Inertia',
      body: [
        'Components also resist change. Because we built the kettle, the staff know it and we paid for it, so we will be slow to swap it for an ordinary one.',
        '`evolve Kettle [product]` shows where it is heading and `inertia Kettle` draws a bar in its way.',
      ],
      source: src(base, 'build Kettle', 'buy Tea', 'outsource Power', 'evolve Kettle [product]', 'inertia Kettle'),
      notes: [{ text: 'sunk cost and habit hold it back', at: [0.5, 0.8], target: { inertia: 'Kettle' }, width: 130 }],
    },
    {
      title: 'Your turn',
      body: [
        'Hover over a ring or the inertia bar on the map for a reminder of what it means.',
        'Press Finish to keep this map, then change the sourcing of other parts. Which ones would you build, and which would you never build?',
      ],
      source: src(base, 'build Kettle', 'buy Tea', 'outsource Power', 'evolve Kettle [product]', 'inertia Kettle'),
      notes: [],
    },
  ],
};
