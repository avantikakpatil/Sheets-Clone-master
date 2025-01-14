let rows = 100; // number of rows in the grid of cells
let cols = 26; // total alphabets are 26 (columns A-Z)

// DOM elements
let addressRowCont = document.querySelector('.address-row-cont');
let addressColCont = document.querySelector('.address-col-cont');
let cellsCont = document.querySelector('.cells-cont');
let addressBar = document.querySelector('.address-bar');

// Create row headers (1 to 100)
for (let i = 0; i < rows; i++) {
  let addressRow = document.createElement('div');
  addressRow.setAttribute('class', 'address-row');
  addressRow.innerText = i + 1; // Row number starts from 1
  addressRowCont.appendChild(addressRow);
}

// Create column headers (A to Z)
for (let i = 0; i < cols; i++) {
  let addressCol = document.createElement('div');
  addressCol.setAttribute('class', 'address-col');
  addressCol.innerText = String.fromCharCode(65 + i); // Convert 0-25 to A-Z
  addressColCont.appendChild(addressCol);
}

// Create the grid of cells
for (let i = 0; i < rows; i++) {
  let rowCont = document.createElement('div');
  rowCont.setAttribute('class', 'row-cont');

  for (let j = 0; j < cols; j++) {
    // Create individual cell elements
    let cell = document.createElement('div');
    cell.setAttribute('class', 'cell');
    cell.setAttribute('contentEditable', 'true');
    cell.setAttribute('spellcheck', 'false'); // Disable spellcheck for spreadsheet cells

    // Attributes for Cell & Storage identification
    cell.setAttribute('rid', i); // Row ID (0-indexed)
    cell.setAttribute('cid', j); // Column ID (0-indexed)

    // Add event listeners
    cell.addEventListener('click', () => updateAddressBar(i, j));
    cell.addEventListener('keydown', (event) => handleKeydown(event, i, j));

    rowCont.appendChild(cell);
  }
  cellsCont.appendChild(rowCont);
}

// Function to update the address bar with cell address
function updateAddressBar(row, col) {
  let rowID = row + 1; // Convert 0-indexed row to 1-indexed row
  let colID = String.fromCharCode(65 + col); // Convert 0-indexed column to A-Z
  addressBar.value = `${colID}${rowID}`; // Set the address bar value (e.g., A1, B2)
}

// Function to handle keydown events
function handleKeydown(event, row, col) {
  if (event.key === "Enter") {
    event.preventDefault(); // Prevent default Enter behavior (new line in contentEditable)

    let nextRow = row + 1; // Move to the next row
    if (nextRow < rows) {
      let nextCell = document.querySelector(`.cell[rid="${nextRow}"][cid="${col}"]`);
      if (nextCell) {
        nextCell.focus(); // Focus the cell in the next row
        nextCell.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); // Scroll to the cell if needed
      }
    }
  } else if (event.key === "ArrowDown") {
    // Handle Arrow Down navigation
    let nextRow = row + 1;
    if (nextRow < rows) {
      let nextCell = document.querySelector(`.cell[rid="${nextRow}"][cid="${col}"]`);
      if (nextCell) {
        nextCell.focus();
        nextCell.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  } else if (event.key === "ArrowUp") {
    // Handle Arrow Up navigation
    let prevRow = row - 1;
    if (prevRow >= 0) {
      let prevCell = document.querySelector(`.cell[rid="${prevRow}"][cid="${col}"]`);
      if (prevCell) {
        prevCell.focus();
        prevCell.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  } else if (event.key === "ArrowRight") {
    // Handle Arrow Right navigation
    let nextCol = col + 1;
    if (nextCol < cols) {
      let nextCell = document.querySelector(`.cell[rid="${row}"][cid="${nextCol}"]`);
      if (nextCell) {
        nextCell.focus();
        nextCell.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  } else if (event.key === "ArrowLeft") {
    // Handle Arrow Left navigation
    let prevCol = col - 1;
    if (prevCol >= 0) {
      let prevCell = document.querySelector(`.cell[rid="${row}"][cid="${prevCol}"]`);
      if (prevCell) {
        prevCell.focus();
        prevCell.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  }
}
