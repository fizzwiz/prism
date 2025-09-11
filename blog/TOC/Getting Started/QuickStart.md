# 🚀 Quick Start Guide: `@fizzwiz/sorted`

Welcome to `@fizzwiz/sorted` — a modern library of sorted collections for JavaScript.  
This guide will help you get started in just a few minutes.

---

## 📦 Installation

Install with **npm**:

```bash
npm install @fizzwiz/sorted
```

Or with **yarn**:

```bash
yarn add @fizzwiz/sorted
```

---

## 🔁 Basic Sorting

The `ArrayQueue` class keeps elements sorted by insertion order — behaving like a **FIFO** or **LIFO** queue, depending on configuration:

```js
import { ArrayQueue } from '@fizzwiz/sorted';

// LIFO (Last In, First Out)
const lifo = new ArrayQueue(false).let(1).let(2).let(3);

const last = lifo.peek(); // → 3
```

---

## 🧠 Advanced Equivalence

Use custom equivalence logic via **representation functions**. For example, group strings by their length:

```js
import { TrueSet, ORDER } from '@fizzwiz/sorted';

const set = new TrueSet(
  word => word.length,       // representation function
  ORDER.ASCENDING, 
  ORDER.SINGULAR             // enforce uniqueness by representation
);

set.add("what");
set.add("that"); // → false (same length as "what")
```

---

## 🧪 Composable Logic

`Collection` extends the `Each` concept (see [@fizzwiz/fluent Blog](https://fluent-js.blogspot.com)) — allowing fluent, chainable transformations:

```js
const lifo = new ArrayQueue(false).let(1).let(2).let(3);

const odds = lifo.which(i => i % 2 === 1);     // → [1, 3]
const sum = odds.what((a, b) => a + b);        // → 4
```

---

## 📚 Explore More

### ✨ [Intro to the Library](https://sorted-js.blogspot.com/p/Intro.html)
A conceptual overview of the design philosophy and patterns behind `@fizzwiz/sorted`.

### 📄 [API Reference](https://fizzwiz.github.io/sorted)
Browse the full, auto-generated documentation.

### 🧾 [GitHub Repository](https://github.com/fizzwiz/sorted)
View the source, report issues, or contribute to the project.

---

## 💬 Need Help?

Questions? Thoughts? Drop a comment on the blog or open a discussion on GitHub.

> “Make your code align with your thoughts.”  
> — `@fizzwiz ✨`
