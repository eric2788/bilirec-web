declare module 'streamsaver' {
  export const supported: boolean
  export function createWriteStream(filename: string, options?: { size?: number }): any
  const _default: {
    supported: boolean
    createWriteStream: typeof createWriteStream
    mitm?: string
  }
  export default _default
}
