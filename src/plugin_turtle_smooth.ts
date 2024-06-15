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
type CanvasRect = { left: number, top: number, width: number, height: number, visible: boolean}
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

interface PenStyle {
    lineWidth: number
    fillStyle: string
    strokeStyle: string
    font: string
    down: boolean
}

class DrawLineEventArgs {
    id: number
    x1: number
    y1: number
    x2: number
    y2: number
    style: PenStyle
    constructor (id: number, x1: number, y1: number, x2: number, y2: number, style: PenStyle) {
        this.id = id
        this.x1 = x1
        this.y1 = y1
        this.x2 = x2
        this.y2 = y2
        this.style = style
    }
}

type DrawParam = number|string|NumericArray2
type DrawParams = DrawParam[]
class DrawCanvasEventArgs {
    id: number
    cmd: string
    params: DrawParams
    style: PenStyle
    constructor (id: number, cmd: string, params: DrawParams, style: PenStyle) {
        this.id = id
        this.cmd = cmd
        this.params = params
        this.style = style
    }
}

interface TurtleSmoothEventMap {
    modelChanged: CustomEvent<void>
    drawLine: CustomEvent<DrawLineEventArgs>
    drawCanvas: CustomEvent<DrawCanvasEventArgs>
}

interface TurtleSmoothEventTarget extends EventTarget {
    addEventListener<K extends keyof TurtleSmoothEventMap>(
       type: K,
       listener: ((this: TurtleSmooth, evt: TurtleSmoothEventMap[K]) => any) | null,
       options?: boolean | EventListenerOptions,): void
    addEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions): void
    dispatchEvent<K extends keyof TurtleSmoothEventMap>(evt: TurtleSmoothEventMap[K]): boolean
    removeListener<K extends keyof TurtleSmoothEventMap>(
       type: K,
       listener: (this: TurtleSmooth, evt: TurtleSmoothEventMap[K]) => any,
       options?: boolean | EventListenerOptions,): void
    removeEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | EventListenerOptions): void
}

class Command {
    cmd: string
    args: any[]
    constructor (cmd: string, args?: any[]) {
        this.cmd = cmd
        this.args = args !== undefined ? args : []
    }
}

class Job {
    resolve: CallbackType<number>
    reject: CallbackType<Error>
    command: Command
    constructor (cmd: Command, resolve: CallbackType<number>, reject: CallbackType<Error>) {
        this.resolve = resolve
        this.reject = reject
        this.command = cmd
    }
}

type AnimationCmd = 'move'|'rotate'|'curve'
interface AnimationJob {
    cmd: AnimationCmd
}
class AnimationJobMove implements AnimationJob {
    cmd: 'move'
    len: number
    constructor (len: number) {
        this.cmd = 'move'
        this.len = len
    }
}
class AnimationJobRotate implements AnimationJob {
    cmd: 'rotate'
    deg: number
    constructor (deg: number) {
        this.cmd = 'rotate'
        this.deg = deg
    }
}
class AnimationJobCurve implements AnimationJob {
    cmd: 'curve'
    r: number
    deg: number
    constructor (r: number, deg: number) {
        this.cmd = 'curve'
        this.r = r
        this.deg = deg
    }
}
type AnimationJobType = AnimationJobMove|AnimationJobRotate|AnimationJobCurve

interface AnimationJobState {
    type: AnimationCmd
    origin: [number, number]
    dir: number
    targetLen: number,
    targetR?: number,
    remain: number
}
type JobStepEnum = 'fetchJob'|'preExecute'|'beforeExecute'|'execute'|'afterExecute'|'animation'|'animationStep'|'animationAdjust'|'afterAnimation'
const TypedTurtleSmoothEventTarget = EventTarget as {new():TurtleSmoothEventTarget; prototype: TurtleSmoothEventTarget }

class TurtleSmooth extends TypedTurtleSmoothEventTarget {
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
    penStyle: PenStyle
    spdRotate: number
    spdMove: number
    f_update: boolean
    flagLoaded: boolean
    f_visible: boolean
    jobs: Job[]
    currentJob: null|Job
    jobStep: JobStepEnum

    animationJobs: AnimationJobType[]
    animationJob: null|AnimationJobState

    jobWait: number

    constructor (sys: NakoSystem, id: number) {
        super()
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

        this.penStyle = {
            lineWidth: 4,
            strokeStyle: 'black',
            fillStyle: 'black',
            font: '10px sans-serif',
            down: true
        }

        this.jobStep = 'fetchJob'
        this.currentJob = null
        this.animationJobs = []
        this.animationJob = null

        this.spdRotate = 15 / 100
        this.spdMove = 10 / 100

        this.f_update = true
        this.flagLoaded = false
        this.f_visible = true
        this.jobs = []
        this.jobWait = 0
    }

