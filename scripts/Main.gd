extends Node3D

func _ready() -> void:
	var story_manager := get_node_or_null("/root/StoryManager")
	if story_manager:
		story_manager.reset()
