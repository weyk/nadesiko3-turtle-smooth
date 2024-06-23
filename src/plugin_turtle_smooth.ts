/**
 * smooth Turtle Graphics for Web browser (nadesiko3)
 * plugin_turtle_promise.ts
 */
// import { turtleImage, elephantImage, pandaImage } from 'nadesiko3/src/plugin_turtle_images.mjs'

import type { NakoSystem as NakoSystemBase } from 'nadesiko3core/src/plugin_api.mjs'

const turtleImageURL = 'https://n3s.nadesi.com/image.php?f=64.png'
const elephantImageURL = ''
const pandaImageURL = ''
const cancerImageURL = ''
const ebiImageURL = ''
const sharkImageURL = ''

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

type DrawParam = number|string|boolean|NumericArray2
type DrawParams = DrawParam[]
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

type CanvasPathCommand = 'begin'|'close'
type CanvasRawCommand = 'stroke'|'fill'
type StyleName = 'fillStyle'|'strokeStyle'|'lineWidth'|'font'|'penDown'
type WalkType = 'カメ'|'カニ'|'エビ'|'サメ'

interface CmdStatic {
    cmd: string
    cmdAlias: string[]
}
interface ParseStatic {
    parse (ca: string[]): Command|null
}
function isCmdStatic (c: any):c is CmdStatic {
    return c.cmd !== undefined && c.cmdAlias !== undefined
}
function isParseStatic (c: any):c is ParseStatic {
    return typeof c.parse === 'function'
}

class CommandBase {
    get cmd () {
        const c = this.constructor
        if (isCmdStatic(c)) {
            return c.cmd
        }
        return undefined
    }

    get cmdAlias () {
        const c = this.constructor
        if (isCmdStatic(c)) {
            return c.cmdAlias
        }
        return undefined
    }

    parse (ca: string[]): Command|null {
        const c = this.constructor
        if (isParseStatic(c)) {
            return c.parse(ca)
        }
        return null
    }
}

class CommandSetVisible extends CommandBase {
    static cmd = 'visible'
    static cmdAlias = []
    visible: boolean
    constructor (v: any) {
        super()
        this.visible = !!v
    }

    static parse (ca: string[]): null|Command {
        return new CommandSetVisible(ca[1])
    }
}

class CommandDrawText extends CommandBase {
    static cmd = 'text'
    static cmdAlias = []
    text: string
    constructor (text: string) {
        super()
        this.text = text
    }

    static parse (ca: string[]): null|Command {
        return new CommandDrawText(ca[1])
    }
}

class CommandPath extends CommandBase {
    static cmd = 'path'
    static cmdAlias = ['begin', 'close']
    pathCmd: CanvasPathCommand
    constructor (pathCmd: CanvasPathCommand) {
        super()
        this.pathCmd = pathCmd
    }

    static parse (ca: string[]): null|Command {
        const cmdIndex = ca[0] === 'path' ? 1 : 0
        const cmd = ca[cmdIndex]
        if (cmd === 'begin' || cmd === 'close') {
            return new CommandPath(cmd)
        }
        return null
    }
}

class CommandRaw extends CommandBase {
    static cmd = 'raw'
    static cmdAlias = ['stroke', 'fill']
    rawCmd: CanvasRawCommand
    constructor (rawCmd: CanvasRawCommand) {
        super()
        this.rawCmd = rawCmd
    }

    static parse (ca: string[]): null|Command {
        const cmdIndex = ca[0] === 'raw' ? 1 : 0
        const cmd = ca[cmdIndex]
        if (cmd === 'stroke' || cmd === 'fill') {
            return new CommandRaw(cmd)
        }
        return null
    }
}

class CommandSetStyle extends CommandBase {
    static cmd = 'style'
    static cmdAlias = ['fillStyle', 'strokeStyle', 'lineWidth', 'font', 'penDown', 'size', 'textset', 'penOn']
    name: StyleName
    value: any
    constructor (name: StyleName, value: any) {
        super()
        this.name = name
        this.value = value
    }

    static parse (ca: string[]): null|Command {
        const cmdIndex = ca[0] === 'style' ? 1 : 0
        const cmd = ca[cmdIndex]
        const value = ca[cmdIndex + 1]
        if (cmd === 'fillStyle') {
            return new CommandSetStyle('fillStyle', value)
        } else if (cmd === 'strokeStyle') {
            return new CommandSetStyle('strokeStyle', value)
        } else if (cmd === 'lineWidth' || cmd === 'size') {
            return new CommandSetStyle('lineWidth', value)
        } else if (cmd === 'font' || cmd === 'textset') {
            return new CommandSetStyle('font', value)
        } else if (cmd === 'penDown' || cmd === 'penOn') {
            return new CommandSetStyle('font', value)
        }
        return null
    }
}

class CommandSetTurtleImage extends CommandBase {
    static cmd = 'changemodel'
    static cmdAlias = []
    url: string
    constructor (url: string) {
        super()
        this.url = url
    }

    static parse (ca: string[]): null|Command {
        return new CommandSetTurtleImage(ca[1])
    }
}

class CommandCurve extends CommandBase {
    static cmd = 'curve'
    static cmdAlias = []
    r: number
    deg: number
    fb: ForwardOrBackward
    lr: LeftOrRight
    constructor (r: number, deg: number, fb: ForwardOrBackward, lr: LeftOrRight) {
        super()
        this.r = r
        this.deg = deg
        this.fb = fb
        this.lr = lr
    }

