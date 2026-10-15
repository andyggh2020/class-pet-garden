<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '@/composables/useAuth'

const router = useRouter()
const { isGuest, username } = useAuth()

// ===== 可配置信息（上线前替换为真实内容） =====
const brandName = '班级宠物园'
// 备案号：默认占位，管理员在后台「收款设置 → ICP 备案号」填写后自动同步
const beianNo = ref('京ICP备XXXXXXXX号-X')
const serviceTime = '每日 9:00 - 21:00'
// 第三方统计代码（百度统计/微信统计/友盟等）。留空则不注入。
// 例如百度统计：
//   "var _hmt=_hmt||[];(function(){var hm=document.createElement('script');hm.src='https://hm.baidu.com/hm.js?你的ID';var s=document.getElementsByTagName('script')[0];s.parentNode.insertBefore(hm,s);})();"
const analyticsScript: string = ''

// 客服信息：默认占位，运行时从后台"系统设置 → 客服信息"自动同步
const contactPhone = ref('')
const contactQrUrl = ref('')
const fallbackPhone = '136-0000-0000'

// Hero 主标题：每次进入随机抽一条（与原首页保持一致）
const LANDING_HEADLINES = [
  '孩子的专属宠物，言行驱动成长。',
  '老师轻点评分，学生宠物同步成长。',
  '一声表扬，一只宠物，一份看得见的成长。',
] as const

const landingHeadline = ref(
  LANDING_HEADLINES[Math.floor(Math.random() * LANDING_HEADLINES.length)]!,
)

// 功能亮点
const features = [
  { icon: 'bolt', title: '快速评价', desc: '课堂表现轻点加减分，预设规则一键套用，不打断讲课节奏。' },
  { icon: 'pets', title: '宠物成长', desc: '每次进步都喂养专属小宠物，升级、进化，直到毕业收获徽章。' },
  { icon: 'military_tech', title: '班级荣誉墙', desc: '把个人努力汇成班级总积分与排行榜，凝聚集体荣誉感。' },
  { icon: 'assignment', title: '班级任务', desc: '布置小组任务、批量完成统计，课堂管理井井有条。' },
  { icon: 'person', title: '家长见证', desc: '班级码分享到家长群，扫码即看孩子成长，零门槛参与。' },
  { icon: 'save', title: '数据备份', desc: '班级数据随时导出备份，换设备、跨浏览器都不丢失。' },
]

// 操作流程（四步）
const flow = [
  { step: '01', icon: 'school', who: '老师', title: '创建班级', desc: '生成专属班级码，30 秒开课。', points: ['粘贴名单批量导入学生', '预设规则或自定义加减分'] },
  { step: '02', icon: 'rate_review', who: '课堂', title: '实时评价', desc: '课堂表现随手记录，宠物同步成长。', points: ['快速评价模式轻点加减分', '学生积分与宠物实时变化'] },
  { step: '03', icon: 'person', who: '家长', title: '见证成长', desc: '扫码即可查看，无需注册下载。', points: ['宠物成长与喂养记录', '评价时间线实时同步'] },
  { step: '04', icon: 'workspace_premium', who: '进阶', title: '按需开通', desc: '需要更多能力时再升级。', points: ['新班级自动赠送 1 个月', '扫码支付后管理员授权'] },
]

