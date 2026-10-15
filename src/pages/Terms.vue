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
        <h1 class="font-serif text-3xl font-bold text-[#1a1a1a]">用户服务协议</h1>
        <p class="mt-2 text-sm text-[#9a735d]">最后更新：2026 年 10 月 15 日 · 版本 v1.0</p>

        <div class="mt-8 space-y-7 text-sm leading-7 text-[#4a3a2d]">
          <section>
            <h2 class="text-base font-bold text-[#2b1d12]">一、服务说明</h2>
            <p class="mt-2">班级宠物园（以下简称"本服务"）是一款面向教师的班级课堂激励工具。教师通过本服务创建班级、管理学生、记录课堂评价，并以宠物成长的形式向学生与家长呈现。您在注册账号或使用本服务前，应当已满 18 周岁并具备完全民事行为能力。</p>
          </section>

          <section>
            <h2 class="text-base font-bold text-[#2b1d12]">二、账号注册与安全</h2>
            <p class="mt-2">1. 您需以真实有效的手机号注册账号，并自行妥善保管账号与密码。因您主动泄露或保管不善造成的损失，由您自行承担。</p>
            <p class="mt-1">2. 账号仅限本人（教师）使用，不得出租、出借、转让或用于任何商业转售。</p>
            <p class="mt-1">3. 如发现账号存在异常登录或数据异常，请立即通过"联系客服"通道通知我们。</p>
          </section>

          <section>
            <h2 class="text-base font-bold text-[#2b1d12]">三、服务内容与变更</h2>
            <p class="mt-2">1. 基础功能（创建班级、导入学生、评价记录、宠物成长、家长分享页）永久免费。</p>
            <p class="mt-1">2. 我们可能根据运营需要调整、新增或下线部分功能；涉及收费权益变动的，将提前在系统内公告。</p>
          </section>

          <section>
            <h2 class="text-base font-bold text-[#2b1d12]">四、收费与付费</h2>
            <p class="mt-2">1. "灵犀计划"为增值服务，按班级开通，具体方案与价格以会员页展示为准（当前为月 ¥18 / 学期 ¥68 / 年 ¥128，如有调整以页面公示为准）。</p>
            <p class="mt-1">2. 新注册教师的首个班级自动赠送 1 个月会员，赠送权益不可转移、不可折现。</p>
            <p class="mt-1">3. 会员权益自管理员确认到账并授权后生效，到期后自动恢复为基础版，历史数据完整保留。</p>
          </section>

          <section>
            <h2 class="text-base font-bold text-[#2b1d12]">五、退款政策</h2>
            <p class="mt-2">1. 会员授权后 7 日内且未使用任何会员权益的，可申请全额退款。</p>
            <p class="mt-1">2. 已使用会员权益或超过 7 日的订单，不支持退款；年费方案在有效期内可随时申请按剩余月份比例退还。</p>
            <p class="mt-1">3. 退款需通过客服通道提交申请，经核实后于 5 个工作日内原路退回。</p>
          </section>

          <section>
            <h2 class="text-base font-bold text-[#2b1d12]">六、用户行为规范</h2>
            <p class="mt-2">您不得利用本服务上传、发布、传播违反法律法规或侵害他人权益的内容，不得以技术手段恶意抓取数据、干扰服务正常运行。学生姓名、学号等班级数据应由教师如实录入，不得录入与学生课堂表现无关的敏感个人信息。</p>
          </section>

          <section>
            <h2 class="text-base font-bold text-[#2b1d12]">七、数据与隐私</h2>
            <p class="mt-2">我们按照《隐私政策》收集、使用与保护您的数据。请务必使用本服务提供的"数据备份"功能定期导出重要数据；因不可抗力或您自身原因导致的数据丢失，我们将尽力协助恢复但不承担由此造成的间接损失。</p>
          </section>

          <section>
            <h2 class="text-base font-bold text-[#2b1d12]">八、知识产权</h2>
            <p class="mt-2">本服务的界面设计、代码、宠物形象、文案及相关知识产权均归本服务所有。您录入的班级数据归您所有，我们仅在提供服务所必需的范围内处理。</p>
          </section>

          <section>
            <h2 class="text-base font-bold text-[#2b1d12]">九、责任限制</h2>
            <p class="mt-2">因电信运营商故障、网络攻击、电力中断等不可抗力导致服务中断的，我们不承担由此产生的直接或间接损失，但将及时尽最大努力修复。</p>
          </section>

          <section>
            <h2 class="text-base font-bold text-[#2b1d12]">十、协议变更与终止</h2>
            <p class="mt-2">1. 本协议如有修改，我们将在系统内公告，继续使用即视为接受修改后的协议。</p>
            <p class="mt-1">2. 您可随时停止使用并注销账号；我们有权对违反本协议的账号采取限制功能、封禁等措施。</p>
          </section>

          <section>
            <h2 class="text-base font-bold text-[#2b1d12]">十一、争议解决</h2>
            <p class="mt-2">本协议适用中华人民共和国法律。因本协议产生的争议，双方应先友好协商；协商不成的，任何一方可向本服务运营者所在地有管辖权的人民法院提起诉讼。</p>
          </section>
        </div>

        <div class="mt-10 border-t border-[#f3ece4] pt-5 text-xs text-[#a1836d]">
          如对本协议有任何疑问，请通过销售页「联系客服」区块与我们取得联系。
        </div>
      </article>
    </div>
  </div>
</template>
