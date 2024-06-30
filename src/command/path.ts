import { CommandBase } from './core.js'
import { TurtleSmooth } from '../turtle.js'
import type { CanvasPathCommand } from './core.js'

export class Path extends CommandBase {
    static cmd = 'path'
    static cmdAlias = ['begin', 'close']
    pathCmd: CanvasPathCommand
    constructor (pathCmd: CanvasPathCommand) {
        super()
        this.pathCmd = pathCmd
    }

    static parse (ca: string[]): null|Path {
        const cmdIndex = ca[0] === 'path' ? 1 : 0
        const cmd = ca[cmdIndex]
        if (cmd === 'begin' || cmd === 'close') {
            return new Path(cmd)
        }
        return null
    }

    action (tt: TurtleSmooth):void {
        if (this.pathCmd === 'begin') {
            tt.raiseDrawCanvas('beginPath', [tt.x, tt.y])
        } else {
            tt.raiseDrawCanvas('closePath', [])
        }
    }
}
