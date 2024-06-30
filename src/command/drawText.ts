import { CommandBase } from './core.js'
import { TurtleSmooth } from '../turtle.js'

export class DrawText extends CommandBase {
    static cmd = 'text'
    static cmdAlias = []
    text: string
    constructor (text: string) {
        super()
        this.text = text
    }

    static parse (ca: string[]): null|DrawText {
        return new DrawText(ca[1])
    }

    action (tt: TurtleSmooth):void {
        tt.raiseDrawCanvas('fillText', [[tt.x, tt.y], this.text])
    }
}
