extends CanvasLayer

@onready var title_label: Label = %TitleLabel
@onready var body_label: Label = %BodyLabel
@onready var focus_label: Label = %FocusLabel
@onready var heartbeat_label: Label = %HeartbeatLabel
@onready var pulse_bar: ProgressBar = %PulseBar

func _ready() -> void:
	var story_manager := get_node_or_null("/root/StoryManager")
	var game_manager := get_node_or_null("/root/GameManager")
	if story_manager:
		story_manager.story_changed.connect(_on_story_changed)
		_on_story_changed(story_manager.get_current_title(), story_manager.get_current_body())
	if game_manager:
		game_manager.focus_changed.connect(_on_focus_changed)
		game_manager.heartbeat_changed.connect(_on_heartbeat_changed)
	_on_focus_changed("")

func _on_story_changed(title: String, body: String) -> void:
	title_label.text = title
	body_label.text = body

func _on_focus_changed(target_name: String) -> void:
	focus_label.text = target_name
	focus_label.visible = not target_name.is_empty()

func _on_heartbeat_changed(value: int) -> void:
	heartbeat_label.text = "%d BPM" % value
	pulse_bar.value = clampi(value, 60, 150)
