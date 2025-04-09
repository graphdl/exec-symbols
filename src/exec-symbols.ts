// #region Lambda Calculus Primitives

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
const U = (le) => (x) => le((y) => x(x)(y))
const Θ = (le) => U(le)(U(le))
const fold = Θ(
  (recFold) => (f) => (acc) => (list) =>
    IF(ISEMPTY(list))(acc)(list((head) => (tail) => f(head)(recFold(f)(acc)(tail)))),
)
const map = (f) => (list) => fold((x) => (acc) => cons(f(x))(acc))(nil)(list)
const append = (l1) => (l2) => fold(cons)(l2)(l1)

// #endregion
// #region Arithmatic

const ZERO = (a) => (b) => b
const SUCC = (n) => (a) => (b) => a(n(a)(b))
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
// #region Utilities

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
const reorder = (entities, order) => map((i) => nth(i)(entities))(order)

// #endregion
// #region Entities

const Entity = (id) => (s) => s(id)
const unit = (id) => Entity(id)
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

const makeVerbFact = (FactType) => {
  // When arity is 0, just return the verb with empty list
  // Otherwise, return a curried function to collect all arguments
  const curry = (args, n) => (n === 0 ? get_verb(FactType)(args) : (arg) => curry(append(args)(cons(arg)(nil)), n - 1))

  return curry(nil, get_arity(FactType))
}

const FactSymbol = (verb) => (entities) => (s) => s(verb, entities)
const get_verb_symbol = (f) => f((v, e) => v)
const get_entities = (f) => f((v, e) => e)

// #endregion
// #region Events with Readings (look up inverses externally)

const Event = (fact) => (time) => (readings) => (s) => s(fact, time, readings)
const get_fact = (e) => e((f, t, r) => f)
const get_time = (e) => e((f, t, r) => t)
const get_event_readings = (e) => e((f, t, r) => r)

// #endregion
// #region State Machine

const unit_state = (a) => (s) => pair(a)(s)

const bind_state = (m) => (f) => (s) => {
  const result = m(s)
  const a = fst(result)
  const s_ = snd(result)
  return f(a)(s_)
}

const make_transition = (guard) => (compute_next) => (state) => (input) =>
  IF(guard(state)(input))(compute_next(state)(input))(state)

const unguarded = make_transition((_s) => (_i) => TRUE)

const StateMachine = (transition) => (initial) => (s) => s(transition, initial)

const run_machine = (machine) => (stream) =>
  machine((transition, initial) => fold((event) => (state) => transition(state)(get_fact(event)))(initial)(stream))

const run_entity = (machine) => (stream) => run_machine(machine)(stream)

// #endregion
// #region Constraints & Violations

const ALETHIC = 'alethic'
const DEONTIC = 'deontic'

const Constraint = (modality) => (predicate) => (s) => s(modality, predicate)
const get_modality = (c) => c((m, _) => m)
const get_predicate = (c) => c((_, p) => p)

const evaluate_constraint = (constraint) => (pop) => get_predicate(constraint)(pop)

const evaluate_with_modality = (constraint) => (pop) => {
  const result = evaluate_constraint(constraint)(pop)
  const modal = get_modality(constraint)
  return pair(modal)(result)
}

const Violation = (constraint) => (entity) => (reason) => (s) => s(constraint, entity, reason)

// #endregion
// #region Meta-Fact Declarations

const entityType = (name) => FactSymbol('entityType')(cons(unit(name))(nil))

const factType = (verb, arity) => FactSymbol('factType')(cons(unit(verb))(cons(unit(arity))(nil)))

const role = (verb, index, name) => FactSymbol('role')(cons(unit(verb))(cons(unit(index))(cons(unit(name))(nil))))

const reading = (verb, parts) => FactSymbol('reading')(cons(unit(verb))(cons(parts)(nil)))

const inverseReading = (primary, inverse, order, template) =>
  FactSymbol('inverseReading')(cons(unit(primary))(cons(unit(inverse))(cons(order)(cons(template)(nil)))))

const constraint = (id, modality) => FactSymbol('constraint')(cons(unit(id))(cons(unit(modality))(nil)))

const constraintTarget = (constraintId, verb, roleIndex) =>
  FactSymbol('constraintTarget')(cons(unit(constraintId))(cons(unit(verb))(cons(unit(roleIndex))(nil))))

const violation = (entity, constraintId, reason) =>
  FactSymbol('violation')(cons(unit(entity))(cons(unit(constraintId))(cons(unit(reason))(nil))))

// #endregion
// #region Reserved Symbols

const CSDP = Symbol('CSDP')
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
  map,
  fold,
  append,
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
  Entity,
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
  get_entities,
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
  run_entity,
  Constraint,
  get_modality,
  get_predicate,
  evaluate_constraint,
  evaluate_with_modality,
  Violation,
  entityType,
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
