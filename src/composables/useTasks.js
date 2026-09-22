import { ref, watch } from 'vue'
import { createTask, parseTasks } from '../utils/task'

const STORAGE_KEY = 'task-management:data'

function loadTasks() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? parseTasks(JSON.parse(raw)) : []
  } catch (error) {
    console.warn('读取本地数据失败，已重置', error)
    return []
  }
}

const tasks = ref(loadTasks())

// 同步持久化：任何修改立即写入 localStorage，保证刷新/关闭页面不丢数据
watch(
  tasks,
  (value) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(value))
    } catch (error) {
      console.warn('保存本地数据失败', error)
    }
  },
  { deep: true, flush: 'sync' },
)

export function useTasks() {
  function addTask({ title, description, priority, status }) {
    const task = createTask({ title, description, priority, status })
    tasks.value.push(task)
    return task
  }

  function removeTask(id) {
    const index = tasks.value.findIndex((task) => task.id === id)
    if (index === -1) return false
    tasks.value.splice(index, 1)
    return true
  }

  function updateTask(id, patch) {
    const task = tasks.value.find((item) => item.id === id)
    if (!task) return null
    for (const key of ['title', 'description', 'priority', 'status']) {
      if (key in patch && patch[key] !== undefined) {
        task[key] = patch[key]
      }
    }
    task.updatedAt = Date.now()
    return task
  }

  function moveTask(id, status) {
    return updateTask(id, { status })
  }

  function tasksByStatus(status) {
    return tasks.value.filter((task) => task.status === status)
  }

  function seedDemoData() {
    if (tasks.value.length > 0) return
    const now = Date.now()
    const demo = [
      createTask({
        title: '欢迎使用任务管理看板',
        description: '拖拽卡片即可改变任务状态，试试看！',
        priority: 'high',
        status: 'todo',
      }),
      createTask({
        title: '配置深色模式',
        description: '点击右上角按钮一键切换，选择会被记住。',
        priority: 'medium',
        status: 'doing',
      }),
      createTask({
        title: '完成首个任务',
        priority: 'low',
        status: 'done',
      }),
    ]
    for (const task of demo) {
      task.createdAt = now
      task.updatedAt = now
    }
    tasks.value.push(...demo)
  }

  return {
    tasks,
    addTask,
    removeTask,
    updateTask,
    moveTask,
    tasksByStatus,
    seedDemoData,
  }
}