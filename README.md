# 任务管理应用（Task Management for SE）

基于 **Vue 3 + Vite + Tailwind CSS** 的任务管理看板应用。数据保存在浏览器 `localStorage`，刷新/关闭页面不丢失。

## 功能
- 任务增删改查：标题必填、描述选填
- 三种状态：待办 / 进行中 / 完成
- 优先级三档：高（红）、中（黄）、低（绿）
- 看板视图：宽屏三列、窄屏纵向排列，拖拽即改状态，空分区显示操作提示
- 深色模式：一键切换，选择会被记住（基于系统偏好初始化）
- 数据持久化：localStorage，无需后端
- 首次使用自动生成示例任务；删除全部任务后，刷新仍保持空列表
- 编辑保留任务原状态，创建与编辑统一校验标题、状态和优先级
- 表单支持 Enter 提交，弹窗支持 Esc 关闭、自动聚焦和键盘焦点循环

## 技术栈
- 前端框架：Vue 3（`<script setup>` 组合式 API）
- 构建工具：Vite
- 样式方案：Tailwind CSS（dark 模式使用 `class` 策略）
- 数据存储：localStorage（`task-management:data`），主题键 `task-management:theme`
- 测试：Vitest + Vue Test Utils（单元测试）、Puppeteer-core + Edge（浏览器冒烟测试）

## 快速开始
```bash
npm install        # 安装依赖
npm run dev        # 本地开发（默认 http://localhost:5173）
npm run build      # 生产构建
npm run preview    # 预览生产构建
npm test           # 运行单元测试
npm run smoke      # 浏览器冒烟测试（需本机 Edge）
```

## 目录结构
```
src/
  components/      # 看板、任务卡片、表单、优先级徽章
  composables/     # useTasks：任务状态与 localStorage 持久化
  utils/           # 常量、任务数据模型
  __tests__/       # Vitest 单元测试
scripts/
  smoke-test.mjs   # 基于 Puppeteer-core 的端到端冒烟测试
```

## 数据模型
```
Task {
  id          string  // 唯一标识
  title       string  // 必填，创建时会去掉首尾空白
  description string  // 选填
  priority    'high' | 'medium' | 'low'
  status      'todo' | 'doing' | 'done'
  createdAt   number  // 时间戳
  updatedAt   number  // 时间戳
}
```

## 远程仓库
https://github.com/AdmiralNagumo/task-management-for-SE
