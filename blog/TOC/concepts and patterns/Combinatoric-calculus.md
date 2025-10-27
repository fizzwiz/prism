# 🧮 Exploring Combinatoric Calculus with `Search`

The `Search` abstraction in `@fizzwiz/prism` provides a **clean, declarative approach** to generating and exploring combinatorial structures. Rather than hard-coding recursive algorithms, you can *formally describe* how permutations, combinations, power sets, and other combinatorial constructs are generated — and let the fluent search engine do the heavy lifting.

---

## 🧠 Concept: Combinatorics as Exploration

Every combinatorial problem can be viewed as a **space of possible choices**:

* **Permutations**: ordered sequences of elements.
* **Combinations**: subsets without regard to order.
* **Power sets**: all possible subsets of a set.

Traditionally, each case requires a specialized algorithm, often with complex recursion. With `Search`, we express these patterns declaratively through **path expansion** — describing how one partial choice leads to the next.

---

## ⚙️ Defining a Search Process

Each search is defined by three main ideas:

1. **Start**: the initial state (often an empty path).
2. **Space**: expansion logic defining how new candidates are generated.
3. **Restriction or Completion**: a condition marking valid results.

### Example: Generating All Paths

```js
import { Search } from '@fizzwiz/prism';
import { Path } from '@fizzwiz/fluent';
import { ArrayQueue } from '@fizzwiz/sorted';

const items = ['A', 'B', 'C'];
const start = new Path();                   // empty Path
const space = path => path.across(items);   // expands the path with each of the given items
const queue = new ArrayQueue();             // FIFO queue

const search = new Search()
  .from(start)
  .through(space)
  .via(queue)

```

This symbolic search **defines all possible paths** without generating them immediately. They are returned as a lazy `Each` which can be restricted by any predicate: `search.which(predicate)`. Combinatorial constructs like dispositions, combinations, or power sets differ only in the **search space** and **predicate** applied.

---

### Example: Generating All Dispositions of Length `n`

```js
const n = 2;
const restricted = What.as(space).if(path => path.length < n);   // expand only paths with length < n
const predicate = path => path.length === n;                     // iterate only paths with length n
// -> ['A', 'A'], ['A', 'B'], ['A', 'C'], ['B', 'A'], ['B', 'B'], ['B', 'C'], ['C', 'A'], ['C', 'B'], ['C', 'C']
```

### Example: Generating All Combinations of Length `n`

```js
const n = 2;
const restricted = What.as(space)
  .if(path => path.length < n)
  .sthen(paths => paths.which(path => path.length < 2 || path.prev.last <= path.last)); // enforce sorted order

const predicate = path => path.length === n;
// -> ['A', 'A'], ['A', 'B'], ['A', 'C'], ['B', 'B'], ['B', 'C'], ['C', 'C']
```

### Example: Generating All Subsets (Power Set)

```js
const restricted = What.as(space)
  .which(path => path.length < 2 || path.prev.last < path.last); // sorted paths
const predicate = path => true; // all sorted paths
// -> [], ['A'], ['B'], ['C'], ['A', 'B'], ['A', 'C'], ['B', 'C'], ['A', 'B', 'C']
```

Each variant modifies only the **expansion and filter rules**, keeping the **declarative structure** intact.

---

## 🌌 The Wonder of Search

With `Search`, **complex combinatorial generation transforms into a unified, expressive pattern**. You can fluently chain transformations, apply filters, or inject custom rationales. Its **strength lies in uniformity** — whether generating trees, sequences, or subsets, you define a **formal exploration space** without managing iteration details.

### Key Benefits:

* Declarative and intuitive syntax.
* Fully lazy — candidates are generated only when needed.
* Easily extensible to new combinatorial or filtering or transformation rules.
* Infinite searches can be declared and stopped when a predicate is satisfied: `search.which(predicate).what()`

---

All examples here use the same FIFO queue, but generally the **Queue** is essential for driving the search — for instance, using a scoring function to prioritize candidates. We will explore this topic in a dedicated post.

---

— `@fizzwiz ✨`
