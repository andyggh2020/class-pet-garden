<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()
</script>

<template>
  <div class="min-h-screen bg-[#fffdfb] text-[#38281f]">
    <div class="mx-auto max-w-3xl px-5 py-10 sm:px-8 sm:py-14">
      <button
        type="button"
        class="inline-flex items-center gap-1.5 text-sm font-semibold text-[#765f50] transition hover:text-[#ff5c00]"
        @click="router.back()"
      >
        <span class="material-symbols-rounded text-[18px]">chevron_left</span>
        返回
      </button>

      <div class="mt-5 flex items-center gap-3">
        <span class="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#ffe7c8] text-[#d97706]"><span class="material-symbols-rounded text-[24px]">pets</span></span>
        <div>
          <p class="text-sm font-bold text-[#ff5c00]">班级宠物园</p>
          <p class="text-sm text-[#9a5a2b]">CLASS PET GARDEN</p>
        </div>
      </div>

      <article class="mt-7 rounded-3xl border border-[#f0e7dd] bg-white p-6 shadow-[0_16px_40px_rgba(101,71,45,0.06)] sm:p-9">
        <h1 class="font-serif text-3xl font-bold text-[#1a1a1a]">隐私政策</h1>
        <p class="mt-2 text-sm text-[#9a735d]">最后更新：2026 年 10 月 15 日 · 版本 v1.0</p>

        <div class="mt-8 space-y-7 text-sm leading-7 text-[#4a3a2d]">
          <section>
            <h2 class="text-base font-bold text-[#2b1d12]">一、我们收集的信息</h2>
            <p class="mt-2">1. 教师账号信息：注册与登录所需的手机号码、密码（加密存储）。</p>
            <p class="mt-1">2. 班级教学数据：由教师录入的学生姓名、学号，以及课堂评价产生的积分、宠物成长、任务完成记录。</p>
            <p class="mt-1">3. 支付信息：您扫码支付时产生的订单号、金额、时间；我们不收集、不存储您的银行卡信息。</p>
            <p class="mt-1">4. 设备与日志信息：为保障服务安全所需的 IP 地址、浏览器类型、操作日志。</p>
          </section>

          <section>
            <h2 class="text-base font-bold text-[#2b1d12]">二、信息的使用目的</h2>
            <p class="mt-2">上述信息仅用于：提供与改进本服务、账号登录与安全验证、会员开通与到账核实、客服支持与争议处理。我们不会将您的数据用于任何广告营销，也不会向任何第三方出售。</p>
          </section>

          <section>
            <h2 class="text-base font-bold text-[#2b1d12]">三、关于未成年人（学生）信息的特别说明</h2>
            <p class="mt-2">本服务面向教师使用，学生信息由教师代为录入与管理。我们仅将学生数据处理于课堂激励之目的，不收集学生的身份证号、家庭住址、联系方式等敏感个人信息。学生数据不用于用户画像、不用于广告推送。家长通过分享链接查看的内容仅限于教师选择展示的成长信息。</p>
          </section>

          <section>
            <h2 class="text-base font-bold text-[#2b1d12]">四、数据存储与安全</h2>
            <p class="mt-2">1. 数据存储于中华人民共和国境内的服务器，传输过程使用 HTTPS 加密。</p>
            <p class="mt-1">2. 我们按角色控制访问权限：教师仅能访问自己班级的数据；管理员仅在开通会员、处理投诉所必需的范围内访问数据。</p>
            <p class="mt-1">3. 我们采取合理的行业标准安全措施保护数据，但请您理解任何系统均无法保证绝对安全。</p>
          </section>

          <section>
            <h2 class="text-base font-bold text-[#2b1d12]">五、信息共享</h2>
            <p class="mt-2">除以下情形外，我们不会与任何第三方共享您的信息：1. 获得您的明确同意；2. 依据法律法规、司法机关或行政机关的强制性要求；3. 为完成支付所必需的最小范围信息。</p>
          </section>

          <section>
            <h2 class="text-base font-bold text-[#2b1d12]">六、您的权利</h2>
            <p class="mt-2">您对本人数据享有查询、更正、导出（数据备份功能）与删除的权利。需删除账号或班级数据的，请通过"联系客服"通道提交申请，我们将在核实身份后 15 个工作日内处理。</p>
          </section>

          <section>
            <h2 class="text-base font-bold text-[#2b1d12]">七、Cookie 与本地存储</h2>
            <p class="mt-2">我们使用浏览器本地存储（localStorage）保存您的登录状态与班级偏好设置，用于免登录与体验优化。清除浏览器数据后将退出登录。</p>
          </section>

          <section>
            <h2 class="text-base font-bold text-[#2b1d12]">八、政策更新</h2>
            <p class="mt-2">本政策如有重大修订，我们将在系统内以公告形式通知。继续使用本服务即表示您接受修订后的政策。</p>
          </section>

          <section>
            <h2 class="text-base font-bold text-[#2b1d12]">九、联系我们</h2>
            <p class="mt-2">如您对本政策或数据处理有任何疑问、投诉，请通过销售页「联系客服」区块提供的客服电话或二维码与我们联系，我们将在 15 个工作日内答复。</p>
          </section>
        </div>

        <div class="mt-10 border-t border-[#f3ece4] pt-5 text-xs text-[#a1836d]">
          本政策为《班级宠物园用户服务协议》的组成部分。请您与《用户服务协议》一并阅读。
        </div>
      </article>
    </div>
  </div>
</template>
