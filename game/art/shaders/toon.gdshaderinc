// The Squishy Island look, matching the design book's pictures (art/kit3d.js: MeshToonMaterial with a 4-step ramp,
// lit by D.lights: a hemisphere light, a little ambient light and one warm sun).
// The book does its lighting on the plain sRGB colours, so this shader does the same sum in sRGB and converts once:
//   colour = albedo × (hemisphere + ambient + sun × ramp(n·l) × shadow)
// It needs exactly one DirectionalLight3D (the sun: its direction, colour, energy and shadows are used) and no
// ambient light from the environment. Used by toon.gdshader (solid) and toon_see_through.gdshader. Every exported model gets one through the import plugin
// (addons/squishy_art_import). Change the look here and every building and squishy follows.

uniform vec4 albedo : source_color = vec4(1.0);
uniform sampler2D albedo_texture : source_color, filter_linear_mipmap, hint_default_white;
uniform bool use_texture = false;
uniform vec4 emission : source_color = vec4(0.0, 0.0, 0.0, 1.0);
uniform float emission_energy = 0.0;
// 0 = toon steps (buildings), 1 = smooth soft vinyl (squishies)
uniform float softness = 0.0;

// window peekers: everything below this world height is hidden (only peeking squishies get their own copy
// of the material with this set: see BuildingSlot._clip_below)
uniform float clip_below = -100000.0;
varying float world_y;
varying vec3 tint;

// the book's light rig (D.lights), as sRGB colours × strength
const vec3 SKY = vec3(1.0, 1.0, 1.0) * 0.42;
const vec3 GROUND = vec3(0.725, 0.659, 0.847) * 0.42; // #B9A8D8
const vec3 AMBIENT = vec3(1.0, 0.941, 0.965) * 0.1; // #FFF0F6
// the book's ramp texture (150 / 196 / 232 / 255)
const vec4 STEPS = vec4(0.588, 0.769, 0.910, 1.0);

vec3 to_srgb(vec3 c) {
	return mix(c * 12.92, 1.055 * pow(c, vec3(1.0 / 2.4)) - 0.055, step(vec3(0.0031308), c));
}

vec3 to_linear(vec3 c) {
	return mix(c / 12.92, pow((c + 0.055) / 1.055, vec3(2.4)), step(vec3(0.04045), c));
}

void vertex() {
	world_y = (MODEL_MATRIX * vec4(VERTEX, 1.0)).y;
	// per-instance colour of instanced things (trees, bushes, flowers) travels in the custom data
	tint = INSTANCE_CUSTOM.a > 0.5 ? INSTANCE_CUSTOM.rgb : vec3(1.0);
}

void fragment() {
	if (world_y < clip_below) {
		discard;
	}
	vec4 c = albedo * vec4(tint, 1.0);
	if (use_texture) {
		c *= texture(albedo_texture, UV);
	}
	ALBEDO = c.rgb;
#ifdef SEE_THROUGH
	ALPHA = c.a;
#endif
	EMISSION = emission.rgb * emission_energy;
}

void light() {
	// hemisphere: sky colour from above, ground colour from below (world up)
	vec3 up = normalize((VIEW_MATRIX * vec4(0.0, 1.0, 0.0, 0.0)).xyz);
	vec3 base = mix(GROUND, SKY, dot(NORMAL, up) * 0.5 + 0.5) + AMBIENT;
	float half_lambert = dot(NORMAL, LIGHT) * 0.5 + 0.5;
	float stepped = half_lambert < 0.25 ? STEPS.x : (half_lambert < 0.5 ? STEPS.y : (half_lambert < 0.75 ? STEPS.z : STEPS.w));
	float lit = mix(stepped, clamp(dot(NORMAL, LIGHT), 0.0, 1.0), softness);
	vec3 sun = to_srgb(LIGHT_COLOR / PI);
	vec3 total = base + sun * lit * ATTENUATION;
	// albedo (linear) × total (sRGB) == the book's sRGB sum, converted to linear once
	DIFFUSE_LIGHT += to_linear(clamp(total, 0.0, 1.5));
}