// 套餐（价格以工作台内实际方案为准）
const faqs = [
  { q: '需要做培训吗？', a: '不需要。老师扫码即可使用，界面像玩游戏一样直观，学生零门槛上手，5 分钟就能开课。' },
  { q: '家长怎么参与？', a: '老师把班级码发到家长群，家长扫码就能看见自己孩子的宠物成长和喂养记录，无需注册。' },
  { q: '学生没有手机能参与吗？', a: '可以。课堂评价由老师在平板上记录，家长用手机扫码查看，学生端无需设备即可参与。' },
  { q: '积分和宠物怎么关联？', a: '学生课堂表现好会获得积分，积分用于喂养宠物、积累经验，宠物随之成长升级，形成正向激励。' },
  { q: '宠物有哪些种类？', a: '提供小白兔、橘猫、柴犬、熊猫、狐狸等多种宠物，领养后通过日常喂养慢慢长大，深受孩子喜爱。' },
  { q: '数据安全吗？', a: '账号分级管理：老师掌控评价权限，家长仅能查看自己孩子的数据，所有信息加密存储。' },
  { q: '支持哪些设备？', a: '手机、平板、电脑浏览器均可使用，无需下载 App，断网也能在本地流畅运行。' },
  { q: '会员版和免费版有什么区别？', a: '基础版永久免费，满足日常课堂激励；会员版解锁更多宠物、主题皮肤与高级统计，按需开通。' },
  { q: '怎么开通会员？', a: '在会员页选择方案，扫码完成支付后由后台授权激活，班级即可使用对应权益。' },
  { q: '班级码有效期多久？', a: '班级码长期有效，可随时在班级设置中重置；学生扫码即可加入，毕业或换班后可关闭。' },
]

function goWorkbench() {
  window.open(router.resolve('/app').href, '_blank', 'noopener,noreferrer')
}
function goCreateClass() {
  if (isGuest.value) {
    router.push('/register')
  } else {
    // 已登录老师：新窗口进工作台并自动打开创建班级弹窗
    window.open(router.resolve('/app?createClass=1').href, '_blank', 'noopener,noreferrer')
  }
}
function goDemo() {
  // 进入演示班级：/app?demo=1 由工作台自动拉起演示模式
  router.push('/app?demo=1')
}
function goLogin() {
  if (isGuest.value) {
    window.open(router.resolve('/login').href, '_blank', 'noopener,noreferrer')
  } else {
    // 已登录：点击账号胶囊直接进工作台
    window.open(router.resolve('/app').href, '_blank', 'noopener,noreferrer')
  }
}

onMounted(async () => {
  // 注入统计代码（若已配置）
  if (analyticsScript && analyticsScript.trim()) {
    const s = document.createElement('script')
    s.textContent = analyticsScript
    document.head.appendChild(s)
  }
  // 同步后台客服信息（系统设置里的客服电话与客服二维码）
  try {
    const res = await fetch('/api/settings/contact')
    if (res.ok) {
      const d = await res.json()
      contactPhone.value = d.phone || ''
      contactQrUrl.value = d.qrUrl || ''
    }
  } catch {
    /* 忽略，使用占位 */
  }
  // 同步后台站点信息（ICP 备案号）
  try {
    const res = await fetch('/api/settings/site')
    if (res.ok) {
      const d = await res.json()
      if (d.icp) beianNo.value = d.icp
    }
  } catch {
    /* 忽略，使用占位 */
  }
})
</script>

