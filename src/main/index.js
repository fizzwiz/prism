// ─── Core Exports ────────────────────────────────────────────
import { Run } from './core/Run.js';
import { Search } from './core/Search.js';
import { AsyncSearch } from './core/AsyncSearch.js';
import { PopRace } from './run/PopRace.js';
import { ConvergingRun } from './run/ConvergingRun.js';

export { Run, Search, AsyncSearch, PopRace, ConvergingRun };

// ─── Core Module ─────────────────────────────────────────────
/**
 * @module core
 * @description
 * Core abstractions for the `@fizzwiz/pattern` library.
 * Includes the foundational classes for defining algorithms and problem-solving patterns.
 */

// ─── Run Submodule ───────────────────────────────────────────
/**
 * @module run
 * @description
 * Abstractions of locally executable patterns.
 * Includes convergence-based and population-based runners:
 * - {@link ConvergingRun} — iterative algorithms that converge toward a solution.
 * - {@link PopRace} — generalized population-based selection framework.
 */

// ─── Search Submodule ────────────────────────────────────────
/**
 * @module search
 * @description
 * Abstractions for lazy, declarative searches, either local or spanning multiple machines.
 * Currently empty.
 */
