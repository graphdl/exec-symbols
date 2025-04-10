import { describe, it, expect } from 'vitest'
import * as symbols from '../src/exec-symbols'

const zero = symbols.ZERO
const one = symbols.SUCC(zero)
const two = symbols.SUCC(one)
const three = symbols.SUCC(two)
const four = symbols.SUCC(three)
const five = symbols.SUCC(four)
const six = symbols.SUCC(five)
const eight = symbols.SUCC(symbols.SUCC(six))
const nine = symbols.SUCC(eight)

describe('Lambda Calculus Primitives', () => {
  describe('IDENTITY', () => {
    it('should return the input value', () => {
      expect(symbols.IDENTITY(5)).toBe(5)
      expect(symbols.IDENTITY('test')).toBe('test')
      const obj = { a: 1 }
      expect(symbols.IDENTITY(obj)).toBe(obj)
    })
  })

  describe('TRUE and FALSE', () => {
    it('TRUE should return the first argument', () => {
      expect(symbols.TRUE('first')('second')).toBe('first')
    })

    it('FALSE should return the second argument', () => {
      expect(symbols.FALSE('first')('second')).toBe('second')
    })
  })

  describe('IF', () => {
    it('should return the first argument when condition is TRUE', () => {
      expect(symbols.IF(symbols.TRUE)('then')('else')).toBe('then')
    })

    it('should return the second argument when condition is FALSE', () => {
      expect(symbols.IF(symbols.FALSE)('then')('else')).toBe('else')
    })
  })

  describe('AND, OR, NOT', () => {
    it('AND should combine two predicates correctly', () => {
      // AND returns TRUE (first arg) only when both inputs are TRUE
      const result1 = symbols.AND(symbols.TRUE)(symbols.TRUE)
      expect(result1('yes')('no')).toBe('yes')

      const result2 = symbols.AND(symbols.TRUE)(symbols.FALSE)
      expect(result2('yes')('no')).toBe('no')

      const result3 = symbols.AND(symbols.FALSE)(symbols.TRUE)
      expect(result3('yes')('no')).toBe('no')

      const result4 = symbols.AND(symbols.FALSE)(symbols.FALSE)
      expect(result4('yes')('no')).toBe('no')
    })

    it('OR should combine two predicates correctly', () => {
      // OR returns TRUE (first arg) if either input is TRUE
      const result1 = symbols.OR(symbols.TRUE)(symbols.TRUE)
      expect(result1('yes')('no')).toBe('yes')

      const result2 = symbols.OR(symbols.TRUE)(symbols.FALSE)
      expect(result2('yes')('no')).toBe('yes')

      const result3 = symbols.OR(symbols.FALSE)(symbols.TRUE)
      expect(result3('yes')('no')).toBe('yes')

      const result4 = symbols.OR(symbols.FALSE)(symbols.FALSE)
      expect(result4('yes')('no')).toBe('no')
    })

    it('NOT should negate predicates correctly', () => {
      const result1 = symbols.NOT(symbols.TRUE)
      expect(result1('yes')('no')).toBe('no')

      const result2 = symbols.NOT(symbols.FALSE)
      expect(result2('yes')('no')).toBe('yes')
    })
  })

  describe('Church Lists and Pairs', () => {
    it('pair should create a pair that can be accessed with a function', () => {
      const p = symbols.pair(1)(2)
      expect(p((a) => (b) => a)).toBe(1)
      expect(p((a) => (b) => b)).toBe(2)
    })

    it('fst should extract the first element of a pair', () => {
      const p = symbols.pair(1)(2)
      expect(symbols.fst(p)).toBe(1)
    })

    it('snd should extract the second element of a pair', () => {
      const p = symbols.pair(1)(2)
      expect(symbols.snd(p)).toBe(2)
    })

    it('nil should represent an empty list', () => {
      // Create an empty list
      const emptyList = symbols.nil

      // Verify empty list
      expect(symbols.IF(symbols.ISEMPTY(emptyList))('yes')('no')).toEqual('yes')
    })

    it('cons should add an element to the start of a list', () => {
      // Create an empty list
      const emptyList = symbols.nil

      // Create a list with one element
      const oneElementList = symbols.cons(zero)(emptyList)

      // Create a list with multiple elements using list instead of cons
      const multiElementList = symbols.list(zero, one, two)

      // Verify one element list
      expect(symbols.fst(oneElementList)).toEqual(zero)

      // Verify multi-element list - the order matches how we constructed it
      expect(symbols.fst(multiElementList)).toEqual(zero)
      expect(symbols.fst(symbols.snd(multiElementList))).toEqual(one)

      // Test cons adds to the front by creating a new list
      const newList = symbols.cons(eight)(multiElementList)

      // Original list should be unchanged
      expect(symbols.fst(multiElementList)).toEqual(zero)
      expect(symbols.fst(symbols.snd(multiElementList))).toEqual(one)
      expect(symbols.fst(symbols.snd(symbols.snd(multiElementList)))).toEqual(two)

      // New list should have the new element at the front
      expect(symbols.fst(newList)).toEqual(eight)
      expect(symbols.fst(symbols.snd(newList))).toEqual(zero)
      expect(symbols.fst(symbols.snd(symbols.snd(newList)))).toEqual(one)
    })

    it('fold should apply a function to each element of a list', () => {
      const list = symbols.list(zero, one, two)
      const sum = symbols.fold(symbols.ADD)(zero)(list)
      expect(symbols.EQ(sum)(three)('yes')('no')).toBe('yes')
    })

    it('map should transform each element of a list', () => {
      const list = symbols.list(zero, one, two)

      // Test a simpler transformation: increment by one
      const incremented = symbols.map((x) => symbols.SUCC(x))(list)

      // Now test that: zero+1=one, one+1=two, two+1=three
      expect(symbols.EQ(symbols.fst(incremented))(one)('yes')('no')).toEqual('yes')
      expect(symbols.EQ(symbols.fst(symbols.snd(incremented)))(two)('yes')('no')).toEqual('yes')
      expect(symbols.EQ(symbols.fst(symbols.snd(symbols.snd(incremented))))(three)('yes')('no')).toEqual('yes')
    })

    it('append should join two lists', () => {
      const list1 = symbols.list(zero, one)
      const list2 = symbols.list(two, three)
      const joined = symbols.append(list1)(list2)
      expect(symbols.fst(joined)).toEqual(zero)
      expect(symbols.fst(symbols.snd(joined))).toEqual(one)
      expect(symbols.fst(symbols.snd(symbols.snd(joined)))).toEqual(two)
      expect(symbols.fst(symbols.snd(symbols.snd(symbols.snd(joined))))).toEqual(three)
    })
  })

  describe('Church Numerals', () => {
    it('ZERO should represent the number 0', () => {
      // In Church encoding, a numeral n is a function that applies another function f, n times to a value x
      // So ZERO should apply a function 0 times, meaning it returns the original value

      // Test with a simple increment function
      const increment = (x) => x + 1
      const result = symbols.ZERO(increment)(5)

      // Since ZERO applies the function 0 times, we should get back the original value (5)
      expect(result).toBe(5)

      // We can also test that it equals a function that returns the identity function
      expect(symbols.EQ(symbols.ZERO)((a) => symbols.IDENTITY)('yes')('no')).toBe('yes')
    })

    it('UINT should convert JavaScript numbers to Church numerals', () => {
      // Test with negative number - should return ZERO
      const negativeResult = symbols.UINT(-5)
      expect(symbols.EQ(negativeResult)(symbols.ZERO)('yes')('no')).toBe('yes')

      // Test with zero - should return ZERO
      const zeroResult = symbols.UINT(0)
      expect(symbols.EQ(zeroResult)(symbols.ZERO)('yes')('no')).toBe('yes')

      // Test with positive numbers - should return the correct Church numeral
      const oneResult = symbols.UINT(1)
      expect(symbols.EQ(oneResult)(one)('yes')('no')).toBe('yes')

      const threeResult = symbols.UINT(4)
      expect(symbols.EQ(threeResult)(four)('yes')('no')).toBe('yes')

      const fiveResult = symbols.UINT(5)
      expect(symbols.EQ(fiveResult)(five)('yes')('no')).toBe('yes')

      // Test with larger number
      const nineResult = symbols.UINT(9)
      expect(symbols.EQ(nineResult)(nine)('yes')('no')).toBe('yes')
    })

    it('SUCC should increment a Church numeral', () => {
      expect(symbols.EQ(one)(symbols.SUCC(zero))('yes')('no')).toBe('yes')
      expect(symbols.EQ(two)(symbols.SUCC(one))('yes')('no')).toBe('yes')
      expect(symbols.EQ(three)(symbols.SUCC(two))('yes')('no')).toBe('yes')
      expect(symbols.EQ(eight)(symbols.SUCC(symbols.SUCC(symbols.SUCC(five))))('yes')('no')).toBe('yes')
    })

    it('ADD should add two Church numerals', () => {
      expect(symbols.EQ(symbols.ADD(zero)(zero))(zero)('yes')('no')).toBe('yes')
      expect(symbols.EQ(symbols.ADD(zero)(one))(one)('yes')('no')).toBe('yes')
      expect(symbols.EQ(symbols.ADD(one)(one))(two)('yes')('no')).toBe('yes')
      expect(symbols.EQ(symbols.ADD(two)(two))(four)('yes')('no')).toBe('yes')
      expect(symbols.EQ(symbols.ADD(two)(three))(five)('yes')('no')).toBe('yes')
    })

    it('MULT should multiply two Church numerals', () => {
      expect(symbols.EQ(symbols.MULT(zero)(zero))(zero)('yes')('no')).toBe('yes')
      expect(symbols.EQ(symbols.MULT(zero)(one))(zero)('yes')('no')).toBe('yes')
      expect(symbols.EQ(symbols.MULT(one)(one))(one)('yes')('no')).toBe('yes')
      expect(symbols.EQ(symbols.MULT(two)(two))(four)('yes')('no')).toBe('yes')
      expect(symbols.EQ(symbols.MULT(two)(three))(six)('yes')('no')).toBe('yes')
    })

    it('EXP should raise one Church numeral to the power of another', () => {
      expect(symbols.EQ(symbols.EXP(zero)(zero))(one)('yes')('no')).toBe('yes')
      expect(symbols.EQ(symbols.EXP(zero)(one))(zero)('yes')('no')).toBe('yes')
      expect(symbols.EQ(symbols.EXP(one)(one))(one)('yes')('no')).toBe('yes')
      expect(symbols.EQ(symbols.EXP(two)(two))(four)('yes')('no')).toBe('yes')
      expect(symbols.EQ(symbols.EXP(two)(three))(eight)('yes')('no')).toBe('yes')
      expect(symbols.EQ(symbols.EXP(three)(two))(nine)('yes')('no')).toBe('yes')
    })

    it('Comparison operators (EQ, LT, GT, LE, GE) should work correctly', () => {
      // Test EQ (equality)
      // Equal values
      expect(symbols.EQ(zero)(zero)('equal')('not equal')).toBe('equal')
      expect(symbols.EQ(one)(one)('equal')('not equal')).toBe('equal')
      expect(symbols.EQ(two)(two)('equal')('not equal')).toBe('equal')
      expect(symbols.EQ(three)(three)('equal')('not equal')).toBe('equal')

      // Non-equal values
      expect(symbols.EQ(zero)(one)('equal')('not equal')).toBe('not equal')
      expect(symbols.EQ(one)(two)('equal')('not equal')).toBe('not equal')
      expect(symbols.EQ(two)(three)('equal')('not equal')).toBe('not equal')
      expect(symbols.EQ(three)(zero)('equal')('not equal')).toBe('not equal')

      // Test LT (less than)
      // True cases
      expect(symbols.LT(zero)(one)('less')('not less')).toBe('less')
      expect(symbols.LT(one)(two)('less')('not less')).toBe('less')
      expect(symbols.LT(two)(three)('less')('not less')).toBe('less')

      // False cases (including equal values)
      expect(symbols.LT(one)(zero)('less')('not less')).toBe('not less')
      expect(symbols.LT(two)(one)('less')('not less')).toBe('not less')
      expect(symbols.LT(three)(two)('less')('not less')).toBe('not less')
      expect(symbols.LT(zero)(zero)('less')('not less')).toBe('not less')
      expect(symbols.LT(one)(one)('less')('not less')).toBe('not less')

      // Test GT (greater than)
      // True cases
      expect(symbols.GT(one)(zero)('greater')('not greater')).toBe('greater')
      expect(symbols.GT(two)(one)('greater')('not greater')).toBe('greater')
      expect(symbols.GT(three)(two)('greater')('not greater')).toBe('greater')

      // False cases (including equal values)
      expect(symbols.GT(zero)(one)('greater')('not greater')).toBe('not greater')
      expect(symbols.GT(one)(two)('greater')('not greater')).toBe('not greater')
      expect(symbols.GT(two)(three)('greater')('not greater')).toBe('not greater')
      expect(symbols.GT(zero)(zero)('greater')('not greater')).toBe('not greater')
      expect(symbols.GT(two)(two)('greater')('not greater')).toBe('not greater')

      // Test LE (less than or equal)
      // True cases for less
      expect(symbols.LE(zero)(one)('less or equal')('not less or equal')).toBe('less or equal')
      expect(symbols.LE(one)(two)('less or equal')('not less or equal')).toBe('less or equal')
      expect(symbols.LE(two)(three)('less or equal')('not less or equal')).toBe('less or equal')

      // True cases for equal
      expect(symbols.LE(zero)(zero)('less or equal')('not less or equal')).toBe('less or equal')
      expect(symbols.LE(one)(one)('less or equal')('not less or equal')).toBe('less or equal')
      expect(symbols.LE(two)(two)('less or equal')('not less or equal')).toBe('less or equal')

      // False cases
      expect(symbols.LE(one)(zero)('less or equal')('not less or equal')).toBe('not less or equal')
      expect(symbols.LE(two)(one)('less or equal')('not less or equal')).toBe('not less or equal')
      expect(symbols.LE(three)(two)('less or equal')('not less or equal')).toBe('not less or equal')

      // Test GE (greater than or equal)
      // True cases for greater
      expect(symbols.GE(one)(zero)('greater or equal')('not greater or equal')).toBe('greater or equal')
      expect(symbols.GE(two)(one)('greater or equal')('not greater or equal')).toBe('greater or equal')
      expect(symbols.GE(three)(two)('greater or equal')('not greater or equal')).toBe('greater or equal')

      // True cases for equal
      expect(symbols.GE(zero)(zero)('greater or equal')('not greater or equal')).toBe('greater or equal')
      expect(symbols.GE(one)(one)('greater or equal')('not greater or equal')).toBe('greater or equal')
      expect(symbols.GE(three)(three)('greater or equal')('not greater or equal')).toBe('greater or equal')

      // False cases
      expect(symbols.GE(zero)(one)('greater or equal')('not greater or equal')).toBe('not greater or equal')
      expect(symbols.GE(one)(two)('greater or equal')('not greater or equal')).toBe('not greater or equal')
      expect(symbols.GE(two)(three)('greater or equal')('not greater or equal')).toBe('not greater or equal')
    })
  })
})

