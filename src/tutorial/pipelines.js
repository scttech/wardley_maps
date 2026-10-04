import { src } from './util.js';

// Tutorial: pipelines. The kettle starts as one dot and becomes a pipeline of variants.
const base = [
  'title Kettle Pipeline',
  'anchor Business [product][95, 77]',
  'component Cup of Tea [product][79, 70]',
  'component Kettle [product][58, 50]',
  'component Power [commodity][20, 10]',
  'Business->Cup of Tea',
  'Cup of Tea->Kettle',
  'Kettle->Power',
];
const block = (label = '') => [
  `pipeline Kettle${label} {`,
  '  component Stove Kettle [custom][30]',
  '  component Electric Kettle [product][50]',
  '  component Smart Kettle [genesis][70]',
  '}',
];

export const PIPELINES = {
  id: 'pipelines',
  name: 'Pipelines: many variants of one thing',
  steps: [
    {
      title: 'One dot, many kinds',
      body: [
        'A kettle is one dot on this map, but in real life there are many kinds: stove-top, electric, smart. They are at different stages of evolution.',
        'A pipeline lets one component show its range of variants.',
      ],
      source: src(base),
      notes: [{ text: 'is this one kettle or many?', at: [0.35, 0.8], target: { component: 'Kettle' }, width: 130 }],
    },
    {
      title: 'Group the variants',
      body: [
        'Name the owner, then list the variants between curly braces: `pipeline Kettle {` ... `}`.',
        'Inside the braces each variant needs only a name and an evolution, such as `component Electric Kettle [product][50]`. It has no height of its own: it always sits just below its owner.',
      ],
      source: src(base, block()),
      notes: [
        { text: 'the pipeline box', at: [0.3, 0.9], target: { pipeline: 'Kettle' }, width: 100, curve: 0.1 },
        { text: 'the owner sits just above', at: [0.8, 0.28], target: { component: 'Kettle' }, width: 130 },
      ],
    },
    {
      title: 'Read it from both ends',
      body: [
        'The variants are spread along the evolution axis. The right-hand end shows what is becoming standard. The left-hand end shows what is about to arrive.',
        'Watching a pipeline tells you where the owner is heading.',
      ],
      source: src(base, block()),
      notes: [
        { text: 'new and experimental', at: [0.34, 0.1], target: { point: [0.51, 0.119] }, width: 110, curve: 0.2 },
        { text: 'established', at: [0.34, 0.7], target: { point: [0.51, 0.55] }, width: 90, curve: -0.2 },
      ],
    },
    {
      title: 'Variants are components',
      body: [
        'Variants are ordinary components, so after the braces you can use `build`, `buy`, `inertia` or `evolve` on them, or link to them.',
        'Here we expect the smart kettle to mature, and note that we own the old stove-top one.',
      ],
      source: src(base, block(), 'evolve Smart Kettle [custom]', 'build Stove Kettle', 'buy Electric Kettle'),
      notes: [{ text: 'smart kettles will mature', at: [0.3, 0.1], target: { evolve: 'Smart Kettle' }, width: 120 }],
    },
    {
      title: 'Name the box',
      body: [
        'The box is labelled "Kettle pipeline" by default. To change it, put a quoted name after the owner: `pipeline Kettle "Kettle options" {`.',
        'An empty name, `""`, removes the label.',
      ],
      source: src(base, block(' "Kettle options"'), 'evolve Smart Kettle [custom]', 'build Stove Kettle', 'buy Electric Kettle'),
      notes: [{ text: 'the label breaks the outline', at: [0.76, 0.14], target: { pipelineLabel: 'Kettle' }, width: 120, curve: 0.15 }],
    },
    {
      title: 'Your turn',
      body: [
        'Drag the owner and the whole pipeline moves with it. Drag a variant and it slides along the box, with its line in the text updated.',
        'Press Finish to keep the map and try adding a fourth variant.',
      ],
      source: src(base, block(' "Kettle options"'), 'evolve Smart Kettle [custom]', 'build Stove Kettle', 'buy Electric Kettle'),
      notes: [],
    },
  ],
};
