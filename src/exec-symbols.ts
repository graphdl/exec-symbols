// #region Lambda Calculus Primitives and Utilities

// Basic type definitions - using any when needed to express Church encodings
type Truth = <T>(a: T) => (b: T) => T
type Numeral<T = any> = (a: any) => (b: T) => T | ((z: any) => Numeral)
type Pair<A = any, B = any> = <R = any>(f: (a: A) => (b: B) => R) => R
type List<T = any> = (head: T) => (tail: List<T>) => List<T>

const NULL = (b: any) => b
const Identity = <T>(n: T): T => n
const TRUE =
  <T>(a: T) =>
  (_b: T): T =>
    a
const FALSE =
  <T>(_a: T) =>
  (b: T): T =>
    b
const IF =
  <T>(condition: Truth) =>
  (trueCase: T) =>
  (falseCase: T): T =>
    condition(trueCase)(falseCase)
const AND =
  (p: Truth) =>
  (q: Truth): Truth =>
    p(q)(FALSE)
const OR =
  (p: Truth) =>
  (q: Truth): Truth =>
    p(TRUE)(q)
const NOT = (p: Truth): Truth => p(FALSE)(TRUE)
const pair =
  <A = any, B = A>(a: A) =>
  (b: B): Pair<A, B> =>
  (f) =>
    f(a)(b)
const fst = <A = any, B = A | ((a: any) => A)>(p: (f: (a: A) => (b: B) => A) => A): A => p((a) => (_) => a)
const snd = <A = any, B = A | ((a: any) => A)>(p: (f: (a: A) => (b: B) => B) => B): B => p((_) => (b) => b)
const nil: List =
  <T = any>(_c: T) =>
  (a: T) =>
  (_b: T) =>
    a
const ISEMPTY = (L: (head: any) => (tail: any) => any): Truth => L((_head: any) => (_tail: any) => FALSE)
const cons =
  <T = any>(head: T) =>
  (tail: List<T>): List<T> =>
  (selector: any) =>
    selector(head)(tail)
const list = <T = any>(...args: T[]): List<T> => args.reduceRight((acc, item) => cons(item)(acc), nil)

// Type-erased recursion combinators
const U = (le: any) => (x: any) => le((y: any) => x(x)(y))
const Θ = (le: any) => U(le)(U(le))

// List operations with any types
const fold: any = Θ(
  (recFold: any) => (f: any) => (acc: any) => (list: List) =>
    IF(ISEMPTY(list))(acc)(list((head: any) => (tail: any) => f(head)(recFold(f)(acc)(tail)))),
)

const map =
  (f: any) =>
  <T>(list: List<T>): any =>
    fold((x: any) => (acc: any) => cons(f(x))(acc))(nil)(list)

const append =
  <T = any>(l1: List<T>) =>
  <V = T>(l2: List<V>): List<T | V> =>
    fold(cons)(l2)(l1)

const equals =
  (a: any) =>
  (b: any): Truth =>
    get_id(a) === get_id(b) ? TRUE : FALSE

const nth =
  (n: Numeral) =>
  <T>(list: List<T>): any =>
    Θ(
      (recNth: any) =>
        (targetN: Numeral) =>
        (currentList: any) =>
        (currentIndex: Numeral): any =>
          IF(ISEMPTY(currentList))(nil)(
            IF(EQ(currentIndex)(targetN))(currentList((h: any) => (_: any) => h))(
              currentList((h: any) => (t: any) => recNth(targetN)(t)(SUCC(currentIndex))),
            ),
          ),
    )(n)(list)(ZERO)

const reorder = (nouns: any, order: any): any => map((i: any) => nth(i)(nouns))(order)

// Church numerals
const ZERO: Numeral = (_a: any) => NULL
const SUCC =
  (n: Numeral): Numeral =>
  (a: any) =>
  (b: any) =>
    a(n(a)(b))
const UINT = (n: number): Numeral =>
  n < 0 ? ZERO : Θ((rec: any) => (m: number) => m === 0 ? ZERO : SUCC(rec(m - 1)))(n)
const ADD =
  (m: Numeral) =>
  (n: Numeral): Numeral =>
  (a: any) =>
  (b: any) =>
    m(SUCC)(n)(a)(b)
const MULT =
  (m: Numeral) =>
  (n: Numeral): Numeral =>
  (a: any) =>
  (b: any) =>
    m(n(a))(b)
const EXP =
  (m: Numeral) =>
  (n: Numeral): Numeral =>
  (a: any) =>
  (b: any) =>
    n(m)(a)(b)
const PRED =
  (n: Numeral): Numeral =>
  (f: any) =>
  (x: any) =>
    n((g: any) => (h: any) => h(g(f)))((u: any) => x)((u: any) => u)
