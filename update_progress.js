import fs from 'fs';

const categories = [
  { 
    name: "Sorting & Arrays I", 
    completedCount: 5,
    problems: ["Set Matrix Zeroes", "Pascal's Triangle", "Next Permutation", "Maximum Subarray", "Sort Colors"] 
  },
  { 
    name: "Arrays II", 
    completedCount: 5,
    problems: ["Rotate Image", "Merge Intervals", "Merge Sorted Array", "Find the Duplicate Number", "Missing Number"] 
  },
  { 
    name: "Array III", 
    completedCount: 3,
    problems: ["Search a 2D Matrix", "Pow(x, n)", "Majority Element", "Majority Element II", "Unique Paths"] 
  },
  { 
    name: "Arrays IV & Hashing", 
    completedCount: 0,
    problems: ["Two Sum", "4Sum", "Longest Consecutive Sequence", "Subarray Sum Equals K", "Valid Anagram"] 
  },
  { 
    name: "Binary Search I", 
    completedCount: 5,
    problems: ["Binary Search", "Find First and Last Position of Element in Sorted Array", "Search Insert Position", "Search in Rotated Sorted Array", "Find Minimum in Rotated Sorted Array"] 
  },
  { 
    name: "Binary Search II", 
    completedCount: 1,
    problems: ["Koko Eating Bananas", "Minimum Number of Days to Make m Bouquets", "Aggressive Cows", "Allocate Books", "Median of Two Sorted Arrays"] 
  },
  { 
    name: "Binary Search III", 
    completedCount: 0,
    problems: ["Kth Missing Positive Number", "Split Array Largest Sum", "Capacity To Ship Packages Within D Days", "Find Peak Element"] 
  },
  { 
    name: "Recursion I", 
    completedCount: 0,
    problems: ["Subset Sums", "Subsets II", "Combination Sum", "Combination Sum II", "Palindrome Partitioning"] 
  },
  { 
    name: "Recursion II", 
    completedCount: 0,
    problems: ["Permutation Sequence", "Permutations", "N-Queens", "Sudoku Solver", "Word Search"] 
  },
  { 
    name: "Linked List I", 
    completedCount: 0,
    problems: ["Reverse Linked List", "Middle of the Linked List", "Merge Two Sorted Lists", "Remove Nth Node From End of List", "Add Two Numbers"] 
  },
  { 
    name: "Linked List II", 
    completedCount: 0,
    problems: ["Intersection of Two Linked Lists", "Linked List Cycle", "Reverse Nodes in k-Group", "Palindrome Linked List", "Linked List Cycle II"] 
  },
  { 
    name: "Linked List III & Bit Manipulation", 
    completedCount: 0,
    problems: ["Rotate List", "Copy List with Random Pointer", "Single Number", "Number of 1 Bits", "Counting Bits"] 
  },
  { 
    name: "Greedy Algorithms", 
    completedCount: 5,
    problems: ["N meetings in one room", "Minimum Platforms", "Job Sequencing Problem", "Fractional Knapsack", "Assign Cookies"] 
  },
  { 
    name: "Sliding Window I", 
    completedCount: 5,
    problems: ["Best Time to Buy and Sell Stock", "Longest Substring Without Repeating Characters", "Longest Repeating Character Replacement", "Permutation in String"] 
  },
  { 
    name: "Sliding Window II", 
    completedCount: 0,
    problems: ["Minimum Window Substring", "Sliding Window Maximum", "Minimum Size Subarray Sum", "Fruit Into Baskets"] 
  },
  { 
    name: "Stack and Queue I", 
    completedCount: 0,
    problems: ["Valid Parentheses", "Implement Stack using Queues", "Implement Queue using Stacks", "Min Stack", "Next Greater Element I"] 
  },
  { 
    name: "Stack and Queue II", 
    completedCount: 0,
    problems: ["Next Smaller Element", "LRU Cache", "LFU Cache", "Largest Rectangle in Histogram", "Sliding Window Maximum"] 
  },
  { 
    name: "Heaps", 
    completedCount: 0,
    problems: ["Kth Largest Element in an Array", "Top K Frequent Elements", "Find Median from Data Stream", "Merge k Sorted Lists"] 
  },
  { 
    name: "Binary Tree I", 
    completedCount: 5,
    problems: ["Binary Tree Inorder Traversal", "Binary Tree Preorder Traversal", "Binary Tree Postorder Traversal", "LeftView Of Binary Tree", "Bottom View of Binary Tree"] 
  },
  { 
    name: "Binary Tree II", 
    completedCount: 5,
    problems: ["Binary Tree Level Order Traversal", "Maximum Depth of Binary Tree", "Diameter of Binary Tree", "Same Tree", "Lowest Common Ancestor of a Binary Tree"] 
  },
  { 
    name: "Binary Tree III", 
    completedCount: 5,
    problems: ["Binary Tree Maximum Path Sum", "Construct Binary Tree from Preorder and Inorder Traversal", "Construct Binary Tree from Inorder and Postorder Traversal", "Symmetric Tree", "Flatten Binary Tree to Linked List"] 
  },
  { 
    name: "Binary Tree IV", 
    completedCount: 3,
    problems: ["Morris Inorder Traversal", "Morris Preorder Traversal", "Maximum Width of Binary Tree"] 
  },
  { 
    name: "Binary Tree V and BST I", 
    completedCount: 3,
    problems: ["Populating Next Right Pointers in Each Node", "Search in a Binary Search Tree", "Convert Sorted Array to Binary Search Tree"] 
  },
  { 
    name: "Binary Search Tree II", 
    completedCount: 0,
    problems: ["Lowest Common Ancestor of a Binary Search Tree", "Inorder Successor in BST", "Floor in BST", "Ceil in BST", "Kth Smallest Element in a BST", "Kth Largest Element in a BST"] 
  },
  { 
    name: "Graph I", 
    completedCount: 1,
    problems: ["Clone Graph", "DFS of Graph", "BFS of Graph", "Detect Cycle in an Undirected Graph", "Detect Cycle in a Directed Graph"] 
  },
  { 
    name: "Graph II", 
    completedCount: 0,
    problems: ["Course Schedule", "Course Schedule II", "Topological Sort", "Number of Islands"] 
  },
  { 
    name: "Graph III", 
    completedCount: 0,
    problems: ["Is Graph Bipartite?", "Bipartite Graph", "Find Eventual Safe States"] 
  },
  { 
    name: "Graph IV", 
    completedCount: 0,
    problems: ["Shortest Path in Undirected Graph", "Shortest Path in Directed Acyclic Graph", "Network Delay Time", "Cheapest Flights Within K Stops"] 
  },
  { 
    name: "Graph V", 
    completedCount: 0,
    problems: ["Find the City With the Smallest Number of Neighbors at a Threshold Distance", "Minimum Spanning Tree", "Kruskal's Algorithm"] 
  },
  { 
    name: "Graph VI", 
    completedCount: 0,
    problems: ["Word Ladder", "Word Ladder II", "Alien Dictionary"] 
  },
  { 
    name: "Graph VII and Maths", 
    completedCount: 0,
    problems: ["Strongly Connected Components", "Bridges in a Graph", "Articulation Point"] 
  },
  { 
    name: "Dynamic Programming I", 
    completedCount: 0,
    problems: ["Climbing Stairs", "Fibonacci Number", "House Robber", "House Robber II", "Decode Ways"] 
  },
  { 
    name: "Dynamic Programming II", 
    completedCount: 0,
    problems: ["Unique Paths", "Unique Paths II", "Minimum Path Sum", "Triangle"] 
  },
  { 
    name: "Dynamic Programming III", 
    completedCount: 0,
    problems: ["01 Knapsack", "Partition Equal Subset Sum", "Target Sum", "Coin Change"] 
  },
  { 
    name: "Dynamic Programming IV", 
    completedCount: 0,
    problems: ["Maximum Product Subarray", "Longest Increasing Subsequence", "Number of Longest Increasing Subsequence"] 
  },
  { 
    name: "Dynamic Programming V", 
    completedCount: 0,
    problems: ["Coin Change II", "Unbounded Knapsack", "Rod Cutting", "Minimum Coins", "Longest Common Subsequence"] 
  },
  { 
    name: "Dynamic Programming VI", 
    completedCount: 0,
    problems: ["Longest Palindromic Subsequence", "Distinct Subsequences", "Edit Distance", "Wildcard Matching", "Regular Expression Matching"] 
  },
  { 
    name: "Dynamic Programming VII", 
    completedCount: 0,
    problems: ["Burst Balloons", "Palindrome Partitioning II", "Matrix Chain Multiplication", "Minimum Cost to Cut a Stick"] 
  },
  { 
    name: "Dynamic Programming VIII", 
    completedCount: 0,
    problems: ["Maximum Profit in Job Scheduling", "Super Egg Drop"] 
  },
  { 
    name: "String and Trie", 
    completedCount: 0,
    problems: ["Reverse Words in a String", "Longest Palindromic Substring", "Roman to Integer", "Implement Trie Prefix Tree", "Design Add and Search Words Data Structure"] 
  }
];

let items = [];
let idCounter = 1;

categories.forEach(cat => {
  cat.problems.forEach((prob, pIdx) => {
    let cleanProb = prob.toLowerCase().replace(/'/g, '');
    let slug = cleanProb.replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    let url = `https://takeuforward.org/plus/dsa/problems/${slug}?subject=dsa-concept-revision`;
    
    const isCompleted = pIdx < cat.completedCount;
    
    items.push({
      id: `dsa-v5-${idCounter++}`,
      title: prob,
      section: cat.name,
      url: url,
      difficulty: 'Medium',
      completed: isCompleted
    });
  });
});

const fileOut = `export const dsaTopics = ${JSON.stringify(items, null, 2)};\n`;
fs.writeFileSync('src/data/dsaTopics.js', fileOut);
