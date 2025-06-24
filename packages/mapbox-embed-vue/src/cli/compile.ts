#!/usr/bin/env node
import { Buffer } from 'node:buffer'
import fs from 'node:fs'
import path from 'node:path'
import AdmZip from 'adm-zip'
import packageJson from '../../package.json' with { type: 'json' }

const componentPath = '../mapbox-embed-vue'

const srcPath = path.join(componentPath, 'src')
const outputPath = path.join('./exports')

if (!fs.existsSync(outputPath)) {
  fs.mkdirSync(outputPath)
}

const zip = new AdmZip()

const output = path.join(outputPath, 'mapbox-embed-vue.zip')

// archive src directory
zip.addLocalFolder(srcPath, 'src')
zip.deleteFile('src/cli')
zip.deleteFile('cli.ts')

// remove unneeded data from package.json and write to archive
const { packageManager, exports, main, module, bin, files, scripts, ...config } = packageJson
zip.addFile('package.json', Buffer.from(JSON.stringify(config, null, 2), 'utf8'))

zip.writeZip(output)
