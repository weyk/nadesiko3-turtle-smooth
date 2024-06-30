import { TurtleSmooth } from '../turtle.js'
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
        const lrOpposite = { 'l': 'r', 'r': 'l' }
        if (deg < 0) {
            deg = -deg
            lr = lrOpposite[lr] as LeftOrRight
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
        this.remain = Math.abs(this.deg)
    }

    tick (tt: TurtleSmooth, time: number): number {
        const delta = time * tt.spdRotate
        if (delta < this.remain) {
            const direction = this.deg < 0 ? -1 : 1
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
        tt.dir = (this.originDir + (this.deg % 360) + 360) % 360
        return time
    }
}
