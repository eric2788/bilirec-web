const fs = require('fs')
const path = require('path')

const mapping = {
  "oklch(0.12 0.02 240)": "#01060C",
  "oklch(0.145 0 0)": "#0A0A0A",
  "oklch(0.18 0.02 240)": "#09131A",
  "oklch(0.20 0.02 240)": "#0E171E",
  "oklch(0.205 0 0)": "#171717",
  "oklch(0.25 0.02 240)": "#19232A",
  "oklch(0.269 0 0)": "#262626",
  "oklch(0.28 0.03 240)": "#1B2B36",
  "oklch(0.398 0.07 227.392)": "#104E64",
  "oklch(0.488 0 0 264.376)": "#606060",
  "oklch(0.488 0.243 264.376)": "#1447E6",
  "oklch(0.50 0.02 240)": "#59656E",
  "oklch(0.556 0 0)": "#737373",
  "oklch(0.56 0 0)": "#747474",
  "oklch(0.577 0.245 27.325)": "#E7000B",
  "oklch(0.6 0.118 184.704)": "#009689",
  "oklch(0.627 0.265 303.9)": "#AD46FF",
  "oklch(0.645 0.246 16.439)": "#FF2056",
  "oklch(0.646 0.222 41.116)": "#F54900",
  "oklch(0.66 0.06 220)": "#689BAC",
  "oklch(0.696 0.17 162.48)": "#00BC7D",
  "oklch(0.7 0.1 263)": "#7D9EDD",
  "oklch(0.70 0.15 240)": "#26A9F1",
  "oklch(0.704 0.191 22.216)": "#FF6467",
  "oklch(0.708 0 0)": "#A1A1A1",
  "oklch(0.75 0.02 240)": "#A3B0BA",
  "oklch(0.769 0.188 70.08)": "#FE9A00",
  "oklch(0.828 0.189 84.429)": "#FFB900",
  "oklch(0.85 0.01 240)": "#C8CFD4",
  "oklch(0.88 0.02 240)": "#CCDAE4",
  "oklch(0.90 0.01 240)": "#D8DFE4",
  "oklch(0.922 0 0)": "#E5E5E5",
  "oklch(0.95 0.01 240)": "#E9F0F5",
  "oklch(0.96 0.01 240)": "#ECF3F8",
  "oklch(0.97 0 0)": "#F5F5F5",
  "oklch(0.97 0.02 220)": "#E7F9FF",
  "oklch(0.98 0.01 240)": "#F3FAFF",
  "oklch(0.985 0 0)": "#FAFAFA",
  "oklch(0.99 0 0)": "#FCFCFC",
  "oklch(1 0 0 / 10%)": "#FFFFFF1A",
  "oklch(1 0 0 / 15%)": "#FFFFFF26",
  "oklch(1 0 0 / 6%)": "#FFFFFF0F",
  "oklch(1 0 0 / 8%)": "#FFFFFF14",
  "oklch(1 0 0)": "#FFFFFF"
}

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

const files = walk(path.join(__dirname,'..','src'))
for(const file of files){
  let s = fs.readFileSync(file,'utf8')
  let changed = false
  for(const [k,v] of Object.entries(mapping)){
    if(s.includes(k)){
      s = s.split(k).join(v)
      changed = true
    }
  }
  if(changed){
    fs.writeFileSync(file,s,'utf8')
    console.log('Updated', file)
  }
}
console.log('Done')
