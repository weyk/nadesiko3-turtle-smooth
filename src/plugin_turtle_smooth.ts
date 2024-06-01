/**
 * smooth Turtle Graphics for Web browser (nadesiko3)
 * plugin_turtle_promise.ts
 */
// import { turtleImage, elephantImage, pandaImage } from 'nadesiko3/src/plugin_turtle_images.mjs'

import type { NakoSystem as NakoSystemBase } from 'nadesiko3core/src/plugin_api.mjs'

const turtleImageURL = 'https://n3s.nadesi.com/image.php?f=64.png'
const elephantImageURL = ''
const pandaImageURL = ''

declare global {
    interface Navigator {
        nako3: { addPluginObject: (name: string, obj: object) => void }
    }
}

interface NakoSystem extends NakoSystemBase {
    tags: { turtlesmooth?: TurtleSmoothSystem }
}

type CallbackType<T> = (a:T) => void
type NumericArray2 = [ number, number ]
type NakoRumtimeName = 'wnako'|'cnako'
interface NakoVariables {
    type: 'const'|'var'
    value: any
}
interface NakoFunction {
    type: 'func'
    josi: []|string[][]
    asyncFn?: boolean
    pure?: boolean
    fn: any
    return_none?: boolean
}
interface NakoMeta {
    type: 'const'
    value: {
        pluginName: string
        description: string
        pluginVersion: string
        nakoRuntime: NakoRumtimeName[]
        nakoVersion: string
    }
}
interface NakoPluginObject {
  [ index: string]: NakoVariables|NakoFunction|NakoMeta
}

class TurtleSmooth {
    sys: NakoSystem
    id: number
    img: null|HTMLImageElement
    canvas: null|HTMLCanvasElement
    ctx: null|CanvasRenderingContext2D
    dir: number
    cx: number
    cy: number
    x: number
    y: number
    color: string
    lineWidth: number
    spdRotate: number
    spdMove: number
    spdForward: number
    spdBackward: number
    flagDown: boolean
    flagBegeinPath: boolean
    f_update: boolean
    flagLoaded: boolean
    f_visible: boolean
    mlist: any[]
    jobType: string
    substeps: any[]
    substepType: string

    substepBase: number|NumericArray2
    substepModifier: number
    substepTarget: number
    substepRemain: number
    stepWait: number
    step: null|(() => void)
    jobResolve: null|((result:number) => void)

    constructor (sys: NakoSystem, id: number) {
        this.sys = sys
        this.id = id
        this.img = null
        this.canvas = null
        this.ctx = null
        this.dir = 270 // 上向き
        this.cx = 32
        this.cy = 32
        this.x = 0
        this.y = 0
        this.color = 'black'
        this.lineWidth = 4

        this.spdRotate = 15 / 100
        this.spdMove = 10 / 100
        this.spdForward = 10 / 100
        this.spdBackward = 8 / 100

        this.flagDown = true
        this.flagBegeinPath = false
        this.f_update = true
        this.flagLoaded = false
        this.f_visible = true
        this.mlist = []

        this.jobType = ''
        this.substeps = []
        this.substepType = ''

        this.substepBase = 0
        this.substepModifier = 0
        this.substepTarget = 0
        this.substepRemain = 0
        this.stepWait = 0
        this.step = null
        this.jobResolve = null
    }

    clear ():void {
        // 未実行の全JOBに対してresolve(1)を呼び出す。
        for (const job of this.mlist) {
            const resolve = job[0][0]
            if (resolve !== null) {
                resolve(1)
            }
        }
        this.mlist = [] // ジョブをクリア
        if (this.canvas) {
            document.body.removeChild(this.canvas)
        }
    }

    loadImage (url: string, callback: (tt:TurtleSmooth) => void):void {
        this.canvas = document.createElement('canvas')
        this.ctx = this.canvas.getContext('2d')
        this.canvas.id = this.id.toString()
        this.img = document.createElement('img')
        this.img.onload = () => {
            this.cx = this.img!.width / 2
            this.cy = this.img!.height / 2
            // 回転中は対角線の長さ分が必要になる可能性がある
            this.canvas!.width = this.img!.width * 1.5
            this.canvas!.height = this.img!.height * 1.5
            this.flagLoaded = true
            this.f_update = true
            this.canvas!.style.position = 'absolute'
            document.body.appendChild(this.canvas!)
            // console.log('createTurtle::this.turtles=', this)
            callback(this)
        }
        this.img.onerror = () => {
            console.log('カメの読み込みに失敗')
            this.flagLoaded = true
            this.f_visible = false
            this.f_update = true
            callback(this)
        }
        this.img.src = url
    }
}

class TurtleSmoothSystem {
    private static instance: TurtleSmoothSystem
    private instanceCount: number
    sys: NakoSystem
    target: number
    canvas: null|HTMLCanvasElement
    ctx: null|CanvasRenderingContext2D
    canvas_r: { left: number, top: number, width: number, height: number, visible: boolean}
    flagSetTimer: boolean
    fid: number
    lastStart: number
    turtles: TurtleSmooth[]
    static getInstance (sys: NakoSystem): TurtleSmoothSystem {
        if (TurtleSmoothSystem.instance === undefined) {
            TurtleSmoothSystem.instance = new TurtleSmoothSystem(sys)
        }
        const i = TurtleSmoothSystem.instance
        i.instanceCount += 1
        return TurtleSmoothSystem.instance
    }

    constructor (sys: NakoSystem) {
        this.sys = sys
        this.turtles = [] // カメの一覧
        this.target = -1
        this.ctx = null
        this.canvas = null
        this.canvas_r = { left: 0, top: 0, width: 640, height: 400, visible: false }
        this.flagSetTimer = false
        this.instanceCount = 0
        this.lastStart = 0
        this.fid = -1
    }

