import { Direction, LeftOrRight } from './turtle_type.js'
export const LrOpposite: {[key in LeftOrRight]:LeftOrRight} = { 'l': 'r', 'r': 'l' }
export const DirOpposite: {[key in Direction]:Direction} = { 'l': 'r', 'r': 'l', 'f': 'b', 'b': 'f' }

export const LrToDeg: {[key in LeftOrRight]: number } = { 'l': -90, 'r': 90 }
export const DirToDeg: {[key in Direction]: number } = { 'l': 270, 'r': 90, 'f': 0, 'b': 180 }
