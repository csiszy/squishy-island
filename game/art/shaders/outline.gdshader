// Cartoon outline: the model drawn again slightly bigger, inside out, in plum (#3A2A4A), so a thin line shows around
// every shape. The width stays about the same number of pixels however far away the model is.
// Uses the smoothed normals the import plugin stores in the vertex colour, so hard corners do not crack open.
shader_type spatial;
render_mode unshaded, cull_front, shadows_disabled, depth_draw_opaque;

uniform vec4 outline_color : source_color = vec4(0.227, 0.165, 0.290, 1.0);
// line width in layout pixels (the game's 720-wide screen); the book's map uses 1.8 CSS pixels on a phone page,
// which is about 2.4 of ours
uniform float width_px = 2.4;
// screen pixels per layout pixel, set by NativeViewport (1.5 on a 1080-wide phone)
global uniform float outline_scale;
// same as the toon shader: hide the outline of the part of a window peeker below the sill
uniform float clip_below = -100000.0;
varying float world_y;

void vertex() {
	world_y = (MODEL_MATRIX * vec4(VERTEX, 1.0)).y;
	vec3 n = COLOR.a > 0.5 ? COLOR.rgb * 2.0 - 1.0 : NORMAL;
	// like the book (D.outlineMat in art/kit3d.js): push each point out along its normal by the size of
	// width_px screen pixels at its distance, so edges facing sideways get the full line and the rest less
	vec4 mv = MODELVIEW_MATRIX * vec4(VERTEX, 1.0);
	vec3 vn = normalize(MODELVIEW_NORMAL_MATRIX * n);
	float per_px = 2.0 / (abs(PROJECTION_MATRIX[1][1]) * VIEWPORT_SIZE.y);
	// (only for the camera: the sun's shadow pass uses a flat projection and must not see a fattened shape)
	bool flat_projection = PROJECTION_MATRIX[3][3] > 0.5;
	if (!flat_projection) {
		mv.xyz += vn * (-mv.z) * width_px * outline_scale * per_px;
	}
	POSITION = PROJECTION_MATRIX * mv;
}

void fragment() {
	if (world_y < clip_below) {
		discard;
	}
	ALBEDO = outline_color.rgb;
}
