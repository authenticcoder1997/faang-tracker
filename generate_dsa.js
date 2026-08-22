import fs from 'fs';

const categories = [
  { name: "Sorting & Arrays I", problems: ["Set Matrix Zeroes", "Pascal's Triangle", "Next Permutation", "Kadane's Algorithm", "Sort Colors"] },
  { name: "Arrays II", problems: ["Rotate Image", "Merge Intervals", "Merge Sorted Array", "Find the Duplicate Number", "Missing Number"] },
  { name: "Array III", problems: ["Search a 2D Matrix", "Pow(x, n)", "Majority Element", "Majority Element II", "Unique Paths"] },
  { name: "Arrays IV & Hashing", problems: ["Two Sum", "4Sum", "Longest Consecutive Sequence", "Subarray Sum Equals K", "Valid Anagram"] },
  { name: "Binary Search I", problems: ["Binary Search", "Find First and Last Position", "Search Insert Position", "Search in Rotated Sorted Array", "Find Minimum in Rotated Sorted Array"] },
  { name: "Binary Search II", problems: ["Koko eating bananas", "Minimum days to make M bouquets", "Aggressive Cows", "Book Allocation Problem", "Median of 2 sorted arrays"] },
  { name: "Binary Search III", problems: ["Kth Missing Positive Number", "Split Array Largest Sum", "Capacity To Ship Packages", "Find Peak Element"] },
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
  { name: "Binary Tree I", problems: ["Inorder Traversal", "Preorder Traversal", "Postorder Traversal", "LeftView Of Binary Tree", "Bottom View of Binary Tree"] },
  { name: "Binary Tree II", problems: ["Level Order Traversal", "Height of a Binary Tree", "Diameter of Binary Tree", "Check if two trees are identical or not", "LCA in Binary Tree"] },
  { name: "Binary Tree III", problems: ["Maximum path sum", "Construct Binary Tree from inorder and preorder", "Construct Binary Tree from Inorder and Postorder", "Symmetric Binary Tree", "Flatten Binary Tree to LinkedList"] },
  { name: "Binary Tree IV", problems: ["Morris Inorder Traversal", "Morris Preorder Traversal", "Max width of a Binary Tree"] },
  { name: "Binary Tree V and BST I", problems: ["Populate Next Right pointers of Tree", "Search given Key in BST", "Construct BST from given keys"] },
  { name: "Binary Search Tree II", problems: ["Find LCA of two nodes in BST", "Find the inorder predecessor/successor of a given Key in BST", "Floor in a BST", "Ceil in a BST", "Find K-th smallest element in BST", "Find K-th largest element in BST"] },
  { name: "Graph I", problems: ["Clone Graph", "DFS of Graph", "BFS of Graph", "Detect A cycle in Undirected Graph using BFS", "Detect A cycle in Undirected Graph using DFS"] },
  { name: "Graph II", problems: ["Detect A cycle in a Directed Graph using DFS", "Detect A cycle in a Directed Graph using BFS", "Topological Sort BFS", "Topological Sort DFS", "Number of Islands"] },
  { name: "Graph III", problems: ["Bipartite Check using BFS", "Bipartite Check using DFS", "Course Schedule", "Course Schedule II"] },
  { name: "Graph IV", problems: ["Shortest Path in Undirected Graph", "Shortest Path in Directed Acyclic Graph", "Dijkstra's Algorithm", "Bellman Ford Algorithm"] },
  { name: "Graph V", problems: ["Floyd Warshall Algorithm", "MST using Prim's Algo", "MST using Kruskal's Algo"] },
  { name: "Graph VI", problems: ["Word Ladder", "Word Ladder II", "Alien Dictionary"] },
  { name: "Graph VII and Maths", problems: ["Strongly Connected Component", "Bridges in Graph", "Articulation Point"] },
  { name: "Dynamic Programming I", problems: ["Climbing Stairs", "Fibonacci Number", "House Robber", "House Robber II", "Decode Ways"] },
  { name: "Dynamic Programming II", problems: ["Unique Paths", "Unique Paths II", "Minimum Path Sum", "Triangle"] },
  { name: "Dynamic Programming III", problems: ["0/1 Knapsack", "Partition Equal Subset Sum", "Target Sum", "Coin Change"] },
  { name: "Dynamic Programming IV", problems: ["Maximum Product Subarray", "Longest Increasing Subsequence", "Number of Longest Increasing Subsequence"] },
  { name: "Dynamic Programming V", problems: ["Coin change II", "Unbounded knapsack", "Rod cutting problem", "Minimum coins", "Longest common subsequence"] },
  { name: "Dynamic Programming VI", problems: ["Longest Palindromic Subsequence", "Distinct Subsequences", "Edit Distance", "Wildcard Matching", "Regular Expression Matching"] },
  { name: "Dynamic Programming VII", problems: ["Burst Balloons", "Palindrome Partitioning II", "Matrix Chain Multiplication", "Minimum Cost to Cut a Stick"] },
  { name: "Dynamic Programming VIII", problems: ["Maximum Profit in Job Scheduling", "Super Egg Drop"] },
  { name: "String and Trie", problems: ["Reverse Words in a String", "Longest Palindromic Substring", "Roman to Integer", "Implement Trie (Prefix Tree)", "Design Add and Search Words Data Structure"] }
];

let items = [];
let idCounter = 1;

categories.forEach(cat => {
  cat.problems.forEach(prob => {
    let slug = prob.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    items.push({
      id: `dsa-v4-${idCounter++}`, // Make id unique so it clears old local storage state for merging
      title: prob,
      section: cat.name,
      url: `https://leetcode.com/problems/${slug}/`,
      difficulty: 'Medium',
      completed: false
    });
  });
});

const fileContent = `export const dsaTopics = ${JSON.stringify(items, null, 2)};\n`;
fs.writeFileSync('src/data/dsaTopics.js', fileContent);
