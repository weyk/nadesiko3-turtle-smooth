import { TurtleSmooth } from '../turtle.js'
import { LrOpposite } from '../turtle_const.js'

import type { AnimationBase } from './core.ts'
import type { NumericArray2, LeftOrRight } from '../turtle_type.js'

export class Rotate implements AnimationBase {
    cmd: 'rotate'
    deg: number
    lr: LeftOrRight
    originPos: NumericArray2
    originDir: number
    remain: number
    constructor (deg: number, lr: LeftOrRight) {
        if (deg < 0) {
            deg = -deg
            lr = LrOpposite[lr] as LeftOrRight
        }
        this.cmd = 'rotate'
        this.deg = deg
        this.lr = lr
        this.originPos = [0, 0]
        this.originDir = 0
        this.remain = 0
    }

    setup (tt: TurtleSmooth):void {
        this.originPos = [tt.x, tt.y]
        this.originDir = tt.dir
        this.remain = this.deg
    }

    tick (tt: TurtleSmooth, time: number): number {
        const delta = time * tt.spdRotate
        if (delta < this.remain) {
            const direction = this.lr === 'r' ? 1 : -1
            this.remain -= delta
            tt.dir = (tt.dir + (delta * direction % 360) + 360) % 360
            time = 0
            tt.f_update = true
        }
        return time
    }

    end (tt: TurtleSmooth, time: number): number {
        if (tt.spdRotate > 0) {
            time -= Math.floor(this.remain / tt.spdRotate)
        }
        this.remain = 0
        const direction = this.lr === 'r' ? 1 : -1
        tt.dir = (this.originDir + (this.deg * direction % 360) + 360) % 360
        return time
    }
}
