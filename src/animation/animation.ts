import { Curve } from './curve.js'
import { Move } from './move.js'
import { Rotate } from './rotate.js'

export type Animation =
    Move|
    Rotate|
    Curve

export { Curve, Move, Rotate }
