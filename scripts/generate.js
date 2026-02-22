#!/usr/bin/env node

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join, dirname, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')

// ── 命名工具 ──────────────────────────────────────────

function toPascalCase(str) {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

function toKebabCase(str) {
  return str.replace(/[A-Z]/g, (ch, idx) =>
    idx === 0 ? ch.toLowerCase() : `-${ch.toLowerCase()}`
  )
}

function toSnakeCase(str) {
  return str.replace(/[A-Z]/g, ch => `_${ch.toLowerCase()}`)
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

// ── 参数解析 ──────────────────────────────────────────

const [zhName, camelName] = process.argv.slice(2)

if (!zhName || !camelName) {
  console.error('\n用法: pnpm run gen <中文名> <驼峰英文名>')
  console.error('示例: pnpm run gen 示例 example\n')
  process.exit(1)
}

const pascalName = toPascalCase(camelName)
const kebabName = toKebabCase(camelName)
const camelPluralName = camelName + 's'
const mongoModelName = toSnakeCase(camelName) + 's'

console.log(`\n🚀 生成 CRUD 模块: ${zhName} (${camelName})`)
console.log(`   PascalCase : ${pascalName}`)
console.log(`   kebab-case : ${kebabName}\n`)

// ── 文件工具 ──────────────────────────────────────────

function rel(filePath) {
  return relative(ROOT, filePath).replace(/\\/g, '/')
}

function createFileIfNotExists(filePath, content) {
  if (existsSync(filePath)) {
    console.log(`⏭  已存在，跳过: ${rel(filePath)}`)
    return false
  }
  const dir = dirname(filePath)
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
  writeFileSync(filePath, content, 'utf-8')
  console.log(`✅ 已创建: ${rel(filePath)}`)
  return true
}

function insertBeforeMarker(filePath, markerText, content) {
  if (!existsSync(filePath)) {
    console.error(`❌ 文件不存在: ${rel(filePath)}`)
    return false
  }
  let file = readFileSync(filePath, 'utf-8')

  // 去重：找到内容中足够独特的一行（长度 > 5 且含字母）来判断是否已插入
  const uniqueLine = content
    .split('\n')
    .map(l => l.trim())
    .find(l => l.length > 5 && /[a-zA-Z]/.test(l))
  if (uniqueLine && file.includes(uniqueLine)) {
    console.log(`⏭  已注册，跳过: ${rel(filePath)}`)
    return false
  }

  // 查找标记（忽略前导空白）
  const markerRegex = new RegExp(
    `^([ \\t]*)(${escapeRegex(markerText.trim())})`,
    'm'
  )
  const match = file.match(markerRegex)
  if (!match) {
    console.error(`❌ 找不到标记 '${markerText.trim()}' 于: ${rel(filePath)}`)
    return false
  }

  const fullMarker = match[0]
  file = file.replace(fullMarker, `${content}\n${fullMarker}`)
  writeFileSync(filePath, file, 'utf-8')
  console.log(`✅ 已更新: ${rel(filePath)}`)
  return true
}

// ── 模板定义 ──────────────────────────────────────────

function modelTemplate() {
  return `import mongoose from 'mongoose'

const ${camelName}Schema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
)

${camelName}Schema.set('toJSON', {
  transform(_doc, ret) {
    delete ret.__v
    return ret
  },
})

const ${pascalName} = mongoose.model('${mongoModelName}', ${camelName}Schema)

export default ${pascalName}
`
}

function validatorTemplate() {
  return `import Joi from 'joi'

/**
 * 创建${zhName}校验
 */
export const create${pascalName}Schema = Joi.object({
  title: Joi.string().min(1).max(200).required(),
})

/**
 * 更新${zhName}校验
 */
export const update${pascalName}Schema = Joi.object({
  title: Joi.string().min(1).max(200),
})
`
}

function serviceTemplate() {
  return `import ${pascalName} from '../../models/${camelPluralName}.js'

/**
 * ${zhName}列表（分页 + 搜索）
 */
export async function list({ page = 1, pageSize = 10, keyword = '' }) {
  const filter = {}
  if (keyword) {
    filter.title = { $regex: keyword, $options: 'i' }
  }
  const total = await ${pascalName}.countDocuments(filter)
  const items = await ${pascalName}.find(filter)
    .sort({ createdAt: -1 })
    .skip((page - 1) * pageSize)
    .limit(Number(pageSize))
  return { list: items, total, page: Number(page), pageSize: Number(pageSize) }
}

/**
 * ${zhName}详情
 */
export async function getById(id) {
  const item = await ${pascalName}.findById(id)
  if (!item) {
    const err = new Error('${zhName}不存在')
    err.statusCode = 404
    err.expose = true
    throw err
  }
  return item.toJSON()
}

/**
 * 创建${zhName}
 */
export async function create(data) {
  const item = new ${pascalName}(data)
  await item.save()
  return item.toJSON()
}

/**
 * 更新${zhName}
 */
export async function update(id, data) {
  const item = await ${pascalName}.findByIdAndUpdate(id, data, {
    new: true,
    runValidators: true,
  })
  if (!item) {
    const err = new Error('${zhName}不存在')
    err.statusCode = 404
    err.expose = true
    throw err
  }
  return item.toJSON()
}

/**
 * 删除${zhName}
 */
export async function remove(id) {
  const item = await ${pascalName}.findByIdAndDelete(id)
  if (!item) {
    const err = new Error('${zhName}不存在')
    err.statusCode = 404
    err.expose = true
    throw err
  }
  return item.toJSON()
}
`
}

function controllerTemplate() {
  return `import * as ${camelName}Service from '../../services/admin/${camelName}Service.js'

export async function list(req, res, next) {
  try {
    const result = await ${camelName}Service.list(req.query)
    res.success(result)
  } catch (error) {
    next(error)
  }
}

export async function getById(req, res, next) {
  try {
    const item = await ${camelName}Service.getById(req.params.id)
    res.success(item)
  } catch (error) {
    next(error)
  }
}

export async function create(req, res, next) {
  try {
    const item = await ${camelName}Service.create(req.body)
    res.created(item)
  } catch (error) {
    next(error)
  }
}

export async function update(req, res, next) {
  try {
    const item = await ${camelName}Service.update(req.params.id, req.body)
    res.success(item, '更新成功')
  } catch (error) {
    next(error)
  }
}

export async function remove(req, res, next) {
  try {
    await ${camelName}Service.remove(req.params.id)
    res.success(null, '删除成功')
  } catch (error) {
    next(error)
  }
}
`
}

function routeTemplate() {
  return `import { Router } from 'express'
import * as ${camelName}Controller from '../../controllers/admin/${camelName}Controller.js'
import { validate } from '../../middlewares/validate.js'
import { create${pascalName}Schema, update${pascalName}Schema } from 'shared'

const router = Router()

router.get('/', ${camelName}Controller.list)
router.get('/:id', ${camelName}Controller.getById)
router.post('/', validate(create${pascalName}Schema), ${camelName}Controller.create)
router.put('/:id', validate(update${pascalName}Schema), ${camelName}Controller.update)
router.delete('/:id', ${camelName}Controller.remove)

export default router
`
}

function frontendApiTemplate() {
  return `import adminRequest from './request.js'

export function list${pascalName}Api(params) {
  return adminRequest.get('/${kebabName}', { params })
}

export function get${pascalName}Api(id) {
  return adminRequest.get(\`/${kebabName}/\${id}\`)
}

export function create${pascalName}Api(data) {
  return adminRequest.post('/${kebabName}', data)
}

export function update${pascalName}Api(id, data) {
  return adminRequest.put(\`/${kebabName}/\${id}\`, data)
}

export function delete${pascalName}Api(id) {
  return adminRequest.delete(\`/${kebabName}/\${id}\`)
}
`
}

function frontendPageTemplate() {
  return `<template>
  <div>
    <!-- 页面标题 -->
    <div class="mb-4">
      <h2 class="text-xl font-semibold dark:text-gray-100">${zhName}管理</h2>
      <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
        管理系统中的${zhName}数据
      </p>
    </div>

    <!-- 搜索栏 -->
    <el-card shadow="never" class="mb-4">
      <el-form :model="searchForm" inline class="flex flex-wrap gap-y-2">
        <el-form-item label="关键词">
          <el-input
            v-model="searchForm.keyword"
            placeholder="请输入关键词"
            clearable
            style="width: 200px"
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :loading="loading" @click="handleSearch">
            搜索
          </el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
        <el-form-item class="ml-auto">
          <el-button type="primary" @click="handleAdd">
            <el-icon class="mr-1"><Plus /></el-icon>
            新增${zhName}
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 数据表格 -->
    <el-card shadow="never">
      <ResponsiveTable :data="tableData" v-loading="loading" stripe style="width: 100%">
        <ResponsiveTableColumn
          prop="title"
          label="标题"
          min-width="200"
          show-overflow-tooltip
        />
        <ResponsiveTableColumn label="创建时间" min-width="170">
          <template #default="{ row }">
            {{ formatDate(row.createdAt) }}
          </template>
        </ResponsiveTableColumn>
        <ResponsiveTableColumn label="操作" width="160" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="handleEdit(row)">
              编辑
            </el-button>
            <el-button
              type="danger"
              link
              size="small"
              :disabled="deletingId === row._id"
              @click="handleDelete(row)"
            >
              删除
            </el-button>
          </template>
        </ResponsiveTableColumn>
      </ResponsiveTable>

      <!-- 分页 -->
      <div class="flex justify-end mt-4">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.pageSize"
          :total="pagination.total"
          :page-sizes="[10, 20, 50]"
          layout="total, sizes, prev, pager, next"
          background
          @size-change="fetchList"
          @current-change="fetchList"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { formatDate } from '@shared'
import {
  list${pascalName}Api,
  delete${pascalName}Api,
} from '../../../api/admin/${camelName}.js'

const router = useRouter()
const route = useRoute()

// ── 搜索 ──
const searchForm = reactive({ keyword: '' })

// ── 表格 ──
const loading = ref(false)
const deletingId = ref(null)
const tableData = ref([])
const pagination = reactive({ page: 1, pageSize: 10, total: 0 })

/** 从路由 query 恢复列表状态（从 Editor 返回时保持现场） */
function restoreStateFromQuery() {
  const { page, pageSize, keyword } = route.query
  if (page) pagination.page = Number(page)
  if (pageSize) pagination.pageSize = Number(pageSize)
  if (keyword) searchForm.keyword = keyword
}

async function fetchList() {
  loading.value = true
  try {
    const { data } = await list${pascalName}Api({
      page: pagination.page,
      pageSize: pagination.pageSize,
      keyword: searchForm.keyword || undefined,
    })
    tableData.value = data.data.list || []
    pagination.total = data.data.total || 0
  } catch {
    tableData.value = []
  } finally {
    loading.value = false
  }
}

function handleSearch() {
  pagination.page = 1
  fetchList()
}

function handleReset() {
  searchForm.keyword = ''
  pagination.page = 1
  fetchList()
}

// ── 导航到编辑页（携带当前列表状态） ──
function navToEditor(query) {
  router.push({
    name: 'Admin${pascalName}Editor',
    query: {
      ...query,
      _page: pagination.page,
      _pageSize: pagination.pageSize,
      _keyword: searchForm.keyword || undefined,
    },
  })
}

function handleAdd() {
  navToEditor({ mode: 'create' })
}

function handleEdit(row) {
  navToEditor({ mode: 'edit', id: row._id })
}

// ── 删除 ──
async function handleDelete(row) {
  try {
    await ElMessageBox.confirm(\`确定要删除「\${row.title}」吗？\`, '提示', {
      type: 'warning',
      confirmButtonText: '确定',
      cancelButtonText: '取消',
    })
    deletingId.value = row._id
    await delete${pascalName}Api(row._id)
    ElMessage.success('删除成功')
    fetchList()
  } catch (e) {
    if (e !== 'cancel') {
      ElMessage.error(e.response?.data?.message || '删除失败')
    }
  } finally {
    deletingId.value = null
  }
}

onMounted(() => {
  restoreStateFromQuery()
  fetchList()
})
</script>
`
}

function frontendEditorTemplate() {
  return `<template>
  <div>
    <!-- 页面标题 -->
    <div class="mb-4">
      <h2 class="text-xl font-semibold dark:text-gray-100">
        {{ isEdit ? '${zhName}编辑' : '${zhName}新增' }}
      </h2>
      <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
        {{
          isEdit
            ? '编辑'
            : '创建'
        }}
      </p>
    </div>
    <el-card shadow="never" class="max-w-[800px]">
      <!-- 加载中 -->
      <div v-if="pageLoading" class="flex justify-center items-center py-12">
        <el-icon class="animate-spin" :size="28"><Loading /></el-icon>
      </div>

      <el-form
        v-else
        ref="formRef"
        :model="form"
        :rules="rules"
        label-position="top"
        @keyup.enter="handleSubmit"
      >
        <el-form-item label="标题" prop="title">
          <el-input v-model="form.title" placeholder="请输入标题" />
        </el-form-item>

        <el-form-item>
          <el-button
            type="primary"
            :loading="submitLoading"
            :disabled="submitLoading"
            @click="handleSubmit"
          >
            {{ isEdit ? '保存修改' : '立即创建' }}
          </el-button>
          <el-button @click="handleBack">取消</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import {
  get${pascalName}Api,
  create${pascalName}Api,
  update${pascalName}Api,
} from '../../../api/admin/${camelName}.js'

const router = useRouter()
const route = useRoute()

const isEdit = computed(() => route.query.mode === 'edit')
const editId = computed(() => route.query.id)

const pageLoading = ref(false)
const submitLoading = ref(false)
const formRef = ref()

const form = reactive({
  title: '',
})

const rules = {
  title: [{ required: true, message: '请输入标题', trigger: 'blur' }],
}

/** 编辑模式下加载详情 */
async function loadDetail() {
  if (!isEdit.value || !editId.value) return
  pageLoading.value = true
  try {
    const { data } = await get${pascalName}Api(editId.value)
    form.title = data.data.title
  } catch {
    ElMessage.error('加载数据失败')
    handleBack()
  } finally {
    pageLoading.value = false
  }
}

/** 返回列表，并恢复列表状态 */
function handleBack() {
  const { _page, _pageSize, _keyword } = route.query
  const q = {}
  if (_page) q.page = _page
  if (_pageSize) q.pageSize = _pageSize
  if (_keyword) q.keyword = _keyword
  router.replace({ name: 'Admin${pascalName}', query: q })
}

async function handleSubmit() {
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return

  submitLoading.value = true
  try {
    if (isEdit.value) {
      await update${pascalName}Api(editId.value, { ...form })
      ElMessage.success('更新成功')
    } else {
      await create${pascalName}Api({ ...form })
      ElMessage.success('创建成功')
    }
    handleBack()
  } catch (e) {
    ElMessage.error(e.response?.data?.message || (isEdit.value ? '更新失败' : '创建失败'))
  } finally {
    submitLoading.value = false
  }
}

onMounted(loadDetail)
</script>
`
}

// ── 执行生成 ──────────────────────────────────────────

console.log('📁 生成文件...\n')

// 1. Mongoose Model
createFileIfNotExists(
  join(ROOT, `server/models/${camelPluralName}.js`),
  modelTemplate()
)

// 2. Shared Validator
createFileIfNotExists(
  join(ROOT, `shared/validators/${camelName}Validator.js`),
  validatorTemplate()
)

// 3. Admin Service
createFileIfNotExists(
  join(ROOT, `server/services/admin/${camelName}Service.js`),
  serviceTemplate()
)

// 4. Admin Controller
createFileIfNotExists(
  join(ROOT, `server/controllers/admin/${camelName}Controller.js`),
  controllerTemplate()
)

// 5. Admin Route
createFileIfNotExists(
  join(ROOT, `server/routes/admin/${camelName}Routes.js`),
  routeTemplate()
)

// 6. Frontend API
createFileIfNotExists(
  join(ROOT, `client/src/api/admin/${camelName}.js`),
  frontendApiTemplate()
)

// 7. Frontend List Page
createFileIfNotExists(
  join(ROOT, `client/src/views/admin/${kebabName}/Index.vue`),
  frontendPageTemplate()
)

// 8. Frontend Editor Page
createFileIfNotExists(
  join(ROOT, `client/src/views/admin/${kebabName}/Editor.vue`),
  frontendEditorTemplate()
)

console.log('\n📝 注册到索引文件...\n')

// 注册 Validator 导出
insertBeforeMarker(
  join(ROOT, 'shared/validators/index.js'),
  '// ===GENERATOR_VALIDATOR===',
  `export { create${pascalName}Schema, update${pascalName}Schema } from './${camelName}Validator.js'`
)

// 注册后端路由 import
insertBeforeMarker(
  join(ROOT, 'server/routes/admin/index.js'),
  '// ===GENERATOR_IMPORT===',
  `import ${camelName}Routes from './${camelName}Routes.js'`
)

// 注册后端路由
insertBeforeMarker(
  join(ROOT, 'server/routes/admin/index.js'),
  '// ===GENERATOR_ROUTE===',
  `router.use('/${kebabName}', authAdmin, ${camelName}Routes)`
)

// 注册前端路由（列表页 + 编辑页）
insertBeforeMarker(
  join(ROOT, 'client/src/router/index.js'),
  '// ===GENERATOR_ADMIN_ROUTE===',
  `      {
        path: '${kebabName}',
        name: 'Admin${pascalName}',
        component: () => import('../views/admin/${kebabName}/Index.vue'),
        meta: { title: '${zhName}管理' },
      },
      {
        path: '${kebabName}/editor',
        name: 'Admin${pascalName}Editor',
        component: () => import('../views/admin/${kebabName}/Editor.vue'),
        meta: {
          title: '${zhName}编辑',
          createTitle: '${zhName}新增',
          dynamicTitle: true,
          breadcrumbParent: {
            title: '${zhName}管理',
            name: 'Admin${pascalName}',
            path: '/admin/${kebabName}',
          },
        },
      },`
)

// 注册侧栏菜单
insertBeforeMarker(
  join(ROOT, 'client/src/config/adminMenu.js'),
  '// ===GENERATOR_MENU===',
  `  {
    path: '/admin/${kebabName}',
    title: '${zhName}管理',
    icon: 'Document',
  },`
)

console.log('\n✨ 生成完成！\n')
console.log(`后续步骤:`)
console.log(
  `  1. 根据业务需求编辑 server/models/${camelPluralName}.js 添加字段`
)
console.log(`  2. 同步更新 shared/validators/${camelName}Validator.js 校验规则`)
console.log(
  `  3. 同步更新 client/src/views/admin/${kebabName}/Index.vue 表格列`
)
console.log(
  `  4. 同步更新 client/src/views/admin/${kebabName}/Editor.vue 表单字段`
)
console.log(`  5. 重启后端: pnpm dev:server\n`)
