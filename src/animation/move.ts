import { TurtleSmooth } from '../turtle.js'
import { DirOpposite, DirToDeg } from '../turtle_const.js'
import type { AnimationBase, AnimationTarget } from './core.ts'
import type { NumericArray2, Direction } from '../turtle_type.js'

export class Move implements AnimationBase {
    cmd: 'move'
    len: number
    dir: Direction
    originPos: NumericArray2
    remain: number
    constructor (len: number, dir: Direction) {
        if (len < 0) {
            len = -len
            dir = DirOpposite[dir]
        }
        this.cmd = 'move'
        this.len = len
        this.dir = dir
        this.originPos = [0, 0]
        this.remain = 0
    }

    setup (tt: TurtleSmooth):void {
        this.originPos = [tt.x, tt.y]
        this.remain = Math.abs(this.len)
    }

    tick (tt: TurtleSmooth, time: number): number {
        const delta = time * tt.spdMove
        if (delta < this.remain) {
            const direction = this.len < 0 ? -1 : 1
            this.remain -= delta
            const dir = tt.dir + DirToDeg[this.dir]
            const rad = dir * 0.017453292519943295
            const vp = delta * direction
            const x2 = tt.x + Math.cos(rad) * vp
            const y2 = tt.y + Math.sin(rad) * vp
            tt.raiseDrawCanvas('line', [[tt.x, tt.y], [x2, y2]])
            tt.x = x2
            tt.y = y2
            time = 0
        }
        return time
    }

    end (tt: TurtleSmooth, time: number): number {
        if (tt.spdMove > 0) {
            time -= Math.floor(this.remain / tt.spdMove)
        }
        this.remain = 0
        const dir = tt.dir + DirToDeg[this.dir]
        const rad = dir * 0.017453292519943295
        const vp = this.len
        const x2 = this.originPos[0] + Math.cos(rad) * vp
        const y2 = this.originPos[1] + Math.sin(rad) * vp
        tt.raiseDrawCanvas('line', [[tt.x, tt.y], [x2, y2]])
        tt.x = x2
        tt.y = y2
        return time
    }
}
