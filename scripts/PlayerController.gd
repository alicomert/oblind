extends CharacterBody3D

@export var move_speed := 3.2
@export var acceleration := 11.0
@export var gravity := 18.0
@export var mouse_sensitivity := 0.0022
@export var gamepad_look_speed := 2.1

@onready var camera_pivot: Node3D = $CameraPivot
@onready var camera: Camera3D = $CameraPivot/Camera3D

var look_pitch := 0.0
var focus_targets: Array[Area3D] = []

func _ready() -> void:
	Input.mouse_mode = Input.MOUSE_MODE_CAPTURED

func _unhandled_input(event: InputEvent) -> void:
	if event is InputEventMouseMotion and Input.mouse_mode == Input.MOUSE_MODE_CAPTURED:
		rotate_y(-event.relative.x * mouse_sensitivity)
		look_pitch = clampf(look_pitch - event.relative.y * mouse_sensitivity, deg_to_rad(-82.0), deg_to_rad(82.0))
		camera_pivot.rotation.x = look_pitch

	if event.is_action_pressed("ui_cancel"):
		Input.mouse_mode = Input.MOUSE_MODE_VISIBLE if Input.mouse_mode == Input.MOUSE_MODE_CAPTURED else Input.MOUSE_MODE_CAPTURED

	if event.is_action_pressed("interact"):
		_interact_with_focus()

func _physics_process(delta: float) -> void:
	_apply_look_from_gamepad(delta)
	_apply_movement(delta)
	_update_focus()

func _apply_movement(delta: float) -> void:
	var input_vec := Input.get_vector("move_left", "move_right", "move_forward", "move_backward")
	var basis := global_transform.basis
	var direction := (basis.x * input_vec.x + basis.z * input_vec.y)
	direction.y = 0.0
	direction = direction.normalized()

	var target_velocity := direction * move_speed
	velocity.x = lerpf(velocity.x, target_velocity.x, minf(1.0, acceleration * delta))
	velocity.z = lerpf(velocity.z, target_velocity.z, minf(1.0, acceleration * delta))

	if not is_on_floor():
		velocity.y -= gravity * delta
	else:
		velocity.y = -0.1

	move_and_slide()

func _apply_look_from_gamepad(delta: float) -> void:
	var pads := Input.get_connected_joypads()
	if pads.is_empty():
		return
	var device := pads[0]
	var look_x := Input.get_joy_axis(device, JOY_AXIS_RIGHT_X)
	var look_y := Input.get_joy_axis(device, JOY_AXIS_RIGHT_Y)
	if absf(look_x) < 0.16:
		look_x = 0.0
	if absf(look_y) < 0.16:
		look_y = 0.0
	rotate_y(-look_x * gamepad_look_speed * delta)
	look_pitch = clampf(look_pitch - look_y * gamepad_look_speed * delta, deg_to_rad(-82.0), deg_to_rad(82.0))
	camera_pivot.rotation.x = look_pitch

func _update_focus() -> void:
	var best_target: Area3D = null
	var best_score := INF
	var forward := -camera.global_transform.basis.z.normalized()

	for target in focus_targets:
		if not is_instance_valid(target):
			continue
		var offset := target.global_position - camera.global_position
		var distance := offset.length()
		if distance <= 0.01:
			continue
		var aim := forward.dot(offset.normalized())
		if aim < 0.35:
			continue
		var score := distance - aim * 2.0
		if score < best_score:
			best_score = score
			best_target = target

	var game_manager := get_node_or_null("/root/GameManager")
	if best_target and game_manager:
		game_manager.set_focus_name(str(best_target.get("display_name")))
	else:
		if game_manager:
			game_manager.set_focus_name("")

func _interact_with_focus() -> void:
	var focus := _get_current_focus()
	if focus and focus.has_method("interact"):
		focus.interact()

func _get_current_focus() -> Area3D:
	var best_target: Area3D = null
	var best_score := INF
	var forward := -camera.global_transform.basis.z.normalized()

	for target in focus_targets:
		if not is_instance_valid(target):
			continue
		var offset := target.global_position - camera.global_position
		var distance := offset.length()
		var aim := forward.dot(offset.normalized())
		if distance > 4.2 or aim < 0.25:
			continue
		var score := distance - aim * 2.0
		if score < best_score:
			best_score = score
			best_target = target

	return best_target

func _on_interaction_probe_area_entered(area: Area3D) -> void:
	if area.has_method("interact") and not focus_targets.has(area):
		focus_targets.append(area)

func _on_interaction_probe_area_exited(area: Area3D) -> void:
	focus_targets.erase(area)