    static parse (ca: string[]): null|Command {
        let r: number|null = null
        let deg: number|null = null
        let fb: ForwardOrBackward|null = null
        let lr: LeftOrRight|null = null
        for (const p of ca) {
            if (p === 'curve') {
                // command
            } else if (p === 'l' || p === 'left') {
                lr = 'l'
            } else if (p === 'r' || p === 'right') {
                lr = 'r'
            } else if (p === 'f' || p === 'forward') {
                fb = 'f'
            } else if (p === 'b' || p === 'backward' || p === 'back') {
                fb = 'b'
            } else {
                if (r === null) {
                    r = parseFloat(p)
                } else if (deg === null) {
                    deg = parseFloat(p)
                }
            }
        }
        if (fb === null) {
            fb = 'f'
        }
        if (r === null || deg === null || lr === null) {
            return null
        }
        return new CommandCurve(r, deg, fb, lr)
    }
}

class CommandSetMoveSpeed extends CommandBase {
    static cmd = 'spdM'
    static cmdAlias = []
    spd: number
    constructor (spd: number) {
        super()
        this.spd = spd
    }

    static parse (ca: string[]): null|Command {
        return new CommandSetMoveSpeed(parseFloat(ca[1]))
    }
}

class CommandSetRotateSpeed extends CommandBase {
    static cmd = 'spdR'
    static cmdAlias = []
    spd: number
    constructor (spd: number) {
        super()
        this.spd = spd
    }

    static parse (ca: string[]): null|Command {
        return new CommandSetRotateSpeed(parseFloat(ca[1]))
    }
}

class CommandMove extends CommandBase {
    static cmd = 'mv'
    static cmdAlias = []
    p: NumericArray2
    direct: boolean
    constructor (p: NumericArray2, direct?: boolean) {
        super()
        this.p = p
        this.direct = !!direct
    }

    static parse (ca: string[]): null|Command {
        return new CommandMove([parseFloat(ca[1]), parseFloat(ca[2])], false)
    }
}

class CommandAngle extends CommandBase {
    static cmd = 'angle'
    static cmdAlias = []
    deg: number
    direct: boolean
    constructor (deg: number, direct?: boolean) {
        super()
        this.deg = deg
        this.direct = !!direct
    }

    static parse (ca: string[]): null|Command {
        return new CommandAngle(parseFloat(ca[1]), false)
    }
}

class CommandWalk extends CommandBase {
    static cmd = 'fd'
    static cmdAlias = ['forward', 'back', 'backward', 'left', 'right']
    len: number
    direction: Direction
    constructor (len: number, direction: Direction) {
        super()
        this.len = len
        this.direction = direction
    }

    static parse (ca: string[]): null|Command {
        if (ca[0] === 'fd') {
            const cmd = ca[2]
            const value = parseFloat(ca[1])
            switch (cmd) {
            case 'f':
            case '1':
                return new CommandWalk(value, 'f')
            case 'b':
            case '-1':
                return new CommandWalk(value, 'b')
            case 'l':
                return new CommandWalk(value, 'l')
            case 'r':
                return new CommandWalk(value, 'r')
            }
        } else {
            const cmd = ca[0]
            const value = parseFloat(ca[1])
            if (cmd === 'forward') {
                return new CommandWalk(value, 'f')
            } else if (cmd === 'backward' || cmd === 'back') {
                return new CommandWalk(value, 'b')
            } else if (cmd === 'left') {
                return new CommandWalk(value, 'l')
            } else if (cmd === 'right') {
                return new CommandWalk(value, 'r')
            }
        }
        return null
    }
}

class CommandRotate extends CommandBase {
    static cmd = 'rot'
    static cmdAlias = ['rotR', 'rotL', 'rotate', 'rotateR', 'rotateL']
    deg: number
    lr: LeftOrRight
    constructor (deg: number, lr: LeftOrRight) {
        super()
        this.deg = deg
        this.lr = lr
    }

    static parse (ca: string[]): null|Command {
        if (ca[0] === 'rot' || ca[0] === 'rotate') {
            const cmd = ca[2]
            const value = parseFloat(ca[1])
            switch (cmd) {
            case 'r':
            case '1':
                return new CommandRotate(value, 'r')
            case 'l':
            case '-1':
                return new CommandRotate(value, 'l')
            }
        } else {
            const cmd = ca[0]
            const value = parseFloat(ca[1])
            if (cmd === 'rotR' || cmd === 'rotateR') {
                return new CommandRotate(value, 'r')
            } else if (cmd === 'rptL' || cmd === 'roteteL') {
                return new CommandRotate(value, 'l')
            }
        }
        return null
    }
}

class CommandJump extends CommandBase {
    static cmd = 'xy'
    static cmdAlias = ['warp', 'jump']
    p: NumericArray2
    constructor (p: NumericArray2) {
        super()
        this.p = p
    }

    static parse (ca: string[]): null|Command {
        return new CommandJump([parseFloat(ca[1]), parseFloat(ca[2])])
    }
}

type Command =
    CommandMove|
    CommandWalk|
    CommandRotate|
    CommandJump|
    CommandAngle|
    CommandRaw|
    CommandPath|
    CommandDrawText|
    CommandSetStyle|
    CommandSetVisible|
    CommandSetTurtleImage|
    CommandCurve|
    CommandSetMoveSpeed|
    CommandSetRotateSpeed

type CommandConstructor = typeof Object.constructor

class CommandFactory {
    commands: CommandConstructor[]
    cmds: Map<string, CommandConstructor>
    constructor () {
        this.commands = []
        this.cmds = new Map<string, CommandConstructor>()
    }

    regist (command: CommandConstructor):void {
        this.commands.push(command)
        const cmd = command
        if (isCmdStatic(cmd)) {
            this.cmds.set(cmd.cmd, command)
            for (const alias of cmd.cmdAlias) {
                this.cmds.set(alias, command)
            }
        }
    }

