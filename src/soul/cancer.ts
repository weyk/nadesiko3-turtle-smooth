import { SoulBase, SoulType } from './core.js'
import { Command, Walk, Curve } from '../command/command.js'

export class Cancer implements SoulBase {
    type:SoulType

    constructor () {
        this.type = 'カニ'
    }

    walkValidation (cmd: Command): void {
        if (cmd instanceof Walk) {
            if (cmd.direction === 'f' || cmd.direction === 'b') {
                throw new Error(`${this.type}はその方向に進むことはできません`)
            }
        }
        if (cmd instanceof Curve) {
            if (cmd.dir === 'f' || cmd.dir === 'b') {
                throw new Error(`${this.type}はその方向に進むことはできません`)
            }
        }
    }

    getMoveDirection ():string {
        return 'lr'
    }
}