const SUB =
  (m: Numeral) =>
  (n: Numeral): Numeral =>
    n(PRED)(m)
const ISZERO = (n: Numeral): Truth => n((_x: any) => ZERO)(TRUE) as Truth
const EQ =
  (m: Numeral) =>
  (n: Numeral): Truth =>
    AND(LE(m)(n))(LE(n)(m))
const LE =
  (m: Numeral) =>
  (n: Numeral): Truth =>
    ISZERO(SUB(m)(n))
const GE =
  (m: Numeral) =>
  (n: Numeral): Truth =>
    ISZERO(SUB(n)(m))
const LT =
  (m: Numeral) =>
  (n: Numeral): Truth =>
    NOT(GE(m)(n))
const GT =
  (m: Numeral) =>
  (n: Numeral): Truth =>
    NOT(LE(m)(n))

// #endregion
// #region Nouns

type NounFn<T> = (selector: (id: T) => any) => any

const Noun =
  <T>(id: T): NounFn<T> =>
  (s) =>
    s(id)
const unit = <T>(id: T): NounFn<T> => Noun(id)
const bind =
  <T, R>(e: NounFn<T>) =>
  (f: (id: T) => NounFn<R>): NounFn<R> =>
    e((id) => f(id))
const get_id = <T>(e: NounFn<T>): T => e((id) => id)

// #endregion
// #region Readings

type ReadingFn = (s: (verb: any, order: any, template: any) => any) => any

const Reading =
  (verb: any, order: any, template: any): ReadingFn =>
  (s) =>
    s(verb, order, template)

const get_reading_verb = (r: ReadingFn): any => r((v, o, t) => v)
const get_reading_order = (r: ReadingFn): any => r((v, o, t) => o)
const get_reading_template = (r: ReadingFn): any => r((v, o, t) => t)

// #endregion
// #region FactType

type FactTypeFn = (s: (arity: any, verbFn: any, reading: any, constraints: any) => any) => any

const FactType =
  (arity: any) =>
  (verbFn: any) =>
  (reading: any) =>
  (constraints: any): FactTypeFn =>
  (s) =>
    s(arity, verbFn, reading, constraints)

const get_arity = (rt: FactTypeFn): any => rt((a, v, r, c) => a)
const get_verb = (rt: FactTypeFn): any => rt((a, v, r, c) => v)
const get_reading = (rt: FactTypeFn): any => rt((a, v, r, c) => r)
const get_constraints = (rt: FactTypeFn): any => rt((a, v, r, c) => c)

// #endregion
// #region Executable Facts

const makeVerbFact = (FactType: FactTypeFn): any =>
  Θ(
    (curry: any) => (args: any) => (n: any) =>
      n === 0 ? get_verb(FactType)(args) : (arg: any) => curry(append(args)(cons(arg)(nil)))(n - 1),
  )(nil)(get_arity(FactType))

type FactSymbolFn = (s: (verb: any, nouns: any) => any) => any

const FactSymbol =
  (verb: any) =>
  (nouns: any): FactSymbolFn =>
  (s) =>
    s(verb, nouns)

const get_verb_symbol = (f: FactSymbolFn): any => f((v, e) => v)
const get_nouns = (f: FactSymbolFn): any => f((v, e) => e)

// #endregion
// #region Events with Readings (look up inverses externally)

type EventFn = (s: (fact: any, time: any, readings: any) => any) => any

const Event =
  (fact: any) =>
  (time: any) =>
  (readings: any): EventFn =>
  (s) =>
    s(fact, time, readings)

const get_fact = (e: EventFn): any => e((f, t, r) => f)
const get_time = (e: EventFn): any => e((f, t, r) => t)
const get_event_readings = (e: EventFn): any => e((f, t, r) => r)

// #endregion
// #region State Machine

const unit_state =
  (a: any) =>
  (s: any): any =>
    pair(a)(s)

const bind_state =
  (m: any) =>
  (f: any) =>
  (s: any): any => {
    const result = m(s)
    return f(fst(result))(snd(result))
  }

const make_transition =
  (guard: any) =>
  (compute_next: any) =>
  (state: any) =>
  (input: any): any =>
    IF(guard(state)(input))(compute_next(state)(input))(state)

const unguarded = make_transition((_s: any) => (_i: any) => TRUE)

type StateMachineFn = (s: (transition: any, initial: any) => any) => any

const StateMachine =
  (transition: any) =>
  (initial: any): StateMachineFn =>
  (s) =>
    s(transition, initial)

const run_machine =
  (machine: StateMachineFn) =>
  (stream: any): any =>
    machine((transition: any, initial: any) =>
      fold((event: any) => (state: any) => transition(state)(get_fact(event)))(initial)(stream),
    )

