/**
 * smooth Turtle Graphics for Web browser (nadesiko3)
 * plugin_turtle_promise.ts
 */

import { TurtleSmoothSystem } from './turtle_system.js'
import { TurtleSmooth } from './turtle.js'

import type { NakoSystem, NumericArray2, CallbackType, LeftOrRight, Direction } from './turtle_type.js'
import * as Command from './command/command.js'

const turtleImageURL = 'https://n3s.nadesi.com/image.php?f=64.png'
const elephantImageURL = ''
const pandaImageURL = ''
const cancerImageURL = 'https://n3s.nadesi.com/image.php?f=533.png'
const ebiImageURL = ''
const sharkImageURL = ''

declare global {
    interface Navigator {
        nako3: { addPluginObject: (name: string, obj: object) => void }
    }
}

type NakoRumtimeName = 'wnako'|'cnako'
interface NakoVariables {
    type: 'const'|'var'
    value: any
}
interface NakoFunction {
    type: 'func'
    josi: []|string[][]
    asyncFn?: boolean
    pure?: boolean
    fn: any
    return_none?: boolean
}
interface NakoMeta {
    type: 'const'
    value: {
        pluginName: string
        description: string
        pluginVersion: string
        nakoRuntime: NakoRumtimeName[]
        nakoVersion: string
    }
}
interface NakoPluginObject {
  [ index: string]: NakoVariables|NakoFunction|NakoMeta
}

