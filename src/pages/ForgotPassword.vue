<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import { isValidPhone } from '@/utils/phone'

const router = useRouter()

// 忘记密码无需登录态，用裸 axios（与登录页一致）
const publicApi = axios.create({ baseURL: '/pet-garden/api' })

const phone = ref('')
const code = ref('')
const password = ref('')
const confirmPassword = ref('')
const loading = ref(false)
const sendingCode = ref(false)
const countdown = ref(0)
const error = ref('')
const devCodeHint = ref('')

let countdownTimer: number | undefined

async function sendCode() {
  error.value = ''
  if (!isValidPhone(phone.value)) {
    error.value = '请输入正确的手机号'
    return
  }

  sendingCode.value = true
  try {
    const res = await publicApi.post('/auth/reset-code', { username: phone.value.trim() })
    error.value = ''
    startCountdown()
    // 开发环境后端会在控制台打印验证码；如接口返回 code 则直接展示便于联调
    if (res.data?.code) devCodeHint.value = String(res.data.code)
  } catch (err: unknown) {
    const message = (err as { response?: { data?: { error?: string } } })?.response?.data?.error
    error.value = message || '验证码发送失败，请稍后再试'
  } finally {
    sendingCode.value = false
  }
}

function startCountdown() {
  countdown.value = 60
  window.clearInterval(countdownTimer)
  countdownTimer = window.setInterval(() => {
    countdown.value--
    if (countdown.value <= 0) {
      window.clearInterval(countdownTimer)
    }
  }, 1000)
}