// #endregion
// #region Constraints & Violations

const ALETHIC = 'alethic'
const DEONTIC = 'deontic'

type ConstraintFn = (s: (modality: any, predicate: any) => any) => any

const Constraint =
  (modality: any) =>
  (predicate: any): ConstraintFn =>
  (s) =>
    s(modality, predicate)

const get_modality = (c: ConstraintFn): any => c((m, _) => m)
const get_predicate = (c: ConstraintFn): any => c((_, p) => p)

const evaluate_constraint =
  (constraint: ConstraintFn) =>
  (pop: any): any =>
    get_predicate(constraint)(pop)

const evaluate_with_modality =
  (constraint: ConstraintFn) =>
  (pop: any): any =>
    pair(get_modality(constraint))(evaluate_constraint(constraint)(pop))

type ViolationFn = (s: (constraint: any, noun: any, reason: any) => any) => any

const Violation =
  (constraint: any) =>
  (noun: any) =>
  (reason: any): ViolationFn =>
  (s) =>
    s(constraint, noun, reason)

// #endregion
// #region Meta-Fact Declarations

const nounType = (name: any): FactSymbolFn => FactSymbol('nounType')(list(unit(name)))

const factType = (verb: any, arity: any): FactSymbolFn => FactSymbol('factType')(list(unit(verb), unit(arity)))

const role = (verb: any, index: any, name: any): FactSymbolFn =>
  FactSymbol('role')(list(unit(verb), unit(index), unit(name)))

const reading = (verb: any, parts: any): FactSymbolFn => FactSymbol('reading')(list(unit(verb), parts))

const inverseReading = (primary: any, inverse: any, order: any, template: any): FactSymbolFn =>
  FactSymbol('inverseReading')(list(unit(primary), unit(inverse), order, template))

const constraint = (id: any, modality: any): FactSymbolFn => FactSymbol('constraint')(list(unit(id), unit(modality)))

const constraintTarget = (constraintId: any, verb: any, roleIndex: any): FactSymbolFn =>
  FactSymbol('constraintTarget')(list(unit(constraintId), unit(verb), unit(roleIndex)))

const violation = (noun: any, constraintId: any, reason: any): FactSymbolFn =>
  FactSymbol('violation')(list(unit(noun), unit(constraintId), unit(reason)))

// #endregion
// #region Reserved Symbols

// TODO: CSDP
// The conceptual schema design procedure is an AI-assisted process to create an application schema that runs on top of this framework.
// The AI gathers information from the user and uses it to create the schema.
// 1. Transform familiar information examples into elementary facts, and apply quality checks
// 2. Create the fact types, and apply a population check
// 3. Check for entity types that should be combined, and note any arithmetic derivations
// 4. Add uniqueness constraints, and check arity of fact types
// 5. Add mandatory role constraints, and check for logical derivations
// 6. Add value, set comparison and subtyping constraints
// 7. Add other constraints and perform final checks
const CSDP = Symbol('CSDP')

// TODO: RMAP
// The relational map function transforms the atomic facts into a relational schema.
// This is useful for listing properties of an entity or otherwise defining a schema.
// 0.1 Transform exclusive unaries; map unaries according to their open/closed world semantics.
// 0.2 Temporarily erase all reference (preferred identification) predicates and treat compositely-identified object types as "black boxes".
// 0.3 Indicate any absorbtion-overrides (separation or partition) for subtypes.
// 0.4 Identify any derived fact types that must be stored.
// 0.5 Indicate mapping choices for symmetric 1:1 cases.
// 0.6 Consider replacing any disjunctive reference schemes by using an artificial or concatenated identifier or mandatory defaults.
// 0.7 Indicate mapping choice where required for any objectified associations that have no spanning uniqueness constraint.
// 1.  Map each fact type with a compound uniqueness constraint to a separate table
// 2.1 Fact types with functional roles attached to the same object type grouped into the same table, keyed on the object type's identifier
// 2.2 Map 1:1 cases to a single table, generally favoring fewer nulls
// 3.  Map each independent object type with no functional roles to a separate table
// 4.  Unpack each "black box column" into its component attributes
// 5.1 Map subtype constraints on functional roles to qualified optional columns
// 5.2 Map subtype constraints on nonfunctional roles to qualified subset constraints
// 5.3 Map nonfunctional roles of independent object types to column sequences that reference the independent table
const RMAP = Symbol('RMAP')

// #endregion

