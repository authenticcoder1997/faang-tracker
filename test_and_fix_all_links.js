import fs from 'fs';

// 1. LLD Topics with validated Algomaster URLs
const lldTopics = [
  // Games & Puzzles
  { id: 'lld-4', title: 'Design Tic Tac Toe', section: 'Games & Puzzles', difficulty: 'Easy', url: 'https://algomaster.io/learn/lld/design-tic-tac-toe' },
  { id: 'lld-5', title: 'Design Snake and Ladder', section: 'Games & Puzzles', difficulty: 'Easy', url: 'https://algomaster.io/learn/lld/design-snake-and-ladder' },
  { id: 'lld-16', title: 'Design Chess Game', section: 'Games & Puzzles', difficulty: 'Hard', url: 'https://algomaster.io/learn/lld/design-chess-game' },
  
  // Data Structures & Search
  { id: 'lld-6', title: 'Design LRU Cache', section: 'Data Structures & Search', difficulty: 'Easy', url: 'https://algomaster.io/learn/lld/design-lru-cache' },
  { id: 'lld-6b', title: 'Design Bloom Filter', section: 'Data Structures & Search', difficulty: 'Easy', url: 'https://algomaster.io/learn/lld/design-bloom-filter' },
  { id: 'lld-6c', title: 'Design Search Autocomplete System', section: 'Data Structures & Search', difficulty: 'Easy', url: 'https://algomaster.io/learn/lld/design-search-autocomplete' },
  { id: 'lld-6d', title: 'Design Simple Search Engine', section: 'Data Structures & Search', difficulty: 'Medium', url: 'https://algomaster.io/learn/lld/design-search-engine' },

  // Managing States
  { id: 'lld-7', title: 'Design ATM', section: 'Managing States', difficulty: 'Medium', url: 'https://algomaster.io/learn/lld/design-atm' },
  { id: 'lld-8', title: 'Design Vending Machine', section: 'Managing States', difficulty: 'Medium', url: 'https://algomaster.io/learn/lld/design-vending-machine' },
  { id: 'lld-9', title: 'Design Elevator System', section: 'Managing States', difficulty: 'Medium', url: 'https://algomaster.io/learn/lld/design-elevator-system' },
  { id: 'lld-10', title: 'Design Traffic Control System', section: 'Managing States', difficulty: 'Medium', url: 'https://algomaster.io/learn/lld/design-traffic-control-system' },
  { id: 'lld-19', title: 'Design Coffee Vending Machine', section: 'Managing States', difficulty: 'Hard', url: 'https://algomaster.io/learn/lld/design-coffee-vending-machine' },

  // Management Systems
  { id: 'lld-1', title: 'Design Parking Lot', section: 'Management Systems', difficulty: 'Easy', url: 'https://algomaster.io/learn/lld/design-parking-lot' },
  { id: 'lld-2', title: 'Design Task Management System', section: 'Management Systems', difficulty: 'Easy', url: 'https://algomaster.io/learn/lld/design-task-management-system' },
  { id: 'lld-11', title: 'Design Inventory Management System', section: 'Management Systems', difficulty: 'Medium', url: 'https://algomaster.io/learn/lld/design-inventory-management-system' },
  { id: 'lld-12', title: 'Design Library Management System', section: 'Management Systems', difficulty: 'Medium', url: 'https://algomaster.io/learn/lld/design-library-management-system' },
  { id: 'lld-18', title: 'Design Restaurant Management System', section: 'Management Systems', difficulty: 'Medium', url: 'https://algomaster.io/learn/lld/design-restaurant-management-system' },
  { id: 'lld-20', title: 'Design Stack Overflow', section: 'Management Systems', difficulty: 'Hard', url: 'https://algomaster.io/learn/lld/design-stack-overflow' },

  // Platforms & Networks
  { id: 'lld-3', title: 'Design Notification System', section: 'Platforms & Networks', difficulty: 'Easy', url: 'https://algomaster.io/learn/lld/design-notification-system' },
  { id: 'lld-14', title: 'Design a Social Network', section: 'Platforms & Networks', difficulty: 'Medium', url: 'https://algomaster.io/learn/lld/design-social-network' },
  { id: 'lld-15', title: 'Design Learning Platform', section: 'Platforms & Networks', difficulty: 'Medium', url: 'https://algomaster.io/learn/lld/design-learning-platform' },
  { id: 'lld-17', title: 'Design Online Shopping Cart', section: 'Platforms & Networks', difficulty: 'Medium', url: 'https://algomaster.io/learn/lld/design-shopping-cart' },
  { id: 'lld-21', title: 'Design Cricinfo', section: 'Platforms & Networks', difficulty: 'Hard', url: 'https://algomaster.io/learn/lld/design-cricinfo' },
  { id: 'lld-22', title: 'Design LinkedIn', section: 'Platforms & Networks', difficulty: 'Hard', url: 'https://algomaster.io/learn/lld/design-linkedin' },
  { id: 'lld-23', title: 'Design Spotify', section: 'Platforms & Networks', difficulty: 'Hard', url: 'https://algomaster.io/learn/lld/design-spotify' },
  { id: 'lld-24', title: 'Design Ride Sharing App (Uber)', section: 'Platforms & Networks', difficulty: 'Hard', url: 'https://algomaster.io/learn/lld/design-uber' },
  { id: 'lld-25', title: 'Design Food Delivery App', section: 'Platforms & Networks', difficulty: 'Hard', url: 'https://algomaster.io/learn/lld/design-online-food-delivery-service' },
  { id: 'lld-26', title: 'Design Chat Application', section: 'Platforms & Networks', difficulty: 'Hard', url: 'https://algomaster.io/learn/lld/design-chat-application' },
];

