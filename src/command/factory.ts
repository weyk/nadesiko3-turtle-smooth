import { isCmdStatic, isParseStatic } from './core.js'
import * as Command from './command.js'

type CommandConstructor = typeof Object.constructor

export class CommandFactory {
    commands: CommandConstructor[]
    cmds: Map<string, CommandConstructor>
    constructor () {
        this.commands = []
        this.cmds = new Map<string, CommandConstructor>()
    }

    regist (command: CommandConstructor):void {
        this.commands.push(command)
        const cmd = command
        if (isCmdStatic(cmd)) {
            this.cmds.set(cmd.cmd, command)
            for (const alias of cmd.cmdAlias) {
                this.cmds.set(alias, command)
            }
        }
    }

    initRegist ():void {
        const commandList:CommandConstructor[] = [
            Command.Move,
            Command.Walk,
            Command.Rotate,
            Command.Jump,
            Command.Angle,
            Command.Curve,
            Command.Path,
            Command.Raw,
            Command.DrawText,
            Command.SetStyle,
            Command.SetVisible,
            Command.SetImage,
            Command.SetMoveSpeed,
            Command.SetRotateSpeed
        ]

        for (const command of commandList) {
            this.regist(command)
        }
    }

    parse (s: string): Command.Command|null {
        let c = s
        c = c.replace(/^([a-zA-Z_]+)\s*(\d+)/, '$1,$2')
        c = c.replace(/^([a-zA-Z_]+)\s*=/, '$1,')
        const ca = c.split(/\s*,\s*/)
        const cmdCon = this.cmds.get(ca[0])
        let command:Command.Command|null = null
        if (isParseStatic(cmdCon)) {
            command = cmdCon.parse(ca)
        }
        return command
    }
}
