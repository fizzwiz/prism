# 🧭 AsyncSearch Class — `@fizzwiz/pattern/core`

The `AsyncSearch` class is a symbolic and non-executable abstraction in the `@fizzwiz/prism` library.  
It extends the concept of `Search` as **lazy, structured exploration** of a space of candidate solutions in the domain of Promises. By doing so, it allow the distribution of such exploration among machines actually allowing the distribution of computing among machines.

---

## 🧠 Concept

- An `AsyncSearch` is not an algorithm to run — it is a **formal definition** of how one might explore a space.
- It operates as a **lazy iterable**, meaning the actual traversal is only performed when iterated.
- It supports **chained, declarative transformations** through its fluent interface (inherited from `AsyncEach`).

---

## 🧾 API Reference

### Constructor

```js
new AsyncSearch(start, space, queue, max)
```

- `start`: Initial candidates or values to explore.
- `space`: An asynchronous generator function or transformation that expands a candidate into more.
- `queue`: A queue structure to manage exploration order (e.g. DFS, BFS, priority).
- `max`: (optional) Maximum number of elements to keep during expansion.

---

## 🧰 Properties

### `start: any`

The initial candidates or seed values of the search.

### `space: Function`

An asynchronous function that, given a candidate, returns new candidates to explore.

### `queue: Queue`

An internal queue used to manage candidate traversal order.

### `max: number`

Maximum number of candidates to retain during traversal. Prevents unbounded growth.

---

## 💡 Rationale
Whereas the queue is actually local to a single machine, the space function can delegate the exploration of the adjacents of each queued solution to another machines. More machines can work in paralles in expanding the current candidate solutions.

## 🛠️ Fluent Methods

### `from(start: any): this`

Sets the starting candidates.

### `through(space: Function): this`

Defines the space expansion logic.

### `via(queue: Queue, max?: number): this`

Sets the exploration queue and optional `max` limit.

---

## 🔁 Async Iteration

The `AsyncSearch` class implements the async iterator protocol:

```js
for await (const next of asyncSearch) {
  // work with next
}
```

Each iteration step:
- Polls the next candidate from the queue
- Expands it using the `space` function which spreads the computation to several machines
- Enqueues the resulting elements (subject to `max`)

---

As a `Each`, however it is more likely used by chaining transformations before finally resolving the search via a `what()` call:

```js
const 
    search = new AsyncSearch()
        .from(start)
            .through(space)
                .via(queue),
    result = search
        .which(predicate)
            .sthen(map)
                .what();
```

See:
- [@fizzwiz/prism library blog](https://prism.blog.fizzwiz.cloud) 
- [Search-And-Select Pattern](https://blog.fizzwiz.cloud/2025/06/search-and-select-pattern.html)  
- [Early vs Late Restriction](https://fluent.blog.fizzwiz.cloud/2025/05/early-vs-late-restriction.html)

---

> *"Define the path, and let ideas emerge from exploration."*  
> — `@fizzwiz ✨`

