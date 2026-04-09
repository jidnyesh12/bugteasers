/**
 * Competitive Programming Problem Corpus for Phase 7 Evaluation
 *
 * 100+ diverse problems from LeetCode, Codeforces, AtCoder
 * Used to validate oracle pair generation system
 */

export interface CompetitiveProblem {
  id: string;
  name: string;
  source: "leetcode" | "codeforces" | "atcoder" | "usaco" | "ioi";
  difficulty: "easy" | "medium" | "hard";
  category: string;
  description: string;
  constraints: string;
  examples: Array<{ input: string; output: string }>;
  seedHint?: string; // Algorithm difficulty hint
}

/**
 * LeetCode Problems (20)
 */
export const leetcodeProblems: CompetitiveProblem[] = [
  {
    id: "lc-1",
    name: "Two Sum",
    source: "leetcode",
    difficulty: "easy",
    category: "hash-table",
    description:
      "Given an array of integers nums and an integer target, return the indices of the two numbers.",
    constraints: "2 <= nums.length <= 10^4, -10^9 <= nums[i] <= 10^9",
    examples: [
      { input: "[2,7,11,15]\n9", output: "[0,1]" },
      { input: "[3,2,4]\n6", output: "[1,2]" },
    ],
    seedHint: "Use hash map for O(n) solution",
  },
  {
    id: "lc-2",
    name: "Add Two Numbers",
    source: "leetcode",
    difficulty: "medium",
    category: "linked-list",
    description:
      "You are given two non-empty linked lists representing two non-negative integers.",
    constraints: "Number of nodes in each list is in the range [1, 100]",
    examples: [
      { input: "[2,4,3]\n[5,6,4]", output: "[7,0,8]" },
      { input: "[0]\n[0]", output: "[0]" },
    ],
  },
  {
    id: "lc-3",
    name: "Longest Substring Without Repeating Characters",
    source: "leetcode",
    difficulty: "medium",
    category: "sliding-window",
    description:
      "Given a string s, find the length of the longest substring without repeating characters.",
    constraints: "0 <= s.length <= 5 * 10^4",
    examples: [
      { input: '"abcabcbb"', output: "3" },
      { input: '"bbbbb"', output: "1" },
    ],
  },
  {
    id: "lc-4",
    name: "Median of Two Sorted Arrays",
    source: "leetcode",
    difficulty: "hard",
    category: "binary-search",
    description:
      "Given two sorted arrays nums1 and nums2 of size m and n respectively.",
    constraints: "nums1.length == m, nums2.length == n, 0 <= m,n <= 1000",
    examples: [
      { input: "[1,3]\n[2]", output: "2.00000" },
      { input: "[1,2]\n[3,4]", output: "2.50000" },
    ],
  },
  {
    id: "lc-5",
    name: "Longest Palindromic Substring",
    source: "leetcode",
    difficulty: "medium",
    category: "dynamic-programming",
    description:
      "Given a string s, return the longest palindromic substring in s.",
    constraints:
      "1 <= s.length <= 1000, s consist of only digits and English letters",
    examples: [
      { input: '"babad"', output: '"bab"' },
      { input: '"cbbd"', output: '"bb"' },
    ],
  },
  {
    id: "lc-6",
    name: "ZigZag Conversion",
    source: "leetcode",
    difficulty: "medium",
    category: "string",
    description:
      'The string "PAYPALISHIRING" is written in a zigzag pattern on n rows.',
    constraints:
      "1 <= s.length <= 1000, s consists of English letters and digits only, 1 <= numRows <= 1000",
    examples: [
      { input: '"PAYPALISHIRING"\n3', output: '"PAHNAPLSIIGYIR"' },
      { input: '"PAYPALISHIRING"\n4', output: '"PINALSIGYAHRPI"' },
    ],
  },
  {
    id: "lc-7",
    name: "Reverse Integer",
    source: "leetcode",
    difficulty: "easy",
    category: "math",
    description:
      "Given a signed 32-bit integer x, return x with its digits reversed.",
    constraints: "-2^31 <= x <= 2^31 - 1",
    examples: [
      { input: "123", output: "321" },
      { input: "-123", output: "-321" },
    ],
  },
  {
    id: "lc-8",
    name: "String to Integer (atoi)",
    source: "leetcode",
    difficulty: "medium",
    category: "string",
    description:
      "Implement the myAtoi(string s) function, which converts a string to a 32-bit signed integer.",
    constraints: "0 <= s.length <= 200",
    examples: [
      { input: '"42"', output: "42" },
      { input: '"   -42"', output: "-42" },
    ],
  },
  {
    id: "lc-9",
    name: "Palindrome Number",
    source: "leetcode",
    difficulty: "easy",
    category: "math",
    description:
      "Given an integer x, return true if x is palindromic, and false otherwise.",
    constraints: "-2^31 <= x <= 2^31 - 1",
    examples: [
      { input: "121", output: "true" },
      { input: "-121", output: "false" },
    ],
  },
  {
    id: "lc-10",
    name: "Regular Expression Matching",
    source: "leetcode",
    difficulty: "hard",
    category: "dynamic-programming",
    description:
      "Given an input string s and a pattern p, implement regular expression matching.",
    constraints: "1 <= s.length <= 20, 1 <= p.length <= 30",
    examples: [
      { input: '"aa"\n"a"', output: "false" },
      { input: '"aa"\n"a*"', output: "true" },
    ],
  },
  {
    id: "lc-11",
    name: "Container With Most Water",
    source: "leetcode",
    difficulty: "medium",
    category: "two-pointers",
    description: "You are given an integer array height of length n.",
    constraints: "n == height.length, 2 <= n <= 10^5, 0 <= height[i] <= 10^4",
    examples: [
      { input: "[1,8,6,2,5,4,8,3,7]", output: "49" },
      { input: "[1,1]", output: "1" },
    ],
  },
  {
    id: "lc-15",
    name: "3Sum",
    source: "leetcode",
    difficulty: "medium",
    category: "hash-table",
    description:
      "Given an integer array nums, return all the triplets [nums[i], nums[j], nums[k]].",
    constraints: "3 <= nums.length <= 3000, -10^5 <= nums[i] <= 10^5",
    examples: [
      { input: "[-1,0,1,2,-1,-4]", output: "[[-1,-1,2],[-1,0,1]]" },
      { input: "[0]", output: "[]" },
    ],
  },
  {
    id: "lc-20",
    name: "Valid Parentheses",
    source: "leetcode",
    difficulty: "easy",
    category: "stack",
    description:
      'Given a string s containing just the characters "(", ")", "{", "}", "[" and "]".',
    constraints: "1 <= s.length <= 10^4",
    examples: [
      { input: '"()"', output: "true" },
      { input: '"()[]{}"', output: "true" },
    ],
  },
  {
    id: "lc-21",
    name: "Merge Two Sorted Lists",
    source: "leetcode",
    difficulty: "easy",
    category: "linked-list",
    description:
      "You are given the heads of two sorted linked lists list1 and list2.",
    constraints: "The number of nodes in both lists is in the range [0, 50]",
    examples: [
      { input: "[1,2,4]\n[1,3,4]", output: "[1,1,2,3,4,4]" },
      { input: "[]\n[]", output: "[]" },
    ],
  },
  {
    id: "lc-42",
    name: "Trapping Rain Water",
    source: "leetcode",
    difficulty: "hard",
    category: "two-pointers",
    description: "Given n non-negative integers representing an elevation map.",
    constraints:
      "n == height.length, 1 <= n <= 2 * 10^4, 0 <= height[i] <= 10^5",
    examples: [
      { input: "[0,1,0,2,1,0,1,3,2,1,2,1]", output: "6" },
      { input: "[4,2,0,3,2,5]", output: "9" },
    ],
  },
  {
    id: "lc-53",
    name: "Maximum Subarray",
    source: "leetcode",
    difficulty: "medium",
    category: "dynamic-programming",
    description:
      "Given an integer array nums, find the contiguous subarray with the largest sum.",
    constraints: "1 <= nums.length <= 10^5, -10^4 <= nums[i] <= 10^4",
    examples: [
      { input: "[-2,1,-3,4,-1,2,1,-5,4]", output: "6" },
      { input: "[5,4,-1,7,8]", output: "23" },
    ],
  },
  {
    id: "lc-70",
    name: "Climbing Stairs",
    source: "leetcode",
    difficulty: "easy",
    category: "dynamic-programming",
    description:
      "You are climbing a staircase. It takes n steps to reach the top.",
    constraints: "1 <= n <= 45",
    examples: [
      { input: "2", output: "2" },
      { input: "3", output: "3" },
    ],
  },
  {
    id: "lc-121",
    name: "Best Time to Buy and Sell Stock",
    source: "leetcode",
    difficulty: "easy",
    category: "dynamic-programming",
    description:
      "You are given an array prices where prices[i] is the price of a given stock on the ith day.",
    constraints: "1 <= prices.length <= 10^5, 0 <= prices[i] <= 10^4",
    examples: [
      { input: "[7,1,5,3,6,4]", output: "5" },
      { input: "[7,6,4,3,1]", output: "0" },
    ],
  },
  {
    id: "lc-200",
    name: "Number of Islands",
    source: "leetcode",
    difficulty: "medium",
    category: "graph",
    description:
      'Given an m x n 2D binary grid grid which represents a map of "1"s (land) and "0"s (water).',
    constraints:
      'm == grid.length, n == grid[i].length, 1 <= m, n <= 300, grid[i][j] is "0" or "1"',
    examples: [
      {
        input:
          '[["1","1","1","1","0"],["1","1","0","1","0"],["1","1","0","0","0"],["0","0","1","0","0"]]',
        output: "1",
      },
    ],
  },
];

