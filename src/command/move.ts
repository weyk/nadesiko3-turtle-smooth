import { CommandBase } from './core.js'
import { TurtleSmooth } from '../turtle.js'
import { Animation, Move as AMove, Rotate as ARotate } from '../animation/animation.js'

import type { CommandTarget } from './core.js'
import type { NumericArray2 } from '../turtle_type.js'

export class Move extends CommandBase {
    static cmd = 'mv'
    static cmdAlias = []
    p: NumericArray2
    direct: boolean
    constructor (p: NumericArray2, direct?: boolean) {
        super()
        this.p = p
        this.direct = !!direct
    }

    useAnimation (tt: CommandTarget) {
        return !this.direct && (tt.spdMove > 0 || tt.spdRotate > 0)
    }

    generateAnimationJob (tt: CommandTarget): Animation[] {
        const dx = this.p[0] - tt.x
        const dy = this.p[1] - tt.y
        const angleRad = Math.atan2(dy, dx)
        const angle = angleRad * 57.29577951308232
        const targetdir = (angle + 360) % 360
        let deg = (targetdir - tt.dir + 360) % 360
        if (deg > 180) {
            deg = deg - 360
        }
        const dir = deg < 0 ? 'l' : 'r'
        // カメの移動距離を算出
        const fdv = Math.sqrt(dx * dx + dy * dy)
        return [
            new ARotate(Math.abs(deg), dir),
            new AMove(fdv, 'f')
        ]
    }

    static parse (ca: string[]): null|Move {
        return new Move([parseFloat(ca[1]), parseFloat(ca[2])], false)
    }

    action (tt: TurtleSmooth):void {
        // 線を引く
        tt.raiseDrawCanvas('line', [[tt.x, tt.y], this.p])
        // カメの角度を変更
        const mvRad = Math.atan2(this.p[1] - tt.y, this.p[0] - tt.x)
        tt.dir = mvRad * 57.29577951308232
        tt.f_update = true
        // 実際に位置を移動
        tt.x = this.p[0]
        tt.y = this.p[1]
    }
}
