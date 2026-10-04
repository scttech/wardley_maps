import { src } from './util.js';

// Tutorial: the kinds of component. Each step adds one kind (and the links that join it in).
const L = {
  title: 'title Online Shop',
  shopper: 'anchor Shopper [product][97, 50]',
  checkout: 'component Checkout [product][75, 30]',
  need: 'need Buy things quickly [product][88, 55]',
  practice: 'practice Continuous Delivery [custom][63, 70]',
  data: 'data Order History [product][54, 80]',
  knowledge: 'knowledge Fraud Patterns [custom][50, 20]',
  market: 'market Payment Providers [commodity][35, 40]',
  ecosystem: 'ecosystem Plugin Marketplace [custom][31, 60]',
  hosting: 'component Cloud Hosting [commodity][14, 60]',
};
const needLinks = ['Shopper->Buy things quickly', 'Buy things quickly->Checkout'];

export const COMPONENT_TYPES_TUTORIAL = {
  id: 'component-types',
  name: 'Kinds of component',
  steps: [
    {
      title: 'More than activities',
      body: [
        'So far every component has been a circle: something that is done or provided. That is what `component` (or `capability`) gives you.',
        'Maps can show other kinds of thing too. Each has its own statement and its own shape. We will add one at a time to an online shop.',
      ],
      source: src(L.title, L.shopper, L.checkout, 'Shopper->Checkout'),
      notes: [{ text: 'a capability: a plain circle', at: [0.62, 0.15], target: { component: 'Checkout' }, width: 130 }],
    },
    {
      title: 'Needs',
      body: [
        '`need` is something a user wants, described from their side: "buy things quickly", not "a faster server".',
        'It is drawn as a square. Needs sit near the top, between the user and whatever delivers them.',
      ],
      source: src(L.title, L.shopper, L.need, L.checkout, needLinks),
      notes: [{ text: 'a need: a square', at: [0.9, 0.18], target: { component: 'Buy things quickly' }, width: 100 }],
    },
    {
      title: 'Practices',
      body: [
        '`practice` is a way of working: a method, habit or approach, rather than a thing you use. Continuous delivery is a practice.',
        'It is a triangle. Practices evolve too: they start as clever ideas and end up as standard good practice.',
      ],
      source: src(L.title, L.shopper, L.need, L.checkout, L.practice, needLinks, 'Checkout->Continuous Delivery'),
      notes: [{ text: 'a practice: a triangle', at: [0.74, 0.12], target: { component: 'Continuous Delivery' }, width: 110 }],
    },
    {
      title: 'Data',
      body: [
        '`data` is information that is held and used, such as a customer list or order history.',
        'It is a hexagon. Ask how standard the data is: widely shared formats are easy to exchange but hard to protect.',
      ],
      source: src(L.title, L.shopper, L.need, L.checkout, L.practice, L.data, needLinks, 'Checkout->Continuous Delivery', 'Checkout->Order History'),
      notes: [{ text: 'data: a hexagon', at: [0.66, 0.92], target: { component: 'Order History' }, width: 90 }],
    },
    {
      title: 'Knowledge',
      body: [
        '`knowledge` is what people understand about how something works. Recognising fraud is knowledge held by people and, in part, written down.',
        'It is a diamond. Where knowledge is thin, expect to learn by trying things; where it is well established, you can buy it in.',
      ],
      source: src(L.title, L.shopper, L.need, L.checkout, L.practice, L.data, L.knowledge, needLinks, 'Checkout->Continuous Delivery', 'Checkout->Order History', 'Checkout->Fraud Patterns'),
      notes: [{ text: 'knowledge: a diamond', at: [0.38, 0.1], target: { component: 'Fraud Patterns' }, width: 110 }],
    },
    {
      title: 'Markets',
      body: [
        '`market` is something traded among many buyers and many sellers, such as payment providers.',
        'It is a circle holding a small network. Once a market forms, suppliers compete on price and you can usually choose rather than build.',
      ],
      source: src(L.title, L.shopper, L.need, L.checkout, L.practice, L.data, L.knowledge, L.market, needLinks,
        'Checkout->Continuous Delivery', 'Checkout->Order History', 'Checkout->Fraud Patterns', 'Checkout->Payment Providers'),
      notes: [{ text: 'a market: many buyers and sellers', at: [0.2, 0.86], target: { component: 'Payment Providers' }, width: 130 }],
    },
    {
      title: 'Ecosystems',
      body: [
        '`ecosystem` is a community that grows up around a component, like an app marketplace where others build and sell extensions.',
        'It is a dashed ring with satellites. The more people take part, the more valuable it becomes, and the harder it is for a newcomer to match.',
      ],
      source: src(L.title, L.shopper, L.need, L.checkout, L.practice, L.data, L.knowledge, L.market, L.ecosystem, needLinks,
        'Checkout->Continuous Delivery', 'Checkout->Order History', 'Checkout->Fraud Patterns', 'Checkout->Payment Providers', 'Checkout->Plugin Marketplace'),
      notes: [{ text: 'an ecosystem: a ring of satellites', at: [0.16, 0.22], target: { component: 'Plugin Marketplace' }, width: 130 }],
    },
    {
      title: 'Putting it together',
      body: [
        'Every kind works the same way: it has a position, can be linked, can have an `evolve` arrow, inertia or a sourcing marker, and can be dragged.',
        'Hover over any shape on the map for a reminder of what it means. Press Finish to keep the map and experiment.',
      ],
      source: src(L.title, L.shopper, L.need, L.checkout, L.practice, L.data, L.knowledge, L.market, L.ecosystem, L.hosting, needLinks,
        'Checkout->Continuous Delivery', 'Checkout->Order History', 'Checkout->Fraud Patterns', 'Checkout->Payment Providers', 'Checkout->Plugin Marketplace',
        'Payment Providers->Cloud Hosting', 'Order History->Cloud Hosting'),
      notes: [],
    },
  ],
};
