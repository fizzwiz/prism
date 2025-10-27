import assert from "assert";
import { Path } from '@fizzwiz/fluent';

import { Search } from '@fizzwiz/prism';
import { ArrayQueue } from '@fizzwiz/sorted';
import { What } from "@fizzwiz/fluent";

const items = ['A', 'B', 'C'];
const space = path => path.across(items);

const n = 2;
const restricted = What.as(space)
  .which(path => path.length < 2 || path.prev.last < path.last); // sorted paths

const predicate = path => true; // all sorted paths

const paths = new Search()
  .from(new Path())
  .through(restricted)
  .via(new ArrayQueue())
  .which(predicate);

for (let path of paths) {
    console.log(path.toArray())
}