    clear ():void {
        // 未実行の全JOBに対してresolve(1)を呼び出す。
        for (const job of this.jobs) {
            const resolve = job.resolve
            if (resolve !== null) {
                resolve(1)
            }
        }
        this.jobs = [] // ジョブをクリア
        this.currentJob = null
        this.animationJob = null
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

    drawTurtle (cr: CanvasRect):void {
        if (!this.canvas || !this.ctx || !this.img) {
            return
        }
        if (!cr.visible) {
            return
        }
        // カメの位置を移動
        this.canvas.style.left = (cr.left + this.x - this.cx) + 'px'
        this.canvas.style.top = (cr.top + this.y - this.cx) + 'px'
        if (!this.f_update) {
            return
        }
        /* istanbul ignore if */
        if (!this.flagLoaded) {
            return
        }
        this.f_update = false
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
        if (!this.f_visible) {
            return
        }
        if (this.dir !== 270) {
            const rad = (this.dir + 90) * 0.017453292519943295
            this.ctx.save()
            this.ctx.translate(this.cx, this.cy)
            this.ctx.rotate(rad)
            this.ctx.translate(-(this.img.width / 2), -(this.img.height / 2))
            this.ctx.drawImage(this.img, 0, 0)
            this.ctx.restore()
        } else {
            this.ctx.drawImage(this.img, this.cx - (this.img.width / 2), this.cy - (this.img.height / 2))
        }
    }

    jobAction (job: Job):void {
        const cmd = job.command
        switch (cmd.cmd) {
        case 'xy':
            // 起点を移動する
            this.x = cmd.args[0]
            this.y = cmd.args[1]
            break
        case 'begin':
            // 描画を明示的に開始する
            this.raiseDrawCanvas('beginPath', [[this.x, this.y]])
            break
        case 'close':
            this.raiseDrawCanvas('closePath', [])
            break
        case 'fill':
            this.raiseDrawCanvas('fill', [])
            break
        case 'stroke':
            this.raiseDrawCanvas('stroke', [])
            break
        case 'text':
            this.raiseDrawCanvas('fillText', [[this.x, this.y], cmd.args[0]])
            break
        case 'textset':
            this.penStyle.font = cmd.args[0]
            break
        case 'fillStyle':
            this.penStyle.fillStyle = cmd.args[0]
            break
        case 'mv':
        case 'directmv': {
            // 線を引く
            this.raiseDrawLine([this.x, this.y], [cmd.args[0], cmd.args[1]])
            // カメの角度を変更
            const mvRad = Math.atan2(cmd.args[1] - this.y, cmd.args[0] - this.x)
            this.dir = mvRad * 57.29577951308232
            this.f_update = true
            // 実際に位置を移動
            this.x = cmd.args[0]
            this.y = cmd.args[1]
            break
        }
        case 'fd': {
            const fdv = cmd.args[0] * cmd.args[1]
            const rad = this.dir * 0.017453292519943295
            const x2 = this.x + Math.cos(rad) * fdv
            const y2 = this.y + Math.sin(rad) * fdv
            this.raiseDrawLine([this.x, this.y], [x2, y2])
            this.x = x2
            this.y = y2
            break
        }
        case 'curve':{
            const r = cmd.args[0] * cmd.args[2]
            const deg = cmd.args[1] * cmd.args[3]
            const direction = deg < 0 ? -1 : 1
            const dir = (this.dir + 90 * direction + 360) % 360
            const rad = dir * 0.017453292519943295
            const dx = this.x + Math.cos(rad) * r
            const dy = this.y + Math.sin(rad) * r

            const rlen = r * 6.283185307179586
            this.dir = (this.dir + (deg % 360) + 360) % 360
            const rad2 = this.dir * 0.017453292519943295
            const x2 = dx + Math.cos(rad2) * r
            const y2 = dy + Math.sin(rad2) * r
            this.raiseDrawLine([this.x, this.y], [x2, y2])
            this.x = x2
            this.y = y2
            this.f_update = true
            break
        }
        case 'angle':
        case 'directangle': {
            this.dir = ((cmd.args[0] - 90 % 360) + 360) % 360
            this.f_update = true
            break
        }
        case 'rot': {
            const deg = cmd.args[0] * cmd.args[1]
            this.dir = (this.dir + (deg % 360) + 360) % 360
            this.f_update = true
            break
        }
        case 'color':
            this.penStyle.strokeStyle = cmd.args[0]
            break
        case 'size':
            this.penStyle.lineWidth = cmd.args[0]
            break
        case 'penOn':
            this.penStyle.down = cmd.args[0]
            break
        case 'spdR':
            this.spdRotate = cmd.args[0]
            break
        case 'spdM':
            this.spdMove = cmd.args[0]
            break
        case 'visible':
            this.f_visible = cmd.args[0]
            this.f_update = true
            break
        }
    }

    doMacro (time: number, defaultWait: number, waitForTurteImage: boolean): boolean {
        if (!this.flagLoaded && waitForTurteImage) {
            // console.log('[TURTLE] waiting ...')
            return true
        }
        const immediateRun = defaultWait === 0
        // 以下の２つの条件を満たしている間ループする。
        // 即時実行であるか、即時実行ではない場合は経過時間の残りがあること。
        // 未処理のJOBが残っているか、処理中のJOBがあること。
        while ((time > 0 || immediateRun) && (this.jobs.length > 0 || this.jobStep !== 'fetchJob')) {
            switch (this.jobStep) {
            case 'fetchJob':
                // 処理中のJOBは無いので次のJOBを取得して処理に着手する
                this.currentJob = this.jobs.shift() || null
                this.jobStep = this.currentJob !== null ? 'preExecute' : 'fetchJob'
                break
            case 'preExecute':{
                const job = this.currentJob
                if (job === null) {
                    this.jobStep = 'fetchJob'
                    break
                }
                const cmd = job.command
                this.jobWait = Math.floor(defaultWait / 2)
                this.jobStep = 'beforeExecute'
                switch (cmd.cmd) {
                case 'changeImage':
                    if (this.img) {
                        this.flagLoaded = false
                        this.img.src = cmd.args[0]
                    }
                    break
                case 'mv':
                    if (!immediateRun && (this.spdMove > 0 || this.spdRotate > 0)) {
                        // カメの角度を算出
                        const dx = cmd.args[0] - this.x
                        const dy = cmd.args[1] - this.y
                        const angleRad = Math.atan2(dy, dx)
                        const angle = angleRad * 57.29577951308232
                        const targetdir = (angle + 360) % 360
                        let deg = (targetdir - this.dir + 360) % 360
                        if (deg > 180) {
                            deg = deg - 360
                        }
                        // カメの移動距離を算出
                        const fdv = Math.sqrt(dx * dx + dy * dy)
                        this.animationJobs.push(new AnimationJobMove(fdv))
                        this.animationJobs.push(new AnimationJobRotate(deg))
                        this.jobStep = 'animation'
                        this.jobWait = 0
                    }
                    break
                case 'fd':
                    if (!immediateRun && this.spdMove > 0) {
                        const fdv = cmd.args[0] * cmd.args[1]
                        const rad = this.dir * 0.017453292519943295
                        const x2 = this.x + Math.cos(rad) * fdv
                        const y2 = this.y + Math.sin(rad) * fdv
                        this.animationJobs.push(new AnimationJobMove(fdv))
                        this.jobStep = 'animation'
                        this.jobWait = 0
                    }
                    break
                case 'angle':
                    if (!immediateRun && this.spdRotate > 0) {
                        const targetdir = (((cmd.args[0] - 90) % 360) + 360) % 360
                        let deg = (targetdir - this.dir + 360) % 360
                        if (deg > 180) {
                            deg = deg - 360
                        }
                        this.animationJobs.push(new AnimationJobRotate(deg))
                        this.jobStep = 'animation'
                        this.jobWait = 0
                    }
                    break
                case 'rot':
                    if (!immediateRun && this.spdRotate > 0) {
                        const deg = cmd.args[0] * cmd.args[1]
                        this.animationJobs.push(new AnimationJobRotate(deg))
                        this.jobStep = 'animation'
                        this.jobWait = 0
                    }
                    break
                case 'curve':
                    if (!immediateRun && this.spdMove > 0) {
                        const r = cmd.args[0] * cmd.args[2]
                        const deg = cmd.args[1] * cmd.args[3]
                        this.animationJobs.push(new AnimationJobCurve(r, deg))
                        this.jobStep = 'animation'
                        this.jobWait = 0
                    }
                    break
                }
                break
            }
            case 'beforeExecute':
                if (time >= this.jobWait || immediateRun) {
                    // ステップ待ち時間に到達したか、即時実行が有効となっている。
                    // 経過時間からステップ待ち時間を減算する。
                    time -= this.jobWait
                    this.jobWait = 0
                    this.jobStep = 'execute'
                } else {
                    // ステップ待ち時間に到達していない。
                    // 残りのステップ待ち時間から経過時間を減らして次へ。
                    this.jobWait -= time
                    time = 0
                }
                break
            case 'execute':
                if (this.currentJob !== null) {
                    this.jobAction(this.currentJob)
                }
                this.jobWait = Math.ceil(defaultWait / 2)
                this.jobStep = 'afterExecute'
                break
            case 'afterExecute':
                if (time >= this.jobWait || immediateRun) {
                    // ステップ待ち時間に到達したか、即時実行が有効となっている。
                    // 経過時間からステップ待ち時間を減算する。
                    time -= this.jobWait
                    this.jobWait = 0
                    // ステップ完了処理があるなら呼び出す。

                    // if (tt.flagLoaded) { this.drawTurtle(tt.id) }

                    if (this.currentJob?.resolve != null) {
                        this.currentJob.resolve(0)
                    }
                    this.jobStep = 'fetchJob'
                    this.currentJob = null
                } else {
                    // ステップ待ち時間に到達していない。
                    // 残りのステップ待ち時間から経過時間を減らして次へ。
                    this.jobWait -= time
                    time = 0
                }
                break
            case 'animation':{
                const animJob = this.animationJobs.shift()
                if (animJob === undefined) {
                    this.jobStep = 'afterAnimation'
                    break
                }
                const animCmd = animJob.cmd
                let len:number
                let r:number|undefined
                let p:NumericArray2
                if (animJob instanceof AnimationJobMove) {
                    len = animJob.len
                    p = [this.x, this.y]
                } else if (animJob instanceof AnimationJobRotate) {
                    len = animJob.deg
                    p = [this.x, this.y]
                } else {
                    len = animJob.deg
                    r = animJob.r
                    const direction = len > 0 ? 1 : -1
                    const dir = (this.dir + 90 * direction + 360) % 360
                    const rad = dir * 0.017453292519943295
                    const dx = this.x + Math.cos(rad) * r
                    const dy = this.y + Math.sin(rad) * r
                    p = [dx, dy]
                }
                this.animationJob = {
                    type: animCmd,
                    origin: p,
                    dir: this.dir,
                    targetLen: len,
                    targetR: r,
                    remain: Math.abs(len)
                }
                if ((animCmd === 'rotate' || animCmd === 'curve') && this.spdRotate <= 0) {
                    this.jobStep = 'animationAdjust'
                } else if (animCmd === 'move' && this.spdMove <= 0) {
                    this.jobStep = 'animationAdjust'
                } else {
                    this.jobStep = 'animationStep'
                }
                break
            }
            case 'animationStep':
                if (this.animationJob === null) {
                    this.jobStep = 'animation'
                    break
                }
                if (this.animationJob.type === 'rotate') {
                    const delta = time * this.spdRotate
                    if (delta < this.animationJob.remain) {
                        const direction = this.animationJob.targetLen > 0 ? 1 : -1
                        this.animationJob.remain -= delta
                        this.dir = (this.dir + (delta * direction % 360) + 360) % 360
                        time = 0
                        this.f_update = true
                    } else {
                        this.jobStep = 'animationAdjust'
                    }
                } else if (this.animationJob.type === 'curve') {
                    const deltaLen = time * this.spdMove
                    const r = this.animationJob.targetR as number
                    const delta = deltaLen / (Math.abs(r) * 6.283185307179586) * 360
                    if (delta < this.animationJob.remain) {
                        const direction = this.animationJob.targetLen > 0 ? 1 : -1
                        this.animationJob.remain -= delta
                        this.dir = (this.dir + (delta * direction % 360) + 360) % 360
                        const dir = (this.dir + 90 * direction * -1 + 360) % 360
                        const rad = dir * 0.017453292519943295
                        const x2 = this.animationJob.origin[0] + Math.cos(rad) * r
                        const y2 = this.animationJob.origin[1] + Math.sin(rad) * r
                        this.raiseDrawLine([this.x, this.y], [x2, y2])
                        this.x = x2
                        this.y = y2
                        time = 0
                        this.f_update = true
                    } else {
                        this.jobStep = 'animationAdjust'
                    }
                } else if (this.animationJob.type === 'move') {
                    const delta = time * this.spdMove
                    if (delta < this.animationJob.remain) {
                        const direction = this.animationJob.targetLen > 0 ? 1 : -1
                        this.animationJob.remain -= delta
                        const rad = this.dir * 0.017453292519943295
                        const vp = delta * direction
                        const x2 = this.x + Math.cos(rad) * vp
                        const y2 = this.y + Math.sin(rad) * vp
                        this.raiseDrawLine([this.x, this.y], [x2, y2])
                        this.x = x2
                        this.y = y2
                        time = 0
                    } else {
                        this.jobStep = 'animationAdjust'
                    }
                }
                break
            case 'animationAdjust':
                if (this.animationJob === null) {
                    this.jobStep = 'animation'
                    break
                }
                if (this.animationJob.type === 'rotate') {
                    if (this.spdRotate > 0) {
                        time -= Math.floor(this.animationJob.remain / this.spdRotate)
                    }
                    this.animationJob.remain = 0
                    this.dir = (this.animationJob.dir + (this.animationJob.targetLen % 360) + 360) % 360
                } else if (this.animationJob.type === 'curve') {
                    const r = this.animationJob.targetR as number
                    if (this.spdMove > 0) {
                        const deltaLen = this.animationJob.remain / 360 * (Math.abs(r) * 6.283185307179586)
                        time -= Math.floor(deltaLen / this.spdRotate)
                    }
                    this.animationJob.remain = 0
                    this.dir = (this.animationJob.dir + (this.animationJob.targetLen % 360) + 360) % 360
                    const direction = this.animationJob.targetLen > 0 ? 1 : -1
                    const dir = (this.dir + 90 * direction * -1 + 360) % 360
                    const rad = dir * 0.017453292519943295
                    const x2 = this.animationJob.origin[0] + Math.cos(rad) * r
                    const y2 = this.animationJob.origin[1] + Math.sin(rad) * r
                    this.raiseDrawLine([this.x, this.y], [x2, y2])
                    this.x = x2
                    this.y = y2
                    // console.log(`${this.x},${this.y},${this.dir} - ${this.animationJob.dir}`)
                } else if (this.animationJob.type === 'move') {
                    if (this.spdMove > 0) {
                        time -= Math.floor(this.animationJob.remain / this.spdMove)
                    }
                    this.animationJob.remain = 0
                    const rad = this.dir * 0.017453292519943295
                    const vp = this.animationJob.targetLen
                    const x2 = this.animationJob.origin[0] + Math.cos(rad) * vp
                    const y2 = this.animationJob.origin[1] + Math.sin(rad) * vp
                    this.raiseDrawLine([this.x, this.y], [x2, y2])
                    this.x = x2
                    this.y = y2
                }
                this.animationJob = null
                this.jobStep = 'animation'
                break
            case 'afterAnimation':
                this.currentJob = null
                this.jobStep = 'fetchJob'
                break
            }
            // if (this.flagLoaded) { this.drawTurtle(tt.id) }
        }
        return (this.jobs.length > 0 || this.jobStep !== 'fetchJob')
    }

    private raiseDrawLine (p1: NumericArray2, p2: NumericArray2) : void {
        const args = new DrawLineEventArgs(this.id, p1[0], p1[1], p2[0], p2[1], this.penStyle)
        const evt = new CustomEvent<DrawLineEventArgs>('drawLine', { detail: args })
        this.dispatchEvent(evt)
    }

    private raiseDrawCanvas (cmd: string, points: NumericArray2[]) : void {
        const args = new DrawCanvasEventArgs(this.id, cmd, points, this.penStyle)
        const evt = new CustomEvent<DrawCanvasEventArgs>('drawCanvas', { detail: args })
        this.dispatchEvent(evt)
    }
}

class TurtleSmoothSystem {
    private static instance: TurtleSmoothSystem
    private instanceCount: number
    sys: NakoSystem
    canvas: null|HTMLCanvasElement
    ctx: null|CanvasRenderingContext2D
    canvas_r: CanvasRect
    flagSetTimer: boolean
    fid: number
    lastStart: number
    turtles: TurtleSmooth[]
    target: number
    usePathId: number|null
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
        this.ctx = null
        this.canvas = null
        this.canvas_r = { left: 0, top: 0, width: 640, height: 400, visible: false }
        this.flagSetTimer = false
        this.instanceCount = 0
        this.lastStart = 0
        this.fid = -1
        this.turtles = [] // カメの一覧
        this.target = -1 // 操作対象のカメのID
        this.usePathId = null // パス描画中のカメのID
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
        if (this.usePathId !== null) {
            this.ctx?.closePath()
        }
        this.usePathId = null
        this.flagSetTimer = false
        if (this.fid !== -1) {
            cancelAnimationFrame(this.fid)
        }
        this.lastStart = 0
        this.fid = -1
    }

