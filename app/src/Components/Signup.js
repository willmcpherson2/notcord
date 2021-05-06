import { React, Component } from 'react';
import { Button, Container, Form, Row, Col } from 'react-bootstrap';
import Logo from '../notcord.png';
import '../App.css'

//Sets the encryption that uses bcrypt. The salt rounds can be changed but will be left at 10 for this purpose.
export default class Login extends Component {
  constructor(props) {
    super(props);
    this.state = {
      username: '',
      password: '',
      passConfirm: '',
    }
  }

  handleSubmit = async () => {
    const { username, password, passConfirm } = this.state;

    if (password === passConfirm) {

      //This then posts the json of the username and password
      const data = await fetch(process.env.REACT_APP_API_URL + '/signup', {
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
      const signup = await data.json();
       //This part gets the response JSON body, and then logs that JSON.
      if (signup === "Ok") {
        console.log(signup + "fdfdf")
      } else {
        console.log(signup + "Dfsf")
      }
       
    } else {
      // FEATURE: create a bootstrap alert
      console.log("PASSWORDS DO NOT MATCH")
    }
 }

  handleUserChange = (e) => {
    this.setState({ username: e.target.value })
  }
  handlePassChange = (e) => {
    this.setState({ password: e.target.value })
  }
  handlePassConfirmChange = (e) => {
    this.setState({ passConfirm: e.target.value })
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
          <Form.Text className="text-muted">Already have an account? <button onClick={() => this.props.setView("login")}>Login Here</button></Form.Text><br></br>
        </Row>
        <Row className="justify-content-md-center">
          <Form>
            <Form.Group controlId="formUsername">
              <Form.Control type="text" placeholder="Username" value={this.state.username} onChange={this.handleUserChange}></Form.Control>
            </Form.Group>
            <Form.Group controlId="formPassword">
              <Form.Control type="password" placeholder="Password" value={this.state.password} onChange={this.handlePassChange}></Form.Control>
            </Form.Group>
            <Form.Group controlId="formPasswordConfirm">
              <Form.Control type="password" placeholder="Password Confirm" value={this.state.passConfirm} onChange={this.handlePassConfirmChange}></Form.Control>
            </Form.Group>
            <Col className="justify-content-md-center"><Button varient="primary" onClick={this.handleSubmit}>Register</Button></Col>
          </Form>

        </Row>
      </Container>
    );
  }
}
