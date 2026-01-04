const fs = require('fs')
const path = require('path')

function walk(dir){
  let out=[]
  for(const f of fs.readdirSync(dir)){
    const fp=path.join(dir,f)
    const stat=fs.statSync(fp)
    if(stat.isDirectory()) out=out.concat(walk(fp))
    else if(fp.endsWith('.css')) out.push(fp)
  }
  return out
}

const re = /oklch\(([^)]+)\)/g
const files = walk(path.join(__dirname,'..','src'))
const vals = new Set()
for(const file of files){
  const s = fs.readFileSync(file,'utf8')
  let m
  while((m=re.exec(s))){
    vals.add(m[0])
  }
}
const list = Array.from(vals).sort()

function parseOklch(s){
  // s like 'oklch(0.145 0 0)' or with slash alpha
  let inner = s.slice(6,-1).trim()
  let alpha = 1
  if(inner.includes('/')){
    const parts = inner.split('/')
    inner = parts[0].trim()
    const a = parts[1].trim()
    if(a.endsWith('%')) alpha = parseFloat(a)/100
    else alpha = parseFloat(a)
  }
  // split by spaces
  const parts = inner.split(/\s+/).map(p=>parseFloat(p))
  let L=parts[0]||0
  let C=parts[1]||0
  let H=parts[2]||0
  if(parts.length>=4){
    // heuristic: sometimes we see 'L 0 0 H' where H is last token
    if(parts[1]===0 && parts[2]===0 && parts[3]>1) {
      C = 0
      H = parts[3]
    }
  }
  return {L,C,H,alpha}
}

// conversion functions
function oklchToHex(s){
  const {L,C,H,alpha} = parseOklch(s)
  const hRad = (H * Math.PI) / 180
  const a = Math.cos(hRad) * C
  const b = Math.sin(hRad) * C
  // OKLab to LMS
  const L_ = L + 0.3963377774 * a + 0.2158037573 * b
  const M_ = L - 0.1055613458 * a - 0.0638541728 * b
  const S_ = L - 0.0894841775 * a - 1.2914855480 * b
  const l = Math.pow(L_,3)
  const m = Math.pow(M_,3)
  const s_ = Math.pow(S_,3)
  let r = +4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s_
  let g = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s_
  let bch = -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s_
  function lin2srgb(u){
    if(u <= 0) return 0
    if(u >= 1) return 1
    if(u <= 0.0031308) return 12.92 * u
    return 1.055 * Math.pow(u, 1/2.4) - 0.055
  }
  const R = Math.round(Math.min(1, Math.max(0, lin2srgb(r))) * 255)
  const G = Math.round(Math.min(1, Math.max(0, lin2srgb(g))) * 255)
  const B = Math.round(Math.min(1, Math.max(0, lin2srgb(bch))) * 255)
  const hex = '#' + [R,G,B].map(x=>x.toString(16).padStart(2,'0')).join('')
  if(alpha !== 1){
    const A = Math.round(alpha*255)
    const hexA = (hex + A.toString(16).padStart(2,'0')).toUpperCase()
    return hexA
  }
  return hex.toUpperCase()
}

const out = {}
for(const s of list){
  out[s]=oklchToHex(s)
}
console.log(JSON.stringify(out,null,2))
