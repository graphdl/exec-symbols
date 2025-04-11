import {
  Event,
  FactSymbol,
  get_fact,
  get_verb_symbol,
  list,
  make_transition,
  nil,
  run_machine,
  StateMachine,
  TRUE,
  unit,
} from './exec-symbols'

const emitCallFact = (domain: string, method: string, args: Record<string, any>) => {
  const argNouns = Object.entries(args ?? {}).map(([k, v]) => unit(`${k}:${String(v)}`))
  return FactSymbol(`${domain}.${method}`)(list(...argNouns))
}

// Wrap a service (ai / api / db) so that every method invocation is recorded
export const wrapTrackedService = <T extends Record<string, any>>(
  domain: string,
  service: T,
  record: (event: any) => void,
): T => {
  const proxy: Record<string, any> = {}

  for (const [method, fn] of Object.entries(service)) {
    proxy[method] = async (args: any) => {
      const fact = emitCallFact(domain, method, args)
      const event = Event(fact)(Date.now())(nil)
      record(event)
      return await (fn as any)(args)
    }
  }

  return proxy as T
}

export const execSymbolsAdapter = (workflowDef: Record<string, Function>) => {
  const wrapped: Record<string, Function> = {}

  for (const [trigger, handler] of Object.entries(workflowDef)) {
    wrapped[trigger] = async ({
      ai,
      api,
      db,
      event,
      ...rest
    }: {
      ai: any
      api: any
      db: any
      event: any
      [key: string]: any
    }) => {
      const log: any[] = []
      const record = (ev: any) => log.push(ev)

      // Track each service so calls become symbolic events
      const tAi = wrapTrackedService('ai', ai, record)
      const tApi = wrapTrackedService('api', api, record)
      const tDb = wrapTrackedService('db', db, record)

      // Record the triggering event itself symbolically
      const triggerFact = FactSymbol(trigger)(list(unit('event')))
      const triggerEvent = Event(triggerFact)(Date.now())(nil)
      record(triggerEvent)

      // Optional: run a simple state machine over the log (identity transition)
      const identityTransition = make_transition(() => () => TRUE)((state: any) => (_: any) => state)
      const machine = (s: any) => s(identityTransition, null)
      const state = run_machine(machine)(list(...log))

      // Execute the original handler with tracked services and symbolic context
      const result = await handler({
        ai: tAi,
        api: tApi,
        db: tDb,
        event,
        symbolic: { state, log },
        ...rest,
      })

      return { result, symbolic: { state, log } }
    }
  }

  return wrapped
}

// Functions.do implementation - AI function prototyping and structured output
export const createAIFunctions = <T extends Record<string, any>>(schema: T): T => {
  const proxy: Record<string, any> = {}

  for (const [method, returnType] of Object.entries(schema)) {
    proxy[method] = async (args: any, options?: { model?: string }) => {
      // In a real implementation, this would call an LLM with the method, args, and returnType schema
      // For now, we just return a mock object matching the returnType structure
      return structuredClone(returnType)
    }
  }

  return proxy as T
}

// Workflows.do implementation - Business process orchestration
export const createWorkflow = (workflowDef: Record<string, Function>) => {
  // Apply the exec symbols adapter to track all service calls
  const wrappedWorkflow = execSymbolsAdapter(workflowDef)

  // Add workflow-specific functionality
  return {
    ...wrappedWorkflow,
    // Add methods to get workflow metadata, handle triggers, etc.
    getDefinition: () => workflowDef,
    getTriggers: () => Object.keys(workflowDef),
  }
}

// Agents.do implementation - Autonomous digital workers
export const createAgent = (agentConfig: {
  name: string
  role: string
  job: string
  url?: string
  integrations?: string[]
  triggers?: string[]
  searches?: string[]
  actions?: string[]
  kpis?: string[]
}) => {
  // Create a state machine to track the agent's state
  const createAgentStateMachine = () => {
    // Define agent-specific transitions
    const agentTransition = make_transition(() => () => TRUE)((state: any) => (input: any) => {
      // Process input and update state
      return { ...state, lastInput: input, timestamp: Date.now() }
    })

    return StateMachine(agentTransition)({
      name: agentConfig.name,
      role: agentConfig.role,
      status: 'idle',
      history: [],
    })
  }

  // Create workflows for each trigger
  const triggerWorkflows = (agentConfig.triggers || []).reduce((acc, trigger) => {
    acc[trigger] = async ({ event, ...context }: any) => {
      // Process the trigger, update agent state, and perform actions
      return { processed: true, trigger, event }
    }
    return acc
  }, {} as Record<string, Function>)

  // Wrap the agent's workflows with exec symbols
  const wrappedWorkflows = execSymbolsAdapter(triggerWorkflows)

  return {
    ...agentConfig,
    ...wrappedWorkflows,
    stateMachine: createAgentStateMachine(),
    actions: (agentConfig.actions || []).reduce((acc, action) => {
      acc[action] = async (args: any) => {
        // Implement action logic
        return { action, args, status: 'completed' }
      }
      return acc
    }, {} as Record<string, Function>),
    searches: (agentConfig.searches || []).reduce((acc, search) => {
      acc[search] = async (query: any) => {
        // Implement search logic
        return { search, query, results: [] }
      }
      return acc
    }, {} as Record<string, Function>),
  }
}