    clearAll ():void {
        // console.log('カメ全消去 turtles=', this.turtles)
        for (const tt of this.turtles) {
            tt.clear()
        }
        this.turtles = []
        if (this.canvas !== null && this.ctx !== null) {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
        }
        this.target = -1
        this.flagSetTimer = false
        if (this.fid !== -1) {
            cancelAnimationFrame(this.fid)
        }
        this.lastStart = 0
        this.fid = -1
    }

    drawTurtle (id: number):void {
        const tt = this.turtles[id]
        if (!tt || !tt.canvas || !tt.ctx || !tt.img) {
            return
        }
        const cr = this.canvas_r
        if (!cr.visible) {
            return
        }
        // カメの位置を移動
        tt.canvas.style.left = (cr.left + tt.x - tt.cx) + 'px'
        tt.canvas.style.top = (cr.top + tt.y - tt.cx) + 'px'
        if (!tt.f_update) {
            return
        }
        /* istanbul ignore if */
        if (!tt.flagLoaded) {
            return
        }
        tt.f_update = false
        tt.ctx.clearRect(0, 0, tt.canvas.width, tt.canvas.height)
        if (!tt.f_visible) {
            return
        }
        if (tt.dir !== 270) {
            const rad = (tt.dir + 90) * 0.017453292519943295
            tt.ctx.save()
            tt.ctx.translate(tt.cx, tt.cy)
            tt.ctx.rotate(rad)
            tt.ctx.translate(-(tt.img.width / 2), -(tt.img.height / 2))
            tt.ctx.drawImage(tt.img, 0, 0)
            tt.ctx.restore()
        } else {
            tt.ctx.drawImage(tt.img, tt.cx - (tt.img.width / 2), tt.cy - (tt.img.height / 2))
        }
    }

    getCur ():TurtleSmooth {
        if (this.turtles.length === 0) {
            throw Error('最初に『カメ作成』命令を呼び出してください。')
        }
        return this.turtles[this.target]
    }

    setTimer ():void {
        // コマンド設定後、1度だけこの関数を呼び出す
        if (this.flagSetTimer) {
            return
        }
        this.flagSetTimer = true
        this.play(0)
    }

    line (tt: TurtleSmooth, x1: number, y1: number, x2: number, y2: number):void {
        /* istanbul ignore else */
        if (!tt.flagDown) {
            return
        }
        const ctx = this.ctx
        if (!ctx) {
            return
        }
        if (tt.flagBegeinPath) {
            ctx.lineTo(x2, y2)
        } else {
            ctx.beginPath()
            ctx.lineWidth = tt.lineWidth
            ctx.strokeStyle = tt.color
            ctx.moveTo(x1, y1)
            ctx.lineTo(x2, y2)
            ctx.stroke()
        }
    }

    clearTemporaryLine (tt: TurtleSmooth):void {
    }

    addMacro (command: any): Promise<number> {
        const tt = this.getCur()
        return new Promise((resolve, reject) => {
            const cmd = [[resolve, reject], command]
            tt.mlist.push(cmd)
            this.setTimer()
        })
    }

