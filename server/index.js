const express = require("express");
const path = require('path');
const PORT = process.env.PORT || 3001;
const app = express();
const fs = require("fs");
const Pool = require('pg').Pool;
const table_name = "data";
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.resolve(__dirname, '../client/build')));

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  //connectionString: "postgresql://postgres:password@localhost:5432/postgres",
  ssl: {
    rejectUnauthorized: false
  }
});

/* Populate Database */
async function create_db_structure(table_name){
  console.log("[Groupify]: Checking Database");
  try {
    const res = await pool.query("SELECT table_name FROM information_schema.tables where table_name='"+table_name+"';", []);
    var json_res = "";
    for (let row of res.rows) {
      json_res = JSON.stringify(row);
    }
    // Create table if MIA
    if (json_res == ""){
      console.log("[Groupify]: Creating main table in the database.");
      pool.query("CREATE TABLE "+table_name+" (id serial PRIMARY KEY,group_id INT, course_id INT,shift_id INT,student_number VARCHAR(100),student_name VARCHAR(255), createdon timestamp not null default CURRENT_TIMESTAMP);", []);
    }
  }catch (error){
    console.log("[Groupify]: " + error);
    res.status(500).send('Houston we have a problem');
  }
}

/* Downloads groups by course id from a csv file */
app.get('/api/v1/csv/groups/download/:course_id', function(req, res){
  const file = __dirname+"/groups_"+ req.params.course_id +".csv"
  res.download(file); // Set disposition and send it.
});

/* Downloads groups by course id from the database */
app.get('/api/v1/groups/download/:course_id', async function(req, res){
  let file = __dirname+"/tmp_groups_"+ req.params.course_id +".csv"
  fs.writeFileSync(file, ""); // Create/re-create file
  try {
    const result = await pool.query("SELECT group_id, course_id, shift_id, student_number, student_name, createdon from "+table_name+" WHERE course_id=$1", [req.params.course_id]);
    for (let row of result.rows) {
      re = JSON.parse(JSON.stringify(row));
      console.log(re);
      // CSV file: group id, course id, shift id, student number, student name, createdon
      fs.appendFileSync(file, re.group_id + "," + re.course_id + "," + re.shift_id + "," + re.student_number + "," + re.student_name+"," + re.createdon + "\n");
    } 
  }catch (error){
    console.log("[Groupify]: " + error);
    res.status(500).send('Houston we have a problem');
  }
  res.download(file); // Set disposition and send it.
});

/* Get the number of groups registered using a PostgreSQL database */
app.get("/api/v1/groups/:course_id", async (req, res) => {
  // Sample data:
  // # Group 1 and 2
  // INSERT INTO data (group_id, course_id, shift_id, student_number, student_name) VALUES (1, 0, 1, 'a1', 'Alice'), 
  // (1, 0, 1, 'a2', 'Bob'), (2, 0, 1, 'a3', 'Doc Brown'), (2, 0, 1, 'a4', 'Marty McFly');
  try {
    const result = await pool.query("select MAX(group_id) as number_of_groups, COUNT(student_number) as number_of_students from "+table_name+";", []);
    json_res = JSON.parse(JSON.stringify(result.rows[0]))
    console.log(json_res);
  }catch (error){
    console.log("[Groupify]: " + error);
    res.status(500).send('Houston we have a problem');
  }

  res.json({message: {"groups": isNaN(parseInt(json_res['number_of_groups'])) ? 0 : parseInt(json_res['number_of_groups']), "students": parseInt(json_res['number_of_students']) }});
});

/* Create a new group into the PostgreSQL database */
app.post("/api/v1/groups", async (req, res) => {
  console.log("[Groupify]: payload = " + JSON.stringify(req.body));
  var new_group = req.body.students;
  var course = req.body.course;
  var students = req.body.students
  var group_id = 1;

  // Get the number of the last created group
  try {
    // INSERT INTO data (group_id, course_id, shift_id, student_number, student_name) VALUES (1, 0, 1, 'a1', 'Alice'),
    const result = await pool.query("SELECT MAX(group_id) as group_id FROM "+table_name+";", []); 
    tmp = parseInt(result.rows[0].group_id);
    if (!isNaN(tmp)) group_id = tmp+1;
  }catch (error){
    console.log("[Groupify]:" + error);
    res.status(500).send('Houston we have a problem');
  }

  // Create the new group with the students payload.
  for(let i=0; i < students.length; i++){
    let student = students[i]
    console.log("Adding "+JSON.stringify(student));
    try {
      // INSERT INTO data (group_id, course_id, shift_id, student_number, student_name) VALUES (1, 0, 1, 'a1', 'Alice'),
      const result = await pool.query("INSERT INTO "+table_name+" (group_id, course_id, shift_id, student_number, student_name) VALUES ($1, $2, $3, $4, $5)", 
      [group_id, course.id, course.shift, student.number, student.name]);
      console.log("[Groupify]: New group added.");
    }catch (error){
      console.log("[Groupify]: " + error);
      res.status(500).send('Houston we have a problem');
    }
  }
  res.json(200);
});

/* Get the number of groups registered using CSV files*/
app.get("/api/v1/csv/groups/:course_id", (req, res) => {
  var size = 0
  let filename = __dirname+"/groups_"+ req.params.course_id +".csv"
  /* Get each line of the csv file into the 'students' array. */
  var students = require('fs').readFileSync(filename, 'utf-8').split('\n').filter(Boolean);
  if (students.length != 0)
    size =  parseInt(students[students.length-1].substring(0, students[students.length-1].indexOf(",")));
  res.json({message: {"groups": size, "students": students.length}});
});

/* Create a new group using CSV files. */
app.post("/api/v1/csv/groups", (req, res) => {
  console.log("[Groupify]: payload = " + JSON.stringify(req.body));
  var new_group = req.body.students;
  var course = req.body.course;
  var group_id = 1;
  // console.log("[Groupify]: body = " + req.body);
  let filename = __dirname+"/groups_"+ course.id +".csv"
  try{
    /* Get each line of the csv file into the 'students' array. */
    var students = require('fs').readFileSync(filename, 'utf-8').split('\n').filter(Boolean);
    // console.log("[Groupify]: students = " + students);
    /* If exists, get the ID of the last group added to the CSV file */
    var last_group =  parseInt(students[students.length-1].substring(0, students[students.length-1].indexOf(",")));
    group_id = last_group + 1;  
  }catch (error) {}
 
  /* Store into the CSV a new group */
  new_group.forEach(function (student, index) { 
    // CSV file: group id, course id, shift id, student number, student name
    fs.appendFileSync(filename, group_id + "," + course.id + "," + course.shift + "," + student.number + "," + student.name+"\n");
  })

  /* Returns as response the group id assigned to the students */
  res.json({ message: group_id });
  
});

// All other GET requests not handled before will return to the React app
app.get('*', (req, res) => {
  res.sendFile(path.resolve(__dirname, '../client/build', 'index.html'));
});

app.listen(PORT, () => {
  create_db_structure(table_name)
  console.log(`[Groupify]: Server listening on ${PORT}`);
});
