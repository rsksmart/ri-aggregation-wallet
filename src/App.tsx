import React, { useEffect, useCallback, useState } from 'react';

import Footer from 'components/Footer/Footer';
import Header from 'components/Header/Header';
import Modal from 'components/Modal/Modal';

import { useRootData } from 'hooks/useRootData';
import useWalletInit from 'hooks/useWalletInit';

import { IAppProps } from 'types/Common';

import { RIGHT_NETWORK_ID, RIGHT_NETWORK_NAME } from 'constants/networks';
import { useWSHeartBeat } from 'hooks/useWSHeartbeat';
import { useLogout } from 'hooks/useLogout';
import { WalletType } from './constants/Wallets';
import { useCancelable } from './hooks/useCancelable';

const App: React.FC<IAppProps> = ({ children }): JSX.Element => {
  const {
    error,
    isAccessModalOpen,
    provider,
    setAccessModal,
    setError,
    setWalletName,
    walletName,
    zkWallet,
    setZkWallet,
    setHintModal,
  } = useRootData(
    ({ error, isAccessModalOpen, provider, walletName, zkWallet, ...s }) => ({
      ...s,
      error: error.get(),
      isAccessModalOpen: isAccessModalOpen.get(),
      provider: provider.get(),
      walletName: walletName.get(),
      zkWallet: zkWallet.get(),
    }),
  );

  useWSHeartBeat();
  const { createWallet } = useWalletInit();
  const providerNetwork = provider?.networkVersion;

  const cancelable = useCancelable();

  useEffect(() => {
    if (
      (walletName === 'Metamask' &&
        provider?.selectedAddress &&
        !zkWallet &&
        providerNetwork === RIGHT_NETWORK_ID) ||
      (!zkWallet && walletName && walletName !== 'Metamask')
    ) {
      cancelable(createWallet());
      setHintModal('');
    }
  }, [
    cancelable,
    createWallet,
    provider,
    setHintModal,
    walletName,
    zkWallet,
    providerNetwork,
  ]);

  useEffect(() => {
    if (provider && walletName && walletName === 'Metamask') {
      window['ethereum'].autoRefreshOnNetworkChange = false;

      const listener = () => {
        if (
          provider.networkVersion !== RIGHT_NETWORK_ID &&
          walletName === 'Metamask'
        ) {
          setError(`Wrong network, please switch to the ${RIGHT_NETWORK_NAME}`);
        } else {
          setError('');
        }
      };

      provider.on('networkChanged', listener);
      return () => provider.off('networkChanged', listener);
    }
  }, [createWallet, provider, setError, walletName, zkWallet, cancelable]);

  const logout = useLogout();

  useEffect(() => {
    if (!!zkWallet) {
      setAccessModal(false);
    }
    if (!provider || walletName.toLowerCase() !== 'metamask') return;
    provider.on('accountsChanged', () => {
      if (
        zkWallet &&
        provider &&
        zkWallet?.address().toLowerCase() !==
          provider.selectedAddress.toLowerCase()
      ) {
        sessionStorage.setItem('walletName', walletName);
        const savedWalletName = sessionStorage.getItem(
          'walletName',
        ) as WalletType;
        if (savedWalletName) {
          setWalletName(savedWalletName);
        }
        setZkWallet(null);
        setAccessModal(true);
      }
    });
  }, [
    logout,
    provider,
    setAccessModal,
    setWalletName,
    walletName,
    setZkWallet,
    zkWallet,
  ]);

  return (
    <div className={`content-wrapper ${walletName ? '' : 'start-page'}`}>
      <Modal
        cancelAction={() => setError('')}
        visible={!!error}
        classSpecifier='error'
        background={true}
        centered
      >
        <p>{error}</p>
      </Modal>
      <Modal
        cancelAction={() => setAccessModal(false)}
        visible={
          isAccessModalOpen &&
          window.location.pathname.length > 1 &&
          provider &&
          provider.networkVersion === RIGHT_NETWORK_ID
        }
        classSpecifier='acc'
        background={true}
        centered
      >
        <p>{'Please make sign in the pop up'}</p>
      </Modal>
      {walletName && <Header />}
      <div className='content'>{children}</div>
      <Footer />
    </div>
  );
};

export default App;