    doMacro (tt: TurtleSmooth, time: number, defaultWait: number, waitForTurteImage: boolean): boolean {
        if (!tt.flagLoaded && waitForTurteImage) {
            // console.log('[TURTLE] waiting ...')
            return true
        }
        const immediateRun = defaultWait === 0
        // 以下の２つの条件を満たしている間ループする。
        // 即時実行であるか、即時実行ではない場合は経過時間の残りがあること。
        // 未処理のJOBが残っているか、処理中のJOBがあること。
        while ((time > 0 || immediateRun) && (tt.mlist.length > 0 || tt.jobType !== '')) {
            if (tt.jobType === 'substep') {
                if (tt.substepType === '') {
                // 処理中のサブステップは無いので次のサブステップに着手する
                    if (tt.substeps.length > 0) {
                        const sa = tt.substeps.shift()
                        const subcmd = (sa !== undefined) ? sa[0] : ''
                        switch (subcmd) {
                        case 'turn': {
                            tt.substepType = 'turn'
                            tt.substepBase = tt.dir
                            tt.substepModifier = 0
                            tt.substepTarget = sa[1]
                            tt.substepRemain = Math.abs(sa[1])
                            break
                        }
                        case 'move': {
                            tt.substepType = 'move'
                            tt.substepBase = [tt.x, tt.y]
                            tt.substepModifier = sa[2]
                            tt.substepTarget = sa[1]
                            tt.substepRemain = Math.abs(sa[1])
                            break
                        }
                        }
                    } else {
                        // 残りのサブステップは無いのでJOBの完了処理としてステップの処理を予約する
                        tt.jobType = 'step'
                        tt.stepWait = 0
                    }
                } else {
                    switch (tt.substepType) {
                    case 'turn': {
                        if (typeof tt.substepBase === 'number') {
                            if (tt.spdRotate <= 0 || time * tt.spdRotate >= tt.substepRemain) {
                                if (tt.spdRotate > 0) {
                                    time -= Math.floor(tt.substepRemain / tt.spdRotate)
                                }
                                tt.substepRemain = 0
                                tt.dir = (tt.substepBase + (tt.substepTarget % 360) + 360) % 360
                                tt.substepType = ''
                            } else {
                                const delta = time * tt.spdRotate
                                const direction = tt.substepTarget > 0 ? 1 : -1
                                tt.substepRemain -= delta
                                tt.dir = (tt.dir + (delta * direction % 360) + 360) % 360
                                time = 0
                            }
                        }
                        tt.f_update = true
                        break
                    }
                    case 'move': {
                        if (typeof tt.substepBase !== 'number') {
                            if (tt.spdMove <= 0 || time * tt.spdMove >= tt.substepRemain) {
                                if (tt.spdMove > 0) {
                                    time -= Math.floor(tt.substepRemain / tt.spdMove)
                                }
                                tt.substepRemain = 0
                                const deg = (tt.dir + tt.substepModifier) % 360
                                const rad = deg * 0.017453292519943295
                                const vp = tt.substepTarget
                                const x2 = tt.substepBase[0] + Math.cos(rad) * vp
                                const y2 = tt.substepBase[1] + Math.sin(rad) * vp
                                this.line(tt, tt.x, tt.y, x2, y2)
                                tt.x = x2
                                tt.y = y2
                                tt.substepType = ''
                            } else {
                                const delta = time * tt.spdMove
                                const direction = tt.substepTarget > 0 ? 1 : -1
                                tt.substepRemain -= delta
                                const deg = (tt.dir + tt.substepModifier) % 360
                                const rad = deg * 0.017453292519943295
                                const vp = delta * direction
                                const x2 = tt.x + Math.cos(rad) * vp
                                const y2 = tt.y + Math.sin(rad) * vp
                                this.line(tt, tt.x, tt.y, x2, y2)
                                tt.x = x2
                                tt.y = y2
                                time = 0
                            }
                        }
                        tt.f_update = true
                        break
                    }
                    }
                }
            } else
                if (tt.jobType === 'step') {
                    // ステップの処理をチェック・実行する
                    if (time >= tt.stepWait || immediateRun) {
                        // ステップ待ち時間に到達したか、即時実行が有効となっている。
                        // 経過時間からステップ待ち時間を減算する。
                        time -= tt.stepWait
                        tt.stepWait = 0
                        // ステップ完了処理があるなら呼び出す。
                        if (tt.step) {
                            tt.step()
                        }
                        tt.jobType = ''
                        tt.step = null
                        if (tt.flagLoaded) { this.drawTurtle(tt.id) }
                        if (tt.jobResolve != null) {
                            tt.jobResolve(0)
                        }
                    } else {
                        // ステップ待ち時間に到達していない。
                        // 残りのステップ待ち時間から経過時間を減らして次へ。
                        tt.stepWait -= time
                        time = 0
                    }
                } else
                    if (tt.jobType === '') {
                        // 処理中のJOBは無いので次のJOBを取得して処理に着手する
                        const ma = tt.mlist.shift()
                        const resolve: (result: any) => void = ma[0][0]
                        const reject: (reason: any) => void = ma[0][1]
                        const m = ma[1]
                        const cmd: string = (m !== undefined) ? m[0] : ''
                        switch (cmd) {
                        case 'xy':
                            // 起点を移動する
                            tt.jobType = 'step'
                            tt.stepWait = defaultWait
                            tt.jobResolve = resolve
                            tt.step = (function (tt, x, y) {
                                return function () {
                                    tt.x = x
                                    tt.y = y
                                }
                            })(tt, m[1], m[2])
                            break
                        case 'begin':
                            // 描画を明示的に開始する
                            tt.jobType = 'step'
                            tt.stepWait = defaultWait
                            tt.jobResolve = resolve
                            tt.step = (function (tt, ctx) {
                                return function () {
                                    if (ctx) {
                                        ctx.beginPath()
                                        ctx.moveTo(tt.x, tt.y)
                                    }
                                    tt.flagBegeinPath = true
                                }
                            })(tt, this.ctx)
                            break
                        case 'close':
                            // パスを閉じる
                            tt.jobType = 'step'
                            tt.stepWait = defaultWait
                            tt.jobResolve = resolve
                            tt.step = (function (tt, ctx) {
                                return function () {
                                    if (ctx) {
                                        ctx.closePath()
                                    }
                                    tt.flagBegeinPath = false
                                }
                            })(tt, this.ctx)
                            break
                        case 'fill':
                            tt.jobType = 'step'
                            tt.stepWait = defaultWait
                            tt.jobResolve = resolve
                            tt.step = (function (tt, ctx) {
                                return function () {
                                    if (tt.flagBegeinPath) {
                                        if (ctx) {
                                            ctx.closePath()
                                        }
                                        tt.flagBegeinPath = false
                                    }
                                    if (ctx) {
                                        ctx.fill()
                                    }
                                }
                            })(tt, this.ctx)
                            break
                        case 'stroke':
                            tt.jobType = 'step'
                            tt.stepWait = defaultWait
                            tt.jobResolve = resolve
                            tt.step = (function (tt, ctx) {
                                return function () {
                                    if (tt.flagBegeinPath) {
                                        if (ctx) {
                                            ctx.closePath()
                                        }
                                        tt.flagBegeinPath = false
                                    }
                                    if (ctx) {
                                        ctx.stroke()
                                    }
                                }
                            })(tt, this.ctx)
                            break
                        case 'text':
                            tt.jobType = 'step'
                            tt.stepWait = defaultWait
                            tt.jobResolve = resolve
                            tt.step = (function (tt, ctx, text) {
                                return function () {
                                    if (ctx) {
                                        ctx.fillText(text, tt.x, tt.y)
                                    }
                                }
                            })(tt, this.ctx, m[1])
                            break
                        case 'textset':
                            tt.jobType = 'step'
                            tt.stepWait = defaultWait
                            tt.jobResolve = resolve
                            tt.step = (function (ctx, font) {
                                return function () {
                                    if (ctx) {
                                        ctx.font = m[1]
                                    }
                                }
                            })(this.ctx, m[1])
                            break
                        case 'fillStyle':
                            tt.jobType = 'step'
                            tt.stepWait = defaultWait
                            tt.jobResolve = resolve
                            tt.step = (function (ctx, style) {
                                return function () {
                                    if (ctx) {
                                        ctx.fillStyle = style
                                    }
                                }
                            })(this.ctx, m[1])
                            break
                        case 'mv': {
                            tt.jobType = 'substep'
                            // 引数を取り出す
                            const x2 = m[1]
                            const y2 = m[2]
                            // カメの角度を算出
                            const dx = x2 - tt.x
                            const dy = y2 - tt.y
                            const angleRad = Math.atan2(dy, dx)
                            const angle = angleRad * 57.29577951308232
                            const targetdir = (angle + 360) % 360
                            let deg = (targetdir - tt.dir + 360) % 360
                            if (deg > 180) {
                                deg = deg - 360
                            }
                            // カメの移動距離を算出
                            const fdv = Math.sqrt(dx * dx + dy * dy)
                            if (tt.spdRotate > 0 || tt.spdMove > 0) {
                                tt.jobType = 'substep'
                                tt.substeps.push(['turn', deg])
                                tt.substeps.push(['move', fdv, 0])
                            } else {
                                tt.jobType = 'step'
                                tt.stepWait = defaultWait
                            }
                            tt.jobResolve = resolve
                            tt.step = (function (tt, dir, x1, y1, deg, x2, y2, turtlesmooth) {
                                return function () {
                                // 線を引く
                                    turtlesmooth.line(tt, tt.x, tt.y, x2, y2)
                                    // カメの角度を変更
                                    tt.dir = (dir + deg + 360) % 360
                                    // 実際に位置を移動
                                    tt.x = x2
                                    tt.y = y2
                                    tt.f_update = true
                                }
                            })(tt, tt.dir, tt.x, tt.y, deg, x2, y2, this)
                            break
                        }
                        case 'directmv': {
                            tt.jobType = 'step'
                            tt.stepWait = defaultWait
                            tt.jobResolve = resolve
                            tt.step = (function (tt, turtlesmooth) {
                                return function () {
                                // 線を引く
                                    turtlesmooth.line(tt, tt.x, tt.y, m[1], m[2])
                                    // カメの角度を変更
                                    const mvRad = Math.atan2(m[2] - tt.y, m[1] - tt.x)
                                    tt.dir = mvRad * 57.29577951308232
                                    tt.f_update = true
                                    // 実際に位置を移動
                                    tt.x = m[1]
                                    tt.y = m[2]
                                }
                            })(tt, this)
                            break
                        }
                        case 'fd': {
                            const fdv = m[1] * m[2]
                            const rad = tt.dir * 0.017453292519943295
                            const x2 = tt.x + Math.cos(rad) * fdv
                            const y2 = tt.y + Math.sin(rad) * fdv
                            if (tt.spdMove > 0) {
                                tt.jobType = 'substep'
                                tt.substeps.push(['move', fdv, 0])
                            } else {
                                tt.jobType = 'step'
                                tt.stepWait = defaultWait
                            }
                            tt.jobResolve = resolve
                            tt.step = (function (tt, x1, y1, x2, y2, turtlesmooth) {
                                return function () {
                                    turtlesmooth.clearTemporaryLine(tt)
                                    turtlesmooth.line(tt, tt.x, tt.y, x2, y2)
                                    tt.x = x2
                                    tt.y = y2
                                }
                            })(tt, tt.x, tt.y, x2, y2, this)
                            break
                        }
                        case 'angle': {
                            tt.jobType = 'substep'
                            const angle = m[1]
                            const targetdir = (((angle - 90) % 360) + 360) % 360
                            let deg = (targetdir - tt.dir + 360) % 360
                            if (deg > 180) {
                                deg = deg - 360
                            }
                            if (tt.spdRotate > 0) {
                                tt.jobType = 'substep'
                                tt.substeps.push(['turn', deg])
                            } else {
                                tt.jobType = 'step'
                                tt.stepWait = defaultWait
                            }
                            tt.jobResolve = resolve
                            tt.step = (function (tt, dir, deg) {
                                return function () {
                                    tt.dir = (dir + (deg % 360) + 360) % 360
                                    tt.f_update = true
                                }
                            })(tt, tt.dir, deg)
                            break
                        }
                        case 'directangle': {
                            tt.jobType = 'step'
                            tt.stepWait = defaultWait
                            tt.jobResolve = resolve
                            tt.step = (function (tt, angle) {
                                return function () {
                                    tt.dir = ((angle - 90 % 360) + 360) % 360
                                    tt.f_update = true
                                }
                            })(tt, m[1])
                            break
                        }
                        case 'rot': {
                            const deg = m[1] * m[2]
                            if (tt.spdRotate > 0) {
                                tt.jobType = 'substep'
                                tt.substeps.push(['turn', deg])
                            } else {
                                tt.jobType = 'step'
                                tt.stepWait = defaultWait
                            }
                            tt.jobResolve = resolve
                            tt.step = (function (tt, dir, deg) {
                                return function () {
                                    tt.dir = (dir + (deg % 360) + 360) % 360
                                    tt.f_update = true
                                }
                            })(tt, tt.dir, deg)
                            break
                        }
                        case 'color':
                            tt.jobType = 'step'
                            tt.stepWait = defaultWait
                            tt.jobResolve = resolve
                            tt.step = (function (tt, ctx, c) {
                                return function () {
                                    tt.color = c
                                    if (ctx) {
                                        ctx.strokeStyle = tt.color
                                    }
                                }
                            })(tt, this.ctx, m[1])
                            break
                        case 'size':
                            tt.jobType = 'step'
                            tt.stepWait = defaultWait
                            tt.jobResolve = resolve
                            tt.step = (function (tt, ctx, w) {
                                return function () {
                                    tt.lineWidth = w
                                    if (ctx) {
                                        ctx.lineWidth = tt.lineWidth
                                    }
                                }
                            })(tt, this.ctx, m[1])
                            break
                        case 'penOn':
                            tt.jobType = 'step'
                            tt.stepWait = defaultWait
                            tt.jobResolve = resolve
                            tt.step = (function (tt, pen) {
                                return function () {
                                    tt.flagDown = pen
                                }
                            })(tt, m[1])
                            break
                        case 'spdR':
                            tt.jobType = 'step'
                            tt.stepWait = defaultWait
                            tt.jobResolve = resolve
                            tt.step = (function (tt, spd) {
                                return function () {
                                    tt.spdRotate = spd
                                }
                            })(tt, m[1])
                            break
                        case 'spdM':
                            tt.jobType = 'step'
                            tt.stepWait = defaultWait
                            tt.jobResolve = resolve
                            tt.step = (function (tt, spd) {
                                return function () {
                                    tt.spdMove = spd
                                }
                            })(tt, m[1])
                            break
                        case 'visible':
                            tt.jobType = 'step'
                            tt.stepWait = defaultWait
                            tt.jobResolve = resolve
                            tt.step = (function (tt, v) {
                                return function () {
                                    tt.f_visible = v
                                    tt.f_update = true
                                }
                            })(tt, m[1])
                            break
                        case 'changeImage':
                            if (tt.img) {
                                tt.flagLoaded = false
                                tt.img.src = m[1]
                            }
                            tt.jobType = 'step'
                            tt.stepWait = defaultWait
                            tt.jobResolve = resolve
                            tt.step = function () {}
                            break
                        }
                    }
            if (tt.flagLoaded) { this.drawTurtle(tt.id) }
        }
        return (tt.mlist.length > 0 || tt.jobType !== '')
    }

