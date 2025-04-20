import { CommandBase } from './core.js'
import { TurtleSmooth } from '../turtle.js'

export class SetImage extends CommandBase {
    static cmd = 'changemodel'
    static cmdAlias = []
    url: string
    constructor (url: string) {
        super()
        this.url = url
    }

    static parse (ca: string[]): null|SetImage {
        return new SetImage(ca[1])
    }

    setup (tt: TurtleSmooth):void {
        if (tt.img) {
            tt.flagLoaded = false
            tt.img.src = this.url
        }
    }

    action (tt: TurtleSmooth):void {
        // none
    }
}
