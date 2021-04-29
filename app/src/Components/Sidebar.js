import { Component } from 'react';
import { Button, Container, Row, OverlayTrigger, Tooltip, Modal, Form } from 'react-bootstrap';
import '../App.css'
import Logo from '../notcord.png'

export default class Sidebar extends Component {
  constructor(props) {
    super(props);
    this.state = {
      groups: [],
      show: false,
      name: ''
    }
  }

  componentDidMount() {
    fetch(process.env.REACT_APP_API_URL + '/get_groups_for_user', { method: 'POST', credentials: 'include' })
      .then(res => res.json())
      .then(res => {
        console.log(res)
        this.setState({ groups: [...this.state.groups, ...res] })
      });
  }

  renderGroups() {

    return (
      this.state.groups.map((val, key) => {
        let letter = val.charAt(0);
        const renderTooltip = (props) => (
          <Tooltip id="button-tooltip" {...props}>
            {val}
          </Tooltip>
        );
        return (
          <Row key={key}>
            <OverlayTrigger
              placement="right"
              delay={{ show: 400, hide: 0 }}
              overlay={renderTooltip}
            >
              <Button className="groupButton" variant="info" onClick={() => { this.handleSubmit(val) }}>{letter}</Button>
            </OverlayTrigger>

          </Row>
        )
      })
    )
  }

  handleSubmit = (e) => {
    this.props.group(e)
    this.props.setView("group")
  }

  dashboard = () => {
    this.props.setView("dashboard");
  }
  settings = () => {
    this.props.setView("settings");
  }

  handleNameChange = (e) => {
    this.setState({ name: e.target.value })
  }

  createGroup = () => {
    const { name} = this.state;

      //This will create the group when the backend is set up to do so
      fetch(process.env.REACT_APP_API_URL + '/add_group', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        credentials: 'include',
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
      this.setState({show: false}, () => {
        fetch(process.env.REACT_APP_API_URL + '/get_groups_for_user', { method: 'POST', credentials: 'include' })
      .then(res => res.json())
      .then(res => {
        console.log(res)
        this.setState({ groups: [...res] })
      });})
      
  }

  render() {
    return (
      <Container fluid className="sidebar">
        <img src={Logo} alt="Notcord Logo" className="image" onClick={this.dashboard}></img>
        <hr className="hozLine" />

        {/** // TODO: Fix the design of these */}
        {this.renderGroups()}
        <br /> <br />
        <Button onClick={() => { this.setState({ show: true }) }} variant="light">New</Button>
        <Modal show={this.state.show} onHide={() => { this.setState({ show: false }) }}>
          <Modal.Header closeButton>
            <Modal.Title>Create New Group</Modal.Title>
          </Modal.Header>
          <Modal.Body>

            <Form>
              <Form.Group>
                <Form.Label>Group Name</Form.Label>
                <Form.Control type="text" onChange={this.handleNameChange} />
              </Form.Group>
              <Button onClick={this.createGroup}>Create Group</Button>
            </Form>

          </Modal.Body>
        </Modal>
        <Button onClick={this.settings}>Set</Button>
      </Container>
    );
  }
}