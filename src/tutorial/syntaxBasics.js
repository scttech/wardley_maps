import { src } from './util.js';

// Tutorial: writing a map as text. Each step shows the whole definition; the notes point at the result.
const T = ['title Photo Blog', '// Lines that start with // are comments and are ignored'];

const parts = [
  'anchor Reader [product][95, 50]',
  'component Blog Posts [product][80, 40]',
  'component Photos [custom][62, 57]',
  'component Web Hosting [commodity][35, 50]',
];
const links = ['Reader->Blog Posts', 'Blog Posts->Photos', 'Blog Posts->Web Hosting', 'Photos->Web Hosting'];
const evolve = 'evolve Photos [product] "off the shelf soon"';
const colour = 'color custom #db2777';

export const SYNTAX_BASICS = {
  id: 'syntax-basics',
  name: 'Writing a map as text',
  steps: [
    {
      title: 'A map is just text',
      body: [
        'Everything on a map comes from a few lines of text, one statement per line. The definition on the left builds the map on the right.',
        '`title` names the map. Lines starting with `//` are comments for you: the app ignores them.',
      ],
      source: src(T),
      notes: [{ text: 'the title appears up here', at: [0.7, 0.3], target: { point: [1.03, 0.5] }, width: 120, curve: -0.2 }],
    },
    {
      title: 'Position the user',
      body: [
        'A component is a name followed by its position in square brackets: `[stage][visibility, position]`.',
        'The stage says which part of the map it belongs in. Visibility is how high up the value chain, from 0 (bottom) to 100 (top). Position is how far through the stage, from 0 (its left edge) to 100 (its right edge). `anchor` is a component for the user.',
      ],
      source: src(T, parts[0]),
      notes: [{ text: 'product stage, near the top, halfway across', at: [0.72, 0.3], target: { component: 'Reader' }, width: 160 }],
    },
    {
      title: 'Add components',
      body: [
        'Each `component` line adds a dot. Names can contain spaces.',
        'Try reading the numbers: Web Hosting is `[commodity][35, 50]`, so it is in the Commodity stage, low down (hidden from the reader) and halfway across the stage.',
      ],
      source: src(T, parts),
      notes: [
        { text: 'high up, in Product', at: [0.9, 0.18], target: { component: 'Blog Posts' }, width: 110 },
        { text: 'low down, in Commodity', at: [0.2, 0.62], target: { component: 'Web Hosting' }, width: 120 },
      ],
    },
    {
      title: 'Connect them with links',
      body: [
        '`A->B` draws a line meaning "A depends on B". Both components have to be defined above the link.',
        'You can add a label in quotes after a link, such as `Blog Posts->Photos "shows"`.',
      ],
      source: src(T, parts, links),
      notes: [{ text: 'Photos depends on Web Hosting', at: [0.22, 0.4], target: { link: ['Photos', 'Web Hosting'] }, width: 140, curve: 0.2 }],
    },
    {
      title: 'Choosing the stage',
      body: [
        'The stage always comes first, and is one of `genesis`, `custom`, `product` or `commodity` (the four stages along the bottom).',
        'Because the position is measured inside the stage, a component can never end up in the wrong one. Move a component to another stage by changing the key, and set where it sits in that stage with the second number.',
      ],
      source: src(T, parts, links),
      notes: [
        { text: 'genesis', at: [0.2, 0.08], target: { stage: 'genesis' }, width: 60, curve: 0.15 },
        { text: 'custom', at: [0.2, 0.3], target: { stage: 'custom' }, width: 60, curve: 0.15 },
        { text: 'product', at: [0.2, 0.55], target: { stage: 'product' }, width: 60, curve: 0.15 },
        { text: 'commodity', at: [0.2, 0.88], target: { stage: 'commodity' }, width: 80, curve: 0.15 },
      ],
    },
    {
      title: 'Show where it is heading',
      body: [
        '`evolve Photos [product]` draws an arrow towards the middle of the Product stage. Add a quoted label to explain it.',
        'Use `[product][80]` to aim at a position inside the stage: 0 is its left edge and 100 its right edge.',
      ],
      source: src(T, parts, links, evolve),
      notes: [{ text: 'the label sits under the arrow', at: [0.3, 0.55], target: { evolve: 'Photos' }, width: 130 }],
    },
    {
      title: 'Change the colours',
      body: [
        'Each stage has a default colour. `color custom #db2777` gives the Custom Built stage a new one, using an HTML colour code (`#rgb` or `#rrggbb`).',
        'The stage band and the dots inside it take the new colour.',
      ],
      source: src(T, parts, links, evolve, colour),
      notes: [{ text: 'pink instead of blue', at: [0.2, 0.12], target: { stage: 'custom' }, width: 100, curve: 0.15 }],
    },
    {
      title: 'When something is wrong',
      expectErrors: 1, // this step is meant to show an error
      body: [
        'Mistakes never stop the map drawing. The line with the problem is skipped and an error appears under the editor. Here `Blog Post` is missing its final "s".',
        'Read the message, fix the line, and the link comes back.',
      ],
      source: src(T, parts, 'Reader->Blog Post', links.slice(1), evolve, colour),
      notes: [{ text: 'the Reader link is missing', at: [0.78, 0.2], target: { component: 'Reader' }, width: 130 }],
    },
    {
      title: 'Drag to edit',
      body: [
        'You do not have to type every number. Drag a component on the map and its line in the text is rewritten, including its stage.',
        'Press Finish to keep this map, then drag things around and watch the text change.',
      ],
      source: src(T, parts, links, evolve, colour),
      notes: [],
    },
  ],
};
