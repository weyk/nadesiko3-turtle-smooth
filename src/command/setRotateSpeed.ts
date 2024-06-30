import { CommandBase } from './core.js'
import { TurtleSmooth } from '../turtle.js'

export class SetRotateSpeed extends CommandBase {
    static cmd = 'spdR'
    static cmdAlias = []
    spd: number
    constructor (spd: number) {
        super()
        this.spd = spd
    }

    static parse (ca: string[]): null|SetRotateSpeed {
        return new SetRotateSpeed(parseFloat(ca[1]))
    }

    action (tt: TurtleSmooth):void {
        tt.spdRotate = this.spd
    }
}
