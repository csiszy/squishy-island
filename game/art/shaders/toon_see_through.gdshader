// See-through parts (steam, glass, water) in the Squishy Island toon look (see toon.gdshaderinc).
shader_type spatial;
render_mode specular_disabled, ambient_light_disabled, blend_mix, depth_draw_never, cull_disabled;

#define SEE_THROUGH
#include "res://art/shaders/toon.gdshaderinc"
