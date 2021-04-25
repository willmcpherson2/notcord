import { Component } from 'react';
import {Button, Container, Row, OverlayTrigger, Tooltip} from 'react-bootstrap';
import '../App.css'
import Logo from '../notcord.png'
import CreateNewGroup from './CreateNewGroup';

export default class Sidebar extends Component {
  constructor(props) {
    super(props);
    this.state = {
      groups: []
    }
  }

  componentDidMount() {
    fetch(process.env.REACT_APP_API_URL + '/get_groups_for_user', {method: 'POST', credentials: 'include'})
    .then(res => res.json())
    .then(res => {
      console.log(res)
      this.setState({ groups: [...this.state.groups, ...res] })
    });
  }

  renderGroups(){
    
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
              <Button className="groupButton" variant="info" onClick={() => {this.handleSubmit(val)}}>{letter}</Button>
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

  // TODO: Change this to a modal
  createGroup = () => {
    this.props.setView("createNewGroup");
  }

  render() {  
  return (
      <Container fluid className="sidebar">
          <img src={Logo} alt="Notcord Logo" className="image" onClick={this.dashboard}></img>
          <hr className="hozLine"/>

          {/** TODO: Fix the design of these */}
          {this.renderGroups()}
          <br/> <br/>
          <Button onClick={this.createGroup} variant="light">New</Button>
          <Button onClick={this.settings}>Set</Button>
      </Container>
    );
  }
}