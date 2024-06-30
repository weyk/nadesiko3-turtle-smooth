import { TurtleSmooth } from '../turtle.js'
import type { AnimationBase } from './core.js'
import type { NumericArray2, Direction, LeftOrRight } from '../turtle_type.js'

export class Curve implements AnimationBase {
    cmd: 'curve'
    r: number
    deg: number
    dir: Direction
    lr: LeftOrRight
    centerPos: NumericArray2
    originPos: NumericArray2
    originDir: number
    remain: number
    constructor (r: number, deg: number, dir: Direction, lr: LeftOrRight) {
        const dirOpposite = { 'l': 'r', 'r': 'l', 'f': 'b', 'b': 'f' }
        const lrOpposite = { 'l': 'r', 'r': 'l' }
        if (deg < 0) {
            deg = -deg
            dir = dirOpposite[dir] as Direction
            lr = lrOpposite[lr] as LeftOrRight
        }
        this.cmd = 'curve'
        this.r = r
        this.deg = deg
        this.dir = dir
        this.lr = lr
        this.centerPos = [0, 0]
        this.originPos = [0, 0]
        this.originDir = 0
        this.remain = 0
    }

    setup (tt: TurtleSmooth):void {
        const lrToDeg = { 'l': -90, 'r': 90 }
        const dirToDeg = { 'l': 270, 'r': 90, 'f': 0, 'b': 180 }
        const dir = (tt.dir + dirToDeg[this.dir] + lrToDeg[this.lr] + 360) % 360
        const rad = dir * 0.017453292519943295
        const cx = tt.x + Math.cos(rad) * this.r
        const cy = tt.y + Math.sin(rad) * this.r
        this.centerPos = [cx, cy]
        this.originPos = [tt.x, tt.y]
        this.originDir = tt.dir
        this.remain = this.deg
    }

    tick (tt: TurtleSmooth, time: number): number {
        const lrToDeg = { 'l': -90, 'r': 90 }
        const dirToDeg = { 'l': 270, 'r': 90, 'f': 0, 'b': 180 }
        const deltaLen = time * tt.spdMove
        const delta = deltaLen / (this.r * 6.283185307179586) * 360
        if (delta < this.remain) {
            this.remain -= delta
            const clockWard = (this.lr === 'r') ? 1 : -1
            const deg1 = (tt.dir + dirToDeg[this.dir] - lrToDeg[this.lr] + 360) % 360
            tt.dir = (((tt.dir + delta * clockWard) % 360) + 360) % 360
            const dir = (tt.dir + dirToDeg[this.dir] - lrToDeg[this.lr] + 360) % 360
            const rad = dir * 0.017453292519943295
            const x2 = this.centerPos[0] + Math.cos(rad) * this.r
            const y2 = this.centerPos[1] + Math.sin(rad) * this.r
            // tt.raiseDrawCanvas('line', [[tt.x, tt.y], [x2, y2]])
            tt.raiseDrawCanvas('arc', [this.centerPos, this.r, deg1, dir, clockWard])
            tt.x = x2
            tt.y = y2
            time = 0
            tt.f_update = true
        }
        return time
    }

    end (tt: TurtleSmooth, time: number): number {
        const lrToDeg = { 'l': -90, 'r': 90 }
        const dirToDeg = { 'l': 270, 'r': 90, 'f': 0, 'b': 180 }
        if (tt.spdMove > 0) {
            const deltaLen = this.remain / 360 * (this.r * 6.283185307179586)
            time -= Math.floor(deltaLen / tt.spdMove)
        }
        this.remain = 0
        const clockWard = (this.lr === 'r') ? 1 : -1
        const deg1 = (tt.dir + dirToDeg[this.dir] - lrToDeg[this.lr] + 360) % 360
        tt.dir = (((this.originDir + this.deg * clockWard + 360) % 360) + 360) % 360
        const dir = (tt.dir + dirToDeg[this.dir] - lrToDeg[this.lr] + 360) % 360
        const rad = dir * 0.017453292519943295
        const ox = this.centerPos[0]
        const oy = this.centerPos[1]
        const x2 = ox + Math.cos(rad) * this.r
        const y2 = oy + Math.sin(rad) * this.r
        tt.raiseDrawCanvas('arc', [this.centerPos, this.r, deg1, dir, clockWard])
        tt.x = x2
        tt.y = y2
        // console.log(`${this.x},${this.y},${this.dir} - ${this.animationJob.dir}`)
        return time
    }
}
