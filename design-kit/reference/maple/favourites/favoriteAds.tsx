import * as React from 'react';
import classNames from 'classnames';
import { Trans } from '@lingui/macro';
import { useSelector, useDispatch } from 'react-redux';
import { ViewSections } from 'strat/gtm';
import { Flex, Text } from 'strat/components';
import { selectIsMobileLayout } from 'strat/layout/selectors';

import settings from '@app/branding/settings';
import SearchHitsLayout from '@app/branding/searchHitsLayout';
import { fetchFavoriteAds } from '@app/favorites';

import { selectIsLoading, useFetchFavoritesFromSearchIndex } from 'horizontal/favorites';
import { HitList } from 'horizontal/search/results';
import type { AppDispatch } from 'horizontal/state';

import styles from './styles/favoriteAds.cssm';

const FavoriteAds = () => {
    const { favorites, loaded } = useFetchFavoritesFromSearchIndex();
    const loadingFavorites = useSelector(selectIsLoading);
    const dispatch = useDispatch<AppDispatch>();
    const isMobile = useSelector(selectIsMobileLayout);

    const emptyResults = favorites.length === 0 && loaded;
    const viewType = isMobile ? settings.favouriteAdsLayoutMobile : SearchHitsLayout.GRID;

    React.useEffect(() => {
        dispatch(fetchFavoriteAds());
    }, [dispatch]);

    if (emptyResults && !loadingFavorites) {
        return (
            <Flex column justifyCenter alignCenter>
                <Text.Large bold>
                    <Trans>No favorites yet.</Trans>
                </Text.Large>
            </Flex>
        );
    }

    return (
        <Flex
            column
            className={classNames(styles.container, {
                [styles.withMobileTopPadding]: viewType === SearchHitsLayout.LIST,
            })}
            fillContainer
        >
            <HitList
                // @ts-expect-error - TS4104 - The type 'readonly never[]' is 'readonly' and cannot be assigned to the mutable type 'LiteAd[]'.
                hits={favorites}
                viewType={viewType}
                loading={!loaded || loadingFavorites}
                loadingHitsCount={20}
                maxHitsPerLine={4}
                viewSection={ViewSections.USER_DETAIL}
            />
        </Flex>
    );
};

export default FavoriteAds;