async function handleSubmit() {
  error.value = ''
  if (!isValidPhone(phone.value)) {
    error.value = '请输入正确的手机号'
    return
  }
  if (!code.value.trim()) {
    error.value = '请输入验证码'
    return
  }
  if (password.value.length < 6) {
    error.value = '密码至少6位'
    return
  }
  if (password.value !== confirmPassword.value) {
    error.value = '两次密码不一致'
    return
  }

  loading.value = true
  try {
    await publicApi.post('/auth/reset-password', {
      username: phone.value.trim(),
      code: code.value.trim(),
      password: password.value,
    })
    alert('密码已重置，请使用新密码登录')
    router.replace('/login')
  } catch (err: unknown) {
    const message = (err as { response?: { data?: { error?: string } } })?.response?.data?.error
    error.value = message || '重置失败，请重试'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="relative min-h-screen overflow-hidden bg-[#fffdfb] text-[#38281f]">
    <div class="pointer-events-none absolute inset-0">
      <div class="absolute left-10 -top-24 h-72 w-72 rounded-full bg-[#ffe9d6] opacity-50"></div>
      <div class="absolute -right-10 bottom-20 h-64 w-64 rounded-full bg-[#fff1e8] opacity-75"></div>
    </div>

    <div class="relative mx-auto flex min-h-screen max-w-6xl flex-col lg:flex-row">
      <section class="hidden flex-1 flex-col justify-center px-6 py-10 sm:px-10 lg:flex lg:px-12 lg:py-16">
        <router-link to="/" class="flex items-center gap-3.5 transition hover:opacity-80">
          <span class="flex h-[52px] w-[52px] items-center justify-center rounded-2xl bg-[#ffe7c8] shadow-sm">
            <span class="material-symbols-rounded text-[28px] text-[#d97706]">pets</span>
          </span>
          <div>
            <p class="text-sm font-bold text-[#ff5c00]">班级宠物园</p>
            <p class="text-sm text-[#9a5a2b]">CLASS PET GARDEN</p>
          </div>
        </router-link>
        <h1 class="mt-7 font-serif text-4xl font-bold leading-tight text-[#1a1a1a] sm:text-[46px]">忘记密码了？</h1>
        <p class="mt-4 max-w-md text-base leading-7 text-[#666]">
          通过注册手机号验证身份后即可重置密码。为保护账号安全，验证码 5 分钟内有效。
        </p>
        <div class="mt-8 max-w-md rounded-2xl border border-[#f0e7dd] bg-white px-4 py-3 text-sm leading-6 text-[#765f50]">
          忘记注册手机号或遇到其他问题？请通过
          <router-link to="/" class="font-semibold text-[#ff5c00] hover:underline">首页「联系客服」</router-link>
          与我们取得联系。
        </div>
      </section>

      <section class="flex flex-1 items-center justify-center px-6 py-10 sm:px-10 lg:px-12">
        <div class="w-full max-w-[440px] rounded-3xl border border-[#f0e7dd] bg-white p-7 shadow-[0_16px_40px_rgba(101,71,45,0.08)] sm:p-8">
          <h2 class="font-serif text-3xl font-bold text-[#1a1a1a]">重置密码</h2>
          <p class="mt-2 text-sm text-[#666]">验证手机号后设置新密码</p>

          <div v-if="error" class="mt-5 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-600">
            {{ error }}
          </div>

          <form class="mt-6 space-y-3" @submit.prevent="handleSubmit">
            <div>
              <label class="mb-1.5 block text-sm font-semibold text-[#38281f]">手机号</label>
              <label class="flex h-10 items-center gap-2.5 rounded-xl border border-[#edeff2] bg-white px-3.5 focus-within:border-orange-300">
                <span class="material-symbols-rounded text-[18px] text-[#999]">call</span>
                <input
                  v-model="phone"
                  type="tel"
                  maxlength="11"
                  inputmode="numeric"
                  class="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-[#b9a697]"
                  placeholder="请输入注册手机号"
                  autocomplete="tel"
                />
              </label>
            </div>

            <div>
              <label class="mb-1.5 block text-sm font-semibold text-[#38281f]">验证码</label>
              <div class="flex gap-2">
                <label class="flex h-10 min-w-0 flex-1 items-center gap-2.5 rounded-xl border border-[#edeff2] bg-white px-3.5 focus-within:border-orange-300">
                  <span class="material-symbols-rounded text-[18px] text-[#999]">verified</span>
                  <input
                    v-model="code"
                    type="text"
                    maxlength="6"
                    inputmode="numeric"
                    class="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-[#b9a697]"
                    placeholder="6 位验证码"
                  />
                </label>
                <button
                  type="button"
                  class="inline-flex h-10 shrink-0 items-center rounded-xl border border-orange-200 bg-[#fff7ed] px-3.5 text-sm font-semibold text-[#c2410c] transition hover:bg-[#ffedd5] disabled:cursor-not-allowed disabled:opacity-50"
                  :disabled="sendingCode || countdown > 0"
                  @click="sendCode"
                >
                  {{ countdown > 0 ? `${countdown}s 后重发` : sendingCode ? '发送中…' : '获取验证码' }}
                </button>
              </div>
              <p v-if="devCodeHint" class="mt-1.5 text-xs text-[#a1836d]">开发环境验证码：{{ devCodeHint }}</p>
            </div>

            <div>
              <label class="mb-1.5 block text-sm font-semibold text-[#38281f]">新密码</label>
              <label class="flex h-10 items-center gap-2.5 rounded-xl border border-[#edeff2] bg-white px-3.5 focus-within:border-orange-300">
                <span class="material-symbols-rounded text-[18px] text-[#999]">lock</span>
                <input
                  v-model="password"
                  type="password"
                  class="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-[#b9a697]"
                  placeholder="请设置新密码（至少6位）"
                  autocomplete="new-password"
                />
              </label>
            </div>

            <div>
              <label class="mb-1.5 block text-sm font-semibold text-[#38281f]">确认新密码</label>
              <label class="flex h-10 items-center gap-2.5 rounded-xl border border-[#edeff2] bg-white px-3.5 focus-within:border-orange-300">
                <span class="material-symbols-rounded text-[18px] text-[#999]">lock_reset</span>
                <input
                  v-model="confirmPassword"
                  type="password"
                  class="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-[#b9a697]"
                  placeholder="请再次输入新密码"
                  autocomplete="new-password"
                />
              </label>
            </div>

            <button
              type="submit"
              class="flex h-12 w-full items-center justify-center rounded-full bg-[#ff5c00] text-sm font-bold text-white shadow-sm transition hover:bg-[#ea580c] disabled:opacity-60"
              :disabled="loading"
            >
              {{ loading ? '重置中…' : '重置密码' }}
            </button>
          </form>

          <div class="mt-6 text-center text-sm text-[#666]">
            想起来了？
            <router-link to="/login" class="font-bold text-[#ff5c00] hover:text-[#ea580c]">返回登录</router-link>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>
