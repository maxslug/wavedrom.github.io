//
// Grid-Editor PoC for WaveDrom
// Max Baker <@maxslug>
// License: see LICENSE file
//
// TODO:
//    - Handling of `data:` in wavejson
//        * tableAddCol will add a second set of parallel data columns
//        * data columns are editable and free text
//        * column contents will be compacted into data:[] array in output json
//    - Re-integrate the fancy code editor
//    - Two way handling of data, changes in code editor push back to grid and vice versa
//    - Limited support for other features like head/tail
//        * Grid will only read-modify-write the signals:[] data while keeping other things
//        * Some free text boxes / check boxes / drop-downs with wavedrom features
//    - Other fancy features not supported here?
//
var data = [
  { signal:"clk",    group:0, 0:"p",1:"p",2:"p" },
  { signal:"data_i", group:0, 0:"x",1:"1",2:"0" },
  { signal:"data_o", group:1, 0:"x",1:"x",2:"1" },
];

var vals = ["",".","0","1","2","3","4","5","6","7","8","9","p","P","x","z","=","u","d"];

var table = new Tabulator("#mytable", {
   height:200,
   data:data,
   layout:"fitData",
   layoutColumnsOnNewData:true,
   // Move Rows + Cols
   movableRows: true,
   // TODO(maxslug) re-number columns after move
   movableColumns: true,
   // Group Rows
   groupBy:"group",
   groupUpdateOnCellEdit:true,
   // Undo
   history:true,
   columns:[
     {rowHandle:true,headerSort:false,formatter:"handle"},
     {title:"Signal", field:"signal", editor:"input",headerSort:false},
     {title:"G", field:"group", editor:"number",headerSort:false},
   ],
});


// undo button
document.getElementById("history-undo").addEventListener("click", function(){
  table.undo();
});

// redo button
document.getElementById("history-redo").addEventListener("click", function(){
  table.redo();
});

// regroup button
document.getElementById("regroup").addEventListener("click", function(){
  table.setGroupBy("group");
});

// +Row button
document.getElementById("addrow").addEventListener("click", function(){
  table.addRow({signal:"",group:0},false);
});

// +Col button
document.getElementById("addcol").addEventListener("click", function(){
  tableAddCol(table);
});

// Render button
document.getElementById("render").addEventListener("click", function(){
  table.redraw();
  updateJson(table);
  WaveDrom.EditorRefresh() 
});

// TODO(maxslug) Delete Row (x column?)
// TODO(maxslug) Delete Col (right click header w/ confirmation)
// TODO(maxslug) Insert Col (left click header)

// Get data columns in order
function tableCols(table) {
  var colsOrder = [];
  table.getColumns().forEach(function(col){
    c = col.getField();
    colsOrder.push(col.getField());
  });
  return colsOrder;
}

// Translate Table to JSON
function tableToJSON(table) {
  cols = tableCols(table);

  s = "";

  // Debug output
  // var data = table.getData();
  // s += JSON.stringify(data) + "\n\n";
  // s += JSON.stringify(cols) + "\n\n";

  var waveson = {
    signal: [[]],
    head: {'text':"test"},
    foot: {'tock':0},
  }

  for (row of table.getRows()) {
    var row_data = row.getData();
    var signal = row_data['signal'];
    var group  = row_data['group'];
    if (waveson['signal'][group] == null) {
      waveson['signal'][group] = [];
    }
    var wave = "";
    cols.forEach(function(col){
      if (col == null || col == "signal" || col == "group") {
        return;
      } 
      w = row_data[col];
      if (w == null) {
        w = 'x';
      }
      wave += w;
    });
    waveson['signal'][group].push(
      { name:signal, wave:wave }
    )
  }
  // TODO(maxslug) Create more wavedrom-style pretty printer
  s += "\n\n" + JSON.stringify(waveson, null, 2);
  return s
}

function updateJson(table) {
  document.getElementById("InputJSON_0").value = tableToJSON(table);
}


// Add Columns
var last_col = 0;
function tableAddCol(table) {
  var title = String(last_col);
  table.addColumn({title:title, field:title, width:20, hozAlign:"center",headerSort:false,
    editor:"list", editorParams:{values:vals}} );
  last_col++;
  // TODO(maxslug) is there an "Column added" event?
  updateJson(table);
  // TODO(maxslug) How to update WaveDrom from here? Causing problem at page load time
}

table.on("dataProcessed", function(data){
  updateJson(table);
});

table.on("dataChanged", function(data){
  // This event doesn't fire for column adds
  updateJson(table);
  WaveDrom.EditorRefresh() 
});

table.on("tableBuilt", function(){
  var i;
  for (i = 0; i < 5; i++) {
    tableAddCol(table);
  }
});

// Kick Off Wavedrom