describe('Nouns', () => {
  describe('Noun, unit, bind, get_id', () => {
    it('should create and manipulate nouns', () => {
      const noun = symbols.Noun(42)
      expect(symbols.get_id(noun)).toBe(42)

      const unitNoun = symbols.unit(42)
      expect(symbols.get_id(unitNoun)).toBe(42)

      const boundNoun = symbols.bind(unitNoun)((id: number) => symbols.unit(id * 2))
      expect(symbols.get_id(boundNoun)).toBe(84)
    })
  })

  describe('equals', () => {
    it('should compare nouns by ID', () => {
      const noun1 = symbols.unit(1)
      const noun2 = symbols.unit(1)
      const noun3 = symbols.unit(2)

      expect(symbols.equals(noun1)(noun2)('yes')('no')).toBe('yes')
      expect(symbols.equals(noun1)(noun3)('yes')('no')).toBe('no')
    })
  })

  describe('Utility functions', () => {
    it('nth should return the nth element of a list', () => {
      const list = symbols.list(zero, one, two)
      expect(symbols.EQ(symbols.nth(zero)(list))(zero)('yes')('no')).toBe('yes')
      expect(symbols.EQ(symbols.nth(one)(list))(one)('yes')('no')).toBe('yes')
      expect(symbols.EQ(symbols.nth(two)(list))(two)('yes')('no')).toBe('yes')
    })
  })
})

