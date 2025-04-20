import { CommandBase } from './core.js'
import { TurtleSmooth } from '../turtle.js'
import { DirOpposite, DirToDeg } from '../turtle_const.js'
import { Animation, Move as AMove } from '../animation/animation.js'

import type { CommandTarget } from './core.js'
import type { Direction } from '../turtle_type.js'

export class Walk extends CommandBase {
    static cmd = 'fd'
    static cmdAlias = ['forward', 'back', 'backward', 'left', 'right']
    len: number
    direction: Direction
    constructor (len: number, direction: Direction) {
        super()
        this.len = len
        this.direction = direction
    }

    useAnimation (tt: CommandTarget) {
        return tt.spdMove > 0
    }

    generateAnimationJob (tt: CommandTarget): Animation[] {
        let fdv = this.len
        let dir = this.direction
        if (fdv < 0) {
            dir = DirOpposite[dir]
            fdv = -fdv
        }
        return [new AMove(fdv, dir)]
    }

    static parse (ca: string[]): null|Walk {
        if (ca[0] === 'fd') {
            const cmd = ca[2]
            const value = parseFloat(ca[1])
            switch (cmd) {
            case 'f':
            case '1':
                return new Walk(value, 'f')
            case 'b':
            case '-1':
                return new Walk(value, 'b')
            case 'l':
                return new Walk(value, 'l')
            case 'r':
                return new Walk(value, 'r')
            }
        } else {
            const cmd = ca[0]
            const value = parseFloat(ca[1])
            if (cmd === 'forward') {
                return new Walk(value, 'f')
            } else if (cmd === 'backward' || cmd === 'back') {
                return new Walk(value, 'b')
            } else if (cmd === 'left') {
                return new Walk(value, 'l')
            } else if (cmd === 'right') {
                return new Walk(value, 'r')
            }
        }
        return null
    }

    action (tt: TurtleSmooth):void {
        const fdv = this.len
        const dir = this.direction
        const deg = (tt.dir + DirToDeg[dir]) % 360
        const rad = deg * 0.017453292519943295
        const x2 = tt.x + Math.cos(rad) * fdv
        const y2 = tt.y + Math.sin(rad) * fdv
        tt.raiseDrawCanvas('line', [[tt.x, tt.y], [x2, y2]])
        tt.x = x2
        tt.y = y2
    }
}
