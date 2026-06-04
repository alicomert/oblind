extends Area3D

@export var display_name := "Etkilesim"
@export var story_key := "intro"
@export_range(0.0, 1.0, 0.05) var stress_pulse := 0.35

func interact() -> void:
	StoryManager.interact(story_key)
	GameManager.fire_interaction(display_name, stress_pulse)