describe('Relationships and Facts', () => {
  describe('FactType', () => {
    it('should create a relationship type with arity, verb function, reading, and constraints', () => {
      // 1. Create test values
      const testArity = 2
      const testVerbFn = (args) => symbols.FactSymbol('loves')(args)
      const testReading = 'X loves Y'
      const testConstraints = symbols.nil

      // 2. Create the FactType
      const factType = symbols.FactType(testArity)(testVerbFn)(testReading)(testConstraints)

      // 3. Test that the values were stored correctly
      expect(symbols.get_arity(factType)).toBe(testArity)
      expect(symbols.get_verb(factType)).toBe(testVerbFn)
      expect(symbols.get_reading(factType)).toBe(testReading)
      expect(symbols.get_constraints(factType)).toBe(testConstraints)

      // 4. Test makeVerbFact with this FactType
      const loves = symbols.makeVerbFact(factType)

      // 5. Create nouns
      const alice = symbols.unit('Alice')
      const bob = symbols.unit('Bob')

      // 6. Create a fact using the curried function
      const aliceLovesBob = loves(alice)(bob)

      // 7. Verify the fact
      expect(symbols.get_verb_symbol(aliceLovesBob)).toBe('loves')

      // 8. Verify the nouns in the fact
      const nouns = symbols.get_nouns(aliceLovesBob)
      expect(symbols.get_id(symbols.nth(zero)(nouns))).toBe('Alice')
      expect(symbols.get_id(symbols.nth(one)(nouns))).toBe('Bob')
    })
  })

  describe('makeVerbFact', () => {
    it('should create a curried function to build facts', () => {
      const verbFn = (args) => symbols.FactSymbol('loves')(args)
      const reading = ['', ' loves ', '']
      const constraints = symbols.nil

      // Create a fact type using primitive number 2 for arity
      const lovesFactType = symbols.FactType(2)(verbFn)(reading)(constraints)
      const loves = symbols.makeVerbFact(lovesFactType)

      const alice = symbols.unit('Alice')
      const bob = symbols.unit('Bob')

      const fact = loves(alice)(bob)

      // Verify the created fact
      expect(symbols.get_verb_symbol(fact)).toBe('loves')

      // Verify nouns
      const nouns = symbols.get_nouns(fact)
      expect(symbols.get_id(symbols.nth(zero)(nouns))).toBe('Alice')
      expect(symbols.get_id(symbols.nth(one)(nouns))).toBe('Bob')
    })
  })

  describe('FactSymbol', () => {
    it('should create a symbolic fact with verb and nouns', () => {
      const alice = symbols.unit('Alice')
      const bob = symbols.unit('Bob')
      const nouns = symbols.list(alice, bob)

      const fact = symbols.FactSymbol('loves')(nouns)

      expect(symbols.get_verb_symbol(fact)).toBe('loves')
      expect(symbols.get_nouns(fact)).toBe(nouns)

      // Verify we can access the nouns correctly
      expect(symbols.get_id(symbols.nth(zero)(symbols.get_nouns(fact)))).toBe('Alice')
      expect(symbols.get_id(symbols.nth(one)(symbols.get_nouns(fact)))).toBe('Bob')
    })
  })
})

