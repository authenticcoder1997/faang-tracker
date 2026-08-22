const fs = require('fs');

const topics = [
  {id: "lld-1", title: "Design Tic Tac Toe"},
  {id: "lld-2", title: "Design Snake and Ladder Game"},
  {id: "lld-3", title: "Design Minesweeper Game"},
  {id: "lld-4", title: "Design Chess Game"},
  {id: "lld-5", title: "Design Sudoku System"},
  {id: "lld-6", title: "Design 2048 Game"},
  {id: "lld-7", title: "Design Bowling Alley System"},
  {id: "lld-8", title: "Design BlackJack Game"},
  {id: "lld-9", title: "Design Connect Four"},
  {id: "lld-10", title: "Design Logging Framework"},
  {id: "lld-11", title: "Design Cache"},
  {id: "lld-12", title: "Design Pub-Sub System"},
  {id: "lld-13", title: "Design Message Queue"},
  {id: "lld-14", title: "Design Distributed Lock"},
  {id: "lld-15", title: "Design Rate Limiter"},
  {id: "lld-16", title: "Design Connection Pool"},
  {id: "lld-17", title: "Design Circuit Breaker"},
  {id: "lld-18", title: "Design Rule Engine"},
  {id: "lld-19", title: "Design Job Scheduler"},
  {id: "lld-20", title: "Design Vending Machine"},
  {id: "lld-21", title: "Design ATM System"},
  {id: "lld-22", title: "Design Elevator System"},
  {id: "lld-23", title: "Design Parking Lot"},
  {id: "lld-24", title: "Design Airline Management System"},
  {id: "lld-25", title: "Design Library Management System"},
  {id: "lld-26", title: "Design Hotel Management System"},
  {id: "lld-27", title: "Design Movie Ticket Booking System"},
  {id: "lld-28", title: "Design StackOverflow"},
  {id: "lld-29", title: "Design Splitwise"},
  {id: "lld-30", title: "Design WhatsApp"},
  {id: "lld-31", title: "Design Ride Sharing App"},
  {id: "lld-32", title: "Design Food Delivery App"},
  {id: "lld-33", title: "Design Snake and Ladder Game"}, // wait, duplicate?
  {id: "lld-34", title: "Design Bloom Filter"},
  {id: "lld-35", title: "Design Search Autocomplete"},
  {id: "lld-36", title: "Design Traffic Control System"},
  {id: "lld-37", title: "Design Task Management System"},
  {id: "lld-38", title: "Design Inventory Management System"},
  {id: "lld-39", title: "Design Restaurant Management System"},
  {id: "lld-40", title: "Design Social Network"},
  {id: "lld-41", title: "Design LinkedIn"},
  {id: "lld-42", title: "Design Spotify"},
  {id: "lld-43", title: "Design Notification System"},
  {id: "lld-44", title: "Design Payment Gateway"},
  {id: "lld-45", title: "Design Online Stock Exchange"}
];

const patternsMap = {
  "lld-1": "Strategy", "lld-2": "Singleton, Factory", "lld-3": "Observer", "lld-4": "Command, Strategy", 
  "lld-5": "Backtracking, Factory", "lld-6": "Observer", "lld-7": "State, Strategy", "lld-8": "State",
  "lld-9": "Strategy", "lld-10": "Chain of Responsibility", "lld-11": "Strategy, Factory", "lld-12": "Observer, Singleton",
  "lld-13": "Observer", "lld-14": "Singleton", "lld-15": "Strategy, Token Bucket", "lld-16": "Singleton, Object Pool",
  "lld-17": "State, Proxy", "lld-18": "Strategy, Composite", "lld-19": "Command, Priority Queue", "lld-20": "State",
  "lld-21": "State, Factory", "lld-22": "State, Strategy", "lld-23": "Strategy, Factory", "lld-24": "Factory, Observer",
  "lld-25": "Factory", "lld-26": "Factory, Decorator", "lld-27": "Concurrency, State", "lld-28": "Observer",
  "lld-29": "Strategy (Settlement)", "lld-30": "Observer, Pub-Sub", "lld-31": "Strategy, Observer", "lld-32": "Observer, State",
  "lld-33": "Singleton", "lld-34": "Hash Functions", "lld-35": "Trie", "lld-36": "State", "lld-37": "State, Observer",
  "lld-38": "Observer", "lld-39": "State, Factory", "lld-40": "Graph, Observer", "lld-41": "Observer", "lld-42": "Proxy, Flyweight",
  "lld-43": "Observer, Strategy", "lld-44": "Strategy, Facade", "lld-45": "Command, Observer"
};

let content = fs.readFileSync('src/data/lldTopics.js', 'utf8');

Object.entries(patternsMap).forEach(([id, pattern]) => {
  const regex = new RegExp(`("id":\\s*"${id}"[\\s\\S]*?"completed":\\s*false)`);
  content = content.replace(regex, `$1,\n    "pattern": "${pattern}"`);
});

fs.writeFileSync('src/data/lldTopics.js', content);
console.log("Updated patterns!");
