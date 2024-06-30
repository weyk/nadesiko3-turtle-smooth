import { Move } from './move.js'
import { Jump } from './jump.js'
import { Angle } from './angle.js'
import { Walk } from './walk.js'
import { Rotate } from './rotate.js'
import { Curve } from './curve.js'
import { Path } from './path.js'
import { Raw } from './raw.js'
import { DrawText } from './drawText.js'
import { SetMoveSpeed } from './setMoveSpeed.js'
import { SetRotateSpeed } from './setRotateSpeed.js'
import { SetVisible } from './setVisible.js'
import { SetImage } from './setImage.js'
import { SetStyle } from './setStyle.js'

export type Command =
    Move|
    Angle|
    Walk|
    Rotate|
    Jump|
    Curve|
    Path|
    Raw|
    DrawText|
    SetStyle|
    SetVisible|
    SetImage|
    SetMoveSpeed|
    SetRotateSpeed

export {
    Move,
    Angle,
    Walk,
    Rotate,
    Jump,
    Curve,
    Path,
    Raw,
    DrawText,
    SetMoveSpeed,
    SetRotateSpeed,
    SetImage,
    SetStyle,
    SetVisible
}
