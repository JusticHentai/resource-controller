import Logger from '@justichentai/logger'
import FILTER from './config/filter'
import { LoadQueue, ResourceMap, ResourceOptions } from './types'
import addNoPriorityToQueue from './utils/addNoPriorityToQueue'
import addPriorityToQueue from './utils/addPriorityToQueue'
import createPromiseLockAndKey from './utils/createPromiseLockAndKey'

export default class ResourceController {
  resourceMap: ResourceMap = {}
  loadQueue: LoadQueue = {
    priorityList: [],
    loadList: [],
  }
  loadQueueImmediately: LoadQueue = {
    priorityList: [],
    loadList: [],
  }
  logger = new Logger()
  lock = {
    loadImmediately: true,
  }

  add = (options: ResourceOptions) => {
    this.logger.info('add', options, '__STOP__')

    const { priority, name } = options

    // 去重
    if (this.resourceMap[name]) {
      return
    }

    priority
      ? addPriorityToQueue(this.loadQueue, options)
      : addNoPriorityToQueue(this.loadQueue, options)

    this.resourceMap[name] = createPromiseLockAndKey()
  }

  load = async () => {
    this.logger.info('load start', this.loadQueue, '__STOP__')

    const { priorityList, loadList } = this.loadQueue

    this.loadQueue = {
      priorityList: [],
      loadList: [],
    }

    for (let j = 0; j < loadList.length; j++) {
      const currentList = loadList[j]

      this.logger.info(
        'load_current start',
        {
          priority: priorityList[j],
          currentList,
        },
        '__STOP__'
      )

      const promiseList = []
      const nameList = []

      for (const { name, loadFn } of currentList) {
        const promise = loadFn()
        promiseList.push(promise)
        nameList.push(name)
      }

      const resList = await Promise.all(promiseList)

      for (let i = 0; i < resList.length; i++) {
        const name = nameList[i]
        const res = resList[i]

        this.resourceMap[name]['current'] = res
        this.resourceMap[name]['resolve']() // 解锁 promise
      }

      this.logger.info(
        'load_current complete',
        {
          priority: priorityList[j],
          currentList,
        },
        '__STOP__'
      )
    }

    this.logger.info('load complete', this.loadQueue, '__STOP__')
  }

  addImmediately = (options: ResourceOptions) => {
    const { priority, name } = options

    // 去重
    if (this.resourceMap[name]) {
      return
    }

    priority
      ? addPriorityToQueue(this.loadQueue, options)
      : addNoPriorityToQueue(this.loadQueue, options)

    this.resourceMap[name] = createPromiseLockAndKey()

    this.loadImmediately()
  }

  loadImmediately = () => {
    if (!this.lock['loadImmediately']) {
      return
    }

    this.lock['loadImmediately'] = false
  }

  log = (filter?: Array<`${FILTER}`>) => {
    filter = filter ?? [FILTER.ADD, FILTER.LOAD, FILTER.LOAD_CURRENT]

    const filterList = this.logger.log().filter((log) => {
      return filter.includes(log.content[0].split(' ')[0])
    })

    return filterList.map((log) => {
      return log.content
    })
  }

  reset = () => {
    this.logger = new Logger()
    this.loadQueue = {
      priorityList: [],
      loadList: [],
    }
    this.resourceMap = {}
  }
}
