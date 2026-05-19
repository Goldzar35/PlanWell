import { Resvg } from '@resvg/resvg-js'
import { readFileSync, writeFileSync, mkdirSync } from 'fs'
import { execSync } from 'child_process'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')

const svgData = readFileSync(join(root, 'resources/icon.svg'), 'utf-8')

// Render at 1024×1024
const resvg = new Resvg(svgData, { fitTo: { mode: 'width', value: 1024 } })
const pngData = resvg.render().asPng()
const iconPath = join(root, 'resources/icon.png')
writeFileSync(iconPath, pngData)
console.log('✓ resources/icon.png (1024×1024)')

// Build .icns for macOS using iconutil
const iconsetDir = join(root, 'resources/icon.iconset')
mkdirSync(iconsetDir, { recursive: true })

const sizes = [16, 32, 64, 128, 256, 512, 1024]
for (const size of sizes) {
  const r = new Resvg(svgData, { fitTo: { mode: 'width', value: size } })
  const png = r.render().asPng()
  writeFileSync(join(iconsetDir, `icon_${size}x${size}.png`), png)
  // Retina versions (same file, different name)
  if (size <= 512) {
    writeFileSync(join(iconsetDir, `icon_${size/2}x${size/2}@2x.png`), png)
  }
}

execSync(`iconutil -c icns "${iconsetDir}" -o "${join(root, 'resources/icon.icns')}"`)
console.log('✓ resources/icon.icns')

// Clean up iconset dir
execSync(`rm -rf "${iconsetDir}"`)
console.log('Done.')
