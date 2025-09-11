# 🧭 Search Class — `@fizzwiz/pattern/core`

The `Search` class is a symbolic and non-executable abstraction in the `@fizzwiz/pattern` library.  
It represents a **lazy, structured exploration** of a space of candidate solutions.

Whereas `Run` models a local computation, `Search` expresses a process of *discovery* — an abstract journey across possibilities.

---

## 🧠 Concept

- A `Search` is not an algorithm to run — it is a **formal definition** of how one might explore a space.
- It operates as a **lazy iterable**, meaning the actual traversal is only performed when iterated.
- It supports **chained, declarative transformations** through its fluent interface (inherited from `Each`).

---

## 🧾 API Reference

### Constructor

```js
new Search(start, space, queue, max)
```

- `start`: Initial candidates or values to explore.
- `space`: A generator function or transformation that expands a candidate into more.
- `queue`: A queue structure to manage exploration order (e.g. DFS, BFS, priority).
- `max`: (optional) Maximum number of elements to keep during expansion.

---

## 🧰 Properties

### `start: any`

The initial candidates or seed values of the search.

### `space: Function`

A function that, given a candidate, returns new candidates to explore.

### `queue: Queue`

An internal queue used to manage candidate traversal order.

### `max: number`

Maximum number of candidates to retain during traversal. Prevents unbounded growth.

---

## 🛠️ Fluent Methods

### `from(start: any): this`

Sets the starting candidates.

### `through(space: Function): this`

Defines the space expansion logic.

### `via(queue: Queue, max?: number): this`

Sets the exploration queue and optional `max` limit.

---

## 🔁 Iteration

The `Search` class implements the iterator protocol:

```js
for (const next of search) {
  // work with next
}
```

Each iteration step:
- Polls the next candidate from the queue
- Expands it using the `space` function
- Enqueues the resulting elements (subject to `max`)

---

As a `Each`, however it is more likely used by chaining transformations before finally resolving the search via a `what()` call:

```js
const 
    search = new Search()
        .from(start)
            .through(space)
                .via(queue),
    result = search
        .which(predicate)
            .then(map)
                .what();
```

See:
- [@fizzwiz/fluent library blog](https://fluent.blog.fizzwiz.cloud) 
- [Search-And-Select Pattern](https://blog.fizzwiz.cloud/2025/06/search-and-select-pattern.html)  
- [Early vs Late Restriction](https://fluent.blog.fizzwiz.cloud/2025/05/early-vs-late-restriction.html)

---

> *"Define the path, and let ideas emerge from exploration."*  
> — `@fizzwiz ✨`

