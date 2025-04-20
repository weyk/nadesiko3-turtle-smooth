import { CommandBase } from './core.js'
import { TurtleSmooth } from '../turtle.js'
import { Animation, Move as AMove, Rotate as ARotate } from '../animation/animation.js'

import type { CommandTarget } from './core.js'
import type { NumericArray2, Direction, LeftOrRight } from '../turtle_type.js'

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
        const fd = tt.soul.getMoveDirection()
        let lr:LeftOrRight
        let dir:Direction
        if (fd === 'lr') {
            dir = deg < 0 ? 'l' : 'r'
            deg = Math.abs(deg)
            if (deg < 90) {
                lr = dir === 'l' ? 'r' : 'l'
                deg = 90 - deg
            } else {
                lr = dir
                deg = deg - 90
            }
        } else if (fd === 'b') {
            lr = deg < 0 ? 'r' : 'l'
            deg = 180 - Math.abs(deg)
            dir = 'b'
        } else {
            lr = deg < 0 ? 'l' : 'r'
            deg = Math.abs(deg)
            dir = 'f'
        }
        // カメの移動距離を算出
        const fdv = Math.sqrt(dx * dx + dy * dy)
        return [
            new ARotate(deg, lr),
            new AMove(fdv, dir)
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
