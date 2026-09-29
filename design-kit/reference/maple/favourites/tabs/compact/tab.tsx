import React from 'react';

import styles from './styles/tab.cssm';

type Props = {
    children: React.ReactNode;
};

const Tab = ({ children }: Props) => {
    return <div className={styles.tab}>{children}</div>;
};

export default Tab;
