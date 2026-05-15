export const STORY_FLOW = {
  intro: {
    sceneLabel: 'Uyandın',
    text: [
      'Gözlerini açtığında karanlık bir odadasın.',
      'Hareketsiz bir fısıltı duvarlardan geri dönüyor.',
    ],
    hints: [
      'Farklı noktalara yaklaş',
      'E tuşu / gamepad A ile etkileşime geç',
      'Hikaye ilerledikçe etki alanı daralır.',
    ],
    choices: [
      { label: 'Fotoğrafa bak', next: 'photo', requires: 'bedroom-photo' },
      { label: 'Koridora geç', next: 'corridor_entry', requiresRoom: 'corridor' },
    ],
  },
  photo: {
    sceneLabel: 'Fotoğraf',
    text: [
      'Duvara asılı fotoğrafta, odanın farklı bir zamanını görüyorsun.',
      'Karanlık bir şey arka planda duruyor ama yüzü görünmüyor.',
    ],
    choices: [
      { label: 'Koridora geri dön', next: 'corridor_entry' },
      { label: 'Sessizce saklan', next: 'quiet' },
    ],
    flags: ['photo_seen'],
  },
  noise: {
    sceneLabel: 'Tıngırtı',
    text: ['Koridorda bir şey var. Sessiz kal, adım atmayı hızlandırma.'],
    choices: [
      { label: 'İlerle', next: 'corridor_entry' },
      { label: 'Geri dön', next: 'photo' },
    ],
    flags: ['noise_heard'],
  },
  corridor_entry: {
    sceneLabel: 'Koridor',
    text: ['Bir süre geçildiğinde seslerin yönü değişiyor.'],
    choices: [
      { label: 'Mutfaktan araştır', next: 'fridge' },
      { label: 'Banyoya git', next: 'vent' },
      { label: 'Saklanıp dinle', next: 'quiet' },
    ],
  },
  fridge: {
    sceneLabel: 'Mutfak',
    text: ['Buzdolabı hiç kapanmamış gibi... içeriden buz gibi hava yayılıyor.'],
    choices: [
      { label: 'Kornağa dön', next: 'corridor_entry' },
      { label: 'Banyo tara', next: 'vent' },
    ],
    flags: ['fridge_touched'],
  },
  vent: {
    sceneLabel: 'Nemli Yankı',
    text: ['Havalandırma kanalı sanki bir şeyi bastırmak için uğulduyor.'],
    choices: [
      { label: 'Karanlıkla barış', next: 'quiet' },
      { label: 'Bodruma yönel', next: 'basement' },
    ],
    flags: ['vent_touched'],
  },
  basement: {
    sceneLabel: 'Bodrum',
    text: ['Bodrumda sesin kaynağı yalnızca senin nefesin değil.'],
    ending: 'true_end',
  },
  quiet: {
    sceneLabel: 'Sessizlik',
    text: ['Nefesini tutarsan, ev biraz daha sessizleşiyor.'],
    choices: [
      { label: 'Yeniden dışarı çık', next: 'corridor_entry' },
      { label: 'Geri dön', next: 'intro' },
    ],
    flags: ['quietness'],
  },
};

export class StoryManager {
  constructor(flow) {
    this.flow = flow;
    this.state = {
      current: 'intro',
      history: [],
      flags: new Set(),
      rooms: new Set(['bedroom']),
      memory: new Map(),
    };
    this.maxHistory = 40;
  }

  getCurrent() {
    return this.flow[this.state.current];
  }

  getCurrentLabel() {
    return this.getCurrent()?.sceneLabel ?? 'Bilinmeyen Bölge';
  }

  getPromptText() {
    const current = this.getCurrent();
    if (!current) return '';
    const body = [...(current.text ?? [])].join(' ');
    const hint = current.hints?.length ? ` İpucu: ${current.hints.join(' | ')}` : '';
    return body + hint;
  }

  pushMemory(key, value) {
    this.state.memory.set(key, value);
  }

  canChoose(choice) {
    if (!choice) return false;
    if (choice.requires && !this.state.memory.has(choice.requires)) return false;
    if (choice.requiresRoom) return this.state.rooms.has(choice.requiresRoom);
    return true;
  }

  getAvailableChoices() {
    return (this.getCurrent()?.choices ?? []).filter((choice) => this.canChoose(choice));
  }

  advance(choiceKey) {
    const current = this.getCurrent();
    const next =
      typeof choiceKey === 'string'
        ? current?.choices?.find((choice) => choice.label.toLowerCase() === choiceKey.toLowerCase())?.next
        : null;

    const direct = this.getCurrent()?.ending ? this.getCurrent().ending : null;
    const destination = choiceKey || next || direct;

    if (destination && this.flow[destination]) {
      this.state.history.unshift(this.state.current);
      this.state.current = destination;
      this.state.rooms.add(this.getCurrentRoomHint(destination));
      this.state.history = this.state.history.slice(0, this.maxHistory);
      this.state.currentFlags = this.getCurrent()?.flags ?? [];
      this.state.currentFlags.forEach((flag) => this.state.flags.add(flag));
      return destination;
    }

    return null;
  }

  getCurrentRoomHint(nodeId) {
    const map = {
      photo: 'bedroom',
      noise: 'corridor',
      corridor_entry: 'corridor',
      fridge: 'kitchen',
      vent: 'bathroom',
      basement: 'basement',
    };
    return map[nodeId] ?? this.getCurrent().sceneLabel?.toLowerCase() ?? 'corridor';
  }

  restart() {
    this.state.current = 'intro';
    this.state.flags.clear();
    this.state.rooms = new Set(['bedroom']);
    this.state.history = [];
    this.state.memory.clear();
  }
}