    doMacroAll (time: number, defaultWait: number, waitForTurteImage: boolean):boolean {
        let hasNext = false
        for (const tt of this.turtles) {
            hasNext = this.doMacro(tt, time, defaultWait, waitForTurteImage) || hasNext
        }
        return hasNext
    }

    play (timestamp: number):void {
        if (this.lastStart === 0) {
            this.lastStart = timestamp
            this.fid = requestAnimationFrame((timestamp) => this.play(timestamp))
            return
        }
        let time = timestamp - this.lastStart
        if (time <= 0) {
            time = 1
        }
        this.lastStart = timestamp

        const wait = this.sys.__getSysVar('カメ速度')
        if (wait <= 0) {
            // 待ち時間なしで全部実行
            let hasNext = true
            while (hasNext) {
                hasNext = this.doMacroAll(0, 0, false)
            }
        } else {
            // 一つずつ実行
            const waitForTurteImage = wait > 0

            const hasNext = this.doMacroAll(time, wait, waitForTurteImage)
            if (hasNext) {
                this.fid = requestAnimationFrame((timestamp) => this.play(timestamp))
                return
            }
        }
        console.log('[TURTLE] finished.')
        this.flagSetTimer = false
    }

    setupCanvas ():void {
        // 描画先をセットする
        let canvasId: null|string|HTMLCanvasElement|Element = this.sys.__getSysVar('カメ描画先')
        if (typeof canvasId === 'string') {
            canvasId = document.getElementById(canvasId) || document.querySelector(canvasId)
            if (canvasId instanceof HTMLCanvasElement) {
                this.sys.__setSysVar('カメ描画先', canvasId)
            }
        }
        console.log('カメ描画先=', canvasId)
        if (!(canvasId instanceof HTMLCanvasElement)) {
            console.log('[ERROR] カメ描画先が見当たりません。' + canvasId)
            throw Error('カメ描画先が見当たりません。')
        }
        const cv = this.canvas = canvasId
        const ctx = this.ctx = cv.getContext('2d')
        if (!ctx) {
            console.log('[ERROR] カメ画像のコンテキストが作成できません。' + canvasId)
            throw Error('カメ画像のコンテキストが作成できません。')
        }
        ctx.lineWidth = 4
        ctx.strokeStyle = 'black'
        ctx.lineCap = 'round'
        this.resizeCanvas()
    }

