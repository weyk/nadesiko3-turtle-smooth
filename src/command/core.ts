import { Command } from './command.js'
import { Animation } from '../animation/animation.js'
import { TurtleSmooth } from '../turtle.js'
import type { CallbackType } from '../turtle_type.js'

export type CanvasPathCommand = 'begin'|'close'
export type CanvasRawCommand = 'stroke'|'fill'
export type StyleName = 'fillStyle'|'strokeStyle'|'lineWidth'|'font'|'penDown'

interface CmdStatic {
    cmd: string
    cmdAlias: string[]
}
interface ParseStatic {
    parse (ca: string[]): Command|null
}
export function isCmdStatic (c: any):c is CmdStatic {
    return c.cmd !== undefined && c.cmdAlias !== undefined
}
export function isParseStatic (c: any):c is ParseStatic {
    return typeof c.parse === 'function'
}

export interface CommandTarget {
    x: number
    y: number
    dir: number
    spdMove: number
    spdRotate: number
}

export class CommandBase {
    actionTime: number
    waitTime: number
    resolve: CallbackType<number>
    reject: CallbackType<Error>
    constructor () {
        this.waitTime = 0
        this.actionTime = 0
        this.resolve = (result:number) => {}
        this.reject = (err:Error) => {}
    }

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

    getPromise(): Promise<number> {
        return new Promise<number>((resolve, reject) => {
            this.resolve = resolve
            this.reject = reject
        })
    }

    setup (tt: TurtleSmooth, defaultWaitTime: number, immediateRun: boolean):void {
        this.actionTime = Math.floor(defaultWaitTime / 2)
        this.waitTime = defaultWaitTime - this.actionTime
    }

    tick (tt: TurtleSmooth, time: number, immediateRun: boolean): number {
        if (this.actionTime > 0) {
            if (time < this.actionTime && !immediateRun) {
                this.actionTime -= time
                time = 0
            } else {
                if (!immediateRun) {
                    time -= this.actionTime
                }
                this.action(tt)
            }
        } else if (this.waitTime > 0) {
            if (time < this.waitTime && !immediateRun) {
                this.waitTime -= time
                time = 0
            } else {
                if (!immediateRun) {
                    time -= this.waitTime
                }
            }
        }
        return time
    }

    end (tt: TurtleSmooth, time: number): number {
        return time
    }

    parse (ca: string[]): Command|null {
        const c = this.constructor
        if (isParseStatic(c)) {
            return c.parse(ca)
        }
        return null
    }

    useAnimation (tt: CommandTarget) {
        return false
    }

    generateAnimationJob (tt: CommandTarget): Animation[] {
        return []
    }

    action (tt: TurtleSmooth):void {
        // noop
    }
}
