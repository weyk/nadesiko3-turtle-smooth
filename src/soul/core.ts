import { Command } from '../command/command.js'

export type SoulType = 'カメ'|'カニ'|'エビ'|'サメ'

export interface SoulBase {
    type: SoulType

    walkValidation (cmd: Command): void
    getMoveDirection ():string
}
