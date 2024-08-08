import { LoadQueue, ResourceMap, ResourceOptions } from '../types'

const loadCurrent = async (loadQueue: LoadQueue, resourceMap: ResourceMap) => {
  const loadList = loadQueue.loadList
  const currentLoadList = loadList[0]
  const priorityList = loadQueue.priorityList

  const test = []
  for (const item of loadQueue.loadList) {
    test.push([...item])
  }

  console.log('=== 每次执行 loadCurrent ===', {
    loadList: test,
    priorityList: [...loadQueue.priorityList],
  })

  // 所有队列处理完毕
  if (!loadList.length) {
    console.log('=== loadCurrent 整体跑完 ===', loadQueue)
    return
  }

  // 跑完当前优先级队列 继续下一个
  if (!currentLoadList.length) {
    priorityList?.shift()
    loadList.shift()

    console.log('=== loadCurrent 删除 ===')

    await loadCurrent(loadQueue, resourceMap)

    return
  }

  const { name, loadFn } = currentLoadList.shift() as ResourceOptions

  const current = await loadFn()

  resourceMap[name].current = current
  resourceMap[name].resolve()

  await loadCurrent(loadQueue, resourceMap)
}

export default loadCurrent
