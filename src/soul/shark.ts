import { SoulBase, SoulType } from './core.js'
import { Command, Walk, Rotate, Angle, Move, Curve } from '../command/command.js'

export class Shark implements SoulBase {
    type:SoulType

    constructor () {
        this.type = 'サメ'
    }

    walkValidation (cmd: Command): void {
        if (cmd instanceof Walk) {
            if (cmd.direction === 'b' || cmd.direction === 'r' || cmd.direction === 'l') {
                throw new Error(`${this.type}はその方向に進むことはできません`)
            }
        }
        if (cmd instanceof Rotate) {
            throw new Error(`${this.type}はその方法での方向転換はできません`)
        }
        if (cmd instanceof Angle && !cmd.direct) {
            throw new Error(`${this.type}はその方法での方向転換はできません`)
        }
        if (cmd instanceof Move && !cmd.direct) {
            throw new Error(`${this.type}はその方法での方向転換を含む移動はできません`)
        }
        if (cmd instanceof Curve) {
            if (cmd.dir === 'b' || cmd.dir === 'l' || cmd.dir === 'r') {
                throw new Error(`${this.type}はその方向に進むことはできません`)
            }
        }
    }

    getMoveDirection ():string {
        return 'f'
    }
}
