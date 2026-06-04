extends Node

signal story_changed(title: String, body: String)

var current_key := "intro"
var flags: Dictionary = {}

var story := {
	"intro": {
		"title": "Uyandigin oda",
		"body": "Karanlik, odanin kenarlarindan iceri dogru yigilmis gibi. Bir sey hatirlamiyorsun.",
	},
	"photo": {
		"title": "Eski fotograf",
		"body": "Fotografta ayni oda var. Fakat yatagin yaninda durmasi gereken kisi silinmis.",
		"flag": "photo_seen",
	},
	"door": {
		"title": "Kilitli kapi",
		"body": "Kapi kolu soguk. Koridordan uc kez tikirti geliyor.",
		"flag": "door_checked",
	},
	"radio": {
		"title": "Bozuk radyo",
		"body": "Parazitlerin arasindan kendi nefesini duyuyorsun. Radyo senden once burada uyandi.",
		"flag": "radio_heard",
	},
}

func _ready() -> void:
	_emit_current()

func interact(story_key: String) -> void:
	if not story.has(story_key):
		return
	current_key = story_key
	var node: Dictionary = story[current_key]
	if node.has("flag"):
		flags[node["flag"]] = true
	_emit_current()

func reset() -> void:
	current_key = "intro"
	flags.clear()
	_emit_current()

func get_current_title() -> String:
	return story[current_key]["title"]

func get_current_body() -> String:
	return story[current_key]["body"]

func _emit_current() -> void:
	story_changed.emit(get_current_title(), get_current_body())
