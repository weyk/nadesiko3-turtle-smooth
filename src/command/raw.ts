import { CommandBase } from './core.js'
import { TurtleSmooth } from '../turtle.js'
import type { CanvasRawCommand } from './core.js'

export class Raw extends CommandBase {
    static cmd = 'raw'
    static cmdAlias = ['stroke', 'fill']
    rawCmd: CanvasRawCommand
    constructor (rawCmd: CanvasRawCommand) {
        super()
        this.rawCmd = rawCmd
    }

    static parse (ca: string[]): null|Raw {
        const cmdIndex = ca[0] === 'raw' ? 1 : 0
        const cmd = ca[cmdIndex]
        if (cmd === 'stroke' || cmd === 'fill') {
            return new Raw(cmd)
        }
        return null
    }

    action (tt: TurtleSmooth):void {
        tt.raiseDrawCanvas(this.rawCmd, [])
    }
}
