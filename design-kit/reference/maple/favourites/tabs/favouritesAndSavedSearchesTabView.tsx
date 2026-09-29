import * as React from 'react';
import classNames from 'classnames';
import { TabSwitcher } from 'strat/generic';
import { TabView } from 'strat/modal';
import EMPTY_FUNCTION from 'strat/empty/function';
import { Flex } from 'strat/components';
import { isSavedSearchesEnabled } from 'strat/search/savedSearches';

import TabLink from './tabLink';
import useGetTabs from './useGetTabs';
import styles from './styles/favouritesAndSavedSearchesTabView.cssm';

type Props = {
    children: Array<React.ReactNode>;
    activeTab: number;
};

const FavouritesAndSavedSearchesTabView = ({ children, activeTab }: Props) => {
    const tabs = useGetTabs();

    const tabSwitcher = React.useCallback(
        ({ openedTab }) => (
            <Flex>
                <TabSwitcher
                    activeTabIndex={openedTab}
                    tabs={tabs}
                    setActiveTabIndex={EMPTY_FUNCTION}
                    renderTabComponent={TabLink}
                    className={classNames({
                        [styles.tab]: isSavedSearchesEnabled(),
                    })}
                />
            </Flex>
        ),
        [tabs],
    );

    return (
        <Flex columnReverse>
            <TabView renderSwitcher={tabSwitcher} defaultTab={activeTab}>
                {children}
            </TabView>
        </Flex>
    );
};

export default FavouritesAndSavedSearchesTabView;