export {
  /**
   * The identity function.
   * @param n - The value to return.
   * @returns The value.
   */
  Identity,
  /**
   * The true function.
   * Returns the first parameter.
   * @param trueCase - The value to return if the condition is true.
   * @param falseCase - The value to return if the condition is false.
   * @returns The value.
   */
  TRUE,
  /**
   * The false function.
   * Returns the second parameter. (equivalent ZERO)
   * @param trueCase - The value to return if the condition is true.
   * @param falseCase - The value to return if the condition is false.
   * @returns The value.
   */
  FALSE,
  /**
   * The if function.
   * Returns the first parameter if the condition is true, otherwise the second parameter.
   * @param condition - The condition to check.
   * @param trueCase - The value to return if the condition is true.
   * @param falseCase - The value to return if the condition is false.
   * @returns The value.
   */
  IF,
  /**
   * The and function.
   * Returns true if both parameters are true.
   * @param p - The first value.
   * @param q - The second value.
   * @returns The value.
   */
  AND,
  /**
   * The or function.
   * Returns true if either parameter is true.
   * @param p - The first value.
   * @param q - The second value.
   * @returns The value.
   */
  OR,
  /**
   * The not function.
   * Negates the parameter.
   * @param p - The value to negate.
   * @returns The value.
   */
  NOT,
  /**
   * The pair function.
   * Returns a pair of the two parameters.
   * @param a - The first value.
   * @param b - The second value.
   * @returns The value.
   */
  pair,
  /**
   * Returns the first value of the pair.
   * @param p - The pair.
   * @returns The value.
   */
  fst,
  /**
   * Returns the second value of the pair.
   * @param p - The pair.
   * @returns The value.
   */
  snd,
  nil,
  NULL,
  ISEMPTY,
  cons,
  list,
  map,
  fold,
  append,
  PRED,
  UINT,
  /**
   * The zero function.
   * Returns the identity function as a constant. (equivalent to FALSE)
   * @param a - The function to apply to the pair.
   * @returns The value.
   */
  ZERO,
  /**
   * The successor function.
   * Returns the successor of the parameter.
   * @param n - The value of which to get the successor.
   * @returns The value.
   */
  SUCC,
  /**
   * The addition function.
   * Returns the sum of the two parameters.
   * @param m - The first value.
   * @param n - The second value.
   * @returns The value.
   */
  ADD,
  /**
   * The multiplication function.
   * Returns the product of the two parameters.
   * @param m - The first value.
   * @param n - The second value.
   * @returns The value.
   */
  MULT,
  /**
   * The exponentiation function.
   * Returns the first parameter raised to the power of the second parameter.
   * @param m - The base.
   * @param n - The exponent.
   * @returns The value.
   */
  EXP,
  /**
   * The equality function.
   * Returns true if the two parameters are equal.
   * @param a - The first value.
   * @param b - The second value.
   * @returns The value.
   */
  EQ,
  /**
   * The less than function.
   * Returns true if the first parameter is less than the second parameter.
   * @param m - The first value.
   * @param n - The second value.
   * @returns The value.
   */
  LT,
  /**
   * The greater than function.
   * Returns true if the first parameter is greater than the second parameter.
   * @param m - The first value.
   * @param n - The second value.
   * @returns The value.
   */
  GT,
  /**
   * The less than or equal to function.
   * Returns true if the first parameter is less than or equal to the second parameter.
   * @param m - The first value.
   * @param n - The second value.
   * @returns The value.
   */
  LE,
  /**
   * The greater than or equal to function.
   * Returns true if the first parameter is greater than or equal to the second parameter.
   * @param m - The first value.
   * @param n - The second value.
   * @returns The value.
   */
  GE,
  Noun,
  unit,
  bind,
  get_id,
  /**
   * The equals function.
   * Returns true if two references are to the same object.
   * @param a - The first value.
   * @param b - The second value.
   * @returns The value.
   */
  equals,
  /**
   * The nth function.
   * Returns the nth element of the list.
   * @param n - The index of the element to return.
   * @param list - The list to search.
   */
  nth,
  reorder,
  FactType,
  get_arity,
  get_verb,
  get_reading,
  get_constraints,
  makeVerbFact,
  FactSymbol,
  get_verb_symbol,
  get_nouns,
  Reading,
  get_reading_verb,
  get_reading_order,
  get_reading_template,
  Event,
  get_fact,
  get_time,
  get_event_readings,
  unit_state,
  bind_state,
  make_transition,
  unguarded,
  StateMachine,
  run_machine,
  Constraint,
  get_modality,
  get_predicate,
  evaluate_constraint,
  evaluate_with_modality,
  Violation,
  nounType,
  factType,
  role,
  reading,
  inverseReading,
  constraint,
  constraintTarget,
  violation,
  ALETHIC,
  DEONTIC,
  RMAP,
  CSDP,
  type Truth,
  type Numeral,
  type Pair,
  type List,
}
