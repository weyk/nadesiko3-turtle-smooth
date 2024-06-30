import { CommandBase } from './core.js'
import { TurtleSmooth } from '../turtle.js'

export class SetVisible extends CommandBase {
    static cmd = 'visible'
    static cmdAlias = []
    visible: boolean
    constructor (v: any) {
        super()
        this.visible = !!v
    }

    static parse (ca: string[]): null|SetVisible {
        return new SetVisible(ca[1])
    }

    action (tt: TurtleSmooth):void {
        tt.f_visible = this.visible
        tt.f_update = true
    }
}
