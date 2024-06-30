import { CommandBase } from './core.js'
import { TurtleSmooth } from '../turtle.js'

import type { StyleName } from './core.js'

export class SetStyle extends CommandBase {
    static cmd = 'style'
    static cmdAlias = ['fillStyle', 'strokeStyle', 'lineWidth', 'font', 'penDown', 'size', 'textset', 'penOn']
    name: StyleName
    value: any
    constructor (name: StyleName, value: any) {
        super()
        this.name = name
        this.value = value
    }

    static parse (ca: string[]): null|SetStyle {
        const cmdIndex = ca[0] === 'style' ? 1 : 0
        const cmd = ca[cmdIndex]
        const value = ca[cmdIndex + 1]
        if (cmd === 'fillStyle') {
            return new SetStyle('fillStyle', value)
        } else if (cmd === 'strokeStyle') {
            return new SetStyle('strokeStyle', value)
        } else if (cmd === 'lineWidth' || cmd === 'size') {
            return new SetStyle('lineWidth', value)
        } else if (cmd === 'font' || cmd === 'textset') {
            return new SetStyle('font', value)
        } else if (cmd === 'penDown' || cmd === 'penOn') {
            return new SetStyle('font', value)
        }
        return null
    }
    
    action (tt: TurtleSmooth):void {
        tt.raiseDrawCanvas(this.name, [this.value])
    }
}
