# 🔺 @fizzwiz/prism

**Solve complex problems with reusable, foundational abstractions — locally or at scale.**

`@fizzwiz/prism` provides core problem-solving abstractions that help you explore solution spaces, whether ordinary or extraordinary. Patterns can run locally or tackle complex, even potentially infinite, problem domains spanning across machines.

---

## 🔹 Currently Supported Types

- **Run** — a locally executable, focused abstraction  
- **Search** — defines a solution as the result of exploring a potentially infinite space of candidates  
- **AsyncSearch** — a search spanning a space distributed across multiple machines  

> Learn more at [fizzwiz-prism-js.blogspot.com](https://fizzwiz-prism-js.blogspot.com) — explore the philosophy, concepts, and patterns behind the design.

---

## 🛠️ Installation

### Node.js (ES Modules)

```bash
npm install @fizzwiz/prism
```

```js
import { Run, Search, AsyncSearch } from '@fizzwiz/prism';
```

### Browser (via CDN)

```html
<script src="https://cdn.jsdelivr.net/npm/@fizzwiz/prism/dist/prism.bundle.js"></script>
<script>
  const search = new prism.Search();
</script>
```

The global `prism` object exposes all classes.

---

## 📘 Documentation

- 📗 **API Reference**: [fizzwiz.github.io/prism](https://fizzwiz.github.io/prism)  
  Detailed class methods, properties, and usage examples.

- 📘 **Concepts & Guides**: [fizzwiz-prism-js.blogspot.com](https://fizzwiz-prism-js.blogspot.com)  
  Tutorials, walkthroughs, and philosophy behind the abstractions.

---

**Think big!**  
— `@fizzwiz ✨`