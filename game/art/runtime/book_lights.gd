class_name BookLights
extends RefCounted
## The design book's light rig for any 3D scene showing exported models (D.lights in art/kit3d.js).
## The hemisphere and ambient parts live inside art/shaders/toon.gdshader; the scene only needs this sun.

## Book: DirectionalLight('#FFF4E6', 0.6) at (-0.6, 1.4, 0.9) × span. The strength is put into the colour (energy 1)
## because the toon shader works in sRGB like the book; energy would be applied after Godot's linear conversion.
const SUN_COLOR := Color("#FFF4E6")
const SUN_STRENGTH := 0.6
const SUN_FROM := Vector3(-0.6, 1.4, 0.9)


static func make_sun() -> DirectionalLight3D:
	var sun := DirectionalLight3D.new()
	sun.name = "Sun"
	sun.light_color = Color(SUN_COLOR.r * SUN_STRENGTH, SUN_COLOR.g * SUN_STRENGTH, SUN_COLOR.b * SUN_STRENGTH)
	sun.light_energy = 1.0
	sun.shadow_enabled = true
	sun.basis = Basis.looking_at(-SUN_FROM.normalized(), Vector3.UP)
	return sun


## Shadow edges for the graphics tier: soft like the book's (PCFSoftShadowMap) on Medium and High, so they do not
## show stair-steps; Low has no shadows at all (city3d.js).
static func apply_shadow_quality(tier: StringName) -> void:
	var soft := {GraphicsTier.MEDIUM: RenderingServer.SHADOW_QUALITY_SOFT_LOW, GraphicsTier.HIGH: RenderingServer.SHADOW_QUALITY_SOFT_MEDIUM}
	var quality: RenderingServer.ShadowQuality = soft.get(tier, RenderingServer.SHADOW_QUALITY_HARD)
	RenderingServer.directional_soft_shadow_filter_set_quality(quality)
	RenderingServer.directional_shadow_atlas_set_size(4096 if tier == GraphicsTier.HIGH else 2048, true)


## An environment with no ambient light of its own (the toon shader adds the book's) and the book's paper background.
static func make_environment(background := Color("#FFF6E8")) -> Environment:
	var env := Environment.new()
	env.background_mode = Environment.BG_COLOR
	env.background_color = background
	env.ambient_light_source = Environment.AMBIENT_SOURCE_DISABLED
	env.tonemap_mode = Environment.TONE_MAPPER_LINEAR
	return env
