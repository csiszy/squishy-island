extends SceneTree
## Renders one model to a PNG, lit like the design book's pictures, for eyeballing the toon look and outline.
## Needs a real renderer (not --headless), e.g. on Linux:
##   xvfb-run godot --path game --rendering-driver opengl3 --resolution 520x440 -s res://tests/visual/snap.gd -- <model.glb> <out.png> [seconds]

func _init() -> void:
	var args := OS.get_cmdline_user_args()
	var model := args[0] if args.size() > 0 else "res://art/models/buildings/dumpling/building_dumpling_L10.glb"
	var out := args[1] if args.size() > 1 else "user://snap.png"
	var at_time := float(args[2]) if args.size() > 2 else 1.2
	await process_frame
	var world := Node3D.new()
	root.add_child(world)
	var env := WorldEnvironment.new()
	env.environment = BookLights.make_environment()
	world.add_child(env)
	world.add_child(BookLights.make_sun())
	var obj: Node3D = (load(model) as PackedScene).instantiate()
	world.add_child(obj)
	await process_frame
	for idle in obj.find_children("*", "IdleMotion", true, false):
		(idle as IdleMotion).apply(at_time)
	var box := _bounds(obj)
	var cam := Camera3D.new()
	cam.fov = 30
	world.add_child(cam)
	var c := box.get_center()
	# same view as the book's level pictures: yaw 0.45, pitch 0.5
	var dist := box.size.length() * 0.74 / tan(deg_to_rad(cam.fov) / 2.0) * 0.5
	cam.position = c + Vector3(sin(0.45) * cos(0.5), sin(0.5), cos(0.45) * cos(0.5)) * dist
	cam.look_at(c)
	for i in 4:
		await process_frame
	await RenderingServer.frame_post_draw
	root.get_texture().get_image().save_png(out)
	print("saved ", out)
	quit()


func _bounds(n: Node) -> AABB:
	var box := AABB()
	var first := true
	for mi in n.find_children("*", "MeshInstance3D", true, false):
		var m := mi as MeshInstance3D
		var b := m.global_transform * m.get_aabb()
		box = b if first else box.merge(b)
		first = false
	return box
