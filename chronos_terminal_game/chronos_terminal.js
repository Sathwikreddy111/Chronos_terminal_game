// chronos_terminal.js
const readline = require("readline");

readline.emitKeypressEvents(process.stdin);
process.stdin.setRawMode(true);

class Room {
  constructor(name, description, timeFlow, exits, objects = [], npc = null) {
    this.name = name;
    this.description = description;
    this.timeFlow = timeFlow;
    this.exits = exits;
    this.objects = objects;
    this.npc = npc;
  }
}
class Item {
  constructor(name, description, ageable = false, age = 0) {
    this.name = name;
    this.description = description;
    this.ageable = ageable;
    this.age = age;
  }
  update(flow) {
    if (this.ageable) this.age += flow;
  }
  status() {
    if (!this.ageable) return this.description;
    if (this.age < 5) return `${this.name} is fresh.`;
    if (this.age < 10) return `${this.name} is aging.`;
    return `${this.name} is decayed.`;
  }
}
class NPC {
  constructor(name, dialogues) {
    this.name = name;
    this.dialogues = dialogues;
  }
  speak(flow) {
    if (flow === 0) return `${this.name} is frozen in time.`;
    if (flow < 0.5) return `${this.name} says: "${this.dialogues.slow}"`;
    if (flow > 2) return `${this.name} says: "${this.dialogues.fast}"`;
    return `${this.name} says: "${this.dialogues.normal}"`;
  }
}

const inventory = [];
let chronoStability = 100;
let minutesPassed = 0;

const world = {
  "Entry Hall": new Room(
    "Entry Hall",
    "Silent concrete and flickering lights.",
    1,
    { d: "Slow Chamber" },
    [new Item("apple", "A bright red apple.", true)]
  ),
  "Slow Chamber": new Room(
    "Slow Chamber",
    "Dust drifts. Time is syrup here.",
    0.2,
    { a: "Entry Hall", w: "Archive Node" },
    [new Item("watch", "An old watch.")],
    new NPC("Caretaker", {
      slow: "Tiiiimmmmmeeee issss sssllloooowww...",
      normal: "Time used to be simple.",
      fast: "Can'tstopcan'tstop!",
    })
  ),
  "Archive Node": new Room(
    "Archive Node",
    "A still figure remains locked in place.",
    0,
    { s: "Slow Chamber", d: "Speed Tunnel" },
    [new Item("key", "A brass key.")]
  ),
  "Speed Tunnel": new Room(
    "Speed Tunnel",
    "Everything rushes. You feel unstable.",
    3,
    { a: "Archive Node" },
    [],
    new NPC("Whisperer", {
      slow: "...whisper...",
      normal: "You shouldn't be here.",
      fast: "GETOUTGETOUTGETOUT!",
    })
  ),
};

let currentRoom = world["Entry Hall"];

function tickTime(flow) {
  minutesPassed += Math.round(flow * 5);
  chronoStability -= Math.floor(Math.abs(flow - 1) * 5);
  for (const item of inventory) item.update(flow);
  if (chronoStability <= 30) {
    console.log(">> You feel your thoughts slipping...");
  }
  if (chronoStability <= 0) {
    console.log(">> Time collapses around you. Game over.");
    process.exit();
  }
}

function printRoom(room) {
  console.clear();
  console.log(`=== ${room.name} ===`);
  console.log(room.description);
  console.log(`Time Flow: ${room.timeFlow}x`);
  if (room.npc) console.log(`You see ${room.npc.name} here.`);
  console.log(`Objects: ${room.objects.map(o => o.name).join(", ") || "none"}`);
  console.log(`Exits: ${Object.keys(room.exits).join(", ")}`);
  console.log("\nControls: W/A/S/D Move | E Take | Q Drop | T Talk | I Inventory | C Clock | X Quit\n");
}

function showInventory() {
  console.log("\nInventory:");
  if (inventory.length === 0) return console.log("  (empty)");
  inventory.forEach(item => console.log(`  - ${item.name}: ${item.status()}`));
}

printRoom(currentRoom);

process.stdin.on("keypress", (str, key) => {
  const k = key.name;

  if (k === 'x') {
    console.log("Exiting Chronos Terminal...");
    process.exit();
  }

  if (['w', 'a', 's', 'd'].includes(k)) {
    const nextRoom = currentRoom.exits[k];
    if (nextRoom) {
      currentRoom = world[nextRoom];
      tickTime(currentRoom.timeFlow);
      printRoom(currentRoom);
    } else {
      console.log("Blocked path.");
    }
  }

  if (k === 'l') {
    printRoom(currentRoom);
  }

  if (k === 'e') {
    if (currentRoom.objects.length > 0) {
      const item = currentRoom.objects.shift();
      inventory.push(item);
      console.log(`You took the ${item.name}.`);
    } else {
      console.log("Nothing to take.");
    }
  }

  if (k === 'q') {
    if (inventory.length > 0) {
      const item = inventory.shift();
      currentRoom.objects.push(item);
      console.log(`You dropped the ${item.name}.`);
    } else {
      console.log("Inventory empty.");
    }
  }

  if (k === 't') {
    if (currentRoom.npc) {
      console.log(currentRoom.npc.speak(currentRoom.timeFlow));
    } else {
      console.log("No one to talk to.");
    }
  }

  if (k === 'i') {
    showInventory();
  }

  if (k === 'c') {
    console.log(`ChronoTime: ${minutesPassed} min | Stability: ${chronoStability}%`);
  }

  if (k === 'h') {
    console.log("W/A/S/D Move | E Take | Q Drop | T Talk | I Inventory | C Clock | X Quit");
  }
});
