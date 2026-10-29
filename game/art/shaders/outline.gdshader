// Cartoon outline: the model drawn again slightly bigger, inside out, in plum (#3A2A4A), so a thin line shows around
// every shape. The width stays about the same number of pixels however far away the model is.
// Uses the smoothed normals the import plugin stores in the vertex colour, so hard corners do not crack open.
shader_type spatial;
render_mode unshaded, cull_front, shadows_disabled, depth_draw_opaque;

uniform vec4 outline_color : source_color = vec4(0.227, 0.165, 0.290, 1.0);
// line width in pixels at a 720-pixel-tall screen (scaled with the screen)
uniform float width_px = 2.0;

void vertex() {
	vec3 n = COLOR.a > 0.5 ? COLOR.rgb * 2.0 - 1.0 : NORMAL;
	vec4 clip = PROJECTION_MATRIX * (MODELVIEW_MATRIX * vec4(VERTEX, 1.0));
	vec3 view_n = normalize((MODELVIEW_MATRIX * vec4(n, 0.0)).xyz);
	vec2 dir = (PROJECTION_MATRIX * vec4(view_n, 0.0)).xy;
	float len = length(dir);
	if (len > 0.0001) {
		float px = width_px * VIEWPORT_SIZE.y / 720.0;
		clip.xy += dir / len * px * 2.0 / VIEWPORT_SIZE * clip.w;
	}
	POSITION = clip;
}

void fragment() {
	ALBEDO = outline_color.rgb;
}
