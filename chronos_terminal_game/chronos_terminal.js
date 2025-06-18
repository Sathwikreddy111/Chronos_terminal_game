// chronos_expanded_game.js
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
    if (flow < 0.5) return `${this.name} says: \"${this.dialogues.slow}\"`;
    if (flow > 2) return `${this.name} says: \"${this.dialogues.fast}\"`;
    return `${this.name} says: \"${this.dialogues.normal}\"`;
  }
}

const inventory = [];
let chronoStability = 100;
let minutesPassed = 0;

const requiredItems = [
  "Containment Gel",
  "Stabilized Enzyme",
  "Reactive Agent Z",
  "Gas Neutralizer",
  "Mechanical Injector",
  "Battery Regulator Chip"
];

const world = {
  "Quarantine Cell": new Room(
    "Quarantine Cell",
    "Dim room. Flashbacks. First clue to vaccine begins here.",
    1,
    { d: "Archive Chamber" },
    [
      new Item("Containment Gel", "A rare substance to hold unstable chemicals.", true),
      new Item("Blood Vial", "Red and clotted.", true),
      new Item("Thermos", "Filled with cold soup.")
    ]
  ),
  "Archive Chamber": new Room(
    "Archive Chamber",
    "Silent rows of data. Clues embedded in logs.",
    0.8,
    { a: "Quarantine Cell", s: "Bio-Chem Lab" },
    [
      new Item("Stabilized Enzyme", "A modified protein crucial for synthesis.", true),
      new Item("Data Disk", "Old archive with corrupted data."),
      new Item("Dusty Clipboard", "Unreadable documents.")
    ]
  ),
  "Bio-Chem Lab": new Room(
    "Bio-Chem Lab",
    "The lab smells of rot and chemicals.",
    1.5,
    { w: "Archive Chamber", e: "Ventilation Nexus" },
    [
      new Item("Reactive Agent Z", "A catalyst needed for final binding.", true),
      new Item("Broken Beaker", "Glass pieces."),
      new Item("Heat Sensor", "Non-functional.")
    ]
  ),
  "Ventilation Nexus": new Room(
    "Ventilation Nexus",
    "Gas leak threat—wrong item leads to choking.",
    0.5,
    { w: "Bio-Chem Lab", s: "Robotics Bay" },
    [
      new Item("Gas Neutralizer", "Neutralizes airborne toxins."),
      new Item("Metal Pipe", "Too heavy to carry."),
      new Item("Airflow Chart", "Outdated and torn.")
    ]
  ),
  "Robotics Bay": new Room(
    "Robotics Bay",
    "Machinery twitches. One tool remains functional.",
    1,
    { n: "Ventilation Nexus", e: "Power Core" },
    [
      new Item("Mechanical Injector", "Precise delivery device for serum."),
      new Item("Drone Arm", "Too bulky."),
      new Item("Broken Panel", "Sparking wires.")
    ]
  ),
  "Power Core": new Room(
    "Power Core",
    "Surge room. Wrong item causes instability.",
    2.5,
    { w: "Robotics Bay", d: "Vaccine Assembly Lab" },
    [
      new Item("Battery Regulator Chip", "Stabilizes high energy output."),
      new Item("Loose Cable", "Worn and frayed."),
      new Item("Energy Cell", "Drained.")
    ]
  ),
  "Vaccine Assembly Lab": new Room(
    "Vaccine Assembly Lab",
    "Final showdown. Combine everything under pressure.",
    1,
    { u: "Power Core" },
    []
  )
};

let currentRoom = null;

function tickTime(flow) {
  minutesPassed += Math.round(flow * 5);
  chronoStability -= Math.floor(Math.abs(flow - 1) * 5);
  for (const item of inventory) item.update(flow);
  if (chronoStability <= 30) console.log(">> You feel your thoughts slipping...");
  if (chronoStability <= 0) {
    console.log(">> Time collapses around you. Game over.");
    process.exit();
  }
}

function printRoom(room) {
  console.clear();
  console.log(`=== ${room.name} ===`);
  console.log(room.description);
  const flowLabel = room.timeFlow < 0.7 ? "SLOW" : room.timeFlow > 1.3 ? "FAST" : "NORMAL";
  console.log(`Time Flow: ${room.timeFlow}x (${flowLabel})`);
  console.log(`Objects: ${room.objects.map(o => o.name).join(", ") || "none"}`);
  console.log(`Exits: ${Object.keys(room.exits).join(", ")}`);
  console.log("\nControls: W/A/S/D/U Move | E Take | I Inventory | C Clock | X Quit\n");
  if (room.name === "Vaccine Assembly Lab") checkVaccineCompletion();
}

function showInventory() {
  console.log("\nInventory:");
  if (inventory.length === 0) return console.log("  (empty)");
  inventory.forEach(item => console.log(`  - ${item.name}: ${item.status()}`));
}

function checkVaccineCompletion() {
  const playerItems = inventory.map(i => i.name);
  const hasAll = requiredItems.every(item => playerItems.includes(item));
  if (hasAll) {
    console.log("\n>> Dr. Voss quickly assembles the serum...");
    console.log(">> The vaccine stabilizes. He injects himself and collapses.");
    console.log(">> Moments later... his vision clears. The infection is gone.");
    console.log("🏆 YOU WIN! The world has hope again. 🧬");
    process.exit();
  } else {
    console.log("\n>> You don’t have all components. The cure fails. Time collapses around you.");
    console.log("💀 GAME OVER 💀");
    process.exit();
  }
}

function chooseItem(room) {
  if (room.objects.length === 0) return console.log("Nothing to take.");
  console.log("Choose an item to take:");
  room.objects.forEach((item, index) => {
    console.log(`  ${index + 1}. ${item.name} - ${item.description}`);
  });
  process.stdin.once("data", data => {
    const choice = parseInt(data.toString());
    if (choice >= 1 && choice <= room.objects.length) {
      const item = room.objects.splice(choice - 1, 1)[0];
      inventory.push(item);
      console.log(`You took the ${item.name}.`);
    } else {
      console.log("Invalid choice.");
    }
  });
}

function intro() {
  console.clear();
  console.log("\n\"WARNING: YOU HAVE BEEN INFECTED.\"\n");
  console.log("\"Only a vaccine can save you. Somewhere in the lab... it exists.\"");
  console.log("\n>>> Press [ENTER] to enter the LAB <<<\n");
  process.stdin.once("data", () => {
    currentRoom = world["Quarantine Cell"];
    printRoom(currentRoom);
  });
}

intro();

process.stdin.on("keypress", (str, key) => {
  if (!currentRoom) return;
  const k = key.name;
  if (k === 'x') {
    console.log("Exiting Chronos Terminal...");
    process.exit();
  }
  if (["w", "a", "s", "d", "u"].includes(k)) {
    const nextRoomKey = currentRoom.exits[k];
    if (nextRoomKey && world[nextRoomKey]) {
      currentRoom = world[nextRoomKey];
      tickTime(currentRoom.timeFlow);
      printRoom(currentRoom);
    } else {
      console.log("No path in that direction.");
    }
  }
  if (k === 'e') chooseItem(currentRoom);
  if (k === 'i') showInventory();
  if (k === 'c') console.log(`ChronoTime: ${minutesPassed} min | Stability: ${chronoStability}%`);
});