    resizeCanvas ():void {
        const cv = this.canvas
        if (!cv) { return }
        let rect:{left:number, top:number, width:number, height: number}
        try {
            rect = cv.getBoundingClientRect()
        } catch (e) {
            rect = { left: 0, top: 0, width: 0, height: 0 }
        }
        const rx = rect.left + window.scrollX
        const ry = rect.top + window.scrollY
        this.canvas_r = {
            'visible': (rect.width !== 0 && rect.height !== 0),
            'left': rx,
            'top': ry,
            width: cv.width,
            height: cv.height
        }
    }

    createTurtle (imageUrl: string): number {
        // キャンバス情報は毎回参照する (#734)
        this.setupCanvas()
        // カメの情報をリストに追加
        const id = this.turtles.length
        const tt = new TurtleSmooth(this.sys, id)
        this.turtles.push(tt)
        this.target = id
        // 画像を読み込む
        tt.loadImage(imageUrl, (tt) => {
            this.drawTurtle(tt.id)
            console.log(`tutrle.onload(id=${tt.id})`)
        })
        // デフォルト位置(中央)の設定
        tt.x = this.canvas_r.width / 2
        tt.y = this.canvas_r.height / 2
        return id
    }

    static getTurtleSmooth (sys: NakoSystem): TurtleSmoothSystem {
        if (!sys.tags.turtlesmooth) {
            throw new Error('プラグインの初期化が行われていません')
        }
        return sys.tags.turtlesmooth
    }
}