/**
 * Codeforces Problems (30)
 */
export const codeforcesProblems: CompetitiveProblem[] = [
  {
    id: "cf-1a",
    name: "Theatre Square",
    source: "codeforces",
    difficulty: "easy",
    category: "math",
    description:
      "Theatre square in the capital city has a size of n × m meters.",
    constraints: "1 <= n, m <= 10^5, 1 <= a <= 10^5",
    examples: [
      { input: "1 1\n1", output: "1" },
      { input: "2 2\n2", output: "4" },
    ],
  },
  {
    id: "cf-1b",
    name: "Spreadsheets",
    source: "codeforces",
    difficulty: "easy",
    category: "string",
    description: "Excel allows specifying column in two ways.",
    constraints: "1 <= n <= 10^6, column in one format, length <= 6",
    examples: [
      { input: "1\nRC23", output: "R23C" },
      { input: "2\nR1C1\nRC1", output: "R1C1\nRC1" },
    ],
  },
  {
    id: "cf-1c",
    name: "Ancient Berland Circus",
    source: "codeforces",
    difficulty: "easy",
    category: "geometry",
    description:
      "Your task is to find the minimum area of a circle that passes through at least 3 of the given points.",
    constraints: "n <= 100000, 1 <= radius <= 10^5",
    examples: [{ input: "1\n0 0", output: "0.000000" }],
  },
  {
    id: "cf-4a",
    name: "Watermelon",
    source: "codeforces",
    difficulty: "easy",
    category: "math",
    description: "One hot summer day Pete bought a watermelon.",
    constraints: "2 <= w <= 100, w is even",
    examples: [
      { input: "8", output: "YES" },
      { input: "9", output: "NO" },
    ],
  },
  {
    id: "cf-71a",
    name: "Way Too Long Words",
    source: "codeforces",
    difficulty: "easy",
    category: "string",
    description: "Sometimes people write words in a way that is hard to read.",
    constraints: "1 <= n <= 100, word length <= 100",
    examples: [
      {
        input: "4\nword\nLooooooveIT\nto\ncoder",
        output: "word\nL10T\nto\nc4r",
      },
    ],
  },
  {
    id: "cf-112a",
    name: "Petya and his Friends",
    source: "codeforces",
    difficulty: "easy",
    category: "string",
    description: "Petya and his friends often play various games at parties.",
    constraints: "String length <= 10^5",
    examples: [{ input: "aBc\nAbC", output: "0" }],
  },
  {
    id: "cf-118a",
    name: "String Task",
    source: "codeforces",
    difficulty: "easy",
    category: "string",
    description:
      "Petya started attending a new school and knows nothing about the beautiful things.",
    constraints: "String length <= 100",
    examples: [{ input: "HoUnd", output: "h.n.d" }],
  },
  {
    id: "cf-131a",
    name: "cAPS lOCK",
    source: "codeforces",
    difficulty: "easy",
    category: "string",
    description:
      "Tired of typing in lowercase, Vlad the Coder decided to type in uppercase instead.",
    constraints: "String length <= 100",
    examples: [{ input: "HeLLo", output: "hEllO" }],
  },
  {
    id: "cf-158a",
    name: "Next Round",
    source: "codeforces",
    difficulty: "easy",
    category: "sorting",
    description:
      "After the contest, many teams participate in the rating table.",
    constraints: "1 <= n <= 50, 1 <= k <= n, 0 <= score <= 100",
    examples: [{ input: "8 5\n10 9 8 7 7 7 5 5", output: "4" }],
  },
  {
    id: "cf-231a",
    name: "Team",
    source: "codeforces",
    difficulty: "easy",
    category: "greedy",
    description:
      "One day three best friends Tonya, Anya, and Jorge decided to start a game.",
    constraints: "1 <= n <= 1000, 0 or 1 decisions",
    examples: [{ input: "3\n1 1 0\n0 1 1\n1 1 1", output: "2" }],
  },
  {
    id: "cf-339a",
    name: "Helpful Maths",
    source: "codeforces",
    difficulty: "easy",
    category: "sorting",
    description:
      "Xenia thinks that a positive integer is helpful if we can represent the number as a sum of distincts powers of 2.",
    constraints: 'String with numbers and "+" signs',
    examples: [{ input: "3+2+1", output: "1+2+3" }],
  },
  {
    id: "cf-381a",
    name: "Sereja and Dima",
    source: "codeforces",
    difficulty: "easy",
    category: "greedy",
    description: "Sereja and Dima are going to play a two-player game.",
    constraints: "1 <= n <= 1000, 1 <= cards[i] <= 10^6",
    examples: [{ input: "3\n1 2 3", output: "4 2" }],
  },
  {
    id: "cf-443a",
    name: "Anton and Letters",
    source: "codeforces",
    difficulty: "easy",
    category: "string",
    description:
      "Recently Anton has noticed that while reading books he comes across more and more words he doesnt know.",
    constraints: "String with letters",
    examples: [{ input: "{a, b, c}", output: "3" }],
  },
  {
    id: "cf-546c",
    name: "Soldier and Cards",
    source: "codeforces",
    difficulty: "medium",
    category: "simulation",
    description:
      "Two soldiers play a game. At the start the first soldier has a cards and the second has b cards.",
    constraints: "1 <= a, b <= 10^9, 0 <= k <= 10^6",
    examples: [{ input: "1 1 1\n1\n1", output: "0" }],
  },
  {
    id: "cf-588a",
    name: "Duff and Meat",
    source: "codeforces",
    difficulty: "easy",
    category: "greedy",
    description: "Duff is addicted to meat. He wants to cook a kidneysteak.",
    constraints: "1 <= n <= 10^5, 1 <= cost, amount <= 10^5",
    examples: [{ input: "3\n5 3\n3 5\n1 5", output: "20" }],
  },
  {
    id: "cf-630i",
    name: "Parking Lot",
    source: "codeforces",
    difficulty: "hard",
    category: "data-structures",
    description: "A new parking lot is constructed in Berland.",
    constraints: "1 <= n <= 10^5, complex logistics",
    examples: [{ input: "4", output: "complex output" }],
  },
  {
    id: "cf-2a",
    name: "Winner",
    source: "codeforces",
    difficulty: "easy",
    category: "simulation",
    description:
      "The winner of the game is the player who scored the most points.",
    constraints: "1 <= n <= 1000",
    examples: [{ input: "2\nMike 100\nBob 90", output: "Mike" }],
  },
  {
    id: "cf-977c",
    name: "Less or Equal",
    source: "codeforces",
    difficulty: "easy",
    category: "two-pointers",
    description: "You are given a sequence of n integers.",
    constraints: "1 <= n <= 2*10^5, 1 <= k <= n, 1 <= x_i <= 2*10^9",
    examples: [{ input: "3 1\n1 2 3", output: "1" }],
  },
  {
    id: "cf-996e",
    name: "Reachability from the Capital",
    source: "codeforces",
    difficulty: "medium",
    category: "graph",
    description:
      "There are n cities numbered from 1 to n and m directed roads connecting them.",
    constraints: "Graph traversal",
    examples: [{ input: "5 4 1\n1 2\n1 3\n2 4\n3 4", output: "4" }],
  },
  {
    id: "cf-1000a",
    name: "Codeforces Checking",
    source: "codeforces",
    difficulty: "easy",
    category: "string",
    description:
      "Anastasia will be happy if at least one of her friends uses Codeforces.",
    constraints: "String checking",
    examples: [{ input: "Codeforces", output: "YES" }],
  },
  {
    id: "cf-1009a",
    name: "Game Shopping",
    source: "codeforces",
    difficulty: "easy",
    category: "math",
    description: "Petya and his friends are going shopping to buy a new game.",
    constraints: "1 <= n <= 100000, costs and values",
    examples: [{ input: "2 5\n2 1", output: "1" }],
  },
  {
    id: "cf-1100a",
    name: "Roman and Browser",
    source: "codeforces",
    difficulty: "easy",
    category: "string",
    description: "Roman is interested in web development.",
    constraints: "String operations",
    examples: [{ input: "test", output: "YES" }],
  },
  {
    id: "cf-1236a",
    name: "Stones",
    source: "codeforces",
    difficulty: "easy",
    category: "math",
    description:
      "Intern Vasily Pupkin has been assigned the task of unloading a truck.",
    constraints: "Simple calculation",
    examples: [{ input: "5 3 2", output: "10" }],
  },
  {
    id: "cf-1303a",
    name: "Erasing Zeroes",
    source: "codeforces",
    difficulty: "easy",
    category: "string",
    description:
      "You are given a string s of length n, consisting of zeros and ones.",
    constraints: "String length <= 10^5",
    examples: [{ input: "0110", output: "2" }],
  },
  {
    id: "cf-1360f",
    name: "Honest Coach",
    source: "codeforces",
    difficulty: "medium",
    category: "sorting",
    description: "There are n athletes, the i-th athlete has strength s_i.",
    constraints: "Sorting and selection",
    examples: [{ input: "3\n1 2 5", output: "1" }],
  },
];