describe('Readings', () => {
  it('should create and access reading properties', () => {
    const verb = symbols.FactSymbol('loves')
    const order = symbols.list(zero, one)
    const template = ['', ' loves ', '']

    const reading = symbols.Reading(verb, order, template)

    expect(symbols.get_reading_verb(reading)).toBe(verb)
    expect(symbols.get_reading_order(reading)).toBe(order)
    expect(symbols.get_reading_template(reading)).toBe(template)
  })
})

describe('Events', () => {
  it('should create and access event properties', () => {
    const alice = symbols.unit('Alice')
    const bob = symbols.unit('Bob')
    const nouns = symbols.list(alice, bob)

    const fact = symbols.FactSymbol('loves')(nouns)
    const time = 'yesterday'
    const readings = symbols.list('Alice loves Bob')

    const event = symbols.Event(fact)(time)(readings)

    expect(symbols.get_fact(event)).toBe(fact)
    expect(symbols.get_time(event)).toBe(time)
    expect(symbols.get_event_readings(event)).toBe(readings)
  })
})

describe('State Machines', () => {
  describe('State manipulation', () => {
    it('unit_state should create a state with a value', () => {
      const state = symbols.unit_state(42)('state')
      expect(symbols.fst(state)).toBe(42)
      expect(symbols.snd(state)).toBe('state')
    })

    it('bind_state should compose state transformations', () => {
      const state = symbols.bind_state((s) => symbols.unit_state(s.length)(s))(
        (n) => (s) => symbols.unit_state(n * 2)(s + '!'),
      )('test')

      expect(symbols.fst(state)).toBe(8) // 'test' length is 4, doubled is 8
      expect(symbols.snd(state)).toBe('test!')
    })
  })

  describe('Transitions', () => {
    it('should create transitions with guards', () => {
      const guard = (state) => (input) => symbols.equals(input)(symbols.unit('valid'))
      const compute_next = (state) => (input) => 'next-state'

      const transition = symbols.make_transition(guard)(compute_next)

      expect(transition('state')(symbols.unit('valid'))).toBe('next-state')
      expect(transition('state')(symbols.unit('invalid'))).toBe('state')
    })

    it('unguarded should create a transition without a guard', () => {
      const compute_next = (state) => (input) => 'next-state'

      const transition = symbols.unguarded(compute_next)

      expect(transition('state')(symbols.unit('anything'))).toBe('next-state')
    })
  })

  describe('StateMachine', () => {
    it('should create and run a state machine', () => {
      // Define a simple counter state machine
      const initialState = 0
      const transition = symbols.unguarded((state) => (input) => {
        if (symbols.get_verb_symbol(input) === 'inc') return state + 1
        if (symbols.get_verb_symbol(input) === 'dec') return state - 1
        return state
      })

      const counterMachine = symbols.StateMachine(transition)(initialState)

      // Create events
      const incEvent1 = symbols.Event(symbols.FactSymbol('inc')(symbols.nil))('t1')(symbols.nil)
      const incEvent2 = symbols.Event(symbols.FactSymbol('inc')(symbols.nil))('t2')(symbols.nil)
      const decEvent = symbols.Event(symbols.FactSymbol('dec')(symbols.nil))('t3')(symbols.nil)

      // Create event stream
      const eventStream = symbols.list(incEvent1, incEvent2, decEvent)

      // Run machine
      const finalState = symbols.run_machine(counterMachine)(eventStream)
      expect(finalState).toBe(1) // 0 + 1 + 1 - 1 = 1
    })
  })
})

