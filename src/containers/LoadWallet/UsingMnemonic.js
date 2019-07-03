import React, { Component } from 'react';
import { connect } from 'react-redux';
import { Card, Form, Button, Alert, Spinner } from 'react-bootstrap';
import { withRouter } from 'react-router-dom';

import { esContract } from '../../env';

const bip39 = require('bip39');
const hdkey = require('ethereumjs-wallet/hdkey');
const ethers = require('ethers');

class UsingMnemonic extends Component {

  static getInitialProps(props) {
    return { store: props.store };
  }

  state = {
    keystoreContent: '',
    mnemonic: '',
    unlocking: false,
    hdWallet: {},
    wallets: [],
    mnemonicErrorDisplay: false,
    walletAddress: '',
    success: false,
    addingNewAccountSpinner: false
  };

  onMnemonicUpdate = event => {
    this.setState({ mnemonic: event.target.value });
  }

  onMnemonicSubmit = async event => {
    //document.getElementById('btnsubmit').innerHTML = 'unlocking...';
    event.preventDefault();
    await this.setState({ unlocking: true, mnemonicErrorDisplay: false });
    try {
      const seed = await bip39.mnemonicToSeed(this.state.mnemonic); //Buffer
      const hdWallet = hdkey.fromMasterSeed(seed); // this hd wallet has to be called with .getWallet() to convert in normal
      this.state.hdWallet = hdWallet;
      const privateKeys = [
        hdWallet.derivePath("m/44'/60'/0'/0/0")._hdkey._privateKey,
        hdWallet.derivePath("m/44'/60'/0'/0/1")._hdkey._privateKey,
        hdWallet.derivePath("m/44'/60'/0'/0/2")._hdkey._privateKey
      ];

      const ethersWalletArray = [
        new ethers.Wallet(privateKeys[0], new ethers.providers.InfuraProvider('rinkeby')),
        new ethers.Wallet(privateKeys[1], new ethers.providers.InfuraProvider('rinkeby')),
        new ethers.Wallet(privateKeys[2], new ethers.providers.InfuraProvider('rinkeby'))
      ]

      console.log(ethersWalletArray);

      if(Object.entries(this.props.store.esInstance).length === 0) {
        this.props.dispatch({ type: 'LOAD-ES-INSTANCE', payload: new ethers.Contract(esContract.address, esContract.abi, new ethers.providers.InfuraProvider('rinkeby')) });
      }

      const walletsDetail = [];

      for(let walletInstance of ethersWalletArray) {
        const address = await walletInstance.getAddress();
        const ethBal = Number(await walletInstance.getBalance()) / (10**18);
        const esBal = Number(await this.props.store.esInstance.balanceOf(address)) / (10**18);
        //console.log(address, Number(ethBal), Number(esBal));
        walletsDetail.push({
          walletInstance, address, ethBal, esBal
        });
      }

      this.setState({ wallets: walletsDetail });

      // this.props.dispatch({ type: 'LOAD-WALLET-INSTANCE', payload: wallet });
      await this.setState({ unlocking: false });
      // setTimeout(()=>{
      //   this.props.history.push('/account');
      // }, 1000);

    } catch (e) {
      // handle wrong password
      //console.log(e.message);
      this.setState({ mnemonicErrorDisplay: true, unlocking: false });
    }
  }

  addNewAccount = async() => {
    await this.setState({ addingNewAccountSpinner: true });
    console.log("m/44'/60'/0'/0/"+this.state.wallets.length);
    const newPrivateKey = this.state.hdWallet.derivePath("m/44'/60'/0'/0/"+this.state.wallets.length)._hdkey._privateKey;
    console.log(newPrivateKey);
    const newWalletInstance = new ethers.Wallet(newPrivateKey, new ethers.providers.InfuraProvider('rinkeby'));
    console.log(newWalletInstance.getAddress());
    const newAddress = await newWalletInstance.getAddress();
    const ethBal = Number(await newWalletInstance.getBalance()) / (10**18);
    const esBal = Number(await this.props.store.esInstance.balanceOf(newAddress)) / (10**18);

    this.setState({ wallets: [
        ...this.state.wallets,
        {walletInstance: newWalletInstance, address: newAddress, ethBal, esBal}
      ],
      addingNewAccountSpinner: false
    });
    this.setState({  });
  }

  render() {
    return (
      <div>
        <Card style={{margin: '15px 0'}}>
          <Card.Body align="center">
            <h4>Unlock wallet using Mnemonic</h4>
            <Form onSubmit={this.onMnemonicSubmit} style={{border: '1px solid rgba(0,0,0,.125)', borderRadius: '.25rem', padding: '10px', width: '400px'}}>
              <Form.Group controlId="mnemonic">
                <Form.Control onKeyUp={this.onMnemonicUpdate} type="text" placeholder="Enter your mnemonic" style={{width: '325px'}} />
              </Form.Group>

              {this.state.mnemonicErrorDisplay ?
                <Alert variant="danger">
                  Your entered Mnemonic is invalid.
                </Alert>
              : null}

              {this.state.success ?
                <Alert variant="success">
                  Your account is unlocked. Opening your account page...
                </Alert>
              : null}

              <Button variant="primary" id="mnemonicSubmit" type="submit" disabled={this.state.unlocking}>
                {this.state.unlocking ?
                <Spinner
                  as="span"
                  animation="border"
                  size="sm"
                  role="status"
                  aria-hidden="true"
                  style={{marginRight: '2px'}}
                /> : null}
                { this.state.unlocking ? 'Unlocking wallet' : 'Unlock wallet now!'}
              </Button>
            </Form>
          </Card.Body>
        </Card>


        {this.state.wallets.length ?
        <Card style={{margin: '15px 0'}}>
          <Card.Body align="left">
            <span></span>
            <Card.Title>Select the account you want to use with BetDeEx</Card.Title>
            {this.state.wallets.map(walletDetail => {
              return (
                <Card key={walletDetail.address} style={{margin: '5px 0'}}>
                  <Card.Body>
                    <Card.Title>{walletDetail.address}</Card.Title>
                    <Card.Subtitle className="mb-2 text-muted">{walletDetail.esBal} ES | {walletDetail.ethBal} ETH</Card.Subtitle>
                    <Button onClick={() => {
                      this.props.dispatch({ type: 'LOAD-WALLET-INSTANCE', payload: walletDetail.walletInstance });
                      this.props.history.push(window.redirectHereAfterLoadWallet || '/user');
                      console.log('going to /account');
                    }}>Use this account</Button>
                  </Card.Body>
                </Card>
              );
            })}
            <Button style={{display: 'block', margin:'10px auto 0'}} onClick={this.addNewAccount} disabled={this.state.addingNewAccountSpinner}>
              {this.state.addingNewAccountSpinner ?
              <Spinner
                as="span"
                animation="border"
                size="sm"
                role="status"
                aria-hidden="true"
                style={{marginRight: '2px'}}
              /> : null}
              Add new account
            </Button>
          </Card.Body>
        </Card>
        :null}
      </div>
    );
  }
}

export default connect(state => {return{store: state}})(withRouter(UsingMnemonic));