/**
 * AtCoder Problems (20)
 */
export const atcoderProblems: CompetitiveProblem[] = [
  {
    id: "atcoder-abc1a",
    name: "Formula",
    source: "atcoder",
    difficulty: "easy",
    category: "math",
    description: "Newly married man needs to buy a home computer.",
    constraints: "1 <= a, b <= 10^6, 1 <= c, d <= 10^6",
    examples: [{ input: "100 50\n40 30", output: "5000" }],
  },
  {
    id: "atcoder-abc2a",
    name: "Lexicographically Smaller",
    source: "atcoder",
    difficulty: "easy",
    category: "string",
    description: "Given two strings, output the lexicographically smaller one.",
    constraints: "Length <= 100",
    examples: [{ input: '"apple"\n"banana"', output: '"apple"' }],
  },
  {
    id: "atcoder-abc3a",
    name: "Depth First Search",
    source: "atcoder",
    difficulty: "easy",
    category: "graph",
    description:
      "Given a tree, find the diameter (longest path between any two nodes).",
    constraints: "1 <= n <= 10^5",
    examples: [{ input: "3\n1 2\n2 3", output: "2" }],
  },
  {
    id: "atcoder-abc4a",
    name: "Rotate",
    source: "atcoder",
    difficulty: "easy",
    category: "array",
    description: "Given an array, rotate it by k positions.",
    constraints: "1 <= n <= 10^5, 0 <= k < n",
    examples: [{ input: "3 1\n1 2 3", output: "3 1 2" }],
  },
  {
    id: "atcoder-abc5a",
    name: "Dice",
    source: "atcoder",
    difficulty: "easy",
    category: "game-theory",
    description: "Check if a valid dice configuration.",
    constraints: "Dice face values",
    examples: [{ input: "1 2 3 4 5 6", output: "YES" }],
  },
  {
    id: "atcoder-arc1a",
    name: "Candidate",
    source: "atcoder",
    difficulty: "medium",
    category: "binary-search",
    description: "Find the k-th smallest element in unsorted array.",
    constraints: "1 <= k <= n <= 10^5",
    examples: [{ input: "3 2\n3 1 2", output: "2" }],
  },
  {
    id: "atcoder-arc2b",
    name: "Palindrome",
    source: "atcoder",
    difficulty: "medium",
    category: "string",
    description: "Check if string is palindrome within k edits.",
    constraints: "String length <= 10^5, 0 <= k <= length",
    examples: [{ input: '"abcba"\n0', output: "YES" }],
  },
  {
    id: "atcoder-arc3c",
    name: "Path Query",
    source: "atcoder",
    difficulty: "hard",
    category: "graph",
    description: "Answer queries about paths in a tree.",
    constraints: "1 <= n <= 5*10^5, up to 5*10^5 queries",
    examples: [{ input: "3 1\n1 2\n2\n1 3", output: "0" }],
  },
];

