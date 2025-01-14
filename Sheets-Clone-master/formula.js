// Selecting the cells & store the data
for (let i = 0; i < rows; i++) {
  for (let j = 0; j < cols; j++) {
    let cell = document.querySelector(`.cell[rid="${i}"][cid="${j}"]`);
    cell.addEventListener('blur', (e) => {
      let address = addressBar.value;
      let [activeCell, cellProp] = getCellAndCellProp(address);
      let enteredData = activeCell.innerText;

      if (enteredData === cellProp.value) return; // No change in data
      cellProp.value = enteredData; // Update value property

      // Remove P-C relation, clear formula, and update children if data modifies
      removeChildFromParent(cellProp.formula);
      cellProp.formula = '';
      updateChildrenCells(address);
    });
  }
}

// Evaluate formula
let formulaBar = document.querySelector('.formula-bar');
formulaBar.addEventListener('keydown', async (e) => {
  let inputFormula = formulaBar.value;

  // Check if the key is 'Enter' and formula input is not empty
  if (e.key === 'Enter' && inputFormula) {
    let address = addressBar.value;
    let [cell, cellProp] = getCellAndCellProp(address);

    // If formula changed, update relations
    if (inputFormula !== cellProp.formula) {
      removeChildFromParent(cellProp.formula);
      addChildToGraphComponent(inputFormula, address);
    }

    // Check for cyclic dependencies
    let cycleResponse = isGraphCyclic(graphComponentMatrix);
    if (cycleResponse) {
      let response = confirm('Your formula is cyclic. Do you want to trace your path?');
      while (response) {
        await isGraphCyclicTracePath(graphComponentMatrix, cycleResponse);
        response = confirm('Your formula is cyclic. Do you want to trace your path?');
      }
      removeChildFromGraphComponent(inputFormula, address);
      return;
    }

    // Evaluate the formula
    let evaluatedValue = evaluateFormula(inputFormula);

    // Update UI and Cell Props
    setCellUIAndCellProp(evaluatedValue, inputFormula, address);
    addChildToParent(inputFormula);
  }
});

// Helper functions

// Get cell and its properties
function getCellAndCellProp(address) {
  let [rid, cid] = decodeAddress(address);
  let cell = document.querySelector(`.cell[rid="${rid}"][cid="${cid}"]`);
  let cellProp = cellProperties[rid][cid];
  return [cell, cellProp];
}

// Decode address (e.g., "A1" -> row, column indices)
function decodeAddress(address) {
  let row = Number(address.slice(1)) - 1; // Extract row number
  let col = address.charCodeAt(0) - 65; // Convert column letter to number
  return [row, col];
}

// Remove child from parent relationships
function removeChildFromParent(formula) {
  let formulaTokens = formula.split(/[\+\-\*\/\(\)\^ ]/);
  formulaTokens = formulaTokens.filter((token) => isCellReference(token));

  formulaTokens.forEach((parentAddress) => {
    let [parentCell, parentCellProp] = getCellAndCellProp(parentAddress);
    let idx = parentCellProp.children.indexOf(formula);
    if (idx > -1) parentCellProp.children.splice(idx, 1);
  });
}

// Add child to parent relationships
function addChildToParent(formula) {
  let formulaTokens = formula.split(/[\+\-\*\/\(\)\^ ]/);
  formulaTokens = formulaTokens.filter((token) => isCellReference(token));

  formulaTokens.forEach((parentAddress) => {
    let [parentCell, parentCellProp] = getCellAndCellProp(parentAddress);
    parentCellProp.children.push(formula);
  });
}

// Evaluate formula
function evaluateFormula(formula) {
  let formulaTokens = formula.split(/[\+\-\*\/\(\)\^ ]/);
  formulaTokens = formulaTokens.map((token) => {
    if (isCellReference(token)) {
      let [cell, cellProp] = getCellAndCellProp(token);
      return cellProp.value; // Retrieve value from cellProp
    }
    return token; // If it's not a reference, return the token itself
  });

  let evaluatedFormula = formulaTokens.join('');
  return eval(evaluatedFormula); // Evaluate the final expression
}

// Update children cells
function updateChildrenCells(parentAddress) {
  let [parentCell, parentCellProp] = getCellAndCellProp(parentAddress);
  let children = parentCellProp.children;

  children.forEach((childAddress) => {
    let [childCell, childCellProp] = getCellAndCellProp(childAddress);
    let childFormula = childCellProp.formula;
    let evaluatedValue = evaluateFormula(childFormula);
    setCellUIAndCellProp(evaluatedValue, childFormula, childAddress);
    updateChildrenCells(childAddress); // Recursive update
  });
}

// Set cell UI and properties
function setCellUIAndCellProp(value, formula, address) {
  let [cell, cellProp] = getCellAndCellProp(address);
  cell.innerText = value; // Update UI
  cellProp.value = value; // Update value in properties
  cellProp.formula = formula; // Update formula
  // Register the cell as dependent on other cells
  addChildToParent(formula);
}

// Check if a formula token is a cell reference
function isCellReference(token) {
  return /^[A-Z][0-9]+$/.test(token); // Matches patterns like "A1", "B2", etc.
}

