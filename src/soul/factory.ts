import { Soul } from './soul.js'
import { SoulType } from './core.js'
import { Turtle } from './turtle.js'
import { Cancer } from './cancer.js'
import { Srawn } from './srawn.js'
import { Shark } from './shark.js'

export class SoulFactory {
    souls: Map<SoulType, Soul>
    constructor () {
        this.souls = new Map<SoulType, Soul>()
    }

    regist (soul: Soul):void {
        this.souls.set(soul.type, soul)
    }

    initRegist ():void {
        this.regist(new Turtle())
        this.regist(new Cancer())
        this.regist(new Srawn())
        this.regist(new Shark())
    }

    getSoul (type: SoulType): Soul {
        const soul = this.souls.get(type)
        if (!soul) { throw new Error(`不明な歩行種別${type}の生成が指定されてました`) }
        return soul
    }
}
