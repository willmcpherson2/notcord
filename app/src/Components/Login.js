import { React, Component } from 'react';
import { Button, Container, Form, Row, Alert} from 'react-bootstrap';
import Logo from '../notcord.png';
import '../App.css'
export default class Login extends Component {
  constructor(props) {
    super(props);
    this.state = {
      username: '',
      password: '',
      shouldShowButton: true,
      success: true,
      alertMessage: '',
      showAlert: false
    }
  }

  handleSubmit = async () => {
    this.setState({shouldShowButton: false});
    const data = await fetch(process.env.REACT_APP_API_URL + '/login', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          username: this.state.username,
          password: this.state.password
        })
      })
      const login = await data.json();
      
      if (login === "Ok") {
        console.log(login)
        this.props.loggedIn(true)
        this.props.setView("dashboard")
      } else {
        console.log(login)
        this.setState({
          alertMessage: "Username or Password is Incorrect",
          showAlert: true,
          success: false,
          shouldShowButton: true
        })
      }
  }

  handleUserChange = (e) => {
    this.setState({ username: e.target.value })
  }
  handlePassChange = (e) => {
    this.setState({ password: e.target.value })
  }

  alert() {
    return (
      <Alert variant={this.state.success ? 'success' : 'danger'} onClose={() => this.setState({ showAlert: false })} dismissible>
        {this.state.alertMessage}
      </Alert>
    );
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
        <Row className={this.state.showAlert ? 'justify-content-md-center' : 'noDisplay'}>{this.alert()}</Row>
        <Row className="justify-content-md-center">
          <Form.Text className="text-muted">Don't have an account? <button onClick={() => this.props.setView("signup")}>Register Here</button></Form.Text><br></br>
        </Row>
        <Row className="justify-content-md-center">
          <Form id="notcordLogin">
            <Form.Group controlId="formUsername">
              <Form.Control type="text" placeholder="Username" value={this.state.username} onChange={this.handleUserChange}></Form.Control>
            </Form.Group>
            <Form.Group controlId="formPassword">
              <Form.Control type="password" placeholder="Password" value={this.state.password} onChange={this.handlePassChange}></Form.Control>
            </Form.Group>
            <Button varient="primary" onClick={this.handleSubmit} className={ this.state.shouldShowButton ? 'button' : 'noDisplay' }>Login</Button>
            <div className={ this.state.shouldShowButton ? 'noDisplay' : 'rainbow-marker-loader'}></div>
          </Form>
        </Row>
        <Row>
          {/** TODO: Move this to an appropriate location. Make website not the webapp. URL: app.notcord.com, and privacy policy will be at notcord.com/privacy */}
          <a href='http://localhost:3000/privacy.html' rel="noreferrer" target="_blank">Privacy Policy</a></Row>
      </Container>
    );
  }
}