const PluginTurtleSmooth: NakoPluginObject = {
    'meta': {
        type: 'const',
        value: {
            pluginName: 'plugin_turtle_smooth', // プラグインの名前
            description: 'スムースタートルグラフィックス用のプラグイン', // 説明
            pluginVersion: '3.6.0', // プラグインのバージョン
            nakoRuntime: ['wnako'], // 対象ランタイム
            nakoVersion: '3.6.3' // 要求なでしこバージョン
        }
    },
    '初期化': {
        type: 'func',
        josi: [],
        pure: true,
        fn: function (sys: NakoSystem):void {
            const turtleSystem = TurtleSmoothSystem.getInstance(sys)
            sys.tags.turtlesmooth = turtleSystem
        }
    },
    '!クリア': {
        type: 'func',
        josi: [],
        pure: true,
        fn: function (sys: NakoSystem):void {
            if (sys.tags.turtlesmooth) {
                sys.tags.turtlesmooth.clearAll()
            }
        }
    },
    // @タートルグラフィックス・カメ描画
    'カメ作成': { // @タートルグラフィックスを開始してカメのIDを返す // @かめさくせい
        type: 'func',
        josi: [],
        pure: true,
        fn: function (sys: NakoSystem): number {
            const turtlesmooth = TurtleSmoothSystem.getTurtleSmooth(sys)
            const imageUrl = sys.__getSysVar('カメ画像URL')
            return turtlesmooth.createTurtle(imageUrl)
        }
    },
    'ゾウ作成': { // @ゾウの画像でタートルグラフィックスを開始してIDを返す // @ぞうさくせい
        type: 'func',
        josi: [],
        pure: true,
        fn: function (sys: NakoSystem): number {
            const turtlesmooth = TurtleSmoothSystem.getTurtleSmooth(sys)
            const imageUrl = elephantImageURL
            return turtlesmooth.createTurtle(imageUrl)
        }
    },
    'パンダ作成': { // @パンダの画像でタートルグラフィックスを開始してIDを返す // @ぱんださくせい
        type: 'func',
        josi: [],
        pure: true,
        fn: function (sys: NakoSystem): number {
            const turtlesmooth = TurtleSmoothSystem.getTurtleSmooth(sys)
            const imageUrl = pandaImageURL
            return turtlesmooth.createTurtle(imageUrl)
        }
    },
    'カメ操作対象設定': { // @IDを指定して操作対象となるカメを変更する // @かめそうさたいしょうせってい
        type: 'func',
        josi: [['に', 'へ', 'の']],
        pure: true,
        fn: function (id: number, sys: NakoSystem):void {
            const turtlesmooth = TurtleSmoothSystem.getTurtleSmooth(sys)
            turtlesmooth.target = id
        }
    },
    'カメ描画先': { type: 'var', value: '#turtle_cv' }, // @かめびょうがさき
    'カメ画像URL': { type: 'var', value: turtleImageURL }, // @かめがぞうURL
    'カメ画像変更': { // @カメの画像をURLに変更する // @かめがぞうへんこう
        type: 'func',
        josi: [['に', 'へ']],
        pure: true,
        fn: function (url: string, sys: NakoSystem): Promise<number> {
            const turtlesmooth = TurtleSmoothSystem.getTurtleSmooth(sys)
            return turtlesmooth.addMacro(['changeImage', url])
        }
    },
    'カメ速度': { type: 'const', value: 100 }, // @かめそくど
    'カメ速度設定': { // @カメの動作速度vに設定(大きいほど遅い) // @かめそくどせってい
        type: 'func',
        josi: [['に', 'へ']],
        pure: true,
        fn: function (v: number|string, sys: NakoSystem):void {
            sys.__setSysVar('カメ速度', v)
        },
        return_none: true
    },
    'カメ移動': { // @カメの位置を[x,y]へ移動する // @かめいどう
        type: 'func',
        josi: [['に', 'へ']],
        pure: true,
        fn: function (xy: NumericArray2, sys: NakoSystem): Promise<number> {
            const turtlesmooth = TurtleSmoothSystem.getTurtleSmooth(sys)
            return turtlesmooth.addMacro(['mv', xy[0], xy[1]])
        }
    },
    'カメ起点移動': { // @カメの描画起点位置を[x,y]へ移動する // @かめきてんいどう
        type: 'func',
        josi: [['に', 'へ']],
        pure: true,
        fn: function (xy: NumericArray2, sys: NakoSystem): Promise<number> {
            const turtlesmooth = TurtleSmoothSystem.getTurtleSmooth(sys)
            return turtlesmooth.addMacro(['xy', xy[0], xy[1]])
        }
    },
    'カメ進': { // @カメの位置をVだけ進める // @かめすすむ
        type: 'func',
        josi: [['だけ']],
        pure: true,
        fn: function (v: number|string, sys: NakoSystem): Promise<number> {
            const turtlesmooth = TurtleSmoothSystem.getTurtleSmooth(sys)
            if (typeof v === 'string') { v = parseFloat(v) }
            return turtlesmooth.addMacro(['fd', v, 1])
        }
    },
    'カメ戻': { // @カメの位置をVだけ戻す // @かめもどる
        type: 'func',
        josi: [['だけ']],
        pure: true,
        fn: function (v: number|string, sys: NakoSystem): Promise<number> {
            const turtlesmooth = TurtleSmoothSystem.getTurtleSmooth(sys)
            if (typeof v === 'string') { v = parseFloat(v) }
            return turtlesmooth.addMacro(['fd', v, -1])
        }
    },
    'カメ角度設定': { // @カメの向きをDEGに設定する // @かめかくどせってい
        type: 'func',
        josi: [['に', 'へ', 'の']],
        pure: true,
        fn: function (deg: number|string, sys: NakoSystem): Promise<number> {
            const turtlesmooth = TurtleSmoothSystem.getTurtleSmooth(sys)
            if (typeof deg === 'string') { deg = parseFloat(deg) }
            return turtlesmooth.addMacro(['angle', deg])
        }
    },
    'カメ右回転': { // @カメの向きをDEGだけ右に向ける // @かめみぎかいてん
        type: 'func',
        josi: [['だけ']],
        pure: true,
        fn: function (deg: number|string, sys: NakoSystem): Promise<number> {
            const turtlesmooth = TurtleSmoothSystem.getTurtleSmooth(sys)
            if (typeof deg === 'string') { deg = parseFloat(deg) }
            return turtlesmooth.addMacro(['rot', deg, 1])
        }
    },
    'カメ左回転': { // @カメの向きをDEGだけ左に向ける // @かめひだりかいてん
        type: 'func',
        josi: [['だけ']],
        pure: true,
        fn: function (deg: number|string, sys: NakoSystem): Promise<number> {
            const turtlesmooth = TurtleSmoothSystem.getTurtleSmooth(sys)
            if (typeof deg === 'string') { deg = parseFloat(deg) }
            return turtlesmooth.addMacro(['rot', deg, -1])
        }
    },
    'カメペン色設定': { // @カメのペン描画色をCに設定する // @かめぺんいろせってい
        type: 'func',
        josi: [['に', 'へ']],
        pure: true,
        fn: function (c: number|string, sys: NakoSystem): Promise<number> {
            const turtlesmooth = TurtleSmoothSystem.getTurtleSmooth(sys)
            return turtlesmooth.addMacro(['color', c])
        }
    },
    'カメペンサイズ設定': { // @カメペンのサイズをWに設定する // @かめぺんさいずせってい
        type: 'func',
        josi: [['に', 'へ']],
        pure: true,
        fn: function (w: number|string, sys: NakoSystem): Promise<number> {
            const turtlesmooth = TurtleSmoothSystem.getTurtleSmooth(sys)
            return turtlesmooth.addMacro(['size', w])
        }
    },
    'カメペン設定': { // @カメペンを使うかどうかをV(オン/オフ)に設定する // @かめぺんせってい
        type: 'func',
        josi: [['に', 'へ']],
        pure: true,
        fn: function (v: boolean|number|string, sys: NakoSystem): Promise<number> {
            const turtlesmooth = TurtleSmoothSystem.getTurtleSmooth(sys)
            return turtlesmooth.addMacro(['penOn', v])
        }
    },
    'カメパス開始': { // @カメで明示的にパスの描画を開始する // @かめぱすかいし
        type: 'func',
        josi: [],
        pure: true,
        fn: function (sys: NakoSystem): Promise<number> {
            const turtlesmooth = TurtleSmoothSystem.getTurtleSmooth(sys)
            return turtlesmooth.addMacro(['begin'])
        }
    },
    'カメパス閉': { // @カメでパスを明示的に閉じる(省略可能) // @かめぱすとじる
        type: 'func',
        josi: [],
        pure: true,
        fn: function (sys: NakoSystem): Promise<number> {
            const turtlesmooth = TurtleSmoothSystem.getTurtleSmooth(sys)
            return turtlesmooth.addMacro(['close'])
        }
    },
    'カメパス線引': { // @カメでパスを閉じて、カメペン色設定で指定した色で枠線を引く // @かめぱすせんひく
        type: 'func',
        josi: [],
        pure: true,
        fn: function (sys: NakoSystem): Promise<number> {
            const turtlesmooth = TurtleSmoothSystem.getTurtleSmooth(sys)
            return turtlesmooth.addMacro(['stroke'])
        }
    },
    'カメパス塗': { // @カメでパスを閉じて、カメ塗り色設定で指定した色で塗りつぶす // @かめぱすぬる
        type: 'func',
        josi: [],
        pure: true,
        fn: function (sys: NakoSystem): Promise<number> {
            const turtlesmooth = TurtleSmoothSystem.getTurtleSmooth(sys)
            return turtlesmooth.addMacro(['fill'])
        }
    },
    'カメ文字描画': { // @カメの位置に文字Sを描画 // @かめもじびょうが
        type: 'func',
        josi: [['を', 'と', 'の']],
        pure: true,
        fn: function (s: string, sys: NakoSystem): Promise<number> {
            const turtlesmooth = TurtleSmoothSystem.getTurtleSmooth(sys)
            return turtlesmooth.addMacro(['text', s])
        }
    },
    'カメ文字設定': { // @カメ文字描画で描画するテキストサイズやフォント(48px serif)などを設定 // @かめもじせってい
        type: 'func',
        josi: [['に', 'へ', 'で']],
        pure: true,
        fn: function (s: string, sys: NakoSystem): Promise<number> {
            const turtlesmooth = TurtleSmoothSystem.getTurtleSmooth(sys)
            s = '' + s // 文字列に
            if (s.match(/^\d+$/)) {
                s = s + 'px serif'
            } else if (s.match(/^\d+(px|em)$/)) {
                s = s + ' serif'
            }
            return turtlesmooth.addMacro(['textset', s])
        }
    },
    'カメ塗色設定': { // @カメパスの塗り色をCに設定する // @かめぬりいろせってい
        type: 'func',
        josi: [['に', 'へ']],
        pure: true,
        fn: function (c: number|string, sys: NakoSystem): Promise<number> {
            const turtlesmooth = TurtleSmoothSystem.getTurtleSmooth(sys)
            return turtlesmooth.addMacro(['fillStyle', c])
        }
    },
    'カメ全消去': { // @表示しているカメと描画内容を全部消去する // @かめぜんしょうきょ
        type: 'func',
        josi: [],
        pure: true,
        fn: function (sys: NakoSystem):void {
            const turtlesmooth = TurtleSmoothSystem.getTurtleSmooth(sys)
            turtlesmooth.clearAll()
        },
        return_none: true
    },
    'カメコマンド実行': { // @カメにコマンドSを実行する。コマンドは改行か「;」で区切る。コマンドと引数は「=」で区切り引数はかカンマで区切る // @かめこまんどじっこう
        type: 'func',
        josi: [['の', 'を']],
        pure: true,
        fn: function (cmd: string, sys: NakoSystem): Promise<number> {
            const turtlesmooth = TurtleSmoothSystem.getTurtleSmooth(sys)
            let promise:null|Promise<number> = null
            const a = cmd.split(/(\n|;)/)
            for (let i = 0; i < a.length; i++) {
                let c = a[i]
                c = c.replace(/^([a-zA-Z_]+)\s*(\d+)/, '$1,$2')
                c = c.replace(/^([a-zA-Z_]+)\s*=/, '$1,')
                const ca = c.split(/\s*,\s*/)
                promise = turtlesmooth.addMacro(ca)
            }
            if (promise === null) {
                promise = new Promise<number>(resolve => resolve(0))
            }
            return promise
        }
    },
    'カメ非表示': { // @カメの画像を非表示にする。描画に影響しない。 // @かめひひょうじ
        type: 'func',
        josi: [],
        pure: true,
        fn: function (sys: NakoSystem): Promise<number> {
            const turtlesmooth = TurtleSmoothSystem.getTurtleSmooth(sys)
            return turtlesmooth.addMacro(['visible', false])
        }
    },
    'カメ表示': { // @非表示にしたカメを表示する。 // @かめひょうじ
        type: 'func',
        josi: [],
        pure: true,
        fn: function (sys: NakoSystem): Promise<number> {
            const turtlesmooth = TurtleSmoothSystem.getTurtleSmooth(sys)
            return turtlesmooth.addMacro(['visible', true])
        }
    },
    'カメクリック時': { // @ 操作対象のカメをクリックした時のイベントを設定する // @かめくりっくしたとき
        type: 'func',
        josi: [['を']],
        pure: false,
        fn: function (func: CallbackType<Event>, sys: NakoSystem):void {
            const turtlesmooth = TurtleSmoothSystem.getTurtleSmooth(sys)
            func = sys.__findVar(func, null) // 文字列指定なら関数に変換
            if (typeof func !== 'function') {
                return
            }
            const tt = turtlesmooth.getCur()
            if (tt && tt.canvas) {
                tt.canvas.onclick = (e) => {
                    sys.__setSysVar('対象', e.target)
                    return func(e)
                }
            }
        },
        return_none: true
    },
    // @タートルグラフィックス・カメ描画(スムースカメ拡張命令)
    'カメ複製': { // @指定したカメと同じ位置と向きを持つカメを作成してIDを返す // @かめふくせい
        type: 'func',
        josi: [['の', 'から']],
        pure: true,
        fn: function (t: null|number|NakoSystem, sys?: NakoSystem): number {
            if (typeof sys === 'undefined') {
                sys = t as NakoSystem
                t = null
            }
            const turtlesmooth = TurtleSmoothSystem.getTurtleSmooth(sys)
            let tt: TurtleSmooth
            if (typeof t === 'number') {
                tt = turtlesmooth.turtles[t]
            } else {
                tt = turtlesmooth.getCur()
            }
            const imageUrl = sys.__getSysVar('カメ画像URL')
            const tid = turtlesmooth.createTurtle(imageUrl)
            turtlesmooth.turtles[tid].x = tt.x
            turtlesmooth.turtles[tid].y = tt.y
            turtlesmooth.turtles[tid].dir = tt.dir
            return tid
        }
    },
    'カメ数取得': { // @カメの数を取得する // @かめすうしゅとく
        type: 'func',
        josi: [],
        pure: true,
        fn: function (sys: NakoSystem): number {
            const turtlesmooth = TurtleSmoothSystem.getTurtleSmooth(sys)
            return turtlesmooth.turtles.length
        }
    },
    'カメ直接移動': { // @カメの位置を[x,y]へ移動する // @かめちょくせついどう
        type: 'func',
        josi: [['に', 'へ']],
        pure: true,
        fn: function (xy: NumericArray2, sys: NakoSystem): Promise<number> {
            const turtlesmooth = TurtleSmoothSystem.getTurtleSmooth(sys)
            return turtlesmooth.addMacro(['directmv', xy[0], xy[1]])
        }
    },
    'カメ直接角度設定': { // @カメの向きをDEGに設定する // @かめちょくせつかくどせってい
        type: 'func',
        josi: [['に', 'へ', 'の']],
        pure: true,
        fn: function (deg: number|string, sys: NakoSystem): Promise<number> {
            const turtlesmooth = TurtleSmoothSystem.getTurtleSmooth(sys)
            if (typeof deg === 'string') { deg = parseFloat(deg) }
            return turtlesmooth.addMacro(['directangle', deg])
        }
    },
    'カメ位置取得': { // @カメの位置([X,Y])を取得する // @かめいちしゅとく
        type: 'func',
        josi: [['の', 'から']],
        pure: true,
        fn: function (t: null|number|NakoSystem, sys?: NakoSystem): NumericArray2 {
            if (typeof sys === 'undefined') {
                sys = t as NakoSystem
                t = null
            }
            const turtlesmooth = TurtleSmoothSystem.getTurtleSmooth(sys)
            let tt: TurtleSmooth
            if (typeof t === 'number') {
                tt = turtlesmooth.turtles[t]
            } else {
                tt = turtlesmooth.getCur()
            }
            return [tt.x, tt.y]
        }
    },
    'カメ角度取得': { // @カメの向き(度)を取得する // @かめかくどしゅとく
        type: 'func',
        josi: [['の', 'から']],
        pure: true,
        fn: function (t: null|number|NakoSystem, sys?: NakoSystem): number {
            if (typeof sys === 'undefined') {
                sys = t as NakoSystem
                t = null
            }
            const turtlesmooth = TurtleSmoothSystem.getTurtleSmooth(sys)
            let tt: TurtleSmooth
            if (typeof t === 'number') {
                tt = turtlesmooth.turtles[t]
            } else {
                tt = turtlesmooth.getCur()
            }
            return tt.dir
        }
    },
    'カメ移動速度設定': { // @カメペンが移動する際の速さをSPD(px/ミリ秒)に設定する // @かめいどうそくどせってい
        type: 'func',
        josi: [['に', 'へ']],
        pure: true,
        fn: function (spd: number, sys: NakoSystem): Promise<number> {
            const turtlesmooth = TurtleSmoothSystem.getTurtleSmooth(sys)
            return turtlesmooth.addMacro(['spdM', spd])
        }
    },
    'カメ回転速度設定': { // @カメペンが回転する際の速さをSPD(度/ミリ秒)に設定する // @かめかいてんそくどせってい
        type: 'func',
        josi: [['に', 'へ']],
        pure: true,
        fn: function (spd: number, sys: NakoSystem): Promise<number> {
            const turtlesmooth = TurtleSmoothSystem.getTurtleSmooth(sys)
            return turtlesmooth.addMacro(['spdR', spd])
        }
    }
}

export default PluginTurtleSmooth

// scriptタグで取り込んだ時、自動で登録する
// @ts-ignore TS2339
if (typeof (navigator) === 'object' && typeof (navigator.nako3)) {
    navigator.nako3.addPluginObject('PluginTurtleSmooth', PluginTurtleSmooth)
}
