import './App.css';
import React, { useState, useEffect} from "react";
import {Typography, Link, Card, CardHeader, Button, CardContent, TextField, Select, MenuItem, Divider} from '@mui/material';
import axios from 'axios';
// Thank you, https://www.npmjs.com/package/react-circular-progressbar
import { CircularProgressbarWithChildren, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';
// Thank you, https://mui.com/pt/api/icon/
import PeopleIcon from '@mui/icons-material/People';
import PersonIcon from '@mui/icons-material/Person';
import Loading from './Loading';
import Popup from './Popup';

function App() {
  // ********************************************************************************************
  // Teacher Defined Settings
  // ********************************************************************************************
  const shifts  = ["PL1"];    // Array of shifts / turnos.
  const courses = ["Serviços e Interfaces para a Cloud"]; // Array of courses to register groups.
  const number_of_students = 27;                   // Number of students enrolled in the course.
  const min = 2;                                   // Min number of students in a group.
  const max = 3;                                   // Max number of students in a group.
  // ********************************************************************************************
  //
  const version = "0.1";
  const [group, setGroup] = useState([{name:"",number:""}]);
  const [course, setCourse] = useState({shift:"", id:0})
  const [stats, setStats] = useState({students: 0, groups:0});
  const [loadingStatus, setLoadingStatus] = useState(false);
  const [popupStatus, setPopupStatus] = useState({status: false, error: false, message: ""});
  
  // Do something after rendering page
  useEffect(() => {
    axios.get('/api/v1/groups/'+ course.id).then((response) => {
      setStats({students: response.data.message.students, groups: response.data.message.groups})
    }).catch(err => {});
  }, []);

  // Handle click event to add a new element to the group.
  const handleAdd = () => {
    setGroup([...group, { name:"", number: "", }]);
  };

  // Handle change event.
  const handleInput = (e, index) => {
    const {name,value} = e.target;
    const list = [...group];
    list[index][name] = value;
    setGroup(list);
  };

  // Handle click event for the remove button.
  const handleRemove = index => {
    const list = [...group];
    list.splice(index, 1);
    setGroup(list);
  };

  // Validate students.
  function validStudents(payload) {
    // Let's go old school with the traditional for
    for(let i=0; i < payload.students.length; i++){
      let student = payload.students[i];
      if (student.name.length === 0 || student.number.length === 0) return false;
    }
    // Validate the number of min students in a group
    if (payload.students.length < min) return false;
    return true;
  }

  // Create a group by calling a specific backend service.
  const createGroup = () => {
    const DEBUG=false;
    const payload = {"course": {id: course.id, "shift": course.shift}, students: [...group]}
    if (DEBUG) console.log(payload)
   
    // Form validation 
    if (course.shift === "" || !validStudents(payload))
        setPopupStatus({status:true, error: true, message:"Todos os campos são de preenchimento obrigatório e cada grupo não pode ter menos de " + min + " estudante(s) e mais de "+ max +" estudantes(s)."});
    else{
      setLoadingStatus(true);
      axios.post('/api/v1/groups', payload)
      .then(() => {
        setPopupStatus({status:true, message:"Grupo criado com sucesso!"});
        setLoadingStatus(false);
        } )
      .catch(err => {
        setPopupStatus({status:true, error:true, message:"Ocorreu um erro inesperado!"});
        setLoadingStatus(false);
        console.error(err);
      });
    }
  }

  // The copyright function
  function Copyright() {
    return (
      <Typography variant="body2" align="center">
        {/* <img alt="groupify" src={process.env.PUBLIC_URL + '/logo_32.png'} style={{width:"32px", height:"32px", marginBottom: "15px"}}/>*/}
          <Link color="inherit" style={{textDecoration:"none"}} href="https://github.com/tiagomiguelcs/Groupify">Powered by Groupify {version}</Link>
      </Typography>
    );
  }
  
  const value = Math.round((stats.students*100)/number_of_students);
  return (
    <div>
      {/* Loading component */}
      <Loading open={loadingStatus}/>
      <Popup open={popupStatus.status} onClose={() => {!popupStatus.error ? window.location.reload() : setPopupStatus({...popupStatus, status: false, error: false})}}>
        { ((popupStatus.message).length !== 0) ? <Typography variant="subtitle1" style={{fontWeight:"bold"}} >{popupStatus.message}</Typography> : null }
      </Popup> 
      {/* Main interface */}
      <div className="app" >
        {/* Form Card */}  
        <Card>
        <CardHeader className="card-header" title="Registo de Grupos"/>
         <CardContent>
          <div className="card-header-content">
              <Select id="course" size="small" style={{width:"90%"}} disabled={true} value={0}>
                {courses.map((course, index) =>
                  <MenuItem key={index} selected={true} value={index} >{course}</MenuItem>
                )}
              </Select>
              <Typography>Turno</Typography>
              <Select id="shift" value={course.shift} onChange={(event) => setCourse({...course, shift: event.target.value})} size="small" style={{width:"13%"}}>
                {shifts.map((shift, index) =>
                  <MenuItem key={index+1} value={index+1} >{shift}</MenuItem>
                )}
              </Select>
          </div>
          <p/>
          <Divider/><br/>
          {group.map((x, i) => {
            return (
              <div className="form-container">
                  <div className="textfield-container">
                    <Typography>Número</Typography><TextField size="small" onChange={e => handleInput(e, i)} name="number" value={x.number} style={{width:"100px"}} type="text"/>
                    <Typography>Nome</Typography><TextField  size="small" onChange={e => handleInput(e, i)} name="name" value={x.name} style={{width:"300px", padding:"0px"}} type="text"/>
                    { (group.length - 1 === i && group.length < max) && <Button variant="contained" disableElevation style={{fontWeight: "bold"}} onClick={handleAdd}>+</Button>}
                    {group.length !== 1 && <Button variant="contained" disableElevation style={{fontWeight: "bold"}} color="error" onClick={() => handleRemove(i)}>X</Button>}
                  </div>
                <p>
                {group.length - 1 === i &&  <Button variant="contained" disableElevation style={{width:"100%", fontWeight:"bold"}} onClick={createGroup}>Registar Grupo</Button>}
                </p>
              </div>
            );
          })}
          </CardContent>
        </Card>
        <span style={{fontSize:"xx-small"}}>&nbsp;</span>
        {/* Stats Card */}  
        <Card>
          <CardContent>
            <div className="stats-container">
              {/* Students */}
              <div className="stats-students">
                <label>Estudantes Registrados</label>
                <div className="progress-bar-container">
                  <CircularProgressbarWithChildren value={value} maxValue={100} 
                      styles={buildStyles({
                        strokeLinecap: 'butt',
                        textSize: '20px',
                        pathTransitionDuration: 0.5,
                        pathColor: 'rgb(76, 175, 80)',
                        textColor: 'black',
                        trailColor: '#efefef',})}>
                      <PersonIcon fontSize="large" style={{color:"black"}}/>
                      {`${value}%`} ({stats.students})
                  </CircularProgressbarWithChildren>
                </div>
              </div>
              {/* Groups */}
              <div className="stats-groups">
                <label>Grupos Registrados</label>
                <Typography variant="h2" component="h2">
                  {stats.groups}<PeopleIcon fontSize="large" style={{color:"black", marginBottom:"-6px"}}/>
                </Typography>
              </div>
            </div>
          </CardContent>
        </Card>
        <Copyright/>
      </div> 
    </div>
  );
}

export default App;
