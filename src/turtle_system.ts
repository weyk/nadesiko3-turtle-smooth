import { TurtleSmooth } from './turtle.js'
import { CommandFactory } from './command/factory.js'
import { SoulType } from './soul/core.js'
import { SoulFactory } from './soul/factory.js'

import type { NakoSystem, NumericArray2, DrawParams } from './turtle_type.js'
import type { Command } from './command/command.js'

interface PenStyle {
    lineWidth: number
    fillStyle: string
    strokeStyle: string
    font: string
    down: boolean
}

export type CanvasRect = { left: number, top: number, width: number, height: number, visible: boolean}

class TurtleSmoothSystem {
    private static instance: TurtleSmoothSystem
    private instanceCount: number
    sys: NakoSystem
    factory: CommandFactory
    soulFactory: SoulFactory
    canvas: null|HTMLCanvasElement
    ctx: null|CanvasRenderingContext2D
    flagSetTimer: boolean
    fid: number
    lastStart: number
    turtles: TurtleSmooth[]
    turtlePenStyles: PenStyle[]
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
        this.factory = new CommandFactory()
        this.soulFactory = new SoulFactory()
        this.ctx = null
        this.canvas = null
        this.flagSetTimer = false
        this.instanceCount = 0
        this.lastStart = 0
        this.fid = -1
        this.turtles = [] // カメの一覧
        this.target = -1 // 操作対象のカメのID
        this.turtlePenStyles = []
        this.usePathId = null // パス描画中のカメのID
        this.factory.initRegist()
        this.soulFactory.initRegist()
    }

    clearAll ():void {
        // console.log('カメ全消去 turtles=', this.turtles)
        for (const tt of this.turtles) {
            tt.clear()
        }
        this.turtles = []
        if (this.canvas !== null && this.ctx !== null) {
            if (this.usePathId !== null) {
                this.ctx.closePath()
            }
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
        }
        this.target = -1
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
        const cr = this.getCanvasRect()
        if (!tt || !cr.visible) {
            return
        }
        tt.drawTurtle(cr)
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

    draw (id: number, cmd: string, params: DrawParams):void {
        const penStyle = this.turtlePenStyles[id]
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
            ctx.lineWidth = penStyle.lineWidth
            ctx.strokeStyle = penStyle.strokeStyle
            ctx.fillStyle = penStyle.fillStyle
            ctx.font = penStyle.font
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
        case 'line':{
            if (!penStyle.down) {
                return
            }
            if (this.ctx) {
                const p1 = params[0] as NumericArray2
                const p2 = params[1] as NumericArray2
                const ctx = this.ctx
                if (this.usePathId === id) {
                    ctx.lineTo(p2[0], p2[1])
                } else {
                    if (this.usePathId !== null) {
                        ctx.save()
                    }
                    ctx.beginPath()
                    if (this.turtles.length > 1) {
                        ctx.lineWidth = penStyle.lineWidth
                        ctx.strokeStyle = penStyle.strokeStyle
                        ctx.fillStyle = penStyle.fillStyle
                        ctx.font = penStyle.font
                    }
                    ctx.moveTo(p1[0], p1[1])
                    ctx.lineTo(p2[0], p2[1])
                    ctx.stroke()
                    if (this.usePathId !== null) {
                        ctx.restore()
                    }
                }
            }
            break
        }
        case 'arc':{
            if (!penStyle.down) {
                return
            }
            if (this.ctx) {
                const p1 = params[0] as NumericArray2
                const r = params[1] as number
                const degStart = params[2] as number
                const degEnd = params[3] as number
                const degDir = params[4] as number
                const radStart = degStart * 0.017453292519943295
                const radEnd = degEnd * 0.017453292519943295
                const ctx = this.ctx
                if (this.usePathId !== null) {
                    ctx.save()
                }
                ctx.beginPath()
                if (this.turtles.length > 1) {
                    ctx.lineWidth = penStyle.lineWidth
                    ctx.strokeStyle = penStyle.strokeStyle
                    ctx.fillStyle = penStyle.fillStyle
                }
                ctx.arc(p1[0], p1[1], r, radStart, radEnd, degDir < 0)
                ctx.stroke()
                if (this.usePathId !== null) {
                    ctx.restore()
                }
            }
            break
        }
        case 'font':{
            if (!this.ctx) { return }
            const s = params[0] as string
            if (this.usePathId === id || this.turtles.length === 1) {
                this.ctx.font = s
            }
            penStyle.font = s
            break
        }
        case 'fillStyle':{
            if (!this.ctx) { return }
            const s = params[0] as string
            if (this.usePathId === id || this.turtles.length === 1) {
                this.ctx.fillStyle = s
            }
            penStyle.fillStyle = s
            break
        }
        case 'strokeStyle':{
            if (!this.ctx) { return }
            const s = params[0] as string
            if (this.usePathId === id || this.turtles.length === 1) {
                this.ctx.strokeStyle = s
            }
            penStyle.strokeStyle = s
            break
        }
        case 'lineWidth':{
            if (!this.ctx) { return }
            const n = params[0] as number
            if (this.usePathId === id || this.turtles.length === 1) {
                this.ctx.lineWidth = n
            }
            penStyle.lineWidth = n
            break
        }
        case 'penDown':{
            const b = params[0] as boolean
            penStyle.down = b
            break
        }
        default:
            throw new Error(`カメから不明な描画要求(${cmd})を受け取りました`)
        }
    }

    addJob (command: Command): Promise<number> {
        const tt = this.getCur()
        const promise = tt.addCommand(command)
        this.setTimer()
        return promise
    }

    runJobAllTurtles (time: number, defaultWait: number, immediateRunAction: boolean, waitForTurteImage: boolean):boolean {
        let hasNext = false
        for (const tt of this.turtles) {
            hasNext = tt.runJob(time, defaultWait, immediateRunAction, waitForTurteImage) || hasNext
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
        const smooth = !!this.sys.__getSysVar('カメスムース移動')
        if (wait <= 0 && !smooth) {
            // 待ち時間なしで全部実行
            let hasNext = true
            while (hasNext) {
                hasNext = this.runJobAllTurtles(0, 0, !smooth, false)
            }
        } else {
            // 一つずつ実行
            const waitForTurtleImage = wait > 0

            const hasNext = this.runJobAllTurtles(time, wait, !smooth, waitForTurtleImage)
            if (hasNext) {
                this.fid = requestAnimationFrame((timestamp) => this.play(timestamp))
                return
            }
        }
        // console.log('[TURTLE] finished.')
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
        // console.log('カメ描画先=', canvasId)
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
    }

    getCanvasRect (): CanvasRect {
        const cv = this.canvas
        if (!cv) { return { left: 0, top: 0, width: 0, height: 0, visible: false } }
        let rect:{left:number, top:number, width:number, height: number}
        try {
            rect = cv.getBoundingClientRect()
        } catch (e) {
            rect = { left: 0, top: 0, width: 0, height: 0 }
        }
        const rx = rect.left + window.scrollX
        const ry = rect.top + window.scrollY
        return {
            'visible': (rect.width !== 0 && rect.height !== 0),
            'left': rx,
            'top': ry,
            width: cv.width,
            height: cv.height
        }
    }

    createTurtle (imageUrl: string, type: SoulType): number {
        // キャンバス情報は毎回参照する (#734)
        this.setupCanvas()
        // カメの情報をリストに追加
        const id = this.turtles.length
        const tt = new TurtleSmooth(id, this.soulFactory.getSoul(type))
        this.turtles.push(tt)
        this.turtlePenStyles[id] = {
            lineWidth: 4,
            strokeStyle: 'black',
            fillStyle: 'black',
            font: '10px sans-serif',
            down: true
        }
        this.target = id
        tt.addEventListener('drawCanvas', (e) => {
            this.draw(e.detail.id, e.detail.cmd, e.detail.params)
        })
        // 画像を読み込む
        tt.addEventListener('imageChanged', (e) => {
            this.drawTurtle(tt.id)
        })
        tt.loadImage(imageUrl)

        // デフォルト位置(中央)の設定
        const cr = this.getCanvasRect()
        tt.x = cr.width / 2
        tt.y = cr.height / 2
        return id
    }

    static getTurtleSmooth (sys: NakoSystem): TurtleSmoothSystem {
        if (!sys.tags.turtlesmooth) {
            throw new Error('プラグインの初期化が行われていません')
        }
        if (sys !== sys.tags.turtlesmooth.sys) {
            console.log('[turtle smooth] sysが変更されました。更新します。')
            sys.tags.turtlesmooth.sys = sys
        }
        return sys.tags.turtlesmooth
    }
}

export { TurtleSmoothSystem }