describe('Constraints and Violations', () => {
  describe('Constraint creation and evaluation', () => {
    it('should create a constraint with modality and predicate', () => {
      const modality = symbols.ALETHIC
      const predicate = (pop) => true

      const constraint = symbols.Constraint(modality)(predicate)

      expect(symbols.get_modality(constraint)).toBe(modality)
      expect(symbols.get_predicate(constraint)).toBe(predicate)
    })

    it('should evaluate constraints against a population', () => {
      const alwaysTrue = symbols.Constraint(symbols.ALETHIC)((pop) => true)
      const alwaysFalse = symbols.Constraint(symbols.DEONTIC)((pop) => false)

      expect(symbols.evaluate_constraint(alwaysTrue)('population')).toBe(true)
      expect(symbols.evaluate_constraint(alwaysFalse)('population')).toBe(false)
    })

    it('should evaluate constraints with modality', () => {
      const alwaysTrue = symbols.Constraint(symbols.ALETHIC)((pop) => true)
      const alwaysFalse = symbols.Constraint(symbols.DEONTIC)((pop) => false)

      const resultTrue = symbols.evaluate_with_modality(alwaysTrue)('population')
      const resultFalse = symbols.evaluate_with_modality(alwaysFalse)('population')

      expect(symbols.fst(resultTrue)).toBe(symbols.ALETHIC)
      expect(symbols.snd(resultTrue)).toBe(true)

      expect(symbols.fst(resultFalse)).toBe(symbols.DEONTIC)
      expect(symbols.snd(resultFalse)).toBe(false)
    })
  })

  describe('Violations', () => {
    it('should create a violation with constraint, noun, and reason', () => {
      const constraint = symbols.Constraint(symbols.DEONTIC)((pop) => false)
      const noun = symbols.unit('Alice')
      const reason = 'Violated rule'

      const violation = symbols.Violation(constraint)(noun)(reason)

      // We need to provide a selector to extract data
      expect(violation((c, e, r) => c)).toBe(constraint)
      expect(violation((c, e, r) => e)).toBe(noun)
      expect(violation((c, e, r) => r)).toBe(reason)
    })
  })
})

