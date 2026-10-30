// The squishy's plum outline (the island's outline: the model again, a little bigger, inside out), bent along
// with the soft body exactly like lab.gdshader. The smoothed normals for the outline are in the vertex colour.
shader_type spatial;
render_mode unshaded, cull_front, shadows_disabled, depth_draw_opaque;

uniform vec4 outline_color : source_color = vec4(0.227, 0.165, 0.290, 1.0);
// line width in pixels of the Lab's picture
uniform float width_px = 2.4;
uniform vec4 aff[40];
uniform vec4 nrm[40];
uniform vec2 centre = vec2(0.0);
uniform float puff = 1.0;

void vertex() {
	int i = int(UV2.x + 0.5);
	vec4 a = aff[i];
	vec4 nm = nrm[i];
	vec3 n = COLOR.a > 0.5 ? COLOR.rgb * 2.0 - 1.0 : NORMAL;
	n = normalize(vec3(mat2(nm.xy, nm.zw) * n.xy, n.z / puff));
	vec3 p = vec3(centre + mat2(a.xy, a.zw) * VERTEX.xy, VERTEX.z * puff);
	vec4 mv = MODELVIEW_MATRIX * vec4(p, 1.0);
	vec3 vn = normalize(MODELVIEW_NORMAL_MATRIX * n);
	float per_px = 2.0 / (abs(PROJECTION_MATRIX[1][1]) * VIEWPORT_SIZE.y);
	mv.xyz += vn * (-mv.z) * width_px * per_px;
	POSITION = PROJECTION_MATRIX * mv;
}

void fragment() {
	ALBEDO = outline_color.rgb;
}
