const express = require("express");
const PORT = process.env.PORT || 3001;
const app = express();
const fs = require("fs");
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.resolve(__dirname, '../client/build')));

/* Get the number of groups registered */
app.get("/api/v1/groups/:course_id", (req, res) => {
  var size = 0
  let filename = __dirname+"/groups_"+ req.params.course_id +".csv"
  /* Get each line of the csv file into the 'students' array. */
  var students = require('fs').readFileSync(filename, 'utf-8').split('\n').filter(Boolean);
  if (students.length != 0)
    size =  parseInt(students[students.length-1].substring(0, students[students.length-1].indexOf(",")));
  res.json({message: {"groups": size, "students": students.length}});
});

/* Create a new group. */
app.post("/api/v1/groups", (req, res) => {
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

// All other GET requests not handled before will return our React app
app.get('*', (req, res) => {
  res.sendFile(path.resolve(__dirname, '../client/build', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server listening on ${PORT}`);
});