describe('Meta-Fact Declarations', () => {
  it('nounType should create a noun type', () => {
    const fact = symbols.nounType('person')
    expect(symbols.get_verb_symbol(fact)).toBe('nounType')
    expect(symbols.get_id(symbols.nth(symbols.ZERO)(symbols.get_nouns(fact)))).toBe('person')
  })

  it('factType should create a fact type declaration', () => {
    const fact = symbols.factType('loves', 2)
    expect(symbols.get_verb_symbol(fact)).toBe('factType')
    expect(symbols.get_id(symbols.nth(symbols.ZERO)(symbols.get_nouns(fact)))).toBe('loves')
    expect(symbols.get_id(symbols.nth(one)(symbols.get_nouns(fact)))).toBe(2)
  })

  it('role should create a role declaration', () => {
    const fact = symbols.role('loves', 0, 'lover')
    expect(symbols.get_verb_symbol(fact)).toBe('role')
    expect(symbols.get_id(symbols.nth(symbols.ZERO)(symbols.get_nouns(fact)))).toBe('loves')
    expect(symbols.get_id(symbols.nth(one)(symbols.get_nouns(fact)))).toBe(0)
    expect(symbols.get_id(symbols.nth(two)(symbols.get_nouns(fact)))).toBe('lover')
  })

  it('reading should create a reading declaration', () => {
    const template = ['', ' loves ', '']
    const fact = symbols.reading('loves', template)
    expect(symbols.get_verb_symbol(fact)).toBe('reading')
    expect(symbols.get_id(symbols.nth(symbols.ZERO)(symbols.get_nouns(fact)))).toBe('loves')
  })

  it('inverseReading should create an inverse reading declaration', () => {
    const order = symbols.list(1, 0)
    const template = ['', ' is loved by ', '']
    const fact = symbols.inverseReading('loves', 'is_loved_by', order, template)
    expect(symbols.get_verb_symbol(fact)).toBe('inverseReading')
    expect(symbols.get_id(symbols.nth(symbols.ZERO)(symbols.get_nouns(fact)))).toBe('loves')
    expect(symbols.get_id(symbols.nth(one)(symbols.get_nouns(fact)))).toBe('is_loved_by')
  })

  it('constraint should create a constraint declaration', () => {
    const fact = symbols.constraint('unique_lover', symbols.ALETHIC)
    expect(symbols.get_verb_symbol(fact)).toBe('constraint')
    expect(symbols.get_id(symbols.nth(symbols.ZERO)(symbols.get_nouns(fact)))).toBe('unique_lover')
    expect(symbols.get_id(symbols.nth(one)(symbols.get_nouns(fact)))).toBe(symbols.ALETHIC)
  })

  it('constraintTarget should create a constraint target declaration', () => {
    const fact = symbols.constraintTarget('unique_lover', 'loves', 0)
    expect(symbols.get_verb_symbol(fact)).toBe('constraintTarget')
    expect(symbols.get_id(symbols.nth(symbols.ZERO)(symbols.get_nouns(fact)))).toBe('unique_lover')
    expect(symbols.get_id(symbols.nth(one)(symbols.get_nouns(fact)))).toBe('loves')
    expect(symbols.get_id(symbols.nth(two)(symbols.get_nouns(fact)))).toBe(0)
  })

  it('violation should create a violation declaration', () => {
    const noun = symbols.unit('Alice')
    const fact = symbols.violation(noun, 'unique_lover', 'Already has a lover')
    expect(symbols.get_verb_symbol(fact)).toBe('violation')
    expect(symbols.get_nouns(fact)).toBeDefined()
  })
})

