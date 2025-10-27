# 🏁 Run Class

The `Run` class is a foundational abstraction in the `@fizzwiz/pattern` library.  
It represents a **focused, locally executable process** — the simplest form of algorithmic logic grounded in a single idea.

Every `Run` is a concrete unit of computation designed to solve a category of problems.

---

## 🧠 Concept

- **Run** models a computational act.
- It executes an algorithmic idea that can either:
  - Return a solution directly
  - Or mutate its internal state for further interrogation.

This abstraction provides a **unified interface (`run()`)** for executing a unit of logic.

The utility of this class is to distinguish conventional algorithms (the `Run`) from the formal definitions of solutions (the `Search`)

---

## 🧾 API Reference

### `run(): Run | any`

Runs the algorithm defined by the subclass.

- **Returns**:  
  A value (e.g. a result), or a reference to `this` for fluent method chaining.

- **Throws**:  
  An error if not implemented in the subclass.

