extends CanvasLayer

@onready var title_label: Label = %TitleLabel
@onready var body_label: Label = %BodyLabel
@onready var focus_label: Label = %FocusLabel
@onready var heartbeat_label: Label = %HeartbeatLabel
@onready var pulse_bar: ProgressBar = %PulseBar

func _ready() -> void:
	StoryManager.story_changed.connect(_on_story_changed)
	GameManager.focus_changed.connect(_on_focus_changed)
	GameManager.heartbeat_changed.connect(_on_heartbeat_changed)
	_on_story_changed(StoryManager.get_current_title(), StoryManager.get_current_body())
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
