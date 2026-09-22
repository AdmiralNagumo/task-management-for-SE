import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import KanbanBoard from '../components/KanbanBoard.vue'
import TaskForm from '../components/TaskForm.vue'

function makeTask(overrides = {}) {
  return {
    id: 't1',
    title: '示例任务',
    description: '',
    priority: 'medium',
    status: 'todo',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    ...overrides,
  }
}

function saveButton(wrapper) {
  return wrapper.findAll('button').find((button) => button.text() === '保存')
}

describe('KanbanBoard', () => {
  it('渲染任务并按状态展示标题与数量', () => {
    const tasks = [makeTask({ title: '任务A' }), makeTask({ id: 't2', title: '任务B', priority: 'high' })]
    const wrapper = mount(KanbanBoard, {
      props: { status: 'todo', tasks, dragOver: false },
      global: { stubs: { Teleport: true } },
    })
    expect(wrapper.text()).toContain('待办')
    expect(wrapper.text()).toContain('任务A')
    expect(wrapper.text()).toContain('任务B')
    expect(wrapper.text()).toContain('2')
  })

  it('拖拽经过时发出 dragover，放置时发出 drop 事件', async () => {
    const wrapper = mount(KanbanBoard, {
      props: { status: 'doing', tasks: [], dragOver: false },
      global: { stubs: { Teleport: true } },
    })
    const section = wrapper.find('section')
    await section.trigger('dragover')
    expect(wrapper.emitted('dragover')).toBeTruthy()

    const dataTransfer = {
      getData: vi.fn((type) => (type === 'text/plain' ? 't9' : '')),
    }
    await section.trigger('drop', { dataTransfer })
    expect(wrapper.emitted('drop')).toBeTruthy()
    expect(wrapper.emitted('drop')[0][0]).toEqual({ id: 't9', status: 'doing' })
  })
})

describe('PriorityBadge 下拉选项颜色', () => {
  it('同一下拉框内三个选项使用红黄绿三种不同颜色', async () => {
    const PriorityBadge = (await import('../components/PriorityBadge.vue')).default
    const wrapper = mount(PriorityBadge, { props: { modelValue: 'high' } })
    const options = wrapper.findAll('option')
    expect(options).toHaveLength(3)
    const classes = options.map((option) => option.classes())
    // 高-红：字体与背景均为红色系
    expect(classes[0]).toEqual(expect.arrayContaining(['text-red-900']))
    expect(classes[0]).toEqual(expect.arrayContaining(['bg-red-200']))
    // 中-黄：字体与背景均为黄色系
    expect(classes[1]).toEqual(expect.arrayContaining(['text-yellow-900']))
    expect(classes[1]).toEqual(expect.arrayContaining(['bg-yellow-200']))
    // 低-绿：字体与背景均为绿色系
    expect(classes[2]).toEqual(expect.arrayContaining(['text-green-900']))
    expect(classes[2]).toEqual(expect.arrayContaining(['bg-green-200']))
    const set = new Set(classes.map((c) => c.join(' ')))
    expect(set.size).toBe(3)
  })
})
describe('TaskCard 快捷改优先级', () => {
  it('点击优先级下拉发出带 patch 的 edit 事件（不打开编辑详情）', async () => {
    const { mount } = await import('@vue/test-utils')
    const TaskCard = (await import('../components/TaskCard.vue')).default
    const task = makeTask({ priority: 'medium' })
    const wrapper = mount(TaskCard, {
      props: { task },
      global: { stubs: { Teleport: true } },
    })
    const select = wrapper.find('select[aria-label="优先级"]')
    await select.setValue('high')
    expect(select.element.value).toBe('high')
    const emitted = wrapper.emitted('edit')
    expect(emitted).toBeTruthy()
    expect(emitted[0][0]).toEqual({ task, patch: { priority: 'high' } })
    // 语义上快捷改优先级应直接更新，而不是打开编辑弹窗
    expect(wrapper.emitted('openEdit')).toBeFalsy()
  })
})

describe('TaskForm', () => {
  it('标题为空时阻止保存并提示', async () => {
    const wrapper = mount(TaskForm, {
      props: { initial: { title: '', description: '', priority: 'medium', status: 'todo' } },
    })
    await saveButton(wrapper).trigger('click')
    expect(wrapper.emitted('save')).toBeFalsy()
    expect(wrapper.text()).toContain('标题不能为空')
  })

  it('保存时提交规范化数据', async () => {
    const wrapper = mount(TaskForm, {
      props: { initial: { title: '  写日报  ', description: '  记得附链接  ', priority: 'low', status: 'doing' } },
    })
    await wrapper.find('input').setValue('写周报')
    await wrapper.find('textarea').setValue('附上链接')
    await saveButton(wrapper).trigger('click')
    const emitted = wrapper.emitted('save')
    expect(emitted).toBeTruthy()
    expect(emitted[0][0]).toMatchObject({
      title: '写周报',
      description: '附上链接',
      priority: 'low',
      status: 'doing',
    })
  })

  it('取消时发出 cancel 事件', async () => {
    const wrapper = mount(TaskForm, {
      props: { initial: { title: 'x', description: '', priority: 'medium', status: 'todo' } },
    })
    await wrapper.find('button[type="button"]').trigger('click')
    expect(wrapper.emitted('cancel')).toBeTruthy()
  })
})