<template>
  <div>
    <!-- 页面标题 -->
    <div class="mb-4">
      <h2 class="text-xl font-semibold dark:text-gray-100">
        {{ isEdit ? '管理员编辑' : '管理员新增' }}
      </h2>
      <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
        {{
          isEdit
            ? '编辑管理员账号信息，修改密码留空表示不变'
            : '创建新的管理员账号'
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
        <!-- 用户名 -->
        <el-form-item label="账号" prop="username">
          <el-input
            v-model="form.username"
            placeholder="请输入管理员账号（小写字母和数字）"
            @blur="form.username = form.username.toLowerCase()"
          >
            <template #prefix
              ><el-icon><User /></el-icon
            ></template>
          </el-input>
          <template #extra>
            <span class="text-xs text-gray-400 dark:text-gray-500"
              >仅支持小写字母 (a-z) 和数字 (0-9)，3-30 个字符</span
            >
          </template>
        </el-form-item>

        <!-- 密码（编辑模式下为选填，留空表示不修改） -->
        <el-form-item
          :label="isEdit ? '新密码（留空则不修改）' : '密码'"
          prop="password"
        >
          <el-input
            v-model="form.password"
            type="password"
            :placeholder="
              isEdit ? '留空则不修改密码' : '请输入管理员密码（至少 6 位）'
            "
            show-password
          >
            <template #prefix
              ><el-icon><Lock /></el-icon
            ></template>
          </el-input>
          <template #extra>
            <span class="text-xs text-gray-400 dark:text-gray-500"
              >必须包含大小写字母、数字和符号</span
            >
          </template>
        </el-form-item>

        <!-- 确认密码 -->
        <el-form-item
          v-if="!isEdit || form.password"
          :label="isEdit ? '确认新密码' : '确认密码'"
          prop="confirmPassword"
        >
          <el-input
            v-model="form.confirmPassword"
            type="password"
            placeholder="请再次输入密码"
            show-password
          >
            <template #prefix
              ><el-icon><Lock /></el-icon
            ></template>
          </el-input>
        </el-form-item>

        <el-form-item>
          <el-button
            type="primary"
            :loading="submitLoading"
            :disabled="submitLoading"
            @click="handleSubmit"
          >
            {{ isEdit ? '保存修改' : '创建账号' }}
          </el-button>
          <el-button @click="handleBack">取消</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import {
  createAdminApi,
  updateAdminApi,
  listAdminsApi
} from '@/api/admin/admin.js'

const router = useRouter()
const route = useRoute()

const isEdit = computed(() => route.query.mode === 'edit')
const editId = computed(() => route.query.id)

const pageLoading = ref(false)
const submitLoading = ref(false)
const formRef = ref()

const form = reactive({
  username: '',
  password: '',
  confirmPassword: ''
})

// 密码强度校验器（可复用）
function validatePassword(rule, value, callback) {
  if (!value) return callback()
  const hasLower = /[a-z]/.test(value)
  const hasUpper = /[A-Z]/.test(value)
  const hasDigit = /[0-9]/.test(value)
  const hasSymbol = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(value)
  if (hasLower && hasUpper && hasDigit && hasSymbol) {
    callback()
  } else {
    callback(new Error('密码必须包含大小写字母、数字和符号'))
  }
}

const rules = computed(() => ({
  username: isEdit.value
    ? [
        {
          pattern: /^[a-z0-9]+$/,
          message: '账号只能包含小写字母 (a-z) 和数字 (0-9)',
          trigger: 'blur'
        },
        { min: 3, max: 30, message: '账号长度 3-30 个字符', trigger: 'blur' }
      ]
    : [
        { required: true, message: '请输入管理员账号', trigger: 'blur' },
        { min: 3, max: 30, message: '账号长度 3-30 个字符', trigger: 'blur' },
        {
          pattern: /^[a-z0-9]+$/,
          message: '账号只能包含小写字母 (a-z) 和数字 (0-9)',
          trigger: 'blur'
        }
      ],
  password: isEdit.value
    ? [
        { min: 6, message: '密码至少 6 个字符', trigger: 'blur' },
        { validator: validatePassword, trigger: 'blur' }
      ]
    : [
        { required: true, message: '请输入密码', trigger: 'blur' },
        { min: 6, message: '密码至少 6 个字符', trigger: 'blur' },
        { validator: validatePassword, trigger: 'blur' }
      ],
  confirmPassword: [
    {
      validator: (rule, value, callback) => {
        // 编辑模式下密码留空时不校验确认密码
        if (isEdit.value && !form.password) return callback()
        if (!value) return callback(new Error('请再次输入密码'))
        if (value !== form.password) {
          callback(new Error('两次输入的密码不一致'))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ]
}))

/** 编辑模式下加载管理员信息 */
async function loadAdmin() {
  if (!isEdit.value || !editId.value) return
  pageLoading.value = true
  try {
    // 通过列表接口获取该管理员的基本信息（因为没有单独的详情接口）
    const res = await listAdminsApi({ page: 1, pageSize: 1000 })
    const target = (res.data.data.list || []).find(a => a._id === editId.value)
    if (target) {
      form.username = target.username
    } else {
      ElMessage.error('管理员不存在')
      router.replace({ name: 'AdminManagement' })
    }
  } catch {
    ElMessage.error('加载管理员信息失败')
    router.replace({ name: 'AdminManagement' })
  } finally {
    pageLoading.value = false
  }
}

// 当密码清空时，同步清空确认密码
watch(
  () => form.password,
  val => {
    if (!val) form.confirmPassword = ''
  }
)

async function handleSubmit() {
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return

  submitLoading.value = true
  try {
    if (isEdit.value) {
      // 编辑模式：只提交有变更的字段
      const payload = {}
      if (form.username) payload.username = form.username
      if (form.password) payload.password = form.password

      await updateAdminApi(editId.value, payload)
      ElMessage.success('管理员信息更新成功')
    } else {
      // 新增模式
      await createAdminApi({
        username: form.username,
        password: form.password
      })
      ElMessage.success('管理员创建成功')
    }
    handleBack()
  } catch (e) {
    // const msg =
    //   e.response?.data?.message || (isEdit.value ? '更新失败' : '创建失败')
    // ElMessage.error(msg)
  } finally {
    submitLoading.value = false
  }
}

function handleBack() {
  const q = {}
  if (route.query._page) q.page = route.query._page
  if (route.query._pageSize) q.pageSize = route.query._pageSize
  if (route.query._username) q.username = route.query._username
  router.replace({ name: 'AdminManagement', query: q })
}

onMounted(loadAdmin)
</script>
