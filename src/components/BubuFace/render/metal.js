// The one metal palette on this face, shared by everything physical laid over the
// screen: cool's shades, nerd's spectacles (effects/eyewear.js) and the zipper
// mouth (drawMouth.js).
//
// Deliberately NOT the expression's glowColor. glowColor is the display -- eyes,
// mouth, brows -- and an object sitting *on* the display is lit by the room, not
// emitting. Tying the two together once made cool's frame gold along with its
// smile, which is also why nerd's frame isn't the reference's near-black: a dark
// object is invisible against a near-black screen. Grey metal is how this face
// renders anything that isn't glowing.
export const METAL_LIGHT = '#b8b5c2';

// Dimmer than the metal itself. Used for glows and the shaded lower edge: a grey
// object blooming at full strength reads as white haze instead of metal catching
// light.
export const METAL_SHADE = '#6f6c7d';
