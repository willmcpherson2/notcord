import { React, Component } from 'react';
import { Button, Container, Form, Row, Col } from 'react-bootstrap';
import Logo from '../../notcord.png';
import '../../App.css'

//Sets the encryption that uses bcrypt. The salt rounds can be changed but will be left at 10 for this purpose.
export default class Login extends Component {
  constructor(props) {
    super(props);
    this.state = {
      username: '',
      password: ''
    }
  }


  handleSubmit = (e) => {
    const { username, password } = this.state;

    //This then posts the json of the username and password
    fetch('http://localhost:8000/signup', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: username,
        password: password
      })
    })
      //This part gets the response code, and then logs that code.
      .then(res => {
        console.log(res)
      })



  }


  handleUserChange = (e) => {
    this.setState({ username: e.target.value })
  }

  handlePassChange = (e) => {
    this.setState({ password: e.target.value })
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
          <Form>
            <Form.Group controlId="formUsername">
              <Form.Control type="text" placeholder="Username" value={this.state.username} onChange={this.handleUserChange}></Form.Control>
            </Form.Group>
            <Form.Group controlId="formPassword">
              <Form.Control type="password" placeholder="Password" value={this.state.password} onChange={this.handlePassChange}></Form.Control>
            </Form.Group>
            <Col className="justify-content-md-center"><Button varient="primary" onClick={this.handleSubmit}>Register</Button></Col>
          </Form>

        </Row>
      </Container>
    );
  }
}
