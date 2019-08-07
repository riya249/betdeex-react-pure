import React from 'react';
import { BrowserRouter, Route, Switch } from 'react-router-dom';
import { connect } from 'react-redux'; // this is for accessing the store\
import { Row, Col } from 'react-bootstrap';

import Navbar from './containers/Navbar/Navbar';
import Sidebar from './containers/Sidebar/Sidebar';
import CreateWallet from './containers/CreateWallet/CreateWallet';
import LoadWallet from './containers/LoadWallet/LoadWallet';
import User from './containers/User/User';
import Logout from './containers/User/Logout';
import BetsList from './containers/BetsList/BetsList';
import BetView from './containers/BetView/BetView';

import provider from './ethereum/provider';
import betdeexInstance from './ethereum/betdeexInstance';

import './App.css';
import { esContract, betdeex, categoryArray, subCategoryArray } from './env.js';

const ethers = require('ethers');


function App(props) {

  //for dev purpose 24C4FE6063E62710EAD956611B71825B778B041B18ED53118CE5DA5F02E494BA
  setTimeout(() => {
    if(Object.entries(props.store.walletInstance).length === 0) {
      //console.log(provider, new ethers.providers.InfuraProvider('kovan'));
      props.dispatch({ type: 'LOAD-WALLET-INSTANCE', payload: new ethers.Wallet('0x24C4FE6063E62710EAD956611B71825B778B041B18ED53118CE5DA5F02E494BA', provider) });
    }
  },0);

  // if redux store is empty then try to copy the local storage if there is any data.
  if(Object.entries(props.store.betsMapping).length === 0) {
    const storedBetsMapping = JSON.parse(localStorage.getItem('betdeex-betsMapping') || '{}');
    if(Object.entries(storedBetsMapping).length > 0) {
      props.dispatch({ type: 'LOAD-BETS-MAPPING-FROM-LOCALSTORAGE', payload: storedBetsMapping });
    }
  }

  // load es instance
  if(Object.entries(props.store.esInstance).length === 0) {
    console.log(provider, new ethers.providers.InfuraProvider('rinkeby'));
    props.dispatch({ type: 'LOAD-ES-INSTANCE', payload: new ethers.Contract(esContract.address, esContract.abi, provider) });
  }

  // load betdeex instance
  if(Object.entries(props.store.esInstance).length === 0) {
    props.dispatch({ type: 'LOAD-BETDEEX-INSTANCE', payload: new ethers.Contract(betdeex.address, betdeex.abi, provider) });
  }

  return (
    <BrowserRouter>
      <div className="App">
        <Navbar />
        <Row>
          <Col style={{margin: '15px 0 0 15px'}}>
            <Sidebar />
          </Col>
          <Col xs="9" style={{margin: '15px 15px 0 0', paddingLeft: '0'}}>
            <Switch>
              <Route path="/" exact component={BetsList} />
              <Route path="/create-wallet" exact component={CreateWallet} />
              <Route path="/load-wallet" component={LoadWallet} />
              <Route path="/user" exact component={User} />
              <Route path="/logout" exact component={Logout} />
              <Route path="/bet/:address" exact component={BetView} />
              <Route path="/:category" exact render={props => {
                let categoryWordArray = [];
                for(const categoryWord of props.match.params.category.split('-')) {
                  categoryWordArray.push(categoryWord.charAt(0).toUpperCase() + categoryWord.slice(1));
                }
                const categoryId = categoryArray.indexOf(categoryWordArray.join(' '));

                return <BetsList categoryId={categoryId} />;
              }} />
              <Route path="/:category/:subCategory" exact render={props => {
                let categoryWordArray = [];
                for(const categoryWord of props.match.params.category.split('-')) {
                  categoryWordArray.push(categoryWord.charAt(0).toUpperCase() + categoryWord.slice(1));
                }
                const categoryId = categoryArray.indexOf(categoryWordArray.join(' '));

                let subCategoryWordArray = [];
                for(const subCategoryWord of props.match.params.subCategory.split('-')) {
                  subCategoryWordArray.push(subCategoryWord.charAt(0).toUpperCase() + subCategoryWord.slice(1))
                }
                const subCategoryId = subCategoryArray[categoryId].indexOf(subCategoryWordArray.join(' '));
                return <BetsList categoryId={categoryId} subCategoryId={subCategoryId} />;
              }} />
            </Switch>
          </Col>
        </Row>
      </div>
    </BrowserRouter>
  );
}

export default connect(state => {return{store: state}})(App); // this is for accessing the store
//export default App;
