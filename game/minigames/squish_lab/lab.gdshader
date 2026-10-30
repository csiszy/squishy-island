// The Lab's look: the Squishy Island toon light (like the island's, with the prototype lab's lights: a hemisphere
// light and one sun) and, for the squishy, the soft-body bend. The squishy's mesh is stored in its relaxed shape
// with the ring sector of every point in UV2.x; each frame the game sends one 2x2 matrix per sector (rest -> now),
// so every point follows the soft body left-right and up-down and puffs out front-to-back when squished.
shader_type spatial;
render_mode specular_disabled, ambient_light_disabled;

uniform vec4 albedo : source_color = vec4(1.0);
uniform sampler2D albedo_texture : source_color, filter_linear_mipmap, repeat_enable, hint_default_white;
uniform vec2 uv_scale = vec2(1.0);
uniform vec2 uv_offset = vec2(0.0);
uniform bool use_texture = false;
uniform vec4 emission : source_color = vec4(0.0, 0.0, 0.0, 1.0);
uniform float emission_energy = 0.0;
// 0 = toon steps, 1 = smooth soft vinyl
uniform float softness = 1.0;

uniform bool deform = false;
uniform vec4 aff[40];
uniform vec4 nrm[40];
uniform vec2 centre = vec2(0.0);
uniform float puff = 1.0;

// the prototype lab's lights (HemisphereLight('#FFFFFF', '#8A9AB4', .6) and a sun), a little brighter because the
// sum is done on sRGB colours like the island's toon look (the prototype adds light in linear colour)
const vec3 SKY = vec3(1.0, 1.0, 1.0) * 0.72;
const vec3 GROUND = vec3(0.667, 0.714, 0.8) * 0.72;
const vec4 STEPS = vec4(0.588, 0.769, 0.910, 1.0);

vec3 to_srgb(vec3 c) {
	return mix(c * 12.92, 1.055 * pow(c, vec3(1.0 / 2.4)) - 0.055, step(vec3(0.0031308), c));
}

vec3 to_linear(vec3 c) {
	return mix(c / 12.92, pow((c + 0.055) / 1.055, vec3(2.4)), step(vec3(0.04045), c));
}

void vertex() {
	if (deform) {
		int i = int(UV2.x + 0.5);
		vec4 a = aff[i];
		vec4 n = nrm[i];
		VERTEX = vec3(centre + mat2(a.xy, a.zw) * VERTEX.xy, VERTEX.z * puff);
		NORMAL = normalize(vec3(mat2(n.xy, n.zw) * NORMAL.xy, NORMAL.z / puff));
	}
}

void fragment() {
	vec4 c = albedo;
	if (use_texture) {
		c *= texture(albedo_texture, UV * uv_scale + uv_offset);
	}
	ALBEDO = c.rgb;
	EMISSION = emission.rgb * emission_energy;
}

void light() {
	vec3 up = normalize((VIEW_MATRIX * vec4(0.0, 1.0, 0.0, 0.0)).xyz);
	vec3 base = mix(GROUND, SKY, dot(NORMAL, up) * 0.5 + 0.5);
	float half_lambert = dot(NORMAL, LIGHT) * 0.5 + 0.5;
	float stepped = half_lambert < 0.25 ? STEPS.x : (half_lambert < 0.5 ? STEPS.y : (half_lambert < 0.75 ? STEPS.z : STEPS.w));
	float lit = mix(stepped, clamp(dot(NORMAL, LIGHT), 0.0, 1.0), softness);
	vec3 sun = to_srgb(LIGHT_COLOR / PI);
	DIFFUSE_LIGHT += to_linear(clamp(base + sun * lit * ATTENUATION, 0.0, 1.5));
}
