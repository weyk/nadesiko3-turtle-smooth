import { CommandBase } from './core.js'
import { TurtleSmooth } from '../turtle.js'
import { Animation, Rotate as ARotate } from '../animation/animation.js'

import type { CommandTarget } from './core.js'
import type { LeftOrRight } from '../turtle_type.js'

export class Rotate extends CommandBase {
    static cmd = 'rot'
    static cmdAlias = ['rotR', 'rotL', 'rotate', 'rotateR', 'rotateL']
    deg: number
    lr: LeftOrRight
    constructor (deg: number, lr: LeftOrRight) {
        super()
        this.deg = deg
        this.lr = lr
    }

    useAnimation (tt: CommandTarget) {
        return tt.spdRotate > 0
    }

    generateAnimationJob (tt: CommandTarget): Animation[] {
        const deg = this.deg * (this.lr === 'l' ? -1 : 1)
        const dir = deg < 0 ? 'l' : 'r'
        return [new ARotate(Math.abs(deg), dir)]
    }

    static parse (ca: string[]): null|Rotate {
        if (ca[0] === 'rot' || ca[0] === 'rotate') {
            const cmd = ca[2]
            const value = parseFloat(ca[1])
            switch (cmd) {
            case 'r':
            case '1':
                return new Rotate(value, 'r')
            case 'l':
            case '-1':
                return new Rotate(value, 'l')
            }
        } else {
            const cmd = ca[0]
            const value = parseFloat(ca[1])
            if (cmd === 'rotR' || cmd === 'rotateR') {
                return new Rotate(value, 'r')
            } else if (cmd === 'rotL' || cmd === 'roteteL') {
                return new Rotate(value, 'l')
            }
        }
        return null
    }

    action (tt: TurtleSmooth):void {
        const deg = this.deg * (this.lr === 'l' ? -1 : 1)
        tt.dir = (tt.dir + (deg % 360) + 360) % 360
        tt.f_update = true
    }
}