// Check for cyclic dependencies
function isGraphCyclic(graphMatrix) {
  // Initialize visited arrays to track visited nodes
  let visited = new Array(graphMatrix.length).fill(false);
  let inStack = new Array(graphMatrix.length).fill(false); // To track nodes in the current DFS path

  // Helper function to perform DFS and check for cycles
  function dfs(node) {
    // If node is already in the current DFS stack, we found a cycle
    if (inStack[node]) {
      return true;
    }

    // If node is already visited, no need to explore it
    if (visited[node]) {
      return false;
    }

    // Mark the node as visited and add to the DFS stack
    visited[node] = true;
    inStack[node] = true;

    // Explore all the neighbors (adjacent nodes) of the current node
    for (let neighbor = 0; neighbor < graphMatrix[node].length; neighbor++) {
      if (graphMatrix[node][neighbor] === 1 && dfs(neighbor)) {
        return true; // Cycle found in the neighbors
      }
    }

    // Remove the node from the DFS stack after exploring
    inStack[node] = false;

    return false;
  }

  // Iterate over all nodes to check for cycles
  for (let node = 0; node < graphMatrix.length; node++) {
    if (!visited[node] && dfs(node)) {
      return true; // Cycle detected
    }
  }

  return false; // No cycle found
}


// Trace cyclic dependencies
async function isGraphCyclicTracePath(graphMatrix, cyclePath) {
  // Step 1: Identify the nodes involved in the cycle
  let cycleNodes = cyclePath.reverse(); // Reverse the cyclePath to show it from start to end

  // Step 2: Visualize the cycle (e.g., by highlighting nodes and edges)
  highlightCycle(cycleNodes);

  // Step 3: Provide the user with an option to trace the cycle
  let userResponse = confirm('A cyclic dependency has been detected. Would you like to trace the cycle path?');

  if (userResponse) {
    for (let i = 0; i < cycleNodes.length; i++) {
      await highlightPath(cycleNodes[i], cycleNodes[i + 1]);
    }
  } else {
    // If the user does not want to trace, clear any cycle-related highlights
    clearCycleHighlights();
  }
}

// Helper function to highlight the nodes involved in the cycle
function highlightCycle(cycleNodes) {
  cycleNodes.forEach((node, index) => {
    let cell = document.querySelector(`.cell[rid="${node[0]}"][cid="${node[1]}"]`);
    if (cell) {
      cell.style.backgroundColor = 'red'; // Example of highlighting a node (you can use a different color or effect)
    }
  });
}

// Helper function to highlight the path between two nodes
async function highlightPath(startNode, endNode) {
  let startCell = document.querySelector(`.cell[rid="${startNode[0]}"][cid="${startNode[1]}"]`);
  let endCell = document.querySelector(`.cell[rid="${endNode[0]}"][cid="${endNode[1]}"]`);

  // Optionally animate the path (e.g., a smooth transition between cells)
  if (startCell && endCell) {
    startCell.style.border = '2px solid blue'; // Example of highlighting edges
    endCell.style.border = '2px solid blue';
    await new Promise(resolve => setTimeout(resolve, 500)); // Delay for effect
  }
}

// Helper function to clear the cycle highlights
function clearCycleHighlights() {
  let cells = document.querySelectorAll('.cell');
  cells.forEach(cell => {
    cell.style.backgroundColor = ''; // Clear background color
    cell.style.border = ''; // Clear borders
  });
}


// Graph to track dependencies (represented as an adjacency list for simplicity)
let graphComponentMatrix = {};

// Add child to graph component
function addChildToGraphComponent(formula, childAddress) {
  // Step 1: Extract cell references from the formula
  let formulaTokens = formula.split(/[\+\-\*\/\(\)\^ ]/);  // Tokenize formula
  let cellReferences = formulaTokens.filter((token) => isCellReference(token)); // Extract valid cell references

  // Step 2: For each cell reference in the formula, add the current cell as its dependent
  cellReferences.forEach((parentAddress) => {
    if (!graphComponentMatrix[parentAddress]) {
      graphComponentMatrix[parentAddress] = [];
    }

    // Add the child (current cell) to the list of dependents for the parent cell
    if (!graphComponentMatrix[parentAddress].includes(childAddress)) {
      graphComponentMatrix[parentAddress].push(childAddress);
    }
  });

  // Optionally log the updated graph for debugging
  console.log(graphComponentMatrix);
}


// Remove child from graph component
function removeChildFromGraphComponent(formula, childAddress) {
  // Step 1: Extract cell references from the formula
  let formulaTokens = formula.split(/[\+\-\*\/\(\)\^ ]/);  // Tokenize formula
  let cellReferences = formulaTokens.filter((token) => isCellReference(token)); // Extract valid cell references

  // Step 2: For each cell reference in the formula, remove the current cell (childAddress) from its dependents list
  cellReferences.forEach((parentAddress) => {
    if (graphComponentMatrix[parentAddress]) {
      let index = graphComponentMatrix[parentAddress].indexOf(childAddress);
      
      // If the childAddress is found in the parentAddress' list of dependents, remove it
      if (index > -1) {
        graphComponentMatrix[parentAddress].splice(index, 1);
      }

      // If the parent cell no longer has any dependents, you can choose to delete the parent from the graph (optional)
      if (graphComponentMatrix[parentAddress].length === 0) {
        delete graphComponentMatrix[parentAddress];
      }
    }
  });

  // Optionally log the updated graph for debugging
  console.log(graphComponentMatrix);
}

// Helper function to check if a token is a valid cell reference (e.g., "B1", "C2")
function isCellReference(token) {
  return /^[A-Z][0-9]+$/.test(token);  // Regex to match cell reference (e.g., "B1", "C1")
}

