import { CommandBase } from './core.js'
import { TurtleSmooth } from '../turtle.js'

import type { NumericArray2 } from '../turtle_type.js'

export class Jump extends CommandBase {
    static cmd = 'xy'
    static cmdAlias = ['warp', 'jump']
    p: NumericArray2
    constructor (p: NumericArray2) {
        super()
        this.p = p
    }

    static parse (ca: string[]): null|Jump {
        return new Jump([parseFloat(ca[1]), parseFloat(ca[2])])
    }

    action (tt: TurtleSmooth):void {
        // 起点を移動する
        tt.x = this.p[0]
        tt.y = this.p[1]
    }
}
