// Strings ported from app.html's I18N map, keeping the same keys so the two
// stay comparable. Only the keys this app actually renders are here; pull more
// across from app.html as screens grow.
//
// NOTE: Chinese keeps 益生菌 for 1C-01. English must never say "probiotic" in
// outward-facing copy — use "live cultures". The restriction is a UK/EU one and
// Chinese is explicitly exempt. See CLAUDE.md in the website repo.
import { getLocales } from 'expo-localization';

const en = {
  'nav.signout': 'Sign out',
  'auth.h1': 'Track your cognition',
  'auth.sub': 'Sign in to reach your longitudinal cognitive dashboard.',
  'auth.email': 'Email',
  'auth.email_ph': 'you@example.com',
  'auth.password': 'Password',
  'auth.confirm': 'Confirm password',
  'auth.signin': 'Sign in',
  'auth.signup': 'Create account',
  'auth.toggle_signup': 'No account? Create one',
  'auth.toggle_signin': 'Already have an account? Sign in',
  'auth.mismatch': 'Passwords do not match.',
  'err.save': 'Could not save: ',

  'onboard.h1': 'A few details first',
  'onboard.sub': 'These let us compare your scores against the right reference group. You can change them later.',
  'onboard.name': 'Name',
  'onboard.age': 'Age',
  'onboard.sex': 'Sex at birth',
  'onboard.consent': 'I agree to my data being used for the PROFILE study.',
  'onboard.start': 'Start first session →',

  'dash.h1': 'Your dashboard',
  'dash.new_session': 'Start a session',
  'dash.sessions': 'Sessions completed',
  'dash.last': 'Last session',
  'dash.never': 'No sessions yet',
  'dash.composite': 'Composite score',

  'sleep.h1': 'Sleep & wellbeing',
  'sleep.sub': 'Sleep moves cognitive scores more than almost anything else, so we ask first.',
  'sleep.hours': 'Hours slept last night',
  'sleep.quality': 'Sleep quality',
  'sleep.import': 'Import from Health',
  'sleep.imported': 'Imported {n}h from Health',
  'sleep.import_none': 'No sleep data found for last night',
  'sleep.continue': 'Start cognitive tests →',

  'battery.h1': 'Cognitive assessment',
  'battery.sub': 'Takes about 10 minutes. Find a quiet place and minimise distractions.',
  'battery.session': 'Session {n}',
  'battery.progress': '{done} of {total}',
  'battery.start': 'Start',
  'battery.task_of': 'Task {n} of {total}',

  'results.eyebrow': 'Session complete',
  'results.composite_label': '/ 100 composite score',
  'results.delta_up': '▲ {n} from last session',
  'results.delta_down': '▼ {n} from last session',
  'results.delta_same': 'Same as last session',
  'results.first': 'Your first session',
  'results.save': 'Save & view dashboard →',
  'results.saving': 'Saving…',

  'sleep.panel_title': 'Sleep health · last session',
  'domain.panel_title': 'Domain breakdown',

  'prob.panel_title': '1C-01 Live Cultures',
  'prob.prompt': 'Have you started taking 1C-01? Log your start date so we can track the effect on your cognition.',
  'prob.log_btn': 'Log start date',
  'prob.update_btn': 'Update start date',
  'prob.active': 'Taking since {d}',

  'notif.title': 'Time for your next session',
  'notif.body': "It's been two weeks since your last cognitive session. It takes about 10 minutes.",
};

const zh = {
  'nav.signout': '退出登录',
  'auth.h1': '追踪您的认知能力',
  'auth.sub': '登录以访问您的纵向认知评估仪表板。',
  'auth.email': '电子邮件',
  'auth.email_ph': '您的邮箱',
  'auth.password': '密码',
  'auth.confirm': '确认密码',
  'auth.signin': '登录',
  'auth.signup': '注册账号',
  'auth.toggle_signup': '还没有账号？立即注册',
  'auth.toggle_signin': '已有账号？登录',
  'auth.mismatch': '两次输入的密码不一致。',
  'err.save': '保存失败：',

  'onboard.h1': '先填写几项信息',
  'onboard.sub': '这些信息用于将您的分数与合适的参照组比较。之后可以修改。',
  'onboard.name': '姓名',
  'onboard.age': '年龄',
  'onboard.sex': '出生时性别',
  'onboard.consent': '我同意将我的数据用于 PROFILE 研究。',
  'onboard.start': '开始第一次测试 →',

  'dash.h1': '我的仪表板',
  'dash.new_session': '开始测试',
  'dash.sessions': '已完成测试',
  'dash.last': '上次测试',
  'dash.never': '尚无记录',
  'dash.composite': '综合得分',

  'sleep.h1': '睡眠与健康',
  'sleep.sub': '睡眠对认知分数的影响几乎超过其他所有因素，因此我们先询问这一项。',
  'sleep.hours': '昨晚睡眠时长',
  'sleep.quality': '睡眠质量',
  'sleep.import': '从“健康”导入',
  'sleep.imported': '已导入 {n} 小时',
  'sleep.import_none': '未找到昨晚的睡眠数据',
  'sleep.continue': '开始认知测试 →',

  'battery.h1': '认知评估',
  'battery.sub': '大约需要 10 分钟。请找一个安静的地方，尽量减少干扰。',
  'battery.session': '第 {n} 次测试',
  'battery.progress': '{done} / {total}',
  'battery.start': '开始',
  'battery.task_of': '第 {n} 项 / 共 {total} 项',

  'results.eyebrow': '本次测试完成',
  'results.composite_label': '/ 100 综合得分',
  'results.delta_up': '▲ 较上次提高 {n}',
  'results.delta_down': '▼ 较上次下降 {n}',
  'results.delta_same': '与上次持平',
  'results.first': '这是您的第一次测试',
  'results.save': '保存并查看仪表板 →',
  'results.saving': '保存中…',

  'sleep.panel_title': '睡眠健康 · 上次记录',
  'domain.panel_title': '各领域细分',

  'prob.panel_title': '1C-01 益生菌',
  'prob.prompt': '您开始服用 1C-01 了吗？记录开始日期，以便我们追踪其对认知的影响。',
  'prob.log_btn': '记录开始日期',
  'prob.update_btn': '更新开始日期',
  'prob.active': '自 {d} 起服用',

  'notif.title': '该做下一次测试了',
  'notif.body': '距离上次认知测试已过去两周。大约需要 10 分钟。',
};

const TABLES = { en, zh };

let current = 'en';

export function detectLanguage() {
  const tag = getLocales()?.[0]?.languageCode || 'en';
  current = tag.toLowerCase().startsWith('zh') ? 'zh' : 'en';
  return current;
}

export function setLanguage(lang) {
  current = lang === 'zh' ? 'zh' : 'en';
  return current;
}

export function getLanguage() {
  return current;
}

/** T('battery.progress', { done: 2, total: 7 }) */
export function T(key, vars) {
  const table = TABLES[current] || en;
  let s = table[key] ?? en[key] ?? key;
  if (vars) {
    for (const k of Object.keys(vars)) {
      s = s.replace(new RegExp(`\\{${k}\\}`, 'g'), String(vars[k]));
    }
  }
  return s;
}
