import Logger from '@justichentai/logger'
import FILTER from './config/filter'
import { LoadQueue, ResourceMap, ResourceOptions } from './types'
import addNoPriorityToQueue from './utils/addNoPriorityToQueue'
import addPriorityToQueue from './utils/addPriorityToQueue'

export default class ResourceController {
  resourceMap: ResourceMap = {}
  loadQueue: LoadQueue = {
    priorityList: [],
    loadList: [],
  }
  logger = new Logger()

  add = (options: ResourceOptions) => {
    this.logger.info('add', options, '__STOP__')

    const { priority, name } = options

    priority
      ? addPriorityToQueue(this.loadQueue, options)
      : addNoPriorityToQueue(this.loadQueue, options)

    this.resourceMap[name] = {}
  }

  load = async () => {
    this.logger.info('load start', this.loadQueue, '__STOP__')

    const { priorityList, loadList } = this.loadQueue

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
        this.resourceMap[name] = { promise }
      }

      const resList = await Promise.all(promiseList)

      for (let i = 0; i < resList.length; i++) {
        const name = nameList[i]
        const res = resList[i]

        this.resourceMap[name]['current'] = res
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

    this.loadQueue = {
      priorityList: [],
      loadList: [],
    }
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
