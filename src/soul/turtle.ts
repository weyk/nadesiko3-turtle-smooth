import { SoulBase, SoulType } from './core.js'
import { Command, Walk, Curve } from '../command/command.js'

export class Turtle implements SoulBase {
    type:SoulType

    constructor () {
        this.type = 'カメ'
    }

    walkValidation (cmd: Command): void {
        if (cmd instanceof Walk) {
            if (cmd.direction === 'r' || cmd.direction === 'l') {
                throw new Error(`${this.type}はその方向に進むことはできません`)
            }
        }
        if (cmd instanceof Curve) {
            if (cmd.dir === 'l' || cmd.dir === 'r') {
                throw new Error(`${this.type}はその方向に進むことはできません`)
            }
        }
    }

    getMoveDirection ():string {
        return 'f'
    }
}