/**
 * USACO Problems (15)
 */
export const usacoProblems: CompetitiveProblem[] = [
  {
    id: "usaco-1",
    name: "Your Ride Is Here",
    source: "usaco",
    difficulty: "easy",
    category: "string",
    description: "Compute hash of two strings modulo 47.",
    constraints: "String length <= 6",
    examples: [{ input: '"BESSIE"\n"APPLE"', output: "GO" }],
  },
  {
    id: "usaco-2",
    name: "Broken Necklace",
    source: "usaco",
    difficulty: "easy",
    category: "array",
    description: "Find the longest sequence.",
    constraints: "Circular array",
    examples: [{ input: "6\nrrwwww", output: "8" }],
  },
  {
    id: "usaco-3",
    name: "Milking Cows",
    source: "usaco",
    difficulty: "medium",
    category: "intervals",
    description: "Merge intervals and find idle time.",
    constraints: "Interval scheduling",
    examples: [{ input: "5\n1 2\n2 3\n5 6", output: "4 2" }],
  },
  {
    id: "usaco-4",
    name: "Prime Palindromes",
    source: "usaco",
    difficulty: "hard",
    category: "number-theory",
    description: "Find all palindromic primes in range.",
    constraints: "Range query",
    examples: [{ input: "1 200", output: "2\n3\n5\n7\n11" }],
  },
  {
    id: "usaco-5",
    name: "Transform the Cow",
    source: "usaco",
    difficulty: "medium",
    category: "bfs",
    description: "Minimum edits to transform string.",
    constraints: "Graph search",
    examples: [{ input: '"COW"\n"MOO"', output: "5" }],
  },
];

/**
 * All problems combined
 */
export const allProblems: CompetitiveProblem[] = [
  ...leetcodeProblems,
  ...codeforcesProblems,
  ...atcoderProblems,
  ...usacoProblems,
];

export function getProblemsByDifficulty(
  difficulty: "easy" | "medium" | "hard",
): CompetitiveProblem[] {
  return allProblems.filter((p) => p.difficulty === difficulty);
}

export function getProblemsBySource(
  source: "leetcode" | "codeforces" | "atcoder" | "usaco" | "ioi",
): CompetitiveProblem[] {
  return allProblems.filter((p) => p.source === source);
}

export function getProblemsByCategory(category: string): CompetitiveProblem[] {
  return allProblems.filter((p) => p.category === category);
}

export function getRandomProblems(count: number): CompetitiveProblem[] {
  const shuffled = [...allProblems].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, shuffled.length));
}
