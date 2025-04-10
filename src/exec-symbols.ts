// #region Lambda Calculus Primitives and Utilities

const IDENTITY = (n) => n
const TRUE = (trueCase) => (falseCase) => trueCase
const FALSE = (trueCase) => (falseCase) => falseCase
const IF = (condition) => (trueCase) => (falseCase) => condition(trueCase)(falseCase)
const AND = (p) => (q) => p(q)(FALSE)
const OR = (p) => (q) => p(TRUE)(q)
const NOT = (p) => p(FALSE)(TRUE)
const pair = (a) => (b) => (f) => f(a)(b)
const fst = (pair) => pair(TRUE)
const snd = (pair) => pair(FALSE)
const nil = (c) => TRUE
const ISEMPTY = (L) => L((head) => (tail) => FALSE)
const cons = (head) => (tail) => (selector) => selector(head)(tail)
const list = (...args) => args.reduceRight((acc, item) => cons(item)(acc), nil)
const U = (le) => (x) => le((y) => x(x)(y))
const Θ = (le) => U(le)(U(le))
const fold = Θ(
  (recFold) => (f) => (acc) => (list) =>
    IF(ISEMPTY(list))(acc)(list((head) => (tail) => f(head)(recFold(f)(acc)(tail)))),
)
const map = (f) => (list) => fold((x) => (acc) => cons(f(x))(acc))(nil)(list)
const append = (l1) => (l2) => fold(cons)(l2)(l1)
const equals = (a) => (b) => get_id(a) === get_id(b) ? TRUE : FALSE
const nth = (n) => (list) =>
  Θ(
    (recNth) => (targetN) => (currentList) => (currentIndex) =>
      IF(ISEMPTY(currentList))(nil)(
        IF(EQ(currentIndex)(targetN))(currentList((h) => (_) => h))(
          currentList((h) => (t) => recNth(targetN)(t)(SUCC(currentIndex))),
        ),
      ),
  )(n)(list)(ZERO)
const reorder = (nouns, order) => map((i) => nth(i)(nouns))(order)
const ZERO = (a) => (b) => b
const SUCC = (n) => (a) => (b) => a(n(a)(b))
const UINT = (n) => (n < 0 ? ZERO : Θ((rec) => (m) => m === 0 ? ZERO : SUCC(rec(m - 1)))(n))
const ADD = (m) => (n) => (a) => (b) => m(SUCC)(n)(a)(b)
const MULT = (m) => (n) => (a) => (b) => m(n(a))(b)
const EXP = (m) => (n) => (a) => (b) => n(m)(a)(b)
const PRED = (n) => (f) => (x) => n((g) => (h) => h(g(f)))((u) => x)((u) => u)
const SUB = (m) => (n) => n(PRED)(m)
const ISZERO = (n) => n((x) => ZERO)(TRUE)
const EQ = (m) => (n) => AND(LE(m)(n))(LE(n)(m))
const LE = (m) => (n) => ISZERO(SUB(m)(n))
const GE = (m) => (n) => ISZERO(SUB(n)(m))
const LT = (m) => (n) => NOT(GE(m)(n))
const GT = (m) => (n) => NOT(LE(m)(n))

// #endregion
// #region Nouns

const Noun = (id) => (s) => s(id)
const unit = (id) => Noun(id)
const bind = (e) => (f) => e((id) => f(id))
const get_id = (e) => e((id) => id)

// #endregion
// #region Readings

const Reading = (verb, order, template) => (s) => s(verb, order, template)

const get_reading_verb = (r) => r((v, o, t) => v)
const get_reading_order = (r) => r((v, o, t) => o)
const get_reading_template = (r) => r((v, o, t) => t)

// #endregion
// #region FactType

const FactType = (arity) => (verbFn) => (reading) => (constraints) => (s) => s(arity, verbFn, reading, constraints)

const get_arity = (rt) => rt((a, v, r, c) => a)
const get_verb = (rt) => rt((a, v, r, c) => v)
const get_reading = (rt) => rt((a, v, r, c) => r)
const get_constraints = (rt) => rt((a, v, r, c) => c)

// #endregion
// #region Executable Facts

const makeVerbFact = (FactType) =>
  Θ(
    (curry) => (args) => (n) =>
      n === 0 ? get_verb(FactType)(args) : (arg) => curry(append(args)(cons(arg)(nil)))(n - 1),
  )(nil)(get_arity(FactType))

const FactSymbol = (verb) => (nouns) => (s) => s(verb, nouns)
const get_verb_symbol = (f) => f((v, e) => v)
const get_nouns = (f) => f((v, e) => e)

// #endregion
// #region Events with Readings (look up inverses externally)

const Event = (fact) => (time) => (readings) => (s) => s(fact, time, readings)
const get_fact = (e) => e((f, t, r) => f)
const get_time = (e) => e((f, t, r) => t)
const get_event_readings = (e) => e((f, t, r) => r)

// #endregion
// #region State Machine

const unit_state = (a) => (s) => pair(a)(s)

const bind_state = (m) => (f) => (s) => ((result) => f(fst(result))(snd(result)))(m(s))

const make_transition = (guard) => (compute_next) => (state) => (input) =>
  IF(guard(state)(input))(compute_next(state)(input))(state)

const unguarded = make_transition((_s) => (_i) => TRUE)

const StateMachine = (transition) => (initial) => (s) => s(transition, initial)

const run_machine = (machine) => (stream) =>
  machine((transition, initial) => fold((event) => (state) => transition(state)(get_fact(event)))(initial)(stream))

// #endregion
// #region Constraints & Violations

const ALETHIC = 'alethic'
const DEONTIC = 'deontic'

const Constraint = (modality) => (predicate) => (s) => s(modality, predicate)
const get_modality = (c) => c((m, _) => m)
const get_predicate = (c) => c((_, p) => p)

const evaluate_constraint = (constraint) => (pop) => get_predicate(constraint)(pop)

const evaluate_with_modality = (constraint) => (pop) =>
  pair(get_modality(constraint))(evaluate_constraint(constraint)(pop))

const Violation = (constraint) => (noun) => (reason) => (s) => s(constraint, noun, reason)

// #endregion
// #region Meta-Fact Declarations

const nounType = (name) => FactSymbol('nounType')(list(unit(name)))

const factType = (verb, arity) => FactSymbol('factType')(list(unit(verb), unit(arity)))

const role = (verb, index, name) => FactSymbol('role')(list(unit(verb), unit(index), unit(name)))

const reading = (verb, parts) => FactSymbol('reading')(list(unit(verb), parts))

const inverseReading = (primary, inverse, order, template) =>
  FactSymbol('inverseReading')(list(unit(primary), unit(inverse), order, template))

const constraint = (id, modality) => FactSymbol('constraint')(list(unit(id), unit(modality)))

const constraintTarget = (constraintId, verb, roleIndex) =>
  FactSymbol('constraintTarget')(list(unit(constraintId), unit(verb), unit(roleIndex)))

const violation = (noun, constraintId, reason) =>
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
  IDENTITY,
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
  ISEMPTY,
  cons,
  list,
  map,
  fold,
  append,
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
}