    initRegist ():void {
        const commandList:CommandConstructor[] = [
            CommandMove,
            CommandWalk,
            CommandRotate,
            CommandJump,
            CommandAngle,
            CommandRaw,
            CommandPath,
            CommandDrawText,
            CommandSetStyle,
            CommandSetVisible,
            CommandSetTurtleImage,
            CommandCurve,
            CommandSetMoveSpeed,
            CommandSetRotateSpeed
        ]

        for (const command of commandList) {
            this.regist(command)
        }
    }

    parse (s: string): Command|null {
        let c = s
        c = c.replace(/^([a-zA-Z_]+)\s*(\d+)/, '$1,$2')
        c = c.replace(/^([a-zA-Z_]+)\s*=/, '$1,')
        const ca = c.split(/\s*,\s*/)
        const cmdCon = this.cmds.get(ca[0])
        let command:Command|null = null
        if (isParseStatic(cmdCon)) {
            command = cmdCon.parse(ca)
        }
        return command
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
type LeftOrRight = 'l'|'r'
type ForwardOrBackward = 'f'|'b'
type Direction = 'f'|'b'|'l'|'r'

interface AnimationJobBase {
    cmd: AnimationCmd
}

class AnimationJobMove implements AnimationJobBase {
    cmd: 'move'
    len: number
    dir: Direction
    constructor (len: number, dir: Direction) {
        this.cmd = 'move'
        this.len = len
        this.dir = dir
    }
}
class AnimationJobRotate implements AnimationJobBase {
    cmd: 'rotate'
    deg: number
    lr: LeftOrRight
    constructor (deg: number, lr: LeftOrRight) {
        this.cmd = 'rotate'
        this.deg = deg
        this.lr = lr
    }
}
class AnimationJobCurve implements AnimationJobBase {
    cmd: 'curve'
    r: number
    deg: number
    lr: LeftOrRight
    fb: ForwardOrBackward
    constructor (r: number, deg: number, fb: ForwardOrBackward, lr: LeftOrRight) {
        this.cmd = 'curve'
        this.r = r
        this.deg = deg
        this.fb = fb
        this.lr = lr
    }
}
type AnimationJob = AnimationJobMove|
                    AnimationJobRotate|
                    AnimationJobCurve

interface AnimationJobState {
    type: AnimationCmd
    origin: NumericArray2
    dir: number
    targetLen: number
    targetR?: number
    targetLr?: LeftOrRight
    targetDir?: Direction
    remain: number
}
type JobStepEnum = 'fetchJob'|'preExecute'|'beforeExecute'|'execute'|'afterExecute'|'animation'|'animationStep'|'animationAdjust'|'afterAnimation'
const TypedTurtleSmoothEventTarget = EventTarget as {new():TurtleSmoothEventTarget; prototype: TurtleSmoothEventTarget }

class TurtleSmooth extends TypedTurtleSmoothEventTarget {
    id: number
    img: null|HTMLImageElement
    canvas: null|HTMLCanvasElement
    ctx: null|CanvasRenderingContext2D
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
    jobs: Job[]
    currentJob: null|Job
    jobStep: JobStepEnum

    animationJobs: AnimationJob[]
    animationJob: null|AnimationJobState

    jobWait: number

    constructor (id: number) {
        super()
        this.id = id
        this.img = null
        this.canvas = null
        this.ctx = null
        this.type = 'カニ'
        this.dir = 270 // 上向き
        this.iw = 32
        this.ih = 32
        this.cw = this.iw * 1.5
        this.ch = this.ih * 1.5
        this.x = 0
        this.y = 0

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

    loadImage (url: string):void {
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

    drawTurtle (cr: CanvasRect):void {
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

    jobAction (job: Job):void {
        const cmd = job.command
        if (cmd instanceof CommandJump) {
            // 起点を移動する
            this.x = cmd.p[0]
            this.y = cmd.p[1]
        } else if (cmd instanceof CommandMove) {
            // 線を引く
            this.raiseDrawCanvas('line', [[this.x, this.y], cmd.p])
            // カメの角度を変更
            const mvRad = Math.atan2(cmd.p[1] - this.y, cmd.p[0] - this.x)
            this.dir = mvRad * 57.29577951308232
            this.f_update = true
            // 実際に位置を移動
            this.x = cmd.p[0]
            this.y = cmd.p[1]
        } else if (cmd instanceof CommandAngle) {
            this.dir = ((cmd.deg - 90 % 360) + 360) % 360
            this.f_update = true
        } else if (cmd instanceof CommandWalk) {
            const fdv = cmd.len
            const dir = cmd.direction
            const dirDeg = { 'l': 270, 'r': 90, 'f': 0, 'b': 180 }
            const deg = (this.dir + dirDeg[dir]) % 360
            const rad = deg * 0.017453292519943295
            const x2 = this.x + Math.cos(rad) * fdv
            const y2 = this.y + Math.sin(rad) * fdv
            this.raiseDrawCanvas('line', [[this.x, this.y], [x2, y2]])
            this.x = x2
            this.y = y2
        } else if (cmd instanceof CommandCurve) {
            const r = cmd.r
            const deg = cmd.deg * (cmd.fb === 'b' ? -1 : 1)
            const dirDirection = cmd.lr === 'l' ? -1 : 1
            const degDirection = deg < 0 ? -1 : 1
            const dir = (this.dir + 90 * dirDirection + 360) % 360
            const rad = dir * 0.017453292519943295
            const ox = this.x + Math.cos(rad) * r
            const oy = this.y + Math.sin(rad) * r
            const deg1 = (dir + 180) % 360
            const deg2 = (deg1 + (deg * dirDirection) % 360 + 360) % 360
            const rad2 = deg2 * 0.017453292519943295
            this.raiseDrawCanvas('arc', [[ox, oy], r, deg1, deg2, degDirection * dirDirection])
            this.dir = (this.dir + (deg * dirDirection) % 360 + 360) % 360
            this.x = ox + Math.cos(rad2) * r
            this.y = oy + Math.sin(rad2) * r
            this.f_update = true
        } else if (cmd instanceof CommandRotate) {
            const deg = cmd.deg * (cmd.lr === 'l' ? -1 : 1)
            this.dir = (this.dir + (deg % 360) + 360) % 360
            this.f_update = true
        } else if (cmd instanceof CommandSetVisible) {
            this.f_visible = cmd.visible
            this.f_update = true
        } else if (cmd instanceof CommandSetMoveSpeed) {
            this.spdMove = cmd.spd
        } else if (cmd instanceof CommandSetRotateSpeed) {
            this.spdRotate = cmd.spd
        } else if (cmd instanceof CommandSetStyle) {
            this.raiseDrawCanvas(cmd.name, [cmd.value])
        } else if (cmd instanceof CommandRaw) {
            this.raiseDrawCanvas(cmd.rawCmd, [])
        } else if (cmd instanceof CommandPath) {
            if (cmd.pathCmd === 'begin') {
                this.raiseDrawCanvas('beginPath', [this.x, this.y])
            } else {
                this.raiseDrawCanvas('closePath', [])
            }
        } else if (cmd instanceof CommandDrawText) {
            this.raiseDrawCanvas('fillText', [[this.x, this.y], cmd.text])
        }
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
                if (cmd instanceof CommandSetTurtleImage) {
                    if (this.img) {
                        this.flagLoaded = false
                        this.img.src = cmd.url
                    }
                } else {
                    if (!immediateRun) {
                        if (cmd instanceof CommandMove && !cmd.direct && (this.spdMove > 0 || this.spdRotate > 0)) {
                            // カメの角度を算出
                            const dx = cmd.p[0] - this.x
                            const dy = cmd.p[1] - this.y
                            const angleRad = Math.atan2(dy, dx)
                            const angle = angleRad * 57.29577951308232
                            const targetdir = (angle + 360) % 360
                            let deg = (targetdir - this.dir + 360) % 360
                            if (deg > 180) {
                                deg = deg - 360
                            }
                            const dir = deg < 0 ? 'l' : 'r'
                            // カメの移動距離を算出
                            const fdv = Math.sqrt(dx * dx + dy * dy)
                            this.animationJobs.push(new AnimationJobMove(fdv, 'f'))
                            this.animationJobs.push(new AnimationJobRotate(Math.abs(deg), dir))
                            this.jobStep = 'animation'
                            this.jobWait = 0
                        } else if (cmd instanceof CommandWalk && this.spdMove > 0) {
                            let fdv = cmd.len
                            let dir = cmd.direction
                            if (fdv < 0) {
                                const dirSwap:{[key: string]: Direction} = { 'f': 'b', 'b': 'f', 'l': 'r', 'r': 'l' }
                                dir = dirSwap[dir]
                                fdv = -fdv
                            }
                            this.animationJobs.push(new AnimationJobMove(fdv, dir))
                            this.jobStep = 'animation'
                            this.jobWait = 0
                        } else if (cmd instanceof CommandAngle && !cmd.direct && this.spdRotate > 0) {
                            const targetdir = (((cmd.deg - 90) % 360) + 360) % 360
                            let deg = (targetdir - this.dir + 360) % 360
                            if (deg > 180) {
                                deg = deg - 360
                            }
                            const dir = deg < 0 ? 'l' : 'r'
                            this.animationJobs.push(new AnimationJobRotate(Math.abs(deg), dir))
                            this.jobStep = 'animation'
                            this.jobWait = 0
                        } else if (cmd instanceof CommandRotate && this.spdRotate > 0) {
                            const deg = cmd.deg * (cmd.lr === 'l' ? -1 : 1)
                            const dir = deg < 0 ? 'l' : 'r'
                            this.animationJobs.push(new AnimationJobRotate(Math.abs(deg), dir))
                            this.jobStep = 'animation'
                            this.jobWait = 0
                        } else if (cmd instanceof CommandCurve && this.spdMove > 0) {
                            let deg = cmd.deg
                            let fb = cmd.fb
                            if (deg < 0) {
                                deg = -deg
                                fb = fb === 'f' ? 'b' : 'f'
                            }
                            this.animationJobs.push(new AnimationJobCurve(cmd.r, deg, fb, cmd.lr))
                            this.jobStep = 'animation'
                            this.jobWait = 0
                        }
                    }
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
                let lr:LeftOrRight|undefined
                let dir:Direction|undefined
                if (animJob instanceof AnimationJobMove) {
                    len = animJob.len
                    p = [this.x, this.y]
                    dir = animJob.dir
                } else if (animJob instanceof AnimationJobRotate) {
                    len = animJob.deg
                    p = [this.x, this.y]
                } else {
                    len = animJob.deg
                    r = animJob.r
                    lr = animJob.lr
                    const direction = lr === 'l' ? -1 : 1
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
                    targetLr: lr,
                    targetDir: dir,
                    remain: Math.abs(len)
                }
                if (animCmd === 'rotate' && this.spdRotate <= 0) {
                    this.jobStep = 'animationAdjust'
                } else if ((animCmd === 'move' || animCmd === 'curve') && this.spdMove <= 0) {
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
                        const direction = this.animationJob.targetLen < 0 ? -1 : 1
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
                    const delta = deltaLen / (r * 6.283185307179586) * 360
                    if (delta < this.animationJob.remain) {
                        const lr = this.animationJob.targetLr as LeftOrRight
                        const degDirection = this.animationJob.targetLen < 0 ? -1 : 1
                        const dirDirection = lr === 'l' ? -1 : 1
                        this.animationJob.remain -= delta
                        this.dir = (this.dir + (delta * degDirection * dirDirection % 360) + 360) % 360
                        const dir = (this.dir - 90 * dirDirection + 360) % 360
                        const rad = dir * 0.017453292519943295
                        const x2 = this.animationJob.origin[0] + Math.cos(rad) * r
                        const y2 = this.animationJob.origin[1] + Math.sin(rad) * r
                        this.raiseDrawCanvas('line', [[this.x, this.y], [x2, y2]])
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
                        const dirDeg = { 'l': 270, 'r': 90, 'f': 0, 'b': 180 }
                        const direction = this.animationJob.targetLen < 0 ? -1 : 1
                        this.animationJob.remain -= delta
                        const dir = this.dir + dirDeg[this.animationJob.targetDir!]
                        const rad = dir * 0.017453292519943295
                        const vp = delta * direction
                        const x2 = this.x + Math.cos(rad) * vp
                        const y2 = this.y + Math.sin(rad) * vp
                        this.raiseDrawCanvas('line', [[this.x, this.y], [x2, y2]])
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
                    const dirDirection = this.animationJob.targetLr === 'l' ? -1 : 1
                    const degDirection = this.animationJob.targetLen < 0 ? -1 : 1
                    const deg1 = (this.animationJob.dir - 90 * dirDirection + 180 + 360) % 360
                    this.dir = (this.animationJob.dir + (this.animationJob.targetLen * dirDirection) % 360 + 360) % 360
                    const dir = (this.dir - 90 * dirDirection + 360) % 360
                    const rad = dir * 0.017453292519943295
                    const ox = this.animationJob.origin[0]
                    const oy = this.animationJob.origin[1]
                    const x2 = ox + Math.cos(rad) * r
                    const y2 = oy + Math.sin(rad) * r
                    if (this.spdMove > 0) {
                        this.raiseDrawCanvas('line', [[this.x, this.y], [x2, y2]])
                    } else {
                        this.raiseDrawCanvas('arc', [[ox, oy], r, deg1, dir, degDirection * dirDirection])
                    }
                    this.x = x2
                    this.y = y2
                    // console.log(`${this.x},${this.y},${this.dir} - ${this.animationJob.dir}`)
                } else if (this.animationJob.type === 'move') {
                    if (this.spdMove > 0) {
                        time -= Math.floor(this.animationJob.remain / this.spdMove)
                    }
                    this.animationJob.remain = 0
                    const dirDeg = { 'l': 270, 'r': 90, 'f': 0, 'b': 180 }
                    const dir = this.dir + dirDeg[this.animationJob.targetDir!]
                    const rad = dir * 0.017453292519943295
                    const vp = this.animationJob.targetLen
                    const x2 = this.animationJob.origin[0] + Math.cos(rad) * vp
                    const y2 = this.animationJob.origin[1] + Math.sin(rad) * vp
                    this.raiseDrawCanvas('line', [[this.x, this.y], [x2, y2]])
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

    typeValidation (cmd: Command):void {
        switch (this.type) {
        case 'カメ':{
            if (cmd instanceof CommandWalk) {
                if (cmd.direction === 'r' || cmd.direction === 'l') {
                    throw new Error(`${this.type}はその方向に進むことはできません`)
                }
            }
            break
        }
        case 'カニ':{
            if (cmd instanceof CommandWalk) {
                if (cmd.direction === 'f' || cmd.direction === 'b') {
                    throw new Error(`${this.type}はその方向に進むことはできません`)
                }
            }
            if (cmd instanceof CommandCurve) {
                if (cmd.fb === 'f' || cmd.fb === 'b') {
                    throw new Error(`${this.type}はその方向に進むことはできません`)
                }
            }
            break
        }
        case 'エビ':{
            if (cmd instanceof CommandWalk) {
                if (cmd.direction === 'f' || cmd.direction === 'r' || cmd.direction === 'l') {
                    throw new Error(`${this.type}はその方向に進むことはできません`)
                }
            }
            if (cmd instanceof CommandCurve) {
                if (cmd.fb === 'f') {
                    throw new Error(`${this.type}はその方向に進むことはできません`)
                }
            }
            break
        }
        case 'サメ':{
            if (cmd instanceof CommandWalk) {
                if (cmd.direction === 'b' || cmd.direction === 'r' || cmd.direction === 'l') {
                    throw new Error(`${this.type}はその方向に進むことはできません`)
                }
            }
            if (cmd instanceof CommandRotate) {
                throw new Error(`${this.type}はその方法での方向転換はできません`)
            }
            if (cmd instanceof CommandAngle && !cmd.direct) {
                throw new Error(`${this.type}はその方法での方向転換はできません`)
            }
            if (cmd instanceof CommandMove && !cmd.direct) {
                throw new Error(`${this.type}はその方法での方向転換を含む移動はできません`)
            }
            if (cmd instanceof CommandCurve) {
                if (cmd.fb === 'b') {
                    throw new Error(`${this.type}はその方向に進むことはできません`)
                }
            }
            break
        }
        }
    }

    private raiseImageChangede () : void {
        const evt = new CustomEvent<void>('imageChanged')
        this.dispatchEvent(evt)
    }

    private raiseDrawCanvas (cmd: string, params: DrawParams) : void {
        const args = new DrawCanvasEventArgs(this.id, cmd, params)
        const evt = new CustomEvent<DrawCanvasEventArgs>('drawCanvas', { detail: args })
        this.dispatchEvent(evt)
    }
}

class TurtleSmoothSystem {
    private static instance: TurtleSmoothSystem
    private instanceCount: number
    sys: NakoSystem
    factory: CommandFactory
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

    line (id: number, p1: NumericArray2, p2: NumericArray2):void {
        /* istanbul ignore else */
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
        tt.typeValidation(command)
        return new Promise((resolve, reject) => {
            const job = new Job(command, resolve, reject)
            tt.jobs.push(job)
            this.setTimer()
        })
    }

    runJobAllTurtles (time: number, defaultWait: number, waitForTurteImage: boolean):boolean {
        let hasNext = false
        for (const tt of this.turtles) {
            hasNext = tt.runJob(time, defaultWait, waitForTurteImage) || hasNext
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
                hasNext = this.runJobAllTurtles(0, 0, false)
            }
        } else {
            // 一つずつ実行
            const waitForTurtleImage = wait > 0

            const hasNext = this.runJobAllTurtles(time, wait, waitForTurtleImage)
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

    createTurtle (imageUrl: string, type?: WalkType): number {
        // キャンバス情報は毎回参照する (#734)
        this.setupCanvas()
        // カメの情報をリストに追加
        const id = this.turtles.length
        const tt = new TurtleSmooth(id)
        this.turtles.push(tt)
        this.turtlePenStyles[id] = {
            lineWidth: 4,
            strokeStyle: 'black',
            fillStyle: 'black',
            font: '10px sans-serif',
            down: true
        }
        if (type !== undefined) {
            tt.type = type
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

const PluginTurtleSmooth: NakoPluginObject = {
    'meta': {
        type: 'const',
        value: {
            pluginName: 'plugin_turtle_smooth', // プラグインの名前
            description: 'スムースタートルグラフィックス用のプラグイン', // 説明
            pluginVersion: '3.6.0', // プラグインのバージョン
            nakoRuntime: ['wnako'], // 対象ランタイムzcx
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
    'カニ作成': { // @カニの画像でタートルグラフィックスを開始してIDを返す // @かにさくせい
        type: 'func',
        josi: [],
        pure: true,
        fn: function (sys: NakoSystem): number {
            const turtlesmooth = TurtleSmoothSystem.getTurtleSmooth(sys)
            const imageUrl = cancerImageURL
            return turtlesmooth.createTurtle(imageUrl, 'カニ')
        }
    },
    'エビ作成': { // @エビの画像でタートルグラフィックスを開始してIDを返す // @えびさくせい
        type: 'func',
        josi: [],
        pure: true,
        fn: function (sys: NakoSystem): number {
            const turtlesmooth = TurtleSmoothSystem.getTurtleSmooth(sys)
            const imageUrl = ebiImageURL
            return turtlesmooth.createTurtle(imageUrl, 'エビ')
        }
    },
    'サメ作成': { // @サメの画像でタートルグラフィックスを開始してIDを返す // @さめさくせい
        type: 'func',
        josi: [],
        pure: true,
        fn: function (sys: NakoSystem): number {
            const turtlesmooth = TurtleSmoothSystem.getTurtleSmooth(sys)
            const imageUrl = sharkImageURL
            return turtlesmooth.createTurtle(imageUrl, 'サメ')
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
            return turtlesmooth.addJob(new CommandSetTurtleImage(url))
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
            return turtlesmooth.addJob(new CommandMove([xy[0], xy[1]], false))
        }
    },
    'カメ起点移動': { // @カメの描画起点位置を[x,y]へ移動する // @かめきてんいどう
        type: 'func',
        josi: [['に', 'へ']],
        pure: true,
        fn: function (xy: NumericArray2, sys: NakoSystem): Promise<number> {
            const turtlesmooth = TurtleSmoothSystem.getTurtleSmooth(sys)
            return turtlesmooth.addJob(new CommandJump([xy[0], xy[1]]))
        }
    },
    'カメ進': { // @カメの位置をVだけ進める // @かめすすむ
        type: 'func',
        josi: [['だけ']],
        pure: true,
        fn: function (v: number|string, sys: NakoSystem): Promise<number> {
            const turtlesmooth = TurtleSmoothSystem.getTurtleSmooth(sys)
            if (typeof v === 'string') { v = parseFloat(v) }
            let dir: Direction = 'f'
            if (v < 0) { dir = 'b' }
            return turtlesmooth.addJob(new CommandWalk(Math.abs(v), dir))
        }
    },
    'カメ右進': { // @カメの位置をVだけ右に横に進める // @かめみぎすすむ
        type: 'func',
        josi: [['だけ']],
        pure: true,
        fn: function (v: number|string, sys: NakoSystem): Promise<number> {
            const turtlesmooth = TurtleSmoothSystem.getTurtleSmooth(sys)
            if (typeof v === 'string') { v = parseFloat(v) }
            let dir: Direction = 'r'
            if (v < 0) { dir = 'l' }
            return turtlesmooth.addJob(new CommandWalk(Math.abs(v), dir))
        }
    },
    'カメ左進': { // @カメの位置をVだけ左に横に進める // @かめひだりすすむ
        type: 'func',
        josi: [['だけ']],
        pure: true,
        fn: function (v: number|string, sys: NakoSystem): Promise<number> {
            const turtlesmooth = TurtleSmoothSystem.getTurtleSmooth(sys)
            if (typeof v === 'string') { v = parseFloat(v) }
            let dir: Direction = 'l'
            if (v < 0) { dir = 'r' }
            return turtlesmooth.addJob(new CommandWalk(Math.abs(v), dir))
        }
    },
    'カメ戻': { // @カメの位置をVだけ戻す // @かめもどる
        type: 'func',
        josi: [['だけ']],
        pure: true,
        fn: function (v: number|string, sys: NakoSystem): Promise<number> {
            const turtlesmooth = TurtleSmoothSystem.getTurtleSmooth(sys)
            if (typeof v === 'string') { v = parseFloat(v) }
            let dir: Direction = 'b'
            if (v < 0) { dir = 'f' }
            return turtlesmooth.addJob(new CommandWalk(Math.abs(v), dir))
        }
    },
    'カメ角度設定': { // @カメの向きをDEGに設定する // @かめかくどせってい
        type: 'func',
        josi: [['に', 'へ', 'の']],
        pure: true,
        fn: function (deg: number|string, sys: NakoSystem): Promise<number> {
            const turtlesmooth = TurtleSmoothSystem.getTurtleSmooth(sys)
            if (typeof deg === 'string') { deg = parseFloat(deg) }
            return turtlesmooth.addJob(new CommandAngle(deg, false))
        }
    },
    'カメ右回転': { // @カメの向きをDEGだけ右に向ける // @かめみぎかいてん
        type: 'func',
        josi: [['だけ']],
        pure: true,
        fn: function (deg: number|string, sys: NakoSystem): Promise<number> {
            const turtlesmooth = TurtleSmoothSystem.getTurtleSmooth(sys)
            if (typeof deg === 'string') { deg = parseFloat(deg) }
            let lr: LeftOrRight = 'r'
            if (deg < 0) { lr = 'l' }
            return turtlesmooth.addJob(new CommandRotate(Math.abs(deg), lr))
        }
    },
    'カメ左回転': { // @カメの向きをDEGだけ左に向ける // @かめひだりかいてん
        type: 'func',
        josi: [['だけ']],
        pure: true,
        fn: function (deg: number|string, sys: NakoSystem): Promise<number> {
            const turtlesmooth = TurtleSmoothSystem.getTurtleSmooth(sys)
            if (typeof deg === 'string') { deg = parseFloat(deg) }
            let lr: LeftOrRight = 'l'
            if (deg < 0) { lr = 'r' }
            return turtlesmooth.addJob(new CommandRotate(Math.abs(deg), lr))
        }
    },
    'カメペン色設定': { // @カメのペン描画色をCに設定する // @かめぺんいろせってい
        type: 'func',
        josi: [['に', 'へ']],
        pure: true,
        fn: function (c: number|string, sys: NakoSystem): Promise<number> {
            const turtlesmooth = TurtleSmoothSystem.getTurtleSmooth(sys)
            return turtlesmooth.addJob(new CommandSetStyle('strokeStyle', c))
        }
    },
    'カメペンサイズ設定': { // @カメペンのサイズをWに設定する // @かめぺんさいずせってい
        type: 'func',
        josi: [['に', 'へ']],
        pure: true,
        fn: function (w: number|string, sys: NakoSystem): Promise<number> {
            const turtlesmooth = TurtleSmoothSystem.getTurtleSmooth(sys)
            return turtlesmooth.addJob(new CommandSetStyle('lineWidth', w))
        }
    },
    'カメペン設定': { // @カメペンを使うかどうかをV(オン/オフ)に設定する // @かめぺんせってい
        type: 'func',
        josi: [['に', 'へ']],
        pure: true,
        fn: function (v: boolean|number|string, sys: NakoSystem): Promise<number> {
            const turtlesmooth = TurtleSmoothSystem.getTurtleSmooth(sys)
            return turtlesmooth.addJob(new CommandSetStyle('penDown', v))
        }
    },
    'カメパス開始': { // @カメで明示的にパスの描画を開始する // @かめぱすかいし
        type: 'func',
        josi: [],
        pure: true,
        fn: function (sys: NakoSystem): Promise<number> {
            const turtlesmooth = TurtleSmoothSystem.getTurtleSmooth(sys)
            return turtlesmooth.addJob(new CommandPath('begin'))
        }
    },
    'カメパス閉': { // @カメでパスを明示的に閉じる(省略可能) // @かめぱすとじる
        type: 'func',
        josi: [],
        pure: true,
        fn: function (sys: NakoSystem): Promise<number> {
            const turtlesmooth = TurtleSmoothSystem.getTurtleSmooth(sys)
            return turtlesmooth.addJob(new CommandPath('close'))
        }
    },
    'カメパス線引': { // @カメでパスを閉じて、カメペン色設定で指定した色で枠線を引く // @かめぱすせんひく
        type: 'func',
        josi: [],
        pure: true,
        fn: function (sys: NakoSystem): Promise<number> {
            const turtlesmooth = TurtleSmoothSystem.getTurtleSmooth(sys)
            return turtlesmooth.addJob(new CommandRaw('stroke'))
        }
    },
    'カメパス塗': { // @カメでパスを閉じて、カメ塗り色設定で指定した色で塗りつぶす // @かめぱすぬる
        type: 'func',
        josi: [],
        pure: true,
        fn: function (sys: NakoSystem): Promise<number> {
            const turtlesmooth = TurtleSmoothSystem.getTurtleSmooth(sys)
            return turtlesmooth.addJob(new CommandRaw('fill'))
        }
    },
    'カメ文字描画': { // @カメの位置に文字Sを描画 // @かめもじびょうが
        type: 'func',
        josi: [['を', 'と', 'の']],
        pure: true,
        fn: function (s: string, sys: NakoSystem): Promise<number> {
            const turtlesmooth = TurtleSmoothSystem.getTurtleSmooth(sys)
            return turtlesmooth.addJob(new CommandDrawText(s))
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
            return turtlesmooth.addJob(new CommandSetStyle('font', s))
        }
    },
    'カメ塗色設定': { // @カメパスの塗り色をCに設定する // @かめぬりいろせってい
        type: 'func',
        josi: [['に', 'へ']],
        pure: true,
        fn: function (c: number|string, sys: NakoSystem): Promise<number> {
            const turtlesmooth = TurtleSmoothSystem.getTurtleSmooth(sys)
            return turtlesmooth.addJob(new CommandSetStyle('fillStyle', c))
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
                const c = a[i]
                let cmd:Command|null
                try {
                    cmd = turtlesmooth.factory.parse(c)
                } catch (err) {
                    throw new Error(`カメコマンド実行の解析の際にエラーが発生しました:${i + 1}個目`)
                }
                if (!cmd) {
                    throw new Error(`カメコマンド実行に不明な命令がありました(${i + 1}個目)`)
                }
                promise = turtlesmooth.addJob(cmd)
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
            return turtlesmooth.addJob(new CommandSetVisible(false))
        }
    },
    'カメ表示': { // @非表示にしたカメを表示する。 // @かめひょうじ
        type: 'func',
        josi: [],
        pure: true,
        fn: function (sys: NakoSystem): Promise<number> {
            const turtlesmooth = TurtleSmoothSystem.getTurtleSmooth(sys)
            return turtlesmooth.addJob(new CommandSetVisible(true))
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
        fn: function (r: number, deg: number|string, sys: NakoSystem): Promise<number> {
            const turtlesmooth = TurtleSmoothSystem.getTurtleSmooth(sys)
            if (typeof deg === 'string') { deg = parseFloat(deg) }
            if (r < 0) {
                throw new Error('半径に負の値を指定することはできません')
            }
            let fb: ForwardOrBackward = 'f'
            if (deg < 0) { fb = 'b' }
            return turtlesmooth.addJob(new CommandCurve(r, Math.abs(deg), fb, 'r'))
        }
    },

    'カメ左曲': { // @カメを旋回半径Rで旋回円の角度DEGだけ前に進みながら左に旋回する // @かめひだりまがる
        type: 'func',
        josi: [['に', 'で'], ['だけ']],
        pure: true,
        fn: function (r: number, deg: number|string, sys: NakoSystem): Promise<number> {
            const turtlesmooth = TurtleSmoothSystem.getTurtleSmooth(sys)
            if (typeof deg === 'string') { deg = parseFloat(deg) }
            if (r < 0) {
                throw new Error('半径に負の値を指定することはできません')
            }
            let fb: ForwardOrBackward = 'f'
            if (deg < 0) { fb = 'b' }
            return turtlesmooth.addJob(new CommandCurve(r, Math.abs(deg), fb, 'l'))
        }
    },
    'カメ右曲戻': { // @カメを旋回半径Rで旋回円の角度DEGだけ後ろに戻りながら右に旋回する // @かめみぎまがりもどる
        type: 'func',
        josi: [['に', 'で'], ['だけ']],
        pure: true,
        fn: function (r: number, deg: number|string, sys: NakoSystem): Promise<number> {
            const turtlesmooth = TurtleSmoothSystem.getTurtleSmooth(sys)
            if (typeof deg === 'string') { deg = parseFloat(deg) }
            if (r < 0) {
                throw new Error('半径に負の値を指定することはできません')
            }
            let fb: ForwardOrBackward = 'b'
            if (deg < 0) { fb = 'f' }
            return turtlesmooth.addJob(new CommandCurve(r, Math.abs(deg), fb, 'r'))
        }
    },
    'カメ左曲戻': { // @カメを旋回半径Rで旋回円の角度DEGだけ後ろに戻りながら左に旋回する // @かめひだりまがりもどる
        type: 'func',
        josi: [['に', 'で'], ['だけ']],
        pure: true,
        fn: function (r:number, deg: number|string, sys: NakoSystem): Promise<number> {
            const turtlesmooth = TurtleSmoothSystem.getTurtleSmooth(sys)
            if (typeof deg === 'string') { deg = parseFloat(deg) }
            if (r < 0) {
                throw new Error('半径に負の値を指定することはできません')
            }
            let fb: ForwardOrBackward = 'b'
            if (deg < 0) { fb = 'f' }
            return turtlesmooth.addJob(new CommandCurve(r, Math.abs(deg), fb, 'l'))
        }
    },
    'カメ直接移動': { // @カメの位置を[x,y]へ移動する // @かめちょくせついどう
        type: 'func',
        josi: [['に', 'へ']],
        pure: true,
        fn: function (xy: NumericArray2, sys: NakoSystem): Promise<number> {
            const turtlesmooth = TurtleSmoothSystem.getTurtleSmooth(sys)
            return turtlesmooth.addJob(new CommandMove([xy[0], xy[1]], true))
        }
    },
    'カメ直接角度設定': { // @カメの向きをDEGに設定する // @かめちょくせつかくどせってい
        type: 'func',
        josi: [['に', 'へ', 'の']],
        pure: true,
        fn: function (deg: number|string, sys: NakoSystem): Promise<number> {
            const turtlesmooth = TurtleSmoothSystem.getTurtleSmooth(sys)
            if (typeof deg === 'string') { deg = parseFloat(deg) }
            return turtlesmooth.addJob(new CommandAngle(deg, true))
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
            return turtlesmooth.addJob(new CommandSetMoveSpeed(spd))
        }
    },
    'カメ回転速度設定': { // @カメペンが回転する際の速さをSPD(度/ミリ秒)に設定する // @かめかいてんそくどせってい
        type: 'func',
        josi: [['に', 'へ']],
        pure: true,
        fn: function (spd: number, sys: NakoSystem): Promise<number> {
            const turtlesmooth = TurtleSmoothSystem.getTurtleSmooth(sys)
            return turtlesmooth.addJob(new CommandSetRotateSpeed(spd))
        }
    }
}

export default PluginTurtleSmooth

// scriptタグで取り込んだ時、自動で登録する
// @ts-ignore TS2339
if (typeof (navigator) === 'object' && typeof (navigator.nako3)) {
    navigator.nako3.addPluginObject('PluginTurtleSmooth', PluginTurtleSmooth)
}
