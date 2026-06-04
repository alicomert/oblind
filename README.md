# OBLIND

Godot 4.x tabanli karanlik 3D hikaye prototipi.

## Calistirma

1. Godot 4.x ac.
2. `Import` ile bu klasoru sec.
3. Ana sahne: `res://scenes/Main.tscn`
4. Play tusuna bas.

## Canli Web Test

Her `main` push'u GitHub Actions uzerinden Godot Web export alir ve GitHub Pages'e yayinlar. CI export araci Godot `4.5` kullanir.

Canli test adresi:

```text
https://alicomert.github.io/oblind/
```

Yerel Linux test icin:

```bash
GODOT_BIN=godot4 PORT=8080 ./tools/export_web_preview.sh
```

Godot binary adin `godot` ise:

```bash
./tools/export_web_preview.sh
```

## Kontroller

- `WASD` veya sol analog: hareket
- Mouse veya sag analog: bakis
- `F`, `Enter` veya gamepad alt tusu: etkilesim
- `Esc`: mouse yakalama ac/kapat

## Yapi

- `scenes/Main.tscn`: ana oyun sahnesi
- `scenes/player/Player.tscn`: FPS karakter
- `scenes/rooms/TestRoom.tscn`: ilk karanlik test odasi
- `scenes/ui/HUD.tscn`: hikaye ve etkilesim arayuzu
- `scenes/ui/StartMenu.tscn`: 529ddea baslangic ekrani, background, menu muzikleri ve UI sesleri
- `scripts/GameManager.gd`: input, titreşim ve ortak durum
- `scripts/StoryManager.gd`: hikaye akisi
- `scripts/PlayerController.gd`: hareket, kamera ve etkilesim
- `scripts/InteractionTarget.gd`: sahnedeki etkilesimli objeler