// 2. HLD Topics with validated HelloInterview URLs
const hldTopics = [
  // Easy (4)
  { id: 'hld-1', title: 'Bitly', difficulty: 'Easy', url: 'https://www.hellointerview.com/learn/system-design/problem-breakdowns/bitly' },
  { id: 'hld-2', title: 'Dropbox', difficulty: 'Easy', url: 'https://www.hellointerview.com/learn/system-design/problem-breakdowns/dropbox' },
  { id: 'hld-3', title: 'Local Delivery Service (GoPuff)', difficulty: 'Easy', url: 'https://www.hellointerview.com/learn/system-design/problem-breakdowns/gopuff' },
  { id: 'hld-4', title: 'Rate Limiter', difficulty: 'Easy', url: 'https://www.hellointerview.com/learn/system-design/problem-breakdowns/distributed-rate-limiter' },
  // Medium (18)
  { id: 'hld-5', title: 'Ticketmaster', difficulty: 'Medium', url: 'https://www.hellointerview.com/learn/system-design/problem-breakdowns/ticketmaster' },
  { id: 'hld-6', title: 'FB News Feed', difficulty: 'Medium', url: 'https://www.hellointerview.com/learn/system-design/problem-breakdowns/fb-news-feed' },
  { id: 'hld-7', title: 'Tinder', difficulty: 'Medium', url: 'https://www.hellointerview.com/learn/system-design/problem-breakdowns/tinder' },
  { id: 'hld-8', title: 'LeetCode', difficulty: 'Medium', url: 'https://www.hellointerview.com/learn/system-design/problem-breakdowns/leetcode' },
  { id: 'hld-9', title: 'WhatsApp', difficulty: 'Medium', url: 'https://www.hellointerview.com/learn/system-design/problem-breakdowns/whatsapp' },
  { id: 'hld-10', title: 'YouTube', difficulty: 'Medium', url: 'https://www.hellointerview.com/learn/system-design/problem-breakdowns/youtube' },
  { id: 'hld-11', title: 'FB Live Comments', difficulty: 'Medium', url: 'https://www.hellointerview.com/learn/system-design/problem-breakdowns/fb-live-comments' },
  { id: 'hld-12', title: 'Ad Click Aggregator', difficulty: 'Medium', url: 'https://www.hellointerview.com/learn/system-design/problem-breakdowns/ad-click-aggregator' },
  { id: 'hld-13', title: 'Top K Elements / Heavy Hitters', difficulty: 'Medium', url: 'https://www.hellointerview.com/learn/system-design/problem-breakdowns/top-k' },
  { id: 'hld-14', title: 'Uber (Ride Hailing)', difficulty: 'Medium', url: 'https://www.hellointerview.com/learn/system-design/problem-breakdowns/uber' },
  { id: 'hld-15', title: 'Web Crawler', difficulty: 'Medium', url: 'https://www.hellointerview.com/learn/system-design/problem-breakdowns/web-crawler' },
  { id: 'hld-16', title: 'FB Post Search', difficulty: 'Medium', url: 'https://www.hellointerview.com/learn/system-design/problem-breakdowns/fb-post-search' },
  // Hard & Deep Dives (8)
  { id: 'hld-17', title: 'Redis Deep Dive', difficulty: 'Hard', url: 'https://www.hellointerview.com/learn/system-design/deep-dives/redis' },
  { id: 'hld-18', title: 'Elasticsearch Deep Dive', difficulty: 'Hard', url: 'https://www.hellointerview.com/learn/system-design/deep-dives/elasticsearch' },
  { id: 'hld-19', title: 'Kafka Deep Dive', difficulty: 'Hard', url: 'https://www.hellointerview.com/learn/system-design/deep-dives/kafka' },
  { id: 'hld-20', title: 'API Gateway Deep Dive', difficulty: 'Hard', url: 'https://www.hellointerview.com/learn/system-design/deep-dives/api-gateway' },
  { id: 'hld-21', title: 'Cassandra Deep Dive', difficulty: 'Hard', url: 'https://www.hellointerview.com/learn/system-design/deep-dives/cassandra' },
  { id: 'hld-22', title: 'DynamoDB Deep Dive', difficulty: 'Hard', url: 'https://www.hellointerview.com/learn/system-design/deep-dives/dynamodb' },
  { id: 'hld-23', title: 'Proximity Search Deep Dive', difficulty: 'Hard', url: 'https://www.hellointerview.com/learn/system-design/deep-dives/proximity-search' },
  { id: 'hld-24', title: 'Time Series DB Deep Dive', difficulty: 'Hard', url: 'https://www.hellointerview.com/learn/system-design/deep-dives/time-series-databases' },
];

