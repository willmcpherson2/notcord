import { React, Component } from 'react';
import { Button, Container, Form, Row, Col } from 'react-bootstrap';
import Logo from '../notcord.png';
import '../App.css'
export default class Group extends Component {
  constructor(props) {
    super(props);
    this.state = {
      username: 'default'
    }
  }

  // TODO: Move this into the sidebar, this gets the username
  /*
  hasClicked = () => {
    fetch(process.env.REACT_APP_API_URL + '/get_username', {
      method: 'POST',
      credentials: 'include'
    }).then(res =>
      res.json()
  ).then(res => {
    this.setState({username: res})
    })
  }*/



  render() {
    return (
      <Container fluid>
        <Row>

          {/**NAVIGATION BAR */}
          <Col xs={3} className="navbar">
          <Container>
            <Row className="max">
            <h1>{this.props.group}</h1>
          </Row>
          <Row>
          <Button>Create New Channel</Button>
          </Row></Container>
          
          
          </Col>



          {/**TEXT MESSAGE SECTION */}
          <Col>
          <p>Text Messages will go here</p>
          </Col>
          
        </Row>
      </Container>
    );
  }
}
