import { React, Component } from 'react';
import { Button, Container, Form, Row, Col } from 'react-bootstrap';
import Logo from '../../notcord.png';
import '../../App.css'

//Sets the encryption that uses bcrypt. The salt rounds can be changed but will be left at 10 for this purpose.
const bcrypt = require('bcryptjs');
const saltRounds = 10;

export default class Login extends Component {
  constructor(props) {
    super(props);
    this.state = {
      username: '',
      passwordHash: '12345',
      password: ''
    }
  }


  handleSubmit = (e) => {
    const { username, passwordHash } = this.state;
    fetch('http://localhost:8000/signup', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: username,
        password_hash: passwordHash
      })
    })
  }


  handleUserChange = (e) => {
    this.setState({ username: e.target.value})
  }

  handlePassChange = (e) => {
    this.setState({ password: e.target.value})
  }



  render() {
    return (
      <Container className="Login">
        <Row className="justify-content-md-center">
          <img src={Logo} alt="NotCord Logo"></img>
        </Row>
        <Row className="justify-content-md-center">
          <h2>NotCord Login</h2>
        </Row>
        <Row className="justify-content-md-center">
          <Form onSubmit={this.handleSubmit}>
            <Form.Group controlId="formUsername">
              <Form.Control type="text" placeholder="Username" value={this.state.username} onChange={this.handleUserChange}></Form.Control>
            </Form.Group>
            <Form.Group controlId="formPassword">
              <Form.Control type="password" placeholder="Password" value={this.state.password} onChange={this.handlePassChange}></Form.Control>
            </Form.Group>
            <Col className="offset-3"><Button varient="primary" type="submit">Login</Button></Col>
            
          </Form>
        </Row>

      </Container>
    );
  }
}
