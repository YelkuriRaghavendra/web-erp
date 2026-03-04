import {getContext, StringMap, Context} from './inputs'
import * as core from '@actions/core'

export async function run(): Promise<void> {
  const ctx = getContext()
  const ghEnvVars = getGithubEnvVars()
  const mergedCtx = merge(ghEnvVars, ctx)
  const expandedCtx = expandVariables(mergedCtx)

  setEnvironmentVariables(expandedCtx)
}

function setEnvironmentVariables(expandedCtx: StringMap): void {
  Object.entries(expandedCtx).forEach(([key, value]) => {
    core.exportVariable(key, value)
  })
}

function expandVariables(ctx: StringMap): StringMap {
  const regex = /\$\{?(\w+)\}?/g

  const expandValue = (
    value: string,
    history: {[key: string]: boolean}
  ): string => {
    return value.replace(regex, (m, cleanKey) => {
      if (history[cleanKey]) {
        core.warning(`Circular reference detected for ${m}`)
        return m
      }

      history[cleanKey] = true

      if (Object.prototype.hasOwnProperty.call(ctx, cleanKey)) {
        return expandValue(ctx[cleanKey], {...history})
      }
      return m
    })
  }

  return Object.keys(ctx).reduce((acc, key) => {
    acc[key] = expandValue(ctx[key], {})
    return acc
  }, {} as StringMap)
}

function getGithubEnvVars(): StringMap {
  return Object.entries(process.env).reduce((acc, [key, value]) => {
    if (key.startsWith('GITHUB_')) {
      acc[key] = value || ''
    }
    return acc
  }, {} as StringMap)
}

function merge(ghEnvVars: StringMap, ctx: Context): StringMap {
  return {...ghEnvVars, ...ctx.vars, ...ctx.secrets, ...ctx.envs}
}
