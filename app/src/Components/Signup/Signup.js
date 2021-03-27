import { React, Component } from 'react';
import { Button, Container, Form, Row, Col } from 'react-bootstrap';
import Logo from '../../notcord.png';
import '../../App.css'

//Sets the encryption that uses bcrypt. The salt rounds can be changed but will be left at 10 for this purpose.
const bcrypt = require('bcryptjs');
export default class Login extends Component {
  constructor(props) {
    super(props);
    this.state = {
      username: '',
      passwordHash: '',
      password: ''
    }
  }

  //This is the password hash. This is done 100% on the client side. Password should probably be protected though.
  hashPassword(password) {
    let that = this;
    bcrypt.genSalt(10, function (err, salt) {
      bcrypt.hash(password, salt, function (err, hash) {
        // Store hash in your database
        that.setState({ passwordHash: hash })
      });
    });
  }


  handleSubmit = (e) => {
    //This line stops the page from refreshing, which would reload the entire application.
    e.preventDefault();
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
    //This part gets the response code, and then logs that code.
    .then(res =>{
      console.log(res)
    })

    this.hashPassword(this.state.password);

  }


  handleUserChange = (e) => {
    this.setState({ username: e.target.value })
  }

  handlePassChange = (e) => {
    this.setState({ password: e.target.value })
  }

  handleClick = () => {
    this.hashPassword();
    bcrypt.compare("1234", this.state.passwordHash, function (err, res) {
      console.log(res)
    });
  }

  login = () => {
    this.props.setView("login")
  }



  render() {
    return (
      <Container className="Login">
        <Row className="justify-content-md-center">
          <img src={Logo} alt="NotCord Logo"></img>
        </Row>
        <Row className="justify-content-md-center">
          <h2>Register to NotCord</h2>
        </Row>
        <Row className="justify-content-md-center">
          <Form.Text className="text-muted">Already have an account? <button onClick={this.login}>Login Here</button></Form.Text><br></br>
        </Row>
        <Row className="justify-content-md-center">
          <Form onSubmit={this.handleSubmit}>
            <Form.Group controlId="formUsername">
              <Form.Control type="text" placeholder="Username" value={this.state.username} onChange={this.handleUserChange}></Form.Control>
            </Form.Group>
            <Form.Group controlId="formPassword">
              <Form.Control type="password" placeholder="Password" value={this.state.password} onChange={this.handlePassChange}></Form.Control>
            </Form.Group>
            <Col className="justify-content-md-center"><Button varient="primary" type="submit">Register</Button></Col>
          </Form>

        </Row>
        <p>The following lines are for testing and need to be removed.</p>
        <Button onClick={this.handleClick}>SEND TEST</Button>
        <Button onClick={this.handleClick}>SEND TEST</Button>
        <p>Username: {this.state.username}</p>
        <p>Password: {this.state.password}</p>
        <p>Hash: {this.state.passwordHash}</p>
      </Container>
    );
  }
}
