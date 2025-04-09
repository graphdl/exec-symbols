# exec-symbols

A **purely functional DSL** for modeling facts, entities, constraints, and state machines in JavaScript—using lambda-calculus–inspired Church encodings and composable building blocks.

This library showcases how to represent *boolean logic, pairs, lists, entities, relationships, constraints, events, and more* all as functional closures. It may be useful for educational purposes, rule engines, or domain-specific language experiments.

---

## Table of Contents

- [Features](#features)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [Core Concepts](#core-concepts)
  - [Church Booleans](#church-booleans)
  - [Church Lists and Pairs](#church-lists-and-pairs)
  - [Entities and Binding](#entities-and-binding)
  - [Relationships and Facts](#relationships-and-facts)
  - [Events](#events)
  - [State Machines](#state-machines)
  - [Constraints and Violations](#constraints-and-violations)
- [Examples](#examples)
- [License](#license)
- [Testing](#testing)

---

## Features

- **Church Booleans** (`TRUE`, `FALSE`, `AND`, `OR`, `NOT`) and combinators (`IF`)
- **Church-encoded Pairs and Lists** (`pair`, `fst`, `snd`, `nil`, `cons`, `fold`, `map`, `append`)
- **Entities** with a monadic interface (`Entity`, `unit`, `bind`, `get_id`)
- **Relationship Types** (`FactType`) supporting arity, verb function, reading, and constraints
- **Curried Verb Facts** to dynamically build relationships by supplying arguments (`makeVerbFact`)
- **Symbolic Facts** (`FactSymbol`) and accessors (`get_verb_symbol`, `get_entities`)
- **Events** for time-based fact processing
- **State Machines** with transitions, guard functions, and event-driven updates
- **Constraints** (alethic vs. deontic), with predicates that evaluate over a "population"
- **Violations** to track when constraints are broken
- **DSL for domain meta-facts** (e.g., roles, fact types, constraint references, etc.)

---

## Installation

If you plan to use it in a Node.js project:

```bash
npm install exec-symbols
```

Then, in your code:

```js
const {
  TRUE, FALSE, IF, AND, OR, NOT,
  pair, fst, snd,
  nil, cons, map, fold, append,
  Entity, unit, bind, get_id,
  equals, nth,
  FactType, get_arity, get_verb, get_reading, get_constraints,
  makeVerbFact, FactSymbol, get_verb_symbol, get_entities,
  Event, get_fact, get_time,
  unit_state, bind_state,
  make_transition, unguarded,
  StateMachine, run_machine, run_entity,
  Constraint, get_modality, get_predicate,
  evaluate_constraint, evaluate_with_modality,
  Violation,
  mandatory_role_constraint,
  entityType, factType, role, reading,
  constraint, constraintTarget, violation,
  ALETHIC, DEONTIC,
  RMAP, CSDP
} = require('exec-symbols')
```

---

## Quick Start

1. Create a FactType (relationship type) with a specified arity (the number of entity arguments).
2. Use `makeVerbFact` to build a curried function that expects that many entities.
3. Represent facts using `FactSymbol` (if you just need a symbolic representation).
4. Model constraints as needed, and evaluate them against a collection of facts (the "population").
5. Use `Event` and `StateMachine` to process a stream of events that update your system state.

---

## Core Concepts

### Church Booleans

```js
const TRUE  = t => f => t
const FALSE = t => f => f
const IF    = b => t => e => b(t)(e)

// AND, OR, NOT
const AND   = p => q => p(q)(FALSE)
const OR    = p => q => p(TRUE)(q)
const NOT   = p => p(FALSE)(TRUE)
```

- These are *Church-encoded* booleans. They are functions that, given two branches, choose one to evaluate.

### Church Lists and Pairs

```js
// Pairs
const pair = a => b => f => f(a)(b)
const fst  = p => p((a, _) => a)
const snd  = p => p((_, b) => b)

// Lists
const nil  = c => n => n
const cons = h => t => c => n => c(h)(t(c)(n))
const fold = f => acc => l => l(f)(acc)
const map  = f => l => ...
const append = l1 => l2 => ...
```

- A *pair* is stored as a function that takes a function `f` and applies `f(a)(b)`.
- A *list* is stored as a function that takes a function for the "cons" case (`c`) and a function for the "nil" case (`n`).

### Entities and Binding

const Entity = id => s => s(id)
const unit   = id => Entity(id)
const bind   = e => f => e(id => f(id))
const get_id = e => e(id => id)

- An `Entity` is also a function (the same Church-style approach).
- `unit` creates an entity from an identifier.
- `bind` gives a way to compose entity transformations (similar to a monad).

### Relationships and Facts

#### Relationship Types

```js
const FactType = arity => verbFn => reading => constraints =>
  s => s(arity)(verbFn)(reading)(constraints)
```

- A `FactType` captures:
  1. Arity (number of entities in the relationship),
  2. A verb function,
  3. A reading (a textual representation or something similar),
  4. Constraints (additional rules).

`makeVerbFact`:

```js
const makeVerbFact = FactType => {
  const arity = get_arity(FactType)
  const verb  = get_verb(FactType)

  const curry = (args, n) =>
    n === 0
      ? verb(args)
      : arg => curry(append(args)(cons(arg)(nil)), n - 1)

  return curry(nil, arity)
}
```

- Takes a `FactType` and returns a curried function that expects exactly `arity` number of entities. Once all entities are provided, it executes the underlying verb function.

#### Symbolic Facts

```js
const FactSymbol = verb => entities => s => s(verb)(entities)
```

- A quick way to represent a fact as `(verb, [entities])` in a Church-encoded closure.

### Events

```js
const Event = fact => time => s => s(fact)(time)
const get_fact = e => e((f, t) => f)
const get_time = e => e((f, t) => t)
```

- An `Event` pairs a fact with a time, again using a function-based approach.

### State Machines

```js
// State Monad
const unit_state = a => s => pair(a)(s)
const bind_state = m => f => s => { /* typical state-monad logic */ }

// Transition
const make_transition = guard => compute_next =>
  state => input =>
    IF(guard(state)(input))(
      compute_next(state)(input)
    )(
      state
    )

// StateMachine
const StateMachine = transition => initial => s => s(transition)(initial)

// Running a machine
const run_machine = machine => stream =>
  machine((transition, initial) =>
    fold(event => state =>
      transition(state)(get_fact(event))
    )(initial)(stream)
  )
```

- The code includes guarded transitions (using Church booleans) and a state monad for carrying and updating state.
- `StateMachine` encapsulates a transition function and an initial state.
- `run_machine` processes a *stream* of events (Church-encoded list) against the transition function.

### Constraints and Violations

```js
const Constraint = modality => predicate => s => s(modality)(predicate)
const Violation  = constraint => entity => reason => s => s(constraint)(entity)(reason)
```

- Constraints contain:
  - Modality (e.g., `ALETHIC` or `DEONTIC`).
  - A predicate function to evaluate over a "population."

- A `Violation` is a record of which entity violated which constraint, and why.

Example `mandatory_role_constraint`:

```js
const mandatory_role_constraint = (roleIndex, FactType) => pop => {
  // Ensures that every entity designated for that role
  // actually appears in a fact with the matching verb
}
```

- Verifies that all entities that occupy a certain "role" in a relationship appear in the "population" of facts.

---

## Examples

### Simple Boolean Usage

```js
const isTrue = IF(TRUE)('yes')('no') // 'yes'
const isFalse = IF(FALSE)('yes')('no') // 'no'
```

### Building a Relationship and a Fact

```js
// Define a relationship type: "loves", arity = 2
const lovesFactType = FactType(2)(
  args => {
    // A simple verb function that returns a FactSymbol
    return FactSymbol('loves')(args)
  }
)(
  "X loves Y"        // reading
)(
  nil                // no additional constraints
)

// Make a verb fact for "loves"
const loves = makeVerbFact(lovesFactType)

// Provide two entities
const alice = unit("Alice")
const bob   = unit("Bob")

// Curried usage
const fact = loves(alice)(bob) // => FactSymbol('loves')(cons(alice)(cons(bob)(nil)))

// Inspect
console.log(get_verb_symbol(fact))     // 'loves'
console.log(get_id(nth(0)(get_entities(fact)))) // 'Alice'
console.log(get_id(nth(1)(get_entities(fact)))) // 'Bob'
```

### Basic State Machine Example

```js
// Define a simple guard and next state
const guard = state => input => 
  // For demonstration, only proceed if input matches "go"
  equals(input)(unit("go"))

const compute_next = state => input => 
  // Return a new state, e.g., "running"
  pair(unit("running"))(snd(state))

// Make a transition
const transition = make_transition(guard)(compute_next)

// Initial machine
const myMachine = StateMachine(transition)(pair(unit("idle"))(nil))

// Stream of events
const eventStream = cons(Event(unit("go"))(0))(
                    cons(Event(unit("stop"))(1))(nil))

// Run
const finalState = run_machine(myMachine)(eventStream)
console.log(get_id(fst(finalState))) // "running" if it processed "go"
```

### Lightweight Symbolic Forum Model Example

Demonstrates:

- Executable verbs
- FactTypes and Readings
- Inverse readings (manually declared)
- Event emission with all readings
- Deontic constraint requiring inverse reading
- Minimal fact population with post/reply/moderation

```js
// ───────────── Entities ─────────────
const alice   = unit("alice")
const bob     = unit("bob")
const thread1 = unit("thread-1")
const postA   = unit("post-A")
const postB   = unit("post-B")

// ───────────── FactType: posts ─────────────
const postsVerb = args => {
  const [user, post, thread] = [nth(0)(args), nth(1)(args), nth(2)(args)]
  return FactSymbol("posts")(args)
}

const postsType = FactType(3)(postsVerb)(
  ["", " posted ", " in ", ""]
)(nil)

// Reading: forward
reading("posts", ["", " posted ", " in ", ""])

// Inverse reading (manually declared)
inverseReading("posts", "receivesPostFrom", cons(2)(cons(1)(cons(0)(nil))),
  ["", " received ", " from ", ""])

// ───────────── FactType: replies ─────────────
const repliesVerb = args => {
  const [user, replyPost, originalPost] = [nth(0)(args), nth(1)(args), nth(2)(args)]
  return FactSymbol("replies")(args)
}

const repliesType = FactType(3)(repliesVerb)(
  ["", " replied with ", " to ", ""]
)(nil)

reading("replies", ["", " replied with ", " to ", ""])

// ───────────── FactType: moderates ─────────────
const moderatesVerb = args => {
  const [moderator, post] = [nth(0)(args), nth(1)(args)]
  return FactSymbol("moderates")(args)
}

const moderatesType = FactType(2)(moderatesVerb)(
  ["", " moderated ", ""]
)(nil)

reading("moderates", ["", " moderated ", ""])

// ───────────── Deontic Constraint: inverse required for posts ─────────────
const inverseRequiredForPosts = Constraint(DEONTIC)(
  pop => {
    const found = any(pop, f =>
      get_verb_symbol(f) === "inverseReading" &&
      get_id(nth(0)(get_entities(f))) === "posts"
    )
    return found ? TRUE : FALSE
  }
)

constraint("inverse_required_for_posts", DEONTIC)
constraintTarget("inverse_required_for_posts", "posts", 0)

// ───────────── Fact Instances ─────────────
// Alice posts postA in thread1
const postFact = makeVerbFact(postsType)(alice)(postA)(thread1)

// Bob replies to postA with postB
const replyFact = makeVerbFact(repliesType)(bob)(postB)(postA)

// Alice moderates Bob's post
const modFact = makeVerbFact(moderatesType)(alice)(postB)

// ───────────── Events ─────────────
// Inverse reading list manually provided to Event
const inverseReadingsForPosts = cons(
  make_reading("receivesPostFrom", cons(2)(cons(1)(cons(0)(nil))),
    ["", " received ", " from ", ""])
)(nil)

const event1 = Event(postFact, unit("t1"), inverseReadingsForPosts)
const event2 = Event(replyFact, unit("t2"))
const event3 = Event(modFact, unit("t3"))

// ───────────── Constraint Evaluation ─────────────
const pop = cons(
  inverseReading("posts", "receivesPostFrom", cons(2)(cons(1)(cons(0)(nil))),
    ["", " received ", " from ", ""])
)(nil)

const evalResult = evaluate_with_modality(inverseRequiredForPosts)(pop)
// Expected: pair(DEONTIC)(TRUE)
```

---

## License

This library is provided as-is for learning, experimentation, and reference. Feel free to adapt it for your own purposes.
[MIT License](https://opensource.org/licenses/MIT)

## Testing

This project uses Vitest for testing. To run the tests:

```bash
pnpm test
```

Or with Bun directly:

```bash
bun test
```
