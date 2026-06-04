extends Area3D

@export var display_name := "Etkilesim"
@export var story_key := "intro"
@export_range(0.0, 1.0, 0.05) var stress_pulse := 0.35

func interact() -> void:
	var story_manager := get_node_or_null("/root/StoryManager")
	var game_manager := get_node_or_null("/root/GameManager")
	if story_manager:
		story_manager.interact(story_key)
	if game_manager:
		game_manager.fire_interaction(display_name, stress_pulse)