describe('Constants', () => {
  describe('Modalities', () => {
    it('should define modality constants', () => {
      expect(symbols.ALETHIC).toBe('alethic')
      expect(symbols.DEONTIC).toBe('deontic')
    })
  })

  describe('Reserved Symbols', () => {
    it('should have the reserved symbols defined', () => {
      expect(typeof symbols.CSDP).toBe('symbol')
      expect(typeof symbols.RMAP).toBe('symbol')
    })
  })
})

describe('Utility Functions', () => {
  describe('reorder', () => {
    it('should reorder nouns according to the order list', () => {
      // Create a list of nouns
      const alice = symbols.unit('Alice')
      const bob = symbols.unit('Bob')
      const charlie = symbols.unit('Charlie')
      const nouns = symbols.list(alice, bob, charlie)

      // Create an order list to rearrange: [2, 0, 1] (charlie, alice, bob)
      const order = symbols.list(two, zero, one)

      // Apply reorder
      const reordered = symbols.reorder(nouns, order)

      // Check that the order is now [charlie, alice, bob]
      expect(symbols.get_id(symbols.nth(zero)(reordered))).toBe('Charlie')
      expect(symbols.get_id(symbols.nth(one)(reordered))).toBe('Alice')
      expect(symbols.get_id(symbols.nth(two)(reordered))).toBe('Bob')
    })
  })
})

