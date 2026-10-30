// The squishy's plum outline (the island's outline: the model again, a little bigger, inside out), bent along
// with the soft body exactly like lab.gdshader. The smoothed normals for the outline are in the vertex colour.
shader_type spatial;
render_mode unshaded, cull_front, shadows_disabled, depth_draw_opaque;

uniform vec4 outline_color : source_color = vec4(0.227, 0.165, 0.290, 1.0);
// line width in pixels of the Lab's picture
uniform float width_px = 2.4;
uniform vec4 aff[40];
uniform vec2 rest[40];
uniform vec2 ring[40];
uniform vec4 whole = vec4(1.0, 0.0, 0.0, 1.0);
uniform vec2 centre = vec2(0.0);
uniform float puff = 1.0;

void vertex() {
	int i = int(UV2.x + 0.5);
	int j = (i + 1) % 40;
	vec4 a = mix(aff[i], aff[j], UV2.y);
	mat2 m = mat2(a.xy, a.zw);
	vec2 edge = mix(rest[i], rest[j], UV2.y);
	vec3 n = COLOR.a > 0.5 ? COLOR.rgb * 2.0 - 1.0 : NORMAL;
	vec3 p;
	if (dot(VERTEX.xy, VERTEX.xy) > dot(edge, edge)) {
		mat2 g = mat2(whole.xy, whole.zw);
		p = vec3(centre + mix(ring[i], ring[j], UV2.y) + g * (VERTEX.xy - edge), VERTEX.z * puff);
		n = normalize(vec3(transpose(inverse(g)) * n.xy, n.z / puff));
	} else {
		p = vec3(centre + m * VERTEX.xy, VERTEX.z * puff);
		n = normalize(vec3(transpose(inverse(m)) * n.xy, n.z / puff));
	}
	vec4 mv = MODELVIEW_MATRIX * vec4(p, 1.0);
	vec3 vn = normalize(MODELVIEW_NORMAL_MATRIX * n);
	float per_px = 2.0 / (abs(PROJECTION_MATRIX[1][1]) * VIEWPORT_SIZE.y);
	mv.xyz += vn * (-mv.z) * width_px * per_px;
	POSITION = PROJECTION_MATRIX * mv;
}

void fragment() {
	ALBEDO = outline_color.rgb;
}
