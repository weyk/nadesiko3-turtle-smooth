import path from 'node:path'
import fs from 'node:fs/promises'

interface PluginComment {
  lineComments: string[]
  appendComment: string
}

type PluginComments = Map<string, PluginComment>

function getComments (text: string): PluginComments|null {
    const lines = text.split(/[\r\n]/)
    if (!lines) {
        return null
    }
    const comments = new Map<string, PluginComment>()
    try {
        let lineComments: string[] = []
        let inMeta = false
        let r: RegExpExecArray|null
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i]
            if (line.length === 0) {
                continue
            }
            if (inMeta) {
                if (/^\s*\},$/.test(line)) {
                    inMeta = false
                }
                continue
            }
            if (/^\s*'meta':\s*\{/.test(line)) {
                inMeta = true
                continue
            }
            // 見出し行
            r = /^\s*\/\/\s*@(.*)$/.exec(line)
            if (r && r.length > 1 && r[1] != null && !r[1].startsWith('ts-')) {
                lineComments.push(r[1].trim())
                continue
            }
            // 変数・定数行
            r = /^(\s*)'([^']+)'\s*:\s*\{\s*type\s*:\s*'(const|var)'\s*,\s*value\s*:\s*([^}]*)\}\s*,\s*(\/\/ @(.*))?$/.exec(line)
            if (r && r.length > 4 && r[1] != null && r[2] != null && r[3] != null && r[4] != null) {
                const name = r[2].trim()
                const desc = r[6] != null ? r[6].trim() : ''
                if (desc !== '' || lineComments.length > 0) {
                    comments.set(name, { lineComments, appendComment: desc })
                }
                lineComments = []
                continue
            }
            // 関数定義開始行
            r = /^(\s*)'([^']+)'\s*:\s*(\{|\[)\s*(\/\/\s*@(.+))?$/.exec(line)
            if (r && r.length > 1 && r[1] != null && r[2] != null) {
                const name = r[2].trim()
                let desc = ''
                if (r.length > 4 && r[4] != null) {
                    desc = r[4].trim()
                    if (desc.startsWith('// @')) {
                        desc = desc.slice(4)
                    }
                }
                if (desc !== '' || lineComments.length > 0) {
                    comments.set(name, { lineComments, appendComment: desc })
                }
                lineComments = []
                continue
            }
            lineComments = []
        }
    } catch (err) {
        console.error(err)
        return null
    }
    return comments
}

function setComments (text: string, comments: PluginComments): string|null {
    const output: string[] = []
    const lines = text.matchAll(/([^\r\n]*)(\r|\n|\r\n)/g)
    if (!lines) {
        return null
    }
    try {
        let r: RegExpExecArray|null
        let lineComments: string[] = []
        for (const [, line, lineCr] of lines) {
            let hasAppendComment = false
            let cmt:PluginComment|undefined
            if (line.length === 0) {
                output.push(lineCr)
                continue
            }
            // 見出し行
            r = /^\s*\/\/\s*@(.*)$/.exec(line)
            if (r && r.length > 1 && r[1] != null && !r[1].startsWith('ts-')) {
                lineComments.push(r[1].trim())
                output.push(line, lineCr)
                continue
            }
            // 変数・定数行
            r = /^(\s*)'([^']+)'\s*:\s*\{\s*type\s*:\s*'(const|var)'\s*,\s*value\s*:\s*([^}]*)\}\s*,\s*(\/\/ @(.*))?$/.exec(line)
            if (r && r.length > 4 && r[1] != null && r[2] != null && r[3] != null && r[4] != null) {
                const name = r[2].trim()
                const desc = r[6] != null ? r[6].trim() : ''
                if (r[5] != null) {
                    hasAppendComment = true
                }
                cmt = comments.get(name)
            }
            // 関数定義開始行
            r = /^(\s*)'([^']+)'\s*:\s*(\{|\[)\s*(\/\/\s*@(.+))?$/.exec(line)
            if (r && r.length > 1 && r[1] != null && r[2] != null) {
                const name = r[2].trim()
                if (r[4] != null) {
                    hasAppendComment = true
                }
                cmt = comments.get(name)
            }
            if (cmt) {
                const indent = /[ \u3000\t]*/.exec(line)
                const indentBlank = indent != null ? indent[0] : ''
                for (const lc of cmt.lineComments) {
                    if (!lineComments.includes(lc)) {
                        output.push(indentBlank, '// @', lc, lineCr)
                    }
                }
            }
            output.push(line)
            if (cmt && !hasAppendComment) {
                output.push(' // @', cmt.appendComment)
            }
            output.push(lineCr)
            lineComments = []
        }
    } catch (err) {
        console.error(err)
        return null
    }
    return output.join('')
}

async function copyComments (sourcefile: string, targetfile: string, outfile: string): Promise<boolean> {
    const intext = await fs.readFile(sourcefile, { encoding: 'utf-8' })
    const comments = getComments(intext)
    if (comments == null) {
        return false
    }
    const text = await fs.readFile(targetfile, { encoding: 'utf-8' })
    const outtext = setComments(text, comments)
    if (outtext == null) {
        return false
    }
    fs.writeFile(outfile, outtext, { encoding: 'utf-8' })
    return true
}

async function main () {
    const infile = path.resolve(path.join('src', 'plugin_turtle_smooth.ts'))
    const tgtfile = path.resolve(path.join('tmp', 'plugin_turtle_smooth.js'))
    const outfile = path.resolve(path.join('lib', 'plugin_turtle_smooth.js'))
    await copyComments(infile, tgtfile, outfile)
}

await main()