const PluginTurtleSmooth: NakoPluginObject = {
    'meta': {
        type: 'const',
        value: {
            pluginName: 'plugin_turtle_smooth', // プラグインの名前
            description: 'スムースタートルグラフィックス用のプラグイン', // 説明
            pluginVersion: '3.6.0', // プラグインのバージョン
            nakoRuntime: ['wnako'], // 対象ランタイムzcx
            nakoVersion: '3.6.3' // 要求なでしこバージョン
        }
    },
    '初期化': {
        type: 'func',
        josi: [],
        pure: true,
        fn: function (sys: NakoSystem):void {
            const turtleSystem = TurtleSmoothSystem.getInstance(sys)
            sys.tags.turtlesmooth = turtleSystem
        }
    },
    '!クリア': {
        type: 'func',
        josi: [],
        pure: true,
        fn: function (sys: NakoSystem):void {
            if (sys.tags.turtlesmooth) {
                sys.tags.turtlesmooth.clearAll()
            }
        }
    },
    // @タートルグラフィックス・カメ描画
    'カメ作成': { // @タートルグラフィックスを開始してカメのIDを返す // @かめさくせい
        type: 'func',
        josi: [],
        pure: true,
        fn: function (sys: NakoSystem): number {
            const turtlesmooth = TurtleSmoothSystem.getTurtleSmooth(sys)
            const imageUrl = sys.__getSysVar('カメ画像URL')
            return turtlesmooth.createTurtle(imageUrl, 'カメ')
        }
    },
    'ゾウ作成': { // @ゾウの画像でタートルグラフィックスを開始してIDを返す // @ぞうさくせい
        type: 'func',
        josi: [],
        pure: true,
        fn: function (sys: NakoSystem): number {
            const turtlesmooth = TurtleSmoothSystem.getTurtleSmooth(sys)
            const imageUrl = sys.__getSysVar('ゾウ画像URL')
            return turtlesmooth.createTurtle(imageUrl, 'カメ')
        }
    },
    'パンダ作成': { // @パンダの画像でタートルグラフィックスを開始してIDを返す // @ぱんださくせい
        type: 'func',
        josi: [],
        pure: true,
        fn: function (sys: NakoSystem): number {
            const turtlesmooth = TurtleSmoothSystem.getTurtleSmooth(sys)
            const imageUrl = sys.__getSysVar('パンダ画像URL')
            return turtlesmooth.createTurtle(imageUrl, 'カメ')
        }
    },
    'カニ作成': { // @カニの画像でタートルグラフィックスを開始してIDを返す // @かにさくせい
        type: 'func',
        josi: [],
        pure: true,
        fn: function (sys: NakoSystem): number {
            const turtlesmooth = TurtleSmoothSystem.getTurtleSmooth(sys)
            const imageUrl = sys.__getSysVar('カニ画像URL')
            return turtlesmooth.createTurtle(imageUrl, 'カニ')
        }
    },
    'エビ作成': { // @エビの画像でタートルグラフィックスを開始してIDを返す // @えびさくせい
        type: 'func',
        josi: [],
        pure: true,
        fn: function (sys: NakoSystem): number {
            const turtlesmooth = TurtleSmoothSystem.getTurtleSmooth(sys)
            const imageUrl = sys.__getSysVar('カメ画像URL')
            return turtlesmooth.createTurtle(imageUrl, 'エビ')
        }
    },
    'サメ作成': { // @サメの画像でタートルグラフィックスを開始してIDを返す // @さめさくせい
        type: 'func',
        josi: [],
        pure: true,
        fn: function (sys: NakoSystem): number {
            const turtlesmooth = TurtleSmoothSystem.getTurtleSmooth(sys)
            const imageUrl = sys.__getSysVar('サメ画像URL')
            return turtlesmooth.createTurtle(imageUrl, 'サメ')
        }
    },
    'カメ操作対象設定': { // @IDを指定して操作対象となるカメを変更する // @かめそうさたいしょうせってい
        type: 'func',
        josi: [['に', 'へ', 'の']],
        pure: true,
        fn: function (id: number, sys: NakoSystem):void {
            const turtlesmooth = TurtleSmoothSystem.getTurtleSmooth(sys)
            turtlesmooth.target = id
        }
    },
    'カメ描画先': { type: 'var', value: '#turtle_cv' }, // @かめびょうがさき
    'カメ画像URL': { type: 'var', value: turtleImageURL }, // @かめがぞうURL
    'ゾウ画像URL': { type: 'var', value: elephantImageURL }, // @ぞうがぞうURL
    'パンダ画像URL': { type: 'var', value: pandaImageURL }, // @ぱんだがぞうURL
    'カニ画像URL': { type: 'var', value: cancerImageURL }, // @かにがぞうURL
    'エビ画像URL': { type: 'var', value: ebiImageURL }, // @えびがぞうURL
    'サメ画像URL': { type: 'var', value: sharkImageURL }, // @さめがぞうURL
    'カメ画像変更': { // @カメの画像をURLに変更する // @かめがぞうへんこう
        type: 'func',
        josi: [['に', 'へ']],
        pure: true,
        fn: function (url: string, sys: NakoSystem): Promise<number> {
            const turtlesmooth = TurtleSmoothSystem.getTurtleSmooth(sys)
            return turtlesmooth.addJob(new Command.SetImage(url))
        }
    },
    'カメ速度': { type: 'const', value: 100 }, // @かめそくど
    'カメ速度設定': { // @カメの動作速度vに設定(大きいほど遅い) // @かめそくどせってい
        type: 'func',
        josi: [['に', 'へ']],
        pure: true,
        fn: function (v: number|string, sys: NakoSystem):void {
            sys.__setSysVar('カメ速度', v)
        },
        return_none: true
    },
    'カメ移動': { // @カメの位置を[x,y]へ移動する // @かめいどう
        type: 'func',
        josi: [['に', 'へ']],
        pure: true,
        fn: function (xy: NumericArray2, sys: NakoSystem): Promise<number> {
            const turtlesmooth = TurtleSmoothSystem.getTurtleSmooth(sys)
            return turtlesmooth.addJob(new Command.Move([xy[0], xy[1]], false))
        }
    },
    'カメ起点移動': { // @カメの描画起点位置を[x,y]へ移動する // @かめきてんいどう
        type: 'func',
        josi: [['に', 'へ']],
        pure: true,
        fn: function (xy: NumericArray2, sys: NakoSystem): Promise<number> {
            const turtlesmooth = TurtleSmoothSystem.getTurtleSmooth(sys)
            return turtlesmooth.addJob(new Command.Jump([xy[0], xy[1]]))
        }
    },
    'カメ進': { // @カメの位置をVだけ進める // @かめすすむ
        type: 'func',
        josi: [['だけ']],
        pure: true,
        fn: function (v: number|string, sys: NakoSystem): Promise<number> {
            const turtlesmooth = TurtleSmoothSystem.getTurtleSmooth(sys)
            if (typeof v === 'string') { v = parseFloat(v) }
            let dir: Direction = 'f'
            if (v < 0) { dir = 'b' }
            return turtlesmooth.addJob(new Command.Walk(Math.abs(v), dir))
        }
    },
    'カメ右進': { // @カメの位置をVだけ右に横に進める // @かめみぎすすむ
        type: 'func',
        josi: [['だけ']],
        pure: true,
        fn: function (v: number|string, sys: NakoSystem): Promise<number> {
            const turtlesmooth = TurtleSmoothSystem.getTurtleSmooth(sys)
            if (typeof v === 'string') { v = parseFloat(v) }
            let dir: Direction = 'r'
            if (v < 0) { dir = 'l' }
            return turtlesmooth.addJob(new Command.Walk(Math.abs(v), dir))
        }
    },
    'カメ左進': { // @カメの位置をVだけ左に横に進める // @かめひだりすすむ
        type: 'func',
        josi: [['だけ']],
        pure: true,
        fn: function (v: number|string, sys: NakoSystem): Promise<number> {
            const turtlesmooth = TurtleSmoothSystem.getTurtleSmooth(sys)
            if (typeof v === 'string') { v = parseFloat(v) }
            let dir: Direction = 'l'
            if (v < 0) { dir = 'r' }
            return turtlesmooth.addJob(new Command.Walk(Math.abs(v), dir))
        }
    },
    'カメ戻': { // @カメの位置をVだけ戻す // @かめもどる
        type: 'func',
        josi: [['だけ']],
        pure: true,
        fn: function (v: number|string, sys: NakoSystem): Promise<number> {
            const turtlesmooth = TurtleSmoothSystem.getTurtleSmooth(sys)
            if (typeof v === 'string') { v = parseFloat(v) }
            let dir: Direction = 'b'
            if (v < 0) { dir = 'f' }
            return turtlesmooth.addJob(new Command.Walk(Math.abs(v), dir))
        }
    },
    'カメ角度設定': { // @カメの向きをDEGに設定する // @かめかくどせってい
        type: 'func',
        josi: [['に', 'へ', 'の']],
        pure: true,
        fn: function (deg: number|string, sys: NakoSystem): Promise<number> {
            const turtlesmooth = TurtleSmoothSystem.getTurtleSmooth(sys)
            if (typeof deg === 'string') { deg = parseFloat(deg) }
            return turtlesmooth.addJob(new Command.Angle(deg, false))
        }
    },
    'カメ右回転': { // @カメの向きをDEGだけ右に向ける // @かめみぎかいてん
        type: 'func',
        josi: [['だけ']],
        pure: true,
        fn: function (deg: number|string, sys: NakoSystem): Promise<number> {
            const turtlesmooth = TurtleSmoothSystem.getTurtleSmooth(sys)
            if (typeof deg === 'string') { deg = parseFloat(deg) }
            let lr: LeftOrRight = 'r'
            if (deg < 0) { lr = 'l' }
            return turtlesmooth.addJob(new Command.Rotate(Math.abs(deg), lr))
        }
    },
    'カメ左回転': { // @カメの向きをDEGだけ左に向ける // @かめひだりかいてん
        type: 'func',
        josi: [['だけ']],
        pure: true,
        fn: function (deg: number|string, sys: NakoSystem): Promise<number> {
            const turtlesmooth = TurtleSmoothSystem.getTurtleSmooth(sys)
            if (typeof deg === 'string') { deg = parseFloat(deg) }
            let lr: LeftOrRight = 'l'
            if (deg < 0) { lr = 'r' }
            return turtlesmooth.addJob(new Command.Rotate(Math.abs(deg), lr))
        }
    },
    'カメペン色設定': { // @カメのペン描画色をCに設定する // @かめぺんいろせってい
        type: 'func',
        josi: [['に', 'へ']],
        pure: true,
        fn: function (c: number|string, sys: NakoSystem): Promise<number> {
            const turtlesmooth = TurtleSmoothSystem.getTurtleSmooth(sys)
            return turtlesmooth.addJob(new Command.SetStyle('strokeStyle', c))
        }
    },
    'カメペンサイズ設定': { // @カメペンのサイズをWに設定する // @かめぺんさいずせってい
        type: 'func',
        josi: [['に', 'へ']],
        pure: true,
        fn: function (w: number|string, sys: NakoSystem): Promise<number> {
            const turtlesmooth = TurtleSmoothSystem.getTurtleSmooth(sys)
            return turtlesmooth.addJob(new Command.SetStyle('lineWidth', w))
        }
    },
    'カメペン設定': { // @カメペンを使うかどうかをV(オン/オフ)に設定する // @かめぺんせってい
        type: 'func',
        josi: [['に', 'へ']],
        pure: true,
        fn: function (v: boolean|number|string, sys: NakoSystem): Promise<number> {
            const turtlesmooth = TurtleSmoothSystem.getTurtleSmooth(sys)
            return turtlesmooth.addJob(new Command.SetStyle('penDown', v))
        }
    },
    'カメパス開始': { // @カメで明示的にパスの描画を開始する // @かめぱすかいし
        type: 'func',
        josi: [],
        pure: true,
        fn: function (sys: NakoSystem): Promise<number> {
            const turtlesmooth = TurtleSmoothSystem.getTurtleSmooth(sys)
            return turtlesmooth.addJob(new Command.Path('begin'))
        }
    },
    'カメパス閉': { // @カメでパスを明示的に閉じる(省略可能) // @かめぱすとじる
        type: 'func',
        josi: [],
        pure: true,
        fn: function (sys: NakoSystem): Promise<number> {
            const turtlesmooth = TurtleSmoothSystem.getTurtleSmooth(sys)
            return turtlesmooth.addJob(new Command.Path('close'))
        }
    },
    'カメパス線引': { // @カメでパスを閉じて、カメペン色設定で指定した色で枠線を引く // @かめぱすせんひく
        type: 'func',
        josi: [],
        pure: true,
        fn: function (sys: NakoSystem): Promise<number> {
            const turtlesmooth = TurtleSmoothSystem.getTurtleSmooth(sys)
            return turtlesmooth.addJob(new Command.Raw('stroke'))
        }
    },
    'カメパス塗': { // @カメでパスを閉じて、カメ塗り色設定で指定した色で塗りつぶす // @かめぱすぬる
        type: 'func',
        josi: [],
        pure: true,
        fn: function (sys: NakoSystem): Promise<number> {
            const turtlesmooth = TurtleSmoothSystem.getTurtleSmooth(sys)
            return turtlesmooth.addJob(new Command.Raw('fill'))
        }
    },
    'カメ文字描画': { // @カメの位置に文字Sを描画 // @かめもじびょうが
        type: 'func',
        josi: [['を', 'と', 'の']],
        pure: true,
        fn: function (s: string, sys: NakoSystem): Promise<number> {
            const turtlesmooth = TurtleSmoothSystem.getTurtleSmooth(sys)
            return turtlesmooth.addJob(new Command.DrawText(s))
        }
    },
    'カメ文字設定': { // @カメ文字描画で描画するテキストサイズやフォント(48px serif)などを設定 // @かめもじせってい
        type: 'func',
        josi: [['に', 'へ', 'で']],
        pure: true,
        fn: function (s: string, sys: NakoSystem): Promise<number> {
            const turtlesmooth = TurtleSmoothSystem.getTurtleSmooth(sys)
            s = '' + s // 文字列に
            if (s.match(/^\d+$/)) {
                s = s + 'px serif'
            } else if (s.match(/^\d+(px|em)$/)) {
                s = s + ' serif'
            }
            return turtlesmooth.addJob(new Command.SetStyle('font', s))
        }
    },
    'カメ塗色設定': { // @カメパスの塗り色をCに設定する // @かめぬりいろせってい
        type: 'func',
        josi: [['に', 'へ']],
        pure: true,
        fn: function (c: number|string, sys: NakoSystem): Promise<number> {
            const turtlesmooth = TurtleSmoothSystem.getTurtleSmooth(sys)
            return turtlesmooth.addJob(new Command.SetStyle('fillStyle', c))
        }
    },
    'カメ全消去': { // @表示しているカメと描画内容を全部消去する // @かめぜんしょうきょ
        type: 'func',
        josi: [],
        pure: true,
        fn: function (sys: NakoSystem):void {
            const turtlesmooth = TurtleSmoothSystem.getTurtleSmooth(sys)
            turtlesmooth.clearAll()
        },
        return_none: true
    },
    'カメコマンド実行': { // @カメにコマンドSを実行する。コマンドは改行か「;」で区切る。コマンドと引数は「=」で区切り引数はかカンマで区切る // @かめこまんどじっこう
        type: 'func',
        josi: [['の', 'を']],
        pure: true,
        fn: function (cmd: string, sys: NakoSystem): Promise<number> {
            const turtlesmooth = TurtleSmoothSystem.getTurtleSmooth(sys)
            let promise:null|Promise<number> = null
            const a = cmd.split(/(\n|;)/)
            for (let i = 0; i < a.length; i++) {
                const c = a[i]
                let cmd:Command.Command|null
                try {
                    cmd = turtlesmooth.factory.parse(c)
                } catch (err) {
                    throw new Error(`カメコマンド実行の解析の際にエラーが発生しました:${i + 1}個目`)
                }
                if (!cmd) {
                    throw new Error(`カメコマンド実行に不明な命令がありました(${i + 1}個目)`)
                }
                promise = turtlesmooth.addJob(cmd)
            }
            if (promise === null) {
                promise = new Promise<number>(resolve => resolve(0))
            }
            return promise
        }
    },
    'カメ非表示': { // @カメの画像を非表示にする。描画に影響しない。 // @かめひひょうじ
        type: 'func',
        josi: [],
        pure: true,
        fn: function (sys: NakoSystem): Promise<number> {
            const turtlesmooth = TurtleSmoothSystem.getTurtleSmooth(sys)
            return turtlesmooth.addJob(new Command.SetVisible(false))
        }
    },
    'カメ表示': { // @非表示にしたカメを表示する。 // @かめひょうじ
        type: 'func',
        josi: [],
        pure: true,
        fn: function (sys: NakoSystem): Promise<number> {
            const turtlesmooth = TurtleSmoothSystem.getTurtleSmooth(sys)
            return turtlesmooth.addJob(new Command.SetVisible(true))
        }
    },
    'カメクリック時': { // @ 操作対象のカメをクリックした時のイベントを設定する // @かめくりっくしたとき
        type: 'func',
        josi: [['を']],
        pure: false,
        fn: function (func: CallbackType<Event>, sys: NakoSystem):void {
            const turtlesmooth = TurtleSmoothSystem.getTurtleSmooth(sys)
            func = sys.__findVar(func, null) // 文字列指定なら関数に変換
            if (typeof func !== 'function') {
                return
            }
            const tt = turtlesmooth.getCur()
            if (tt && tt.canvas) {
                tt.canvas.onclick = (e) => {
                    sys.__setSysVar('対象', e.target)
                    return func(e)
                }
            }
        },
        return_none: true
    },
    // @タートルグラフィックス・カメ描画(スムースカメ拡張命令)
    'カメ複製': { // @指定したカメと同じ位置と向きを持つカメを作成してIDを返す // @かめふくせい
        type: 'func',
        josi: [['の', 'から']],
        pure: true,
        fn: function (t: null|number|NakoSystem, sys?: NakoSystem): number {
            if (typeof sys === 'undefined') {
                sys = t as NakoSystem
                t = null
            }
            const turtlesmooth = TurtleSmoothSystem.getTurtleSmooth(sys)
            let tt: TurtleSmooth
            if (typeof t === 'number') {
                tt = turtlesmooth.turtles[t]
            } else {
                tt = turtlesmooth.getCur()
            }
            const imageUrl = sys.__getSysVar('カメ画像URL')
            const tid = turtlesmooth.createTurtle(imageUrl, tt.soul.type)
            turtlesmooth.turtles[tid].x = tt.x
            turtlesmooth.turtles[tid].y = tt.y
            turtlesmooth.turtles[tid].dir = tt.dir
            return tid
        }
    },
    'カメ数取得': { // @カメの数を取得する // @かめすうしゅとく
        type: 'func',
        josi: [],
        pure: true,
        fn: function (sys: NakoSystem): number {
            const turtlesmooth = TurtleSmoothSystem.getTurtleSmooth(sys)
            return turtlesmooth.turtles.length
        }
    },
    'カメ右曲': { // @カメを旋回半径Rで旋回円の角度DEGだけ前に進みながら右に旋回する // @かめみぎまがる
        type: 'func',
        josi: [['に', 'で'], ['だけ']],
        pure: true,
        fn: function (r: number, deg: number|string, sys: NakoSystem): Promise<number> {
            const turtlesmooth = TurtleSmoothSystem.getTurtleSmooth(sys)
            if (typeof deg === 'string') { deg = parseFloat(deg) }
            if (r < 0) {
                throw new Error('半径に負の値を指定することはできません')
            }
            let dir: Direction = 'f'
            let lr: LeftOrRight = 'r'
            if (deg < 0) {
                deg = -deg
                dir = 'b'
                lr = 'l'
            }
            return turtlesmooth.addJob(new Command.Curve(r, deg, dir, lr))
        }
    },
    'カメ左曲': { // @カメを旋回半径Rで旋回円の角度DEGだけ前に進みながら左に旋回する // @かめひだりまがる
        type: 'func',
        josi: [['に', 'で'], ['だけ']],
        pure: true,
        fn: function (r: number, deg: number|string, sys: NakoSystem): Promise<number> {
            const turtlesmooth = TurtleSmoothSystem.getTurtleSmooth(sys)
            if (typeof deg === 'string') { deg = parseFloat(deg) }
            if (r < 0) {
                throw new Error('半径に負の値を指定することはできません')
            }
            let dir: Direction = 'f'
            let lr: LeftOrRight = 'l'
            if (deg < 0) {
                deg = -deg
                dir = 'b'
                lr = 'r'
            }
            return turtlesmooth.addJob(new Command.Curve(r, deg, dir, lr))
        }
    },
    'カメ右曲戻': { // @カメを旋回半径Rで旋回円の角度DEGだけ後ろに戻りながら右に旋回する // @かめみぎまがりもどる
        type: 'func',
        josi: [['に', 'で'], ['だけ']],
        pure: true,
        fn: function (r: number, deg: number|string, sys: NakoSystem): Promise<number> {
            const turtlesmooth = TurtleSmoothSystem.getTurtleSmooth(sys)
            if (typeof deg === 'string') { deg = parseFloat(deg) }
            if (r < 0) {
                throw new Error('半径に負の値を指定することはできません')
            }
            let dir: Direction = 'b'
            let lr: LeftOrRight = 'l'
            if (deg < 0) {
                deg = -deg
                dir = 'f'
                lr = 'r'
            }
            return turtlesmooth.addJob(new Command.Curve(r, Math.abs(deg), dir, lr))
        }
    },
    'カメ左曲戻': { // @カメを旋回半径Rで旋回円の角度DEGだけ後ろに戻りながら左に旋回する // @かめひだりまがりもどる
        type: 'func',
        josi: [['に', 'で'], ['だけ']],
        pure: true,
        fn: function (r:number, deg: number|string, sys: NakoSystem): Promise<number> {
            const turtlesmooth = TurtleSmoothSystem.getTurtleSmooth(sys)
            if (typeof deg === 'string') { deg = parseFloat(deg) }
            if (r < 0) {
                throw new Error('半径に負の値を指定することはできません')
            }
            let dir: Direction = 'b'
            let lr: LeftOrRight = 'r'
            if (deg < 0) {
                deg = -deg
                dir = 'f'
                lr = 'l'
            }
            return turtlesmooth.addJob(new Command.Curve(r, Math.abs(deg), dir, lr))
        }
    },
    'カメ右前曲': { // @カメを旋回半径Rで旋回円の角度DEGだけ右に進みながら前方に旋回する // @かめみぎまえまがる
        type: 'func',
        josi: [['に', 'で'], ['だけ']],
        pure: true,
        fn: function (r: number, deg: number|string, sys: NakoSystem): Promise<number> {
            const turtlesmooth = TurtleSmoothSystem.getTurtleSmooth(sys)
            if (typeof deg === 'string') { deg = parseFloat(deg) }
            if (r < 0) {
                throw new Error('半径に負の値を指定することはできません')
            }
            let dir: Direction = 'r'
            let lr: LeftOrRight = 'l'
            if (deg < 0) {
                deg = -deg
                dir = 'l'
                lr = 'r'
            }
            return turtlesmooth.addJob(new Command.Curve(r, deg, dir, lr))
        }
    },
    'カメ左前曲': { // @カメを旋回半径Rで旋回円の角度DEGだけ左に進みながら前方に旋回する // @かめひだりまえまがる
        type: 'func',
        josi: [['に', 'で'], ['だけ']],
        pure: true,
        fn: function (r: number, deg: number|string, sys: NakoSystem): Promise<number> {
            const turtlesmooth = TurtleSmoothSystem.getTurtleSmooth(sys)
            if (typeof deg === 'string') { deg = parseFloat(deg) }
            if (r < 0) {
                throw new Error('半径に負の値を指定することはできません')
            }
            let dir: Direction = 'l'
            let lr: LeftOrRight = 'r'
            if (deg < 0) {
                deg = -deg
                dir = 'r'
                lr = 'l'
            }
            return turtlesmooth.addJob(new Command.Curve(r, deg, dir, lr))
        }
    },
    'カメ右後曲': { // @カメを旋回半径Rで旋回円の角度DEGだけ右に進みながら後方に旋回する // @かめみぎうしろまがる
        type: 'func',
        josi: [['に', 'で'], ['だけ']],
        pure: true,
        fn: function (r: number, deg: number|string, sys: NakoSystem): Promise<number> {
            const turtlesmooth = TurtleSmoothSystem.getTurtleSmooth(sys)
            if (typeof deg === 'string') { deg = parseFloat(deg) }
            if (r < 0) {
                throw new Error('半径に負の値を指定することはできません')
            }
            let dir: Direction = 'r'
            let lr: LeftOrRight = 'r'
            if (deg < 0) {
                deg = -deg
                dir = 'l'
                lr = 'l'
            }
            return turtlesmooth.addJob(new Command.Curve(r, deg, dir, lr))
        }
    },
    'カメ左後曲': { // @カメを旋回半径Rで旋回円の角度DEGだけ左に進みながら後方に旋回する // @かめひだりうしろまがる
        type: 'func',
        josi: [['に', 'で'], ['だけ']],
        pure: true,
        fn: function (r: number, deg: number|string, sys: NakoSystem): Promise<number> {
            const turtlesmooth = TurtleSmoothSystem.getTurtleSmooth(sys)
            if (typeof deg === 'string') { deg = parseFloat(deg) }
            if (r < 0) {
                throw new Error('半径に負の値を指定することはできません')
            }
            let dir: Direction = 'l'
            let lr: LeftOrRight = 'l'
            if (deg < 0) {
                deg = -deg
                dir = 'r'
                lr = 'r'
            }
            return turtlesmooth.addJob(new Command.Curve(r, deg, dir, lr))
        }
    },
    'カメ直接移動': { // @カメの位置を[x,y]へ移動する // @かめちょくせついどう
        type: 'func',
        josi: [['に', 'へ']],
        pure: true,
        fn: function (xy: NumericArray2, sys: NakoSystem): Promise<number> {
            const turtlesmooth = TurtleSmoothSystem.getTurtleSmooth(sys)
            return turtlesmooth.addJob(new Command.Move([xy[0], xy[1]], true))
        }
    },
    'カメ直接角度設定': { // @カメの向きをDEGに設定する // @かめちょくせつかくどせってい
        type: 'func',
        josi: [['に', 'へ', 'の']],
        pure: true,
        fn: function (deg: number|string, sys: NakoSystem): Promise<number> {
            const turtlesmooth = TurtleSmoothSystem.getTurtleSmooth(sys)
            if (typeof deg === 'string') { deg = parseFloat(deg) }
            return turtlesmooth.addJob(new Command.Angle(deg, true))
        }
    },
    'カメ位置取得': { // @カメの位置([X,Y])を取得する // @かめいちしゅとく
        type: 'func',
        josi: [['の', 'から']],
        pure: true,
        fn: function (t: null|number|NakoSystem, sys?: NakoSystem): NumericArray2 {
            if (typeof sys === 'undefined') {
                sys = t as NakoSystem
                t = null
            }
            const turtlesmooth = TurtleSmoothSystem.getTurtleSmooth(sys)
            let tt: TurtleSmooth
            if (typeof t === 'number') {
                tt = turtlesmooth.turtles[t]
            } else {
                tt = turtlesmooth.getCur()
            }
            return [tt.x, tt.y]
        }
    },
    'カメ角度取得': { // @カメの向き(度)を取得する // @かめかくどしゅとく
        type: 'func',
        josi: [['の', 'から']],
        pure: true,
        fn: function (t: null|number|NakoSystem, sys?: NakoSystem): number {
            if (typeof sys === 'undefined') {
                sys = t as NakoSystem
                t = null
            }
            const turtlesmooth = TurtleSmoothSystem.getTurtleSmooth(sys)
            let tt: TurtleSmooth
            if (typeof t === 'number') {
                tt = turtlesmooth.turtles[t]
            } else {
                tt = turtlesmooth.getCur()
            }
            return (tt.dir + 270) % 360
        }
    },
    'カメ移動速度設定': { // @カメが移動する際の速さをSPD(px/ミリ秒)に設定する // @かめいどうそくどせってい
        type: 'func',
        josi: [['に', 'へ']],
        pure: true,
        fn: function (spd: number, sys: NakoSystem): Promise<number> {
            const turtlesmooth = TurtleSmoothSystem.getTurtleSmooth(sys)
            return turtlesmooth.addJob(new Command.SetMoveSpeed(spd))
        }
    },
    'カメ回転速度設定': { // @カメが回転する際の速さをSPD(度/ミリ秒)に設定する // @かめかいてんそくどせってい
        type: 'func',
        josi: [['に', 'へ']],
        pure: true,
        fn: function (spd: number, sys: NakoSystem): Promise<number> {
            const turtlesmooth = TurtleSmoothSystem.getTurtleSmooth(sys)
            return turtlesmooth.addJob(new Command.SetRotateSpeed(spd))
        }
    },
    'カメスムース移動': { type: 'var', value: true }, // @かめすむーすいどう
    'カメスムース移動オン': { // @カメが回転・移動する際に途中経過も描画する // @かめすむーすいどうおん
        type: 'func',
        josi: [],
        pure: true,
        fn: function (sys: NakoSystem): void {
            const turtlesmooth = TurtleSmoothSystem.getTurtleSmooth(sys)
            sys.__setSysVar('カメスムース移動', true)
        },
        return_none: true
    },
    'カメスムース移動オフ': { // @カメが回転・移動する際の途中経過を描画しない // @かめすむーすいどうおふ
        type: 'func',
        josi: [],
        pure: true,
        fn: function (sys: NakoSystem): void {
            const turtlesmooth = TurtleSmoothSystem.getTurtleSmooth(sys)
            sys.__setSysVar('カメスムース移動', false)
        },
        return_none: true
    }
}

export default PluginTurtleSmooth

// scriptタグで取り込んだ時、自動で登録する
// @ts-ignore TS2339
if (typeof (navigator) === 'object' && typeof (navigator.nako3)) {
    navigator.nako3.addPluginObject('PluginTurtleSmooth', PluginTurtleSmooth)
}
