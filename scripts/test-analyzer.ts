import { analyzeComplexity } from '../lib/analyzer';

const testCases = [
    // ARRAYS
    {
        name: "Array: Two Sum (Hash Map)",
        language: "javascript",
        code: `function twoSum(nums, target) {
    let map = new Map();
    for (let i = 0; i < nums.length; i++) {
        let diff = target - nums[i];
        if (map.has(diff)) {
            return [map.get(diff), i];
        }
        map.set(nums[i], i);
    }
    return [];
}`,
        expected: { time: "O(N)", space: "O(N)" }
    },
    {
        name: "Array: Binary Search",
        language: "javascript",
        code: `function binarySearch(arr, target) {
    let l = 0, r = arr.length - 1;
    while (l <= r) {
        let m = Math.floor((l + r) / 2);
        if (arr[m] === target) return m;
        if (arr[m] < target) l = m + 1;
        else r = m - 1;
    }
    return -1;
}`,
        expected: { time: "O(log N)", space: "O(1)" }
    },
    {
        name: "Array: Kadane's Algorithm",
        language: "javascript",
        code: `function maxSubArray(nums) {
    let current = nums[0];
    let max = nums[0];
    for (let i = 1; i < nums.length; i++) {
        current = Math.max(nums[i], current + nums[i]);
        max = Math.max(max, current);
    }
    return max;
}`,
        expected: { time: "O(N)", space: "O(1)" }
    },
    {
        name: "Array: Rotate Array",
        language: "javascript",
        code: `function rotate(nums, k) {
    k %= nums.length;
    function reverse(arr, start, end) {
        while (start < end) {
            [arr[start], arr[end]] = [arr[end], arr[start]];
            start++;
            end--;
        }
    }
    reverse(nums, 0, nums.length - 1);
    reverse(nums, 0, k - 1);
    reverse(nums, k, nums.length - 1);
    return nums;
}`,
        expected: { time: "O(N)", space: "O(1)" }
    },

    // STRINGS
    {
        name: "String: Valid Palindrome",
        language: "javascript",
        code: `function isPalindrome(s) {
    s = s.replace(/[^a-z0-9]/gi, '').toLowerCase();
    let left = 0, right = s.length - 1;
    while (left < right) {
        if (s[left] !== s[right]) return false;
        left++;
        right--;
    }
    return true;
}`,
        expected: { time: "O(N)", space: "O(1)" }
    },
    {
        name: "String: Group Anagrams",
        language: "javascript",
        code: `function groupAnagrams(strs) {
    let map = new Map();
    for (let s of strs) {
        let key = s.split('').sort().join('');
        if (!map.has(key)) map.set(key, []);
        map.get(key).push(s);
    }
    return Array.from(map.values());
}`,
        expected: { time: "O(N log N)", space: "O(N)" }
    },

    // LINKED LISTS
    {
        name: "LL: Detect Cycle (Floyd's)",
        language: "javascript",
        code: `function hasCycle(head) {
    let slow = head, fast = head;
    while (fast && fast.next) {
        slow = slow.next;
        fast = fast.next.next;
        if (slow === fast) return true;
    }
    return false;
}`,
        expected: { time: "O(N)", space: "O(1)" }
    },

    // RECURSION & BACKTRACKING
    {
        name: "Recursion: Factorial",
        language: "python",
        code: `def fact(n):
    if n == 0:
        return 1
    return n * fact(n-1)`,
        expected: { time: "O(N)", space: "O(N)" }
    },
    {
        name: "Backtracking: Power Set",
        language: "javascript",
        code: `function subsets(nums) {
    let res = [];
    function backtrack(start, path) {
        res.push([...path]);
        for (let i = start; i < nums.length; i++) {
            path.push(nums[i]);
            backtrack(i + 1, path);
            path.pop();
        }
    }
    backtrack(0, []);
    return res;
}`,
        expected: { time: "O(2^N)", space: "O(2^N)" }
    },
    {
        name: "Backtracking: Permutations",
        language: "javascript",
        code: `function permute(nums) {
    let res = [];
    function backtrack(path, used) {
        if (path.length === nums.length) {
            res.push([...path]);
            return;
        }
        for (let i = 0; i < nums.length; i++) {
            if (used[i]) continue;
            used[i] = true;
            path.push(nums[i]);
            backtrack(path, used);
            path.pop();
            used[i] = false;
        }
    }
    backtrack([], Array(nums.length).fill(false));
    return res;
}`,
        expected: { time: "O(N!)", space: "O(N!)" }
    },
    {
        name: "Backtracking: N-Queens",
        language: "javascript",
        code: `function solveNQueens(n) {
    let res = [];
    let board = Array.from({length: n}, () => Array(n).fill('.'));
    function isValid(row, col) {
        for (let i = 0; i < row; i++) {
            if (board[i][col] === 'Q') return false;
            if (col - (row - i) >= 0 && board[i][col - (row - i)] === 'Q') return false;
            if (col + (row - i) < n && board[i][col + (row - i)] === 'Q') return false;
        }
        return true;
    }
    function solve(row) {
        if (row === n) {
            res.push(board.map(r => r.join('')));
            return;
        }
        for (let col = 0; col < n; col++) {
            if (isValid(row, col)) {
                board[row][col] = 'Q';
                solve(row + 1);
                board[row][col] = '.';
            }
        }
    }
    solve(0);
    return res;
}`,
        expected: { time: "O(N!)", space: "O(N)" }
    },

    // SORTING & SEARCHING
    {
        name: "Sort: MergeSort",
        language: "javascript",
        code: `function mergeSort(arr) {
    if (arr.length <= 1) return arr;
    let mid = Math.floor(arr.length / 2);
    let left = mergeSort(arr.slice(0, mid));
    let right = mergeSort(arr.slice(mid));
    return merge(left, right);
}
function merge(left, right) {
    let res = [], i = 0, j = 0;
    while (i < left.length && j < right.length) {
        if (left[i] < right[j]) res.push(left[i++]);
        else res.push(right[j++]);
    }
    return res.concat(left.slice(i)).concat(right.slice(j));
}`,
        expected: { time: "O(N log N)", space: "O(N)" }
    },
    {
        name: "Sort: QuickSort",
        language: "javascript",
        code: `function quickSort(arr) {
    if (arr.length <= 1) return arr;
    let pivot = arr[arr.length - 1];
    let left = [], right = [];
    for (let i = 0; i < arr.length - 1; i++) {
        if (arr[i] < pivot) left.push(arr[i]);
        else right.push(arr[i]);
    }
    return [...quickSort(left), pivot, ...quickSort(right)];
}`,
        expected: { time: "O(N log N)", space: "O(N)" }
    },

    // TREES & GRAPHS
    {
        name: "Tree: Inorder Traversal",
        language: "javascript",
        code: `function inorderTraversal(root) {
    let res = [];
    function travel(node) {
        if (!node) return;
        travel(node.left);
        res.push(node.val);
        travel(node.right);
    }
    travel(root);
    return res;
}`,
        expected: { time: "O(N)", space: "O(N)" }
    },
    {
        name: "Graph: Number of Islands (DFS)",
        language: "javascript",
        code: `function numIslands(grid) {
    let rows = grid.length, cols = grid[0].length;
    function dfs(r, c) {
        if (r < 0 || c < 0 || r >= rows || c >= cols || grid[r][c] === '0') return;
        grid[r][c] = '0';
        dfs(r+1, c);
        dfs(r-1, c);
        dfs(r, c+1);
        dfs(r, c-1);
    }
    let count = 0;
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            if (grid[r][c] === '1') {
                count++;
                dfs(r, c);
            }
        }
    }
    return count;
}`,
        expected: { time: "O(R*C)", space: "O(R*C)" } // R = rows, C = cols
    },
    {
        name: "Graph: Dijkstra's Algorithm",
        language: "javascript",
        code: `function dijkstra(adj, start) {
    let dist = Array(adj.length).fill(Infinity);
    dist[start] = 0;
    let pq = [{node: start, d: 0}];
    while (pq.length) {
        pq.sort((a,b) => b.d - a.d); // simple priority queue
        let {node, d} = pq.pop();
        if (d > dist[node]) continue;
        for (let [v, w] of adj[node]) {
            if (d + w < dist[v]) {
                dist[v] = d + w;
                pq.push({node: v, d: dist[v]});
            }
        }
    }
    return dist;
}`,
        expected: { time: "O((V+E) log V)", space: "O(V+E)" }
    }
];

console.log("Running Extended DSA Accuracy Tests...\n");

let passed = 0;
testCases.forEach(tc => {
    const result = analyzeComplexity(tc.code, tc.language);
    const timeMatch = result.time === tc.expected.time;
    const spaceMatch = result.space === tc.expected.space;

    if (timeMatch && spaceMatch) {
        console.log(`✅ PASSED: ${tc.name}`);
        passed++;
    } else {
        console.log(`❌ FAILED: ${tc.name}`);
        console.log(`   Expected: Time ${tc.expected.time}, Space ${tc.expected.space}`);
        console.log(`   Actually: Time ${result.time}, Space ${result.space}`);
    }
});

console.log(`\nTests Completed: ${passed}/${testCases.length} passed.`);