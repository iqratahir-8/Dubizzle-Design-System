import * as React from 'react';
import classNames from 'classnames';
// @ts-expect-error - TS7016 - Could not find a declaration file for module 'react-swipeable-views'. 'node_modules/react-swipeable-views/lib/index.js' implicitly has an 'any' type.
import SwipeableViews from 'react-swipeable-views';
import { TabSwitcher } from 'strat/generic';
import { Flex } from 'strat/components';
import { useSelector } from 'react-redux';
import { selectIsLanguageRTL } from 'strat/i18n/language';
import { isSavedSearchesEnabled } from 'strat/search/savedSearches';

import FavoriteAds from 'horizontal/adManagement/favoriteAds';
import { SavedSearchesTab } from 'horizontal/savedSearches';

import styles from '../styles/favouritesAndSavedSearchesTabView.cssm';
import useGetTabs from '../useGetTabs';
import TabLink from '../tabLink';

import Tab from './tab';

type Props = {
    activeTab: number;
};

const FavouritesAndSavedSearches = ({ activeTab }: Props) => {
    const [selectedTabIndex, setSelectedTabIndex] = React.useState(activeTab);

    const tabs = useGetTabs();

    const onTabChange = (index: number) => {
        setSelectedTabIndex(index);
    };

    const shouldShowSavedSearches = isSavedSearchesEnabled();

    const swipeableViews = [
        <Tab>
            <FavoriteAds />
        </Tab>,
    ];
    if (shouldShowSavedSearches) {
        swipeableViews.push(
            <Tab>
                <SavedSearchesTab />
            </Tab>,
        );
    }

    const reversed = useSelector(selectIsLanguageRTL);

    return (
        <Flex column stretchHeight>
            <Flex>
                <TabSwitcher
                    activeTabIndex={selectedTabIndex}
                    tabs={tabs}
                    setActiveTabIndex={onTabChange}
                    renderTabComponent={TabLink}
                    className={classNames({
                        [styles.tab]: shouldShowSavedSearches,
                    })}
                />
            </Flex>
            <SwipeableViews
                style={{ height: '100%' }}
                containerStyle={{ height: '100%' }}
                index={selectedTabIndex}
                onChangeIndex={onTabChange}
                axis={reversed ? 'x-reverse' : 'x'}
            >
                {swipeableViews}
            </SwipeableViews>
        </Flex>
    );
};

export default FavouritesAndSavedSearches;
