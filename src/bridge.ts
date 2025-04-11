import { Event, FactSymbol, list, make_transition, nil, run_machine, TRUE, unit } from './exec-symbols'

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
