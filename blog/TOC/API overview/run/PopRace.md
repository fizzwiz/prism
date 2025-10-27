# 🏁 PopRace Class

The `PopRace` class provides a **generalized selection framework** inspired by the Needleman-Wunsch algorithm.
It abstracts the process of exploring combinatorial spaces efficiently by transforming exponential growth problems into linear propagation through structured populations.

Each population corresponds to a selection column, retaining only the top candidates at each step, enabling a **race of populations** to progress with controlled complexity.

---

## 🧠 Concept

* PopRace models a **structured selection process** over multiple populations.
* Each population receives candidates, expands them, partitions them, and selects the best items using a comparator.
* Reduces the complexity from **r^c** candidates to **r * c**, where r is the number of populations and c is the number of steps.
* Enables exploration of combinatorial problems, ranking sequences, and path evaluation efficiently.

---

## 🧾 API Reference

### Constructor

```js
new PopRace(pop, popSize, generator, partitioner, comparator)
```

| Parameter     | Type     | Description                                                   |
| ------------- | -------- | ------------------------------------------------------------- |
| `pop`         | Iterable | Initial population of items                                   |
| `popSize`     | number   | Maximum number of items per generated population              |
| `generator`   | Function | Function `(item, iStep) => Iterable` that generates new items |
| `partitioner` | Function | Function `(item, iStep) => key` assigning items to partitions |
| `comparator`  | Function | Function `(a, b) => number` for ranking candidates            |

---

## 🧰 Properties

* `pop: Iterable` — Initial population.
* `popSize: number` — Maximum candidates to propagate per population.
* `generator: Function` — Generates new items from each candidate.
* `partitioner: Function` — Assigns each item to a partition.
* `comparator: Function` — Compares candidates for ranking.
* `map: Map` — Mapping of partitions to their respective populations.
* `ranking: SortedArray` — Sorted collection of all selected items during the race.

---

## 🛠️ Methods

### `run(): this`

Executes the race. Iterates through populations, generates new candidates, partitions them, and updates rankings.

### `static ofChoices(options, filter, value, popSize = 16): PopRace`

Builds a PopRace for exploring and ranking sequences of choices.

* `options`: Iterable of options to construct paths from.
* `filter`: Function `(path) => boolean` to prune paths.
* `value`: Function `(path) => number` to score paths.
* `popSize`: Number of top paths to retain.

Returns a configured PopRace instance.

### `static ofMatches(nrows, ncols, value, popSize = 16)`

Placeholder for exploring and ranking sequences of matches [r, c]. Not implemented yet.

---

## 💡 Rationale

* Provides a **linearized approximation of exponential combinatorial spaces**.
* Retains only the top candidates at each population step, reducing memory and computation requirements.
* Can be adapted for path exploration, sequence ranking, or general combinatorial selection tasks.
