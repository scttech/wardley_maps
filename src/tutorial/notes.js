import { src } from './util.js';

// Tutorial: labels on links and arrows, and notes. Uses the finished tea shop positions.
const parts = [
  'title Tea Shop',
  'anchor Business [product][95, 77]',
  'component Cup of Tea [product][79, 70]',
  'component Tea [commodity][63, 37]',
  'component Kettle [custom][43, 78]',
  'component Power [commodity][10, 50]',
  'Business->Cup of Tea',
  'Cup of Tea->Tea',
];
const plainLinks = ['Cup of Tea->Kettle', 'Kettle->Power'];
const labelled = ['Cup of Tea->Kettle "boils water"', 'Kettle->Power "plugs into"'];

export const NOTES_TUTORIAL = {
  id: 'notes',
  name: 'Labels and notes',
  steps: [
    {
      title: 'Explain a link',
      body: [
        'Links say "depends on", but sometimes you want to say how. Put a quoted label after the link: `Cup of Tea->Kettle "boils water"`.',
        'The label is drawn on the line.',
      ],
      source: src(parts, labelled),
      notes: [{ text: 'labels sit on the line', at: [0.84, 0.15], target: { link: ['Cup of Tea', 'Kettle'] }, width: 120 }],
    },
    {
      title: 'Explain an arrow',
      body: [
        'Evolution arrows take a label in the same way: `evolve Kettle [product] "off-the-shelf soon"`.',
        'It is drawn under the arrow, so it does not collide with the name of the component.',
      ],
      source: src(parts, labelled, 'evolve Kettle [product] "off-the-shelf soon"'),
      notes: [{ text: 'the arrow gets its own label', at: [0.3, 0.8], target: { evolve: 'Kettle' }, width: 130 }],
    },
    {
      title: 'Add a note',
      body: [
        'A note is free text on the map: `note Check supplier prices [genesis][25, 70]`. The stage and numbers are the position, written like a component\'s.',
        'Notes are yellow sticky notes. Drag one and the numbers in the text follow.',
      ],
      source: src(parts, labelled, 'evolve Kettle [product] "off-the-shelf soon"', 'note Check supplier prices [genesis][25, 70]'),
      notes: [{ text: 'a note, placed by its numbers', at: [0.1, 0.3], target: { note: 0 }, width: 130 }],
    },
    {
      title: 'Point at something',
      body: [
        'End a note with `-> Tea` and it gets a speech-bubble tail pointing at that component: `note Ask for bulk prices [custom][84, 57] -> Tea`.',
        'The tail follows when either the note or the component moves.',
      ],
      source: src(parts, labelled, 'evolve Kettle [product] "off-the-shelf soon"', 'note Ask for bulk prices [custom][84, 57] -> Tea'),
      notes: [{ text: 'the tail points at Tea', at: [0.52, 0.12], target: { note: 0 }, width: 120 }],
    },
    {
      title: 'Let the note find its place',
      body: [
        'With a pointer you can leave the numbers out: `note Ask for bulk prices -> Tea`. The note is placed just above the component it points at.',
        'Drag it where you like and the app writes the numbers into the line for you.',
      ],
      source: src(parts, labelled, 'evolve Kettle [product] "off-the-shelf soon"', 'note Ask for bulk prices -> Tea'),
      notes: [{ text: 'placed beside Tea for us', at: [0.52, 0.93], target: { note: 0 }, width: 110 }],
    },
    {
      title: 'Longer notes',
      body: [
        'For more than a line, write `note`, optionally followed by coordinates and a pointer, then the text on the lines below, and finish with `end note`.',
        'The text is kept exactly as you write it, blank lines included. With no coordinates at all, the note is stacked at the left.',
      ],
      source: src(parts, labelled, 'evolve Kettle [product] "off-the-shelf soon"', 'note Ask for bulk prices -> Tea',
        'note [genesis][28, 82] -> Kettle', 'Can we buy a kettle instead?', '', 'What would it cost to switch?', 'end note'),
      notes: [{ text: 'several lines, one note', at: [0.56, 0.12], target: { note: 1 }, width: 120, gap: 44 }],
    },
    {
      title: 'Your turn',
      body: [
        'Labels and notes are a good way to record why something sits where it does, for whoever reads the map next.',
        'Press Finish to keep this map, then add a note of your own.',
      ],
      source: src(parts, labelled, 'evolve Kettle [product] "off-the-shelf soon"', 'note Ask for bulk prices -> Tea',
        'note [genesis][28, 82] -> Kettle', 'Can we buy a kettle instead?', '', 'What would it cost to switch?', 'end note'),
      notes: [],
    },
  ],
};
