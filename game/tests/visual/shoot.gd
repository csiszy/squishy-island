extends SceneTree
## Starts the real game, optionally does a few things, and saves a screenshot (for checking screens by eye).
##   xvfb-run godot --path game --rendering-driver opengl3 --resolution 540x960 -s res://tests/visual/shoot.gd -- out.png [steps...]
## Steps: tier:medium  slow:0.05  print  coins:N  call:Node:method:args  select:<building>  go:<screen>[:id]  wait:<frames>  tap:x,y  zoom:<factor>

func _init() -> void:
	var args := OS.get_cmdline_user_args()
	var out := args[0] if args.size() > 0 else "user://shot.png"
	await process_frame
	# tier:<low|medium|high> before the game starts (graphics quality as a phone would get it)
	for step: String in args.slice(1):
		if step.begins_with("tier:"):
			(root.get_node("Settings") as SettingsService).set_value(&"graphics", StringName(step.split(":")[1]))
	change_scene_to_file("res://app/main.tscn")
	for i in 30:
		await process_frame
	for step: String in args.slice(1):
		var parts := step.split(":")
		match parts[0]:
			"coins":
				(root.get_node("Economy") as EconomyService).earn(int(parts[1]), &"debug")
			"select":
				var city := root.find_child("CityScreen", true, false)
				if city:
					city.call("select", StringName(parts[1]))
			"go":
				(root.get_node("Nav") as NavService).go(StringName(parts[1]), {"id": StringName(parts[2])} if parts.size() > 2 else {})
			"zoom":
				var city := root.find_child("CityScreen", true, false)
				if city:
					(city.get("view") as CityView).fly_to(0, 0, (city.get("view") as CityView).dist * float(parts[1]), 0.05)
			"print":
				var city := root.find_child("CityScreen", true, false)
				var v := city.get("view") as CityView
				print("view x=%.1f z=%.1f dist=%.1f dmax=%.1f size=%s" % [v.x, v.z, v.dist, v.dmax, (city as Control).size])
			"slow":
				# slow:<factor> slows time down, to catch a short animation (slow:0.05 = 20 times slower)
				Engine.time_scale = float(parts[1])
			"wait":
				for i in int(parts[1]):
					await process_frame
			"call":
				# call:NodeName:method[:arg,arg] (numbers become ints, words StringNames)
				var node := root.find_child(parts[1], true, false)
				var call_args: Array = []
				if parts.size() > 3:
					for a: String in parts[3].split(","):
						call_args.append(int(a) if a.is_valid_int() else StringName(a))
				if node:
					await node.callv(parts[2], call_args)
		await process_frame
	for i in 40:
		await process_frame
	await RenderingServer.frame_post_draw
	root.get_texture().get_image().save_png(out)
	print("saved ", out)
	quit()
