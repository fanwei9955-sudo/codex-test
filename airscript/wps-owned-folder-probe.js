// 物业数据中转 · 自有共享文件夹探测（只读）
//
// 验证：如果共享文件夹的所有者是你，脚本能不能列出里面的文件。
// 拿你自己建的「永诚壹【深圳】」来试，结果成立的话，再把「叶丹如」转回给你。
//
// 上次用加密 fileId 拼 mine/ 链接报「invalid int: Parentid」，说明目录链接要的是数字 id。
// 数字 id 在文件夹网址里，所以这次必须填 FOLDER_URL。
//
// 用法：
//   1. 在浏览器打开「永诚壹【深圳】」文件夹，复制地址栏网址填到 FOLDER_URL
//   2. 运行。「权限被拒绝」会让脚本直接停下，日志最后一行「试 N」就是失败的那种
//   3. 把 START 改成 N+1 再运行，直到出现 ✅ 或全部试完

const FOLDER_URL = ''
const START = 1

const m = FOLDER_URL.match(/\/team\/(\d+)/)
const groupId = m ? m[1] : ''
const q = FOLDER_URL.match(/folderid=(-?\d+)/)
const folderId = q ? q[1] : ''
console.log('团队 id：' + groupId + '，文件夹 id：' + folderId)

const candidates = [
  FOLDER_URL,
  folderId && 'https://www.kdocs.cn/mine/' + folderId,
  folderId && 'https://www.kdocs.cn/mine/' + folderId.replace('-', ''),
  groupId && 'https://www.kdocs.cn/team/' + groupId
]

for (let i = START - 1; i < candidates.length; i++) {
  const url = candidates[i]
  if (!url) continue
  console.log('试 ' + (i + 1) + '：' + url)
  const list = KSDrive.listFiles({ dirUrl: url, count: 30 })
  console.log('✅ 第 ' + (i + 1) + ' 种可以：' + list.files.length + ' 个：' + list.files.map(f => f.fileName).join('、'))
  break
}
