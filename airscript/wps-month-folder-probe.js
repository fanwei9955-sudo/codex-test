// 物业数据中转 · 月份文件夹探测（只读）
//
// 已验证：kdocs.cn/mine/<数字编号> 能列出「黄江6号 / 01 账目」里的月份文件夹。
// 但 listFiles 返回的只有加密 fileId，没有数字编号，没法直接拼链接进到月份文件夹里。
// 这一版试几种方式进入「黄江6号 26-10」，再试能不能直接打开里面的表。
//
// 用法：运行。「权限被拒绝」之类的错误会让脚本直接停下，
// 日志最后一行「试 N」就是失败的那种，把 START 改成 N+1 再运行。

const ACCOUNT_DIR = 'https://www.kdocs.cn/mine/503398175728' // 黄江6号 / 01 账目
const MONTH = '26-10'
const START = 1

const months = KSDrive.listFiles({ dirUrl: ACCOUNT_DIR, count: 100 }).files
const info = months.find(f => f.fileName.includes(MONTH))
if (!info) throw new Error('01 账目里没找到 ' + MONTH)
console.log('月份文件夹：' + JSON.stringify(info))
console.log('字段：' + Object.keys(info).join('、'))

const attempts = [
  ['把 FileInfo 整个当 dirUrl', () => KSDrive.listFiles({ dirUrl: info, count: 30 })],
  ['把加密 fileId 当 dirUrl', () => KSDrive.listFiles({ dirUrl: info.fileId, count: 30 })],
  ['kdocs.cn/l/ + fileId', () => KSDrive.listFiles({ dirUrl: 'https://www.kdocs.cn/l/' + info.fileId, count: 30 })]
]

for (let i = START - 1; i < attempts.length; i++) {
  console.log('试 ' + (i + 1) + '：' + attempts[i][0])
  const files = attempts[i][1]().files
  console.log('✅ 第 ' + (i + 1) + ' 种可以：' + files.map(f => f.fileName).join('、'))

  // 进得去的话，接着试用 FileInfo 直接打开里面的表
  const sheet = files.find(f => /\.xlsx?$/.test(f.fileName))
  if (sheet) {
    const file = KSDrive.openFile(sheet)
    try {
      console.log('✅ 直接打开 ' + sheet.fileName + '，A1：' + file.Application.Sheets.Item(1).Range('A1').Text)
    } finally {
      file.close()
    }
  }
  break
}
