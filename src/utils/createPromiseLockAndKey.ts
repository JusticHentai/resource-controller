const createPromiseLockAndKey = () => {
  let promiseKey: (...params: any[]) => void

  const promiseLock = new Promise((resolve) => {
    promiseKey = resolve
  })

  const promise = async () => {
    await promiseLock

    await new Promise<void>((resolve) => {
      setTimeout(() => resolve(), 0)
    })
  }

  return {
    // @ts-ignore ts 检测不了 promise 的执行
    resolve: promiseKey,
    promise: promise(),
  }
}

export default createPromiseLockAndKey
