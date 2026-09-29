import { t } from '@lingui/macro';
import React from 'react';
import { useI18n } from 'strat/i18n/language';
import RouteNames from 'strat/routes/routeNames';
import { isSavedSearchesEnabled } from 'strat/search/savedSearches';

const useGetTabs = () => {
    const i18n = useI18n();

    return React.useMemo(
        () => [
            {
                name: t(i18n)`Favourites`,
                route: RouteNames.FAVORITES,
                hard: false,
            },
            ...(isSavedSearchesEnabled()
                ? [
                      {
                          name: t(i18n)`Saved searches`,
                          route: RouteNames.SAVED_SEARCHES,
                          hard: false,
                      },
                  ]
                : []),
        ],
        [i18n],
    );
};

export default useGetTabs;
