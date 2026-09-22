import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createTask, parseTasks } from '../utils/task'

describe('createTask', () => {
  it('创建带默认值的任务', () => {
    const task = createTask({ title: '写周报' })
    expect(task.id).toBeTruthy()
    expect(task.title).toBe('写周报')
    expect(task.description).toBe('')
    expect(task.priority).toBe('medium')
    expect(task.status).toBe('todo')
    expect(task.createdAt).toBeTypeOf('number')
  })

  it('过滤首尾空白并拒绝空标题', () => {
    const task = createTask({ title: '  整理文档  ' })
    expect(task.title).toBe('整理文档')
    expect(() => createTask({ title: '   ' })).toThrow('标题不能为空')
  })

  it('拒绝无效状态或优先级', () => {
    expect(() => createTask({ title: 'x', status: 'unknown' })).toThrow('无效的状态')
    expect(() => createTask({ title: 'x', priority: 'urgent' })).toThrow('无效的优先级')
  })
})

describe('parseTasks', () => {
  it('过滤损坏数据并保留合法字段', () => {
    const raw = [
      { id: 'a', title: '有效', status: 'done', priority: 'high' },
      { id: 'b', title: '  ', status: 'todo', priority: 'low' },
      { id: 'c', title: '坏状态', status: 'boom', priority: 'low' },
      null,
      'junk',
    ]
    const result = parseTasks(raw)
    expect(result).toHaveLength(1)
    expect(result[0].title).toBe('有效')
    expect(result[0].status).toBe('done')
  })

  it('非数组返回空数组', () => {
    expect(parseTasks('oops')).toEqual([])
  })
})

describe('useTasks', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.resetModules()
  })

  async function loadStore() {
    const mod = await import('../composables/useTasks')
    return mod.useTasks()
  }

  it('支持增删改查', async () => {
    const { tasks, addTask, removeTask, updateTask } = await loadStore()
    const added = addTask({ title: '买菜', priority: 'high' })
    expect(tasks.value).toHaveLength(1)
    expect(tasks.value[0].title).toBe('买菜')

    updateTask(added.id, { title: '买水果', description: '记得挑新鲜的', priority: 'low' })
    expect(tasks.value[0].title).toBe('买水果')
    expect(tasks.value[0].priority).toBe('low')
    expect(tasks.value[0].description).toBe('记得挑新鲜的')

    expect(removeTask(added.id)).toBe(true)
    expect(tasks.value).toHaveLength(0)
    expect(removeTask('ghost')).toBe(false)
  })

  it('moveTask 修改状态并更新时间戳', async () => {
    const { tasks, addTask, moveTask } = await loadStore()
    const added = addTask({ title: '看板演示' })
    const before = tasks.value[0].updatedAt
    moveTask(added.id, 'done')
    expect(tasks.value[0].status).toBe('done')
    expect(tasks.value[0].updatedAt).toBeGreaterThanOrEqual(before)
  })

  it('写入 localStorage 并在“刷新”后恢复', async () => {
    const { addTask } = await loadStore()
    addTask({ title: '持久化任务', description: '刷新不丢' })
    const saved = JSON.parse(localStorage.getItem('task-management:data'))
    expect(saved).toHaveLength(1)
    expect(saved[0].title).toBe('持久化任务')

    vi.resetModules()
    const reloaded = await loadStore()
    expect(reloaded.tasks.value).toHaveLength(1)
    expect(reloaded.tasks.value[0].title).toBe('持久化任务')
  })

  it('seedDemoData 只在空列表时填充', async () => {
    const first = await loadStore()
    first.seedDemoData()
    expect(first.tasks.value).toHaveLength(3)

    const { addTask } = await loadStore()
    addTask({ title: '自己加一条' })
    const sameStore = await loadStore()
    sameStore.seedDemoData()
    expect(sameStore.tasks.value).toHaveLength(4)
  })
})