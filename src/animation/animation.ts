import { Curve } from './curve.js'
import { Move } from './move.js'
import { Rotate } from './rotate.js'
import { RotateToDir } from './rotateToDir.js'

export type Animation =
    Move|
    Rotate|RotateToDir|
    Curve

export { Curve, Move, Rotate, RotateToDir }
