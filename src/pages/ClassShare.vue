<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import axios from 'axios'
import { getPetLevelImage } from '@/data/pets'

const route = useRoute()

const publicApi = axios.create({ baseURL: '/pet-garden/api' })

const loading = ref(true)
const notFound = ref(false)
const forbidden = ref(false)
const classInfo = ref<{ id: string; name: string; createdAt: number; studentCount: number; todayEvaluations: number } | null>(null)
const topStudents = ref<Array<{ name: string; total_points: number; pet_type: string | null; pet_level: number }>>([])

const rankMedals = ['\u{1F947}', '\u{1F948}', '\u{1F949}']

const createdLabel = computed(() => {
  if (!classInfo.value) return ''
  return new Date(classInfo.value.createdAt).toLocaleDateString('zh-CN', { year: 'numeric', month: 'numeric' })
})

onMounted(async () => {
  const classId = route.params.classId as string
  const key = route.query.k as string | undefined
  try {
    const res = await publicApi.get(`/public/classes/${classId}/share`, { params: { k: key || '' } })
    classInfo.value = res.data.class
    topStudents.value = res.data.topStudents || []
  } catch (error: unknown) {
    const status = (error as { response?: { status?: number } })?.response?.status
    if (status === 403) forbidden.value = true
    else notFound.value = true
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="min-h-screen bg-gradient-to-b from-[#fff7ef] to-[#fdf3e7] text-[#38281f]">
    <div class="mx-auto max-w-3xl px-5 py-10 sm:py-14">
      <div class="flex items-center gap-3">
        <span class="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#ffe7c8] text-[#d97706]"><span class="material-symbols-rounded text-[24px]">pets</span></span>
        <div>
          <p class="text-sm font-bold text-[#ff5c00]">班级宠物园</p>
          <p class="text-sm text-[#9a5a2b]">CLASS PET GARDEN</p>
        </div>
      </div>

      <div v-if="loading" class="mt-16 text-center text-sm text-[#a1836d]">加载中…</div>

      <div v-else-if="notFound" class="mt-16 rounded-3xl border border-[#f0e7dd] bg-white p-10 text-center">
        <span class="material-symbols-rounded text-[48px] text-[#e8c9ae]">search_off</span>
        <p class="mt-3 font-bold text-[#422d20]">班级不存在</p>
        <p class="mt-1 text-sm text-[#9a735d]">链接可能已失效，请联系老师获取新的班级码。</p>
      </div>

      <div v-else-if="forbidden" class="mt-16 rounded-3xl border border-[#f0e7dd] bg-white p-10 text-center">
        <span class="material-symbols-rounded text-[48px] text-[#e8c9ae]">lock</span>
        <p class="mt-3 font-bold text-[#422d20]">分享链接无效</p>
        <p class="mt-1 text-sm text-[#9a735d]">老师可能已重置班级码，请联系老师获取最新链接。</p>
      </div>

      <template v-else-if="classInfo">
        <div class="mt-8 text-center">
          <p class="text-sm font-bold tracking-[0.2em] text-[#ff5c00]">CLASS HALL OF FAME</p>
          <h1 class="mt-3 font-serif text-4xl font-bold text-[#2b1d12]">{{ classInfo.name }}</h1>
          <p class="mt-2 text-sm text-[#9a735d]">{{ createdLabel }} 创建 · 由班级宠物园记录成长</p>
        </div>

        <div class="mt-8 grid grid-cols-3 gap-3">
          <div class="rounded-2xl border border-[#f0e6dc] bg-white p-4 text-center">
            <p class="font-mono text-2xl font-extrabold text-[#d97706]">{{ classInfo.studentCount }}</p>
            <p class="mt-1 text-sm text-[#9a735d]">班级成员</p>
          </div>
          <div class="rounded-2xl border border-[#f0e6dc] bg-white p-4 text-center">
            <p class="font-mono text-2xl font-extrabold text-[#f43f75]">{{ classInfo.todayEvaluations }}</p>
            <p class="mt-1 text-sm text-[#9a735d]">今日评价</p>
          </div>
          <div class="rounded-2xl border border-[#f0e6dc] bg-white p-4 text-center">
            <p class="font-mono text-2xl font-extrabold text-[#8b5cf6]">{{ topStudents.length }}</p>
            <p class="mt-1 text-sm text-[#9a735d]">荣誉上榜</p>
          </div>
        </div>

        <div class="mt-6 rounded-3xl border border-[#f0e6dc] bg-white p-5 shadow-[0_10px_30px_rgba(101,71,45,0.05)] sm:p-6">
          <h2 class="font-serif text-xl font-bold text-[#2b1d12]">班级荣誉榜</h2>
          <div class="mt-4 space-y-2">
            <div
              v-for="(student, i) in topStudents"
              :key="i"
              class="flex items-center gap-3 rounded-2xl border border-[#f3ece4] bg-[#fffdfb] px-4 py-3"
            >
              <span class="flex h-9 w-9 shrink-0 items-center justify-center text-xl">{{ i < 3 ? rankMedals[i] : i + 1 }}</span>
              <img v-if="student.pet_type" :src="getPetLevelImage(student.pet_type, student.pet_level)" alt="" class="h-10 w-10 object-contain" />
              <span v-else class="flex h-10 w-10 items-center justify-center rounded-full bg-[#fff3eb] text-lg">🥚</span>
              <span class="min-w-0 flex-1 truncate font-bold text-[#422d20]">{{ student.name }}</span>
              <span class="shrink-0 font-mono text-lg font-extrabold text-[#d97706]">{{ student.total_points }}</span>
            </div>
            <p v-if="!topStudents.length" class="py-8 text-center text-sm text-[#c0a894]">还没有学生上榜，期待第一颗星星</p>
          </div>
        </div>

        <p class="mt-6 text-center text-sm text-[#a1836d]">想看到自己孩子的专属成长档案？请联系老师获取学生专属分享链接。</p>
      </template>
    </div>
  </div>
</template>