async function verifyAll() {
  console.log("Verifying all LLD links...");
  let lldErrors = 0;
  for (const item of lldTopics) {
    try {
      const res = await fetch(item.url);
      if (!res.ok) {
        console.error(`[FAIL ${res.status}] LLD: ${item.title} -> ${item.url}`);
        lldErrors++;
      } else {
        console.log(`[OK ${res.status}] LLD: ${item.title}`);
      }
    } catch(e) {
      console.error(`[ERR] LLD: ${item.title} -> ${e.message}`);
      lldErrors++;
    }
  }

  console.log("\nVerifying all HLD links...");
  let hldErrors = 0;
  for (const item of hldTopics) {
    try {
      const res = await fetch(item.url);
      if (!res.ok) {
        console.error(`[FAIL ${res.status}] HLD: ${item.title} -> ${item.url}`);
        hldErrors++;
      } else {
        console.log(`[OK ${res.status}] HLD: ${item.title}`);
      }
    } catch(e) {
      console.error(`[ERR] HLD: ${item.title} -> ${e.message}`);
      hldErrors++;
    }
  }

  console.log(`\nLLD Errors: ${lldErrors}, HLD Errors: ${hldErrors}`);
  if (lldErrors === 0 && hldErrors === 0) {
    console.log("Writing updated files...");
    fs.writeFileSync('src/data/lldTopics.js', `export const lldTopics = ${JSON.stringify(lldTopics, null, 2)};\n`);
    fs.writeFileSync('src/data/hldTopics.js', `export const hldTopics = ${JSON.stringify(hldTopics, null, 2)};\n`);
    console.log("Saved successfully!");
  }
}

verifyAll();
