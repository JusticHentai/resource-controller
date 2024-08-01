const nextTick = async (promise: Promise<any>) => {
  const res = await promise

  await new Promise<void>((resolve) => {
    setTimeout(() => resolve(), 0)
  })

  return res
}

export default nextTick
