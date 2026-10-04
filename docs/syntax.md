# Wardley map syntax

A map is written as plain text, one statement per line. The map redraws as you type, and dragging things on the map rewrites the text for you.

This page is the reference for the text format. In the app's Help window every example has a **Try it** button that loads it straight into the editor.

## The basics

- **One statement per line.** Anything the app doesn't understand shows an error under the editor, and the rest of the map still draws.
- **Comments** start with `//` and run to the end of the line. They are ignored (except inside a multiline note, where `//` is just text).
- **Keywords** such as `component` and `evolve` are not case sensitive. **Names** are case sensitive, can contain spaces, and must be unique.
- **Define before you use.** A link, `evolve`, `inertia`, sourcing line or pipeline can only mention a component that is defined earlier in the text. The one exception is a note's `->` pointer, which can name a component defined anywhere.

### The four stages

The map is divided into four stages from left to right, from brand new to completely standard. Every position starts with the key of a stage.

| Stage | Key | What belongs there |
| --- | --- | --- |
| Genesis | `genesis` | brand new, uncertain, being discovered |
| Custom Built | `custom` (or `custom-built`) | built specially for each user |
| Product (+rental) | `product` | bought off the shelf, many to choose from |
| Commodity (+utility) | `commodity` | standard, interchangeable, a utility |

### Positions

A position is written `[stage][visibility, position]`:

- **stage** is one of the four keys above. It says which part of the map the item is in.
- **visibility** goes up the value chain: 0 is the bottom (invisible to the user) and 100 is the top (visible to the user).
- **position** is how far through the stage the item is: 0 is the stage's left edge and 100 is its right edge.

Both numbers are whole numbers from 0 to 100. Because the position is measured inside the stage, an item can never end up in the wrong stage. To move it to another stage, change the key.

```wardley
// Halfway through Product, a little above the middle of the value chain
component Kettle [product][55, 50]
// The same height, but at the right-hand edge of Commodity
component Power [commodity][55, 100]
```

When you drag something on the map, the stage and the numbers in its line are updated for you.

## Title

```wardley
title Tea Shop
```

The title is drawn in bold above the map.

## Components and anchors

```wardley
component Cup of Tea [product][79, 70]
anchor Business [product][95, 77]
```

