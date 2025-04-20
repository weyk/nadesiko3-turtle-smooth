import { TurtleSmooth } from '../turtle.js'

export type AnimationCmd = 'move'|'rotate'|'curve'|'rotateto'|'moveto'

export interface AnimationBase {
    cmd: AnimationCmd
    setup (tt: TurtleSmooth):void
    tick (tt: TurtleSmooth, time: number): number
    end (tt: TurtleSmooth, time: number): number
}

export interface AnimationTarget {
    x: number
    y: number
    dir: number
}
