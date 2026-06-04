extends SceneTree

const REQUIRED_FILES := [
	"res://project.godot",
	"res://scenes/Main.tscn",
	"res://scenes/player/Player.tscn",
	"res://scenes/rooms/TestRoom.tscn",
	"res://scenes/ui/HUD.tscn",
	"res://scripts/GameManager.gd",
	"res://scripts/StoryManager.gd",
	"res://scripts/PlayerController.gd",
	"res://scripts/InteractionTarget.gd",
	"res://scripts/HUD.gd",
]

func _init() -> void:
	var failed := false
	for file_path in REQUIRED_FILES:
		if not FileAccess.file_exists(file_path):
			push_error("Missing required file: %s" % file_path)
			failed = true

	for scene_path in [
		"res://scenes/Main.tscn",
		"res://scenes/player/Player.tscn",
		"res://scenes/rooms/TestRoom.tscn",
		"res://scenes/ui/HUD.tscn",
	]:
		var scene := load(scene_path)
		if scene == null:
			push_error("Could not load scene: %s" % scene_path)
			failed = true

	quit(1 if failed else 0)