- `component Name [stage][visibility, position]` places a component.
- `anchor` is the same, for the user or customer at the top of the chain. Start every map with one.
- There are other kinds of component with their own shapes (needs, practices, data, knowledge, markets and ecosystems): see [Component types](#component-types) below.
- A number above 100 is an error. The component is still drawn, at the edge.

Each component's dot takes the colour of the stage it is in.

## Component types

`component` is the everyday kind: an activity or capability that something does or provides. Wardley maps also show other kinds of thing. Each has its own statement and its own shape, and they all take the same position as a component: `[stage][visibility, position]`.

| Statement | What it is | Shape |
| --- | --- | --- |
| `component Name` (or `capability Name`) | an activity or capability: something you do or provide | circle |
| `anchor Name` | the user or customer at the top of the chain | circle |
| `need Name` | something a user wants, described from their side | square |
| `practice Name` | a way of working: a method, habit or approach | triangle |
| `data Name` | information that is held and used | hexagon |
| `knowledge Name` | what people understand about how things work | diamond |
| `market Name` | something traded among many buyers and many sellers | circle holding a small network of dots |
| `ecosystem Name` | a community that grows up around a component | dashed ring with satellites |

```wardley
title Online Shop
anchor Shopper [product][97, 50]
need Buy things quickly [product][88, 55]
component Checkout [product][75, 30]
practice Continuous Delivery [custom][63, 70]
data Order History [product][54, 80]
knowledge Fraud Patterns [custom][50, 20]
market Payment Providers [commodity][35, 40]
ecosystem Plugin Marketplace [custom][31, 60]
component Cloud Hosting [commodity][14, 60]
Shopper->Buy things quickly
Buy things quickly->Checkout
Checkout->Continuous Delivery
Checkout->Order History
Checkout->Fraud Patterns
Checkout->Payment Providers
Checkout->Plugin Marketplace
Payment Providers->Cloud Hosting
Order History->Cloud Hosting
```

- The dot's colour still shows the stage, whatever the shape.
- Links, `evolve`, `inertia`, sourcing, notes and pointers all work with every type.
- Hover over a square, triangle, hexagon, diamond, market or ecosystem on the map for a short explanation.
- Pipeline variants are always ordinary components.

## Links

A link says that the first component depends on the second.

```wardley
component Cup of Tea [product][79, 70]
component Tea [commodity][63, 37]
Cup of Tea->Tea
Cup of Tea->Tea "weighed out per cup"
```

- `A->B` draws a line from A down to B. Both components must already be defined.
- A quoted label after the link is drawn on the line.

## Evolution arrows

An arrow shows where you expect a component to move.

```wardley
component Kettle [custom][43, 78]
evolve Kettle [product]
evolve Kettle [product][80] "becoming standard"
```

- `evolve Name [stage]` moves towards the middle of that stage.
- `evolve Name [stage][position]` moves to a position within that stage (0 is its left edge, 100 its right edge).
- A quoted label at the end is drawn under the arrow.
- The arrow starts at the component's own position.

## Inertia

Inertia is resistance to change: something that holds a component back from evolving.

```wardley
component Kettle [custom][43, 78]
evolve Kettle [product]
inertia Kettle
```

`inertia Name` draws a thick bar just to the right of the component, in the way of any evolution arrow.

## Sourcing

Sourcing records how you get a component.

```wardley
component Kettle [custom][43, 78]
component Tea [commodity][63, 37]
component Power [commodity][10, 50]
build Kettle
buy Tea
outsource Power
```

| Statement | Meaning | Ring on the map |
| --- | --- | --- |
| `build Name` | make it yourself | dashed dark ring |
| `buy Name` | buy a ready-made product | grey ring |
| `outsource Name` | have someone else run it as a service | solid dark ring |

## Pipelines

A pipeline groups several variants of one component, each at its own stage of evolution, such as different kinds of kettle. The variants go inside curly braces.

```wardley
component Kettle [product][58, 50]
pipeline Kettle {
  component Stove Kettle [custom][30]
  component Electric Kettle [product][50]
  component Smart Kettle [genesis][70]
}
```

- `pipeline Owner {` starts the block and `}` ends it. The opening brace can also be on the next line. The owner must already be a component, and a component can own one pipeline.
- Inside the braces only `component Name [stage][position]` is allowed. A variant has no visibility of its own: it always sits just below its owner, so dragging the owner moves the whole pipeline.
- The box is labelled `Owner pipeline`. To change that, put a quoted label after the owner: `pipeline Kettle "Kettle variants" {`. An empty label, `""`, removes it.
- Variants are ordinary components, so after the block you can link to them or give them inertia and sourcing.

```wardley
component Kettle [product][58, 50]
pipeline Kettle "Kettle variants" {
  component Stove Kettle [custom][30]
  component Electric Kettle [product][50]
}
build Stove Kettle
```

## Notes

Notes are free text on the map, drawn as yellow sticky notes.

### One line

```wardley
note Ask suppliers about bulk prices [custom][72, 50]
note Near the right-hand edge of Commodity [commodity][20, 90]
```

- `note text [stage][visibility, position]` places a note. The text can optionally be wrapped in double quotes.
- Long text wraps automatically. To force a line break on one line, type a backslash followed by the letter n.

### Several lines

```wardley
note [genesis][30, 70]
Review the kettle each quarter.

Is a good product on the market yet?
end note
```

- The position goes on the first line, then the text, then `end note`.
- The text is kept exactly as written: blank lines stay, and `//` is not a comment inside a note.
- If you leave the position off (just `note`), the note is stacked down the left side of the map. As soon as you drag it, the position is written into the first line.

### Pointing at a component

End the first line of any note with `-> Component` and the note gets a speech-bubble tail pointing at that component.

```wardley
component Tea [commodity][63, 37]
component Kettle [custom][43, 78]
note Ask suppliers about bulk prices [custom][72, 50] -> Tea
note [genesis][50, 60] -> Kettle
What would it take to buy a kettle instead?
end note
```

With a pointer you can leave the position out. The note is then placed just above the component (or below it, if it is near the top of the map).

```wardley
component Tea [commodity][63, 37]
note Ask suppliers about bulk prices -> Tea
```

Drag the note and its position is added to the text. The tail follows when either the note or the component moves.

## Stage colours

Each stage has its own default colour. Override one with `color`, using an HTML colour code.

```wardley
color genesis #db2777
color product #0a8
component Idea [genesis][80, 50]
```

- The format is `color stage #rrggbb` or `color stage #rgb`. `colour` is also accepted.
- The colour tints the stage's band behind the map and fills the dots of components in that stage.
- Defaults: Genesis violet (`#8b5cf6`), Custom Built blue (`#3b82f6`), Product green (`#10b981`), Commodity amber (`#f59e0b`).

## Dragging and the text

Dragging on the map rewrites the matching line of the text and leaves everything else alone, including your comments and the order of the lines.

- Dragging a component updates its stage and numbers. Dragging snaps to whole numbers.
- Dragging a pipeline variant slides it along the pipeline and updates its stage and position.
- Dragging a note updates its position, keeping any `-> Component` pointer.

## Common mistakes

| You wrote | What the app says | Fix |
| --- | --- | --- |
| `component Kettle [43, 78]` | Put a stage before the numbers | `component Kettle [custom][43, 78]` |
| `component Kettle [custom][0.43, 0.78]` | must be a whole number from 0 to 100 | `component Kettle [custom][43, 78]` |
| `evolve Kettle 80` | evolve needs a stage | `evolve Kettle [product][80]` |
| `component Kettle [custom][43, 180]` | numbers go up to 100 | `component Kettle [custom][43, 100]` |

## Tips for reading a map

Hover over, or tab to, any of these to see a short explanation:

- the stage names under the map
- **Visible**, **Value Chain**, **Invisible** and **Evolution** on the axes
- a component with its own shape (need, practice, data, knowledge, market or ecosystem)
- an inertia bar
- a pipeline box
- a build, buy or outsource ring

## Quick reference

| What | Example |
| --- | --- |
| Comment | `// text` |
| Title | `title Tea Shop` |
| Component | `component Kettle [custom][43, 78]` |
| Anchor (user) | `anchor Business [product][95, 77]` |
| Other types | `need`, `practice`, `data`, `knowledge`, `market`, `ecosystem`, each used like `component` |
| Link | `Cup of Tea->Kettle "boils water"` |
| Evolution arrow | `evolve Kettle [product][50] "becoming standard"` |
| Inertia | `inertia Kettle` |
| Sourcing | `build Kettle`, `buy Tea`, `outsource Power` |
| Pipeline | `pipeline Kettle "Variants" {` ... `}` |
| One-line note | `note Some text [custom][70, 30] -> Tea` |
| Multiline note | `note [custom][70, 30]` ... `end note` |
| Stage colour | `color product #0a8` |

## A complete example

```wardley
title Tea Shop
// The user and what they need
anchor Business [product][95, 77]
component Cup of Tea [product][79, 70]
component Tea [commodity][63, 37]
component Kettle [custom][43, 78]
component Power [commodity][10, 50]
Business->Cup of Tea
Cup of Tea->Tea
Cup of Tea->Kettle "boils water"
Kettle->Power
// Where things are heading, and what is holding them back
evolve Kettle [product] "off-the-shelf soon"
inertia Kettle
// How we get each part
build Kettle
buy Tea
outsource Power
note Ask suppliers about bulk prices -> Tea
```
