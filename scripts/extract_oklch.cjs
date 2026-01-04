const fs = require('fs')
const path = require('path')

function walk(dir) {
  let out = []
  for (const f of fs.readdirSync(dir)) {
    const fp = path.join(dir, f)
    const stat = fs.statSync(fp)
    if (stat.isDirectory()) out = out.concat(walk(fp))
    else if (fp.endsWith('.css')) out.push(fp)
  }
  return out
}

const files = walk(path.join(__dirname, '..', 'src'))
const re = /oklch\([^\)]*\)/g
const vals = new Set()
for (const file of files) {
  const s = fs.readFileSync(file, 'utf8')
  let m
  while ((m = re.exec(s))) {
    vals.add(m[0])
  }
}
console.log(Array.from(vals).sort().join('\n'))
