import { TurtleSmooth } from '../turtle.js'
import { Rotate } from './rotate.js'
import type { NumericArray2, LeftOrRight } from '../turtle_type.js'

export class RotateToDir extends Rotate {
    angle: number
    constructor (angle: number) {
        angle = ((angle % 360) + 360) % 360
        super(angle, 'r')
        this.angle = angle
    }

    setup (tt: TurtleSmooth):void {
        let deg = (this.angle - tt.dir + 360) % 360
        if (deg > 180) {
            deg = deg - 360
        }
        const dir = deg < 0 ? 'l' : 'r'
        this.deg = Math.abs(deg)
        this.lr = dir
        this.originPos = [tt.x, tt.y]
        this.originDir = tt.dir
        this.remain = Math.abs(this.deg)
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
        tt.dir = this.angle
        return time
    }
}
