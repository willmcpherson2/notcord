import { React, Component } from 'react';
import { Button, Container, Form, Row, Col } from 'react-bootstrap';
import Logo from '../../notcord.png';
import '../../App.css'

export default class CreateNewGroup extends Component {
  constructor(props){
    super(props);
    this.state = {
      name: ''
    }
  }


  handleSubmit = (e) => {
    const { name} = this.state;

      //This will create the group when the backend is set up to do so
      fetch(process.env.REACT_APP_API_URL + '/add_group', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(name)
      }).then(res =>          
          res.json()
      ).then(res => {
        console.log(res)
        if (res === "Ok") {
          this.props.setView("dashboard")
        } else if (res === "GroupAlreadyExists") {
          console.log("GROUP ALREADY EXISTS")
          // TODO: create bootstrap alert for this
        } else {
          console.log(res)
        }
      })
  }


  handleNameChange = (e) => {
    this.setState({ name: e.target.value })
  }

  render() {
    return (
      <Container className="topPad">
        <Row className="justify-content-md-center">
          <h2>Create New Group</h2><br/>
        </Row>
        <Row className="justify-content-md-center">
          <Form>
            <Form.Group>
              <Form.Label>Group Name</Form.Label>
              <Form.Control type="text" onChange={this.handleNameChange}/>
            </Form.Group>
            <Button onClick={this.handleSubmit}>Create Group</Button>
          </Form>
        </Row>
      </Container>
    );
  }
}
