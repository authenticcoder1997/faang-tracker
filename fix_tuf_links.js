import fs from 'fs';

// We rewrite the 177 elements to link to takeuforward.
const categories = [
  { name: "Sorting & Arrays I", problems: ["Set Matrix Zeroes", "Pascal's Triangle", "Next Permutation", "Maximum Subarray", "Sort Colors"] },
  { name: "Arrays II", problems: ["Rotate Image", "Merge Intervals", "Merge Sorted Array", "Find the Duplicate Number", "Missing Number"] },
  { name: "Array III", problems: ["Search a 2D Matrix", "Pow(x, n)", "Majority Element", "Majority Element II", "Unique Paths"] },
  { name: "Arrays IV & Hashing", problems: ["Two Sum", "4Sum", "Longest Consecutive Sequence", "Subarray Sum Equals K", "Valid Anagram"] },
  { name: "Binary Search I", problems: ["Binary Search", "Find First and Last Position of Element in Sorted Array", "Search Insert Position", "Search in Rotated Sorted Array", "Find Minimum in Rotated Sorted Array"] },
  { name: "Binary Search II", problems: ["Koko Eating Bananas", "Minimum Number of Days to Make m Bouquets", "Aggressive Cows", "Allocate Books", "Median of Two Sorted Arrays"] },
  { name: "Binary Search III", problems: ["Kth Missing Positive Number", "Split Array Largest Sum", "Capacity To Ship Packages Within D Days", "Find Peak Element"] },
  { name: "Recursion I", problems: ["Subset Sums", "Subsets II", "Combination Sum", "Combination Sum II", "Palindrome Partitioning"] },
  { name: "Recursion II", problems: ["Permutation Sequence", "Permutations", "N-Queens", "Sudoku Solver", "Word Search"] },
  { name: "Linked List I", problems: ["Reverse Linked List", "Middle of the Linked List", "Merge Two Sorted Lists", "Remove Nth Node From End of List", "Add Two Numbers"] },
  { name: "Linked List II", problems: ["Intersection of Two Linked Lists", "Linked List Cycle", "Reverse Nodes in k-Group", "Palindrome Linked List", "Linked List Cycle II"] },
  { name: "Linked List III & Bit Manipulation", problems: ["Rotate List", "Copy List with Random Pointer", "Single Number", "Number of 1 Bits", "Counting Bits"] },
  { name: "Greedy Algorithms", problems: ["N meetings in one room", "Minimum Platforms", "Job Sequencing Problem", "Fractional Knapsack", "Assign Cookies"] },
  { name: "Sliding Window I", problems: ["Best Time to Buy and Sell Stock", "Longest Substring Without Repeating Characters", "Longest Repeating Character Replacement", "Permutation in String"] },
  { name: "Sliding Window II", problems: ["Minimum Window Substring", "Sliding Window Maximum", "Minimum Size Subarray Sum", "Fruit Into Baskets"] },
  { name: "Stack and Queue I", problems: ["Valid Parentheses", "Implement Stack using Queues", "Implement Queue using Stacks", "Min Stack", "Next Greater Element I"] },
  { name: "Stack and Queue II", problems: ["Next Smaller Element", "LRU Cache", "LFU Cache", "Largest Rectangle in Histogram", "Sliding Window Maximum"] },
  { name: "Heaps", problems: ["Kth Largest Element in an Array", "Top K Frequent Elements", "Find Median from Data Stream", "Merge k Sorted Lists"] },
  { name: "Binary Tree I", problems: ["Binary Tree Inorder Traversal", "Binary Tree Preorder Traversal", "Binary Tree Postorder Traversal", "LeftView Of Binary Tree", "Bottom View of Binary Tree"] },
  { name: "Binary Tree II", problems: ["Binary Tree Level Order Traversal", "Maximum Depth of Binary Tree", "Diameter of Binary Tree", "Same Tree", "Lowest Common Ancestor of a Binary Tree"] },
  { name: "Binary Tree III", problems: ["Binary Tree Maximum Path Sum", "Construct Binary Tree from Preorder and Inorder Traversal", "Construct Binary Tree from Inorder and Postorder Traversal", "Symmetric Tree", "Flatten Binary Tree to Linked List"] },
  { name: "Binary Tree IV", problems: ["Morris Inorder Traversal", "Morris Preorder Traversal", "Maximum Width of Binary Tree"] },
  { name: "Binary Tree V and BST I", problems: ["Populating Next Right Pointers in Each Node", "Search in a Binary Search Tree", "Convert Sorted Array to Binary Search Tree"] },
  { name: "Binary Search Tree II", problems: ["Lowest Common Ancestor of a Binary Search Tree", "Inorder Successor in BST", "Floor in BST", "Ceil in BST", "Kth Smallest Element in a BST", "Kth Largest Element in a BST"] },
  { name: "Graph I", problems: ["Clone Graph", "DFS of Graph", "BFS of Graph", "Detect Cycle in an Undirected Graph", "Detect Cycle in a Directed Graph"] },
  { name: "Graph II", problems: ["Course Schedule", "Course Schedule II", "Topological Sort", "Number of Islands"] },
  { name: "Graph III", problems: ["Is Graph Bipartite?", "Bipartite Graph", "Find Eventual Safe States"] },
  { name: "Graph IV", problems: ["Shortest Path in Undirected Graph", "Shortest Path in Directed Acyclic Graph", "Network Delay Time", "Cheapest Flights Within K Stops"] },
  { name: "Graph V", problems: ["Find the City With the Smallest Number of Neighbors at a Threshold Distance", "Minimum Spanning Tree", "Kruskal's Algorithm"] },
  { name: "Graph VI", problems: ["Word Ladder", "Word Ladder II", "Alien Dictionary"] },
  { name: "Graph VII and Maths", problems: ["Strongly Connected Components", "Bridges in a Graph", "Articulation Point"] },
  { name: "Dynamic Programming I", problems: ["Climbing Stairs", "Fibonacci Number", "House Robber", "House Robber II", "Decode Ways"] },
  { name: "Dynamic Programming II", problems: ["Unique Paths", "Unique Paths II", "Minimum Path Sum", "Triangle"] },
  { name: "Dynamic Programming III", problems: ["01 Knapsack", "Partition Equal Subset Sum", "Target Sum", "Coin Change"] },
  { name: "Dynamic Programming IV", problems: ["Maximum Product Subarray", "Longest Increasing Subsequence", "Number of Longest Increasing Subsequence"] },
  { name: "Dynamic Programming V", problems: ["Coin Change II", "Unbounded Knapsack", "Rod Cutting", "Minimum Coins", "Longest Common Subsequence"] },
  { name: "Dynamic Programming VI", problems: ["Longest Palindromic Subsequence", "Distinct Subsequences", "Edit Distance", "Wildcard Matching", "Regular Expression Matching"] },
  { name: "Dynamic Programming VII", problems: ["Burst Balloons", "Palindrome Partitioning II", "Matrix Chain Multiplication", "Minimum Cost to Cut a Stick"] },
  { name: "Dynamic Programming VIII", problems: ["Maximum Profit in Job Scheduling", "Super Egg Drop"] },
  { name: "String and Trie", problems: ["Reverse Words in a String", "Longest Palindromic Substring", "Roman to Integer", "Implement Trie Prefix Tree", "Design Add and Search Words Data Structure"] }
];

let items = [];
let idCounter = 1;

categories.forEach(cat => {
  cat.problems.forEach(prob => {
    // Generate TUF slug
    let cleanProb = prob.toLowerCase().replace(/'/g, '');
    let slug = cleanProb.replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    
    // Link directly to takeuforward Planly DSA format
    let url = `https://takeuforward.org/plus/dsa/problems/${slug}?subject=dsa-concept-revision`;
        
    items.push({
      id: `dsa-v4-${idCounter++}`, // Match exactly what is in App.jsx currently
      title: prob,
      section: cat.name,
      url: url,
      difficulty: 'Medium',
      completed: false
    });
  });
});

const fileOut = `export const dsaTopics = ${JSON.stringify(items, null, 2)};\n`;
fs.writeFileSync('src/data/dsaTopics.js', fileOut);
