# ⚡ QuickStart with `@fizzwiz/prism`

> **“Get prism running in minutes.”**

This QuickStart guide helps you dive straight into using the `@fizzwiz/prism` library with minimal setup, so you can start experimenting with patterns and algorithms right away.

---

## 1. Installation

Install via npm:

```bash
npm install @fizzwiz/prism
```

Or via yarn:

```bash
yarn add @fizzwiz/prism
```

---

## 2. Basic Usage

Import a core pattern class, e.g., `Run`:

```javascript
import { Run } from '@fizzwiz/prism';

class MyComputation extends Run {
    run() {
        return 'Hello, Patterns!';
    }
}

const result = new MyComputation().run();
console.log(result); // Hello, Patterns!
```

---

## 3. Using `Search`

```javascript
import { Search } from '@fizzwiz/prism';
import { ArrayQueue } from '@fizzwiz/sorted';

const search = new Search()
    .from(1, 2, 3)
    .through(n => [n + 1, n + 2])
    .via(new ArrayQueue(), 10);

for (const candidate of search) {
    console.log(candidate);
}
```

This will lazily explore your candidate space.

---

## 4. Using `AsyncSearch`

```javascript
import { AsyncSearch } from '@fizzwiz/prism';

const asyncSearch = new AsyncSearch()
    .from(1, 2, 3)
    .through(async n => [n + 1, n + 2])
    .via(new ArrayQueue(), 10)
    .inParallel(4);

for await (const candidate of asyncSearch) {
    console.log(candidate);
}
```

This demonstrates asynchronous exploration with parallelism.

---

## 5. Next Steps

* Explore `Search` for combinatorial selection problems.
* Explore `AsyncSearch` for asynchronous searches distributed among multiple machines.
* Check the blog for detailed API pages and pattern explanations.

