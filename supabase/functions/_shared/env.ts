export function getEnvVar(name: string): string {
  const value = Deno.env.get(name)
  if (!value) throw new Error(`Missing env var: ${name}`)
  return value
}

export function getEnvVarOptional(name: string, fallback: string): string {
  return Deno.env.get(name) ?? fallback
}
