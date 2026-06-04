extends Node

signal focus_changed(target_name: String)
signal interaction_fired(target_name: String)
signal heartbeat_changed(value: int)

const ACTIONS := {
	"move_forward": [KEY_W, KEY_UP],
	"move_backward": [KEY_S, KEY_DOWN],
	"move_left": [KEY_A, KEY_LEFT],
	"move_right": [KEY_D, KEY_RIGHT],
	"interact": [KEY_F, KEY_ENTER],
}

var current_focus_name := ""
var heartbeat := 68
var stress := 0.0

func _ready() -> void:
	_ensure_input_map()

func _process(delta: float) -> void:
	stress = maxf(0.0, stress - delta * 0.08)
	var target_heartbeat := 68 + int(stress * 58.0)
	heartbeat = int(lerpf(float(heartbeat), float(target_heartbeat), minf(1.0, delta * 3.0)))
	heartbeat_changed.emit(heartbeat)

func set_focus_name(value: String) -> void:
	if current_focus_name == value:
		return
	current_focus_name = value
	focus_changed.emit(current_focus_name)

func fire_interaction(target_name: String, pulse := 0.35) -> void:
	stress = minf(1.0, stress + pulse)
	interaction_fired.emit(target_name)
	pulse_gamepad(0.35 + pulse * 0.3, 0.2 + pulse * 0.4, 0.22)

func pulse_gamepad(weak := 0.35, strong := 0.75, duration := 0.18) -> void:
	for device in Input.get_connected_joypads():
		Input.start_joy_vibration(device, weak, strong, duration)

func _ensure_input_map() -> void:
	for action in ACTIONS.keys():
		if not InputMap.has_action(action):
			InputMap.add_action(action)
		for keycode in ACTIONS[action]:
			if not _has_key_event(action, keycode):
				var event := InputEventKey.new()
				event.physical_keycode = keycode
				InputMap.action_add_event(action, event)

	if not InputMap.has_action("ui_cancel"):
		InputMap.add_action("ui_cancel")
	if not _has_key_event("ui_cancel", KEY_ESCAPE):
		var escape := InputEventKey.new()
		escape.physical_keycode = KEY_ESCAPE
		InputMap.action_add_event("ui_cancel", escape)

	_add_joy_motion("move_left", JOY_AXIS_LEFT_X, -1.0)
	_add_joy_motion("move_right", JOY_AXIS_LEFT_X, 1.0)
	_add_joy_motion("move_forward", JOY_AXIS_LEFT_Y, -1.0)
	_add_joy_motion("move_backward", JOY_AXIS_LEFT_Y, 1.0)
	_add_joy_button("interact", JOY_BUTTON_A)

func _has_key_event(action: StringName, keycode: int) -> bool:
	for event in InputMap.action_get_events(action):
		if event is InputEventKey and event.physical_keycode == keycode:
			return true
	return false

func _add_joy_button(action: StringName, button_index: int) -> void:
	for event in InputMap.action_get_events(action):
		if event is InputEventJoypadButton and event.button_index == button_index:
			return
	var joy_event := InputEventJoypadButton.new()
	joy_event.button_index = button_index
	InputMap.action_add_event(action, joy_event)

func _add_joy_motion(action: StringName, axis: int, axis_value: float) -> void:
	for event in InputMap.action_get_events(action):
		if event is InputEventJoypadMotion and event.axis == axis and is_equal_approx(event.axis_value, axis_value):
			return
	var joy_event := InputEventJoypadMotion.new()
	joy_event.axis = axis
	joy_event.axis_value = axis_value
	InputMap.action_add_event(action, joy_event)
