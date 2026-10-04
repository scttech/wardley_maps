/** Built-in example maps. `blank` is what "New map" starts from. */
export const BLANK = `title New Map
anchor User [product][95, 50]
`;

export const SAMPLES = [
  {
    id: 'tea-shop',
    name: 'Tea Shop (classic)',
    source: `title Tea Shop
anchor Business [product][95, 77]
component Cup of Tea [product][79, 70]
component Tea [commodity][63, 37]
component Kettle [custom][43, 78]
component Power [commodity][10, 50]
Business->Cup of Tea
Cup of Tea->Tea
Cup of Tea->Kettle
Kettle->Power
evolve Kettle [product]
// Inertia: something is holding the kettle back from evolving.
inertia Kettle
`,
  },
  {
    id: 'stages',
    name: 'The four stages of evolution',
    source: `title Stages of Evolution
// Each stage has a default colour. Override one with: color <stage> #rrggbb
color genesis #db2777
// Every position is [stage][visibility, position]. Both numbers are 0 to 100: visibility is how high up,
// position is how far through the stage (0 = its left edge, 100 = its right edge).
anchor User [product][95, 50]
component Novel Idea [genesis][80, 50]
component Bespoke System [custom][65, 50]
component Packaged Software [product][50, 50]
component Cloud Hosting [commodity][35, 50]
User->Novel Idea
User->Bespoke System
Bespoke System->Packaged Software
Packaged Software->Cloud Hosting
// "evolve Name [stage]" moves to the middle of that stage.
evolve Novel Idea [custom]
evolve Bespoke System [product][30]
`,
  },
  {
    id: 'sourcing-notes',
    name: 'Sourcing, labels and notes',
    source: `title Sourcing and Notes
anchor Business [product][95, 77]
component Cup of Tea [product][79, 70]
component Tea [commodity][63, 37]
component Kettle [custom][43, 78]
component Power [commodity][10, 50]
Business->Cup of Tea
Cup of Tea->Tea
// A quoted label after a link is drawn on the line.
Cup of Tea->Kettle "boils water"
Kettle->Power "plugged into"
// A quoted label after an evolve line is drawn on the arrow.
evolve Kettle [product] "off-the-shelf soon"
// Sourcing: how we get each component. build, buy or outsource.
build Kettle
buy Tea
outsource Power
// A note is free text on the map: note <text> [visibility, evolution]. Drag it to move it.
// End it with  -> Component  to give it a speech-bubble pointer to that component. Leave the
// coordinates out and it sits beside that component; drag it and the coordinates are filled in.
note Ask suppliers about bulk prices -> Tea
// A longer note: put the position on the first line, then the text, then "end note".
note [genesis][30, 70] -> Kettle
Review the kettle each quarter.

Is a good product on the market yet?
end note
`,
  },
  {
    id: 'component-types',
    name: 'Component types',
    source: `title Online Shop
// component (or capability) is the everyday circle. The other statements give other shapes.
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
`,
  },
  {
    id: 'pipeline',
    name: 'Kettle pipeline',
    source: `title Kettle Pipeline
anchor Business [product][95, 77]
component Cup of Tea [product][79, 70]
component Kettle [product][58, 50]
component Power [commodity][20, 10]
Business->Cup of Tea
Cup of Tea->Kettle
Kettle->Power
// A pipeline groups variants of a component. Inside the braces each variant
// only needs an evolution: the box sits just below the component that owns it.
// The box is labelled "<name> pipeline"; to rename it write: pipeline Kettle "Kettle variants" {
pipeline Kettle {
  component Stove Kettle [custom][30]
  component Electric Kettle [product][50]
  component Smart Kettle [genesis][70]
}
`,
  },
  {
    id: 'photo-sharing',
    name: 'Online photo sharing',
    source: `title Online Photo Sharing
anchor Public [product][97, 50]
component Photo Sharing [product][88, 40]
component Web Site [product][75, 80]
component Image Storage [commodity][55, 30]
component Platform [commodity][40, 60]
component Compute [commodity][25, 80]
component Power [commodity][10, 90]
Public->Photo Sharing
Photo Sharing->Web Site
Photo Sharing->Image Storage
Web Site->Platform
Image Storage->Compute
Platform->Compute
Compute->Power
evolve Photo Sharing [commodity][20]
`,
  },
  {
    id: 'ml-product',
    name: 'Machine learning product',
    source: `title Machine Learning Product
anchor Customer [product][97, 50]
component Recommendations [custom][85, 60]
component ML Model [genesis][70, 70]
component Training Data [custom][55, 40]
component ML Platform [product][45, 60]
component Compute [commodity][25, 50]
Customer->Recommendations
Recommendations->ML Model
ML Model->Training Data
ML Model->ML Platform
ML Platform->Compute
evolve ML Model [custom]
evolve ML Platform [commodity][20]
`,
  },
];
