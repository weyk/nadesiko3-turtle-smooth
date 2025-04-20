import { CommandBase } from './core.js'
import { Animation, RotateToDir as ARotateToDir } from '../animation/animation.js'
import { TurtleSmooth } from '../turtle.js'

import type { CommandTarget } from './core.js'

export class Angle extends CommandBase {
    static cmd = 'angle'
    static cmdAlias = []
    deg: number
    direct: boolean
    constructor (deg: number, direct?: boolean) {
        super()
        this.deg = deg
        this.direct = !!direct
    }

    useAnimation (tt: CommandTarget) {
        return !this.direct && tt.spdRotate > 0
    }

    generateAnimationJob (tt: CommandTarget): Animation[] {
        const targetdir = (((this.deg - 90) % 360) + 360) % 360
        // let deg = (targetdir - tt.dir + 360) % 360
        // if (deg > 180) {
        //     deg = deg - 360
        // }
        // const dir = deg < 0 ? 'l' : 'r'
        return [new ARotateToDir(targetdir)]
    }

    static parse (ca: string[]): null|Angle {
        return new Angle(parseFloat(ca[1]), false)
    }

    action (tt: TurtleSmooth) {
        tt.dir = ((this.deg - 90 % 360) + 360) % 360
        tt.f_update = true
    }
}