// APIs.do implementation - Clickable developer experiences
export const createAPI = (apiConfig: {
  name: string
  description: string
  endpoints: Record<
    string,
    {
      method: 'GET' | 'POST' | 'PUT' | 'DELETE'
      path: string
      handler: Function
    }
  >
}) => {
  const wrappedEndpoints = Object.entries(apiConfig.endpoints).reduce((acc, [name, endpoint]) => {
    // Wrap each endpoint handler with exec symbols
    const wrappedHandler = execSymbolsAdapter({ [name]: endpoint.handler })[name]

    acc[name] = {
      ...endpoint,
      handler: wrappedHandler,
      // Add a method to invoke the endpoint directly
      invoke: async (args: any) => {
        return await wrappedHandler({ event: args })
      },
    }

    return acc
  }, {} as Record<string, any>)

  return {
    ...apiConfig,
    endpoints: wrappedEndpoints,
    // Generate an API schema for documentation
    getSchema: () => ({
      name: apiConfig.name,
      description: apiConfig.description,
      endpoints: Object.entries(apiConfig.endpoints).reduce((acc, [name, endpoint]) => {
        acc[name] = {
          method: endpoint.method,
          path: endpoint.path,
        }
        return acc
      }, {} as Record<string, any>),
    }),
  }
}

// Database.do implementation - AI-enriched data
export const createDatabase = <T extends Record<string, Record<string, string>>>(schema: T) => {
  // Create tables based on schema
  const database: Record<string, any> = {}

  for (const [tableName, tableSchema] of Object.entries(schema)) {
    // Create a collection for each table
    database[tableName] = {
      // Basic CRUD operations
      create: async (data: any) => {
        // In a real implementation, this would store the data
        // For now, we just return a mock with an ID
        const id = `${tableName}_${Date.now()}`
        return { id, ...data, url: `https://database.do/${tableName}/${id}` }
      },

      read: async (id: string) => {
        // Mock read implementation
        return { id, _table: tableName }
      },

      update: async (id: string, data: any) => {
        // Mock update implementation
        return { id, ...data, updated: true }
      },

      delete: async (id: string) => {
        // Mock delete implementation
        return { id, deleted: true }
      },

      // AI-powered search
      search: async (query: string) => {
        // In a real implementation, this would use vector search or similar
        return { query, results: [] }
      },
    }
  }

  return database as {
    [K in keyof T]: {
      create: (data: any) => Promise<any>
      read: (id: string) => Promise<any>
      update: (id: string, data: any) => Promise<any>
      delete: (id: string) => Promise<any>
      search: (query: string) => Promise<any>
    }
  }
}

// Triggers.do implementation - Start business processes
export const createTrigger = (config: {
  name: string
  description: string
  source: string // e.g. 'database', 'api', 'time'
  condition: (event: any) => boolean
  action: (event: any) => Promise<any>
}) => {
  // Create a wrapped action that records events
  const log: any[] = []
  const record = (ev: any) => log.push(ev)

  // Wrap the action with exec symbols
  const wrappedAction = execSymbolsAdapter({
    [config.name]: config.action,
  })[config.name]

  return {
    ...config,
    // Method to trigger the action manually
    fire: async (event: any) => {
      if (config.condition(event)) {
        // Record the trigger event
        const triggerFact = FactSymbol(`trigger.${config.name}`)(list(unit('event')))
        const triggerEvent = Event(triggerFact)(Date.now())(nil)
        record(triggerEvent)

        // Execute the action
        return await wrappedAction({ event })
      }
      return { triggered: false, reason: 'Condition not met' }
    },
    // Get the event log
    getLog: () => log,
  }
}

// Searches.do implementation - Provide context & understanding
export const createSearch = <T>(config: {
  name: string
  description: string
  sources: string[] // Data sources to search
  handler: (query: any) => Promise<T[]>
}) => {
  // Wrap the search handler with exec symbols
  const wrappedHandler = execSymbolsAdapter({
    [config.name]: config.handler,
  })[config.name]

  return {
    ...config,
    // Method to execute the search
    execute: async (query: any) => {
      const result = await wrappedHandler({ event: { query } })
      return result.result
    },
    // Method to get search metadata
    getMetadata: () => ({
      name: config.name,
      description: config.description,
      sources: config.sources,
    }),
  }
}

// Actions.do implementation - Impact the external world
export const createAction = <T, R>(config: {
  name: string
  description: string
  handler: (params: T) => Promise<R>
  permissions?: string[]
  validation?: (params: T) => boolean
}) => {
  // Wrap the action handler with exec symbols
  const wrappedHandler = execSymbolsAdapter({
    [config.name]: config.handler,
  })[config.name]

  return {
    ...config,
    // Method to execute the action
    execute: async (params: T) => {
      // Validate parameters if a validation function is provided
      if (config.validation && !config.validation(params)) {
        return { success: false, error: 'Validation failed' } as unknown as R
      }

      // Execute the handler
      const result = await wrappedHandler({ event: { params } })
      return result.result
    },
    // Method to get action metadata
    getMetadata: () => ({
      name: config.name,
      description: config.description,
      permissions: config.permissions || [],
    }),
  }
}

// Events.do implementation - Track business events
export const createEventTracker = () => {
  const eventLog: any[] = []

  return {
    track: async (eventName: string, data: any) => {
      // Create a fact for the event
      const eventFact = FactSymbol(eventName)(list(...Object.entries(data).map(([k, v]) => unit(`${k}:${String(v)}`))))
      const event = Event(eventFact)(Date.now())(nil)

      // Add to log
      eventLog.push(event)

      return { eventName, timestamp: Date.now(), data }
    },
    getLog: () => eventLog,
    getEvents: (eventName?: string) => {
      if (eventName) {
        return eventLog.filter((e) => get_verb_symbol(get_fact(e)) === eventName)
      }
      return eventLog
    },
  }
}
