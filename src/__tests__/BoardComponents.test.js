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
      props: { status: 'todo', tasks, dragOver: false, editingTask: null },
      global: { stubs: { Teleport: true } },
    })
    expect(wrapper.text()).toContain('待办')
    expect(wrapper.text()).toContain('任务A')
    expect(wrapper.text()).toContain('任务B')
    expect(wrapper.text()).toContain('2')
  })

  it('拖拽经过时发出 dragover，放置时发出 drop 事件', async () => {
    const wrapper = mount(KanbanBoard, {
      props: { status: 'doing', tasks: [], dragOver: false, editingTask: null },
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