    drawTurtle (id: number):void {
        const tt = this.turtles[id]
        const cr = this.canvas_r
        if (!tt || !cr.visible) {
            return
        }
        tt.drawTurtle(this.canvas_r)
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

    line (id: number, p1: NumericArray2, p2: NumericArray2, penStyle: PenStyle):void {
        /* istanbul ignore else */
        if (!penStyle.down) {
            return
        }
        if (this.ctx) {
            const ctx = this.ctx
            if (this.usePathId === id) {
                ctx.lineTo(p2[0], p2[1])
            } else {
                if (this.usePathId !== null) {
                    ctx.save()
                }
                ctx.beginPath()
                ctx.lineWidth = penStyle.lineWidth
                ctx.strokeStyle = penStyle.strokeStyle
                ctx.fillStyle = penStyle.fillStyle
                ctx.font = penStyle.font
                ctx.moveTo(p1[0], p1[1])
                ctx.lineTo(p2[0], p2[1])
                ctx.stroke()
                if (this.usePathId !== null) {
                    ctx.restore()
                }
            }
        }
    }

    draw (id: number, cmd: string, params: DrawParams, style: PenStyle):void {
        switch (cmd) {
        case 'beginPath':
            if (this.usePathId === null) {
                this.usePathId = id
                this.ctx?.beginPath()
                const p = params[0] as NumericArray2
                this.ctx?.moveTo(p[0], p[1])
            } else {
                throw new Error('既にパス描画中のため、パス描画を開始できません')
            }
            break
        case 'closePath':
            if (this.usePathId === id) {
                this.usePathId = null
            }
            if (this.usePathId === null) {
                this.ctx?.closePath()
            }
            break
        case 'fillText':{
            const ctx = this.ctx
            if (ctx === null) { return }
            if (this.usePathId !== null) {
                ctx.save()
            }
            const p = params[0] as NumericArray2
            const s = params[1] as string
            ctx.lineWidth = style.lineWidth
            ctx.strokeStyle = style.strokeStyle
            ctx.fillStyle = style.fillStyle
            ctx.font = style.font
            ctx.fillText(s, p[0], p[1])
            if (this.usePathId !== null) {
                ctx.restore()
            }
            break
        }
        case 'fill':
            if (this.usePathId === id) {
                this.usePathId = null
                this.ctx?.closePath()
            }
            this.ctx?.fill()
            break
        case 'stroke':
            if (this.usePathId === id) {
                this.usePathId = null
                this.ctx?.closePath()
            }
            this.ctx?.stroke()
            break
        default:
            throw new Error(`カメから不明な描画要求(${cmd})を受け取りました`)
        }
    }

    addJob (command: any[]): Promise<number> {
        const tt = this.getCur()
        const cmd = command.shift()
        return new Promise((resolve, reject) => {
            const job = new Job(new Command(cmd, command), resolve, reject)
            tt.jobs.push(job)
            this.setTimer()
        })
    }

    doMacroAll (time: number, defaultWait: number, waitForTurteImage: boolean):boolean {
        let hasNext = false
        for (const tt of this.turtles) {
            hasNext = tt.doMacro(time, defaultWait, waitForTurteImage) || hasNext
            if (tt.flagLoaded) { this.drawTurtle(tt.id) }
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
        tt.addEventListener('drawLine', (e) => {
            this.line(e.detail.id, [e.detail.x1, e.detail.y1], [e.detail.x2, e.detail.y2], e.detail.style)
        })
        tt.addEventListener('drawCanvas', (e) => {
            this.draw(e.detail.id, e.detail.cmd, e.detail.params, e.detail.style)
        })
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
            return turtlesmooth.addJob(['changeImage', url])
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
            return turtlesmooth.addJob(['mv', xy[0], xy[1]])
        }
    },
    'カメ起点移動': { // @カメの描画起点位置を[x,y]へ移動する // @かめきてんいどう
        type: 'func',
        josi: [['に', 'へ']],
        pure: true,
        fn: function (xy: NumericArray2, sys: NakoSystem): Promise<number> {
            const turtlesmooth = TurtleSmoothSystem.getTurtleSmooth(sys)
            return turtlesmooth.addJob(['xy', xy[0], xy[1]])
        }
    },
    'カメ進': { // @カメの位置をVだけ進める // @かめすすむ
        type: 'func',
        josi: [['だけ']],
        pure: true,
        fn: function (v: number|string, sys: NakoSystem): Promise<number> {
            const turtlesmooth = TurtleSmoothSystem.getTurtleSmooth(sys)
            if (typeof v === 'string') { v = parseFloat(v) }
            return turtlesmooth.addJob(['fd', v, 1])
        }
    },
    'カメ戻': { // @カメの位置をVだけ戻す // @かめもどる
        type: 'func',
        josi: [['だけ']],
        pure: true,
        fn: function (v: number|string, sys: NakoSystem): Promise<number> {
            const turtlesmooth = TurtleSmoothSystem.getTurtleSmooth(sys)
            if (typeof v === 'string') { v = parseFloat(v) }
            return turtlesmooth.addJob(['fd', v, -1])
        }
    },
    'カメ角度設定': { // @カメの向きをDEGに設定する // @かめかくどせってい
        type: 'func',
        josi: [['に', 'へ', 'の']],
        pure: true,
        fn: function (deg: number|string, sys: NakoSystem): Promise<number> {
            const turtlesmooth = TurtleSmoothSystem.getTurtleSmooth(sys)
            if (typeof deg === 'string') { deg = parseFloat(deg) }
            return turtlesmooth.addJob(['angle', deg])
        }
    },
    'カメ右回転': { // @カメの向きをDEGだけ右に向ける // @かめみぎかいてん
        type: 'func',
        josi: [['だけ']],
        pure: true,
        fn: function (deg: number|string, sys: NakoSystem): Promise<number> {
            const turtlesmooth = TurtleSmoothSystem.getTurtleSmooth(sys)
            if (typeof deg === 'string') { deg = parseFloat(deg) }
            return turtlesmooth.addJob(['rot', deg, 1])
        }
    },
    'カメ左回転': { // @カメの向きをDEGだけ左に向ける // @かめひだりかいてん
        type: 'func',
        josi: [['だけ']],
        pure: true,
        fn: function (deg: number|string, sys: NakoSystem): Promise<number> {
            const turtlesmooth = TurtleSmoothSystem.getTurtleSmooth(sys)
            if (typeof deg === 'string') { deg = parseFloat(deg) }
            return turtlesmooth.addJob(['rot', deg, -1])
        }
    },
    'カメペン色設定': { // @カメのペン描画色をCに設定する // @かめぺんいろせってい
        type: 'func',
        josi: [['に', 'へ']],
        pure: true,
        fn: function (c: number|string, sys: NakoSystem): Promise<number> {
            const turtlesmooth = TurtleSmoothSystem.getTurtleSmooth(sys)
            return turtlesmooth.addJob(['color', c])
        }
    },
    'カメペンサイズ設定': { // @カメペンのサイズをWに設定する // @かめぺんさいずせってい
        type: 'func',
        josi: [['に', 'へ']],
        pure: true,
        fn: function (w: number|string, sys: NakoSystem): Promise<number> {
            const turtlesmooth = TurtleSmoothSystem.getTurtleSmooth(sys)
            return turtlesmooth.addJob(['size', w])
        }
    },
    'カメペン設定': { // @カメペンを使うかどうかをV(オン/オフ)に設定する // @かめぺんせってい
        type: 'func',
        josi: [['に', 'へ']],
        pure: true,
        fn: function (v: boolean|number|string, sys: NakoSystem): Promise<number> {
            const turtlesmooth = TurtleSmoothSystem.getTurtleSmooth(sys)
            return turtlesmooth.addJob(['penOn', v])
        }
    },
    'カメパス開始': { // @カメで明示的にパスの描画を開始する // @かめぱすかいし
        type: 'func',
        josi: [],
        pure: true,
        fn: function (sys: NakoSystem): Promise<number> {
            const turtlesmooth = TurtleSmoothSystem.getTurtleSmooth(sys)
            return turtlesmooth.addJob(['begin'])
        }
    },
    'カメパス閉': { // @カメでパスを明示的に閉じる(省略可能) // @かめぱすとじる
        type: 'func',
        josi: [],
        pure: true,
        fn: function (sys: NakoSystem): Promise<number> {
            const turtlesmooth = TurtleSmoothSystem.getTurtleSmooth(sys)
            return turtlesmooth.addJob(['close'])
        }
    },
    'カメパス線引': { // @カメでパスを閉じて、カメペン色設定で指定した色で枠線を引く // @かめぱすせんひく
        type: 'func',
        josi: [],
        pure: true,
        fn: function (sys: NakoSystem): Promise<number> {
            const turtlesmooth = TurtleSmoothSystem.getTurtleSmooth(sys)
            return turtlesmooth.addJob(['stroke'])
        }
    },
    'カメパス塗': { // @カメでパスを閉じて、カメ塗り色設定で指定した色で塗りつぶす // @かめぱすぬる
        type: 'func',
        josi: [],
        pure: true,
        fn: function (sys: NakoSystem): Promise<number> {
            const turtlesmooth = TurtleSmoothSystem.getTurtleSmooth(sys)
            return turtlesmooth.addJob(['fill'])
        }
    },
    'カメ文字描画': { // @カメの位置に文字Sを描画 // @かめもじびょうが
        type: 'func',
        josi: [['を', 'と', 'の']],
        pure: true,
        fn: function (s: string, sys: NakoSystem): Promise<number> {
            const turtlesmooth = TurtleSmoothSystem.getTurtleSmooth(sys)
            return turtlesmooth.addJob(['text', s])
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
            return turtlesmooth.addJob(['textset', s])
        }
    },
    'カメ塗色設定': { // @カメパスの塗り色をCに設定する // @かめぬりいろせってい
        type: 'func',
        josi: [['に', 'へ']],
        pure: true,
        fn: function (c: number|string, sys: NakoSystem): Promise<number> {
            const turtlesmooth = TurtleSmoothSystem.getTurtleSmooth(sys)
            return turtlesmooth.addJob(['fillStyle', c])
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
                promise = turtlesmooth.addJob(ca)
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
            return turtlesmooth.addJob(['visible', false])
        }
    },
    'カメ表示': { // @非表示にしたカメを表示する。 // @かめひょうじ
        type: 'func',
        josi: [],
        pure: true,
        fn: function (sys: NakoSystem): Promise<number> {
            const turtlesmooth = TurtleSmoothSystem.getTurtleSmooth(sys)
            return turtlesmooth.addJob(['visible', true])
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
    'カメ右曲': { // @カメを旋回半径Rで旋回円の角度DEGだけ前に進みながら右に旋回する // @かめみぎまがる
        type: 'func',
        josi: [['に', 'で'], ['だけ']],
        pure: true,
        fn: function (r:number, deg: number|string, sys: NakoSystem): Promise<number> {
            const turtlesmooth = TurtleSmoothSystem.getTurtleSmooth(sys)
            if (typeof deg === 'string') { deg = parseFloat(deg) }
            return turtlesmooth.addJob(['curve', r, deg, 1, 1])
        }
    },
    'カメ左曲': { // @カメを旋回半径Rで旋回円の角度DEGだけ前に進みながら左に旋回する // @かめひだりまがる
        type: 'func',
        josi: [['に', 'で'], ['だけ']],
        pure: true,
        fn: function (r:number, deg: number|string, sys: NakoSystem): Promise<number> {
            const turtlesmooth = TurtleSmoothSystem.getTurtleSmooth(sys)
            if (typeof deg === 'string') { deg = parseFloat(deg) }
            return turtlesmooth.addJob(['curve', r, deg, 1, -1])
        }
    },
    'カメ右曲戻': { // @カメを旋回半径Rで旋回円の角度DEGだけ後ろに戻りながら右に旋回する // @かめみぎまがりもどる
        type: 'func',
        josi: [['に', 'で'], ['だけ']],
        pure: true,
        fn: function (r:number, deg: number|string, sys: NakoSystem): Promise<number> {
            const turtlesmooth = TurtleSmoothSystem.getTurtleSmooth(sys)
            if (typeof deg === 'string') { deg = parseFloat(deg) }
            return turtlesmooth.addJob(['curve', r, deg, -1, 1])
        }
    },
    'カメ左曲戻': { // @カメを旋回半径Rで旋回円の角度DEGだけ後ろに戻りながら左に旋回する // @かめひだりまがりもどる
        type: 'func',
        josi: [['に', 'で'], ['だけ']],
        pure: true,
        fn: function (r:number, deg: number|string, sys: NakoSystem): Promise<number> {
            const turtlesmooth = TurtleSmoothSystem.getTurtleSmooth(sys)
            if (typeof deg === 'string') { deg = parseFloat(deg) }
            return turtlesmooth.addJob(['curve', r, deg, -1, -1])
        }
    },
    'カメ直接移動': { // @カメの位置を[x,y]へ移動する // @かめちょくせついどう
        type: 'func',
        josi: [['に', 'へ']],
        pure: true,
        fn: function (xy: NumericArray2, sys: NakoSystem): Promise<number> {
            const turtlesmooth = TurtleSmoothSystem.getTurtleSmooth(sys)
            return turtlesmooth.addJob(['directmv', xy[0], xy[1]])
        }
    },
    'カメ直接角度設定': { // @カメの向きをDEGに設定する // @かめちょくせつかくどせってい
        type: 'func',
        josi: [['に', 'へ', 'の']],
        pure: true,
        fn: function (deg: number|string, sys: NakoSystem): Promise<number> {
            const turtlesmooth = TurtleSmoothSystem.getTurtleSmooth(sys)
            if (typeof deg === 'string') { deg = parseFloat(deg) }
            return turtlesmooth.addJob(['directangle', deg])
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
            return turtlesmooth.addJob(['spdM', spd])
        }
    },
    'カメ回転速度設定': { // @カメペンが回転する際の速さをSPD(度/ミリ秒)に設定する // @かめかいてんそくどせってい
        type: 'func',
        josi: [['に', 'へ']],
        pure: true,
        fn: function (spd: number, sys: NakoSystem): Promise<number> {
            const turtlesmooth = TurtleSmoothSystem.getTurtleSmooth(sys)
            return turtlesmooth.addJob(['spdR', spd])
        }
    }
}

export default PluginTurtleSmooth

// scriptタグで取り込んだ時、自動で登録する
// @ts-ignore TS2339
if (typeof (navigator) === 'object' && typeof (navigator.nako3)) {
    navigator.nako3.addPluginObject('PluginTurtleSmooth', PluginTurtleSmooth)
}
