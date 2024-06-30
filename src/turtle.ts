import * as Command from './command/command.js'
import { Runner as CommandRunner } from './command/runner.js'
import type { NumericArray2, DrawParams, LeftOrRight, Direction, WalkType, CallbackType } from './turtle_type.js'
import type { CanvasRect } from './turtle_system.js'
import type { AnimationTarget } from './animation/core.js'

class DrawCanvasEventArgs {
    id: number
    cmd: string
    params: DrawParams
    constructor (id: number, cmd: string, params: DrawParams) {
        this.id = id
        this.cmd = cmd
        this.params = params
    }
}

interface TurtleSmoothEventMap {
    imageChanged: CustomEvent<void>
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

const TypedTurtleSmoothEventTarget = EventTarget as { new(): TurtleSmoothEventTarget; prototype: TurtleSmoothEventTarget }

class TurtleSmooth extends TypedTurtleSmoothEventTarget implements AnimationTarget {
    id: number
    img: null | HTMLImageElement
    canvas: null | HTMLCanvasElement
    ctx: null | CanvasRenderingContext2D
    type: WalkType
    dir: number
    x: number
    y: number
    cw: number
    ch: number
    iw: number
    ih: number
    spdRotate: number
    spdMove: number
    f_update: boolean
    flagLoaded: boolean
    f_visible: boolean

    jobRunner: CommandRunner
    jobWait: number

    constructor (id: number) {
        super()
        this.id = id
        this.img = null
        this.canvas = null
        this.ctx = null
        this.type = 'カメ'
        this.dir = 270 // 上向き
        this.iw = 32
        this.ih = 32
        this.cw = this.iw * 1.5
        this.ch = this.ih * 1.5
        this.x = 0
        this.y = 0

        this.jobRunner = new CommandRunner(this)
        this.spdRotate = 15 / 100
        this.spdMove = 10 / 100

        this.f_update = true
        this.flagLoaded = false
        this.f_visible = true
        this.jobWait = 0
    }

    clear (): void {
        this.jobRunner.reset()
        if (this.ctx) {
            this.ctx = null
        }
        if (this.canvas) {
            document.body.removeChild(this.canvas)
            this.canvas = null
        }
        if (this.img) {
            this.img = null
        }
    }

    loadImage (url: string): void {
        if (!this.img) {
            const img = document.createElement('img')
            img.onload = () => {
                if (this.img) {
                    this.iw = this.img.width / 2
                    this.ih = this.img.height / 2
                } else {
                    this.iw = 32
                    this.ih = 32
                }
                if (!this.canvas) {
                    this.canvas = document.createElement('canvas')
                }
                this.canvas.id = this.id.toString()
                this.ctx = this.canvas.getContext('2d')
                // 回転中は対角線の長さ分が必要になる可能性がある
                this.canvas.width = this.iw * 3
                this.canvas.height = this.ih * 3
                this.cw = this.canvas.width / 2
                this.ch = this.canvas.height / 2
                this.flagLoaded = true
                this.f_update = true
                this.canvas.style.position = 'absolute'
                document.body.appendChild(this.canvas)
                this.raiseImageChangede()
            }
            img.onerror = () => {
                console.log('カメの読み込みに失敗')
                this.flagLoaded = true
                this.f_visible = false
                this.f_update = true
                this.raiseImageChangede()
            }
            this.img = img
        }
        this.img.src = url
    }

    drawTurtle (cr: CanvasRect): void {
        if (!this.canvas || !this.ctx || !this.img) {
            return
        }
        if (!cr.visible) {
            return
        }
        // カメの位置を移動
        this.canvas.style.left = (cr.left + this.x - this.cw) + 'px'
        this.canvas.style.top = (cr.top + this.y - this.ch) + 'px'
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
            this.ctx.translate(this.cw, this.ch)
            this.ctx.rotate(rad)
            this.ctx.translate(-(this.iw), -(this.ih))
            this.ctx.drawImage(this.img, 0, 0)
            this.ctx.restore()
        } else {
            this.ctx.drawImage(this.img, this.cw - this.iw, this.ch - this.ih)
        }
    }

    addCommand (command: Command.Command): Promise<number> {
        this.typeValidation(command)
        return this.jobRunner.add(command)
    }

    runJob (time: number, defaultWait: number, waitForTurteImage: boolean): boolean {
        if (!this.flagLoaded && waitForTurteImage) {
            // console.log('[TURTLE] waiting ...')
            return true
        }
        const immediateRun = defaultWait === 0
        // 以下の２つの条件を満たしている間ループする。
        // 即時実行であるか、即時実行ではない場合は経過時間の残りがあること。
        // 未処理のJOBが残っているか、処理中のJOBがあること。
        time = this.jobRunner.run(time, defaultWait, immediateRun)
        return (this.jobRunner.hasJob())
    }

    typeValidation (cmd: Command.Command): void {
        switch (this.type) {
        case 'カメ': {
            if (cmd instanceof Command.Walk) {
                if (cmd.direction === 'r' || cmd.direction === 'l') {
                    throw new Error(`${this.type}はその方向に進むことはできません`)
                }
            }
            if (cmd instanceof Command.Curve) {
                if (cmd.dir === 'l' || cmd.dir === 'r') {
                    throw new Error(`${this.type}はその方向に進むことはできません`)
                }
            }
            break
        }
        case 'カニ': {
            if (cmd instanceof Command.Walk) {
                if (cmd.direction === 'f' || cmd.direction === 'b') {
                    throw new Error(`${this.type}はその方向に進むことはできません`)
                }
            }
            if (cmd instanceof Command.Curve) {
                if (cmd.dir === 'f' || cmd.dir === 'b') {
                    throw new Error(`${this.type}はその方向に進むことはできません`)
                }
            }
            break
        }
        case 'エビ': {
            if (cmd instanceof Command.Walk) {
                if (cmd.direction === 'f' || cmd.direction === 'r' || cmd.direction === 'l') {
                    throw new Error(`${this.type}はその方向に進むことはできません`)
                }
            }
            if (cmd instanceof Command.Curve) {
                if (cmd.dir === 'f' || cmd.dir === 'l' || cmd.dir === 'r') {
                    throw new Error(`${this.type}はその方向に進むことはできません`)
                }
            }
            break
        }
        case 'サメ': {
            if (cmd instanceof Command.Walk) {
                if (cmd.direction === 'b' || cmd.direction === 'r' || cmd.direction === 'l') {
                    throw new Error(`${this.type}はその方向に進むことはできません`)
                }
            }
            if (cmd instanceof Command.Rotate) {
                throw new Error(`${this.type}はその方法での方向転換はできません`)
            }
            if (cmd instanceof Command.Angle && !cmd.direct) {
                throw new Error(`${this.type}はその方法での方向転換はできません`)
            }
            if (cmd instanceof Command.Move && !cmd.direct) {
                throw new Error(`${this.type}はその方法での方向転換を含む移動はできません`)
            }
            if (cmd instanceof Command.Curve) {
                if (cmd.dir === 'b' || cmd.dir === 'l' || cmd.dir === 'r') {
                    throw new Error(`${this.type}はその方向に進むことはできません`)
                }
            }
            break
        }
        }
    }

    raiseImageChangede (): void {
        const evt = new CustomEvent<void>('imageChanged')
        this.dispatchEvent(evt)
    }

    raiseDrawCanvas (cmd: string, params: DrawParams): void {
        const args = new DrawCanvasEventArgs(this.id, cmd, params)
        const evt = new CustomEvent<DrawCanvasEventArgs>('drawCanvas', { detail: args })
        this.dispatchEvent(evt)
    }
}

export { TurtleSmooth }
