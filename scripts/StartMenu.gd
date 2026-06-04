extends CanvasLayer

signal game_started

@onready var root: Control = %Root
@onready var main_panel: VBoxContainer = %MainPanel
@onready var settings_panel: VBoxContainer = %SettingsPanel
@onready var credits_panel: VBoxContainer = %CreditsPanel
@onready var title_label: Label = %TitleLabel
@onready var start_button: Button = %StartButton
@onready var continue_button: Button = main_panel.get_node("ContinueButton") as Button
@onready var settings_button: Button = %SettingsButton
@onready var credits_button: Button = %CreditsButton
@onready var quit_button: Button = %QuitButton
@onready var back_from_settings_button: Button = %BackFromSettingsButton
@onready var back_from_credits_button: Button = %BackFromCreditsButton
@onready var settings_title_label: Label = settings_panel.get_node("SettingsTitle") as Label
@onready var language_label: Label = settings_panel.get_node("LanguageLabel") as Label
@onready var language_select: OptionButton = settings_panel.get_node("LanguageSelect") as OptionButton
@onready var brightness_label: Label = settings_panel.get_node("BrightnessLabel") as Label
@onready var music_label: Label = settings_panel.get_node("MusicLabel") as Label
@onready var sfx_label: Label = settings_panel.get_node("SfxLabel") as Label
@onready var brightness_slider: HSlider = %BrightnessSlider
@onready var music_slider: HSlider = %MusicSlider
@onready var sfx_slider: HSlider = %SfxSlider
@onready var background: TextureRect = %Background
@onready var shade: ColorRect = %Shade
@onready var menu_music: AudioStreamPlayer = %MenuMusic
@onready var hover_sound: AudioStreamPlayer = %HoverSound
@onready var click_sound: AudioStreamPlayer = %ClickSound

var started := false
var drift := 0.0
var locale := "en"

const LANGUAGES := [
	{"code": "en", "label": "English"},
	{"code": "tr", "label": "Turkce"},
]

const COPY := {
	"en": {
		"new_game": "NEW GAME",
		"continue": "CONTINUE",
		"settings": "SETTINGS",
		"credits": "CREDITS",
		"quit": "QUIT",
		"language": "LANGUAGE",
		"brightness": "BRIGHTNESS",
		"music": "MUSIC",
		"sfx": "SFX",
		"back": "BACK",
	},
	"tr": {
		"new_game": "YENI OYUN",
		"continue": "DEVAM ET",
		"settings": "AYARLAR",
		"credits": "EMEK VERENLER",
		"quit": "CIKIS",
		"language": "DIL",
		"brightness": "PARLAKLIK",
		"music": "MUZIK",
		"sfx": "EFEKTLER",
		"back": "GERI",
	},
}

func _ready() -> void:
	Input.mouse_mode = Input.MOUSE_MODE_VISIBLE
	_setup_language_select()
	_apply_locale(locale)
	_show_panel(main_panel)
	_connect_button(start_button, _on_start_pressed)
	_connect_button(settings_button, func() -> void: _show_panel(settings_panel))
	_connect_button(credits_button, func() -> void: _show_panel(credits_panel))
	_connect_button(quit_button, _on_quit_pressed)
	_connect_button(back_from_settings_button, func() -> void: _show_panel(main_panel))
	_connect_button(back_from_credits_button, func() -> void: _show_panel(main_panel))
	language_select.item_selected.connect(_on_language_selected)
	brightness_slider.value_changed.connect(_on_brightness_changed)
	music_slider.value_changed.connect(_on_music_changed)
	sfx_slider.value_changed.connect(_on_sfx_changed)
	menu_music.volume_db = linear_to_db(float(music_slider.value))
	hover_sound.volume_db = linear_to_db(float(sfx_slider.value))
	click_sound.volume_db = linear_to_db(float(sfx_slider.value))
	menu_music.play()
	start_button.grab_focus()

func _process(delta: float) -> void:
	drift += delta
	background.scale = Vector2.ONE * (1.015 + sin(drift * 0.2) * 0.004)
	background.position = Vector2(sin(drift * 0.13) * -8.0, cos(drift * 0.11) * -5.0)
	title_label.modulate.a = 0.84 + sin(drift * 1.8) * 0.08

func _connect_button(button: Button, callable: Callable) -> void:
	button.pressed.connect(func() -> void:
		_play_click()
		callable.call()
	)
	button.mouse_entered.connect(_play_hover)
	button.focus_entered.connect(_play_hover)

func _show_panel(panel: Control) -> void:
	main_panel.visible = panel == main_panel
	settings_panel.visible = panel == settings_panel
	credits_panel.visible = panel == credits_panel
	var focus_target := start_button
	if panel == settings_panel:
		focus_target = back_from_settings_button
	elif panel == credits_panel:
		focus_target = back_from_credits_button
	focus_target.call_deferred("grab_focus")

func _setup_language_select() -> void:
	language_select.clear()
	for index in range(LANGUAGES.size()):
		var language: Dictionary = LANGUAGES[index]
		language_select.add_item(language["label"], index)
		language_select.set_item_metadata(index, language["code"])
		if language["code"] == locale:
			language_select.select(index)

func _on_language_selected(index: int) -> void:
	var next_locale := str(language_select.get_item_metadata(index))
	_apply_locale(next_locale)

func _apply_locale(next_locale: String) -> void:
	if !COPY.has(next_locale):
		next_locale = "en"
	locale = next_locale
	var copy: Dictionary = COPY[locale]
	start_button.text = copy["new_game"]
	continue_button.text = copy["continue"]
	settings_button.text = copy["settings"]
	credits_button.text = copy["credits"]
	quit_button.text = copy["quit"]
	settings_title_label.text = copy["settings"]
	language_label.text = copy["language"]
	brightness_label.text = copy["brightness"]
	music_label.text = copy["music"]
	sfx_label.text = copy["sfx"]
	back_from_settings_button.text = copy["back"]
	back_from_credits_button.text = copy["back"]

func _on_start_pressed() -> void:
	if started:
		return
	started = true
	var tween := create_tween()
	tween.set_parallel(true)
	tween.tween_property(root, "modulate:a", 0.0, 0.65)
	tween.tween_property(menu_music, "volume_db", -40.0, 0.55)
	tween.set_parallel(false)
	tween.tween_callback(_finish_start)

func _finish_start() -> void:
	var player := get_tree().root.get_node_or_null("Main/Player")
	if player and player.has_method("set_input_enabled"):
		player.set_input_enabled(true)
	menu_music.stop()
	visible = false
	game_started.emit()

func _on_quit_pressed() -> void:
	get_tree().quit()

func _on_brightness_changed(value: float) -> void:
	var brightness := 0.62 + float(value) * 0.55
	background.modulate = Color(brightness, brightness, brightness, 1.0)
	shade.color = Color(0.0, 0.0, 0.0, 0.58 - float(value) * 0.24)

func _on_music_changed(value: float) -> void:
	menu_music.volume_db = linear_to_db(maxf(0.001, float(value)))

func _on_sfx_changed(value: float) -> void:
	var db := linear_to_db(maxf(0.001, float(value)))
	hover_sound.volume_db = db
	click_sound.volume_db = db

func _play_hover() -> void:
	if started:
		return
	hover_sound.stop()
	hover_sound.play()

func _play_click() -> void:
	if started:
		return
	click_sound.stop()
	click_sound.play()
