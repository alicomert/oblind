# Three.js Story Game Architecture Research

## Goal

Define a maintainable structure for `oblind`, a Three.js first-person story/horror game. The current prototype has the right core pieces: `Game` owns the loop, `RoomManager` owns room topology, `StoryManager` owns story state, and mechanics like crisis, heart rate, echo, and memory are already separate. The next step should keep that simplicity while preventing story logic from turning into one large branching file.

## Research Signals

- Three.js should stay focused on rendering scene objects, cameras, lights, and materials; game architecture must add input, state, audio, narrative, and progression around it. Sources: Three.js Scene docs and MDN Three.js game-development guide.
- Branching story and quest systems are state machines/graphs. Each player action should move narrative state through explicit transitions, not scattered `if` statements.
- Storylets are useful for replayable or reactive narrative: small self-contained narrative modules gated by preconditions such as location, flags, inventory, stress, or memory.

## Recommended Structure

Use a hybrid model:

1. **Spine:** a required main story path with chapters/beats. This prevents horror pacing from becoming random.
2. **Storylets:** optional or reactive moments triggered by conditions. Example: a hallway whisper appears only if `photo_seen` and `crisis >= 0.6`.
3. **Event Bus:** game systems emit events such as `ROOM_ENTERED`, `INTERACTED`, `MEMORY_FOUND`, `CRISIS_SPIKE`, and `CHOICE_SELECTED`. Story systems react to events and produce effects.
4. **World Systems:** keep Three.js rendering separate from input, narrative, room transitions, audio, and UI.

## Proposed Folders

```text
src/story/
  StoryManager.js
  StoryState.js
  storyEvents.js
  spine/
    chapter01.js
  storylets/
    bedroom.js
    corridor.js
  effects.js
src/core/
  gameState.js
  eventBus.js
src/systems/
  NarrativeSystem.js
  InteractionSystem.js
  RoomSystem.js
  AudioSystem.js
  CrisisSystem.js
```

## Story Node Shape

```js
{
  id: 'bedroom.photo_seen.whisper',
  type: 'storylet',
  location: 'bedroom',
  priority: 20,
  once: true,
  conditions: { flags: ['photo_seen'], minCrisis: 0.4 },
  text: ['The photo frame clicks behind you.'],
  effects: [{ type: 'ADD_FLAG', flag: 'heard_frame_click' }],
  choices: [{ label: 'Listen', next: 'corridor_entry' }]
}
```

## Implementation Order

1. Add `eventBus.js` and route room entry/interact events through it.
2. Split `STORY_FLOW` into `spine/` modules without changing behavior.
3. Add `StoryState` helpers for flags, memory, rooms, and seen storylets.
4. Add a `NarrativeSystem` that selects one eligible storylet after important events.
5. Keep `Game.tick()` as orchestration only: input, systems update, render.

## Guardrails

- Do not put story branching directly in `Game`.
- Do not make every choice a full branch; use the main spine for pacing.
- Do not rebuild all room geometry for small narrative changes.
- Keep content data testable without a browser or WebGL context.

## Sources

- Three.js Scene docs: https://threejs.org/docs/pages/Scene.html
- MDN Three.js game development guide: https://developer.mozilla.org/en-US/docs/Games/Techniques/3D_on_the_web/Building_up_a_basic_demo_with_Three.js
- Storylets design-space paper: https://mkremins.github.io/publications/Storylets_SketchingAMap.pdf
- Quest Driven Development: https://blog.rendall.dev/posts/2021/3/15/quest-driven-development/
