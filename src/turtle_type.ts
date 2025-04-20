import type { NakoSystem as NakoSystemBase } from 'nadesiko3core/src/plugin_api.mjs'
import type { TurtleSmoothSystem } from './turtle_system.js'

export interface NakoSystem extends NakoSystemBase {
    tags: { turtlesmooth?: TurtleSmoothSystem }
}

export type NumericArray2 = [ number, number ]

export type LeftOrRight = 'l'|'r'
export type ForwardOrBackward = 'f'|'b'
export type Direction = 'f'|'b'|'l'|'r'

export type DrawParam = number|string|boolean|NumericArray2
export type DrawParams = DrawParam[]
export type CallbackType<T> = (a:T) => void
