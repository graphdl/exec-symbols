import { describe, expect, it } from 'vitest'
import {
  ALETHIC,
  Constraint,
  FactSymbol,
  FactType,
  Reading,
  TRUE,
  UINT,
  RMAP,
  get_id,
  get_nouns,
  get_verb_symbol,
  list,
  makeVerbFact,
  nil,
  nth,
  unit,
} from '../src'
import { toJSON } from '../src/rmap'

describe('RMAP', () => {
  it('should transform atomic facts into a relational schema', () => {
    // Define fact types
    const hasNameFn = (args) => FactSymbol(unit('hasName'))(args)
    const hasNameType = FactType(2)(hasNameFn)(
      Reading(unit('hasName'))(list(unit(0), unit(1)))(list(unit(''), unit(' has name '), unit(''))),
    )(nil)

    const livesAtFn = (args) => FactSymbol(unit('livesAt'))(args)
    const livesAtType = FactType(2)(livesAtFn)(
      Reading(unit('livesAt'))(list(unit(0), unit(1)))(list(unit(''), unit(' lives at '), unit(''))),
    )(nil)

    // Create facts
    const person1 = unit('person1')
    const person2 = unit('person2')
    const address1 = unit('address1')

    const hasName = makeVerbFact(hasNameType)
    const livesAt = makeVerbFact(livesAtType)

    const facts = [
      hasName(person1)(unit('John')),
      hasName(person2)(unit('Jane')),
      livesAt(person1)(address1),
      livesAt(person2)(address1),
    ]

    const nameUniquenessConstraint = Constraint(ALETHIC)(() => TRUE)

    // Run the pipeline
    const result = RMAP(facts, [nameUniquenessConstraint])

    // Verify results
    expect(result).toBeDefined()
    expect(result.schema).toBeDefined()
    expect(result.schema.tables).toBeDefined()

    // The schema should include tables for Person and Address
    expect(result.transformedFacts.length).toBeGreaterThan(0)
  })

  it('should handle reference predicates and black boxes', () => {
    // Define fact types
    const identifiesFn = (args) => FactSymbol(unit('identifies'))(args)
    const identifiesType = FactType(2)(identifiesFn)(
      Reading(unit('identifies'))(list(unit(0), unit(1)))(list(unit(''), unit(' identifies '), unit(''))),
    )(nil)

    const hasFn = (args) => FactSymbol(unit('has'))(args)
    const hasType = FactType(2)(hasFn)(
      Reading(unit('has'))(list(unit(0), unit(1)))(list(unit(''), unit(' has '), unit(''))),
    )(nil)

    // Create facts
    const user = unit('user')
    const userId = unit('userId')
    const profile = unit('profile')

    const identifies = makeVerbFact(identifiesType)
    const has = makeVerbFact(hasType)

    const facts = [identifies(userId)(user), has(user)(profile)]

    // Run the pipeline
    const result = RMAP(facts, [])

    // Verify results
    expect(result).toBeDefined()
    expect(result.schema).toBeDefined()

    // The reference predicate should be detected
    const foundBlackBox = result.transformedFacts.length < facts.length
    expect(foundBlackBox).toBe(true)
  })

  it('should handle the "Alice loves Bob" relationship example', () => {
    // Define a fact type for "loves" with arity 2
    const verbFn = (args) => FactSymbol(unit('loves'))(args)
    const reading = Reading(unit('loves'))(list(UINT(0), UINT(1)))(list(unit(''), unit(' loves '), unit('')))
    const constraints = nil

    // Create a fact type using primitive number 2 for arity
    const lovesFactType = FactType(2)(verbFn)(reading)(constraints)
    const loves = makeVerbFact(lovesFactType)

    // Create nouns
    const alice = unit('Alice')
    const bob = unit('Bob')

    // Create the fact
    const fact = loves(alice)(bob)

    // Create a unique constraint for the relationship
    const uniqueConstraint = Constraint(ALETHIC)(() => TRUE)

    // Run RMAP
    const result = RMAP([fact], [uniqueConstraint])

    // Verify results
    expect(result).toBeDefined()
    expect(result.schema).toBeDefined()
    expect(result.schema.tables).toBeDefined()

    // The schema should include a relationship between Alice and Bob
    expect(result.transformedFacts.length).toBe(1)

    // Verify the fact was preserved
    const transformedFact = result.transformedFacts[0]
    expect(get_verb_symbol(transformedFact)).toBe('loves')

    const nouns = get_nouns(transformedFact)
    expect(get_id(nth(UINT(0))(nouns))).toBe('Alice')
    expect(get_id(nth(UINT(1))(nouns))).toBe('Bob')

    // Alice and Bob should both appear as entities in the schema
    const tables = result.schema.tables
    expect(tables.some((t) => t.name === 'Alice')).toBe(true)
    expect(tables.some((t) => t.name === 'Bob')).toBe(true)
  })
})

describe('RMAP JSON Serialization', () => {
  it('should convert RMAP results to JSON', () => {
    // Define a fact type for "loves" with arity 2
    const verbFn = (args) => FactSymbol(unit('loves'))(args)
    const reading = Reading(unit('loves'))(list(UINT(0), UINT(1)))(list(unit(''), unit(' loves '), unit('')))
    const constraints = nil

    // Create a fact type using primitive number 2 for arity
    const lovesFactType = FactType(2)(verbFn)(reading)(constraints)
    const loves = makeVerbFact(lovesFactType)

    // Create nouns
    const alice = unit('Alice')
    const bob = unit('Bob')

    // Create the fact
    const fact = loves(alice)(bob)

    // Create a unique constraint for the relationship
    const uniqueConstraint = Constraint(ALETHIC)(() => TRUE)

    // Run RMAP
    const result = RMAP([fact], [uniqueConstraint])
    
    // Convert to JSON
    const jsonResult = toJSON(result)
    
    // Verify JSON structure
    expect(jsonResult).toBeDefined()
    expect(jsonResult.schema).toBeDefined()
    expect(jsonResult.schema.tables).toBeInstanceOf(Array)
    
    // Check transformed facts
    expect(jsonResult.transformedFacts).toBeInstanceOf(Array)
    expect(jsonResult.transformedFacts.length).toBe(1)
    
    const factJson = jsonResult.transformedFacts[0] as { verb: string; nouns: string[] }
    expect(factJson).toHaveProperty('verb', 'loves')
    expect(factJson).toHaveProperty('nouns')
    expect(factJson.nouns).toBeInstanceOf(Array)
    expect(factJson.nouns).toContain('Alice')
    expect(factJson.nouns).toContain('Bob')
    expect(factJson.nouns.length).toBe(2)
    
    // Verify tables include Alice and Bob
    const tables = jsonResult.schema.tables
    expect(tables.some((t) => t.name === 'Alice')).toBe(true)
    expect(tables.some((t) => t.name === 'Bob')).toBe(true)
  })
})
