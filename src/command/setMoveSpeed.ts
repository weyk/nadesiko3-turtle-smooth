import { CommandBase } from './core.js'
import { TurtleSmooth } from '../turtle.js'

export class SetMoveSpeed extends CommandBase {
    static cmd = 'spdM'
    static cmdAlias = []
    spd: number
    constructor (spd: number) {
        super()
        this.spd = spd
    }

    static parse (ca: string[]): null|SetMoveSpeed {
        return new SetMoveSpeed(parseFloat(ca[1]))
    }

    action (tt: TurtleSmooth):void {
        tt.spdMove = this.spd
    }
}
