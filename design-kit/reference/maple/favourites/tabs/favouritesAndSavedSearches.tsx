import * as React from 'react';
import { Tab } from 'strat/modal';
import { isSavedSearchesEnabled } from 'strat/search/savedSearches';

import { SavedSearchesTab } from 'horizontal/savedSearches';
import FavoriteAds from 'horizontal/adManagement/favoriteAds';

import FavouritesAndSavedSearchesTabView from './favouritesAndSavedSearchesTabView';

type Props = {
    activeTab: number;
};

const FavouritesAndSavedSearches = ({ activeTab }: Props) => (
    <FavouritesAndSavedSearchesTabView activeTab={activeTab}>
        <Tab key={'favoriteAds'}>
            <FavoriteAds />
        </Tab>
        {isSavedSearchesEnabled() && (
            <Tab key={'savedSearches'}>
                <SavedSearchesTab />
            </Tab>
        )}
    </FavouritesAndSavedSearchesTabView>
);

export default FavouritesAndSavedSearches;
