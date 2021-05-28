import { React, Component } from 'react';
import { Button, Container, Row, Modal, Form, Alert } from 'react-bootstrap';
import '../App.css'
export default class Friends extends Component {
  constructor(props) {
    super(props);
    this.state = {
      success: false,
      showAlert: false,
      alertMessage: ''
    }
  }

  async componentDidMount() {

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
      <div>
        <Modal show={this.state.inviteShow} onHide={async () => { await this.setState({ inviteShow: false }); window.location.reload(); }}>
          <Modal.Header closeButton>
            <Modal.Title>Invitations</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <div className={this.state.showAlert ? 'justify-content-md-center' : 'noDisplay'}>{this.alert()}</div>
          </Modal.Body>
        </Modal>

        <div className="navigation">
          <div className="heading">
            

          </div>



          <div className="extras">
            
          </div>

        </div>

        <div className="messageArea">
          <div className="infoBox">
            <div className="info"><p></p></div>
            <div className="callButton">
              
            </div>


          </div>
          <div className="messageBox">
          </div>


        </div>
      </div>
    );
  }
}