describe('Reading Templates', () => {
  it('should create readings with appropriate template parts', () => {
    // Define a reading template that will be used to render a relationship
    const template = ['', ' loves ', '']

    // Create a reading with a verb and order
    const verbSymbol = 'loves'
    const order = symbols.list(zero, one)
    const readingObj = symbols.Reading(verbSymbol, order, template)

    // Check the template was stored correctly
    expect(symbols.get_reading_template(readingObj)).toBe(template)
    expect(symbols.get_reading_verb(readingObj)).toBe(verbSymbol)
    expect(symbols.get_reading_order(readingObj)).toBe(order)
  })

  it('should allow comprehensive reading templates with positions', () => {
    // More complex template with multiple parts
    const template = ['', ' sent ', ' to ', ' on ']

    // Create a reading with a verb and order (e.g., "sender sent message to recipient on date")
    const verbSymbol = 'sent'
    const order = symbols.list(zero, one, two, three)

    const readingObj = symbols.Reading(verbSymbol, order, template)

    expect(symbols.get_reading_template(readingObj)).toBe(template)
    expect(symbols.get_reading_verb(readingObj)).toBe(verbSymbol)
  })
})

describe('Inverse Reading Functionality', () => {
  it('should create inverse readings', () => {
    // Primary reading: "Alice loves Bob" -> Inverse: "Bob is loved by Alice"
    const primary = 'loves'
    const inverse = 'is_loved_by'
    // Reverse the order from [0,1] to [1,0]
    const order = symbols.list(one, zero)
    const template = ['', ' is loved by ', '']

    const invReading = symbols.inverseReading(primary, inverse, order, template)

    // Check the inverse reading structure
    expect(symbols.get_verb_symbol(invReading)).toBe('inverseReading')
    expect(symbols.get_id(symbols.nth(zero)(symbols.get_nouns(invReading)))).toBe('loves')
    expect(symbols.get_id(symbols.nth(one)(symbols.get_nouns(invReading)))).toBe('is_loved_by')

    // The third element should be the order
    const readingOrder = symbols.nth(two)(symbols.get_nouns(invReading))
    expect(readingOrder).toBe(order)

    // The fourth element should be the template
    const readingTemplate = symbols.nth(three)(symbols.get_nouns(invReading))
    expect(readingTemplate).toBe(template)
  })

  it('should support inverse readings with more complex relationships', () => {
    // Primary: "Student enrolled in Course" -> Inverse: "Course has student enrolled"
    const primary = 'enrolled_in'
    const inverse = 'has_enrolled'
    // Swap student and course: [0,1] -> [1,0]
    const order = symbols.list(one, zero)
    const template = ['', ' has ', ' enrolled']

    const invReading = symbols.inverseReading(primary, inverse, order, template)

    expect(symbols.get_id(symbols.nth(symbols.ZERO)(symbols.get_nouns(invReading)))).toBe('enrolled_in')
    expect(symbols.get_id(symbols.nth(one)(symbols.get_nouns(invReading)))).toBe('has_enrolled')
  })
})
