import { CommandBase } from './core.js'
import { Animation, Curve as ACurve } from '../animation/animation.js'
import { TurtleSmooth } from '../turtle.js'

import type { CommandTarget } from './core.js'
import type { LeftOrRight, Direction } from '../turtle_type.js'

export class Curve extends CommandBase {
    static cmd = 'curve'
    static cmdAlias = []
    r: number
    deg: number
    dir: Direction
    lr: LeftOrRight
    constructor (r: number, deg: number, dir: Direction, lr: LeftOrRight) {
        super()
        this.r = r
        this.deg = deg
        this.dir = dir
        this.lr = lr
    }

    useAnimation (tt: CommandTarget) {
        return tt.spdMove > 0
    }

    generateAnimationJob (tt: CommandTarget): Animation[] {
        let deg = this.deg
        let dir = this.dir
        if (deg < 0) {
            deg = -deg
            dir = dir === 'f' ? 'b' : 'f'
        }
        return [new ACurve(this.r, deg, dir, this.lr)]
    }

    static parse (ca: string[]): null|Curve {
        let r: number|null = null
        let deg: number|null = null
        let dir: Direction|null = null
        let lr: LeftOrRight|null = null
        for (const p of ca) {
            if (p === 'curve') {
                // command
            } else if (p === 'tl' || p === 'toleft') {
                lr = 'l'
            } else if (p === 'tr' || p === 'toright') {
                lr = 'r'
            } else if (p === 'l' || p === 'left') {
                dir = 'l'
            } else if (p === 'r' || p === 'right') {
                dir = 'r'
            } else if (p === 'f' || p === 'forward') {
                dir = 'f'
            } else if (p === 'b' || p === 'backward' || p === 'back') {
                dir = 'b'
            } else {
                if (r === null) {
                    r = parseFloat(p)
                } else if (deg === null) {
                    deg = parseFloat(p)
                }
            }
        }
        if (dir === null) {
            dir = 'f'
        }
        if (r === null || deg === null || lr === null) {
            return null
        }
        return new Curve(r, deg, dir, lr)
    }

    action (tt: TurtleSmooth):void {
        const r = this.r
        const deg = this.deg * (this.dir === 'b' ? -1 : 1)
        const dirDirection = this.lr === 'l' ? -1 : 1
        const degDirection = deg < 0 ? -1 : 1
        const dir = (tt.dir + 90 * dirDirection + 360) % 360
        const rad = dir * 0.017453292519943295
        const ox = tt.x + Math.cos(rad) * r
        const oy = tt.y + Math.sin(rad) * r
        const deg1 = (dir + 180) % 360
        const deg2 = (deg1 + (deg * dirDirection) % 360 + 360) % 360
        const rad2 = deg2 * 0.017453292519943295
        tt.raiseDrawCanvas('arc', [[ox, oy], r, deg1, deg2, degDirection * dirDirection])
        tt.dir = (tt.dir + (deg * dirDirection) % 360 + 360) % 360
        tt.x = ox + Math.cos(rad2) * r
        tt.y = oy + Math.sin(rad2) * r
        tt.f_update = true
    }
}