<template>
  <div class="min-h-screen bg-white text-[#1a1a1a]">
    <!-- 顶部导航 -->
    <header class="sticky top-0 z-30 border-b border-[#f0e6dc] bg-white/85 backdrop-blur">
      <div class="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <a href="/" class="flex items-center gap-2">
          <span class="material-symbols-rounded text-[28px] text-[#d97706]">pets</span>
          <span class="font-brand text-lg font-bold tracking-wide">{{ brandName }}</span>
        </a>
        <nav class="hidden items-center gap-7 text-sm font-medium text-[#6b5544] md:flex">
          <a href="#features" class="hover:text-[#d97706]">功能亮点</a>
          <a href="#flow" class="hover:text-[#d97706]">使用流程</a>
          <router-link to="/plans" class="hover:text-[#d97706]">套餐方案</router-link>
          <a href="#faq" class="hover:text-[#d97706]">常见问题</a>
          <router-link to="/guide" target="_blank" rel="noopener noreferrer" class="hover:text-[#d97706]">操作说明</router-link>
          <a href="#contact" class="hover:text-[#d97706]">联系客服</a>
        </nav>
        <div class="flex items-center gap-2">
          <button
            type="button"
            class="hidden items-center gap-2 rounded-xl border border-[#edeff2] bg-white px-3 py-1.5 text-sm font-semibold shadow-sm transition hover:border-orange-200 hover:bg-[#fffaf5] sm:inline-flex"
            @click="goLogin"
          >
            <span class="flex h-8 w-8 items-center justify-center rounded-full bg-[#ffe7c8] text-[#d97706]"><span class="material-symbols-rounded text-[18px]">person</span></span>
            <span class="max-w-[120px] truncate">{{ isGuest ? '游客' : username }}</span>
            <span class="text-sm text-[#999]">{{ isGuest ? '点击登录' : '教师账号' }}</span>
          </button>
          <button type="button" class="rounded-full bg-[#ff5c00] px-5 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-[#e84e00]" @click="goWorkbench">进入工作台</button>
        </div>
      </div>
    </header>

    <!-- Hero（原首页样式保留） -->
    <section class="flex items-center justify-center px-5 pt-16 pb-8 sm:px-8 sm:pb-10">
      <div class="flex w-full max-w-[860px] flex-col items-center text-center">
        <div class="flex h-[34px] items-center justify-center gap-2 rounded-full bg-[#fff3ec] px-4">
          <span class="h-2 w-2 rounded-full bg-[#ff5c00]"></span>
          <span class="font-brand text-sm font-bold text-[#ff5c00]">班级宠物园</span>
        </div>
        <h1 class="mt-[22px] max-w-[820px] font-serif text-5xl font-bold leading-[0.98] text-[#1a1a1a] sm:text-[68px]">{{ landingHeadline }}</h1>
        <p class="mt-[22px] max-w-[660px] text-base leading-[1.45] text-[#666] sm:text-xl">老师快速加分，学生的宠物随习惯一起升级。</p>
        <div class="mt-[22px] flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <button type="button" class="font-brand h-12 rounded-full bg-[#ff5c00] px-8 text-[15px] font-bold text-white shadow-[0_16px_40px_rgba(0,0,0,0.07)] transition hover:bg-[#e95300]" @click="goDemo">进入演示班级</button>
          <button type="button" class="font-brand inline-flex h-12 items-center rounded-full border border-[#ff5c00] bg-white px-8 text-[15px] font-bold text-[#ff5c00] transition hover:bg-[#fff3ec]" @click="goCreateClass">我是老师，创建新班级</button>
        </div>
        <div class="mt-[22px] flex flex-wrap items-center justify-center gap-2">
          <span class="inline-flex items-center gap-1.5 rounded-full border border-[#f3ece4] bg-white px-3.5 py-1.5 text-sm font-semibold text-[#765f50] shadow-sm"><span class="material-symbols-rounded text-[16px] text-[#ff5c00]">workspace_premium</span>新班级赠送 1 个月</span>
          <span class="inline-flex items-center gap-1.5 rounded-full border border-[#f3ece4] bg-white px-3.5 py-1.5 text-sm font-semibold text-[#765f50] shadow-sm"><span class="material-symbols-rounded text-[16px] text-[#ff5c00]">touch_app</span>免安装 即点即用</span>
          <span class="inline-flex items-center gap-1.5 rounded-full border border-[#f3ece4] bg-white px-3.5 py-1.5 text-sm font-semibold text-[#765f50] shadow-sm"><span class="material-symbols-rounded text-[16px] text-[#ff5c00]">save</span>数据随时备份</span>
        </div>
        <div class="mt-[22px] flex h-[86px] w-full max-w-[420px] items-center justify-center gap-[18px] rounded-xl border border-[#f3f4f6] bg-white px-[18px] py-[14px] text-left shadow-[0_16px_40px_rgba(0,0,0,0.07)]">
          <div class="relative h-[58px] w-[58px] shrink-0 rounded-xl bg-[#fff3ec]">
            <span class="absolute left-[15px] top-[14px] h-7 w-7 rounded-full bg-[#ff8533]"></span>
            <span class="absolute left-3 top-[10px] h-2.5 w-2.5 rounded-full bg-[#ff8533]"></span>
            <span class="absolute right-3 top-[10px] h-2.5 w-2.5 rounded-full bg-[#ff8533]"></span>
          </div>
          <div class="min-w-0">
            <p class="font-brand text-sm font-bold text-[#1a1a1a]">评价一次，成长一点</p>
            <p class="mt-1 text-sm leading-5 text-[#888]">积分、等级、徽章都围绕学生的日常表现。</p>
          </div>
        </div>
      </div>
    </section>

    <!-- 产品截图（原首页样式保留） -->
    <section class="flex flex-col items-center justify-center gap-[18px] px-5 py-10 sm:h-[700px] sm:px-8 lg:h-auto lg:min-h-[820px] lg:gap-6 lg:py-14">
      <div class="text-center">
        <p class="font-brand text-sm leading-5 font-semibold text-[#ff5c00]">产品截图</p>
        <h2 class="mt-4 font-serif text-3xl font-bold leading-[1.05] text-[#1a1a1a] sm:text-[34px]">把喂养、成长与班级记录放在同一屏。</h2>
      </div>
      <div class="flex w-full max-w-[1040px] items-center justify-center rounded-xl border border-[#f3f4f6] bg-white p-3 shadow-[0_16px_40px_rgba(0,0,0,0.07)] sm:h-[590px] sm:p-4 lg:max-w-[1180px] lg:h-[660px] lg:p-5 xl:max-w-[1280px] xl:h-[720px]">
        <img src="/class-pet-garden-product.png" alt="班级宠物园产品截图" class="w-full rounded-lg sm:h-full sm:object-contain" />
      </div>
    </section>

    <!-- 功能亮点 -->
    <section id="features" class="relative bg-white py-16 sm:py-20">
      <span class="absolute left-[18%] top-[42px] h-[7px] w-[7px] rounded-full bg-[#ff8533]"></span>
      <span class="absolute right-[18%] top-[40px] text-base text-[#ff5c00]">✦</span>
      <span class="absolute bottom-[34px] left-[24%] h-1 w-[18px] rotate-[-18deg] rounded-full bg-[#ff5c00]"></span>
      <div class="mx-auto max-w-6xl px-4">
        <div class="text-center">
          <p class="font-brand text-sm font-semibold tracking-[0.2em] text-[#ff5c00]">FEATURES</p>
          <h2 class="mt-4 font-serif text-3xl font-bold leading-[1.05] text-[#1a1a1a] sm:text-[38px]">让班级反馈，变成孩子看得见的成长</h2>
          <p class="mt-3 text-[#6b5544]">从课堂评价到家长见证，每个环节都为孩子而设计</p>
        </div>
        <div class="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <article
            v-for="f in features"
            :key="f.title"
            class="group rounded-3xl border border-[#f0e6dc] bg-white p-6 shadow-[0_8px_24px_rgba(101,71,45,0.04)] transition hover:-translate-y-1 hover:border-[#ffd9bd] hover:shadow-[0_16px_40px_rgba(255,122,24,0.12)]"
          >
            <div class="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#fff7ef] text-[#ff7a18] transition group-hover:bg-[#ff7a18] group-hover:text-white">
              <span class="material-symbols-rounded text-[24px]">{{ f.icon }}</span>
            </div>
            <h3 class="mt-4 text-lg font-bold text-[#2b1d12]">{{ f.title }}</h3>
            <p class="mt-2 text-sm leading-relaxed text-[#6b5544]">{{ f.desc }}</p>
          </article>
        </div>
      </div>
    </section>

    <!-- 使用流程 -->
    <section id="flow" class="bg-[#faf6f1] py-16">
      <div class="mx-auto max-w-6xl px-4">
        <div class="text-center">
          <p class="font-brand text-sm font-semibold tracking-[0.2em] text-[#ff5c00]">HOW IT WORKS</p>
          <h2 class="mt-4 font-serif text-3xl font-bold text-[#2b1d12] sm:text-[38px]">四步开启成长之旅</h2>
          <p class="mt-3 text-[#6b5544]">老师、课堂、家长，各司其职又彼此连接</p>
        </div>
        <div class="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <div v-for="(it, i) in flow" :key="it.step" class="relative rounded-3xl border border-[#f0e6dc] bg-white p-6 transition hover:border-[#ffd9bd] hover:shadow-[0_16px_40px_rgba(255,122,24,0.10)]">
            <span class="absolute -top-4 left-6 flex h-9 w-9 items-center justify-center rounded-full bg-[#ff5c00] text-sm font-bold text-white shadow">{{ it.step }}</span>
            <div class="mt-4 flex h-12 w-12 items-center justify-center rounded-xl bg-[#fff7ef] text-[#ff7a18]"><span class="material-symbols-rounded text-[24px]">{{ it.icon }}</span></div>
            <p class="mt-3 text-xs font-semibold uppercase tracking-wider text-[#d97706]">{{ it.who }}</p>
            <h3 class="text-lg font-bold">{{ it.title }}</h3>
            <p class="mt-2 text-sm leading-relaxed text-[#6b5544]">{{ it.desc }}</p>
            <ul class="mt-3 space-y-1.5">
              <li v-for="p in it.points" :key="p" class="flex items-start gap-1.5 text-sm text-[#8a6d58]">
                <span class="material-symbols-rounded mt-0.5 text-[16px] text-[#ff5c00]">check</span>
                <span>{{ p }}</span>
              </li>
            </ul>
            <div v-if="i < flow.length - 1" class="absolute -right-4 top-1/2 hidden text-2xl text-[#e7c9a8] lg:block">→</div>
          </div>
        </div>
      </div>
    </section>

    <!-- 套餐方案（完整版见 /plans 页面） -->
    <section id="plans" class="mx-auto max-w-6xl px-4 py-16">
      <div class="rounded-3xl border border-[#f0e6dc] bg-white p-8 text-center shadow-sm md:p-12">
        <h2 class="font-serif text-3xl font-bold text-[#2b1d12]">简单透明的套餐</h2>
        <p class="mt-3 text-[#6b5544]">基础版永久免费；灵犀计划按班级开通，月付 ¥18 起，学期 ¥68、年度 ¥128 更划算</p>
        <div class="mx-auto mt-8 grid max-w-3xl gap-4 text-left sm:grid-cols-3">
          <div class="rounded-2xl border border-[#f0e6dc] bg-[#fffdfb] p-5">
            <p class="text-sm font-bold text-[#422d20]">月会员</p>
            <p class="mt-2 font-serif text-2xl font-bold text-[#d97706]">¥18<span class="text-sm font-normal text-[#9a735d]"> / 月</span></p>
          </div>
          <div class="relative rounded-2xl border-2 border-[#ff5c00] bg-gradient-to-b from-[#fff7ef] to-white p-5 shadow-md">
            <span class="absolute -top-2.5 right-3 rounded-full bg-[#ff5c00] px-2 py-0.5 text-xs font-bold text-white">推荐</span>
            <p class="text-sm font-bold text-[#422d20]">学期会员</p>
            <p class="mt-2 font-serif text-2xl font-bold text-[#d97706]">¥68<span class="text-sm font-normal text-[#9a735d]"> / 学期</span></p>
          </div>
          <div class="rounded-2xl border border-[#f0e6dc] bg-[#fffdfb] p-5">
            <p class="text-sm font-bold text-[#422d20]">年度会员</p>
            <p class="mt-2 font-serif text-2xl font-bold text-[#d97706]">¥128<span class="text-sm font-normal text-[#9a735d]"> / 年</span></p>
          </div>
        </div>
        <router-link
          to="/plans"
          class="mt-8 inline-flex h-12 items-center gap-1.5 rounded-full bg-[#ff5c00] px-7 text-base font-bold text-white transition hover:bg-[#e84e00]"
        >
          查看完整方案与会员权益
          <span class="material-symbols-rounded text-[20px]">arrow_forward</span>
        </router-link>
      </div>
    </section>

    <!-- FAQ -->
    <section id="faq" class="bg-[#faf6f1] py-16">
      <div class="mx-auto max-w-5xl px-4">
        <h2 class="text-center font-serif text-3xl font-bold text-[#2b1d12]">常见问题</h2>
        <p class="mt-3 text-center text-sm text-[#9a735d]">关于使用、家长参与与会员的常见疑问，点击展开查看</p>
        <div class="mt-10 grid gap-4 md:grid-cols-2">
          <details v-for="(f, i) in faqs" :key="i" class="group rounded-2xl border border-[#f0e6dc] bg-white p-5 [&_summary]:cursor-pointer">
            <summary class="flex items-center justify-between font-semibold text-[#422d20]">
              <span>{{ f.q }}</span>
              <span class="material-symbols-rounded shrink-0 text-[#d97706] transition group-open:rotate-180">expand_more</span>
            </summary>
            <p class="mt-3 text-sm leading-relaxed text-[#6b5544]">{{ f.a }}</p>
          </details>
        </div>
      </div>
    </section>

    <!-- 客服 -->
    <section id="contact" class="mx-auto max-w-6xl px-4 py-16">
      <div class="overflow-hidden rounded-3xl bg-gradient-to-br from-[#ff7a18] to-[#ff5c00] p-8 text-white shadow-lg md:p-12">
        <div class="grid items-center gap-8 md:grid-cols-2">
          <div>
            <h2 class="font-serif text-3xl font-bold">有任何问题，随时找我们</h2>
            <p class="mt-3 opacity-90">专属客服协助你创建班级、配置方案，让落地零阻力。</p>
            <div class="mt-6 space-y-3 text-sm">
              <p class="flex items-center gap-2"><span class="material-symbols-rounded">call</span> 客服电话：{{ contactPhone || fallbackPhone }}</p>
              <p class="flex items-center gap-2"><span class="material-symbols-rounded">refresh</span> 服务时间：{{ serviceTime }}</p>
            </div>
            <button type="button" class="mt-6 inline-flex h-12 items-center gap-2 rounded-full bg-white px-7 text-base font-bold text-[#ff5c00] transition hover:bg-[#fff3eb]" @click="goWorkbench">
              立即免费体验
              <span class="material-symbols-rounded text-[20px]">arrow_forward</span>
            </button>
          </div>
          <div class="flex flex-col items-center justify-center">
            <div class="flex h-44 w-44 items-center justify-center rounded-3xl bg-white/95 shadow-inner">
              <img v-if="contactQrUrl" :src="contactQrUrl" alt="客服二维码" class="h-40 w-40 rounded-2xl object-contain" />
              <span v-else class="material-symbols-rounded text-[64px] text-[#ffb380]">share</span>
            </div>
            <p class="mt-3 text-sm opacity-90">扫码添加客服</p>
          </div>
        </div>
      </div>
    </section>

    <!-- 底部 CTA（原首页样式保留）+ 备案 -->
    <footer class="bg-[#f7f8fa] px-5 py-14 text-center sm:px-8">
      <div class="flex flex-col items-center gap-[14px]">
        <h2 class="font-serif text-3xl font-bold text-[#1a1a1a] sm:text-[34px]">先从一个班级开始。</h2>
        <div class="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-base">
          <span class="text-[#666]">导入学生，设置评价规则，让成长被看见。</span>
          <button type="button" class="font-brand font-bold text-[#ff5c00] underline-offset-2 transition hover:text-[#e95300] hover:underline" @click="goDemo">进入演示班级</button>
          <span class="text-[#ccc]">·</span>
          <button type="button" class="font-brand font-bold text-[#ff5c00] underline-offset-2 transition hover:text-[#e95300] hover:underline" @click="goCreateClass">我是老师，创建新班级</button>
        </div>
        <p class="font-brand text-sm text-[#888]">© 2026 {{ brandName }}。保留所有权利。</p>
        <p class="text-xs text-[#aaa]">{{ beianNo }}</p>
      </div>
    </footer>
  </div>
</template>
