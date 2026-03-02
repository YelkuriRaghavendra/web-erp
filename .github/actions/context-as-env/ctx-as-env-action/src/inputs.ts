import {getInput, notice} from '@actions/core'

export enum Inputs {
  SecretsContext = 'secrets-context',
  VarsContext = 'vars-context',
  EnvsContext = 'envs-context'
}

export type StringMap = {[key: string]: string}

export interface Context {
  secrets: StringMap
  vars: StringMap
  envs: StringMap
}

function tryParseJSON(value: string): StringMap {
  try {
    let result = JSON.parse(value)

    if (typeof result === 'string') {
      result = JSON.parse(result)
    }

    return result
  } catch (err) {
    throw new Error(`Failed to unmarshal '${value}' : ${err}`)
  }
}

function getCtx(input: Inputs): StringMap {
  const inputValue: string = getInput(input)
  let output: StringMap = {}

  if (inputValue) {
    output = tryParseJSON(inputValue)
  } else {
    notice(`Missing input: ${input}`)
  }

  return output
}

export function getContext(): Context {
  return {
    secrets: getCtx(Inputs.SecretsContext),
    vars: getCtx(Inputs.VarsContext),
    envs: getCtx(Inputs.EnvsContext)
  }
}
